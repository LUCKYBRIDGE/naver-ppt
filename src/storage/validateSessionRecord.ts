import type { SessionRecord } from './sessionService';
import { isOverlayList } from '../overlays/validation';
import { isLocalMediaRef, mediaMatchesDocument, embeddedMediaKey } from '../media/validation';
import { isTimerPosition } from '../media/timer';
import { isPptxCompletedCheckpoint } from '../core/pptxPlayback';
import { isApprovedWebPresentationUrl } from '../core/webLinks';
import { currentPresentationTransition, isPresentationTransition } from '../core/presentationTransition';
import type { ClassSession } from '../core/types';

export class StorageError extends Error {
  constructor(public readonly code: 'INVALID_RECORD' | 'UNSUPPORTED_SCHEMA' | 'SESSION_EXISTS' | 'STORAGE_BLOCKED' | 'STORAGE_UNAVAILABLE') {
    super(code);
  }
}

function check(condition: unknown): asserts condition {
  if (!condition) throw new StorageError('INVALID_RECORD');
}
function timerState(value: unknown) {
  const timer = object(value, ['scope', 'documentId', 'durationSec', 'startedAt', 'elapsedBeforeStartMs', 'paused'], ['mode', 'visible', 'epoch', 'position', 'sound', 'completedEpoch', 'alarmClaimedEpoch']);
  check(oneOf(timer.scope, ['session', 'document']) && nonnegative(timer.durationSec) && nonnegative(timer.elapsedBeforeStartMs));
  check((timer.startedAt === null || nonnegative(timer.startedAt)) && typeof timer.paused === 'boolean');
  optional(timer, 'visible', value => typeof value === 'boolean'); optional(timer, 'epoch', value => id(value) && value.length <= 200);
  optional(timer, 'position', isTimerPosition);
  optional(timer, 'sound', value => typeof value === 'boolean');
  optional(timer, 'completedEpoch', value => id(value) && value.length <= 200);
  optional(timer, 'alarmClaimedEpoch', value => id(value) && value.length <= 200);
  optional(timer, 'mode', value => value === 'stopwatch' ? timer.durationSec === 0 : value === 'countdown' && (timer.durationSec as number) >= 1 && (timer.durationSec as number) <= 86400);
  if (timer.epoch) check(timer.paused ? timer.startedAt === null : nonnegative(timer.startedAt));
  return timer;
}
function object(value: unknown, required: string[], optional: string[] = []): Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  check(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  check(required.every(key => Object.hasOwn(value, key)));
  check(Object.keys(value).every(key => required.includes(key) || optional.includes(key)));
  return value as Record<string, unknown>;
}
function map(value: unknown): Record<string, unknown> {
  check(value !== null && typeof value === 'object' && !Array.isArray(value));
  check(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  return value as Record<string, unknown>;
}
function text(value: unknown): value is string { return typeof value === 'string'; }
function id(value: unknown): value is string { return text(value) && value.trim().length > 0; }
function number(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value); }
function positive(value: unknown) { return number(value) && value > 0; }
function nonnegative(value: unknown): value is number { return number(value) && value >= 0; }
function integer(value: unknown): value is number { return nonnegative(value) && Number.isSafeInteger(value); }
function oneOf(value: unknown, values: string[]) { return text(value) && values.includes(value); }
function optional(value: Record<string, unknown>, key: string, valid: (value: unknown) => unknown) {
  if (Object.hasOwn(value, key)) check(valid(value[key]));
}
function autoplay(value: unknown) {
  const rule = object(value, ['mode', 'loop', 'pauseWhileEditing'], ['seconds', 'range']);
  check(oneOf(rule.mode, ['manual', 'seconds', 'media-end', 'later-of-time-and-media']));
  check(oneOf(rule.loop, ['none', 'slide', 'range', 'document']) && typeof rule.pauseWhileEditing === 'boolean');
  optional(rule, 'seconds', positive);
  if (Object.hasOwn(rule, 'range')) {
    const range = object(rule.range, ['startSlideId', 'endSlideId']);
    check(id(range.startSlideId) && id(range.endSlideId));
  }
  return true;
}
export function assertSessionRecord(value: unknown): asserts value is SessionRecord {
  const record = object(value, ['session', 'receipts']);
  const session = object(record.session, ['id', 'title', 'revision', 'documentOrder', 'documents',
    'presentedSelection', 'editorSelection', 'history', 'defaultAutoplay', 'globalTimer', 'updatedAt'], ['presentationTransition']);
  check(id(session.id) && text(session.title) && integer(session.revision) && nonnegative(session.updatedAt));
  const documents = map(session.documents);
  check(Array.isArray(session.documentOrder) && session.documentOrder.every(id));
  check(new Set(session.documentOrder).size === session.documentOrder.length);
  check(session.documentOrder.length === Object.keys(documents).length && session.documentOrder.every(key => Object.hasOwn(documents, key)));
  for (const [key, value] of Object.entries(documents)) {
    const doc = object(value, ['id', 'source', 'lastSlideId', 'knownSlideCount', 'slideIds', 'slideDeltas', 'mediaBookmarks', 'dirty'], ['autoplay', 'autoplayCheckpoint', 'closed', 'localMedia', 'timer', 'pptxPlayback']);
    check(id(doc.id) && key === doc.id && typeof doc.dirty === 'boolean');
    optional(doc, 'closed', value => typeof value === 'boolean');
    if (Object.hasOwn(doc, 'timer')) {
      const timer = timerState(doc.timer); check(timer.scope === 'document' && timer.documentId === doc.id);
      if (!timer.paused) check(!doc.closed && session.presentedSelection !== null && map(session.presentedSelection).documentId === doc.id);
    }
    const source = map(doc.source);
    if (oneOf(source.type, ['pdf', 'pptx', 'ppt', 'show'])) {
      object(source, ['type', 'name', 'size', 'lastModified'], ['fingerprint', 'fileHandleKey']);
      check(text(source.name) && integer(source.size) && nonnegative(source.lastModified));
      optional(source, 'fingerprint', id); optional(source, 'fileHandleKey', id);
    } else {
      object(source, ['type', 'url', 'title']);
      check(oneOf(source.type, ['canva', 'miricanvas']) && isApprovedWebPresentationUrl(source.type, source.url) && text(source.title));
    }
    const externalLink = source.type === 'canva' || source.type === 'miricanvas';
    check(Array.isArray(doc.slideIds) && doc.slideIds.every(id) && new Set(doc.slideIds).size === doc.slideIds.length);
    if (externalLink) check(doc.knownSlideCount === null && doc.slideIds.length === 0 && doc.lastSlideId === null);
    check(doc.knownSlideCount === null || (integer(doc.knownSlideCount) && doc.knownSlideCount === doc.slideIds.length));
    check(doc.lastSlideId === null || (id(doc.lastSlideId) && doc.slideIds.includes(doc.lastSlideId)));
    if (Object.hasOwn(doc, 'pptxPlayback')) {
      check(source.type === 'pptx' && typeof source.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(source.fingerprint));
      const playback = object(doc.pptxPlayback, ['checkpoints', 'run'], ['request']);
      const checkpoints = map(playback.checkpoints); let totalEntries = 0;
      for (const [slideId, checkpoint] of Object.entries(checkpoints)) {
        check(doc.slideIds.includes(slideId) && isPptxCompletedCheckpoint(checkpoint));
        check(checkpoint.fingerprint === source.fingerprint && checkpoint.pose.scope.sessionId === session.id && checkpoint.pose.scope.documentId === doc.id
          && checkpoint.pose.scope.slideId === slideId && checkpoint.pose.scope.revision <= (session.revision as number));
        totalEntries += checkpoint.pose.entries.length; check(totalEntries <= 10000);
      }
      if (playback.run !== null) {
        const run = object(playback.run, ['epoch', 'slideId']);
        check(id(run.epoch) && run.epoch.length <= 200 && id(run.slideId) && doc.slideIds.includes(run.slideId) && !doc.closed);
        const selection = map(session.presentedSelection); check(selection.documentId === doc.id && selection.slideId === run.slideId);
      }
      if (Object.hasOwn(playback, 'request') && playback.request !== null) {
        const request = object(playback.request, ['commandId', 'slideId']);
        check(id(request.commandId) && request.commandId.length <= 200 && id(request.slideId) && doc.slideIds.includes(request.slideId)
          && !doc.closed && playback.run === null);
        const selection = map(session.presentedSelection); check(selection.documentId === doc.id && selection.slideId === request.slideId);
      }
    }
    optional(doc, 'autoplay', autoplay);
    if (Object.hasOwn(doc, 'autoplayCheckpoint')) {
      const checkpoint = object(doc.autoplayCheckpoint, ['slideId', 'epoch', 'startedAt', 'elapsedMs', 'paused']);
      check(id(checkpoint.slideId) && doc.slideIds.includes(checkpoint.slideId) && id(checkpoint.epoch) && checkpoint.epoch.length <= 200);
      check(nonnegative(checkpoint.elapsedMs) && typeof checkpoint.paused === 'boolean');
      check(checkpoint.paused ? checkpoint.startedAt === null : nonnegative(checkpoint.startedAt));
      if (!checkpoint.paused) {
        const active = map(session.presentedSelection);
        check(active.documentId === doc.id && active.slideId === checkpoint.slideId);
      }
      if (doc.closed) check(checkpoint.paused);
    }
    for (const [slideId, value] of Object.entries(map(doc.slideDeltas))) {
      check(doc.slideIds.includes(slideId));
      const delta = object(value, ['overlays', 'presenterNote', 'classLog'], ['autoplay']);
      check(text(delta.presenterNote) && text(delta.classLog) && Array.isArray(delta.overlays));
      check(isOverlayList(delta.overlays)); optional(delta, 'autoplay', autoplay);
    }
    if (Object.hasOwn(doc, 'localMedia')) {
      const refs = map(doc.localMedia); check(Object.keys(refs).length <= 16);
      const embeddedKeys = new Set<string>();
      for (const [mediaId, ref] of Object.entries(refs)) {
        check(isLocalMediaRef(ref) && ref.id === mediaId && doc.slideIds.includes(ref.slideId) && mediaMatchesDocument(ref, source));
        if (isLocalMediaRef(ref) && ref.embeddedSource) {
          const key = embeddedMediaKey(ref.embeddedSource); check(!embeddedKeys.has(key)); embeddedKeys.add(key);
        }
      }
    }
    for (const [mediaId, value] of Object.entries(map(doc.mediaBookmarks))) {
      const bookmark = object(value, ['mediaId', 'slideId', 'timeSec', 'paused', 'replayPolicy'], ['epoch', 'ended', 'autoplayEpoch', 'positionEpoch', 'sourceRunEpoch']);
      check(id(bookmark.mediaId) && bookmark.mediaId === mediaId && id(bookmark.slideId) && doc.slideIds.includes(bookmark.slideId));
      check(nonnegative(bookmark.timeSec) && typeof bookmark.paused === 'boolean' && oneOf(bookmark.replayPolicy, ['ask', 'resume', 'restart']));
      optional(bookmark, 'epoch', value => id(value) && value.length <= 200); optional(bookmark, 'ended', value => typeof value === 'boolean');
      optional(bookmark, 'autoplayEpoch', value => id(value) && value.length <= 200);
      optional(bookmark, 'positionEpoch', value => id(value) && value.length <= 200);
      optional(bookmark, 'sourceRunEpoch', value => id(value) && value.length <= 200);
      if (Object.hasOwn(bookmark, 'sourceRunEpoch')) {
        check(source.type === 'pptx' && doc.localMedia && Object.hasOwn(doc.localMedia, mediaId) && Object.hasOwn(map(doc.localMedia)[mediaId] as object, 'embeddedSource')
          && Object.hasOwn(bookmark, 'epoch'));
      }
      if (doc.localMedia && Object.hasOwn(doc.localMedia, mediaId)) {
        const ref = (doc.localMedia as Record<string, { slideId: string; durationSec: number; playback?: { startSec: number; endSec: number } }>)[mediaId]!;
        const start = ref.playback?.startSec ?? 0, end = ref.playback?.endSec ?? ref.durationSec;
        check(bookmark.slideId === ref.slideId && (bookmark.timeSec as number) >= start && (bookmark.timeSec as number) <= end);
        if (!bookmark.paused) { const selected = map(session.presentedSelection); check(!doc.closed && selected.documentId === doc.id && selected.slideId === ref.slideId); }
        if (bookmark.ended) check(bookmark.paused && bookmark.timeSec >= end - .25);
      }
    }
  }
  const selection = (value: unknown) => {
    if (value === null) return;
    const chosen = object(value, ['documentId', 'slideId']);
    check(id(chosen.documentId) && Object.hasOwn(documents, chosen.documentId));
    const doc = map(documents[chosen.documentId]);
    check(chosen.slideId === null || (id(chosen.slideId) && (doc.slideIds as string[]).includes(chosen.slideId)));
  };
  selection(session.presentedSelection); selection(session.editorSelection);
  if (Object.hasOwn(session, 'presentationTransition') && session.presentationTransition !== null) check(isPresentationTransition(session.presentationTransition) && currentPresentationTransition(session as unknown as ClassSession, session.presentationTransition));
  if (session.presentedSelection !== null) check(!map(documents[map(session.presentedSelection).documentId as string]).closed);
  check(Array.isArray(session.history)); session.history.forEach(value => { check(value !== null); selection(value); });
  autoplay(session.defaultAutoplay);
  if (session.globalTimer !== null) {
    const timer = timerState(session.globalTimer);
    check(timer.scope === 'session' ? timer.documentId === null : id(timer.documentId) && Object.hasOwn(documents, timer.documentId));
  }
  check(Array.isArray(record.receipts) && record.receipts.length <= 256);
  const receiptIds = new Set<string>();
  let previousRevision = -1;
  for (const value of record.receipts) {
    const receipt = object(value, ['commandId', 'revision']);
    check(id(receipt.commandId) && !receiptIds.has(receipt.commandId)); receiptIds.add(receipt.commandId);
    check(integer(receipt.revision) && receipt.revision > previousRevision && receipt.revision <= session.revision);
    previousRevision = receipt.revision;
  }
}

export function decodeStoredRecord(value: unknown): SessionRecord {
  const stored = object(value, ['schemaVersion', 'session', 'receipts']);
  if (stored.schemaVersion !== 1) throw new StorageError('UNSUPPORTED_SCHEMA');
  const record = { session: stored.session, receipts: stored.receipts };
  assertSessionRecord(record);
  return record;
}
