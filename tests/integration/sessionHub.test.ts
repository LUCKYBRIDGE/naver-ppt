import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub, snapshotFor } from '../../src/background/sessionHub';
import { WindowManager } from '../../src/background/windowManager';
import type { SessionCommand } from '../../src/core/commands';
import type { PageRole } from '../../src/shared/sessionMessages';
import { fixtureSession } from '../fixtures/session';
import { createSessionBundle } from '../../src/storage/sessionBundle';

function fixture() {
  const factory = new IDBFactory();
  const publish = vi.fn();
  const open = () => IndexedDbSessionRepository.open({ factory });
  const hub = new SessionHub(open, publish, () => 'lesson', () => 1);
  return { hub, publish, open };
}
const register: SessionCommand = { type: 'REGISTER_DOCUMENT', sessionId: 'lesson', documentId: 'A', slideId: null, revision: 0, commandId: 'register',
  document: { id: 'A', source: { type: 'pdf', name: 'Synthetic.pdf', size: 100, lastModified: 0 }, lastSlideId: null, knownSlideCount: 1,
    slideIds: ['A-1'], slideDeltas: {}, mediaBookmarks: {}, dirty: false } };
describe('session hub + durable IndexedDB', () => {
  it('verifies only from teacher roles and rejects a revision changed on another connection during the file read', async () => {
    const { hub, open, publish } = fixture(); await hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Synthetic' });
    const request = { type: 'VERIFY_SAVED_BACKUP', sessionId: 'lesson', revision: 0, blobUrl: 'blob:chrome-extension://synthetic/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };
    const verification = { exportId: 'export', sessionId: 'lesson', revision: 0, sha256: 'a'.repeat(64), verifiedAt: 2 };
    const verify = vi.fn(async () => verification), verifierHub = new SessionHub(open, publish, undefined, undefined, verify);
    expect(await verifierHub.handle('player', request)).toMatchObject({ ok: false, code: 'FORBIDDEN' }); expect(verify).not.toHaveBeenCalled();
    expect(await verifierHub.handle('editor', request)).toEqual({ ok: true, kind: 'backup-verification', verification }); expect(publish).not.toHaveBeenCalled();
    verify.mockImplementation(async () => { await hub.handle('editor', { type: 'SESSION_COMMAND', command: register }); return verification; });
    expect(await verifierHub.handle('remote', request)).toMatchObject({ ok: false, code: 'STALE_REVISION' });
    expect((await hub.handle('editor', { type: 'GET_SESSION', sessionId: 'lesson' }))).toMatchObject({ session: { revision: 1, documentOrder: ['A'] } });
  });
  it('creates, lists and restores a session through a fresh hub', async () => {
    const { hub, publish, open } = fixture();
    expect(await hub.handle('launcher', { type: 'CREATE_SESSION', title: ' Lesson ' })).toMatchObject({ ok: true, kind: 'teacher', session: { id: 'lesson', title: 'Lesson' } });
    expect(await hub.handle('launcher', { type: 'LIST_SESSIONS' })).toMatchObject({ ok: true, kind: 'list', sessions: [{ id: 'lesson', documentCount: 0 }] });
    expect(await new SessionHub(open, publish).handle('remote', { type: 'GET_SESSION', sessionId: 'lesson' })).toMatchObject({ ok: true, kind: 'teacher', session: { id: 'lesson', revision: 0 } });
  });
  it('rejects malformed and forbidden messages before opening the DB', async () => {
    const open = vi.fn(); const hub = new SessionHub(open, vi.fn());
    expect(await hub.handle('remote', { type: 'CREATE_SESSION', title: 'Lesson' })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: register })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
    expect(await hub.handle('launcher', { type: 'CREATE_SESSION', title: null })).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
    expect(open).not.toHaveBeenCalled();
  });
  it('imports to a new strict record and preserves existing lesson/private boundary', async () => {
    const { hub, open, publish } = fixture(); await hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Existing' });
    const before = await hub.handle('editor', { type: 'GET_SESSION', sessionId: 'lesson' });
    const restoredHub = new SessionHub(open, publish, () => 'restored', () => 2);
    const bundle = createSessionBundle(fixtureSession(), 100);
    expect(await restoredHub.handle('launcher', { type: 'IMPORT_SESSION', bundle })).toMatchObject({ ok: true, session: { id: 'restored', revision: 0, presentedSelection: null } });
    expect(await hub.handle('editor', { type: 'GET_SESSION', sessionId: 'lesson' })).toEqual(before);
    const player = await new SessionHub(open, publish).handle('player', { type: 'GET_SESSION', sessionId: 'restored' });
    expect(JSON.stringify(player)).not.toMatch(/Synthetic teacher note|Synthetic log/); expect(publish).not.toHaveBeenCalled();
  });
  it('does not overwrite a session if the generated restore ID collides', async () => {
    const { hub } = fixture(); await hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Existing' });
    expect(await hub.handle('launcher', { type: 'IMPORT_SESSION', bundle: createSessionBundle(fixtureSession(), 100) })).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(await hub.handle('editor', { type: 'GET_SESSION', sessionId: 'lesson' })).toMatchObject({ ok: true, session: { title: 'Existing', documentOrder: [] } });
  });
  it('rejects unsupported/corrupt imports before opening storage', async () => {
    const open = vi.fn(), hub = new SessionHub(open, vi.fn());
    const bundle = createSessionBundle(fixtureSession(), 100);
    expect(await hub.handle('launcher', { type: 'IMPORT_SESSION', bundle: { ...bundle, schemaVersion: 99 } })).toMatchObject({ ok: false, code: 'INVALID_REQUEST' });
    expect(await hub.handle('editor', { type: 'IMPORT_SESSION', bundle })).toMatchObject({ ok: false, code: 'FORBIDDEN' }); expect(open).not.toHaveBeenCalled();
  });
  it('publishes only committed changes and keeps the Player snapshot private', async () => {
    const { hub, publish } = fixture();
    await hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Private title' });
    expect(await hub.handle('launcher', { type: 'SESSION_COMMAND', command: register })).toMatchObject({ ok: true });
    const note: SessionCommand = { type: 'SET_PRESENTER_NOTE', sessionId: 'lesson', documentId: 'A', slideId: 'A-1', revision: 1, commandId: 'note', note: 'Private teacher note' };
    expect(await hub.handle('editor', { type: 'SESSION_COMMAND', command: note })).toMatchObject({ ok: true });
    const player = await hub.handle('player', { type: 'GET_SESSION', sessionId: 'lesson' });
    expect(player).toMatchObject({ ok: true, kind: 'player', snapshot: { sessionId: 'lesson', revision: 2, selection: null } });
    expect(JSON.stringify(player)).not.toContain('Private');
    expect(JSON.stringify(snapshotFor('player', publish.mock.calls.at(-1)![0]))).not.toContain('Private');
    const count = publish.mock.calls.length;
    expect(await hub.handle('editor', { type: 'SESSION_COMMAND', command: note })).toMatchObject({ ok: true });
    expect(publish).toHaveBeenCalledTimes(count);
    expect(await hub.handle('editor', { type: 'SESSION_COMMAND', command: { ...note, commandId: 'stale' } })).toMatchObject({ ok: false, code: 'STALE_REVISION' });
    expect(publish).toHaveBeenCalledTimes(count);
  });
  it('does not publish if persistence fails and sanitizes the error', async () => {
    const hub = new SessionHub(async () => { throw new Error('private-path-or-token'); }, vi.fn());
    const response = await hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Lesson' });
    expect(response).toMatchObject({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(JSON.stringify(response)).not.toContain('private-path-or-token');
  });
  it.each(['player', 'remote', 'editor'] as PageRole[])('%s cannot list teacher lesson metadata', async role => {
    const { hub } = fixture();
    expect(await hub.handle(role, { type: 'LIST_SESSIONS' })).toMatchObject({ ok: false, code: 'FORBIDDEN' });
  });
});

describe('window reuse after worker restart', () => {
  function api(windows: unknown[] = []) {
    return { getContexts: vi.fn().mockResolvedValue(windows), create: vi.fn().mockResolvedValue({ id: 10 }), update: vi.fn().mockResolvedValue({}) };
  }
  const url = (path: string) => `whale-extension://ours/${path}`;
  it('deduplicates simultaneous opens', async () => {
    const windows = api(); const manager = new WindowManager(windows as unknown as typeof chrome.windows, url, windows.getContexts);
    await Promise.all([manager.open('remote', 'lesson'), manager.open('remote', 'lesson')]);
    expect(windows.create).toHaveBeenCalledTimes(1);
  });
  it('does not create a duplicate when context lookup is unavailable', async () => {
    const windows = api(); windows.getContexts.mockRejectedValue(new Error('unsupported API'));
    expect(await new WindowManager(windows as unknown as typeof chrome.windows, url, windows.getContexts).open('player', 'lesson'))
      .toMatchObject({ ok: false });
    expect(windows.create).not.toHaveBeenCalled();
  });
  it('finds a preexisting Player without taking focus', async () => {
    const windows = api([{ windowId: 22, documentUrl: url('player/index.html') + '?sessionId=lesson' }]);
    expect(await new WindowManager(windows as unknown as typeof chrome.windows, url, windows.getContexts).open('player', 'lesson')).toEqual({ ok: true, windowId: 22 });
    expect(windows.getContexts).toHaveBeenCalledWith({ documentUrls: [url('player/index.html') + '?sessionId=lesson'] });
    expect(windows.create).not.toHaveBeenCalled(); expect(windows.update).not.toHaveBeenCalled();
  });
  it('keeps different sessions separate and focuses a reused teacher window', async () => {
    const windows = api([{ windowId: 22, documentUrl: url('remote/index.html') + '?sessionId=lesson' }]);
    const manager = new WindowManager(windows as unknown as typeof chrome.windows, url, windows.getContexts);
    await manager.open('remote', 'lesson'); expect(windows.update).toHaveBeenCalledWith(22, { focused: true });
    await manager.open('remote', 'other'); expect(windows.create).toHaveBeenCalledTimes(1);
  });
});
