import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { fixtureSession } from '../fixtures/session';
import type { SessionCommand } from '../../src/core/commands';
import { SessionService } from '../../src/storage/sessionService';

async function fixture(closed = false) {
  const session = fixtureSession(), factory = new IDBFactory(), publish = vi.fn();
  session.revision = 0;
  session.documents.B = { ...structuredClone(session.documents.A!), id: 'B', closed,
    source: { type: 'pptx', name: 'Synthetic.pptx', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64) },
    slideIds: ['B-1', 'B-2'], lastSlideId: 'B-1', slideDeltas: {} };
  session.documentOrder.push('B');
  const open = () => IndexedDbSessionRepository.open({ factory });
  const store = await open(); await store.create(session); store.close();
  const hub = new SessionHub(open, publish, undefined, () => 10);
  const read = async () => { const db = await open(); try { return await db.read(session.id); } finally { db.close(); } };
  return { session, hub, publish, read, open };
}
describe('PPTX durable transition admission', () => {
  it.each([false, true])('rejects all raw PPTX transitions closed=%s without changing state or receipts', async closed => {
    const { session, hub, publish, read } = await fixture(closed), before = await read();
    for (const type of ['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT'] as const) {
      const base = { sessionId: session.id, documentId: 'B', revision: session.revision, commandId: type };
      const command: SessionCommand = type === 'GOTO_SLIDE' ? { ...base, type, slideId: 'B-2' } : { ...base, type, slideId: null };
      expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command })).toMatchObject({ ok: false, code: 'PRESENTATION_PREPARATION_REQUIRED' });
      expect(await read()).toEqual(before);
    }
    expect(publish).not.toHaveBeenCalled();
  });
  it('rejects an old raw receipt and stale revision as authority to bypass preparation', async () => {
    const { session, hub, read, open } = await fixture(), db = await open();
    // A legacy receipt predates this boundary; it does not grant new admission.
    expect((await new SessionService(db).execute({ type: 'ACTIVATE_DOCUMENT', sessionId: session.id, documentId: 'B', slideId: null, revision: session.revision, commandId: 'old' })).ok).toBe(true);
    db.close(); const before = await read();
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId: session.id,
      documentId: 'B', slideId: null, revision: 0, commandId: 'old' } })).toMatchObject({ ok: false, code: 'PRESENTATION_PREPARATION_REQUIRED' });
    expect(await read()).toEqual(before);
  });
  it('retains pending on denied raw commands and only the explicit commit changes selection', async () => {
    const { session, hub, read } = await fixture(true);
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'REQUEST_PRESENTATION', sessionId: session.id,
      documentId: 'B', slideId: 'B-2', revision: session.revision, commandId: 'request', playerId: 'owner' } })).toMatchObject({ ok: true });
    const before = await read();
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'REOPEN_DOCUMENT', sessionId: session.id,
      documentId: 'B', slideId: null, revision: before!.session.revision, commandId: 'raw' } })).toMatchObject({ ok: false, code: 'PRESENTATION_PREPARATION_REQUIRED' });
    expect(await read()).toEqual(before);
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: { type: 'COMMIT_PRESENTATION', sessionId: session.id,
      documentId: 'B', slideId: 'B-2', revision: before!.session.revision, commandId: 'commit', requestId: 'request', playerId: 'owner' } })).toMatchObject({ ok: true });
    expect((await read())!.session.presentedSelection).toEqual({ documentId: 'B', slideId: 'B-2' });
    const committed = await read();
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: { type: 'ADVANCE_AUTOPLAY', sessionId: session.id,
      documentId: 'B', slideId: 'B-2', revision: committed!.session.revision, commandId: 'auto', epoch: 'any' } })).toMatchObject({ ok: false, code: 'PRESENTATION_PREPARATION_REQUIRED' });
    expect(await read()).toEqual(committed);
  });
  it('keeps PDF raw navigation valid and validates missing documents normally', async () => {
    const { session, hub } = await fixture();
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'GOTO_SLIDE', sessionId: session.id,
      documentId: 'A', slideId: 'A-1', revision: session.revision, commandId: 'pdf' } })).toMatchObject({ ok: true, session: { presentedSelection: { documentId: 'A', slideId: 'A-1' } } });
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId: session.id,
      documentId: 'missing', slideId: null, revision: session.revision + 1, commandId: 'missing' } })).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
  });
});
