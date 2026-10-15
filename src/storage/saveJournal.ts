export interface SaveAttempt {
  exportId: string; sessionId: string; revision: number; bytes: number; sha256: string; createdAt: number;
}
export type SaveOutcome =
  | { state: 'complete'; completedAt: number; transport: 'filesystem' }
  | { state: 'complete'; completedAt: number; transport: 'downloads'; downloadId: number }
  | { state: 'failed' | 'cancelled'; completedAt: number };
export type SaveJournalRecord = SaveAttempt & { schemaVersion: 1 } & ({ state: 'prepared' } | SaveOutcome);
export interface SaveJournal {
  prepare(attempt: SaveAttempt): Promise<void>;
  finish(exportId: string, outcome: SaveOutcome): Promise<void>;
  read(exportId: string): Promise<SaveJournalRecord | null>;
}

const STORE = 'attempts';
export const MAX_SAVE_ATTEMPTS = 256;
const integer = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const id = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
export class SaveJournalError extends Error {
  constructor(code: string) { super(code); this.name = 'SaveJournalError'; }
}
function invalid(): never { throw new SaveJournalError('INVALID_SAVE_RECORD'); }
export function assertSaveRecord(value: unknown): asserts value is SaveJournalRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  const r = value as Record<string, unknown>;
  const keys = ['schemaVersion', 'exportId', 'sessionId', 'revision', 'bytes', 'sha256', 'createdAt', 'state'];
  if (r.state !== 'prepared') keys.push('completedAt');
  if (r.state === 'complete') { keys.push('transport'); if (r.transport === 'downloads') keys.push('downloadId'); }
  if (Object.keys(r).length !== keys.length || Object.keys(r).some(key => !keys.includes(key))
    || r.schemaVersion !== 1 || !id(r.exportId) || !id(r.sessionId) || !integer(r.revision)
    || !integer(r.bytes) || r.bytes === 0 || r.bytes > 16 * 1024 * 1024
    || typeof r.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(r.sha256) || !integer(r.createdAt)
    || !['prepared', 'complete', 'failed', 'cancelled'].includes(r.state as string)) invalid();
  if (r.state !== 'prepared' && (!integer(r.completedAt) || r.completedAt < r.createdAt)) invalid();
  if (r.state === 'complete' && (r.transport !== 'filesystem' && r.transport !== 'downloads'
    || r.transport === 'downloads' && !integer(r.downloadId))) invalid();
}

