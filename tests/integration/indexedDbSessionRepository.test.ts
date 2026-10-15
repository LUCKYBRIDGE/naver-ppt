import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore, IDBDatabase } from 'fake-indexeddb';
import { createSession } from '../../src/core/session';
import { SessionService, type SessionRecord } from '../../src/storage/sessionService';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import type { SessionCommand } from '../../src/core/commands';

const connections: IndexedDbSessionRepository[] = [];
afterEach(() => { vi.restoreAllMocks(); connections.splice(0).forEach(repo => repo.close()); });
async function open(factory = new IDBFactory()) {
  const repo = await IndexedDbSessionRepository.open({ factory });
  connections.push(repo);
  return repo;
}
async function ready(factory = new IDBFactory()) {
  const repo = await open(factory);
  await repo.create(createSession('synthetic-lesson', 'Synthetic lesson', 1));
  return { repo, factory };
}
function registration(commandId = 'register'): SessionCommand {
  return {
    type: 'REGISTER_DOCUMENT', commandId, sessionId: 'synthetic-lesson', revision: 0, documentId: 'A', slideId: null,
    document: {
      id: 'A', source: { type: 'pdf', name: 'synthetic.pdf', size: 100, lastModified: 0 },
      lastSlideId: null, knownSlideCount: 8, slideIds: Array.from({ length: 8 }, (_, i) => `A-${i + 1}`),
      slideDeltas: {}, mediaBookmarks: {}, dirty: false,
    },
  };
}
function webRegistration(commandId = 'web-register'): SessionCommand {
  return { type: 'REGISTER_DOCUMENT', commandId, sessionId: 'synthetic-lesson', revision: 0, documentId: 'W', slideId: null,
    document: { id: 'W', source: { type: 'canva', url: 'https://www.canva.com/design/example', title: 'Canva 수업' }, lastSlideId: null,
      knownSlideCount: null, slideIds: [], slideDeltas: {}, mediaBookmarks: {}, dirty: false } };
}
async function rawWrite(factory: IDBFactory, value: unknown) {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('naver-ppt-sessions');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      tx.objectStore('sessions').put(value);
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    });
  } finally { db.close(); }
}

