import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPptxResourceInventory, loadPptxSourceModel } from '../../src/adapters/pptx/sourceModel';
const mocks = vi.hoisted(() => ({ parse: vi.fn(), disposed: vi.fn(), recover: vi.fn() }));
// This suite isolates source lease/publication races; admission has its own
// native-contract unit and actual two-context Whale verifier.
vi.mock('../../src/adapters/pptx/preparationAdmission', () => ({ withPptxPreparation: (_signal: AbortSignal, work: () => Promise<unknown>) => work() }));
vi.mock('../../src/adapters/pptx/input', () => ({ readPptxInput: async () => ({ bytes: new Uint8Array([1]), fingerprint: 'a'.repeat(64) }) }));
vi.mock('../../src/adapters/pptx/isolatedPackage', () => ({ readPptxPackageIsolated: async () => ({ files: {} }) }));
vi.mock('../../src/adapters/pptx/packageGuard', () => ({ inspectPptxXml: () => ({}) }));
vi.mock('../../src/adapters/pptx/slideOrder', () => ({ readPptxSlideOrder: () => ['ppt/slides/slide1.xml'] }));
vi.mock('../../src/adapters/pptx/isolatedModel', () => ({ runPptxParserJob: mocks.parse }));
vi.mock('../../src/adapters/pptx/assetModel', () => ({ hydratePptxAssets: vi.fn() }));
vi.mock('../../src/adapters/pptx/recoverEmbeddedMedia', () => ({ recoverPptxEmbeddedMedia: mocks.recover }));
const signal = () => new AbortController().signal;
beforeEach(() => {
  vi.clearAllMocks(); mocks.parse.mockReset().mockImplementation(async () => ({ model: { slides: [{ elements: [] }] }, dispose: mocks.disposed }));
  mocks.recover.mockReset().mockReturnValue({ recovered: 0, unresolved: 0, uniqueBytes: 0 });
});
describe('same-window immutable File model ownership', () => {
  it('counts a same-File ready source once while tracking every lease and final release', async () => {
    const before = getPptxResourceInventory(), file = new File(['xyz'], 'Synthetic.pptx'), a = await loadPptxSourceModel(file, signal()), b = await loadPptxSourceModel(file, signal()), native = b.retain();
    expect(getPptxResourceInventory()).toMatchObject({ readySources: before.readySources + 1, leases: before.leases + 3, readyFileBytes: before.readyFileBytes + 3 });
    a.dispose(); b.dispose(); expect(getPptxResourceInventory().leases).toBe(before.leases + 1);
    native.dispose(); expect(getPptxResourceInventory()).toEqual(before);
  });
  it('keeps a cancelled running preparation counted until its actual late work settles', async () => {
    const before = getPptxResourceInventory(), file = new File(['x'], 'Synthetic.pptx'), controller = new AbortController(); let complete!: (value: unknown) => void;
    mocks.parse.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const pending = loadPptxSourceModel(file, controller.signal); await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce());
    controller.abort(); await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(getPptxResourceInventory().jobs).toBe(before.jobs + 1); expect(getPptxResourceInventory().sources.some(value => value.stage === 'cancelling')).toBe(true);
    complete({ model: { slides: [{ elements: [] }] }, dispose: mocks.disposed });
    await vi.waitFor(() => expect(getPptxResourceInventory()).toEqual(before));
  });
  it('keeps a retained native owner alive after the original lease releases', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), original = await loadPptxSourceModel(file, signal()), child = original.retain();
    original.dispose(); expect(mocks.disposed).not.toHaveBeenCalled(); expect(() => original.retain()).toThrow('PPTX_SOURCE_RELEASED');
    const sibling = await loadPptxSourceModel(file, signal()); expect(sibling.model).toBe(child.model); expect(mocks.parse).toHaveBeenCalledOnce();
    child.dispose(); child.dispose(); expect(mocks.disposed).not.toHaveBeenCalled(); sibling.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('does not reuse a published result cancelled before its waiter delivery completes', async () => {
    let published!: () => void, finish!: () => void;
    const seen = new Promise<void>(resolve => { published = resolve; }), held = new Promise<void>(resolve => { finish = resolve; });
    const original = Promise.prototype.finally;
    const delayed = vi.spyOn(Promise.prototype, 'finally').mockImplementationOnce(function (this: Promise<unknown>, callback) {
      return original.call(this, async () => { published(); await held; return callback?.(); });
    });
    try {
      const file = new File(['x'], 'Synthetic.pptx'), controller = new AbortController(), first = loadPptxSourceModel(file, controller.signal);
      await seen; controller.abort(); await expect(first).rejects.toMatchObject({ name: 'AbortError' });
      expect(mocks.disposed).toHaveBeenCalledOnce();
      const retry = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2);
      finish(); const third = await loadPptxSourceModel(file, signal()); expect(third.model).toBe(retry.model);
      retry.dispose(); third.dispose(); expect(mocks.disposed).toHaveBeenCalledTimes(2);
    } finally { finish(); delayed.mockRestore(); }
  });
  it('coalesces simultaneous same-File parses and reserves independent result owners', async () => {
    let complete!: (value: unknown) => void;
    mocks.parse.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const file = new File(['x'], 'Synthetic.pptx'), first = loadPptxSourceModel(file, signal()), second = loadPptxSourceModel(file, signal());
    await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce());
    complete({ model: { slides: [{ elements: [] }] }, dispose: mocks.disposed });
    const a = await first, b = await second; expect(a.model).toBe(b.model);
    a.dispose(); expect(mocks.disposed).not.toHaveBeenCalled(); b.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('rejects one cancelled waiter promptly without aborting the sibling job', async () => {
    let complete!: (value: unknown) => void;
    mocks.parse.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const file = new File(['x'], 'Synthetic.pptx'), controller = new AbortController();
    const first = loadPptxSourceModel(file, controller.signal), second = loadPptxSourceModel(file, signal());
    await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce()); controller.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.parse.mock.calls[0]![1].signal.aborted).toBe(false);
    complete({ model: { slides: [{ elements: [] }] }, dispose: mocks.disposed });
    const source = await second; expect(mocks.disposed).not.toHaveBeenCalled(); source.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('aborts the final waiter, disposes a late result and keeps a fresh retry independent', async () => {
    let complete!: (value: unknown) => void; const lateDispose = vi.fn();
    mocks.parse.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
    const file = new File(['x'], 'Synthetic.pptx'), a = new AbortController(), b = new AbortController();
    const first = loadPptxSourceModel(file, a.signal), second = loadPptxSourceModel(file, b.signal);
    await vi.waitFor(() => expect(mocks.parse).toHaveBeenCalledOnce()); a.abort(); b.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' }); await expect(second).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.parse.mock.calls[0]![1].signal.aborted).toBe(true);
    const fresh = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2);
    complete({ model: { slides: [{ elements: [] }] }, dispose: lateDispose });
    await vi.waitFor(() => expect(lateDispose).toHaveBeenCalledOnce());
    const ready = await loadPptxSourceModel(file, signal()); expect(ready.model).toBe(fresh.model); expect(mocks.parse).toHaveBeenCalledTimes(2);
    ready.dispose(); fresh.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('removes a failed shared job so both waiters fail and the next attempt can succeed', async () => {
    mocks.parse.mockRejectedValueOnce(Error('Synthetic shared failure'));
    const file = new File(['x'], 'Synthetic.pptx');
    const results = await Promise.allSettled([loadPptxSourceModel(file, signal()), loadPptxSourceModel(file, signal())]);
    expect(results.map(value => value.status)).toEqual(['rejected', 'rejected']); expect(mocks.parse).toHaveBeenCalledOnce();
    const next = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2); next.dispose();
  });
  it('holds one selected document source across sequential page view releases', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), document = await loadPptxSourceModel(file, signal());
    for (let page = 0; page < 4; page++) {
      const view = await loadPptxSourceModel(file, signal()); expect(view.model).toBe(document.model); view.dispose();
      expect(mocks.disposed).not.toHaveBeenCalled();
    }
    expect(mocks.parse).toHaveBeenCalledOnce(); document.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
    const reopened = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2); reopened.dispose();
  });
  it('disposes a result cancelled between parsing and obtaining its lease', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), controller = new AbortController();
    mocks.recover.mockImplementationOnce(() => { queueMicrotask(() => controller.abort()); return { recovered: 0, unresolved: 0, uniqueBytes: 0 }; });
    await expect(loadPptxSourceModel(file, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.disposed).toHaveBeenCalledOnce();
    const next = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2); next.dispose();
  });
  it('shares ready assets and releases only at the final owner', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), first = await loadPptxSourceModel(file, signal()), second = await loadPptxSourceModel(file, signal());
    expect(mocks.parse).toHaveBeenCalledOnce(); expect(second.model).toBe(first.model);
    first.dispose(); first.dispose(); expect(mocks.disposed).not.toHaveBeenCalled(); second.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('reparses after the final owner releases', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), first = await loadPptxSourceModel(file, signal()); first.dispose();
    const next = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2); next.dispose();
  });
  it('does not reuse a different File even with identical bytes and name', async () => {
    const first = await loadPptxSourceModel(new File(['x'], 'Synthetic.pptx'), signal()), second = await loadPptxSourceModel(new File(['x'], 'Synthetic.pptx'), signal());
    expect(mocks.parse).toHaveBeenCalledTimes(2); first.dispose(); second.dispose();
  });
  it('rejects a pre-aborted consumer without releasing another owner', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), first = await loadPptxSourceModel(file, signal()), controller = new AbortController(); controller.abort();
    await expect(loadPptxSourceModel(file, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.disposed).not.toHaveBeenCalled(); first.dispose();
  });
  it('keeps another owner alive when the first view aborts and disposes', async () => {
    const file = new File(['x'], 'Synthetic.pptx'), controller = new AbortController();
    const first = await loadPptxSourceModel(file, controller.signal), second = await loadPptxSourceModel(file, signal());
    controller.abort(); first.dispose(); expect(mocks.disposed).not.toHaveBeenCalled(); second.dispose(); expect(mocks.disposed).toHaveBeenCalledOnce();
  });
  it('does not cache a failed recovery or keep its assets', async () => {
    const file = new File(['x'], 'Synthetic.pptx'); mocks.recover.mockImplementationOnce(() => { throw Error('RECOVERY_FAILED'); });
    await expect(loadPptxSourceModel(file, signal())).rejects.toThrow('RECOVERY_FAILED'); expect(mocks.disposed).toHaveBeenCalledOnce();
    const next = await loadPptxSourceModel(file, signal()); expect(mocks.parse).toHaveBeenCalledTimes(2); next.dispose();
  });
});
