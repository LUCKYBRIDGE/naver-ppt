import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePptxScale, playPptxScaleGroup, pptxScaleFrames, type PptxScaleSource } from '../../src/adapters/pptx/scaleBehavior';
import type { PptxTransformStep } from '../../src/adapters/pptx/transformBehavior';
afterEach(() => vi.unstubAllGlobals());
describe('PPTX original scale values', () => {
  it.each([['150000', 1.5], ['150.000%', 1.5], ['50000', 0.5], ['25.5%', 0.255], ['+100000', 1], ['0', 0], ['0%', 0], ['100000000', 1000], ['100000%', 1000]] as const)('reads %s', (value, factor) => {
    expect(parsePptxScale(value)).toBe(factor);
  });
  it.each([null, '', '-50000', '-50%', ' 150000', '150000 ', '1.5', '1e5', 'Infinity', 'NaN', '150%%', '2147483648', '100000001', '100000.1%'])('rejects unverified scale %s', value => {
    expect(() => parsePptxScale(value)).toThrow('PPTX_SCALE_UNVERIFIED');
  });
  it('preserves each axis for by-only', () => {
    expect(pptxScaleFrames({ by: { x: 1.5, y: 0.5 }, from: null, to: null }, 'none')).toEqual([{ transform: 'scale(1, 1)' }, { transform: 'scale(1.5, 0.5)' }]);
  });
  it('preserves explicit from/to without normalizing axes', () => {
    expect(pptxScaleFrames({ by: null, from: { x: 0.5, y: 2 }, to: { x: 2, y: 0.25 } }, 'none')).toEqual([{ transform: 'scale(0.5, 2)' }, { transform: 'scale(2, 0.25)' }]);
  });
  it('starts to-only from zero according to the Office implementation note', () => {
    expect(pptxScaleFrames({ by: null, from: null, to: { x: 2, y: 1 } }, 'none')[0]).toEqual({ transform: 'scale(0, 0)' });
  });
  it('ignores by when to is explicitly given, according to Office', () => {
    expect(pptxScaleFrames({ by: { x: 99, y: 99 }, from: { x: 1, y: 1 }, to: { x: 2, y: 0.5 } }, 'none')[1]).toEqual({ transform: 'scale(2, 0.5)' });
  });
  it.each([
    { by: null, from: null, to: null }, { by: null, from: { x: 1, y: 1 }, to: null },
    { by: { x: 2, y: 2 }, from: { x: 1, y: 1 }, to: null },
    { by: { x: -1, y: 1 }, from: null, to: null }, { by: { x: NaN, y: 1 }, from: null, to: null },
    { by: { x: Infinity, y: 1 }, from: null, to: null }, { by: { x: 1001, y: 1 }, from: null, to: null },
    { by: { x: 2, y: 1, extra: true }, from: null, to: null }, { by: { x: 2, y: 1 }, from: null, to: null, extra: true },
  ])('rejects unverified/invalid scale endpoints', values => {
    expect(() => pptxScaleFrames(values, 'none')).toThrow('PPTX_SCALE_UNVERIFIED');
  });
  it.each(['matrix(0,1,-1,0,0,0)', 'matrix(1,0,0,1,20,0)', 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)', 'url(remote)'])('does not silently drop baseline %s', baseline => {
    expect(() => pptxScaleFrames({ by: { x: 1.5, y: 1.5 }, from: null, to: null }, baseline)).toThrow('PPTX_SCALE_UNVERIFIED');
  });
});
describe('PPTX scale native frame delivery', () => {
  function setup() {
    const element = {} as Element, setKeyframes = vi.fn(), updateTiming = vi.fn(), cancel = vi.fn();
    const animation = { effect: { target: element, setKeyframes, updateTiming }, cancel } as unknown as Animation;
    const animations: Animation[] = [], root = { querySelector: () => element, getAnimations: () => [...animations] };
    const step: PptxTransformStep = { target: 5, effect: 'zoom', kind: 'emphasis', durationMs: 200, delayMs: 0, trigger: 'click' };
    const source: PptxScaleSource = { target: 5, durationMs: 200, delayMs: 0, trigger: 'click', values: { by: { x: 1.5, y: 0.5 }, from: null, to: null } };
    const sources = new Map([[step, source]]), playback = { cancel: vi.fn(), finished: Promise.resolve() }, start = vi.fn(() => { animations.push(animation); return playback; });
    vi.stubGlobal('getComputedStyle', () => ({ transform: 'none' }));
    return { root, step, sources, playback, start, setKeyframes, cancel };
  }
  it('keeps engine lifetime and replaces its wrong opacity frames', () => {
    const f = setup();
    expect(playPptxScaleGroup(f.root, [f.step], f.sources, f.start)).toBe(f.playback);
    expect(f.setKeyframes).toHaveBeenCalledWith([{ transform: 'scale(1, 1)' }, { transform: 'scale(1.5, 0.5)' }]);
    expect(f.cancel).not.toHaveBeenCalled();
  });
  it('rejects a changed engine effect before starting', () => {
    const f = setup(); f.step.effect = 'grow';
    expect(() => playPptxScaleGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_SCALE_UNVERIFIED');
    expect(f.start).not.toHaveBeenCalled();
  });
  it('cancels this run on native frame delivery failure', () => {
    const f = setup(); f.setKeyframes.mockImplementation(() => { throw Error('native'); });
    expect(() => playPptxScaleGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_SCALE_UNVERIFIED');
    expect(f.cancel).toHaveBeenCalled(); expect(f.playback.cancel).toHaveBeenCalled();
  });
});
