import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPptxMediaCallDelay, startPptxDelayedMediaAction } from '../../src/adapters/pptx/mediaCallDelay';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = []): Element {
  const value = { localName: name, namespaceURI: ns, children, parentElement: null, attributes: Object.keys(attrs).map(name => ({ name, namespaceURI: null })),
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const condition = { delay: '100' };
  const leafAttrs: Record<string, string> = { id: '4' };
  const leaf = node('cTn', leafAttrs, [node('stCondLst', {}, [node('cond', condition)])]);
  const target = () => node('tgtEl', {}, [node('spTgt', { spid: '7' })]);
  const call = node('cmd', { type: 'call', cmd: 'play' }, [node('cBhvr', {}, [leaf, target()])]);
  const groupAttrs: Record<string, string> = { id: '40', nodeType: 'clickEffect' };
  const group = node('cTn', groupAttrs, [node('stCondLst', {}, [node('cond', { delay: '50' })]), node('childTnLst', {}, [call])]);
  const main = node('cTn', { id: '10', nodeType: 'mainSeq' }, [node('childTnLst', {}, [node('par', {}, [group])])]);
  const declaration = node('video', {}, [node('cMediaNode', {}, [node('cTn', { id: '2' }), target()])]);
  const root = node('cTn', { id: '1', nodeType: 'tmRoot' }, [node('childTnLst', {}, [declaration, node('seq', {}, [main])])]);
  const timing = node('timing', {}, [node('par', {}, [root])]);
  const xml = { documentElement: node('sld', {}, [node('cNvPr', { id: '7' }), timing]) } as Document;
  return { xml, groupAttrs, condition, leafAttrs, leaf, group };
}
afterEach(() => vi.useRealTimers());
describe('group-local unconditional source media delay', () => {
  it('sums explicit parent and command delays without approving the full source timeline', () => {
    const f = fixture(); expect(readPptxMediaCallDelay(f.xml, 4, 40)).toEqual({ commandTimingId: 4, groupTimingId: 40, timingIds: [4, 40], delayMs: 150, executionVerified: false });
  });
  it.each(['event', 'missing', 'indefinite', 'after', 'repeat', 'duration', 'unknown'])('refuses %s timing rather than making it immediate', boundary => {
    const f = fixture();
    if (boundary === 'event') Object.assign(f.condition, { evt: 'onClick' });
    if (boundary === 'missing') delete (f.condition as Record<string, string>).delay;
    if (boundary === 'indefinite') f.condition.delay = 'indefinite';
    if (boundary === 'after') f.leafAttrs.nodeType = 'afterEffect';
    if (boundary === 'repeat') f.leafAttrs.repeatCount = '2000';
    if (boundary === 'duration') f.leafAttrs.dur = '500';
    if (boundary === 'unknown') (f.leaf.attributes as unknown as { name: string; namespaceURI: null }[]).push({ name: 'unknown', namespaceURI: null });
    expect(() => readPptxMediaCallDelay(f.xml, 4, 40)).toThrow('PPTX_MEDIA_CALL_DELAY_UNVERIFIED');
  });
  it('requires the exact selected main-sequence click boundary and honors cancellation', () => {
    const f = fixture(); expect(() => readPptxMediaCallDelay(f.xml, 4, 10)).toThrow('PPTX_MEDIA_CALL_DELAY_UNVERIFIED');
    const controller = new AbortController(); controller.abort(); expect(() => readPptxMediaCallDelay(f.xml, 4, 40, controller.signal)).toThrow('Cancelled');
  });
});
describe('deadline-owned delayed native media command', () => {
  it('starts exactly once at the deadline and waits for native acceptance', async () => {
    vi.useFakeTimers(); let finish!: () => void;
    const start = vi.fn(() => ({ finished: new Promise<void>(resolve => { finish = resolve; }), cancel: vi.fn() }));
    const run = startPptxDelayedMediaAction(150, () => true, start), completed = vi.fn(); void run.finished.then(completed);
    await vi.advanceTimersByTimeAsync(149); expect(start).not.toHaveBeenCalled(); await vi.advanceTimersByTimeAsync(1); expect(start).toHaveBeenCalledOnce();
    expect(completed).not.toHaveBeenCalled(); finish(); await run.finished;
  });
  it('cancels before the deadline without touching existing native playback', async () => {
    vi.useFakeTimers(); const start = vi.fn(), run = startPptxDelayedMediaAction(100, () => true, start), outcome = run.finished.catch(error => error.message);
    run.cancel(); await vi.advanceTimersByTimeAsync(1000); expect(await outcome).toBe('PPTX_MEDIA_DELAY_CANCELLED'); expect(start).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
  it('rejects lost or unavailable ownership at the deadline', async () => {
    vi.useFakeTimers(); let current = true; const start = vi.fn(), run = startPptxDelayedMediaAction(100, () => current, start), outcome = run.finished.catch(error => error.message);
    current = false; await vi.advanceTimersByTimeAsync(100); expect(await outcome).toBe('PPTX_MEDIA_DELAY_CANCELLED'); expect(start).not.toHaveBeenCalled();
    await expect(startPptxDelayedMediaAction(0, () => { throw Error('unavailable'); }, start).finished).rejects.toThrow('PPTX_MEDIA_DELAY_CANCELLED');
  });
  it('keeps cancellation effective after native acceptance', async () => {
    const cancel = vi.fn(), run = startPptxDelayedMediaAction(0, () => true, () => ({ finished: Promise.resolve(), cancel }));
    await run.finished; run.cancel(); run.cancel(); expect(cancel).toHaveBeenCalledOnce();
  });
  it('cleans a delayed native failure without exposing its message', async () => {
    const cancel = vi.fn(), run = startPptxDelayedMediaAction(0, () => true, () => ({ finished: Promise.reject(Error('private')), cancel }));
    await expect(run.finished).rejects.toThrow('PPTX_MEDIA_DELAY_FAILED'); expect(cancel).toHaveBeenCalledOnce();
  });
  it.each([-1, NaN, Infinity, 86400001])('rejects invalid delay %s before scheduling', delay => {
    const start = vi.fn(); expect(() => startPptxDelayedMediaAction(delay, () => true, start)).toThrow('PPTX_MEDIA_CALL_DELAY_UNVERIFIED'); expect(start).not.toHaveBeenCalled();
  });
});
