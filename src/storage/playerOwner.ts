export interface PlayerOwner { sessionId: string; documentId: string }
const valid = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.length <= 200;
export function assertPlayerOwner(value: unknown): asserts value is PlayerOwner {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 2
    || !('sessionId' in value) || !valid(value.sessionId) || !('documentId' in value) || !valid(value.documentId)) throw new Error('INVALID_PLAYER_OWNER');
}
export class IndexedDbPlayerOwner {
  constructor(private readonly factory?: IDBFactory) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const factory = this.factory ?? globalThis.indexedDB;
      if (!factory) { reject(new Error('PLAYER_OWNER_UNAVAILABLE')); return; }
      let abandoned = false; const request = factory.open('naver-ppt-player-owner', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('owners', { keyPath: 'sessionId' });
      request.onblocked = () => { abandoned = true; reject(new Error('PLAYER_OWNER_BLOCKED')); };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        if (abandoned) { db.close(); return; }
        if (!db.objectStoreNames.contains('owners') || db.transaction('owners').objectStore('owners').keyPath !== 'sessionId') { db.close(); reject(new Error('INVALID_PLAYER_OWNER_STORE')); return; }
        db.onversionchange = () => db.close(); resolve(db);
      };
    });
  }
  // The authority holds the browser lock across its live-context query and this transaction.
  async access(candidate: PlayerOwner, liveIds: ReadonlySet<string>, claim: boolean): Promise<boolean> {
    assertPlayerOwner(candidate); if (!liveIds.has(candidate.documentId)) return false;
    const db = await this.open();
    try {
      return await new Promise<boolean>((resolve, reject) => {
        const tx = claim ? db.transaction('owners', 'readwrite', { durability: 'strict' }) : db.transaction('owners', 'readonly');
        let owned = false, failure: unknown;
        tx.oncomplete = () => resolve(owned); tx.onabort = () => reject(failure ?? tx.error ?? new Error('PLAYER_OWNER_FAILED'));
        if (claim && tx.durability !== 'strict') { failure = new Error('PLAYER_OWNER_NOT_STRICT'); tx.abort(); return; }
        const store = tx.objectStore('owners'), request = store.get(candidate.sessionId);
        request.onsuccess = () => {
          try {
            const owner: unknown = request.result;
            if (owner !== undefined) { assertPlayerOwner(owner); if (owner.sessionId !== candidate.sessionId) throw new Error('INVALID_PLAYER_OWNER'); }
            if (owner && liveIds.has(owner.documentId)) owned = owner.documentId === candidate.documentId;
            else if (claim) { store.put(candidate); owned = true; }
          } catch (error) { failure = error; tx.abort(); }
        };
      });
    } finally { db.close(); }
  }
}
