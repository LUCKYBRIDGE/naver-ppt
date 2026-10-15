import { afterEach, describe, expect, it, vi } from 'vitest';
import { releasePptxDuplicateImageParts, releasePptxDuplicateMediaParts } from '../../src/adapters/pptx/duplicateImageParts';
afterEach(() => vi.restoreAllMocks());
const signal = () => new AbortController().signal;
describe('owned raster byte equality before raw release', () => {
  it('consumes only validated private raw bytes and keeps Blob evidence after detachment', async () => {
    const raw = new Uint8Array([1, 2, 3]), mismatch = new Uint8Array([3, 2, 1]), blob = new Blob([raw], { type: 'image/png' });
    const files = { 'ppt/media/a.png': raw, 'ppt/media/b.png': mismatch };
    const result = await releasePptxDuplicateImageParts(files, new Map([['blob:a', blob]]), signal(), true);
    expect(raw.byteLength).toBe(0); expect(mismatch).toEqual(new Uint8Array([3, 2, 1]));
    expect(result.get('ppt/media/a.png')?.size).toBe(3); expect(result.get('ppt/media/a.png')?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it.each([['mp3', 'audio/mpeg'], ['wav', 'audio/wav'], ['mp4', 'video/mp4'], ['webm', 'video/webm']])('retains source hash evidence for exact owned %s bytes', async (extension, mime) => {
    const bytes = new Uint8Array([1, 2, 3]), part = `ppt/media/a.${extension}`, files = { [part]: bytes, 'ppt/slides/a.xml': bytes };
    const result = await releasePptxDuplicateMediaParts(files, new Map([['blob:media', new Blob([bytes], { type: mime })]]), signal());
    expect(result.get(part)).toMatchObject({ size: 3, fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
    expect(files[part]).toBeUndefined(); expect(files['ppt/slides/a.xml']).toBe(bytes);
  });
  it('releases exact owned raster duplicates and preserves XML/fonts/media/unknown parts', async () => {
    const bytes = new Uint8Array([1, 2, 3]), files = { 'ppt/media/a.png': bytes, 'ppt/media/unknown.png': new Uint8Array([9, 8, 7]), 'ppt/slides/a.xml': bytes, 'ppt/fonts/a.fntdata': bytes, 'ppt/media/a.mp3': bytes, 'ppt/media/a.emf': bytes };
    const owned = new Map([['blob:owned', new Blob([bytes], { type: 'image/png' })]]);
    const result = await releasePptxDuplicateImageParts(files, owned, signal());
    expect(result.get('ppt/media/a.png')?.size).toBe(3); expect(result.get('ppt/media/a.png')?.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(files).not.toHaveProperty('ppt/media/a.png'); expect(files['ppt/slides/a.xml']).toBe(bytes); expect(files['ppt/fonts/a.fntdata']).toBe(bytes);
    expect(files['ppt/media/unknown.png']).toEqual(new Uint8Array([9, 8, 7]));
    expect(files['ppt/media/a.mp3']).toBe(bytes); expect(files['ppt/media/a.emf']).toBe(bytes); expect(bytes).toEqual(new Uint8Array([1, 2, 3]));
  });
  it('does not release matching-size different bytes or MIME', async () => {
    const bytes = new Uint8Array([1, 2, 3]), files = { 'ppt/media/a.png': bytes };
    for (const blob of [new Blob([new Uint8Array([3, 2, 1])], { type: 'image/png' }), new Blob([bytes], { type: 'image/jpeg' })]) {
      expect((await releasePptxDuplicateImageParts(files, new Map([['blob:a', blob]]), signal())).size).toBe(0); expect(files['ppt/media/a.png']).toBe(bytes);
    }
  });
  it('retains the raw bytes when cancelled, read fails or ownership disappears', async () => {
    for (const mode of ['cancel', 'fail', 'unowned'] as const) {
      const bytes = new Uint8Array([1, 2, 3]), files = { 'ppt/media/a.png': bytes }, controller = new AbortController();
      const blob = new Blob([bytes], { type: 'image/png' }), owned = new Map([['blob:a', blob]]), read = blob.stream.bind(blob);
      vi.spyOn(blob, 'stream').mockImplementation(() => {
        if (mode === 'fail') throw Error('Synthetic read failure');
        if (mode === 'cancel') controller.abort(); else owned.clear(); return read();
      });
      const result = releasePptxDuplicateImageParts(files, owned, controller.signal);
      if (mode === 'unowned') expect((await result).size).toBe(0); else await expect(result).rejects.toThrow();
      expect(files['ppt/media/a.png']).toBe(bytes);
    }
  });
  it('compares multiple chunks without whole-Blob allocation and cancels a pending read', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]), blob = new Blob([bytes], { type: 'image/png' }), whole = vi.spyOn(blob, 'arrayBuffer');
    vi.spyOn(blob, 'stream').mockImplementationOnce(() => new ReadableStream({ start(controller) { controller.enqueue(bytes.subarray(0, 2)); controller.enqueue(bytes.subarray(2)); controller.close(); } }));
    const files = { 'ppt/media/a.png': bytes };
    expect((await releasePptxDuplicateImageParts(files, new Map([['blob:a', blob]]), signal())).size).toBe(1); expect(whole).not.toHaveBeenCalled();
    const controller = new AbortController(), cancel = vi.fn();
    vi.spyOn(blob, 'stream').mockImplementationOnce(() => new ReadableStream({ cancel }));
    const pendingFiles = { 'ppt/media/a.png': bytes }, pending = releasePptxDuplicateImageParts(pendingFiles, new Map([['blob:a', blob]]), controller.signal);
    await vi.waitFor(() => expect(blob.stream).toHaveBeenCalledTimes(2)); controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); expect(cancel).toHaveBeenCalledOnce(); expect(pendingFiles['ppt/media/a.png']).toBe(bytes);
  });
});
