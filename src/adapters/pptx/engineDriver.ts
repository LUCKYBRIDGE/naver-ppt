import { validatePptxCheckpointModel, type PptxCheckpointDriver } from './durablePlayback';
import { bindPptxRotations, playPptxRotationGroup } from './rotationBehavior';
import { bindPptxScales, playPptxScaleGroup } from './scaleBehavior';
import { playPptxRepeatedGroup } from './repeatTiming';
import type { PptxAnimationRoot, PptxTransformStep, PptxTransformSource } from './transformBehavior';
import type { PptxAnimationPlayback } from './animationRun';

export interface PptxEngineState<S extends PptxTransformStep> {
  slide: { animations?: readonly S[] };
  animationTotal: number;
  animationDone: number;
  playNextAnimation(): readonly S[] | null;
  destroy(): void;
}
export function createPptxEngineDriver<S extends PptxTransformStep, State extends PptxEngineState<S>>(options: {
  root: PptxAnimationRoot;
  sourceXml: string;
  createState(): State;
  paint(state: State): void;
  visible(state: State): void;
  playGroup(group: readonly S[]): PptxAnimationPlayback;
}): { driver: PptxCheckpointDriver; dispose(): void } {
  const fail = (): never => { throw Error('PPTX_ENGINE_MODEL_UNVERIFIED'); };
  let state = options.createState(), disposed = false;
  const modelAnimations = state.slide.animations, steps = modelAnimations ?? [], totalGroups = state.animationTotal, targets = steps.map(step => step.target);
  let rotations: ReturnType<typeof bindPptxRotations>, scales: ReturnType<typeof bindPptxScales>;
  try {
    validatePptxCheckpointModel(null, totalGroups, targets);
    if (state.animationDone !== 0) fail();
    rotations = bindPptxRotations(options.sourceXml, steps); scales = bindPptxScales(options.sourceXml, steps);
  } catch (error) { state.destroy(); throw error; }
  const sources = new Map<PptxTransformStep, PptxTransformSource>([...rotations, ...scales]);
  const driver: PptxCheckpointDriver = {
    totalGroups, targets,
    restore(done) {
      if (disposed || !Number.isSafeInteger(done) || done < 0 || done > totalGroups) return fail();
      const next = options.createState();
      try {
        if (next.animationDone !== 0 || next.animationTotal !== totalGroups || next.slide.animations !== modelAnimations) fail();
        for (let i = 0; i < done; i++) if (!next.playNextAnimation() || next.animationDone !== i + 1) fail();
        options.paint(next);
      } catch (error) { next.destroy(); throw error; }
      const previous = state; state = next; previous.destroy();
    },
    next() {
      if (disposed || state.animationDone >= totalGroups) return fail();
      const current = state, before = current.animationDone, group = current.playNextAnimation();
      if (!group?.length || current.animationDone !== before + 1 || group.some(step => !steps.includes(step))) return fail();
      let started = false;
      return {
        start() {
          if (disposed || state !== current || started) return fail();
          started = true;
          return playPptxRepeatedGroup(options.root, group, sources, projected => playPptxRotationGroup(options.root, group, rotations,
            () => playPptxScaleGroup(options.root, group, scales, () => options.playGroup(projected as readonly S[]))));
        },
        complete() { if (disposed || state !== current || !started) return fail(); options.visible(current); },
      };
    },
  };
  return { driver, dispose() { if (disposed) return; disposed = true; state.destroy(); } };
}
