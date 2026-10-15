import { afterEach, describe, expect, it, vi } from 'vitest';
import { parsePptxAngle, playPptxRotationGroup, pptxRotationFrames, type PptxRotationSource, type PptxRotationStep } from '../../src/adapters/pptx/rotationBehavior';
afterEach(() => vi.unstubAllGlobals());

describe('PPTX source rotation values', () => {
  it.each([[null, null], ['5400000', 90], ['-5400000', -90], ['43200000', 720], ['+30000', 0.5], ['0', 0], ['2147483647', 2147483647 / 60000], ['-2147483648', -2147483648 / 60000]] as const)('reads %s without angle normalization', (raw, expected) => {
    expect(parsePptxAngle(raw)).toBe(expected);
  });
  it.each(['', '90deg', '1.5', '6e4', ' 60000', '60000 ', 'Infinity', '2147483648', '-2147483649', '9007199254740992'])('rejects malformed/out-of-schema angle %s', raw => {
    expect(() => parsePptxAngle(raw)).toThrow('PPTX_ROTATION_UNVERIFIED');
  });
  it('passes clockwise relative and multi-turn frames to WAAPI', () => {
    expect(pptxRotationFrames({ by: 720, from: null, to: null }, 'none')).toEqual([{ transform: 'rotate(0deg)' }, { transform: 'rotate(720deg)' }]);
  });
  it('preserves a completed 2D baseline for relative rotation', () => {
    expect(pptxRotationFrames({ by: -90, from: null, to: null }, 'matrix(0, 1, -1, 0, 240, 0)')).toEqual([
      { transform: 'matrix(0, 1, -1, 0, 240, 0) rotate(0deg)' }, { transform: 'matrix(0, 1, -1, 0, 240, 0) rotate(-90deg)' },
    ]);
  });
  it.each([
    [{ by: null, from: -45, to: 90 }, -45, 90],
    [{ by: 90, from: -45, to: null }, -45, 45],
    [{ by: null, from: null, to: -180 }, 0, -180],
  ] as const)('preserves explicit endpoints', (values, from, to) => {
    expect(pptxRotationFrames(values, 'matrix(1,0,0,1,0,0)')).toEqual([{ transform: `rotate(${from}deg)` }, { transform: `rotate(${to}deg)` }]);
  });
  it.each([
    { by: null, from: null, to: null }, { by: null, from: 90, to: null }, { by: 90, from: null, to: 180 },
    { by: NaN, from: null, to: null }, { by: Infinity, from: null, to: null }, { by: 40000, from: null, to: null }, { by: 2147483648 / 60000, from: null, to: null },
    { by: 90, from: null, to: null, injected: true },
  ])('rejects ambiguous/malformed values', values => {
    expect(() => pptxRotationFrames(values, 'none')).toThrow('PPTX_ROTATION_UNVERIFIED');
  });
  it.each(['url(https://example.invalid)', 'rotate(90deg)', 'matrix(1,0,0,1,NaN,0)', 'matrix(1,0,0,1,0)', 'matrix(1,0,0,1,1000001,0)', 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)'])('rejects unverified baseline %s', baseline => {
    expect(() => pptxRotationFrames({ by: 90, from: null, to: null }, baseline)).toThrow('PPTX_ROTATION_UNVERIFIED');
  });
  it('does not replace an existing transform for absolute endpoints', () => {
    expect(() => pptxRotationFrames({ by: null, from: 0, to: 90 }, 'matrix(0,1,-1,0,0,0)')).toThrow('PPTX_ROTATION_UNVERIFIED');
  });
});

