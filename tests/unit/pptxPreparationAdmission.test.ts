import { afterEach, describe, expect, it, vi } from 'vitest';
import { PPTX_PREPARATION_LOCK, withPptxPreparation } from '../../src/adapters/pptx/preparationAdmission';
type Callback = (lock: Lock | null) => Promise<unknown>;
const nativeLock = { name: PPTX_PREPARATION_LOCK, mode: 'exclusive' } as Lock;
const mock = () => { const request = vi.fn(); return { request, locks: { request } as unknown as Pick<LockManager, 'request'> }; };
afterEach(() => vi.unstubAllGlobals());

describe('origin-wide PPTX preparation admission', () => {
  it('requests one exclusive origin gate without exposing the source identity', async () => {
    const f = mock(), controller = new AbortController(), work = vi.fn(async () => 42);
    f.request.mockImplementation((name: string, options: LockOptions, callback: Callback) => {
      expect(name).toBe(PPTX_PREPARATION_LOCK); expect(options).toEqual({ mode: 'exclusive', signal: controller.signal }); return callback(nativeLock);
    });
    expect(await withPptxPreparation(controller.signal, work, f.locks)).toBe(42); expect(work).toHaveBeenCalledOnce();
  });
  it('rejects a pre-aborted request before queueing or reading', async () => {
    const f = mock(), controller = new AbortController(), work = vi.fn(); controller.abort();
    await expect(withPptxPreparation(controller.signal, work, f.locks)).rejects.toMatchObject({ name: 'AbortError' });
    expect(f.request).not.toHaveBeenCalled(); expect(work).not.toHaveBeenCalled();
  });
  it('fails closed when the browser API is missing', async () => {
    vi.stubGlobal('navigator', {}); const work = vi.fn();
    await expect(withPptxPreparation(undefined, work)).rejects.toThrow('PPTX_PREPARATION_LOCK_UNAVAILABLE'); expect(work).not.toHaveBeenCalled();
  });
  it('waits for admission and rechecks cancellation before work starts', async () => {
    const f = mock(), controller = new AbortController(), work = vi.fn(); let admit!: Callback;
    f.request.mockImplementation((_name: string, _options: LockOptions, callback: Callback) => { admit = callback; return new Promise(() => {}); });
    void withPptxPreparation(controller.signal, work, f.locks); expect(work).not.toHaveBeenCalled();
    controller.abort(); await expect(admit(nativeLock)).rejects.toMatchObject({ name: 'AbortError' }); expect(work).not.toHaveBeenCalled();
  });
  it('delegates queued cancellation to the native request without running work', async () => {
    const f = mock(), controller = new AbortController(), work = vi.fn();
    f.request.mockImplementation((_name: string, options: LockOptions) => new Promise((_resolve, reject) => options.signal!.addEventListener('abort', () => reject(new DOMException('Cancelled', 'AbortError')), { once: true })));
    const pending = withPptxPreparation(controller.signal, work, f.locks); controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' }); expect(work).not.toHaveBeenCalled();
  });
  it('holds an admitted reservation until even a non-cancellable read settles', async () => {
    const f = mock(), controller = new AbortController(); let finish!: (value: number) => void, released = false;
    const work = vi.fn(() => new Promise<number>(resolve => { finish = resolve; }));
    f.request.mockImplementation((_name: string, _options: LockOptions, callback: Callback) => callback(nativeLock).finally(() => { released = true; }));
    const pending = withPptxPreparation(controller.signal, work, f.locks); expect(work).toHaveBeenCalledOnce();
    controller.abort(); await Promise.resolve(); expect(released).toBe(false);
    finish(42); expect(await pending).toBe(42); expect(released).toBe(true);
  });
  it('propagates failure and permits a fresh native request', async () => {
    const f = mock(); let released = 0;
    f.request.mockImplementation((_name: string, _options: LockOptions, callback: Callback) => callback(nativeLock).finally(() => { released++; }));
    await expect(withPptxPreparation(undefined, async () => { throw Error('Synthetic preparation failure'); }, f.locks)).rejects.toThrow('Synthetic preparation failure');
    expect(await withPptxPreparation(undefined, async () => 7, f.locks)).toBe(7); expect(released).toBe(2); expect(f.request).toHaveBeenCalledTimes(2);
  });
  it('does not run the heavy pipeline without a granted lock', async () => {
    const f = mock(), work = vi.fn(); f.request.mockImplementation((_name: string, _options: LockOptions, callback: Callback) => callback(null));
    await expect(withPptxPreparation(undefined, work, f.locks)).rejects.toThrow('PPTX_PREPARATION_LOCK_UNAVAILABLE'); expect(work).not.toHaveBeenCalled();
  });
});