// Each operation closes its connection; no live worker/page is the durable authority.
export class IndexedDbSaveJournal implements SaveJournal {
  constructor(private readonly options: { factory?: IDBFactory; databaseName?: string } = {}) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const factory = this.options.factory ?? globalThis.indexedDB;
      if (!factory) { reject(new SaveJournalError('SAVE_STORAGE_UNAVAILABLE')); return; }
      let abandoned = false;
      const request = factory.open(this.options.databaseName ?? 'naver-ppt-save-journal', 1);
      request.onblocked = () => { abandoned = true; reject(new SaveJournalError('SAVE_STORAGE_BLOCKED')); };
      request.onerror = () => reject(request.error ?? new SaveJournalError('SAVE_STORAGE_UNAVAILABLE'));
      request.onupgradeneeded = () => {
        if (abandoned) { request.transaction?.abort(); return; }
        request.result.createObjectStore(STORE, { keyPath: 'exportId' });
      };
      request.onsuccess = () => {
        const db = request.result;
        if (abandoned) { db.close(); return; }
        try {
          if (!db.objectStoreNames.contains(STORE) || db.transaction(STORE).objectStore(STORE).keyPath !== 'exportId') {
            throw new SaveJournalError('UNSUPPORTED_SAVE_SCHEMA');
          }
          db.onversionchange = () => db.close(); resolve(db);
        } catch (error) { db.close(); reject(error); }
      };
    });
  }
  private async run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, done: (value: T) => void, fail: (error: unknown) => void) => void): Promise<T> {
    const db = await this.open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const tx = mode === 'readwrite' ? db.transaction(STORE, mode, { durability: 'strict' }) : db.transaction(STORE, mode);
        let result: T, failure: unknown;
        tx.oncomplete = () => resolve(result);
        tx.onabort = () => reject(failure ?? tx.error ?? new SaveJournalError('SAVE_STORAGE_UNAVAILABLE'));
        const fail = (error: unknown) => { failure = error; tx.abort(); };
        if (mode === 'readwrite' && tx.durability !== 'strict') { fail(new SaveJournalError('SAVE_STORAGE_UNAVAILABLE')); return; }
        try { work(tx.objectStore(STORE), value => { result = value; }, fail); } catch (error) { fail(error); }
      });
    } finally { db.close(); }
  }
  async prepare(attempt: SaveAttempt): Promise<void> {
    const snapshot = structuredClone({ ...attempt, schemaVersion: 1, state: 'prepared' });
    assertSaveRecord(snapshot);
    await this.run<void>('readwrite', (store, done, fail) => {
      const count = store.count();
      count.onsuccess = () => {
        try {
          if (count.result >= MAX_SAVE_ATTEMPTS) throw new SaveJournalError('SAVE_JOURNAL_FULL');
          const add = store.add(snapshot); add.onsuccess = () => done(undefined);
        } catch (error) { fail(error); }
      };
    });
  }
  async finish(exportId: string, outcome: SaveOutcome): Promise<void> {
    if (!id(exportId)) invalid();
    const detached = structuredClone(outcome);
    const keys = detached.state === 'complete' ? ['state', 'completedAt', 'transport', ...(detached.transport === 'downloads' ? ['downloadId'] : [])]
      : ['state', 'completedAt'];
    if (Object.keys(detached).length !== keys.length || Object.keys(detached).some(key => !keys.includes(key))
      || !['complete', 'failed', 'cancelled'].includes(detached.state)) invalid();
    await this.run<void>('readwrite', (store, done, fail) => {
      const get = store.get(exportId);
      get.onsuccess = () => {
        try {
          assertSaveRecord(get.result);
          const previous: SaveJournalRecord = get.result;
          const next = { ...previous, ...detached }; assertSaveRecord(next);
          // Only an identical replay is allowed once the result has become terminal.
          if (previous.state !== 'prepared') {
            if (Object.keys(next).some(key => next[key as keyof typeof next] !== previous[key as keyof typeof previous])) {
              throw new SaveJournalError('SAVE_ALREADY_FINISHED');
            }
            done(undefined); return;
          }
          const put = store.put(next); put.onsuccess = () => done(undefined);
        } catch (error) { fail(error); }
      };
    });
  }
  async read(exportId: string): Promise<SaveJournalRecord | null> {
    if (!id(exportId)) invalid();
    return this.run('readonly', (store, done, fail) => {
      const get = store.get(exportId);
      get.onsuccess = () => {
        try {
          if (get.result === undefined) { done(null); return; }
          assertSaveRecord(get.result);
          if (get.result.exportId !== exportId) invalid();
          done(get.result);
        } catch (error) { fail(error); }
      };
    });
  }
  async findComplete(sessionId: string, revision: number, sha256: string): Promise<SaveJournalRecord | null> {
    if (!id(sessionId) || !integer(revision) || !/^[a-f0-9]{64}$/.test(sha256)) invalid();
    return this.run('readonly', (store, done, fail) => {
      let match: SaveJournalRecord | null = null, count = 0;
      const cursor = store.openCursor();
      cursor.onsuccess = () => {
        try {
          const current = cursor.result;
          if (!current) { done(match); return; }
          if (++count > MAX_SAVE_ATTEMPTS) invalid();
          assertSaveRecord(current.value);
          const record: SaveJournalRecord = current.value;
          if (record.state === 'complete' && record.sessionId === sessionId && record.revision === revision && record.sha256 === sha256) match = record;
          current.continue();
        } catch (error) { fail(error); }
      };
    });
  }
}
