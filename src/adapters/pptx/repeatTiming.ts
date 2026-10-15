import type { PptxAnimationRoot, PptxPlayback, PptxTransformSource, PptxTransformStep } from './transformBehavior';
export interface PptxRepeatTiming { count: number; autoReverse: boolean }
const code = 'PPTX_REPEAT_UNVERIFIED';
const fail = (): never => { throw new Error(code); };
export function readPptxRepeatTiming(count: string | null, reverse: string | null): PptxRepeatTiming {
  if (count !== null && !/^\d+$/.test(count) || reverse !== null && !['true', 'false', '1', '0'].includes(reverse)) return fail();
  const units = count === null ? 1000 : Number(count);
  if (!Number.isSafeInteger(units) || units <= 0 || units > 100000) return fail();
  return { count: units / 1000, autoReverse: reverse === 'true' || reverse === '1' };
}
export function pptxRepeatDuration(durationMs: number, repeat: PptxRepeatTiming) {
  if (!Number.isFinite(durationMs) || durationMs < 60 || durationMs > 10000 || !repeat || Object.keys(repeat).length !== 2 || !Object.hasOwn(repeat, 'count') || !Object.hasOwn(repeat, 'autoReverse') || !Number.isFinite(repeat.count) || repeat.count < 0.001 || repeat.count > 100 || typeof repeat.autoReverse !== 'boolean') return fail();
  const active = durationMs * repeat.count * (repeat.autoReverse ? 2 : 1);
  return active > 0 && active <= 120000 ? active : fail();
}
export function projectPptxRepeatGroup(steps: readonly PptxTransformStep[], sources: ReadonlyMap<PptxTransformStep, PptxTransformSource>): PptxTransformStep[] {
  return steps.map(step => {
    const source = sources.get(step);
    if (!source?.repeat) return step;
    if (source.target !== step.target || source.durationMs !== step.durationMs || source.delayMs !== step.delayMs || source.trigger !== step.trigger || !Number.isSafeInteger(step.target) || step.target <= 0 || step.target > 4294967295 || steps.filter(other => other.target === step.target).length !== 1) return fail();
    return { ...step, durationMs: pptxRepeatDuration(source.durationMs, source.repeat) };
  });
}
export function playPptxRepeatedGroup<T extends PptxPlayback>(root: PptxAnimationRoot, steps: readonly PptxTransformStep[], sources: ReadonlyMap<PptxTransformStep, PptxTransformSource>, start: (projected: readonly PptxTransformStep[]) => T): T {
  const projected = projectPptxRepeatGroup(steps, sources);
  const plans = steps.filter(step => sources.get(step)?.repeat).map(step => {
    const element = root.querySelector(`[data-el="${step.target}"]`), source = sources.get(step)!;
    if (!element) return fail();
    return { element, durationMs: source.durationMs, repeat: source.repeat! };
  });
  if (!plans.length) return start(projected);
  const existing = new Set(root.getAnimations({ subtree: true }));
  let playback: T | undefined;
  try {
    // The proven engine schedules afterPrev against the expanded active duration.
    playback = start(projected);
    const created = root.getAnimations({ subtree: true }).filter(animation => !existing.has(animation));
    const updates = plans.map(plan => {
      const matching = created.filter(animation => (animation.effect as KeyframeEffect | null)?.target === plan.element);
      if (matching.length !== 1 || typeof matching[0]!.effect?.updateTiming !== 'function') return fail();
      return { effect: matching[0]!.effect!, ...plan };
    });
    updates.forEach(plan => plan.effect.updateTiming({ duration: plan.durationMs, iterations: plan.repeat.count * (plan.repeat.autoReverse ? 2 : 1), direction: plan.repeat.autoReverse ? 'alternate' : 'normal' }));
    return playback;
  } catch {
    try { playback?.cancel(); } catch { /* Native cancellation must still run. */ }
    for (const animation of root.getAnimations({ subtree: true })) if (!existing.has(animation)) { try { animation.cancel(); } catch { /* Continue cleanup. */ } }
    return fail();
  }
}
