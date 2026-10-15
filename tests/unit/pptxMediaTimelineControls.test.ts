import { describe, expect, it } from 'vitest';
import { readPptxMediaTimelineControls } from '../../src/adapters/pptx/mediaTimelineControls';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = []): Element {
  const value = { localName: name, namespaceURI: ns, children, parentElement: null,
    get attributes() { return Object.keys(attrs).map(name => ({ name, namespaceURI: null })); },
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    setAttribute: (key: string, value: string) => { attrs[key] = value; },
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const start = (delay: string) => node('stCondLst', {}, [node('cond', { delay })]);
  const group = node('cTn', { id: '40', nodeType: 'clickEffect' }, [start('50')]);
  const main = node('cTn', { id: '10', nodeType: 'mainSeq', dur: 'indefinite' }, [start('0'), node('childTnLst', {}, [node('par', {}, [group])])]);
  const next = node('cond', { evt: 'onNext', delay: '0' }, [node('tgtEl', {}, [node('sldTgt')])]);
  const sequence = node('seq', {}, [main, node('nextCondLst', {}, [next])]);
  const declaration = node('cTn', { id: '2', dur: 'indefinite' }, [start('indefinite')]);
  const media = node('audio', {}, [node('cMediaNode', {}, [declaration, node('tgtEl', {}, [node('spTgt', { spid: '7' })])])]);
  const root = node('cTn', { id: '1', nodeType: 'tmRoot', dur: 'indefinite', restart: 'never' }, [start('0'), node('childTnLst', {}, [media, sequence])]);
  const xml = { documentElement: node('sld', {}, [node('cNvPr', { id: '7' }), node('timing', {}, [node('tnLst', {}, [node('par', {}, [root])])])]) } as Document;
  return { xml, root, main, sequence, next, declaration, group };
}
describe('source media timeline global control gate', () => {
  it('verifies explicit root/main start and inactive root media with standard sequence defaults', () => {
    expect(readPptxMediaTimelineControls(fixture().xml)).toEqual({ rootTimingId: 1, mainTimingId: 10, groupTimingIds: [40], declarationTimingIds: [2],
      concurrent: false, nextAction: 'none', previousAction: 'none', controlsVerified: true, executionVerified: false });
  });
  it('accepts explicit disabled/none settings', () => {
    const f = fixture(); f.sequence.setAttribute('concurrent', 'false'); f.sequence.setAttribute('nextAc', 'none'); f.sequence.setAttribute('prevAc', 'none');
    expect(readPptxMediaTimelineControls(f.xml).controlsVerified).toBe(true);
  });
  it.each([['concurrent', '1'], ['concurrent', 'invalid'], ['nextAc', 'seek'], ['nextAc', 'invalid'], ['prevAc', 'skipTimed']])('refuses unsupported %s=%s', (name, value) => {
    const f = fixture(); f.sequence.setAttribute(name, value); expect(() => readPptxMediaTimelineControls(f.xml)).toThrow('PPTX_MEDIA_TIMELINE_CONTROLS_UNVERIFIED');
  });
  it.each(['rootDelay', 'mainEvent', 'autoMedia', 'rootRepeat', 'rootEnd', 'nestedSequence', 'nextShape', 'nextDelay', 'duplicateRoot', 'restart'])('refuses %s before execution', boundary => {
    const f = fixture();
    if (boundary === 'rootDelay') f.root.children[0]!.children[0]!.setAttribute('delay', '100');
    if (boundary === 'mainEvent') f.main.children[0]!.children[0]!.setAttribute('evt', 'onClick');
    if (boundary === 'autoMedia') f.declaration.children[0]!.children[0]!.setAttribute('delay', '0');
    if (boundary === 'rootRepeat') f.root.setAttribute('repeatCount', '2000');
    if (boundary === 'rootEnd') (f.root.children as unknown as Element[]).push(node('endCondLst'));
    if (boundary === 'nestedSequence') (f.group.children as unknown as Element[]).push(node('seq'));
    if (boundary === 'nextShape') Object.assign(f.next.children[0]!.children[0]!, { localName: 'spTgt' });
    if (boundary === 'nextDelay') f.next.setAttribute('delay', '1');
    if (boundary === 'duplicateRoot') (f.xml.documentElement.children[1]!.children[0]!.children as unknown as Element[]).push(node('par'));
    if (boundary === 'restart') f.root.setAttribute('restart', 'always');
    expect(() => readPptxMediaTimelineControls(f.xml)).toThrow('PPTX_MEDIA_TIMELINE_CONTROLS_UNVERIFIED');
  });
  it('honors cancellation before inspecting the tree', () => {
    const c = new AbortController(); c.abort(); expect(() => readPptxMediaTimelineControls(fixture().xml, c.signal)).toThrow('Cancelled');
  });
});
