import type { Presentation } from '@web-ppt/core';
import type { PresentationDocumentState } from '../../src/core/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { preparePptxEmbeddedMedia } from '../../src/adapters/pptx/embeddedMedia';
import { bindPptxMediaTimingTargets } from '../../src/adapters/pptx/mediaTimingBinding';
vi.mock('../../src/adapters/pptx/embeddedMedia', () => ({ preparePptxEmbeddedMedia: vi.fn() }));
const p = 'http://schemas.openxmlformats.org/presentationml/2006/main', a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
const fingerprint = 'a'.repeat(64), src = 'blob:owned';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = [], ns = p): Element {
  const value = { localName: name, namespaceURI: ns, children, attributes: Object.keys(attrs), parentElement: null,
    getAttribute: (key: string) => attrs[key] ?? null, getAttributeNS: (_: string, key: string) => attrs[key] ?? null,
    hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
const doc = (root: Element) => ({ documentElement: root, getElementsByTagName: () => [],
  getElementsByTagNameNS: (ns: string, tag: string) => root.getElementsByTagNameNS(ns, tag) }) as unknown as Document;
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); vi.mocked(preparePptxEmbeddedMedia).mockReset(); });
async function fixture() {
  const bytes = new Uint8Array(44), blob = new Blob([bytes], { type: 'video/mp4' }), file = new File([blob], 'Synthetic.mp4');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const mediaFile = node('videoFile', { link: 'r1' }, [], a), nvPr = node('nvPr', {}, [mediaFile]);
  const pic = node('pic', {}, [node('nvPicPr', {}, [node('cNvPr', { id: '17' }), nvPr])]);
  const target = () => node('tgtEl', {}, [node('spTgt', { spid: '17' })]);
  const timing = node('timing', {}, [node('video', {}, [node('cMediaNode', {}, [node('cTn', { id: '1' }), target()])]),
    node('cmd', { type: 'call', cmd: 'pause' }, [node('cBhvr', {}, [node('cTn', { id: '2' }), target()])])]);
  const xml = doc(node('sld', {}, [node('cSld', {}, [node('spTree', {}, [pic])]), timing]));
  const relationAttrs = { Id: 'r1', Type: r + '/video', Target: '../media/movie.mp4' };
  const relationship = node('Relationship', relationAttrs, [], pkg), rels = doc(node('Relationships', {}, [relationship], pkg));
  vi.stubGlobal('DOMParser', class { parseFromString(text: string) { return text === 'REL' ? rels : xml; } });
  const element = { kind: 'image', id: 17, media: { kind: 'video', src, mime: 'video/mp4' } };
  const group = { kind: 'group', id: 90, children: [element] };
  const document: PresentationDocumentState = { id: 'D', source: { type: 'pptx', name: 'Synthetic.pptx', size: 1, lastModified: 0, fingerprint },
    knownSlideCount: 2, slideIds: ['first', 'second'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
  const source = { model: { source: 'pptx', slides: [{ elements: [] }, { elements: [group] }] } as unknown as Presentation,
    fingerprint, parts: ['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'],
    files: { 'ppt/slides/slide1.xml': new TextEncoder().encode('SLIDE'), 'ppt/slides/_rels/slide1.xml.rels': new TextEncoder().encode('REL'), 'ppt/media/movie.mp4': bytes },
    ownedUrls: new Set([src]), ownedBlobs: new Map([[src, blob]]) };
  const prepared = { slideId: 'second', sourcePart: source.parts[1]!, sourceFingerprint: fingerprint, elementPath: [0, 0], file,
    input: { kind: 'video', mime: 'video/mp4', fingerprint: hash } } as Awaited<ReturnType<typeof preparePptxEmbeddedMedia>>[number];
  vi.mocked(preparePptxEmbeddedMedia).mockResolvedValue([prepared]);
  return { document, source, element, group, prepared, relationAttrs, nvPr, mediaFile, timing, hash, signal: new AbortController().signal };
}
describe('source media timing to registered model and package bytes', () => {
  it('checks source-captured byte evidence after releasing a large part buffer', async () => {
    const f = await fixture(), part = 'ppt/media/movie.mp4', size = f.source.files[part]!.length;
    delete (f.source.files as Record<string, Uint8Array>)[part];
    const source = { ...f.source, largeMediaParts: new Map([[part, { size, fingerprint: f.hash }]]) };
    expect(await bindPptxMediaTimingTargets(f.document, source, 'second', f.signal)).toHaveLength(2);
    source.largeMediaParts.set(part, { size, fingerprint: 'f'.repeat(64) });
    await expect(bindPptxMediaTimingTargets(f.document, source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('binds reordered slide parts and nested shape paths, hashes the actual relationship target, and copies no command text', async () => {
    const f = await fixture(), before = structuredClone(f.document), fetch = vi.spyOn(globalThis, 'fetch');
    const result = await bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal);
    expect(result).toEqual([1, 2].map((timingId, index) => ({ node: index ? 'cmd' : 'video', shapeId: 17, timingId, slideId: 'second',
      sourcePart: 'ppt/slides/slide1.xml', sourceFingerprint: fingerprint, elementPath: [0, 0], kind: 'video', mediaFingerprint: f.hash })));
    expect(JSON.stringify(result)).not.toContain('pause'); expect(f.document).toEqual(before); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['missing', 'duplicate', 'kind', 'not-media'])('rejects %s model targets', async boundary => {
    const f = await fixture();
    if (boundary === 'missing') f.element.id = 99;
    if (boundary === 'duplicate') f.group.id = 17;
    if (boundary === 'kind') f.element.media.kind = 'audio';
    if (boundary === 'not-media') Object.assign(f.element, { kind: 'shape', media: undefined });
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('rejects prepared media whose path no longer corresponds to the model target', async () => {
    const f = await fixture(); f.prepared.elementPath = [0];
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('rejects equal-length but different package bytes', async () => {
    const f = await fixture(); f.source.files['ppt/media/movie.mp4']![2] = 1;
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it.each(['external', 'wrong-type', 'missing-part'])('rejects %s source relationships without fetching', async boundary => {
    const f = await fixture();
    if (boundary === 'external') Object.assign(f.relationAttrs, { TargetMode: 'External' });
    if (boundary === 'wrong-type') f.relationAttrs.Type = r + '/audio';
    if (boundary === 'missing-part') f.relationAttrs.Target = '../media/missing.mp4';
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('rejects missing original picture media metadata despite matching model IDs', async () => {
    const f = await fixture(); f.nvPr.children[0]!.getAttributeNS = () => null;
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('rejects duplicate timing IDs instead of binding a partial subset', async () => {
    const f = await fixture(); const duplicate = node('cTn', { id: '1' }); Object.assign(f.timing, { children: [...f.timing.children, duplicate] });
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it('requires the p14 embedded relationship to resolve to the same bytes as the drawing media link', async () => {
    const f = await fixture();
    const ext = node('media', { embed: 'r1' }, [], 'http://schemas.microsoft.com/office/powerpoint/2010/main');
    (f.nvPr.children as unknown as Element[]).push(ext);
    // The primary video relationship cannot masquerade as a p14 media relationship.
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
  it.each(['missing', 'dtd', 'oversize'])('rejects %s XML before trusting renderer targets', async boundary => {
    const f = await fixture();
    f.source.files['ppt/slides/slide1.xml'] = boundary === 'missing' ? new Uint8Array() : boundary === 'oversize'
      ? new Uint8Array(4 * 1024 * 1024 + 1) : new TextEncoder().encode('<!DOCTYPE sld>');
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
    expect(preparePptxEmbeddedMedia).not.toHaveBeenCalled();
  });
  it('does not extract assets when source timing has no media targets', async () => {
    const f = await fixture(); Object.assign(f.timing, { children: [] });
    expect(await bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).toEqual([]); expect(preparePptxEmbeddedMedia).not.toHaveBeenCalled();
  });
  it('honors cancellation before reading and during package hashing', async () => {
    const f = await fixture(), controller = new AbortController(); controller.abort();
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    const next = new AbortController(), digest = crypto.subtle.digest.bind(crypto.subtle);
    vi.spyOn(crypto.subtle, 'digest').mockImplementation(async (...args) => { const value = await digest(...args); next.abort(); return value; });
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', next.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('rejects disposal during package hashing', async () => {
    const f = await fixture(), digest = crypto.subtle.digest.bind(crypto.subtle);
    vi.spyOn(crypto.subtle, 'digest').mockImplementation(async (...args) => { const value = await digest(...args); f.source.ownedBlobs.clear(); return value; });
    await expect(bindPptxMediaTimingTargets(f.document, f.source, 'second', f.signal)).rejects.toThrow('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED');
  });
});
