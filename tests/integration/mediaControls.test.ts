import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
const playback = { startSec: 3, endSec: 5, volume: .2, muted: true };
const command = { type: 'SESSION_COMMAND', command: { type: 'SET_MEDIA_PLAYBACK', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: 0, commandId: 'settings', playback } };
async function fixture() {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), session = fixtureSession(); session.revision = 0;
  session.documents.A!.localMedia = { clip: { id: 'clip', slideId: 'A-2', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64), durationSec: 12 } };
  const repo = await open(); await repo.create(session); repo.close(); return { open, session };
}
describe('durable Remote media controls', () => {
  it('commits settings once, denies Player, and reloads paused seek with position epoch', async () => {
    const { open } = await fixture(), publish = vi.fn(), hub = new SessionHub(open, publish, undefined, () => 100);
    expect(await hub.handle('player', command)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    const result = await hub.handle('remote', command); expect(result).toMatchObject({ ok: true });
    expect(await hub.handle('remote', command)).toEqual(result); expect(publish).toHaveBeenCalledTimes(1);
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { ...command.command, type: 'SEEK_MEDIA', playback: undefined, timeSec: 4, revision: 1, commandId: 'seek' } })).toMatchObject({ ok: false });
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'SEEK_MEDIA', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', timeSec: 4, revision: 1, commandId: 'seek' } })).toMatchObject({ ok: true });
    const repo = await open(), loaded = (await repo.read('original'))!.session; repo.close();
    expect(loaded.documents.A!.localMedia!.clip!.playback).toEqual(playback);
    expect(loaded.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 4, paused: true, epoch: 'seek', positionEpoch: 'seek' });
  });
  it('does not publish or mutate data when strict settings commit fails', async () => {
    const { open, session } = await fixture(), publish = vi.fn();
    const hub = new SessionHub(async () => { const repo = await open(); vi.spyOn(repo, 'commit').mockRejectedValue(new Error('Synthetic failure')); return repo; }, publish, undefined, () => 100);
    expect(await hub.handle('remote', command)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' }); expect(publish).not.toHaveBeenCalled();
    const repo = await open(); expect((await repo.read('original'))!.session).toEqual(session); repo.close();
  });
});
