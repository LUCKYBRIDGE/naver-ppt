import { describe, expect, it } from 'vitest';
import { bindPptxSourceMediaCalls } from '../../src/adapters/pptx/sourceMediaCalls';
import type { BoundPptxMediaTimingTarget } from '../../src/adapters/pptx/mediaTimingBinding';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = []): Element {
  const value = { localName: name, namespaceURI: ns, children, parentElement: null,
    attributes: Object.keys(attrs).map(name => ({ name, namespaceURI: null })),
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const target = () => node('tgtEl', {}, [node('spTgt', { spid: '7' })]);
  const declaration = node('video', {}, [node('cMediaNode', {}, [node('cTn', { id: '2' }), target()])]);
  const attrs: Record<string, string> = { type: 'call', cmd: 'playFrom(0.5)' };
  const command = node('cmd', attrs, [node('cBhvr', {}, [node('cTn', { id: '3' }), target()])]);
  const list = node('childTnLst', {}, [declaration, command]), root = node('cTn', { id: '1', nodeType: 'tmRoot' }, [list]);
  const timing = node('timing', {}, [node('tnLst', {}, [node('par', {}, [root])])]);
  const xml = { documentElement: node('sld', {}, [node('cNvPr', { id: '7' }), timing]) } as Document;
  const base = { shapeId: 7, slideId: 'slide', sourcePart: 'ppt/slides/slide1.xml', sourceFingerprint: 'a'.repeat(64), mediaFingerprint: 'b'.repeat(64), kind: 'video' as const, elementPath: [1] };
  const bound: BoundPptxMediaTimingTarget[] = [{ ...base, node: 'video', timingId: 2 }, { ...base, node: 'cmd', timingId: 3 }];
  return { xml, bound, root, list, timing, declaration, command, attrs };
}
describe('source cmd to root media declaration and registered asset correspondence', () => {
  it('returns a normalized call with exact declaration and immutable registered target path', () => {
    const f = fixture(), calls = bindPptxSourceMediaCalls(f.xml, f.bound);
    expect(calls).toMatchObject([{ timingId: 3, declarationTimingId: 2, action: { type: 'playFrom', timeSec: .5 }, target: { shapeId: 7, elementPath: [1] } }]);
    calls[0]!.target.elementPath.push(9); expect(f.bound[1]!.elementPath).toEqual([1]); expect(JSON.stringify(calls)).not.toContain('playFrom(');
  });
  it('accepts the documented omitted type but rejects arbitrary call vocabulary', () => {
    const f = fixture(); delete f.attrs.type;
    expect(bindPptxSourceMediaCalls(f.xml, f.bound)[0]!.action).toEqual({ type: 'playFrom', timeSec: .5 });
    f.attrs.cmd = 'play();alert(1)'; expect(() => bindPptxSourceMediaCalls(f.xml, f.bound)).toThrow('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  });
  it.each(['kind', 'sourceFingerprint', 'mediaFingerprint', 'sourcePart', 'slideId', 'elementPath'] as const)('rejects registered %s mismatch against the root declaration', key => {
    const f = fixture(); Object.assign(f.bound[1]!, { [key]: key === 'elementPath' ? [2] : key === 'kind' ? 'audio' : 'other' });
    expect(() => bindPptxSourceMediaCalls(f.xml, f.bound)).toThrow('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  });
  it('rejects a media declaration nested in a click group instead of the timing root', () => {
    const f = fixture(), nested = node('par', {}, [node('cTn', { id: '4' }, [node('childTnLst', {}, [f.declaration])])]);
    (f.list.children as unknown as Element[]).splice(0, 1, nested); Object.assign(nested, { parentElement: f.list });
    expect(() => bindPptxSourceMediaCalls(f.xml, f.bound)).toThrow('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  });
  it('rejects a command from another branch outside the media timing root', () => {
    const f = fixture(); (f.list.children as unknown as Element[]).pop(); (f.timing.children as unknown as Element[]).push(f.command); Object.assign(f.command, { parentElement: f.timing });
    expect(() => bindPptxSourceMediaCalls(f.xml, f.bound)).toThrow('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  });
  it.each(['missing', 'duplicate', 'wrongTiming', 'unknownAttribute'] as const)('rejects %s association atomically', boundary => {
    const f = fixture();
    if (boundary === 'missing') f.bound.pop();
    if (boundary === 'duplicate') f.bound[1] = { ...f.bound[0]! };
    if (boundary === 'wrongTiming') f.bound[1]!.timingId = 99;
    if (boundary === 'unknownAttribute') (f.command.attributes as unknown as { name: string; namespaceURI: null }[]).push({ name: 'rawScript', namespaceURI: null });
    expect(() => bindPptxSourceMediaCalls(f.xml, f.bound)).toThrow('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  });
  it('does not turn a declaration into a command and honors cancellation', () => {
    const f = fixture(); (f.list.children as unknown as Element[]).pop(); f.bound.pop();
    expect(bindPptxSourceMediaCalls(f.xml, f.bound)).toEqual([]);
    const controller = new AbortController(); controller.abort(); expect(() => bindPptxSourceMediaCalls(f.xml, f.bound, controller.signal)).toThrow('Cancelled');
  });
});
