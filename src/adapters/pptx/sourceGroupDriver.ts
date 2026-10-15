import type { PptxAnimationPlayback } from './animationRun';
import { validatePptxCheckpointModel, type PptxCheckpointDriver } from './durablePlayback';

// The caller must separately verify source timing and bind native media actions.
// This cursor adapter does not authorize sourceOrder diagnostic groups to run.
export interface PptxExecutableSourceGroup {
  timingId: number;
  shapeGroup: number | null;
  startMedia?: () => PptxAnimationPlayback;
}

export function createPptxSourceGroupDriver(shape: PptxCheckpointDriver, input: readonly PptxExecutableSourceGroup[]): PptxCheckpointDriver {
  const fail = (): never => { throw Error('PPTX_SOURCE_GROUP_UNVERIFIED'); };
  validatePptxCheckpointModel(null, shape.totalGroups, shape.targets);
  if (shape.renderer && shape.renderer !== 'web-ppt-0.4.5/transform-v1' || input.length > 5000) return fail();
  const groups = input.map(group => ({ ...group })), ids = new Set<number>();
  let expected = 0;
  for (const group of groups) {
    if (!Number.isSafeInteger(group.timingId) || group.timingId <= 0 || group.timingId > 4294967295 || ids.has(group.timingId)
      || group.startMedia !== undefined && typeof group.startMedia !== 'function'
      || group.shapeGroup === null && !group.startMedia) return fail();
    ids.add(group.timingId);
    if (group.shapeGroup !== null && group.shapeGroup !== expected++) return fail();
  }
  if (expected !== shape.totalGroups) return fail();
  const prefix = [0];
  for (const group of groups) prefix.push(prefix[prefix.length - 1]! + (group.shapeGroup === null ? 0 : 1));
  let cursor = 0, generation = 0;
  return {
    renderer: 'web-ppt-0.4.5/source-v1', totalGroups: groups.length, targets: [...shape.targets],
    restore(done) {
      if (!Number.isSafeInteger(done) || done < 0 || done > groups.length) return fail();
      generation++;
      shape.restore(prefix[done]!);
      cursor = done;
    },
    next() {
      if (cursor >= groups.length) return fail();
      const group = groups[cursor++]!, epoch = ++generation;
      const visual = group.shapeGroup === null ? null : shape.next();
      let started = false, completed = false, cancelled = false;
      return {
        start() {
          if (epoch !== generation || started) return fail();
          started = true;
          const owned: PptxAnimationPlayback[] = [];
          const cancel = () => {
            if (cancelled) return; cancelled = true;
            for (const playback of owned) { try { playback.cancel(); } catch { /* Clean up every owned action. */ } }
          };
          try {
            if (visual) owned.push(visual.start());
            if (group.startMedia) owned.push(group.startMedia());
            return { finished: Promise.all(owned.map(playback => playback.finished)).then(() => undefined, error => { cancel(); throw error; }), cancel };
          } catch (error) { cancel(); throw error; }
        },
        complete() {
          if (epoch !== generation || !started || completed || cancelled) return fail();
          completed = true; visual?.complete();
        },
      };
    },
  };
}
