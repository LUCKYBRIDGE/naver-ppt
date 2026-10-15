import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';

async function fixture() {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), session = fixtureSession(); session.revision = 0;
  session.documents.A!.autoplayCheckpoint = { slideId: 'A-2', epoch: 'start', startedAt: 100, elapsedMs: 500, paused: false };
  session.documents.A!.mediaBookmarks.clip = { mediaId: 'clip', slideId: 'A-2', timeSec: 7, paused: false, replayPolicy: 'resume' };
  session.documents.B = { ...structuredClone(session.documents.A!), id: 'B', mediaBookmarks: {} }; delete session.documents.B.autoplayCheckpoint;
  session.documentOrder.push('B');
  const repository = await open(); await repository.create(session); repository.close();
  const request = { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId: session.id, documentId: 'B', slideId: null, revision: 0, commandId: 'switch' } };
  return { open, session, request };
}
describe('durable playback switch checkpoints', () => {
  it('commits paused checkpoint and bookmarks atomically with target selection, reads after DB reconnect and deduplicates', async () => {
    const { open, session, request } = await fixture(), publish = vi.fn(), hub = new SessionHub(open, publish, undefined, () => 1100);
    const response = await hub.handle('remote', request); expect(response).toMatchObject({ ok: true, kind: 'teacher' });
    const repository = await open(), record = (await repository.read(session.id))!; repository.close();
    expect(record.session.documents.A!.autoplayCheckpoint).toMatchObject({ elapsedMs: 1500, paused: true, startedAt: null });
    expect(record.session.documents.A!.mediaBookmarks.clip).toMatchObject({ paused: true, timeSec: 7 });
    expect(record.session.presentedSelection?.documentId).toBe('B'); expect(record.receipts).toEqual([{ commandId: 'switch', revision: 1 }]);
    expect(await hub.handle('remote', request)).toEqual(response); expect(publish).toHaveBeenCalledTimes(1);
  });
  it('does not publish or replace either playback state or selection when persistence fails', async () => {
    const { open, session, request } = await fixture(), publish = vi.fn();
    const hub = new SessionHub(async () => { const repository = await open(); vi.spyOn(repository, 'commit').mockRejectedValue(new Error('Synthetic storage failure')); return repository; }, publish, undefined, () => 1100);
    expect(await hub.handle('remote', request)).toMatchObject({ ok: false }); expect(publish).not.toHaveBeenCalled();
    const repository = await open(); expect((await repository.read(session.id))!.session).toEqual(session); repository.close();
  });
});
