import { describe, expect, it, vi } from 'vitest';
import { playPptxRepeatedGroup, pptxRepeatDuration, projectPptxRepeatGroup, readPptxRepeatTiming } from '../../src/adapters/pptx/repeatTiming';
import type { PptxTransformSource, PptxTransformStep } from '../../src/adapters/pptx/transformBehavior';
describe('PPTX bounded repeat timing', () => {
  it.each([[null, null, 1, false], ['2000', null, 2, false], ['2500', '1', 2.5, true], ['1', 'false', 0.001, false], [null, 'true', 1, true], ['1000', '0', 1, false]] as const)('reads count %s reverse %s', (count, reverse, expectedCount, autoReverse) => {
    expect(readPptxRepeatTiming(count, reverse)).toEqual({ count: expectedCount, autoReverse });
  });
  it.each(['indefinite', '0', '-1000', '1.5', '1e3', ' 2000', '100001', 'Infinity', '9007199254740992'])('rejects count %s', count => {
    expect(() => readPptxRepeatTiming(count, null)).toThrow('PPTX_REPEAT_UNVERIFIED');
  });
  it.each(['2', 'True', 'yes', ' true', ''])('rejects reverse %s', reverse => {
    expect(() => readPptxRepeatTiming(null, reverse)).toThrow('PPTX_REPEAT_UNVERIFIED');
  });
  it.each([[2, false, 400], [2, true, 800], [2.5, false, 500], [2.5, true, 1000]] as const)('projects %s repeats / reverse %s', (count, autoReverse, active) => {
    expect(pptxRepeatDuration(200, { count, autoReverse })).toBe(active);
  });
  it.each([0, -1, NaN, Infinity, 59, 10001])('rejects invalid single duration %s', duration => {
    expect(() => pptxRepeatDuration(duration, { count: 1, autoReverse: false })).toThrow('PPTX_REPEAT_UNVERIFIED');
  });
  it('rejects excessive total active duration and malformed repeat contracts', () => {
    expect(() => pptxRepeatDuration(10000, { count: 100, autoReverse: true })).toThrow('PPTX_REPEAT_UNVERIFIED');
    expect(() => pptxRepeatDuration(200, { count: 0, autoReverse: false })).toThrow('PPTX_REPEAT_UNVERIFIED');
    expect(() => pptxRepeatDuration(200, { count: 2, autoReverse: 'true' } as never)).toThrow('PPTX_REPEAT_UNVERIFIED');
    expect(() => pptxRepeatDuration(200, { count: 2, autoReverse: false, extra: 1 } as never)).toThrow('PPTX_REPEAT_UNVERIFIED');
  });
});
describe('PPTX repeat projection into proven grouping engine', () => {
  const first: PptxTransformStep = { target: 3, kind: 'emphasis', effect: 'spin', durationMs: 200, delayMs: 0, trigger: 'click' };
  const next: PptxTransformStep = { target: 5, kind: 'emphasis', effect: 'zoom', durationMs: 200, delayMs: 50, trigger: 'afterPrev' };
  const source: PptxTransformSource = { target: 3, durationMs: 200, delayMs: 0, trigger: 'click', repeat: { count: 2, autoReverse: true } };
  it('passes expanded duration without changing source steps or next trigger/delay', () => {
    const projected = projectPptxRepeatGroup([first, next], new Map([[first, source]]));
    expect(projected[0]!.durationMs).toBe(800); expect(first.durationMs).toBe(200); expect(projected[1]).toBe(next);
  });
  it('rejects same-target overlap and mismatched source', () => {
    expect(() => projectPptxRepeatGroup([first, { ...first }], new Map([[first, source]]))).toThrow('PPTX_REPEAT_UNVERIFIED');
    expect(() => projectPptxRepeatGroup([first], new Map([[first, { ...source, target: 4 }]]))).toThrow('PPTX_REPEAT_UNVERIFIED');
  });
  it('updates only new native timing while preserving engine delay/easing/fill', () => {
    const element = {} as Element, updateTiming = vi.fn(), cancel = vi.fn(), animation = { effect: { target: element, updateTiming }, cancel } as unknown as Animation;
    const existing = { effect: { target: element }, cancel: vi.fn() } as unknown as Animation, animations = [existing];
    const root = { querySelector: () => element, getAnimations: () => [...animations] }, playback = { cancel: vi.fn(), finished: Promise.resolve() };
    expect(playPptxRepeatedGroup(root, [first, next], new Map([[first, source]]), projected => { expect(projected[0]!.durationMs).toBe(800); animations.push(animation); return playback; })).toBe(playback);
    expect(updateTiming).toHaveBeenCalledWith({ duration: 200, iterations: 4, direction: 'alternate' });
    expect(existing.cancel).not.toHaveBeenCalled(); expect(cancel).not.toHaveBeenCalled();
  });
  it('does not silently continue when native updateTiming fails', () => {
    const element = {} as Element, cancel = vi.fn(), animation = { effect: { target: element, updateTiming: () => { throw Error('native'); } }, cancel } as unknown as Animation, animations: Animation[] = [];
    const root = { querySelector: () => element, getAnimations: () => [...animations] }, playback = { cancel: vi.fn(), finished: Promise.resolve() };
    expect(() => playPptxRepeatedGroup(root, [first], new Map([[first, source]]), () => { animations.push(animation); return playback; })).toThrow('PPTX_REPEAT_UNVERIFIED');
    expect(cancel).toHaveBeenCalled(); expect(playback.cancel).toHaveBeenCalled();
  });
});
