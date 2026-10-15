import { groupSteps, type AnimStep } from '@web-ppt/core';
import type { PptxSourceGroup } from './sourceOrder';

export interface PptxSourceShapeGroup { timingId: number; shapeGroup: number | null; shapeSteps: number[] }

// Exact grouping correspondence, not a timing support verdict. In particular,
// never infer a new click batch from trigger when the official model uses clickGroup.
export function bindPptxSourceShapeGroups(source: readonly Pick<PptxSourceGroup, 'timingId' | 'shapeSteps'>[], steps: readonly AnimStep[], signal?: AbortSignal): PptxSourceShapeGroup[] {
  const fail = (): never => { throw Error('PPTX_SOURCE_SHAPE_GROUPS_UNVERIFIED'); };
  const cancelled = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  cancelled();
  if (source.length > 5000 || steps.length > 5000 || new Set(steps).size !== steps.length
    || steps.some(step => step.clickGroup !== undefined && (!Number.isSafeInteger(step.clickGroup) || step.clickGroup < 0 || step.clickGroup >= 5000))) return fail();
  const indices = new Map(steps.map((step, index) => [step, index]));
  const official = groupSteps([...steps]).map(group => group.map(step => indices.get(step) ?? fail()));
  const ids = new Set<number>(), used = new Set<number>();
  let cursor = 0;
  const mapped = source.map(group => {
    cancelled();
    if (!Number.isSafeInteger(group.timingId) || group.timingId <= 0 || group.timingId > 4294967295 || ids.has(group.timingId)
      || group.shapeSteps.length > 5000) return fail();
    ids.add(group.timingId);
    if (!group.shapeSteps.length) return { timingId: group.timingId, shapeGroup: null, shapeSteps: [] };
    const expected = official[cursor];
    if (!expected || expected.length !== group.shapeSteps.length || group.shapeSteps.some((index, position) =>
      !Number.isSafeInteger(index) || index < 0 || index >= steps.length || used.has(index) || expected[position] !== index)) return fail();
    group.shapeSteps.forEach(index => used.add(index));
    return { timingId: group.timingId, shapeGroup: cursor++, shapeSteps: [...group.shapeSteps] };
  });
  if (cursor !== official.length || used.size !== steps.length) return fail();
  return mapped;
}
