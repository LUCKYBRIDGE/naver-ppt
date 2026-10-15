import { pptxRepeatDuration, readPptxRepeatTiming, type PptxRepeatTiming } from './repeatTiming';
export const pptxTimingNamespace = 'http://schemas.openxmlformats.org/presentationml/2006/main';
export interface PptxTransformStep { target: number; kind: string; effect: string; durationMs: number; delayMs: number; trigger: string }
export interface PptxTransformSource { target: number; durationMs: number; delayMs: number; trigger: string; repeat?: PptxRepeatTiming }
export function rejectPptxTransform(code: string): never { throw new Error(code); }
export function pptxTimingDescendants(element: Element, name: string) { return [...element.getElementsByTagNameNS(pptxTimingNamespace, name)]; }
function only(element: Element, name: string, code: string) {
  const nodes = pptxTimingDescendants(element, name);
  return nodes.length === 1 ? nodes[0]! : rejectPptxTransform(code);
}
function numberAttribute(element: Element, name: string, code: string, fallback?: number) {
  const value = element.getAttribute(name);
  if (value === null && fallback !== undefined) return fallback;
  if (value === null || !/^\d+$/.test(value)) return rejectPptxTransform(code);
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : rejectPptxTransform(code);
}
export function readPptxTransformContext(effect: Element, options: { tag: string; preset: string; attributes: readonly string[]; vocabulary: readonly string[]; names: readonly string[] }, code: string) {
  const namespace = pptxTimingNamespace, fail = () => rejectPptxTransform(code);
  if (effect.namespaceURI !== namespace || effect.localName !== 'cTn' || effect.getAttribute('presetClass') !== 'emph' || effect.getAttribute('presetID') !== options.preset) return fail();
  if ([...effect.attributes].some(attribute => attribute.namespaceURI || !['id', 'presetClass', 'presetID', 'presetSubtype', 'nodeType', 'fill', 'repeatCount', 'autoRev', 'accel', 'decel'].includes(attribute.name)) || effect.hasAttribute('presetSubtype') && effect.getAttribute('presetSubtype') !== '0') return fail();
  const behavior = only(effect, options.tag, code), common = only(behavior, 'cBhvr', code), timing = only(common, 'cTn', code), target = only(common, 'spTgt', code);
  const behaviorNames = new Set(['anim', 'animRot', 'animScale', 'animClr', 'animMotion', 'animEffect', 'set', 'cmd', 'audio', 'video']);
  if (pptxTimingDescendants(effect, '*').filter(node => behaviorNames.has(node.localName)).length !== 1 || target.children.length) return fail();
  for (const attribute of [...behavior.attributes]) if (attribute.namespaceURI || !options.attributes.includes(attribute.name)) return fail();
  if ([...common.attributes].some(attribute => attribute.name !== 'additive' || attribute.value !== 'base')) return fail();
  const vocabulary = new Set(['childTnLst', options.tag, 'cBhvr', 'cTn', 'tgtEl', 'spTgt', 'attrNameLst', 'attrName', 'stCondLst', 'cond', ...options.vocabulary]);
  if ([...effect.getElementsByTagName('*')].some(node => node.namespaceURI !== namespace || !vocabulary.has(node.localName))) return fail();
  const names = pptxTimingDescendants(common, 'attrName');
  if (names.length !== options.names.length || names.some((node, index) => node.textContent !== options.names[index] || node.children.length)) return fail();
  if (timing.children.length || [...timing.attributes].some(attribute => attribute.namespaceURI || !['id', 'dur', 'fill', 'repeatCount', 'autoRev', 'accel', 'decel'].includes(attribute.name))) return fail();
  const owners = [timing, effect].filter(node => node.hasAttribute('repeatCount') || node.hasAttribute('autoRev'));
  if (owners.length > 1) return fail();
  let repeat: PptxRepeatTiming | undefined;
  try { if (owners[0]) repeat = readPptxRepeatTiming(owners[0].getAttribute('repeatCount'), owners[0].getAttribute('autoRev')); } catch { return fail(); }
  // Keep inherited timing conditions visible instead of flattening them into one click.
  for (let ancestor: Element | null = timing; ancestor && ancestor.localName !== 'timing'; ancestor = ancestor.parentElement) {
    if (ancestor.namespaceURI !== namespace) return fail();
    if (ancestor.localName !== 'cTn') continue;
    if (['repeatDur', 'spd', 'speed', 'tmFilter', 'restart', 'syncBehavior'].some(name => ancestor.hasAttribute(name))) return fail();
    if (['accel', 'decel'].some(name => ancestor.hasAttribute(name) && !['0', '0%'].includes(ancestor.getAttribute(name)!))) return fail();
    if (ancestor !== timing && ancestor !== effect && ['repeatCount', 'autoRev'].some(name => ancestor.hasAttribute(name))) return fail();
    if (ancestor.getAttribute('nodeType') === 'interactiveSeq' || ancestor.hasAttribute('fill') && ancestor.getAttribute('fill') !== 'hold') return fail();
    if (pptxTimingDescendants(ancestor, 'endCondLst').length) return fail();
    if (ancestor !== timing && ancestor !== effect && [...ancestor.children].some(child => ['stCondLst', 'iterate'].includes(child.localName))) return fail();
  }
  if (timing.getAttribute('fill') !== 'hold' || effect.getAttribute('fill') !== 'hold') return fail();
  const durationMs = numberAttribute(timing, 'dur', code), id = numberAttribute(target, 'spid', code);
  if (durationMs < 60 || durationMs > 10000 || id <= 0 || id > 4294967295) return fail();
  try { if (repeat) pptxRepeatDuration(durationMs, repeat); } catch { return fail(); }
  const conditions = [...effect.children].filter(node => node.localName === 'stCondLst');
  if (conditions.length > 1) return fail();
  const condition = conditions[0]?.children[0];
  if (conditions[0] && (conditions[0].children.length !== 1 || condition?.namespaceURI !== namespace || condition.localName !== 'cond' || condition.children.length || [...condition.attributes].some(attribute => attribute.name !== 'delay'))) return fail();
  const nodeType = effect.getAttribute('nodeType');
  if (!['clickEffect', 'withEffect', 'afterEffect'].includes(nodeType ?? '')) return fail();
  return { behavior, target: id, durationMs, ...(repeat ? { repeat } : {}), delayMs: condition ? numberAttribute(condition, 'delay', code, 0) : 0, trigger: nodeType === 'withEffect' ? 'withPrev' : nodeType === 'afterEffect' ? 'afterPrev' : 'click' };
}
export function pptxBaseline(baseline: string, code: string) {
  const matrix = /^matrix\(([^)]+)\)$/.exec(baseline), numbers = matrix?.[1]?.split(',').map(token => token.trim());
  if (baseline !== 'none' && (!numbers || numbers.length !== 6 || !numbers.every(token => /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(token) && Number.isFinite(Number(token)) && Math.abs(Number(token)) <= 1000000))) return rejectPptxTransform(code);
  return { identity: baseline === 'none' || !!numbers?.every((token, index) => Number(token) === [1, 0, 0, 1, 0, 0][index]) };
}
function sameStep(step: PptxTransformStep, source: PptxTransformSource, effect: string) {
  return Number.isSafeInteger(step.target) && step.target > 0 && step.target <= 4294967295 && step.kind === 'emphasis' && step.effect === effect && step.target === source.target && step.durationMs === source.durationMs && step.delayMs === source.delayMs && step.trigger === source.trigger;
}
export function bindPptxTransforms<S extends PptxTransformSource>(slideXml: string, steps: readonly PptxTransformStep[], tag: string, effectName: string, read: (element: Element) => S, code: string): Map<PptxTransformStep, S> {
  const fail = () => rejectPptxTransform(code);
  if (slideXml.length > 4 * 1024 * 1024 || /<!\s*(DOCTYPE|ENTITY)/i.test(slideXml)) return fail();
  const xml = new DOMParser().parseFromString(slideXml, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length || xml.documentElement.namespaceURI !== pptxTimingNamespace || xml.documentElement.localName !== 'sld') return fail();
  const effects = [...xml.getElementsByTagNameNS(pptxTimingNamespace, 'cTn')].filter(node => node.hasAttribute('presetClass'));
  const result = new Map<PptxTransformStep, S>();
  if (!xml.getElementsByTagNameNS(pptxTimingNamespace, tag).length) return result;
  if (effects.length !== steps.length || effects.length > 5000) return fail();
  effects.forEach((effect, index) => {
    if (!pptxTimingDescendants(effect, tag).length) return;
    const source = read(effect), step = steps[index]!;
    if (!sameStep(step, source, effectName) || result.has(step)) return fail();
    result.set(step, source);
  });
  if (result.size !== xml.getElementsByTagNameNS(pptxTimingNamespace, tag).length) return fail();
  return result;
}
export type PptxAnimationRoot = Pick<HTMLElement, 'querySelector' | 'getAnimations'>;
export type PptxPlayback = { cancel(): void; finished: Promise<unknown> };
export function playPptxTransforms<S extends PptxTransformSource, T extends PptxPlayback>(root: PptxAnimationRoot, steps: readonly PptxTransformStep[], sources: ReadonlyMap<PptxTransformStep, S>, effectName: string, frames: (source: S, baseline: string) => Keyframe[], start: () => T, code: string): T {
  const fail = () => rejectPptxTransform(code);
  const plans = steps.filter(step => sources.has(step)).map(step => {
    const source = sources.get(step)!;
    if (!sameStep(step, source, effectName) || steps.filter(other => other.target === step.target).length !== 1) return fail();
    const element = root.querySelector(`[data-el="${step.target}"]`);
    if (!element) return fail();
    return { element, frames: frames(source, getComputedStyle(element).transform) };
  });
  if (!plans.length) return start();
  const before = new Set(root.getAnimations({ subtree: true }));
  let playback: T | undefined;
  try {
    playback = start();
    const created = root.getAnimations({ subtree: true }).filter(animation => !before.has(animation));
    const updates = plans.map(plan => {
      const matching = created.filter(animation => (animation.effect as KeyframeEffect | null)?.target === plan.element);
      if (matching.length !== 1 || typeof (matching[0]!.effect as KeyframeEffect).setKeyframes !== 'function' || typeof matching[0]!.effect?.updateTiming !== 'function') return fail();
      return { effect: matching[0]!.effect as KeyframeEffect, frames: plan.frames };
    });
    updates.forEach(update => {
      update.effect.setKeyframes(update.frames);
      update.effect.updateTiming({ easing: 'linear' });
    });
    return playback;
  } catch {
    try { playback?.cancel(); } catch { /* Native cleanup must still run. */ }
    for (const animation of root.getAnimations({ subtree: true })) if (!before.has(animation)) { try { animation.cancel(); } catch { /* Continue cleanup. */ } }
    return fail();
  }
}
