import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { createSessionBundle } from '../../src/storage/sessionBundle';
import { SessionHub } from '../../src/background/sessionHub';
import { BackupVerificationError } from '../../src/storage/backupVerification';
import { isSessionRequest } from '../../src/shared/sessionMessages';

const closeCommand = { type: 'CLOSE_DOCUMENT', sessionId: 'original', documentId: 'A', slideId: null, revision: 4, commandId: 'close' } as const;
const blobUrl = 'blob:chrome-extension://synthetic/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
function multiple() {
  const session = fixtureSession(); session.documents.B = { ...structuredClone(session.documents.A!), id: 'B', source: { type: 'pdf', name: 'Synthetic-B.pdf', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64) } };
  session.documentOrder.push('B');
  return session;
}
async function setup(dirty = true) {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), publish = vi.fn();
  const session = multiple(), importer = new SessionHub(open, publish, () => 'original', () => 1); session.documents.A!.dirty = dirty;
  await importer.handle('launcher', { type: 'IMPORT_SESSION', bundle: createSessionBundle(session) });
  const repo = await open(); const record = (await repo.read('original'))!; record.session = session;
  // Install a valid synthetic persisted revision using the DB fixture, not a product bypass API.
  await new Promise<void>((resolve, reject) => {
    const request = factory.open('naver-ppt-sessions'); request.onsuccess = () => {
      const db = request.result, tx = db.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put({ schemaVersion: 1, session, receipts: [] });
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }); repo.close();
  const verify = vi.fn(async () => ({ sessionId: 'original', revision: 4, exportId: 'export', sha256: 'a'.repeat(64), verifiedAt: 10 }));
  const hub = new SessionHub(open, publish, undefined, () => 10, verify);
  const request = { type: 'CLOSE_CURRENT_DOCUMENT', command: closeCommand, decision: 'saved', blobUrl };
  return { hub, open, publish, verify, request, session };
}
describe('FR-015/020 current-only close / reversible draft-preserving state', () => {
  it('keeps other documents, editor target and deltas, stops only target bookmarks/timer and rejects implicit activation', () => {
    const before = multiple(); before.globalTimer = { scope: 'document', documentId: 'A', durationSec: 60, startedAt: 100, elapsedBeforeStartMs: 50, paused: false };
    before.documents.A!.mediaBookmarks.clip = { mediaId: 'clip', slideId: 'A-2', timeSec: 5, paused: false, replayPolicy: 'resume' };
    const closed = reduceSession(before, closeCommand, 200);
    expect(closed.presentedSelection).toBeNull(); expect(closed.documents.A?.closed).toBe(true);
    expect(closed.documents.B).toEqual(before.documents.B); expect(closed.editorSelection).toEqual(before.editorSelection);
    expect(closed.documents.A?.slideDeltas).toEqual(before.documents.A?.slideDeltas); expect(closed.documents.A?.mediaBookmarks.clip).toMatchObject({ timeSec: 5, paused: true });
    expect(closed.globalTimer).toMatchObject({ elapsedBeforeStartMs: 150, startedAt: null, paused: true });
    assertSessionRecord({ session: closed, receipts: [] });
    expect(() => reduceSession(closed, { ...closeCommand, type: 'ACTIVATE_DOCUMENT', commandId: 'activate', revision: 5 }, 201)).toThrow('INVALID_TARGET');
    const resumed = reduceSession(closed, { ...closeCommand, type: 'REOPEN_DOCUMENT', commandId: 'reopen', revision: 5 }, 201);
    expect(resumed.presentedSelection).toEqual(before.presentedSelection); expect(resumed.documents.A?.closed).toBe(false);
    expect(before.documents.A?.closed).toBeUndefined();
  });
  it('retains old schema without closed and refuses corrupt closed flags or closed audience selection', () => {
    const session = multiple(); assertSessionRecord({ session, receipts: [] });
    Object.assign(session.documents.A!, { closed: 'yes' }); expect(() => assertSessionRecord({ session, receipts: [] })).toThrow();
    session.documents.A!.closed = true; expect(() => assertSessionRecord({ session, receipts: [] })).toThrow();
  });
  it('does not allow raw CLOSE through SESSION_COMMAND or Player/editor close requests', async () => {
    const { hub, request, open } = await setup();
    expect(isSessionRequest({ type: 'SESSION_COMMAND', command: closeCommand })).toBe(false);
    expect(await hub.handle('player', request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await hub.handle('editor', request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    const repo = await open(); expect((await repo.read('original'))?.session.presentedSelection).not.toBeNull(); repo.close();
  });
  it('commits saved close only after verification, deduplicates its retry and recovers black state from a fresh hub', async () => {
    const { hub, request, verify, publish, open, session } = await setup();
    expect(await hub.handle('remote', request)).toMatchObject({ ok: true, session: { revision: 5, presentedSelection: null, documents: { A: { closed: true } } } });
    expect(verify).toHaveBeenCalledOnce(); expect(publish).toHaveBeenCalledOnce();
    expect(await hub.handle('remote', request)).toMatchObject({ ok: true, session: { revision: 5 } }); expect(verify).toHaveBeenCalledOnce(); expect(publish).toHaveBeenCalledOnce();
    const repo = await open(); const record = await repo.read('original'); repo.close();
    expect(record?.session.documents.B).toEqual(session.documents.B); expect(record?.session.editorSelection).toEqual(session.editorSelection);
    expect(await new SessionHub(open, publish).handle('player', { type: 'GET_SESSION', sessionId: 'original' })).toMatchObject({ snapshot: { selection: null } });
  });
  it('preserves everything on verification failure and rejects unchanged for dirty data', async () => {
    const { hub, request, verify, open, session, publish } = await setup(); verify.mockRejectedValue(new BackupVerificationError('BACKUP_MISMATCH'));
    expect(await hub.handle('remote', request)).toMatchObject({ ok: false, code: 'BACKUP_MISMATCH' });
    expect(await hub.handle('remote', { ...request, decision: 'unchanged', blobUrl: null })).toMatchObject({ ok: false, code: 'SAVE_REQUIRED' });
    const repo = await open(); expect((await repo.read('original'))?.session).toEqual(session); repo.close(); expect(publish).not.toHaveBeenCalled();
  });
  it('supports explicit without-backup without deleting deltas or claiming successful export', async () => {
    const { hub, request, verify, open, session } = await setup();
    expect(await hub.handle('remote', { ...request, decision: 'without-backup', blobUrl: null })).toMatchObject({ ok: true }); expect(verify).not.toHaveBeenCalled();
    const repo = await open(); expect((await repo.read('original'))?.session.documents.A?.slideDeltas).toEqual(session.documents.A?.slideDeltas); repo.close();
  });
  it('closes an unchanged target without creating a backup and still permits private edits after close', async () => {
    const { hub, request, verify, open } = await setup(false);
    expect(await hub.handle('remote', { ...request, decision: 'unchanged', blobUrl: null })).toMatchObject({ ok: true }); expect(verify).not.toHaveBeenCalled();
    expect(await hub.handle('editor', { type: 'SESSION_COMMAND', command: { ...closeCommand, type: 'SET_PRESENTER_NOTE', commandId: 'closed-note', revision: 5, slideId: 'A-2', note: 'Retained draft committed privately' } })).toMatchObject({ ok: true });
    const repo = await open(); const stored = (await repo.read('original'))!.session; repo.close();
    expect(stored.presentedSelection).toBeNull(); expect(stored.documents.A?.closed).toBe(true); expect(stored.documents.A?.slideDeltas['A-2']?.presenterNote).toBe('Retained draft committed privately');
  });
  it('fails strict CAS if another connection changes state during verification', async () => {
    const { hub, request, verify, open, publish } = await setup();
    const other = new SessionHub(open, publish);
    verify.mockImplementation(async () => {
      await other.handle('editor', { type: 'SESSION_COMMAND', command: { ...closeCommand, type: 'SET_PRESENTER_NOTE', slideId: 'A-2', commandId: 'note', note: 'New synthetic note' } });
      return { sessionId: 'original', revision: 4, exportId: 'export', sha256: 'a'.repeat(64), verifiedAt: 10 };
    });
    expect(await hub.handle('remote', request)).toMatchObject({ ok: false, code: 'STALE_REVISION' });
    const repo = await open(); expect((await repo.read('original'))?.session.documents.A?.closed).toBeUndefined(); repo.close();
  });
  it('does not ACK close when put succeeds but its transaction aborts', async () => {
    const { hub, request, open, session, publish } = await setup(), original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const result = original.apply(this, args); result.addEventListener('success', () => this.transaction.abort()); return result;
    });
    try { expect(await hub.handle('remote', request)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' }); } finally { spy.mockRestore(); }
    const repo = await open(); expect((await repo.read('original'))?.session).toEqual(session); repo.close(); expect(publish).not.toHaveBeenCalled();
  });
});
