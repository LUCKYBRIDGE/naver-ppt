import { describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { IndexedDbPlayerOwner, assertPlayerOwner } from '../../src/storage/playerOwner';
import { PlayerAuthority } from '../../src/background/playerAuthority';
const getURL = (path: string) => `chrome-extension://own/${path}`;
function sender(documentId: string, sessionId = 'lesson'): chrome.runtime.MessageSender { return { id: 'own', documentId, url: `${getURL('player/index.html')}?sessionId=${sessionId}` }; }
function context(documentId: string, sessionId = 'lesson') { return { documentId, documentUrl: sender(documentId, sessionId).url } as chrome.runtime.ExtensionContext; }
function serialLocks() {
  let tail = Promise.resolve();
  return { request: (_name: string, work: () => Promise<unknown>) => { const result = tail.then(work); tail = result.then(() => {}, () => {}); return result; } } as unknown as Pick<LockManager, 'request'>;
}
describe('durable single Player owner', () => {
  it('queries only the existing same-session live owner without claiming a replacement', async () => {
    const api = { id: 'own', getURL, getContexts: vi.fn().mockResolvedValue([context('a'), context('b'), context('other', 'other')]) };
    const authority = new PlayerAuthority(api, new IndexedDbPlayerOwner(new IDBFactory()), serialLocks());
    expect(await authority.currentTransitionOwner('lesson')).toBe(null);
    expect(await authority.access(sender('b'), 'lesson', true)).toBe(true);
    expect(await authority.currentTransitionOwner('lesson')).toBe('b');
    api.getContexts.mockResolvedValue([context('a'), context('other', 'other')]);
    expect(await authority.currentTransitionOwner('lesson')).toBe(null);
    expect(await authority.access(sender('a'), 'lesson', true)).toBe(true);
    expect(await authority.currentTransitionOwner('lesson')).toBe('a');
  });
  it('holds the owner lock through the durable transition action before a replacement claim', async () => {
    const api = { id: 'own', getURL, getContexts: vi.fn().mockResolvedValue([context('a'), context('b')]) };
    const authority = new PlayerAuthority(api, new IndexedDbPlayerOwner(new IDBFactory()), serialLocks());
    expect(await authority.access(sender('a'), 'lesson', true)).toBe(true);
    let release!: () => void, entered!: () => void; const active = new Promise<void>(resolve => { entered = resolve; });
    const events: string[] = [];
    const commit = authority.withTransitionOwner('lesson', 'a', async () => { entered(); await new Promise<void>(resolve => { release = resolve; }); events.push('commit'); return 'saved'; });
    await active; api.getContexts.mockResolvedValue([context('b')]);
    const claim = authority.access(sender('b'), 'lesson', true).then(result => { events.push('claim'); return result; });
    expect(events).toEqual([]); release(); expect(await commit).toBe('saved'); expect(await claim).toBe(true); expect(events).toEqual(['commit', 'claim']);
  });
  it('binds transition requests to the exact live owner context and session', async () => {
    const store = new IndexedDbPlayerOwner(new IDBFactory()), api = { id: 'own', getURL, getContexts: vi.fn().mockResolvedValue([context('a'), context('b')]) }, locks = serialLocks();
    const authority = new PlayerAuthority(api, store, locks);
    expect(await authority.access(sender('a'), 'lesson', true)).toBe(true);
    expect(await authority.transitionAccess('lesson', 'a')).toBe(true); expect(await authority.transitionAccess('lesson', 'b')).toBe(false);
    expect(await authority.transitionAccess('other', 'a')).toBe(false); expect(await authority.transitionAccess('lesson', 'missing')).toBe(false);
    api.getContexts.mockResolvedValue([context('b')]); expect(await authority.transitionAccess('lesson', 'a')).toBe(false);
    expect(await authority.access(sender('b'), 'lesson', true)).toBe(true); expect(await authority.transitionAccess('lesson', 'b')).toBe(true);
  });
  it('validates exact owner metadata and missing platform fails closed', async () => {
    assertPlayerOwner({ sessionId: 'lesson', documentId: 'a' });
    for (const value of [{ sessionId: '', documentId: 'a' }, { sessionId: 'lesson', documentId: 'a', bytes: [1] }, null]) expect(() => assertPlayerOwner(value)).toThrow();
    const authority = new PlayerAuthority({ id: 'own', getURL, getContexts: vi.fn() }, new IndexedDbPlayerOwner(new IDBFactory()), undefined);
    await expect(authority.access(sender('a'), 'lesson', true)).rejects.toThrow('PLAYER_LOCK_UNAVAILABLE');
  });
  it('allows one live claimant and retains owner across authority recreation', async () => {
    const store = new IndexedDbPlayerOwner(new IDBFactory()), api = { id: 'own', getURL, getContexts: vi.fn().mockResolvedValue([context('a'), context('b')]) }, locks = serialLocks();
    const authority = new PlayerAuthority(api, store, locks);
    expect(await Promise.all([authority.access(sender('a'), 'lesson', true), authority.access(sender('b'), 'lesson', true)])).toEqual([true, false]);
    expect(await new PlayerAuthority(api, store, locks).access(sender('b'), 'lesson', true)).toBe(false);
    expect(await authority.access(sender('a'), 'lesson', false)).toBe(true); expect(await authority.access(sender('b'), 'lesson', false)).toBe(false);
  });
  it('takes over only after the old owner is absent and old sender cannot execute', async () => {
    let live = [context('a'), context('b')]; const authority = new PlayerAuthority({ id: 'own', getURL, getContexts: async () => live }, new IndexedDbPlayerOwner(new IDBFactory()), serialLocks());
    await authority.access(sender('a'), 'lesson', true); live = [context('b')];
    expect(await authority.access(sender('b'), 'lesson', false)).toBe(false);
    expect(await authority.access(sender('b'), 'lesson', true)).toBe(true); expect(await authority.access(sender('a'), 'lesson', false)).toBe(false);
  });
  it('rejects other lessons/roles/missing documentId before storage', async () => {
    const store = { access: vi.fn() }, authority = new PlayerAuthority({ id: 'own', getURL, getContexts: async () => [context('a', 'other')] }, store, serialLocks());
    expect(await authority.access(sender('a', 'other'), 'lesson', true)).toBe(false);
    const { documentId: _omitted, ...withoutDocumentId } = sender('a');
    expect(await authority.access(withoutDocumentId, 'lesson', true)).toBe(false);
    expect(await authority.access({ ...sender('a'), url: `${getURL('remote/index.html')}?sessionId=lesson` }, 'lesson', true)).toBe(false); expect(store.access).not.toHaveBeenCalled();
  });
  it('does not claim from a stale context list or ignore API/storage errors', async () => {
    const store = new IndexedDbPlayerOwner(new IDBFactory());
    expect(await store.access({ sessionId: 'lesson', documentId: 'a' }, new Set(['b']), true)).toBe(false);
    const failure = new PlayerAuthority({ id: 'own', getURL, getContexts: async () => { throw new Error('Synthetic contexts failure'); } }, store, serialLocks());
    await expect(failure.access(sender('a'), 'lesson', true)).rejects.toThrow();
    const unavailable = new PlayerAuthority({ id: 'own', getURL, getContexts: async () => [context('a')] }, { access: async () => { throw new Error('Synthetic strict failure'); } }, serialLocks());
    await expect(unavailable.access(sender('a'), 'lesson', true)).rejects.toThrow();
  });
  it('does not grant a replacement until the strict transaction completes', async () => {
    const store = new IndexedDbPlayerOwner(new IDBFactory());
    await store.access({ sessionId: 'lesson', documentId: 'a' }, new Set(['a']), true);
    const original = IDBObjectStore.prototype.put;
    const spy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (this: IDBObjectStore, value: unknown) {
      const request = original.call(this, value); this.transaction.abort(); return request;
    });
    try { await expect(store.access({ sessionId: 'lesson', documentId: 'b' }, new Set(['b']), true)).rejects.toThrow(); }
    finally { spy.mockRestore(); }
    expect(await store.access({ sessionId: 'lesson', documentId: 'a' }, new Set(['a']), false)).toBe(true);
  });
});
