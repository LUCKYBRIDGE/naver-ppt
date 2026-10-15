import type { AnimStep } from '@web-ppt/core';
import type { PlayerSnapshot } from '../../core/playerSnapshot';
import { isMediaPlayback, mediaPlayback } from '../../media/validation';
import { bindPptxMediaTimingTargets, type BoundPptxMediaTimingTarget } from './mediaTimingBinding';
import { bindPptxSourceMediaCalls } from './sourceMediaCalls';
import { bindPptxSourceOrder } from './sourceOrder';
import { bindPptxSourceShapeGroups } from './sourceShapeGroups';
import { readPptxMediaTimelineControls } from './mediaTimelineControls';
import { createPptxMediaCallDelayReader } from './mediaCallDelay';
import { readPptxSourceMediaSettings, sourceMediaPlayback } from './sourceMediaSettings';
import { PPTX_LIMITS } from './packageGuard';

const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const fail = (): never => { throw Error('PPTX_SOURCE_TIMELINE_UNVERIFIED'); };
export const sourceTimelineMediaBinding = (ref: PlayerSnapshot['media'][number]['ref']) => JSON.stringify([
  ref.id, ref.slideId, ref.kind, ref.mime, ref.durationSec, ref.fingerprint,
  ref.embeddedSource?.sourceFingerprint, ref.embeddedSource?.sourcePart, ref.embeddedSource?.elementPath,
]);
const attributes = (node: Element, allowed: readonly string[]) => {
  if ([...node.attributes].some(attribute => attribute.namespaceURI || !allowed.includes(attribute.name))) fail();
};
const exactChildren = (node: Element, names: readonly string[]) => {
  if (node.children.length !== names.length || names.some(name => [...node.children].filter(child => child.namespaceURI === ns && child.localName === name).length !== 1)) fail();
};
// Validate the whole media-only branch, not merely the ancestry of a known cmd.
// Hidden behaviors/unknown common attributes must not be silently discarded.
function mediaBranch(node: Element) {
  if (node.namespaceURI !== ns) return fail();
  const name = node.localName;
  if (name === 'par') { attributes(node, []); exactChildren(node, ['cTn']); }
  else if (name === 'childTnLst') {
    attributes(node, []);
    if (!node.children.length || [...node.children].some(child => !['par', 'cmd'].includes(child.localName))) return fail();
  } else if (name === 'cTn') {
    attributes(node, ['id', 'nodeType', 'dur', 'fill', 'repeatCount', 'autoRev']);
    if (![null, 'hold', 'freeze', 'remove'].includes(node.getAttribute('fill'))) return fail();
    exactChildren(node, node.parentElement?.localName === 'cBhvr' ? ['stCondLst'] : ['stCondLst', 'childTnLst']);
  } else if (name === 'cmd') { attributes(node, ['type', 'cmd']); exactChildren(node, ['cBhvr']); }
  else if (name === 'cBhvr') { attributes(node, []); exactChildren(node, ['cTn', 'tgtEl']); }
  else if (name === 'stCondLst') { attributes(node, []); exactChildren(node, ['cond']); }
  else if (name === 'cond') { attributes(node, ['delay']); if (node.children.length) return fail(); }
  else if (name === 'tgtEl') { attributes(node, []); exactChildren(node, ['spTgt']); }
  else if (name === 'spTgt') { attributes(node, ['spid']); if (node.children.length) return fail(); }
  else return fail();
  for (const child of node.children) mediaBranch(child);
}

