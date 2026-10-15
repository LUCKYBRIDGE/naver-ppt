import { afterEach, describe, expect, it, vi } from 'vitest';
import { inspectPptxModelIsolated } from '../../src/adapters/pptx/isolatedModel';
const summary = { slides: 2, elements: 8, unsupported: 1, unknownKinds: 0, media: 1, animationSlides: 1, animationSteps: 3, transitions: 0, hiddenSlides: 0 };
const mockWorker = () => ({ onmessage: null, onerror: null, onmessageerror: null, terminate: vi.fn(), postMessage: vi.fn() }) as unknown as Worker;
afterEach(() => vi.useRealTimers());
describe('isolated product model summary', () => {
  it.each([false, true])('consumes only an explicitly owned whole buffer (subview=%s)', subview => {
    const worker = mockWorker(), original = new Uint8Array([80, 75, 3, 4]), bytes = subview ? original.subarray(1) : original;
    const result = inspectPptxModelIsolated(bytes, { workerFactory: () => worker, consumeInput: true });
    worker.onmessage?.call(worker, { data: { ready: true } } as MessageEvent);
    const sent = vi.mocked(worker.postMessage).mock.calls[0]![0] as { bytes: ArrayBuffer };
    expect(sent.bytes === original.buffer).toBe(!subview); expect(new Uint8Array(sent.bytes)).toEqual(bytes);
    worker.onmessage?.call(worker, { data: { id: 1, ok: true, summary } } as MessageEvent);
    return expect(result).resolves.toEqual(summary);
  });
  it('transfers a copy, returns only numeric fields and terminates', async () => {
    const worker = mockWorker(), bytes = new Uint8Array([80,75,3,4]);
    const result = inspectPptxModelIsolated(bytes, { workerFactory: () => worker });
    expect(worker.postMessage).not.toHaveBeenCalled();
    worker.onmessage?.call(worker, { data: { ready: true } } as MessageEvent);
    const sent = vi.mocked(worker.postMessage).mock.calls[0]![0] as { bytes: ArrayBuffer };
    expect(sent.bytes).not.toBe(bytes.buffer); expect(new Uint8Array(sent.bytes)).toEqual(bytes);
    worker.onmessage?.call(worker, { data: { id: 1, ok: true, summary } } as MessageEvent);
    expect(await result).toEqual(summary); expect(await result).not.toBe(summary);
    expect(worker.terminate).toHaveBeenCalledOnce(); expect(worker.onmessage).toBeNull();
  });
  it.each([{ ...summary, slides: 0 }, { ...summary, slides: 1001 }, { ...summary, media: 9 }, { ...summary, animationSlides: 3 }, { ...summary, animationSteps: -1 }, { ...summary, unsupported: 9 }, { ...summary, privateText: 'private source' }])('rejects malformed numeric output', async value => {
    const worker = mockWorker(), result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data: { ready: true } } as MessageEvent);
    worker.onmessage?.call(worker, { data: { id: 1, ok: true, summary: value } } as MessageEvent);
    await expect(result).rejects.toThrow('PPTX_MODEL_FAILED'); expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it.each([{ id: 2, ok: true, summary }, { id: 1, ok: false, code: 'private source exception' }, null])('does not trust mismatched IDs or parser errors', async data => {
    const worker = mockWorker(), result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data } as MessageEvent); await expect(result).rejects.toThrow('PPTX_MODEL_FAILED');
  });
  it('cancels once and ignores late results', async () => {
    const worker = mockWorker(), controller = new AbortController();
    const result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker, signal: controller.signal });
    const late = worker.onmessage; controller.abort();
    await expect(result).rejects.toMatchObject({ name: 'AbortError' }); late?.call(worker, { data: { id: 1, ok: true, summary } } as MessageEvent);
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('sends once after ready and rejects unsolicited completion', async () => {
    const worker = mockWorker(), result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data: { id: 1, ok: true, summary } } as MessageEvent);
    await expect(result).rejects.toThrow('PPTX_MODEL_FAILED');
    const readyWorker = mockWorker(), controller = new AbortController();
    const pending = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => readyWorker, signal: controller.signal });
    readyWorker.onmessage?.call(readyWorker, { data: { ready: true } } as MessageEvent);
    readyWorker.onmessage?.call(readyWorker, { data: { ready: true } } as MessageEvent);
    await expect(pending).rejects.toThrow('PPTX_MODEL_FAILED'); expect(readyWorker.postMessage).toHaveBeenCalledOnce();
  });
  it('times out an unresponsive parser', async () => {
    vi.useFakeTimers(); const worker = mockWorker();
    const result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker, timeoutMs: 10 });
    const failure = expect(result).rejects.toThrow('PPTX_MODEL_TIMEOUT'); await vi.advanceTimersByTimeAsync(10); await failure;
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it.each(['onerror', 'onmessageerror'] as const)('cleans up %s without original exception text', async event => {
    const worker = mockWorker(), result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker[event]?.call(worker, {} as ErrorEvent & MessageEvent); await expect(result).rejects.toThrow(event === 'onerror' ? 'PPTX_MODEL_WORKER_ERROR' : 'PPTX_MODEL_MESSAGE_ERROR');
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('does not start invalid jobs and cleans up send failure', async () => {
    const factory = vi.fn(mockWorker), controller = new AbortController(); controller.abort();
    await expect(inspectPptxModelIsolated(new Uint8Array(), { workerFactory: factory })).rejects.toThrow('PPTX_MODEL_INPUT_LIMIT');
    await expect(inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: factory, timeoutMs: Infinity })).rejects.toThrow('PPTX_MODEL_INVALID_TIMEOUT');
    await expect(inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: factory, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(factory).not.toHaveBeenCalled();
    const worker = mockWorker(); vi.mocked(worker.postMessage).mockImplementation(() => { throw Error('private source'); });
    const result = inspectPptxModelIsolated(new Uint8Array([1]), { workerFactory: () => worker });
    worker.onmessage?.call(worker, { data: { ready: true } } as MessageEvent);
    await expect(result).rejects.toThrow('PPTX_MODEL_SEND_ERROR'); expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
