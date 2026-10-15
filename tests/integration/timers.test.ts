import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
const configure = { type: 'SESSION_COMMAND', command: { type: 'SET_TIMER', sessionId: 'original', documentId: null, slideId: null,
  revision: 0, commandId: 'config', mode: 'countdown', durationSec: 2, visible: true } };
async function fixture() {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), session = fixtureSession(); session.revision = 0;
  const repo = await open(); await repo.create(session); repo.close(); return { open, session };
}
describe('durable timer commands', () => {
  it('persists an alarm claim once, rejects Remote claims and retains pending state after write failure', async () => {
    const { open } = await fixture(), publish = vi.fn(); let now = 1000;
    const hub = new SessionHub(open, publish, undefined, () => now);
    await hub.handle('remote', configure);
    await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'SET_TIMER_SOUND', sessionId: 'original', documentId: null, slideId: null, revision: 1, commandId: 'sound', sound: true } });
    await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'PLAY_TIMER', sessionId: 'original', documentId: null, slideId: null, revision: 2, commandId: 'start' } });
    now = 3000; await hub.handle('player', { type: 'SESSION_COMMAND', command: { type: 'FINISH_TIMER', sessionId: 'original', documentId: null, slideId: null, revision: 3, commandId: 'finish', epoch: 'start' } });
    const request = { type: 'SESSION_COMMAND', command: { type: 'CLAIM_TIMER_ALARM', sessionId: 'original', documentId: null, slideId: null, revision: 4, commandId: 'alarm', epoch: 'start' } };
    expect(await hub.handle('remote', request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    const failing = new SessionHub(async () => { const repo = await open(); vi.spyOn(repo, 'commit').mockRejectedValue(new Error('Synthetic failure')); return repo; }, publish, undefined, () => now);
    expect(await failing.handle('player', request)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' });
    const result = await hub.handle('player', request); expect(result).toMatchObject({ ok: true }); expect(await hub.handle('player', request)).toEqual(result); expect(publish).toHaveBeenCalledTimes(5);
    expect(await hub.handle('player', { ...request, command: { ...request.command, revision: 5, commandId: 'duplicate-alarm' } })).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
  });
  it('persists running position once without replacing the playback epoch', async () => {
    const { open } = await fixture(), publish = vi.fn(), hub = new SessionHub(open, publish, undefined, () => 1000);
    await hub.handle('remote', configure);
    await hub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'PLAY_TIMER', sessionId: 'original', documentId: null, slideId: null, revision: 1, commandId: 'start' } });
    const request = { type: 'SESSION_COMMAND', command: { type: 'SET_TIMER_POSITION', sessionId: 'original', documentId: null, slideId: null, revision: 2, commandId: 'move', position: { x: .25, y: .75 } } };
    expect(await hub.handle('player', request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    const result = await hub.handle('remote', request); expect(result).toMatchObject({ ok: true }); expect(await hub.handle('remote', request)).toEqual(result);
    expect(publish).toHaveBeenCalledTimes(3); const repo = await open(), state = (await repo.read('original'))!.session; repo.close();
    expect(state.globalTimer).toMatchObject({ position: { x: .25, y: .75 }, epoch: 'start', startedAt: 1000, paused: false });
  });
  it('commits once, restores through a new hub, and validates Player completion against durable deadline', async () => {
    const { open } = await fixture(), publish = vi.fn(); let now = 1000;
    const hub = new SessionHub(open, publish, undefined, () => now);
    expect(await hub.handle('player', configure)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    const configured = await hub.handle('remote', configure); expect(configured).toMatchObject({ ok: true });
    expect(await hub.handle('remote', configure)).toEqual(configured); expect(publish).toHaveBeenCalledTimes(1);
    const play = { type: 'SESSION_COMMAND', command: { type: 'PLAY_TIMER', sessionId: 'original', documentId: null, slideId: null, revision: 1, commandId: 'start' } };
    expect(await hub.handle('remote', play)).toMatchObject({ ok: true });
    const restarted = new SessionHub(open, publish, undefined, () => now);
    const finish = { type: 'SESSION_COMMAND', command: { type: 'FINISH_TIMER', sessionId: 'original', documentId: null, slideId: null, revision: 2, commandId: 'finish', epoch: 'start' } };
    expect(await restarted.handle('remote', finish)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    now = 2999; expect(await restarted.handle('player', finish)).toMatchObject({ ok: false, code: 'INVALID_TARGET' });
    now = 3000; const completed = await restarted.handle('player', finish); expect(completed).toMatchObject({ ok: true });
    expect(await restarted.handle('player', finish)).toEqual(completed); expect(publish).toHaveBeenCalledTimes(3);
    const repo = await open(), saved = (await repo.read('original'))!.session; repo.close();
    expect(saved.globalTimer).toMatchObject({ elapsedBeforeStartMs: 2000, paused: true, startedAt: null, epoch: 'start' });
    expect(saved.presentedSelection).toEqual({ documentId: 'A', slideId: 'A-2' });
    expect(saved.documents.A!.slideDeltas['A-2']!.presenterNote).toBe('Synthetic teacher note');
  });
  it('does not publish or mutate the session on strict timer commit failure', async () => {
    const { open, session } = await fixture(), publish = vi.fn();
    const hub = new SessionHub(async () => { const repo = await open(); vi.spyOn(repo, 'commit').mockRejectedValue(new Error('Synthetic failure')); return repo; }, publish, undefined, () => 100);
    expect(await hub.handle('remote', configure)).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' }); expect(publish).not.toHaveBeenCalled();
    const repo = await open(); expect((await repo.read('original'))!.session).toEqual(session); repo.close();
  });
});
