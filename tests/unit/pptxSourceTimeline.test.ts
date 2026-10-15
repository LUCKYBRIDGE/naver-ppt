import { describe, expect, it } from 'vitest';
import { bindPptxSourceTimeline, sourceTimelineMediaBinding } from '../../src/adapters/pptx/sourceTimeline';
import type { BoundPptxMediaTimingTarget } from '../../src/adapters/pptx/mediaTimingBinding';
import type { PlayerSnapshot } from '../../src/core/playerSnapshot';
const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = []): Element {
  const value = { localName: name, namespaceURI: p, children, parentElement: null,
    get attributes() { return Object.keys(attrs).map(name => ({ name, namespaceURI: null })); },
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    setAttribute: (key: string, item: string) => { attrs[key] = item; },
    removeAttribute: (key: string) => { delete attrs[key]; },
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const start = (delay: string) => node('stCondLst', {}, [node('cond', { delay })]);
  const target = () => node('tgtEl', {}, [node('spTgt', { spid: '7' })]);
  const media = node('cMediaNode', { vol: '25000', mute: '1' }, [node('cTn', { id: '2', dur: 'indefinite' }, [start('indefinite')]), target()]);
  const behavior = node('cBhvr', {}, [node('cTn', { id: '4' }, [start('100')]), target()]);
  const command = node('cmd', { cmd: 'play' }, [behavior]);
  const group = node('cTn', { id: '40', nodeType: 'clickEffect' }, [start('50'), node('childTnLst', {}, [command])]);
  const main = node('cTn', { id: '10', dur: 'indefinite', nodeType: 'mainSeq' }, [start('0'), node('childTnLst', {}, [node('par', {}, [group])])]);
  const sequence = node('seq', {}, [main, node('nextCondLst', {}, [node('cond', { evt: 'onNext', delay: '0' }, [node('tgtEl', {}, [node('sldTgt')])])])]);
  const root = node('cTn', { id: '1', dur: 'indefinite', nodeType: 'tmRoot' }, [start('0'), node('childTnLst', {}, [node('video', {}, [media]), sequence])]);
  const xml = { documentElement: node('sld', {}, [node('pic', {}, [node('cNvPr', { id: '7' })]), node('timing', {}, [node('tnLst', {}, [node('par', {}, [root])])])]) } as Document;
  const base = { shapeId: 7, slideId: 'slide', sourcePart: 'ppt/slides/slide1.xml', sourceFingerprint: 'a'.repeat(64), mediaFingerprint: 'b'.repeat(64), kind: 'video' as const, elementPath: [0] };
  const bound: BoundPptxMediaTimingTarget[] = [{ ...base, node: 'video', timingId: 2 }, { ...base, node: 'cmd', timingId: 4 }];
  const snapshot: PlayerSnapshot = { sessionId: 'lesson', revision: 0, selection: { documentId: 'doc', slideId: 'slide' }, pageNumber: 1,
    sourceFingerprint: 'a'.repeat(64), pptx: { checkpoint: null, run: null }, overlays: [], autoplay: null, timers: [],
    media: [{ ref: { id: 'clip', slideId: 'slide', kind: 'video', mime: 'video/mp4', fingerprint: 'b'.repeat(64), durationSec: 4,
      playback: { startSec: 0, endSec: 4, volume: .25, muted: true },
      embeddedSource: { type: 'pptx', sourceFingerprint: 'a'.repeat(64), sourcePart: 'ppt/slides/slide1.xml', elementPath: [0] } }, bookmark: null }] };
  const identity = { documentId: 'doc', slideId: 'slide', fingerprint: 'a'.repeat(64) };
  const bind = (signal?: AbortSignal) => bindPptxSourceTimeline(xml, bound, [], snapshot, identity, signal);
  return { xml, bound, snapshot, identity, bind, media, behavior, command, group, root, sequence };
}
describe('whole source media click timeline preparation', () => {
  it('binds exact registered assets and sums source delays without executing anything', () => {
    const f = fixture(); expect(f.bind()).toEqual({ controlsVerified: true, executionVerified: false,
      groups: [{ timingId: 40, shapeGroup: null, actions: [{ mediaId: 'clip', binding: sourceTimelineMediaBinding(f.snapshot.media[0]!.ref), action: { type: 'play' }, delayMs: 150 }] }] });
    expect(f.snapshot.media[0]!.bookmark).toBeNull();
  });
  it.each(['hiddenBehavior', 'behaviorAttribute', 'listAttribute', 'targetAttribute', 'unknownFill', 'unknownMediaChild', 'mediaAttribute', 'defaults', 'globalConcurrent'] as const)('refuses %s in the complete source branch', boundary => {
    const f = fixture();
    if (boundary === 'hiddenBehavior') (f.group.children[1]!.children as unknown as Element[]).push(node('set'));
    if (boundary === 'behaviorAttribute') f.behavior.setAttribute('override', 'childStyle');
    if (boundary === 'listAttribute') f.group.children[1]!.setAttribute('unknown', '1');
    if (boundary === 'targetAttribute') f.behavior.children[1]!.setAttribute('unknown', '1');
    if (boundary === 'unknownFill') f.group.setAttribute('fill', 'unknown');
    if (boundary === 'unknownMediaChild') (f.media.children as unknown as Element[]).push(node('extLst'));
    if (boundary === 'mediaAttribute') f.media.parentElement!.setAttribute('unknown', '1');
    if (boundary === 'defaults') f.media.removeAttribute('vol');
    if (boundary === 'globalConcurrent') f.sequence.setAttribute('concurrent', '1');
    expect(() => f.bind()).toThrow();
  });
  it.each(['source', 'asset', 'part', 'path', 'kind', 'missing', 'duplicate', 'selection'] as const)('refuses registered %s mismatch', boundary => {
    const f = fixture(), ref = f.snapshot.media[0]!.ref;
    if (boundary === 'source') ref.embeddedSource!.sourceFingerprint = 'c'.repeat(64);
    if (boundary === 'asset') ref.fingerprint = 'c'.repeat(64);
    if (boundary === 'part') ref.embeddedSource!.sourcePart = 'ppt/slides/slide2.xml';
    if (boundary === 'path') ref.embeddedSource!.elementPath = [1];
    if (boundary === 'kind') ref.kind = 'audio';
    if (boundary === 'missing') f.snapshot.media = [];
    if (boundary === 'duplicate') f.snapshot.media.push(structuredClone(f.snapshot.media[0]!));
    if (boundary === 'selection') f.snapshot.selection!.slideId = 'other';
    expect(() => f.bind()).toThrow();
  });
  it('uses teacher playback settings while keeping original explicit settings validated', () => {
    const f = fixture(); f.snapshot.media[0]!.ref.playback!.volume = .6;
    expect(f.bind().groups[0]!.actions[0]!.action).toEqual({ type: 'play' });
  });
  it('refuses playFrom outside the current user clip and honors cancellation', () => {
    const f = fixture(); f.command.setAttribute('cmd', 'playFrom(4)'); expect(() => f.bind()).toThrow();
    const controller = new AbortController(); controller.abort(); expect(() => f.bind(controller.signal)).toThrow('Cancelled');
  });
});