describe('Stage A IndexedDB repository (fake-indexeddb)', () => {
  it('creates, reads and reports missing sessions without overwriting existing ones', async () => {
    const { repo } = await ready();
    expect(await repo.read('missing')).toBeNull();
    const before = await repo.read('synthetic-lesson');
    await expect(repo.create(createSession('synthetic-lesson', 'replacement', 2))).rejects.toThrow('SESSION_EXISTS');
    expect(await repo.read('synthetic-lesson')).toEqual(before);
  });
  it('persists an approved W0 link without inventing a slide or changing selections', async () => {
    const { repo, factory } = await ready();
    expect(await new SessionService(repo).execute(webRegistration())).toMatchObject({ ok: true });
    const before = await repo.read('synthetic-lesson');
    expect(before?.session.documents.W?.source).toEqual({ type: 'canva', url: 'https://www.canva.com/design/example', title: 'Canva 수업' });
    expect(before?.session.documents.W?.slideIds).toEqual([]);
    expect(before?.session.presentedSelection).toBeNull();
    repo.close();
    const restored = await open(factory);
    expect((await restored.read('synthetic-lesson'))?.session.documents.W?.knownSlideCount).toBeNull();
  });
  it('restores last page, independent editor selection, dirty note and command receipts after reconnect', async () => {
    const { repo, factory } = await ready();
    const service = new SessionService(repo, () => 10);
    expect(await service.execute(registration())).toMatchObject({ ok: true });
    const commands: SessionCommand[] = [
      { type: 'ACTIVATE_DOCUMENT', documentId: 'A', slideId: null, sessionId: 'synthetic-lesson', commandId: 'activate', revision: 1 },
      { type: 'GOTO_SLIDE', documentId: 'A', slideId: 'A-5', sessionId: 'synthetic-lesson', commandId: 'goto', revision: 2 },
      { type: 'SELECT_EDITOR_SLIDE', documentId: 'A', slideId: 'A-8', sessionId: 'synthetic-lesson', commandId: 'select', revision: 3 },
      { type: 'SET_PRESENTER_NOTE', documentId: 'A', slideId: 'A-8', sessionId: 'synthetic-lesson', commandId: 'note', revision: 4, note: 'Synthetic private note' },
    ];
    for (const command of commands) expect(await service.execute(command)).toMatchObject({ ok: true });
    const before = await repo.read('synthetic-lesson'); repo.close();
    const restored = await open(factory);
    expect(await restored.read('synthetic-lesson')).toEqual(before);
    expect(before?.session.presentedSelection?.slideId).toBe('A-5');
    expect(before?.session.editorSelection?.slideId).toBe('A-8');
    expect(before?.session.documents.A?.dirty).toBe(true);
    expect(await new SessionService(restored).execute(commands[3]!)).toMatchObject({ ok: true, duplicate: true, revision: 5 });
    expect((await restored.read('synthetic-lesson'))?.session.revision).toBe(5);
  });
  it('protects state against two concurrent repository connections', async () => {
    const { repo, factory } = await ready();
    const other = await open(factory);
    const results = await Promise.all([
      new SessionService(repo).execute(registration('first')),
      new SessionService(other).execute(registration('second')),
    ]);
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toEqual([{ ok: false, code: 'STALE_REVISION' }]);
    const saved = await repo.read('synthetic-lesson');
    expect(saved?.session.revision).toBe(1); expect(saved?.receipts).toHaveLength(1);
  });
  it('persists committed overlays and retains them on a failed replacement', async () => {
    const { repo, factory } = await ready(); const service = new SessionService(repo);
    await service.execute(registration());
    const command: SessionCommand = { type: 'SET_SLIDE_OVERLAYS', sessionId: 'synthetic-lesson', documentId: 'A', slideId: 'A-5', revision: 1, commandId: 'overlay',
      overlays: [{ kind: 'mask', id: 'mask', zIndex: 1, visible: true, color: '#000', rect: { x: .1, y: .1, width: .5, height: .4 } }] };
    expect(await service.execute(command)).toMatchObject({ ok: true });
    const before = await repo.read('synthetic-lesson');
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(await service.execute({ ...command, commandId: 'replace', revision: 2, overlays: [] })).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    spy.mockRestore(); repo.close(); const restored = await open(factory);
    expect(await restored.read('synthetic-lesson')).toEqual(before);
    expect(before?.session.documents.A?.slideDeltas['A-5']?.overlays).toEqual(command.overlays);
  });
  it('rolls back state and receipts if the transaction aborts after the put succeeds', async () => {
    const { repo } = await ready();
    const before = await repo.read('synthetic-lesson');
    const original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    const service = new SessionService(repo);
    expect(await service.execute(registration())).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(await repo.read('synthetic-lesson')).toEqual(before);
    spy.mockRestore();
    expect(await service.execute(registration())).toMatchObject({ ok: true, duplicate: false });
  });
  it('keeps recoverable state on quota errors and permits retry', async () => {
    const { repo } = await ready();
    const before = await repo.read('synthetic-lesson');
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    expect(await new SessionService(repo).execute(registration())).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(await repo.read('synthetic-lesson')).toEqual(before);
    spy.mockRestore();
    expect(await new SessionService(repo).execute(registration())).toMatchObject({ ok: true });
  });
  it('rejects a fabricated revision or altered receipt history', async () => {
    const { repo } = await ready();
    await new SessionService(repo).execute(registration());
    const record = (await repo.read('synthetic-lesson'))!;
    const next = structuredClone(record); next.session.revision = 2;
    next.receipts = [{ commandId: 'fabricated-history', revision: 1 }, { commandId: 'next', revision: 2 }];
    await expect(repo.commit(next, 1)).rejects.toThrow('INVALID_RECORD');
    await expect(repo.commit(record, 0)).rejects.toThrow('STALE_REVISION');
    expect(await repo.read('synthetic-lesson')).toEqual(record);
  });
  it('refuses corrupt records and unknown schema versions without resetting them', async () => {
    const { repo, factory } = await ready();
    const record = (await repo.read('synthetic-lesson'))!;
    await rawWrite(factory, { schemaVersion: 99, ...record });
    await expect(repo.read('synthetic-lesson')).rejects.toThrow('UNSUPPORTED_SCHEMA');
    await expect(repo.create(record.session)).rejects.toThrow('SESSION_EXISTS');
    const corrupt = structuredClone(record); corrupt.session.revision = -1;
    await rawWrite(factory, { schemaVersion: 1, ...corrupt });
    await expect(repo.read('synthetic-lesson')).rejects.toThrow('INVALID_RECORD');
  });
  it('rejects original file bytes and non-JSON values instead of persisting them', async () => {
    const { repo } = await ready();
    const command = registration();
    if (command.type !== 'REGISTER_DOCUMENT') throw new Error('fixture');
    Object.assign(command.document.source, { bytes: new Uint8Array([1, 2]) });
    expect(await new SessionService(repo).execute(command)).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect((await repo.read('synthetic-lesson'))?.session.revision).toBe(0);
    const record = (await repo.read('synthetic-lesson'))!;
    Object.assign(record.session, { file: new Blob(['synthetic']) });
    expect(() => assertSessionRecord(record)).toThrow('INVALID_RECORD');
  });
  it('rejects unapproved W0 URLs without changing the saved session', async () => {
    const { repo } = await ready(); await new SessionService(repo).execute(registration());
    const record = (await repo.read('synthetic-lesson'))!, document = record.session.documents.A!;
    document.source = { type: 'canva', url: 'https://example.com/private', title: 'Untrusted' };
    expect(() => assertSessionRecord(record)).toThrow('INVALID_RECORD');
    expect((await repo.read('synthetic-lesson'))!.session.documents.A!.source.type).toBe('pdf');
  });
  it('returns detached snapshots and rejects operations on a closed connection', async () => {
    const { repo } = await ready();
    const record = (await repo.read('synthetic-lesson'))!;
    record.session.title = 'changed';
    expect((await repo.read('synthetic-lesson'))?.session.title).toBe('Synthetic lesson');
    repo.close();
    await expect(repo.read('synthetic-lesson')).rejects.toThrow('STORAGE_UNAVAILABLE');
  });
  it('rejects an incompatible database version without deleting it', async () => {
    const factory = new IDBFactory();
    const db = await new Promise<IDBDatabase>(resolve => {
      const request = factory.open('naver-ppt-sessions', 2); request.onsuccess = () => resolve(request.result);
    });
    db.close();
    await expect(open(factory)).rejects.toMatchObject({ name: 'VersionError' });
  });
  it('refuses writes when strict durability is silently ignored', async () => {
    const { repo } = await ready();
    const before = await repo.read('synthetic-lesson');
    const original = IDBDatabase.prototype.transaction;
    const spy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, stores, mode) {
      return original.call(this, stores, mode, { durability: 'relaxed' });
    });
    expect(await new SessionService(repo).execute(registration())).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(await repo.read('synthetic-lesson')).toEqual(before);
    spy.mockRestore();
  });
  it('bounds durable receipts at 256 and keeps rejecting expired stale commands', async () => {
    const { repo } = await ready();
    const service = new SessionService(repo);
    await service.execute(registration());
    for (let revision = 1; revision < 258; revision++) {
      expect(await service.execute({ type: 'ACTIVATE_DOCUMENT', documentId: 'A', slideId: null,
        sessionId: 'synthetic-lesson', commandId: `activate-${revision}`, revision })).toMatchObject({ ok: true });
    }
    expect((await repo.read('synthetic-lesson'))?.receipts).toHaveLength(256);
    expect(await service.execute(registration())).toEqual({ ok: false, code: 'STALE_REVISION' });
  });
});

describe('stored record validation', () => {
  it('validates slide membership, selections and normalized overlay boundaries', async () => {
    const { repo } = await ready(); await new SessionService(repo).execute(registration());
    const record: SessionRecord = (await repo.read('synthetic-lesson'))!;
    record.session.editorSelection = { documentId: 'A', slideId: 'missing' };
    expect(() => assertSessionRecord(record)).toThrow('INVALID_RECORD');
    record.session.editorSelection = null;
    record.session.documents.A!.slideDeltas['A-1'] = {
      overlays: [{ kind: 'mask', id: 'mask', zIndex: 1, visible: true, color: '#000000', rect: { x: 0.9, y: 0, width: 0.2, height: 1 } }],
      presenterNote: '', classLog: '',
    };
    expect(() => assertSessionRecord(record)).toThrow('INVALID_RECORD');
  });
});
