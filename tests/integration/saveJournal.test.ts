import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBDatabase, IDBObjectStore } from 'fake-indexeddb';
import { IndexedDbSaveJournal, MAX_SAVE_ATTEMPTS, assertSaveRecord, type SaveAttempt } from '../../src/storage/saveJournal';

const attempt = (exportId = 'export-1'): SaveAttempt => ({ exportId, sessionId: 'synthetic', revision: 4, bytes: 100, sha256: 'a'.repeat(64), createdAt: 10 });
const complete = { state: 'complete', transport: 'downloads', downloadId: 7, completedAt: 20 } as const;
afterEach(() => vi.restoreAllMocks());
describe('FR-014 strict save-result journal (fake-indexeddb)', () => {
  it('finds only a complete matching session/revision/hash without promoting prepared or failed entries', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() }); await journal.prepare(attempt());
    expect(await journal.findComplete('synthetic', 4, 'a'.repeat(64))).toBeNull();
    await journal.finish('export-1', complete);
    expect((await journal.findComplete('synthetic', 4, 'a'.repeat(64)))?.exportId).toBe('export-1');
    expect(await journal.findComplete('synthetic', 3, 'a'.repeat(64))).toBeNull(); expect(await journal.findComplete('other', 4, 'a'.repeat(64))).toBeNull();
    await journal.prepare(attempt('failed')); await journal.finish('failed', { state: 'failed', completedAt: 20 });
    expect((await journal.findComplete('synthetic', 4, 'a'.repeat(64)))?.exportId).toBe('export-1');
  });
  it('recovers prepared and complete evidence through fresh connections without file content or paths', async () => {
    const factory = new IDBFactory(), journal = new IndexedDbSaveJournal({ factory });
    await journal.prepare(attempt());
    expect(await new IndexedDbSaveJournal({ factory }).read('export-1')).toEqual({ ...attempt(), schemaVersion: 1, state: 'prepared' });
    await journal.finish('export-1', complete);
    expect(await new IndexedDbSaveJournal({ factory }).read('export-1')).toEqual({ ...attempt(), schemaVersion: 1, ...complete });
    expect(await journal.read('missing')).toBeNull();
  });
  it('never overwrites prepared snapshots or changes a terminal result, but allows an identical replay', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() }); await journal.prepare(attempt());
    await expect(journal.prepare({ ...attempt(), revision: 9 })).rejects.toMatchObject({ name: 'ConstraintError' });
    await journal.finish('export-1', complete); await journal.finish('export-1', complete);
    await expect(journal.finish('export-1', { state: 'cancelled', completedAt: 21 })).rejects.toThrow('INVALID_SAVE_RECORD');
    await expect(journal.finish('export-1', { ...complete, downloadId: 8 })).rejects.toThrow('SAVE_ALREADY_FINISHED');
    expect((await journal.read('export-1'))?.revision).toBe(4);
  });
  it('serializes two competing completions and retains exactly one terminal result', async () => {
    const factory = new IDBFactory(), first = new IndexedDbSaveJournal({ factory }), second = new IndexedDbSaveJournal({ factory });
    await first.prepare(attempt());
    const results = await Promise.allSettled([first.finish('export-1', complete), second.finish('export-1', { ...complete, downloadId: 8 })]);
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect((await first.read('export-1'))?.state).toBe('complete');
  });
  it.each(['failed', 'cancelled'] as const)('records %s without inventing completion', async state => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() }); await journal.prepare(attempt());
    await journal.finish('export-1', { state, completedAt: 20 });
    expect(await journal.read('export-1')).toMatchObject({ state, revision: 4 });
    await expect(journal.finish('missing', complete)).rejects.toThrow('INVALID_SAVE_RECORD');
  });
  it('rolls back a completion aborted after put success and permits retry', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() }); await journal.prepare(attempt());
    const original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args) {
      const request = original.apply(this, args); request.addEventListener('success', () => this.transaction.abort()); return request;
    });
    await expect(journal.finish('export-1', complete)).rejects.toBeTruthy(); spy.mockRestore();
    expect((await journal.read('export-1'))?.state).toBe('prepared');
    await journal.finish('export-1', complete); expect((await journal.read('export-1'))?.state).toBe('complete');
  });
  it('preserves prepared recovery evidence on quota failure and rejects relaxed durability', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() }); await journal.prepare(attempt());
    const put = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => { throw new DOMException('full', 'QuotaExceededError'); });
    await expect(journal.finish('export-1', complete)).rejects.toMatchObject({ name: 'QuotaExceededError' }); put.mockRestore();
    const original = IDBDatabase.prototype.transaction;
    const transaction = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function (this: IDBDatabase, stores, mode) {
      return original.call(this, stores, mode, { durability: 'relaxed' });
    });
    await expect(journal.finish('export-1', complete)).rejects.toThrow('SAVE_STORAGE_UNAVAILABLE'); transaction.mockRestore();
    expect((await journal.read('export-1'))?.state).toBe('prepared');
  });
  it('bounds metadata without silently deleting old evidence', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() });
    for (let index = 0; index < MAX_SAVE_ATTEMPTS; index++) await journal.prepare(attempt(`export-${index}`));
    await expect(journal.prepare(attempt('overflow'))).rejects.toThrow('SAVE_JOURNAL_FULL');
    expect(await journal.read('overflow')).toBeNull(); expect(await journal.read('export-0')).not.toBeNull();
  });
  it('rejects extra content, malformed hashes and injected changes to captured metadata', async () => {
    const journal = new IndexedDbSaveJournal({ factory: new IDBFactory() });
    await expect(journal.prepare({ ...attempt(), bytes: 0 })).rejects.toThrow('INVALID_SAVE_RECORD');
    expect(() => assertSaveRecord({ ...attempt(), schemaVersion: 1, state: 'prepared', file: new Blob(['synthetic']) })).toThrow();
    expect(() => assertSaveRecord({ ...attempt(), schemaVersion: 99, state: 'prepared' })).toThrow();
    expect(() => assertSaveRecord({ ...attempt(), sha256: 'bad', schemaVersion: 1, state: 'prepared' })).toThrow();
    await journal.prepare(attempt());
    await expect(journal.finish('export-1', { ...complete, revision: 99 } as typeof complete)).rejects.toThrow('INVALID_SAVE_RECORD');
    await expect(journal.finish('export-1', { ...complete, completedAt: 9 })).rejects.toThrow('INVALID_SAVE_RECORD');
    expect((await journal.read('export-1'))?.revision).toBe(4);
  });
});
