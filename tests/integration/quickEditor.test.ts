import { describe, it, expect, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { isSessionRequest } from '../../src/shared/sessionMessages';

const command = { type: 'SELECT_EDITOR_SLIDE', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 0, commandId: 'quick' } as const;
const request = { type: 'OPEN_CURRENT_EDITOR', command } as const;
async function setup() {
  const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), session = fixtureSession(); session.revision = 0;
  const repository = await open(); await repository.create(session); repository.close();
  const publish = vi.fn(), hub = new SessionHub(open, publish, undefined, () => 10);
  const read = async () => { const repository = await open(); try { return (await repository.read('original'))!; } finally { repository.close(); } };
  return { hub, publish, read, session };
}
describe('Player narrow current-editor request', () => {
  it('commits only editor selection, emits public response and deduplicates without exposing notes', async () => {
    const { hub, publish, read, session } = await setup();
    const result = await hub.handle('player', request);
    expect(result).toMatchObject({ ok: true, kind: 'player' }); expect(JSON.stringify(result)).not.toContain('Synthetic teacher note');
    const saved = (await read()).session; expect(saved.editorSelection).toEqual(session.presentedSelection);
    expect(saved.presentedSelection).toEqual(session.presentedSelection); expect(saved.documents).toEqual(session.documents);
    expect(saved.revision).toBe(1); expect((await read()).receipts).toHaveLength(1);
    expect(await hub.handle('player', request)).toEqual(result); expect(publish).toHaveBeenCalledTimes(1);
  });
  it('refuses stale or non-current targets and leaves the full session unchanged', async () => {
    const { hub, read, session } = await setup();
    expect(await hub.handle('player', { ...request, command: { ...command, revision: 4 } })).toMatchObject({ ok: false, code: 'STALE_REVISION' });
    expect(await hub.handle('player', { ...request, command: { ...command, slideId: 'A-1' } })).toMatchObject({ ok: false });
    expect((await read()).session).toEqual(session);
  });
  it('does not expand Player raw editing or other roles quick-editor permission', async () => {
    const { hub, read, session } = await setup();
    for (const role of ['launcher', 'editor', 'remote'] as const) expect(await hub.handle(role, request)).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect((await read()).session).toEqual(session);
  });
  it('validates exact fields and non-null targets before routing', () => {
    expect(isSessionRequest(request)).toBe(true);
    expect(isSessionRequest({ ...request, command: { ...command, slideId: null } })).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...command, type: 'GOTO_SLIDE' } })).toBe(false);
    expect(isSessionRequest({ ...request, note: 'Synthetic extra' })).toBe(false);
  });
});
