import type { ClassSession, PresentationDocumentState } from '../core/types';
import type { AutoplayCheckpoint, AutoplayRule } from './types';

export function isSupportedAutoplayRule(value: unknown): value is AutoplayRule {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const rule = value as Record<string, unknown>;
  if (!['mode', 'loop', 'pauseWhileEditing'].every(key => Object.hasOwn(rule, key))
    || Object.keys(rule).some(key => !['mode', 'seconds', 'loop', 'range', 'pauseWhileEditing'].includes(key))
    || typeof rule.mode !== 'string' || !['manual', 'seconds', 'media-end', 'later-of-time-and-media'].includes(rule.mode) || rule.pauseWhileEditing !== false
    || typeof rule.loop !== 'string' || !['none', 'slide', 'document', 'range'].includes(rule.loop)) return false;
  if ((rule.mode === 'seconds' || rule.mode === 'later-of-time-and-media') && (typeof rule.seconds !== 'number' || !Number.isFinite(rule.seconds) || rule.seconds < 1 || rule.seconds > 86400)) return false;
  if (rule.seconds !== undefined && (typeof rule.seconds !== 'number' || !Number.isFinite(rule.seconds) || rule.seconds < 1 || rule.seconds > 86400)) return false;
  if (rule.loop === 'range' || rule.range !== undefined) {
    if (!rule.range || typeof rule.range !== 'object' || Array.isArray(rule.range)) return false;
    const range = rule.range as Record<string, unknown>;
    if (Object.keys(range).length !== 2 || !['startSlideId', 'endSlideId'].every(key => Object.hasOwn(range, key) && typeof range[key] === 'string' && !!(range[key] as string).trim() && (range[key] as string).length <= 200)) return false;
  }
  return true;
}
export function isTimeAutoplayRule(value: unknown): value is AutoplayRule {
  return isSupportedAutoplayRule(value) && (value.mode === 'manual' || value.mode === 'seconds');
}
export function isMediaAutoplay(rule: AutoplayRule) { return rule.mode === 'media-end' || rule.mode === 'later-of-time-and-media'; }
export function mediaEndedForAutoplay(document: PresentationDocumentState, slideId: string, epoch: string): boolean | null {
  const refs = Object.values(document.localMedia ?? {}).filter(ref => ref.slideId === slideId);
  if (!refs.length) return null;
  return refs.every(ref => {
    const bookmark = Object.hasOwn(document.mediaBookmarks, ref.id) ? document.mediaBookmarks[ref.id] : undefined;
    return bookmark?.autoplayEpoch === epoch && bookmark.ended === true && bookmark.paused && bookmark.timeSec >= (ref.playback?.endSec ?? ref.durationSec) - .25;
  });
}

export function resolveAutoplay(session: ClassSession, document: PresentationDocumentState, slideId: string): AutoplayRule {
  return structuredClone(document.slideDeltas[slideId]?.autoplay ?? document.autoplay ?? session.defaultAutoplay);
}
export function elapsedAutoplay(checkpoint: AutoplayCheckpoint, now: number) {
  if (!Number.isFinite(now) || now < 0) throw new Error('Invalid autoplay time');
  return checkpoint.elapsedMs + (checkpoint.paused || checkpoint.startedAt === null ? 0 : Math.max(0, now - checkpoint.startedAt));
}
export function pauseAutoplay(checkpoint: AutoplayCheckpoint, now: number): AutoplayCheckpoint {
  return { ...checkpoint, elapsedMs: elapsedAutoplay(checkpoint, now), startedAt: null, paused: true };
}
export function autoplayDue(rule: AutoplayRule, elapsedMs: number, mediaEnded: boolean | null): boolean {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || rule.mode === 'manual') return false;
  if (rule.mode === 'media-end') return mediaEnded === true;
  const timed = Number.isFinite(rule.seconds) && rule.seconds! > 0 && elapsedMs >= rule.seconds! * 1000;
  return rule.mode === 'seconds' ? timed : rule.mode === 'later-of-time-and-media' && timed && mediaEnded === true;
}
export function autoplayNextSlide(document: PresentationDocumentState, slideId: string, rule: AutoplayRule): string | null {
  const ids = document.slideIds, index = ids.indexOf(slideId);
  if (index < 0 || document.closed) return null;
  if (rule.loop === 'slide') return slideId;
  if (rule.loop === 'range') {
    const start = rule.range ? ids.indexOf(rule.range.startSlideId) : -1, end = rule.range ? ids.indexOf(rule.range.endSlideId) : -1;
    if (start < 0 || end < start || index < start || index > end) return null;
    return index === end ? ids[start]! : ids[index + 1]!;
  }
  return ids[index + 1] ?? (rule.loop === 'document' ? ids[0] ?? null : null);
}
