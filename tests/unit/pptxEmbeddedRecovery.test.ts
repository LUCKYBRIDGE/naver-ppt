import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Presentation } from '@web-ppt/core';
import { resolvePptxLocalMediaPart } from '../../src/adapters/pptx/localMediaPart';
import { recoverPptxEmbeddedMedia } from '../../src/adapters/pptx/recoverEmbeddedMedia';
const p = 'http://schemas.openxmlformats.org/presentationml/2006/main', a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships', p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main', pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = [], ns = p): Element {
  const value = { localName: name, namespaceURI: ns, children, parentElement: null,
    getAttribute: (key: string) => attrs[key] ?? null, getAttributeNS: (_ns: string, key: string) => attrs[key] ?? null,
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const primaryAttrs = { Id: 'external', Type: r + '/audio', TargetMode: 'External', Target: 'NEVER_READ_EXTERNAL_TARGET' };
  const primary = node('Relationship', primaryAttrs, [], pkg);
  const embeddedAttrs: Record<string, string> = { Id: 'embedded', Type: 'http://schemas.microsoft.com/office/2007/relationships/media', Target: '../media/audio.mp3' };
  const embedded = node('Relationship', embeddedAttrs, [], pkg), rels = new Map([['external', primary], ['embedded', embedded]]);
  const media = node('media', { embed: 'embedded' }, [], p14), audio = node('audioFile', { link: 'external' }, [], a);
  const nv = node('nvPr', {}, [audio, node('extLst', {}, [node('ext', {}, [media])])]);
  const pic = node('pic', {}, [node('nvPicPr', {}, [node('cNvPr', { id: '3' }), nv])]);
  const roots = { SLIDE: node('sld', {}, [pic]), RELS: node('Relationships', {}, [primary, embedded], pkg) };
  vi.stubGlobal('DOMParser', class { parseFromString(text: keyof typeof roots) { return { documentElement: roots[text], getElementsByTagName: () => [] }; } });
  const element = { kind: 'image', id: 3, src: '', media: { kind: 'audio', mime: 'audio/mpeg', src: null as string | null, external: false } };
  const addOwnedAsset = vi.fn(() => 'blob:owned');
  const source = { model: { slides: [{ elements: [element] }] } as unknown as Presentation, parts: ['ppt/slides/slide1.xml'],
    files: { 'ppt/slides/slide1.xml': new TextEncoder().encode('SLIDE'), 'ppt/slides/_rels/slide1.xml.rels': new TextEncoder().encode('RELS'), 'ppt/media/audio.mp3': new TextEncoder().encode('ID3synthetic') } as Record<string, Uint8Array>, addOwnedAsset };
  return { primary, primaryAttrs, embedded, embeddedAttrs, rels, media, nv, element, source, pic, roots, signal: new AbortController().signal };
}
afterEach(() => vi.unstubAllGlobals());
describe('strict internal media selection', () => {
  it('uses explicit p14 bytes without reading the external compatibility target', () => {
    const f = fixture(), get = f.primary.getAttribute;
    f.primary.getAttribute = key => { if (key === 'Target') throw Error('EXTERNAL_TARGET_READ'); return get(key); };
    expect(resolvePptxLocalMediaPart(f.nv, f.rels, f.source.parts[0]!, 'audio')).toBe('ppt/media/audio.mp3');
  });
  it.each(['missing', 'external', 'wrongType', 'duplicate', 'conflict', 'unsafe', 'wrongKind', 'wrongParent'])('rejects %s embedded relations', boundary => {
    const f = fixture();
    if (boundary === 'missing') f.rels.delete('embedded');
    if (boundary === 'external') f.embeddedAttrs.TargetMode = 'External';
    if (boundary === 'wrongType') f.embeddedAttrs.Type = r + '/audio';
    if (boundary === 'duplicate') (f.nv.children as unknown as Element[]).push(f.media);
    if (boundary === 'conflict') { f.primaryAttrs.TargetMode = 'Internal'; f.primaryAttrs.Target = '../media/other.mp3'; }
    if (boundary === 'unsafe') f.embeddedAttrs.Target = 'https://example.invalid/audio.mp3';
    if (boundary === 'wrongKind') f.primaryAttrs.Type = r + '/video';
    if (boundary === 'wrongParent') Object.assign(f.media, { parentElement: f.nv });
    expect(() => resolvePptxLocalMediaPart(f.nv, f.rels, f.source.parts[0]!, 'audio')).toThrow();
  });
  it('accepts matching internal and p14 targets', () => {
    const f = fixture(); f.primaryAttrs.TargetMode = 'Internal'; f.primaryAttrs.Target = '../media/audio.mp3';
    expect(resolvePptxLocalMediaPart(f.nv, f.rels, f.source.parts[0]!, 'audio')).toBe('ppt/media/audio.mp3');
  });
});
describe('missing model media recovery', () => {
  it('adds only verified package audio to its owner and replaces no file bytes', () => {
    const f = fixture(), bytes = f.source.files['ppt/media/audio.mp3']!.slice();
    const result = recoverPptxEmbeddedMedia(f.source, f.signal);
    expect(result).toEqual({ recovered: 1, unresolved: 0, uniqueBytes: bytes.length });
    expect(f.element.media).toMatchObject({ src: 'blob:owned', external: false }); expect(f.source.addOwnedAsset).toHaveBeenCalledOnce();
    expect(f.source.files['ppt/media/audio.mp3']).toEqual(bytes);
  });
  it.each(['header', 'missingBytes', 'kind', 'duplicateId', 'missingRelation', 'allocation'])('leaves %s unresolved without weakening the guard', boundary => {
    const f = fixture();
    if (boundary === 'header') f.source.files['ppt/media/audio.mp3'] = new TextEncoder().encode('invalid');
    if (boundary === 'missingBytes') delete f.source.files['ppt/media/audio.mp3'];
    if (boundary === 'kind') f.element.media.mime = 'video/mp4';
    if (boundary === 'duplicateId') f.source.model.slides[0]!.elements.push({ ...f.element } as unknown as Presentation['slides'][number]['elements'][number]);
    if (boundary === 'missingRelation') f.embeddedAttrs.TargetMode = 'External';
    if (boundary === 'allocation') f.source.addOwnedAsset.mockImplementation(() => { throw Error('ALLOCATION_FAILED'); });
    expect(recoverPptxEmbeddedMedia(f.source, f.signal).unresolved).toBeGreaterThan(0); expect(f.element.media.src).toBeNull();
  });
  it('never overwrites an existing model URL', () => {
    const f = fixture(); f.element.media.src = 'blob:already-owned';
    expect(recoverPptxEmbeddedMedia(f.source, f.signal).recovered).toBe(0); expect(f.source.addOwnedAsset).not.toHaveBeenCalled();
  });
  it('reuses a part across slides with one additional owned Blob', () => {
    const f = fixture(), second = structuredClone(f.element);
    f.source.model.slides.push({ elements: [second] } as unknown as Presentation['slides'][number]); f.source.parts.push('ppt/slides/slide2.xml');
    f.source.files['ppt/slides/slide2.xml'] = new TextEncoder().encode('SLIDE'); f.source.files['ppt/slides/_rels/slide2.xml.rels'] = new TextEncoder().encode('RELS');
    expect(recoverPptxEmbeddedMedia(f.source, f.signal).recovered).toBe(2); expect(f.source.addOwnedAsset).toHaveBeenCalledOnce(); expect(second.media.src).toBe('blob:owned');
  });
  it('cancels before allocating', () => {
    const f = fixture(), controller = new AbortController(); controller.abort();
    expect(() => recoverPptxEmbeddedMedia(f.source, controller.signal)).toThrow('Cancelled'); expect(f.source.addOwnedAsset).not.toHaveBeenCalled();
  });
});
