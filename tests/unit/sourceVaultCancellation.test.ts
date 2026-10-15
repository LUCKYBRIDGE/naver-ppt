import { afterEach, describe, expect, it, vi } from 'vitest';
import { OPEN_SOURCE_MAX_BYTES, OPEN_SOURCE_MAX_COUNT, SourceVault, type SourceHandleStore } from '../../src/storage/sourceVault';
const fingerprint = 'a'.repeat(64), file = () => new File(['Synthetic'], 'Synthetic.pdf');
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
const record = (value: File) => ({ key: 'key', fingerprint, handle: { getFile: async () => value } as FileSystemFileHandle });
const store = (read: SourceHandleStore['read']) => ({ read, write: vi.fn() });
afterEach(() => vi.useRealTimers());

describe('source reconnect cancellation ownership', () => {
  it('enforces the aggregate open-original limit without replacing existing sources', async () => {
    const vault = new SourceVault(store(async () => undefined));
    const sized = (bytes: number) => { const value = file(); Object.defineProperty(value, 'size', { value: bytes }); return value; };
    for (let index = 0; index < 5; index++) await vault.remember(`large-${index}`, sized(100 * 1024 * 1024), fingerprint);
    await expect(vault.remember('second', sized(OPEN_SOURCE_MAX_BYTES - 500 * 1024 * 1024 + 1), 'b'.repeat(64))).rejects.toThrow(`열린 원본의 한도(${OPEN_SOURCE_MAX_COUNT}개·${OPEN_SOURCE_MAX_BYTES / (1024 * 1024)}MiB)`);
    expect((await vault.get('large-0', fingerprint)).file.size).toBe(100 * 1024 * 1024);
    await expect(vault.get('second', 'b'.repeat(64))).rejects.toThrow('다시 연결'); vault.close();
  });
  it('enforces the sixteen-open-original limit even when bytes remain', async () => {
    const vault = new SourceVault(store(async () => undefined));
    for (let index = 0; index < OPEN_SOURCE_MAX_COUNT; index++) await vault.remember(`source-${index}`, file(), fingerprint);
    await expect(vault.remember('source-17', file(), 'b'.repeat(64))).rejects.toThrow('열린 원본의 한도');
    expect((await vault.get('source-15', fingerprint)).file).toBeInstanceOf(File); vault.close();
  });
  it('does not overwrite a newer connected original with a late older validation', async () => {
    const oldFile = file(), newer = file(), pending = deferred<{ fingerprint: string }>(), validator = vi.fn(() => pending.promise);
    const vault = new SourceVault(store(async () => record(oldFile)), undefined, validator), loading = vault.get('key', fingerprint);
    await vi.waitFor(() => expect(validator).toHaveBeenCalledOnce()); await vault.remember('key', newer, 'b'.repeat(64));
    pending.resolve({ fingerprint }); await expect(loading).rejects.toThrow('내용이 다릅니다');
    expect((await vault.get('key', 'b'.repeat(64))).file).toBe(newer); vault.close();
  });
  it('rejects a pre-aborted cached get while preserving the cached original', async () => {
    const read = vi.fn(async () => undefined), vault = new SourceVault(store(read)), original = file(), controller = new AbortController();
    await vault.remember('key', original, fingerprint); controller.abort();
    await expect(vault.get('key', fingerprint, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect((await vault.get('key', fingerprint)).file).toBe(original); expect(read).not.toHaveBeenCalled(); vault.close();
  });
  it('rejects a stalled handle read promptly and ignores its late record', async () => {
    const pending = deferred<Awaited<ReturnType<SourceHandleStore['read']>>>(), original = file(), handle = record(original), getFile = vi.spyOn(handle.handle, 'getFile');
    const read = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(undefined), validator = vi.fn();
    const vault = new SourceVault(store(read), undefined, validator), controller = new AbortController(), loading = vault.get('key', fingerprint, controller.signal);
    controller.abort(); await expect(loading).rejects.toMatchObject({ name: 'AbortError' }); pending.resolve(handle); await Promise.resolve();
    expect(getFile).not.toHaveBeenCalled(); expect(validator).not.toHaveBeenCalled();
    await expect(vault.get('key')).rejects.toThrow('다시 연결'); expect(read).toHaveBeenCalledTimes(2); vault.close();
  });
  it('ignores late getFile bytes and never validates or caches them', async () => {
    const original = file(), pending = deferred<File>(), handle = record(original); vi.spyOn(handle.handle, 'getFile').mockReturnValueOnce(pending.promise);
    const read = vi.fn(async () => handle), validator = vi.fn(async () => ({ fingerprint })), vault = new SourceVault(store(read), undefined, validator), controller = new AbortController();
    const loading = vault.get('key', fingerprint, controller.signal); await vi.waitFor(() => expect(handle.handle.getFile).toHaveBeenCalledOnce());
    controller.abort(); await expect(loading).rejects.toMatchObject({ name: 'AbortError' }); pending.resolve(original); await Promise.resolve(); expect(validator).not.toHaveBeenCalled();
    expect((await vault.get('key')).file).toBe(original); expect(read).toHaveBeenCalledTimes(2); vault.close();
  });
  it('passes a per-request signal to validation and ignores its late success', async () => {
    const original = file(), pending = deferred<{ fingerprint: string }>(), read = vi.fn(async () => record(original));
    const validator = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue({ fingerprint }), vault = new SourceVault(store(read), undefined, validator), controller = new AbortController();
    const loading = vault.get('key', fingerprint, controller.signal); await vi.waitFor(() => expect(validator).toHaveBeenCalledOnce());
    const captured = validator.mock.calls[0]![1] as AbortSignal; controller.abort(); await expect(loading).rejects.toMatchObject({ name: 'AbortError' }); expect(captured.aborted).toBe(true);
    pending.resolve({ fingerprint }); await Promise.resolve(); expect((await vault.get('key')).file).toBe(original); expect(read).toHaveBeenCalledTimes(2); vault.close();
  });
  it('does not cancel a sibling validator or overwrite its connected source', async () => {
    const original = file(), first = deferred<{ fingerprint: string }>(), second = deferred<{ fingerprint: string }>();
    const validator = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise), vault = new SourceVault(store(async () => record(original)), undefined, validator), controller = new AbortController();
    const a = vault.get('key', fingerprint, controller.signal), b = vault.get('key', fingerprint); await vi.waitFor(() => expect(validator).toHaveBeenCalledTimes(2));
    controller.abort(); await expect(a).rejects.toMatchObject({ name: 'AbortError' }); expect(validator.mock.calls[1]![1].aborted).toBe(false);
    second.resolve({ fingerprint }); expect((await b).file).toBe(original); first.resolve({ fingerprint }); await Promise.resolve();
    expect((await vault.get('key')).file).toBe(original); expect(validator).toHaveBeenCalledTimes(2); vault.close();
  });
  it('removes only the cancelled broadcast timer/request and ignores its late reply', async () => {
    vi.useFakeTimers(); const requests: { requestId: string; key: string }[] = [], channel = { onmessage: null as unknown as ((event: MessageEvent) => void), postMessage: vi.fn(value => requests.push(value)), close: vi.fn() };
    const original = file(), validator = vi.fn(async () => ({ fingerprint })), vault = new SourceVault(store(async () => undefined), channel as unknown as BroadcastChannel, validator), controller = new AbortController();
    const a = vault.get('key', fingerprint, controller.signal), b = vault.get('key', fingerprint);
    await vi.waitFor(() => expect(requests).toHaveLength(2)); expect(vi.getTimerCount()).toBe(2);
    controller.abort(); await expect(a).rejects.toMatchObject({ name: 'AbortError' }); expect(vi.getTimerCount()).toBe(1);
    for (const request of requests) channel.onmessage({ data: { ...request, type: 'reply', file: original, fingerprint } } as MessageEvent);
    expect((await b).file).toBe(original); expect(validator).toHaveBeenCalledOnce(); expect(vi.getTimerCount()).toBe(0); vault.close();
  });
  it('aborts all pending gets on close and cannot repopulate cache from late validation', async () => {
    const original = file(), pending = deferred<{ fingerprint: string }>(), validator = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValue({ fingerprint }), read = vi.fn(async () => record(original));
    const vault = new SourceVault(store(read), undefined, validator), loading = vault.get('key');
    await vi.waitFor(() => expect(validator).toHaveBeenCalledOnce()); vault.close(); await expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    expect(validator.mock.calls[0]![1].aborted).toBe(true); pending.resolve({ fingerprint }); await Promise.resolve();
    // No channel in this fixture: a later get must re-read/revalidate, not use a late cache write.
    expect((await vault.get('key')).file).toBe(original); expect(read).toHaveBeenCalledTimes(2); vault.close();
  });
});
