import type { ClassSession } from '../core/types';
import type { SessionBundle } from './types';
import { assertSessionRecord } from './validateSessionRecord';
import { pauseAutoplay } from '../media/autoplay';
import { pauseTimer } from '../media/timer';

export const MAX_BUNDLE_BYTES = 16 * 1024 * 1024;
export class BundleError extends Error {
  constructor(message = '편집정보 파일 형식을 확인하지 못했습니다. 기존 수업은 유지했습니다.') { super(message); }
}
function check(value: unknown, message?: string): asserts value { if (!value) throw new BundleError(message); }
function bounded(value: unknown) {
  const pending = [{ value, depth: 0 }]; let nodes = 0;
  while (pending.length) {
    const item = pending.pop()!;
    check(++nodes <= 250000 && item.depth <= 32, '편집정보 파일의 구조 한도를 초과했습니다.');
    if (item.value && typeof item.value === 'object') {
      check([Object.prototype, Array.prototype, null].includes(Object.getPrototypeOf(item.value)));
      for (const child of Object.values(item.value)) {
        check(pending.length + nodes < 250000, '편집정보 파일의 구조 한도를 초과했습니다.');
        pending.push({ value: child, depth: item.depth + 1 });
      }
    }
  }
}
export function assertSessionBundle(value: unknown): asserts value is SessionBundle {
  bounded(value);
  check(!!value && typeof value === 'object' && !Array.isArray(value));
  const bundle = value as Record<string, unknown>;
  check(Object.keys(bundle).length === 4 && ['format', 'schemaVersion', 'exportedAt', 'session'].every(k => Object.hasOwn(bundle, k)));
  check(bundle.format === 'whale-class-presenter');
  check(bundle.schemaVersion === 1, '지원하지 않는 편집정보 버전입니다. 기존 수업은 유지했습니다.');
  check(typeof bundle.exportedAt === 'number' && Number.isSafeInteger(bundle.exportedAt) && bundle.exportedAt >= 0);
  try { assertSessionRecord({ session: bundle.session, receipts: [] }); } catch { throw new BundleError(); }
  const session = bundle.session as ClassSession;
  const validId = (id: string) => id.trim().length > 0 && id.length <= 200;
  check(validId(session.id) && session.title.length <= 200 && session.documentOrder.length <= 16 && session.history.length <= 10000);
  for (const doc of Object.values(session.documents)) {
    if (doc.timer) doc.timer = { ...pauseTimer(doc.timer, bundle.exportedAt), ...(doc.timer.completedEpoch ? { alarmClaimedEpoch: doc.timer.completedEpoch } : {}) };
    check(validId(doc.id) && doc.slideIds.length <= 2000 && doc.slideIds.every(validId));
    check(doc.source.type === 'pdf' || doc.source.type === 'pptx', 'PDF 또는 PPTX 자료의 편집정보만 복구할 수 있습니다.');
    if (doc.source.type === 'pptx') check(doc.slideIds.length <= 1000, 'PPTX 자료는 1000쪽까지 복구할 수 있습니다.');
    check(doc.source.size <= 128 * 1024 * 1024 && doc.source.name.length <= 1000 && /^[a-f0-9]{64}$/i.test(doc.source.fingerprint ?? ''));
    for (const delta of Object.values(doc.slideDeltas)) check(delta.presenterNote.length <= 100000 && delta.classLog.length <= 100000);
  }
}
export function createSessionBundle(session: ClassSession, now = Date.now()): SessionBundle {
  const copy = structuredClone(session);
  for (const doc of Object.values(copy.documents)) if ('fileHandleKey' in doc.source) delete doc.source.fileHandleKey;
  const bundle: SessionBundle = { format: 'whale-class-presenter', schemaVersion: 1, exportedAt: now, session: copy };
  assertSessionBundle(bundle); return bundle;
}
export function encodeSessionBundle(session: ClassSession, now = Date.now()): Uint8Array {
  const bytes = new TextEncoder().encode(JSON.stringify(createSessionBundle(session, now), null, 2));
  check(bytes.byteLength <= MAX_BUNDLE_BYTES, '편집정보 파일의 16MB 한도를 초과했습니다.'); return bytes;
}
export function decodeSessionBundle(bytes: Uint8Array): SessionBundle {
  check(bytes.byteLength > 0 && bytes.byteLength <= MAX_BUNDLE_BYTES, '편집정보 파일은 16MB까지 불러올 수 있습니다.');
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw new BundleError('올바른 UTF-8 JSON 편집정보 파일이 아닙니다.'); }
  assertSessionBundle(value); return value;
}
export function restoreSessionBundle(bundle: SessionBundle, id: string, now: number): ClassSession {
  assertSessionBundle(bundle);
  check(id.trim().length > 0 && id.length <= 200 && Number.isSafeInteger(now) && now >= 0);
  const session = structuredClone(bundle.session); session.id = id; session.revision = 0; session.updatedAt = now;
  session.presentedSelection = null;
  if (Object.hasOwn(session, 'presentationTransition')) session.presentationTransition = null;
  for (const doc of Object.values(session.documents)) {
    if (doc.autoplayCheckpoint) doc.autoplayCheckpoint = pauseAutoplay(doc.autoplayCheckpoint, bundle.exportedAt);
    if ('fileHandleKey' in doc.source) delete doc.source.fileHandleKey;
    for (const bookmark of Object.values(doc.mediaBookmarks)) { bookmark.paused = true; delete bookmark.sourceRunEpoch; }
    if (doc.pptxPlayback) {
      doc.pptxPlayback.run = null;
      if (Object.hasOwn(doc.pptxPlayback, 'request')) doc.pptxPlayback.request = null;
      for (const checkpoint of Object.values(doc.pptxPlayback.checkpoints)) {
        checkpoint.pose.scope = { ...checkpoint.pose.scope, sessionId: id, revision: 0 };
      }
    }
  }
  if (session.globalTimer) session.globalTimer = { ...pauseTimer(session.globalTimer, bundle.exportedAt), ...(session.globalTimer.completedEpoch ? { alarmClaimedEpoch: session.globalTimer.completedEpoch } : {}) };
  return session;
}
