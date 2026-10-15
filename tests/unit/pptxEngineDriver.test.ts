import { describe, expect, it, vi } from 'vitest';
import { createPptxEngineDriver } from '../../src/adapters/pptx/engineDriver';
import type { PptxTransformStep } from '../../src/adapters/pptx/transformBehavior';
vi.mock('../../src/adapters/pptx/rotationBehavior', () => ({ bindPptxRotations: () => new Map(), playPptxRotationGroup: (_root: unknown, _group: unknown, _sources: unknown, start: () => unknown) => start() }));
vi.mock('../../src/adapters/pptx/scaleBehavior', () => ({ bindPptxScales: () => new Map(), playPptxScaleGroup: (_root: unknown, _group: unknown, _sources: unknown, start: () => unknown) => start() }));
function fixture() {
  const steps: PptxTransformStep[] = [2, 3].map(target => ({ target, kind: 'entrance', effect: 'fade', durationMs: 200, delayMs: 0, trigger: 'click' }));
  const createState = vi.fn(() => ({ slide: { animations: steps }, animationTotal: 2, animationDone: 0, destroy: vi.fn(), playNextAnimation() { return this.animationDone < 2 ? [steps[this.animationDone++]!] : null; } }));
  const options = { root: { querySelector: vi.fn(), getAnimations: () => [] }, sourceXml: '<synthetic/>', createState, paint: vi.fn(), visible: vi.fn(), playGroup: vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() })) };
  return { options, steps, ...createPptxEngineDriver(options) };
}
describe('official PPTX engine checkpoint driver', () => {
  it('uses official state groups and delegates playback without scheduling itself', () => {
    const f = fixture(); expect(f.driver.totalGroups).toBe(2); expect(f.driver.targets).toEqual([2, 3]); f.driver.restore(1);
    const group = f.driver.next(); expect(group.start()).toHaveProperty('finished'); expect(f.options.playGroup).toHaveBeenCalledWith([f.steps[1]]); group.complete(); expect(f.options.visible).toHaveBeenCalledOnce();
  });
  it.each([-1, 3, NaN, 0.5])('rejects invalid restored cursor %s before repaint', done => {
    const f = fixture(); expect(() => f.driver.restore(done)).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.paint).not.toHaveBeenCalled();
  });
  it('rejects another model instance before repaint and releases the rejected state', () => {
    const f = fixture(), state = f.options.createState(); state.slide.animations = [...f.steps]; f.options.createState.mockReturnValueOnce(state);
    expect(() => f.driver.restore(1)).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(state.destroy).toHaveBeenCalledOnce(); expect(f.options.paint).not.toHaveBeenCalled();
  });
  it('rejects inconsistent engine group counts', () => {
    const f = fixture(), state = f.options.createState(); state.animationTotal = 1; f.options.createState.mockReturnValueOnce(state);
    expect(() => f.driver.restore(1)).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.paint).not.toHaveBeenCalled();
  });
  it('rejects an engine cursor that fails to advance', () => {
    const f = fixture(), state = f.options.createState(); state.playNextAnimation = () => [f.steps[0]!]; f.options.createState.mockReturnValueOnce(state);
    expect(() => f.driver.restore(1)).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.paint).not.toHaveBeenCalled();
  });
  it('does not start the same group twice or start an old restored group', () => {
    const f = fixture(), group = f.driver.next(); group.start(); expect(() => group.start()).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED');
    const old = f.driver.next(); f.driver.restore(0); expect(() => old.start()).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.playGroup).toHaveBeenCalledOnce();
  });
  it('disposes state exactly once and prevents deferred playback', () => {
    const f = fixture(), group = f.driver.next(), state = f.options.createState.mock.results[0]!.value; f.dispose(); f.dispose();
    expect(state.destroy).toHaveBeenCalledOnce(); expect(() => group.start()).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(() => f.driver.restore(0)).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.playGroup).not.toHaveBeenCalled();
  });
  it('rejects a foreign group even with the same target ID', () => {
    const f = fixture(), state = f.options.createState(); state.playNextAnimation = () => { state.animationDone++; return [{ ...f.steps[0]! }]; }; f.options.createState.mockReturnValueOnce(state); f.driver.restore(0);
    expect(() => f.driver.next()).toThrow('PPTX_ENGINE_MODEL_UNVERIFIED'); expect(f.options.playGroup).not.toHaveBeenCalled();
  });
});
