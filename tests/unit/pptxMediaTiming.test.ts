import { describe, expect, it } from 'vitest';
import { emptyPptxMediaTiming, inspectPptxMediaTiming, isPptxMediaTimingSummary, pptxMediaTimingMessage, recognizedPptxMediaCall } from '../../src/adapters/pptx/mediaTiming';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(localName: string, attrs: Record<string, string> = {}, list: Element[] = [], namespaceURI = ns): Element {
  const value = { localName, namespaceURI, children: list, attributes: Object.keys(attrs), parentElement: null,
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key) } as unknown as Element;
  for (const child of list) Object.assign(child, { parentElement: value }); return value;
}
const time = (id: number) => node('cTn', { id: String(id) });
const target = (id = '3') => node('tgtEl', {}, [node('spTgt', { spid: id })]);
const media = (id = '3', attrs = {}) => node('video', {}, [node('cMediaNode', attrs, [time(1), target(id)])]);
const command = (text = 'playFrom(0.25)', type = 'call', id = '3') => node('cmd', { cmd: text, type }, [node('cBhvr', {}, [time(2), target(id)])]);
const slide = (timing: Element[], shapes = ['3']) => ({ documentElement: node('sld', {}, [node('spTree', {}, shapes.map(id => node('cNvPr', { id }))), node('timing', {}, timing)]) }) as Document;

describe('source media timing inspection without execution', () => {
  it('counts source settings/cross-slide/conditions and exact shape associations without copying text', () => {
    const value = inspectPptxMediaTiming(slide([media('3', { vol: '25000', mute: '1', numSld: '2' }), command(), node('cond', { evt: 'onClick', delay: '100' })]));
    expect(value).toEqual({ ...emptyPptxMediaTiming(), videoNodes: 1, commands: 1, recognizedCalls: 1, settingsNodes: 1, crossSlideNodes: 1, conditionalNodes: 1 });
    expect(JSON.stringify(value)).not.toContain('playFrom'); expect(isPptxMediaTimingSummary(value)).toBe(true);
  });
  it.each(['play', 'pause', 'resume', 'stop', 'togglePause', 'playFrom(0)', 'playFrom(0.25)', 'playFrom(86400)'])('recognizes lexical %s without executing it', text => {
    expect(recognizedPptxMediaCall('call', text)).toBe(true);
  });
  it.each(['PlayFrom(0)', 'playFrom(-1)', 'playFrom(Infinity)', 'playFrom(86401)', 'playFrom(1e3)', 'play();fetch()', ' play', 'playFrom()'])('does not reinterpret %s', text => {
    expect(recognizedPptxMediaCall('call', text)).toBe(false);
  });
  it('does not treat event/verb commands as media calls', () => {
    const value = inspectPptxMediaTiming(slide([command('onstopaudio', 'evt')]));
    expect(value.otherCommands).toBe(1); expect(value.recognizedCalls).toBe(0); expect(value.unresolvedTargets).toBe(1);
  });
  it('warns when a known call has no associated media timing node', () => {
    const value = inspectPptxMediaTiming(slide([command()])); expect(value.recognizedCalls).toBe(1); expect(value.unresolvedTargets).toBe(1);
  });
  it('rejects missing/ambiguous shape targets as unresolved', () => {
    expect(inspectPptxMediaTiming(slide([media('99')])).unresolvedTargets).toBe(1);
    expect(inspectPptxMediaTiming(slide([media()], ['3', '3'])).unresolvedTargets).toBe(1);
  });
  it('warns on duplicate time IDs and malformed settings', () => {
    const value = inspectPptxMediaTiming(slide([media('3', { vol: '100001', mute: 'yes' }), time(1)])); expect(value.invalidNodes).toBe(2);
  });
  it('distinguishes sound/slide targets from verified media shapes', () => {
    const value = inspectPptxMediaTiming(slide([node('audio', {}, [node('cMediaNode', {}, [time(1), node('tgtEl', {}, [node('sndTgt', { name: 'Synthetic private sound' })])])])]));
    expect(value.audioNodes).toBe(1); expect(value.nonShapeTargets).toBe(1); expect(JSON.stringify(value)).not.toContain('private');
  });
  it('does not accept namespace lookalikes', () => {
    const value = inspectPptxMediaTiming(slide([node('video', {}, [], 'https://example.invalid')])); expect(value.videoNodes).toBe(0); expect(value.invalidNodes).toBe(1);
  });
  it('does not inspect shape media tags outside the timing tree as playback', () => {
    expect(inspectPptxMediaTiming({ documentElement: node('sld', {}, [node('video', {}, [])]) } as Document)).toEqual(emptyPptxMediaTiming());
  });
  it('bounds depth and honors cancellation', () => {
    let root = node('sld'); for (let i = 0; i < 130; i++) root = node('par', {}, [root]);
    expect(() => inspectPptxMediaTiming({ documentElement: root } as Document)).toThrow('PPTX_MEDIA_TIMING_LIMIT');
    const controller = new AbortController(); controller.abort(); expect(() => inspectPptxMediaTiming(slide([]), controller.signal)).toThrow('Cancelled');
  });
  it('keeps absence unknown and validates summary bounds before reporting', () => {
    expect(pptxMediaTimingMessage(emptyPptxMediaTiming())).toContain('미발견도'); expect(pptxMediaTimingMessage()).toContain('검사하지');
    for (const bad of [{}, { ...emptyPptxMediaTiming(), commands: 1 }, { ...emptyPptxMediaTiming(), videoNodes: Infinity }, { ...emptyPptxMediaTiming(), extra: 'private' }]) expect(isPptxMediaTimingSummary(bad)).toBe(false);
  });
});
