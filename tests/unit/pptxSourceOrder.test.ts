import type { AnimStep } from '@web-ppt/core';
import { describe, expect, it } from 'vitest';
import { bindPptxSourceOrder } from '../../src/adapters/pptx/sourceOrder';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = [], namespaceURI = ns): Element {
  const value = { localName: name, namespaceURI, children, attributes: Object.keys(attrs), parentElement: null,
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
const target = (spid: string) => node('tgtEl', {}, [node('spTgt', { spid })]);
const media = (tag: string, timing: number, shape: string) => node(tag, {}, [node('cMediaNode', {}, [node('cTn', { id: String(timing) }), target(shape)])]);
function fixture() {
  const audio = media('audio', 2, '3'), video = media('video', 3, '4');
  const cmd = node('cmd', { type: 'call', cmd: 'pause' }, [node('cBhvr', {}, [node('cTn', { id: '4' }), target('4')])]);
  const effectAttrs = { id: '31', presetClass: 'emph', presetID: '24', nodeType: 'withEffect' };
  const effect = node('par', {}, [node('cTn', effectAttrs, [node('childTnLst', {}, [node('animRot', {}, [node('cBhvr', {}, [node('cTn', { id: '32', dur: '200' }), target('4')])])])])]);
  const group = (id: number, list: Element[]) => node('par', {}, [node('cTn', { id: String(id), nodeType: 'clickEffect' }, [node('childTnLst', {}, list)])]);
  const mainList = node('childTnLst', {}, [group(20, [audio]), group(30, [video, effect]), group(40, [cmd])]);
  const main = node('cTn', { id: '10', nodeType: 'mainSeq' }, [mainList]);
  const control = (name: string, evt: string) => node(name, {}, [node('cond', { evt, delay: '0' }, [node('tgtEl', {}, [node('sldTgt')])])]);
  const sequence = node('seq', { concurrent: '1', nextAc: 'seek', prevAc: 'skipTimed' }, [main, control('prevCondLst', 'onPrev'), control('nextCondLst', 'onNext')]);
  const rootList = node('childTnLst', {}, [sequence]);
  const root = node('sld', {}, [node('cNvPr', { id: '3' }), node('cNvPr', { id: '4' }), node('timing', {}, [node('par', {}, [node('cTn', { id: '1', nodeType: 'tmRoot' }, [rootList])])])]);
  const xml = { documentElement: root } as Document;
  const steps: AnimStep[] = [{ target: 4, effect: 'spin', kind: 'emphasis', trigger: 'withPrev', durationMs: 200, delayMs: 0 }];
  return { xml, steps, effectAttrs, rootList, mainList, sequence, audio, video, cmd };
}
describe('source sequence and model shape-step alignment without timeline execution', () => {
  it('preserves media-only groups before/after a simultaneous model effect', () => {
    const f = fixture(), value = bindPptxSourceOrder(f.xml, f.steps);
    expect(value.groups.map(group => [group.timingId, group.shapeSteps, group.media.map(target => target.node)])).toEqual([
      [20, [], ['audio']], [30, [0], ['video']], [40, [], ['cmd']]]);
    expect(value.mediaOnlyGroups).toBe(2); expect(value.independentMedia).toEqual([]); expect(value.executionVerified).toBe(false);
    expect(value.sequences[0]).toMatchObject({ timingId: 10, concurrent: true, nextAction: 'seek', previousAction: 'skipTimed',
      previous: [{ event: 'onPrev', delayMs: 0, slideTarget: true }], next: [{ event: 'onNext', delayMs: 0, slideTarget: true }] });
    expect(JSON.stringify(value)).not.toContain('pause');
  });
  it.each(['missing', 'extra', 'target', 'kind', 'trigger'])('rejects %s model correspondence', boundary => {
    const f = fixture();
    if (boundary === 'missing') f.steps.length = 0;
    if (boundary === 'extra') f.steps.push({ ...f.steps[0]! });
    if (boundary === 'target') f.steps[0]!.target = 3;
    if (boundary === 'kind') f.steps[0]!.kind = 'entrance';
    if (boundary === 'trigger') f.steps[0]!.trigger = 'click';
    expect(() => bindPptxSourceOrder(f.xml, f.steps)).toThrow('PPTX_SOURCE_ORDER_UNVERIFIED');
  });
  it('preserves independent media instead of inserting it into the first group', () => {
    const f = fixture(); (f.rootList.children as unknown as Element[]).push(f.audio);
    const firstList = f.mainList.children[0]!.children[0]!.children[0]!;
    (firstList.children as unknown as Element[]).length = 0; Object.assign(f.audio, { parentElement: f.rootList });
    const result = bindPptxSourceOrder(f.xml, f.steps);
    expect(result.independentMedia.map(item => item.node)).toEqual(['audio']); expect(result.groups[0]!.media).toEqual([]);
  });
  it('keeps a source with no main sequence independent and rejects shape steps without a sequence', () => {
    const f = fixture(); (f.rootList.children as unknown as Element[]).splice(0, 1, f.audio, f.video, f.cmd);
    [f.audio, f.video, f.cmd].forEach(child => Object.assign(child, { parentElement: f.rootList }));
    expect(bindPptxSourceOrder(f.xml, []).independentMedia.map(item => item.node)).toEqual(['audio', 'video', 'cmd']);
    expect(() => bindPptxSourceOrder(f.xml, f.steps)).toThrow('PPTX_SOURCE_ORDER_UNVERIFIED');
  });
  it('rejects ambiguous multiple main sequences and arbitrary source effect categories', () => {
    const f = fixture(); f.effectAttrs.presetClass = 'private-source-label';
    expect(() => bindPptxSourceOrder(f.xml, f.steps)).toThrow('PPTX_SOURCE_ORDER_UNVERIFIED');
    const next = fixture(); (next.rootList.children as unknown as Element[]).push(node('seq', {}, [node('cTn', { id: '99', nodeType: 'mainSeq' })]));
    expect(() => bindPptxSourceOrder(next.xml, next.steps)).toThrow('PPTX_SOURCE_ORDER_UNVERIFIED');
  });
  it('honors cancellation and source depth bounds before returning any groups', () => {
    const f = fixture(), controller = new AbortController(); controller.abort();
    expect(() => bindPptxSourceOrder(f.xml, f.steps, controller.signal)).toThrow('Cancelled');
    let root = node('sld'); for (let i = 0; i < 130; i++) root = node('par', {}, [root]);
    Object.assign(root, { localName: 'sld' }); expect(() => bindPptxSourceOrder({ documentElement: root } as Document, [])).toThrow('PPTX_MEDIA_TIMING_LIMIT');
  });
  it('rejects namespace lookalike documents', () => {
    expect(() => bindPptxSourceOrder({ documentElement: node('sld', {}, [], 'https://example.invalid') } as Document, [])).toThrow('PPTX_SOURCE_ORDER_UNVERIFIED');
  });
});
