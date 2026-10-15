import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { createSessionBundle } from '../../src/storage/sessionBundle';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { reduceSession } from '../../src/core/session';
import { isSessionRequest } from '../../src/shared/sessionMessages';

const blobUrl = 'blob:chrome-extension://synthetic/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
async function setup(bDirty = true) {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), publish = vi.fn();
  const session = fixtureSession(); session.documents.B = { ...structuredClone(session.documents.A!), id: 'B', dirty: bDirty,
    source: { type: 'pdf', name: 'Synthetic-B.pdf', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64) } }; session.documentOrder.push('B');
  const verify = vi.fn(async () => ({ exportId: 'export', sessionId: 'lesson', revision: 1, sha256: 'a'.repeat(64), verifiedAt: 10 }));
  const hub = new SessionHub(open, publish, () => 'lesson', () => 10, verify);
  await hub.handle('launcher', { type: 'IMPORT_SESSION', bundle: createSessionBundle(session) });
  await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId: 'lesson', documentId: 'A', slideId: null, revision: 0, commandId: 'activate' } }); publish.mockClear();
  const repo = await open(); const before = (await repo.read('lesson'))!.session; repo.close();
  const request = { type: 'CLOSE_ALL_DOCUMENTS', sessionId: 'lesson', revision: 1, commandId: 'close-all',
    choices: [{ documentId: 'A', decision: 'saved' }, { documentId: 'B', decision: 'saved' }], blobUrl };
  async function read() { const db = await open(); try { return (await db.read('lesson'))!.session; } finally { db.close(); } }
  return { hub, open, publish, verify, before, request, read };
}
describe('FR-015/020 explicit all-close per-document choices', () => {
  it('closes all approved targets atomically after one full-session saved proof and persists retry/restart state', async () => {
    const f = await setup();
    expect(await f.hub.handle('remote', f.request)).toEqual({ ok: true, kind: 'close-all', revision: 2, results: [
      { documentId: 'A', state: 'closed', error: null }, { documentId: 'B', state: 'closed', error: null }] });
    expect(f.verify).toHaveBeenCalledOnce(); expect(f.publish).toHaveBeenCalledOnce();
    const closed = await f.read(); expect(closed.presentedSelection).toBeNull(); expect(closed.editorSelection).toEqual(f.before.editorSelection);
    expect(closed.documents.A?.slideDeltas).toEqual(f.before.documents.A?.slideDeltas); expect(closed.documents.B?.closed).toBe(true);
    expect(await f.hub.handle('remote', f.request)).toMatchObject({ ok: true, revision: 2 }); expect(f.verify).toHaveBeenCalledOnce();
    expect(await new SessionHub(f.open, f.publish).handle('player', { type: 'GET_SESSION', sessionId: 'lesson' })).toMatchObject({ snapshot: { selection: null } });
  });
  it('keeps a failed current target playing while independent explicit other target closes', async () => {
    const f = await setup(); f.verify.mockRejectedValue(new Error('synthetic failed save'));
    const response = await f.hub.handle('remote', { ...f.request, choices: [{ documentId: 'A', decision: 'saved' }, { documentId: 'B', decision: 'without-backup' }] });
    expect(response).toMatchObject({ kind: 'close-all', results: [{ documentId: 'A', state: 'kept' }, { documentId: 'B', state: 'closed' }] });
    const after = await f.read(); expect(after.presentedSelection).toEqual(f.before.presentedSelection); expect(after.documents.A).toEqual(f.before.documents.A); expect(after.documents.B?.closed).toBe(true);
  });
  it('goes black, not to the failed other target, if the current independent choice closes', async () => {
    const f = await setup(); f.verify.mockRejectedValue(new Error('synthetic failed save'));
    expect(await f.hub.handle('remote', { ...f.request, choices: [{ documentId: 'A', decision: 'without-backup' }, { documentId: 'B', decision: 'saved' }] })).toMatchObject({ results: [{ state: 'closed' }, { state: 'kept' }] });
    const after = await f.read(); expect(after.presentedSelection).toBeNull(); expect(after.documents.B).toEqual(f.before.documents.B);
  });
  it('reports all failures without changing revision, receipts or presentation', async () => {
    const f = await setup(); f.verify.mockRejectedValue(new Error('synthetic failed save'));
    expect(await f.hub.handle('remote', f.request)).toMatchObject({ ok: true, kind: 'close-all', revision: 1, results: [{ state: 'kept' }, { state: 'kept' }] });
    expect(await f.read()).toEqual(f.before); expect(f.publish).not.toHaveBeenCalled();
  });
  it('allows unchanged only for a clean target and retains dirty unchanged choices', async () => {
    const f = await setup(false);
    expect(await f.hub.handle('remote', { ...f.request, blobUrl: null, choices: [{ documentId: 'A', decision: 'unchanged' }, { documentId: 'B', decision: 'unchanged' }] })).toMatchObject({ results: [{ state: 'kept' }, { state: 'closed' }] });
    expect(f.verify).not.toHaveBeenCalled(); expect((await f.read()).documents.A).toEqual(f.before.documents.A);
  });
  it('rejects wrong scope, duplicates, raw batch commands and non-Remote roles before side effects', async () => {
    const f = await setup();
    expect(isSessionRequest({ ...f.request, choices: [f.request.choices[0], f.request.choices[0]] })).toBe(false);
    expect(isSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'CLOSE_DOCUMENTS', sessionId: 'lesson', revision: 1, commandId: 'bypass', documentId: null, slideId: null, documentIds: ['A', 'B'] } })).toBe(false);
    for (const role of ['player', 'editor', 'launcher'] as const) expect(await f.hub.handle(role, f.request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await f.hub.handle('remote', { ...f.request, choices: [f.request.choices[0]] })).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
    expect(f.verify).not.toHaveBeenCalled(); expect(await f.read()).toEqual(f.before);
  });
  it('rejects a concurrent change after proof even when some choices could otherwise close', async () => {
    const f = await setup(), other = new SessionHub(f.open, f.publish);
    f.verify.mockImplementation(async () => {
      await other.handle('editor', { type: 'SESSION_COMMAND', command: { type: 'SET_PRESENTER_NOTE', sessionId: 'lesson', documentId: 'A', slideId: 'A-2', revision: 1, commandId: 'note', note: 'New synthetic note' } });
      return { exportId: 'export', sessionId: 'lesson', revision: 1, sha256: 'a'.repeat(64), verifiedAt: 10 };
    });
    expect(await f.hub.handle('remote', f.request)).toMatchObject({ ok: false, code: 'STALE_REVISION' });
    const after = await f.read(); expect(after.documents.A?.closed).toBeUndefined(); expect(after.documents.B?.closed).toBeUndefined(); expect(after.presentedSelection).toEqual(f.before.presentedSelection);
  });
  it('rolls back every closed flag and receipt if the batch put aborts after success', async () => {
    const f = await setup(), original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args); request.addEventListener('success', () => this.transaction.abort()); return request;
    });
    try { expect(await f.hub.handle('remote', f.request)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' }); } finally { spy.mockRestore(); }
    expect(await f.read()).toEqual(f.before); expect(f.publish).not.toHaveBeenCalled();
  });
  it('pauses the session timer only once no open targets remain and never clears Editor/deltas', () => {
    const session = fixtureSession(); session.documents.B = { ...structuredClone(session.documents.A!), id: 'B' }; session.documentOrder.push('B');
    session.globalTimer = { scope: 'session', documentId: null, durationSec: 60, startedAt: 10, elapsedBeforeStartMs: 1, paused: false };
    const command = { type: 'CLOSE_DOCUMENTS', commandId: 'batch', sessionId: session.id, revision: 4, documentId: null, slideId: null, documentIds: ['B'] } as const;
    const partial = reduceSession(session, { ...command, documentIds: ['B'] }, 20); expect(partial.globalTimer).toEqual(session.globalTimer); expect(partial.presentedSelection).toEqual(session.presentedSelection);
    const final = reduceSession(partial, { ...command, commandId: 'final', revision: 5, documentIds: ['A'] }, 30);
    expect(final.globalTimer).toMatchObject({ elapsedBeforeStartMs: 21, startedAt: null, paused: true }); expect(final.editorSelection).toEqual(session.editorSelection); expect(final.presentedSelection).toBeNull();
  });
});
