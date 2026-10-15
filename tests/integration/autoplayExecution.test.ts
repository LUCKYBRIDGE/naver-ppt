import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
async function fixture() {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), session = fixtureSession(); session.revision = 0;
  session.documents.A!.autoplay = { mode: 'seconds', seconds: 1, loop: 'document', pauseWhileEditing: false };
  const repo = await open(); await repo.create(session); repo.close();
  return { open, session };
}
const context = { sessionId: 'original', documentId: 'A', slideId: 'A-2' };
const play = { type: 'SESSION_COMMAND', command: { ...context, type: 'PLAY_AUTOPLAY', revision: 0, commandId: 'play' } };
const advance = { type: 'SESSION_COMMAND', command: { ...context, type: 'ADVANCE_AUTOPLAY', revision: 1, commandId: 'advance', epoch: 'play' } };
describe('durable Player advance execution', () => {
  it('remote starts, only Player advances after time, strict commit and duplicate do not move twice or expose notes', async () => {
    const { open } = await fixture(), publish = vi.fn(); let now = 100;
    const hub = new SessionHub(open, publish, undefined, () => now);
    expect(await hub.handle('player', play)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await hub.handle('remote', play)).toMatchObject({ ok: true, kind: 'teacher' });
    expect(await hub.handle('remote', advance)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    now = 1099; expect(await hub.handle('player', advance)).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
    now = 1100; const response = await hub.handle('player', advance);
    expect(response).toMatchObject({ ok: true, kind: 'player', snapshot: { revision: 2, selection: { slideId: 'A-1' } } });
    expect(JSON.stringify(response)).not.toMatch(/Synthetic|presenterNote|classLog|fileHandleKey/);
    expect(await hub.handle('player', advance)).toEqual(response); expect(publish).toHaveBeenCalledTimes(2);
    const repo = await open(); expect((await repo.read('original'))!.session.documents.A!.autoplayCheckpoint).toMatchObject({ epoch: 'advance', slideId: 'A-1' }); repo.close();
  });
  it('failed advance commit preserves page and running checkpoint and does not publish', async () => {
    const { open } = await fixture(), hub = new SessionHub(open, () => {}, undefined, () => 100); await hub.handle('remote', play);
    const publish = vi.fn(), failure = new SessionHub(async () => { const repo = await open(); vi.spyOn(repo, 'commit').mockRejectedValue(new Error('Synthetic failure')); return repo; }, publish, undefined, () => 1100);
    expect(await failure.handle('player', advance)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' }); expect(publish).not.toHaveBeenCalled();
    const repo = await open(), session = (await repo.read('original'))!.session; repo.close();
    expect(session.presentedSelection?.slideId).toBe('A-2'); expect(session.documents.A!.autoplayCheckpoint?.epoch).toBe('play');
  });
  it('old page/epoch cannot advance after a manual move even with latest revision', async () => {
    const { open } = await fixture(); let now = 100; const hub = new SessionHub(open, () => {}, undefined, () => now); await hub.handle('remote', play);
    now = 200; await hub.handle('remote', { type: 'SESSION_COMMAND', command: { ...context, slideId: 'A-1', type: 'GOTO_SLIDE', commandId: 'manual', revision: 1 } });
    now = 1100; expect(await hub.handle('player', { ...advance, command: { ...advance.command, revision: 2 } })).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
  });
});
