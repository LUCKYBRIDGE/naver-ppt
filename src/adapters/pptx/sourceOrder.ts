import type { AnimStep } from '@web-ppt/core';
import { readPptxMediaTiming, type PptxMediaTimingTarget } from './mediaTiming';
import { PPTX_LIMITS } from './packageGuard';

const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const children = (node: Element, tag: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === tag);
const fail = (): never => { throw Error('PPTX_SOURCE_ORDER_UNVERIFIED'); };
const id = (node: Element) => { const raw = node.getAttribute('id'); return raw && /^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 4294967295 ? Number(raw) : fail(); };
const descendants = (node: Element, tag: string) => [...node.getElementsByTagNameNS(ns, tag)];
export interface PptxSourceGroup { timingId: number; shapeSteps: number[]; media: PptxMediaTimingTarget[] }
export interface PptxSequenceControl { timingId: number; concurrent: boolean | null; nextAction: 'none' | 'seek' | 'unknown' | null;
  previousAction: 'none' | 'skipTimed' | 'unknown' | null; previous: { event: 'onPrev' | 'onNext' | 'unknown' | null; delayMs: number | 'indefinite' | null; slideTarget: boolean }[];
  next: PptxSequenceControl['previous']; subTimelineIds: number[]; hasEndSync: boolean }

export function inspectPptxSourceOrder(sourceXml: string, steps: readonly AnimStep[], signal?: AbortSignal) {
  if (sourceXml.length > PPTX_LIMITS.xml || /<!\s*(DOCTYPE|ENTITY)/i.test(sourceXml)) return fail();
  const xml = new DOMParser().parseFromString(sourceXml, 'application/xml');
  if (xml.getElementsByTagName('parsererror').length) return fail();
  return bindPptxSourceOrder(xml, steps, signal);
}

// Structural source/model alignment only. Groups are preserved even when the
// model has no corresponding steps. This does not authorize timeline execution.
export function bindPptxSourceOrder(xml: Document, steps: readonly AnimStep[], signal?: AbortSignal) {
  if (xml.documentElement.namespaceURI !== ns || xml.documentElement.localName !== 'sld') return fail();
  const detailed = readPptxMediaTiming(xml, signal);
  if (detailed.summary.invalidNodes || detailed.summary.unresolvedTargets || steps.length > 5000) return fail();
  const times = descendants(xml.documentElement, 'cTn'), timeMap = new Map(times.map(node => [id(node), node]));
  const mains = times.filter(node => node.getAttribute('nodeType') === 'mainSeq');
  if (mains.length > 1) return fail();
  const main = mains[0], groups: PptxSourceGroup[] = [], independentMedia: PptxMediaTimingTarget[] = [];
  const groupRoots = new Map<Element, PptxSourceGroup>();
  if (main) {
    if (main.parentElement?.namespaceURI !== ns || main.parentElement.localName !== 'seq') return fail();
    const lists = children(main, 'childTnLst'); if (lists.length !== 1) return fail();
    for (const container of lists[0]!.children) {
      if (container.namespaceURI !== ns || !['par', 'seq'].includes(container.localName)) return fail();
      const own = children(container, 'cTn'); if (own.length !== 1) return fail();
      const group = { timingId: id(own[0]!), shapeSteps: [] as number[], media: [] as PptxMediaTimingTarget[] };
      groups.push(group); groupRoots.set(own[0]!, group);
    }
  }
  const groupOf = (node: Element) => {
    for (let current: Element | null = node, depth = 0; current; current = current.parentElement) {
      if (++depth > 128) return fail();
      const group = groupRoots.get(current); if (group) return group;
    }
    return null;
  };
  for (const target of detailed.targets) {
    const node = timeMap.get(target.timingId); if (!node) return fail();
    const group = groupOf(node); (group?.media ?? independentMedia).push({ ...target });
  }
  const shapeEffects = times.filter(node => node.hasAttribute('presetClass') && node.getAttribute('presetClass') !== 'mediacall');
  if (shapeEffects.length !== steps.length) return fail();
  const kinds = { entr: 'entrance', exit: 'exit', emph: 'emphasis', path: 'motion' } as const;
  const triggers = { clickEffect: 'click', withEffect: 'withPrev', afterEffect: 'afterPrev' } as const;
  shapeEffects.forEach((effect, index) => {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    for (let parent = effect.parentElement; parent; parent = parent.parentElement) if (parent.namespaceURI === ns && parent.localName === 'cTn' && parent.hasAttribute('presetClass')) return fail();
    const rawKind = effect.getAttribute('presetClass')!, rawTrigger = effect.getAttribute('nodeType')!;
    const targets = new Set<number>();
    for (const behavior of descendants(effect, 'cBhvr')) {
      const target = children(behavior, 'tgtEl');
      if (target.length !== 1 || target[0]!.children.length !== 1) return fail();
      const shape = children(target[0]!, 'spTgt'); if (shape.length !== 1 || shape[0]!.children.length) return fail();
      const value = shape[0]!.getAttribute('spid'); if (!value || !/^\d+$/.test(value) || Number(value) <= 0 || Number(value) > 4294967295) return fail();
      targets.add(Number(value));
    }
    const step = steps[index]!, group = groupOf(effect);
    if (!group || !Object.hasOwn(kinds, rawKind) || !Object.hasOwn(triggers, rawTrigger) || targets.size !== 1
      || step.target !== [...targets][0] || step.kind !== kinds[rawKind as keyof typeof kinds] || step.trigger !== triggers[rawTrigger as keyof typeof triggers]) return fail();
    group.shapeSteps.push(index);
  });
  const sequences: PptxSequenceControl[] = descendants(xml.documentElement, 'seq').map(sequence => {
    const own = children(sequence, 'cTn'); if (own.length !== 1) return fail();
    const controls = (tag: string): PptxSequenceControl['previous'] => children(sequence, tag).flatMap(list => [...list.children].map(condition => {
      const evt = condition.getAttribute('evt'), delay = condition.getAttribute('delay');
      const target = children(condition, 'tgtEl');
      return { event: evt === null ? null : evt === 'onNext' || evt === 'onPrev' ? evt : 'unknown',
        delayMs: delay === 'indefinite' ? delay : delay !== null && /^\d+$/.test(delay) && Number(delay) <= 4294967295 ? Number(delay) : null,
        slideTarget: condition.namespaceURI === ns && condition.localName === 'cond' && condition.children.length === 1
          && target.length === 1 && target[0]!.children.length === 1 && children(target[0]!, 'sldTgt').length === 1 };
    }));
    const concurrent = sequence.getAttribute('concurrent'), next = sequence.getAttribute('nextAc'), previous = sequence.getAttribute('prevAc');
    return { timingId: id(own[0]!), concurrent: concurrent === null ? null : ['1', 'true'].includes(concurrent) ? true : ['0', 'false'].includes(concurrent) ? false : null,
      nextAction: next === null ? null : next === 'none' || next === 'seek' ? next : 'unknown',
      previousAction: previous === null ? null : previous === 'none' || previous === 'skipTimed' ? previous : 'unknown',
      previous: controls('prevCondLst'), next: controls('nextCondLst'),
      subTimelineIds: children(own[0]!, 'subTnLst').flatMap(list => descendants(list, 'cTn').map(id)),
      hasEndSync: children(own[0]!, 'endSync').length > 0 };
  });
  return { groups, independentMedia, sequences, timeNodes: detailed.timeNodes,
    mediaOnlyGroups: groups.filter(group => group.media.length && !group.shapeSteps.length).length,
    executionVerified: false as const };
}
