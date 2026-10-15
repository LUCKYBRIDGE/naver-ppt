import { CommandError } from '../core/session';
import type { ClassSession } from '../core/types';
import type { SessionRecord, SessionRepository } from './sessionService';
import { assertSessionRecord, decodeStoredRecord, StorageError } from './validateSessionRecord';
import type { SessionSummary } from '../shared/sessionMessages';

const STORE = 'sessions';

export class IndexedDbSessionRepository implements SessionRepository {
  private closed = false;
  private constructor(private readonly db: IDBDatabase) {
    db.onversionchange = () => this.close();
    db.onclose = () => { this.closed = true; };
  }

  static open(options: { factory?: IDBFactory; databaseName?: string } = {}): Promise<IndexedDbSessionRepository> {
    return new Promise((resolve, reject) => {
      const factory = options.factory ?? globalThis.indexedDB;
      if (!factory) { reject(new StorageError('STORAGE_UNAVAILABLE')); return; }
      let abandoned = false;
      const request = factory.open(options.databaseName ?? 'naver-ppt-sessions', 1);
      request.onblocked = () => { abandoned = true; reject(new StorageError('STORAGE_BLOCKED')); };
      request.onerror = () => reject(request.error ?? new StorageError('STORAGE_UNAVAILABLE'));
      request.onupgradeneeded = () => {
        if (abandoned) { request.transaction?.abort(); return; }
        request.result.createObjectStore(STORE, { keyPath: 'session.id' });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (abandoned) { db.close(); return; }
        try {
          if (!db.objectStoreNames.contains(STORE) || db.transaction(STORE).objectStore(STORE).keyPath !== 'session.id') {
            throw new StorageError('UNSUPPORTED_SCHEMA');
          }
          resolve(new IndexedDbSessionRepository(db));
        } catch (error) { db.close(); reject(error); }
      };
    });
  }

  close(): void { this.closed = true; this.db.close(); }

  private transaction(mode: IDBTransactionMode): IDBTransaction {
    if (this.closed) throw new StorageError('STORAGE_UNAVAILABLE');
    const transaction = mode === 'readwrite'
      ? this.db.transaction(STORE, mode, { durability: 'strict' })
      : this.db.transaction(STORE, mode);
    if (mode === 'readwrite' && transaction.durability !== 'strict') {
      transaction.abort();
      throw new StorageError('STORAGE_UNAVAILABLE');
    }
    return transaction;
  }

  private run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, done: (value: T) => void, fail: (error: unknown) => void) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.transaction(mode);
      let result: T;
      let failure: unknown;
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(failure ?? transaction.error ?? new StorageError('STORAGE_UNAVAILABLE'));
      const fail = (error: unknown) => { failure = error; transaction.abort(); };
      try { work(transaction.objectStore(STORE), value => { result = value; }, fail); }
      catch (error) { fail(error); }
    });
  }

  async create(session: ClassSession): Promise<void> {
    const record = structuredClone({ session, receipts: [] });
    assertSessionRecord(record);
    if (session.revision !== 0) throw new StorageError('INVALID_RECORD');
    await this.run<void>('readwrite', (store, done, fail) => {
      const request = store.add({ schemaVersion: 1, ...record });
      request.onsuccess = () => done(undefined);
      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') fail(new StorageError('SESSION_EXISTS'));
      };
    });
  }

  async read(sessionId: string): Promise<SessionRecord | null> {
    if (!sessionId.trim()) throw new StorageError('INVALID_RECORD');
    return this.run('readonly', (store, done, fail) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        try {
          const record = request.result === undefined ? null : decodeStoredRecord(request.result);
          if (record && record.session.id !== sessionId) throw new StorageError('INVALID_RECORD');
          done(record);
        } catch (error) { fail(error); }
      };
    });
  }

  async list(): Promise<SessionSummary[]> {
    return this.run('readonly', (store, done, fail) => {
      const summaries: SessionSummary[] = [];
      const request = store.openCursor();
      request.onsuccess = () => {
        try {
          const cursor = request.result;
          if (!cursor) { done(summaries); return; }
          const { session } = decodeStoredRecord(cursor.value);
          summaries.push({ id: session.id, title: session.title, revision: session.revision,
            updatedAt: session.updatedAt, documentCount: session.documentOrder.length });
          summaries.sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
          if (summaries.length > 20) summaries.pop();
          cursor.continue();
        } catch (error) { fail(error); }
      };
    });
  }

  async commit(record: SessionRecord, expectedRevision: number): Promise<void> {
    const snapshot = structuredClone(record);
    assertSessionRecord(snapshot);
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0
      || snapshot.session.revision !== expectedRevision + 1
      || snapshot.receipts.at(-1)?.revision !== snapshot.session.revision) throw new StorageError('INVALID_RECORD');
    await this.run<void>('readwrite', (store, done, fail) => {
      // The revision read and the write share one transaction across all connections.
      const request = store.get(snapshot.session.id);
      request.onsuccess = () => {
        try {
          if (request.result === undefined) throw new CommandError('INVALID_CONTEXT');
          const previous = decodeStoredRecord(request.result);
          if (previous.session.revision !== expectedRevision) throw new CommandError('STALE_REVISION');
          const receipt = snapshot.receipts.at(-1)!;
          const expectedReceipts = [...previous.receipts, receipt].slice(-256);
          if (previous.receipts.some(item => item.commandId === receipt.commandId)
            || snapshot.receipts.length !== expectedReceipts.length
            || snapshot.receipts.some((item, index) => item.commandId !== expectedReceipts[index]?.commandId
              || item.revision !== expectedReceipts[index]?.revision)) throw new StorageError('INVALID_RECORD');
          const write = store.put({ schemaVersion: 1, ...snapshot });
          write.onsuccess = () => done(undefined);
        } catch (error) { fail(error); }
      };
    });
  }
}