describe('PPTX rotation adaptation of proven engine playback', () => {
  function setup() {
    const element = {} as Element;
    const prior = { effect: { target: element }, cancel: vi.fn() } as unknown as Animation;
    const frames = vi.fn(), updateTiming = vi.fn(), created = { effect: { target: element, setKeyframes: frames, updateTiming }, cancel: vi.fn() } as unknown as Animation;
    const animations = [prior], querySelector = vi.fn(() => element);
    const root = { querySelector, getAnimations: () => [...animations] };
    const step: PptxRotationStep = { target: 3, kind: 'emphasis', effect: 'spin', durationMs: 200, delayMs: 0, trigger: 'click' };
    const source: PptxRotationSource = { target: 3, values: { by: 90, from: null, to: null }, durationMs: 200, delayMs: 0, trigger: 'click' };
    const sources = new Map([[step, source]]), playback = { cancel: vi.fn(), finished: Promise.resolve() };
    const start = vi.fn(() => { animations.push(created); return playback; });
    vi.stubGlobal('getComputedStyle', () => ({ transform: 'none' }));
    return { element, prior, created, frames, updateTiming, animations, root, step, source, sources, playback, start };
  }
  it('changes only the newly created target keyframes and returns engine lifetime', () => {
    const f = setup();
    expect(playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toBe(f.playback);
    expect(f.frames).toHaveBeenCalledWith([{ transform: 'rotate(0deg)' }, { transform: 'rotate(90deg)' }]);
    expect(f.updateTiming).toHaveBeenCalledWith({ easing: 'linear' });
    expect(f.prior.cancel).not.toHaveBeenCalled(); expect(f.created.cancel).not.toHaveBeenCalled();
  });
  it('does not intercept ordinary engine groups', () => {
    const f = setup();
    playPptxRotationGroup(f.root, [f.step], new Map(), f.start);
    expect(f.frames).not.toHaveBeenCalled(); expect(f.root.querySelector).not.toHaveBeenCalled();
  });
  it('rejects concurrent duplicate targets before starting', () => {
    const f = setup();
    expect(() => playPptxRotationGroup(f.root, [f.step, { ...f.step }], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.start).not.toHaveBeenCalled();
  });
  it('rejects missing targets before starting', () => {
    const f = setup(); f.root.querySelector.mockReturnValue(null as unknown as Element);
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.start).not.toHaveBeenCalled();
  });
  it.each(['target', 'durationMs', 'delayMs', 'trigger'] as const)('rejects a mismatched source %s', key => {
    const f = setup(); f.sources.set(f.step, { ...f.source, [key]: key === 'trigger' ? 'afterPrev' : 999 });
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.start).not.toHaveBeenCalled();
  });
  it('rejects unsupported native effects and cancels only this run', () => {
    const f = setup(); (f.created.effect as unknown as { setKeyframes: unknown }).setKeyframes = undefined;
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.playback.cancel).toHaveBeenCalled(); expect(f.created.cancel).toHaveBeenCalled(); expect(f.prior.cancel).not.toHaveBeenCalled();
  });
  it('cancels new native animations when engine creation throws', () => {
    const f = setup();
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, () => { f.start(); throw Error('engine'); })).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.created.cancel).toHaveBeenCalled(); expect(f.prior.cancel).not.toHaveBeenCalled();
  });
  it('cancels a partially updated group when native frame replacement fails', () => {
    const f = setup(); f.frames.mockImplementation(() => { throw Error('native'); });
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.created.cancel).toHaveBeenCalled(); expect(f.prior.cancel).not.toHaveBeenCalled();
  });
  it('cleans up when native timing replacement fails', () => {
    const f = setup(); f.updateTiming.mockImplementation(() => { throw Error('native'); });
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.playback.cancel).toHaveBeenCalled(); expect(f.created.cancel).toHaveBeenCalled(); expect(f.prior.cancel).not.toHaveBeenCalled();
  });
  it('rejects an effect without native timing replacement', () => {
    const f = setup(); (f.created.effect as unknown as { updateTiming: unknown }).updateTiming = undefined;
    expect(() => playPptxRotationGroup(f.root, [f.step], f.sources, f.start)).toThrow('PPTX_ROTATION_UNVERIFIED');
    expect(f.created.cancel).toHaveBeenCalled(); expect(f.prior.cancel).not.toHaveBeenCalled();
  });
});
