import { afterEach, describe, expect, it, vi } from 'vitest';
import { readPptxPackageIsolated } from '../../src/adapters/pptx/isolatedPackage';

function mockWorker() {
  const worker = { onmessage: null, onerror: null, onmessageerror: null, terminate: vi.fn(), postMessage: vi.fn() } as unknown as Worker;
  return worker;
}
const result = { files: { '[Content_Types].xml': new Uint8Array([1]), 'ppt/presentation.xml': new Uint8Array([2]) }, entryCount: 2, expandedBytes: 2 };
afterEach(() => vi.useRealTimers());
describe('isolated PPTX ZIP job lifetime', () => {
  it('transfers a copy and terminates after a validated result', async () => {
    const worker = mockWorker(), bytes = new Uint8Array([1,2,3]), before = bytes.slice();
    const promise = readPptxPackageIsolated(bytes, { workerFactory: () => worker });
    const sent = vi.mocked(worker.postMessage).mock.calls[0]![0] as Uint8Array;
    expect(sent).toEqual(bytes); expect(sent.buffer).not.toBe(bytes.buffer);
    worker.onmessage?.call(worker, { data: { ok: true, result } } as MessageEvent);
    expect(await promise).toEqual(result); expect(bytes).toEqual(before);
    expect(worker.terminate).toHaveBeenCalledOnce(); expect(worker.onmessage).toBeNull();
  });
  it('terminates a job that never replies', async () => {
    vi.useFakeTimers(); const worker = mockWorker();
    const promise = readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: () => worker, timeoutMs: 10 });
    const failure = expect(promise).rejects.toThrow('PPTX_ZIP_TIMEOUT');
    await vi.advanceTimersByTimeAsync(10); await failure;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('terminates on cancellation and ignores late completion', async () => {
    const worker = mockWorker(), controller = new AbortController();
    const promise = readPptxPackageIsolated(new Uint8Array([1]), { signal: controller.signal, workerFactory: () => worker });
    const late = worker.onmessage; controller.abort();
    await expect(promise).rejects.toThrow('Cancelled');
    late?.call(worker, { data: { ok: true, result } } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it.each(['onerror', 'onmessageerror'] as const)('terminates on %s', event => {
    const worker = mockWorker();
    const promise = readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    if (event === 'onerror') worker.onerror?.call(worker, {} as ErrorEvent);
    else worker.onmessageerror?.call(worker, {} as MessageEvent);
    return expect(promise).rejects.toThrow(event === 'onerror' ? 'PPTX_WORKER_ERROR' : 'PPTX_WORKER_MESSAGE_ERROR');
  });
  it.each([{ ok: true, result: { ...result, expandedBytes: 999 } }, { ok: false, code: 'private file details' }, { ok: true, result: null }])('rejects invalid worker output without leaking content', async data => {
    const worker = mockWorker();
    const promise = readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data } as MessageEvent);
    await expect(promise).rejects.toThrow('PPTX_INVALID_WORKER_RESULT');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('retains sanitized parser errors and cleans up a failed transfer', async () => {
    const worker = mockWorker();
    const promise = readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data: { ok: false, code: 'PPTX_UNSAFE_ENTRY' } } as MessageEvent);
    await expect(promise).rejects.toThrow('PPTX_UNSAFE_ENTRY');
    const failed = mockWorker(); vi.mocked(failed.postMessage).mockImplementation(() => { throw new Error('private details'); });
    await expect(readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: () => failed })).rejects.toThrow('PPTX_WORKER_SEND_ERROR');
    expect(failed.terminate).toHaveBeenCalledOnce();
  });
  it('does not start a worker for empty, pre-cancelled or invalid timeout input', async () => {
    const factory = vi.fn(mockWorker), controller = new AbortController(); controller.abort();
    await expect(readPptxPackageIsolated(new Uint8Array(), { workerFactory: factory })).rejects.toThrow('PPTX_INPUT_LIMIT');
    await expect(readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: factory, signal: controller.signal })).rejects.toThrow('Cancelled');
    await expect(readPptxPackageIsolated(new Uint8Array([1]), { workerFactory: factory, timeoutMs: 15001 })).rejects.toThrow('PPTX_INVALID_TIMEOUT');
    expect(factory).not.toHaveBeenCalled();
  });
});