export function bindPptxSourceTimeline(xml: Document, bound: readonly BoundPptxMediaTimingTarget[], steps: readonly AnimStep[],
  snapshot: PlayerSnapshot, identity: { documentId: string; slideId: string; fingerprint: string }, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (snapshot.selection?.documentId !== identity.documentId || snapshot.selection.slideId !== identity.slideId
    || snapshot.sourceFingerprint !== identity.fingerprint || !snapshot.pptx) return fail();
  const controls = readPptxMediaTimelineControls(xml, signal), order = bindPptxSourceOrder(xml, steps, signal);
  const mapped = bindPptxSourceShapeGroups(order.groups, steps, signal), calls = bindPptxSourceMediaCalls(xml, bound, signal);
  // Shape/model correspondence alone does not verify mixed source timing.
  if (steps.length || !calls.length || mapped.some(group => group.shapeGroup !== null)
    || JSON.stringify(mapped.map(group => group.timingId)) !== JSON.stringify(controls.groupTimingIds)
    || order.independentMedia.some(target => target.node === 'cmd')) return fail();
  const declarations = bound.filter(target => target.node !== 'cmd');
  if (declarations.length > snapshot.media.length || JSON.stringify(declarations.map(target => target.timingId).sort((a, b) => a - b))
    !== JSON.stringify([...controls.declarationTimingIds].sort((a, b) => a - b))) return fail();
  const times = new Map([...xml.documentElement.getElementsByTagNameNS(ns, 'cTn')].map(node => [Number(node.getAttribute('id')), node]));
  const settingsById = new Map<number, ReturnType<typeof readPptxSourceMediaSettings>>();
  for (const declaration of declarations) {
    const time = times.get(declaration.timingId)!;
    const common = time.parentElement!, media = common.parentElement!;
    attributes(media, []); exactChildren(media, ['cMediaNode']); exactChildren(common, ['cTn', 'tgtEl']);
    const target = [...common.children].find(child => child.localName === 'tgtEl')!; mediaBranch(target);
    const settings = readPptxSourceMediaSettings(xml, declaration);
    if (settings.limitations.length) return fail(); settingsById.set(declaration.timingId, settings);
  }
  const used = new Set<number>();
  const callMap = new Map(calls.map(call => [call.timingId, call]));
  const delay = createPptxMediaCallDelayReader(xml, signal);
  const groups = mapped.map((group, index) => {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const node = times.get(group.timingId)!;
    mediaBranch(node);
    const sourceGroup = order.groups[index]!, mediaIds = new Set<string>();
    if (!sourceGroup.media.length || sourceGroup.media.some(target => target.node !== 'cmd')) return fail();
    const actions = sourceGroup.media.map(target => {
      const call = callMap.get(target.timingId);
      if (!call || used.has(call.timingId)) return fail(); used.add(call.timingId);
      const refs = snapshot.media.filter(entry => entry.ref.slideId === identity.slideId && entry.ref.kind === call.target.kind
        && entry.ref.fingerprint === call.target.mediaFingerprint && entry.ref.embeddedSource?.sourceFingerprint === identity.fingerprint
        && entry.ref.embeddedSource.sourcePart === call.target.sourcePart
        && JSON.stringify(entry.ref.embeddedSource.elementPath) === JSON.stringify(call.target.elementPath));
      if (refs.length !== 1 || mediaIds.has(refs[0]!.ref.id)) return fail(); mediaIds.add(refs[0]!.ref.id);
      const ref = refs[0]!.ref, settings = settingsById.get(call.declarationTimingId)!;
      const original = sourceMediaPlayback(settings, ref.durationSec), playback = mediaPlayback(ref);
      if (!isMediaPlayback(playback, ref.durationSec)) return fail();
      // playFrom with a trimmed beginning needs a separately verified source
      // time-base mapping; never assume absolute and clip-relative are equal.
      if (call.action.type === 'playFrom' && (original.startSec !== 0 || call.action.timeSec < playback.startSec || call.action.timeSec >= playback.endSec)) return fail();
      return { mediaId: ref.id, binding: sourceTimelineMediaBinding(ref), action: { ...call.action }, delayMs: delay(call.timingId, group.timingId).delayMs };
    });
    return { timingId: group.timingId, shapeGroup: group.shapeGroup, actions };
  });
  if (used.size !== calls.length) return fail();
  return { groups, controlsVerified: true as const, executionVerified: false as const };
}

export async function preparePptxSourceTimeline(document: Parameters<typeof bindPptxMediaTimingTargets>[0], source: Parameters<typeof bindPptxMediaTimingTargets>[1],
  slideId: string, snapshot: PlayerSnapshot, signal: AbortSignal) {
  const bound = await bindPptxMediaTimingTargets(document, source, slideId, signal);
  const part = bound[0]?.sourcePart, bytes = part && source.files[part];
  if (!part || !bytes || bytes.length > PPTX_LIMITS.xml) return fail();
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
  const xml = new DOMParser().parseFromString(text, 'application/xml'); if (xml.getElementsByTagName('parsererror').length) return fail();
  const index = source.parts.indexOf(part), steps = source.model.slides[index]?.animations ?? [];
  return bindPptxSourceTimeline(xml, bound, steps, snapshot, { documentId: document.id, slideId, fingerprint: source.fingerprint }, signal);
}
