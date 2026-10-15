import { describe, expect, it } from 'vitest';
import type { AnimStep } from '@web-ppt/core';
import { bindPptxSourceShapeGroups } from '../../src/adapters/pptx/sourceShapeGroups';
const step = (target: number, clickGroup?: number): AnimStep => ({ target, ...(clickGroup === undefined ? {} : { clickGroup }), trigger: 'click', kind: 'entrance', effect: 'fade', durationMs: 200, delayMs: 0 });
const group = (timingId: number, shapeSteps: number[]) => ({ timingId, shapeSteps });
describe('exact source to official shape group binding', () => {
  it('retains media-only positions around an exact official group', () => {
    const source = [group(20, []), group(30, [0, 1]), group(40, [])], steps = [step(2, 0), step(3, 0)];
    const mapped = bindPptxSourceShapeGroups(source, steps);
    expect(mapped.map(group => group.shapeGroup)).toEqual([null, 0, null]);
    source[1]!.shapeSteps.length = 0; expect(mapped[1]!.shapeSteps).toEqual([0, 1]);
  });
  it('uses official clickGroup batches rather than guessing from trigger', () => {
    expect(bindPptxSourceShapeGroups([group(1, [0, 1])], [step(2), step(3)])).toMatchObject([{ shapeGroup: 0 }]);
    expect(() => bindPptxSourceShapeGroups([group(1, [0]), group(2, [1])], [step(2), step(3)])).toThrow('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED');
  });
  it('accepts sparse official batch numbers without inventing intervening clicks', () => {
    expect(bindPptxSourceShapeGroups([group(1, [0]), group(2, []), group(3, [1])], [step(2, 3), step(3, 9)]).map(group => group.shapeGroup)).toEqual([0, null, 1]);
  });
  it.each(['split', 'merge', 'reorder', 'missing', 'duplicate'] as const)('rejects %s correspondence instead of silently changing click order', boundary => {
    let steps = [step(2, 0), step(3, 1)], source = [group(1, [0]), group(2, [1])];
    if (boundary === 'split') steps = [step(2, 0), step(3, 0)];
    if (boundary === 'merge') source = [group(1, [0, 1])];
    if (boundary === 'reorder') source = [group(1, [1]), group(2, [0])];
    if (boundary === 'missing') source.pop();
    if (boundary === 'duplicate') source = [group(1, [0]), group(2, [0])];
    expect(() => bindPptxSourceShapeGroups(source, steps)).toThrow('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED');
  });
  it.each([-1, 5000, 1e9, NaN, 0.5])('bounds unsafe official batch %s before allocating a sparse engine array', batch => {
    expect(() => bindPptxSourceShapeGroups([group(1, [0])], [step(2, batch)])).toThrow('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED');
  });
  it('rejects duplicate model object identities and timing IDs', () => {
    const value = step(2, 0);
    expect(() => bindPptxSourceShapeGroups([group(1, [0, 1])], [value, value])).toThrow('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED');
    expect(() => bindPptxSourceShapeGroups([group(1, []), group(1, [])], [])).toThrow('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED');
  });
  it('retains an all-media source and respects cancellation even with no model effects', () => {
    expect(bindPptxSourceShapeGroups([group(1, []), group(2, [])], []).map(group => group.shapeGroup)).toEqual([null, null]);
    const controller = new AbortController(); controller.abort(); expect(() => bindPptxSourceShapeGroups([], [], controller.signal)).toThrow('Cancelled');
  });
});
