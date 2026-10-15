import type { Presentation } from '@web-ppt/core';
import { describe, expect, it, vi } from 'vitest';
import { preparePptxEmbeddedMedia, PPTX_MAX_MEDIA_REFERENCES } from '../../src/adapters/pptx/embeddedMedia';
import type { PresentationDocumentState } from '../../src/core/types';
import { MEDIA_MAX_BYTES } from '../../src/media/validation';

const fingerprint = 'a'.repeat(64), url = 'blob:owned-media';
const wav = () => { const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8); return new Blob([bytes], { type: 'audio/wav' }); };
const image = (src = url, extra = {}) => ({ kind: 'image', src: '', media: { kind: 'audio', mime: 'audio/wav', src, ...extra } });
function fixture(elements: unknown[] = [image()]) {
  const document: PresentationDocumentState = { id: 'D', source: { type: 'pptx', name: 'Synthetic.pptx', size: 200, lastModified: 1, fingerprint },
    knownSlideCount: 2, slideIds: ['registered-first', 'registered-second'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
  const source = { model: { source: 'pptx', width: 960, height: 540, slides: [{ elements: [] }, { elements }] } as unknown as Presentation,
    fingerprint, parts: ['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'], ownedUrls: new Set([url]), ownedBlobs: new Map([[url, wav()]]) };
  return { document, source, signal: new AbortController().signal };
}
describe('PPTX embedded media preparation', () => {
  it('reuses only the exact owned Blob identity across calls and rechecks ownership', async () => {
    const f = fixture(), read = vi.spyOn(File.prototype, 'arrayBuffer');
    const first = await preparePptxEmbeddedMedia(f.document, f.source, f.signal), second = await preparePptxEmbeddedMedia(f.document, f.source, f.signal);
    expect(second[0]!.file).toBe(first[0]!.file); expect(read).toHaveBeenCalledOnce();
    first[0]!.input.fingerprint = 'caller mutation';
    const third = await preparePptxEmbeddedMedia(f.document, f.source, f.signal); expect(third[0]!.input.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    f.source.ownedBlobs.set(url, wav()); await preparePptxEmbeddedMedia(f.document, f.source, f.signal); expect(read).toHaveBeenCalledTimes(2);
    f.source.ownedUrls.clear(); await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow(); read.mockRestore();
  });
  it('does not let one cancelled shared read cancel another consumer', async () => {
    const f = fixture(), cancelled = new AbortController(), read = vi.spyOn(File.prototype, 'arrayBuffer').mockImplementation(async () => {
      cancelled.abort(); return wav().arrayBuffer();
    });
    try {
      const first = preparePptxEmbeddedMedia(f.document, f.source, cancelled.signal), second = preparePptxEmbeddedMedia(f.document, f.source, f.signal);
      await expect(first).rejects.toMatchObject({ name: 'AbortError' }); expect(await second).toHaveLength(1); expect(read).toHaveBeenCalledOnce();
    } finally { read.mockRestore(); }
  });
  it('retries a failed identity read instead of retaining a rejected promise', async () => {
    const f = fixture(), read = vi.spyOn(File.prototype, 'arrayBuffer').mockRejectedValueOnce(Error('Synthetic read failure'));
    try {
      await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('read failure');
      expect(await preparePptxEmbeddedMedia(f.document, f.source, f.signal)).toHaveLength(1); expect(read).toHaveBeenCalledTimes(2);
    } finally { read.mockRestore(); }
  });
  it('binds registered IDs and manifest parts, validates bytes/hash and preserves source state', async () => {
    const f = fixture(), before = structuredClone(f.document), fetch = vi.spyOn(globalThis, 'fetch');
    try {
      const [media] = await preparePptxEmbeddedMedia(f.document, f.source, f.signal);
      expect(media).toMatchObject({ slideId: 'registered-second', sourcePart: 'ppt/slides/slide1.xml', elementPath: [0], input: { kind: 'audio', mime: 'audio/wav', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) } });
      expect(media!.file.size).toBe(44); expect(media!.file.lastModified).toBe(0); expect(f.document).toEqual(before); expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
  it('keeps separate nested occurrences but shares a single verified File for identical Blob bytes', async () => {
    const f = fixture([{ kind: 'group', children: [image(), { kind: 'group', children: [image()] }] }, image()]);
    const media = await preparePptxEmbeddedMedia(f.document, f.source, f.signal);
    expect(media.map(item => item.elementPath)).toEqual([[0, 0], [0, 1, 0], [1]]);
    expect(media[0]!.file).toBe(media[2]!.file); expect(media[0]!.input).toBe(media[1]!.input);
  });
  it('returns no assets for a valid media-free source', async () => {
    const f = fixture([]); expect(await preparePptxEmbeddedMedia(f.document, f.source, f.signal)).toEqual([]);
  });
  it('prepares only a requested registered slide without touching external media on another slide', async () => {
    const f = fixture(); f.source.model.slides[0]!.elements = [image('https://example.invalid', { external: true })] as unknown as Presentation['slides'][number]['elements'];
    expect((await preparePptxEmbeddedMedia(f.document, f.source, f.signal, 'registered-second')).length).toBe(1);
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal, 'missing')).rejects.toThrow('PPTX_MODEL_BINDING_MISMATCH');
  });
  it.each([
    ['https://example.invalid/audio.wav', { external: true }, 'PPTX_EXTERNAL_MEDIA'],
    ['blob:other', {}, 'PPTX_UNOWNED_MEDIA'],
    [url, { kind: 'video' }, 'PPTX_MEDIA_KIND_MISMATCH'],
  ])('rejects invalid reference %s before returning any batch', async (src, extra, error) => {
    const f = fixture([image(), image(src, extra)]);
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow(error);
  });
  it.each(['missing', 'empty', 'mime', 'oversize'])('rejects %s owned asset', async issue => {
    const f = fixture();
    if (issue === 'missing') f.source.ownedBlobs.clear();
    if (issue === 'empty') f.source.ownedBlobs.set(url, new Blob([], { type: 'audio/wav' }));
    if (issue === 'mime') f.source.ownedBlobs.set(url, new Blob(['RIFF'], { type: 'video/mp4' }));
    if (issue === 'oversize') { const blob = wav(); Object.defineProperty(blob, 'size', { value: MEDIA_MAX_BYTES + 1 }); f.source.ownedBlobs.set(url, blob); }
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('PPTX_INVALID_MEDIA_ASSET');
  });
  it('rejects renamed binary data despite owned URL and matching MIME', async () => {
    const f = fixture(); f.source.ownedBlobs.set(url, new Blob(['not a WAV'], { type: 'audio/wav' }));
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('미디어 파일 내용');
  });
  it('checks reference and aggregate byte limits before reading large binary data', async () => {
    const many = fixture(Array.from({ length: PPTX_MAX_MEDIA_REFERENCES + 1 }, () => image()));
    await expect(preparePptxEmbeddedMedia(many.document, many.source, many.signal)).rejects.toThrow('PPTX_MEDIA_COUNT_LIMIT');
    const f = fixture([image(), image('blob:second')]), a = wav(), b = wav();
    Object.defineProperty(a, 'size', { value: MEDIA_MAX_BYTES });
    f.source.ownedBlobs.set(url, a); f.source.ownedBlobs.set('blob:second', b); f.source.ownedUrls.add('blob:second');
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('PPTX_MEDIA_BYTES_LIMIT');
  });
  it('rejects different originals and cyclic or overly deep models', async () => {
    const f = fixture(); f.source.fingerprint = 'b'.repeat(64);
    await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('PPTX_MODEL_BINDING_MISMATCH');
    const group: { kind: string; children: unknown[] } = { kind: 'group', children: [] }; group.children.push(group);
    const cyclic = fixture([group]);
    await expect(preparePptxEmbeddedMedia(cyclic.document, cyclic.source, cyclic.signal)).rejects.toThrow('PPTX_INVALID_INSPECTION_MODEL');
  });
  it('cancels before preparation and after an in-flight read without yielding partial results', async () => {
    const f = fixture(), controller = new AbortController(); controller.abort();
    await expect(preparePptxEmbeddedMedia(f.document, f.source, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    const next = new AbortController(), read = vi.spyOn(File.prototype, 'arrayBuffer').mockImplementation(async () => { next.abort(); return wav().arrayBuffer(); });
    try { await expect(preparePptxEmbeddedMedia(f.document, f.source, next.signal)).rejects.toMatchObject({ name: 'AbortError' }); }
    finally { read.mockRestore(); }
  });
  it('rejects assets disposed during a read', async () => {
    const f = fixture(), read = vi.spyOn(File.prototype, 'arrayBuffer').mockImplementation(async () => { f.source.ownedUrls.clear(); f.source.ownedBlobs.clear(); return wav().arrayBuffer(); });
    try { await expect(preparePptxEmbeddedMedia(f.document, f.source, f.signal)).rejects.toThrow('PPTX_UNOWNED_MEDIA'); }
    finally { read.mockRestore(); }
  });
});
