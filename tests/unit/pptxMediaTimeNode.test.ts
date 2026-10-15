import { describe, expect, it } from 'vitest';
import { readPptxTimeNode } from '../../src/adapters/pptx/mediaTimeNode';
import { readPptxMediaTiming } from '../../src/adapters/pptx/mediaTiming';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main', p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = [], namespaceURI = ns): Element {
  const value = { localName: name, namespaceURI, children, attributes: Object.keys(attrs), parentElement: null,
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
const document = (list: Element[]) => ({ documentElement: node('sld', {}, list) }) as Document;
describe('source timing conditions and repeat metadata without execution', () => {
  it('keeps a missing timing identity unverified', () => {
    expect(readPptxTimeNode(node('cTn'))).toMatchObject({ id: null, unverified: true });
  });
  it('preserves parent IDs, start/end references, fractional repeat count and reverse instead of flattening to one click', () => {
    const child = node('cTn', { id: '2', nodeType: 'withEffect', dur: '200', repeatCount: '2500', repeatDur: '1000', autoRev: '1' }, [
      node('stCondLst', {}, [node('cond', { evt: 'onClick', delay: '100' }, [node('tgtEl', {}, [node('spTgt', { spid: '3' })])])]),
      node('endCondLst', {}, [node('cond', { evt: 'onEnd', delay: '0' }, [node('tn', { val: '1' })])])]);
    const root = node('cTn', { id: '1', nodeType: 'interactiveSeq' }, [node('childTnLst', {}, [child])]);
    const result = readPptxMediaTiming(document([node('cNvPr', { id: '3' }), node('timing', {}, [root])]));
    expect(result.timeNodes[1]).toEqual({ id: 2, parentId: 1, nodeType: 'withEffect', durationMs: 200, repeatCount: 2.5, repeatDurationMs: 1000,
      autoReverse: true, start: [{ event: 'onClick', delayMs: 100, reference: { kind: 'shape', id: 3 } }],
      end: [{ event: 'onEnd', delayMs: 0, reference: { kind: 'time', id: 1 } }], unverified: false });
    expect(result.summary).toMatchObject({ repeatNodes: 1, reverseNodes: 1, endConditionNodes: 1, interactiveNodes: 1, unverifiedTimingNodes: 0 });
  });
  it('preserves indefinite timing instead of coercing it to zero', () => {
    const result = readPptxTimeNode(node('cTn', { id: '1', dur: 'indefinite', repeatCount: 'indefinite', repeatDur: 'indefinite' }, [
      node('stCondLst', {}, [node('cond', { delay: 'indefinite' })])]));
    expect(result).toMatchObject({ durationMs: 'indefinite', repeatCount: 'indefinite', repeatDurationMs: 'indefinite', start: [{ event: null, delayMs: 'indefinite', reference: null }], unverified: false });
  });
  it.each(['-1', '1e3', 'NaN', '4294967296', '1.5'])('does not default invalid time %s to a valid zero duration', value => {
    expect(readPptxTimeNode(node('cTn', { id: '1', dur: value }))).toMatchObject({ durationMs: null, unverified: true });
  });
  it('does not copy arbitrary events or node types into metadata', () => {
    const value = readPptxTimeNode(node('cTn', { id: '1', nodeType: 'private-source-text' }, [node('stCondLst', {}, [node('cond', { evt: 'private-event' })])]));
    expect(value.nodeType).toBe('unknown'); expect(value.start[0]!.event).toBe('unknown'); expect(value.unverified).toBe(true);
    expect(JSON.stringify(value)).not.toContain('private');
  });
  it.each(['spd', 'tmFilter', 'restart', 'syncBehavior'])('keeps %s as unverified semantics', key => {
    expect(readPptxTimeNode(node('cTn', { id: '1', [key]: '1' })).unverified).toBe(true);
  });
  it('distinguishes slide reference from unknown runtime/reference nodes', () => {
    const value = readPptxTimeNode(node('cTn', { id: '1' }, [node('stCondLst', {}, [
      node('cond', { evt: 'onNext' }, [node('tgtEl', {}, [node('sldTgt')])]), node('cond', {}, [node('rtn', { val: 'all' })])])]));
    expect(value.start[0]!.reference).toEqual({ kind: 'slide', id: null }); expect(value.start[1]!.reference!.kind).toBe('unknown'); expect(value.unverified).toBe(true);
  });
  it('marks unresolved time/shape references and duplicate condition lists unverified', () => {
    const value = node('cTn', { id: '1' }, [node('stCondLst', {}, [node('cond', {}, [node('tn', { val: '99' })])]), node('stCondLst')]);
    const result = readPptxMediaTiming(document([node('timing', {}, [value])]));
    expect(result.timeNodes[0]!.unverified).toBe(true); expect(result.summary.unverifiedTimingNodes).toBe(1);
  });
  it('finds p14 trim outside p:timing without assuming a playback duration or applying it', () => {
    const result = readPptxMediaTiming(document([node('media', {}, [node('trim', { st: '4520.0324', end: '490.5458' }, [], p14)], p14)]));
    expect(result.summary.trimNodes).toBe(1); expect(result.summary.unverifiedTimingNodes).toBe(0); expect(result.targets).toEqual([]);
  });
  it.each(['-1', 'Infinity', '86400001', '1e3'])('flags out-of-bound trim %s as unverified', st => {
    const result = readPptxMediaTiming(document([node('media', {}, [node('trim', { st }, [], p14)], p14)]));
    expect(result.summary.trimNodes).toBe(1); expect(result.summary.unverifiedTimingNodes).toBe(1);
  });
  it('does not recognize namespace lookalike trim as verified media metadata', () => {
    expect(readPptxMediaTiming(document([node('trim', { st: '100' })])).summary.trimNodes).toBe(0);
  });
});
