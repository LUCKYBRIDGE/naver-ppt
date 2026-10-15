import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PresentationDocumentState } from '../../src/core/types';
import { openPptxRuntime } from '../../src/adapters/pptx/runtime';
import { loadPptxSourceModel } from '../../src/adapters/pptx/sourceModel';
import { createPptxEngineDriver } from '../../src/adapters/pptx/engineDriver';
import { readMediaInput } from '../../src/media/input';
import { inspectPptxSourceOrder } from '../../src/adapters/pptx/sourceOrder';
import { preparePptxSourceMediaCalls } from '../../src/adapters/pptx/sourceMediaCalls';
import { preparePptxSourceTimeline } from '../../src/adapters/pptx/sourceTimeline';
import type { PlayerSnapshot } from '../../src/core/playerSnapshot';
vi.mock('../../src/adapters/pptx/sourceTimeline', async importOriginal => ({ ...await importOriginal<typeof import('../../src/adapters/pptx/sourceTimeline')>(), preparePptxSourceTimeline: vi.fn() }));
vi.mock('../../src/adapters/pptx/sourceMediaCalls', () => ({ preparePptxSourceMediaCalls: vi.fn(async () => []) }));
vi.mock('../../src/adapters/pptx/sourceOrder', () => ({ inspectPptxSourceOrder: vi.fn(() => ({ groups: [], independentMedia: [], mediaOnlyGroups: 0, executionVerified: false })) }));
const mocks = vi.hoisted(() => ({ restore: vi.fn(), play: vi.fn(async () => 'completed'), invalidate: vi.fn(), engineDispose: vi.fn(), sourceDispose: vi.fn(), construct: vi.fn(), busy: false }));
vi.mock('../../src/adapters/pptx/sourceModel', () => ({ loadPptxSourceModel: vi.fn() }));
vi.mock('../../src/adapters/pptx/engineDriver', () => ({ createPptxEngineDriver: vi.fn(() => ({ driver: { totalGroups: 1, targets: [1], restore: vi.fn(), next: vi.fn() }, dispose: mocks.engineDispose })) }));
vi.mock('../../src/adapters/pptx/durablePlayback', async importOriginal => ({ ...await importOriginal<typeof import('../../src/adapters/pptx/durablePlayback')>(), PptxDurablePlayback: class {
  constructor(_root: unknown, driver: unknown) { mocks.construct(driver); }
  restore = mocks.restore; play = mocks.play; invalidate = mocks.invalidate; get isBusy() { return mocks.busy; }
} }));
vi.mock('../../src/adapters/pptx/mediaSlots', () => ({ PptxMediaSlots: class { paint = vi.fn(); add = vi.fn(() => ({ dataset: {} })); dispose = vi.fn(); }, pptxMediaElement: vi.fn((slide, path) => slide.elements[path[0]]) }));
const fp = 'a'.repeat(64);
const document: PresentationDocumentState = { id: 'doc', source: { type: 'pptx', name: 'Synthetic.pptx', size: 4, lastModified: 0, fingerprint: fp }, knownSlideCount: 1, slideIds: ['s1'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
const options = () => ({ file: new File([], 'Synthetic.pptx'), signal: new AbortController().signal, document, slideId: 's1', sessionId: 'lesson', root: { replaceChildren: vi.fn() } as unknown as HTMLElement,
  transport: { snapshot: vi.fn(), send: vi.fn(), newId: vi.fn() } });
beforeEach(() => {
  vi.clearAllMocks(); mocks.restore.mockReset();
  mocks.busy = false; vi.mocked(preparePptxSourceTimeline).mockReset().mockRejectedValue(Error('SYNTHETIC_NOT_CONNECTED'));
  vi.mocked(inspectPptxSourceOrder).mockReset().mockReturnValue({ groups: [], independentMedia: [], mediaOnlyGroups: 0, executionVerified: false, sequences: [], timeNodes: [] });
  vi.mocked(loadPptxSourceModel).mockResolvedValue({ fingerprint: fp, parts: ['ppt/slides/slide1.xml'], files: { 'ppt/slides/slide1.xml': new TextEncoder().encode('<p:sld/>') },
    model: { source: 'pptx', width: 960, height: 540, slides: [{ elements: [] }] }, ownedUrls: new Set(), dispose: mocks.sourceDispose,
    inspection: { timingSlides: 0, transitionSlides: 0, externalRelationships: 0, unsafeExternalRelationships: 0 } } as unknown as Awaited<ReturnType<typeof loadPptxSourceModel>>);
});
describe('registered runtime composition (engine/transport boundaries mocked)', () => {
  const timeline = () => ({ controlsVerified: true as const, executionVerified: false as const, groups: [1, 2].map(timingId => ({
    timingId, shapeGroup: null, actions: [{ mediaId: 'clip', binding: 'synthetic', action: { type: 'play' as const }, delayMs: 0 }],
  })) });
  async function refreshFixture(savedSource = false) {
    vi.mocked(inspectPptxSourceOrder).mockReturnValueOnce({ groups: [{ timingId: 1, shapeSteps: [], media: [{ node: 'cmd', shapeId: 7, timingId: 4 }] }],
      mediaOnlyGroups: 1, independentMedia: [], sequences: [], timeNodes: [], executionVerified: false });
    vi.mocked(createPptxEngineDriver).mockReturnValueOnce({ driver: { totalGroups: 0, targets: [], restore: vi.fn(), next: vi.fn() }, dispose: mocks.engineDispose });
    const snapshot: PlayerSnapshot = { sessionId: 'lesson', revision: 0, selection: { documentId: 'doc', slideId: 's1' }, sourceFingerprint: fp,
      pptx: { run: null, checkpoint: null }, pageNumber: 1, media: [], overlays: [], autoplay: null, timers: [] };
    if (savedSource) snapshot.pptx!.checkpoint = { renderer: 'web-ppt-0.4.5/source-v1', fingerprint: fp, completedGroups: 1,
      pose: { version: 1, scope: { sessionId: 'lesson', documentId: 'doc', slideId: 's1', revision: 0 }, entries: [] } };
    const base = options(); base.transport.snapshot.mockImplementation(() => structuredClone(snapshot));
    const startMedia = vi.fn(), runtime = await openPptxRuntime({ ...base, startMedia });
    const add = () => { snapshot.media = [{ ref: { id: 'clip', slideId: 's1', kind: 'video', mime: 'video/mp4', durationSec: 4, fingerprint: 'b'.repeat(64),
      embeddedSource: { type: 'pptx', sourceFingerprint: fp, sourcePart: 'ppt/slides/slide1.xml', elementPath: [0] } }, bookmark: null }]; snapshot.revision++; };
    return { runtime, snapshot, startMedia, add };
  }
  it('prepares late connected media without reopening the model or invoking native actions', async () => {
    const f = await refreshFixture(); expect(f.runtime.groups).toBe(0); f.add();
    vi.mocked(preparePptxSourceTimeline).mockResolvedValue(timeline());
    expect(await f.runtime.refreshMediaTimeline()).toBe('updated'); expect(f.runtime.sourceMediaExecution).toBe(true); expect(f.runtime.groups).toBe(2);
    expect(loadPptxSourceModel).toHaveBeenCalledOnce(); expect(mocks.sourceDispose).not.toHaveBeenCalled(); expect(f.startMedia).not.toHaveBeenCalled();
    expect(await f.runtime.refreshMediaTimeline()).toBe('unchanged'); expect(preparePptxSourceTimeline).toHaveBeenCalledTimes(2);
  });
  it('opens a source checkpoint without available actions and recovers in the same runtime', async () => {
    const f = await refreshFixture(true), saved = structuredClone(f.snapshot.pptx!.checkpoint);
    expect(f.runtime.groups).toBe(1); expect(f.runtime.sourceMediaUnavailable).toBe(true); expect(mocks.restore).toHaveBeenCalledOnce();
    await expect(f.runtime.play()).rejects.toThrow('UNAVAILABLE'); expect(f.startMedia).not.toHaveBeenCalled();
    f.add(); vi.mocked(preparePptxSourceTimeline).mockResolvedValue(timeline());
    expect(await f.runtime.refreshMediaTimeline()).toBe('updated'); expect(f.runtime.sourceMediaUnavailable).toBe(false);
    expect(f.snapshot.pptx!.checkpoint).toEqual(saved); expect(f.startMedia).not.toHaveBeenCalled(); expect(loadPptxSourceModel).toHaveBeenCalledOnce();
  });
  it.each(['busy', 'run', 'request'] as const)('defers %s without consuming requests or touching native playback', async boundary => {
    const f = await refreshFixture(); f.add();
    if (boundary === 'busy') mocks.busy = true;
    if (boundary === 'run') f.snapshot.pptx!.run = { epoch: 'old-run', slideId: 's1' };
    if (boundary === 'request') f.snapshot.pptx!.request = { commandId: 'old-request', slideId: 's1' };
    expect(await f.runtime.refreshMediaTimeline()).toBe('deferred'); expect(preparePptxSourceTimeline).toHaveBeenCalledOnce(); expect(f.startMedia).not.toHaveBeenCalled();
  });
  it('shares an in-flight preparation and ignores notes/bookmark-only changes', async () => {
    const f = await refreshFixture(); f.add(); let finish!: (value: ReturnType<typeof timeline>) => void;
    vi.mocked(preparePptxSourceTimeline).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const first = f.runtime.refreshMediaTimeline(); expect(f.runtime.preparingMedia).toBe(true); expect(f.runtime.busy).toBe(true); expect(f.runtime.refreshMediaTimeline()).toBe(first);
    f.snapshot.revision++; finish(timeline()); expect(await first).toBe('updated'); expect(f.runtime.preparingMedia).toBe(false); expect(f.runtime.busy).toBe(false);
    f.snapshot.revision++; expect(await f.runtime.refreshMediaTimeline()).toBe('unchanged');
  });
  it.each(['disposed', 'metadata', 'newRequest'] as const)('does not apply a late prepared result after %s', async boundary => {
    const f = await refreshFixture(); f.add(); let finish!: (value: ReturnType<typeof timeline>) => void;
    vi.mocked(preparePptxSourceTimeline).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
    const pending = f.runtime.refreshMediaTimeline();
    if (boundary === 'disposed') f.runtime.dispose();
    if (boundary === 'metadata') f.snapshot.media[0]!.ref.embeddedSource!.elementPath = [1];
    if (boundary === 'newRequest') f.snapshot.pptx!.request = { commandId: 'new-request', slideId: 's1' };
    finish(timeline());
    if (boundary === 'disposed') await expect(pending).rejects.toThrow('DISPOSED');
    else expect(await pending).toBe('deferred');
    expect(f.runtime.sourceMediaExecution).toBe(false); expect(f.startMedia).not.toHaveBeenCalled();
  });
  it('refuses automatic conversion of an existing transform checkpoint', async () => {
    const f = await refreshFixture(); f.add(); vi.mocked(preparePptxSourceTimeline).mockResolvedValue(timeline());
    f.snapshot.pptx!.checkpoint = { renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: fp, completedGroups: 1,
      pose: { version: 1, scope: { sessionId: 'lesson', documentId: 'doc', slideId: 's1', revision: 0 }, entries: [] } };
    const previous = structuredClone(f.snapshot);
    expect(await f.runtime.refreshMediaTimeline()).toBe('unavailable'); expect(f.runtime.sourceMediaExecution).toBe(false);
    expect(f.snapshot).toEqual(previous); expect(f.runtime.groups).toBe(0);
  });
  it('does not let an older preparation replace a newer input result', async () => {
    const f = await refreshFixture(); f.add(); let finishOld!: (value: ReturnType<typeof timeline>) => void;
    vi.mocked(preparePptxSourceTimeline).mockImplementationOnce(() => new Promise(resolve => { finishOld = resolve; }));
    const old = f.runtime.refreshMediaTimeline(); f.snapshot.media[0]!.ref.playback = { startSec: 0, endSec: 4, volume: .5, muted: true };
    vi.mocked(preparePptxSourceTimeline).mockResolvedValueOnce(timeline());
    expect(await f.runtime.refreshMediaTimeline()).toBe('updated'); const restores = mocks.restore.mock.calls.length;
    finishOld(timeline()); expect(await old).toBe('deferred'); expect(mocks.restore).toHaveBeenCalledTimes(restores); expect(f.runtime.sourceMediaExecution).toBe(true);
  });
  it('retains a source checkpoint on failed reprepare and recovers on corrected metadata', async () => {
    const f = await refreshFixture(); f.add(); vi.mocked(preparePptxSourceTimeline).mockResolvedValue(timeline());
    await f.runtime.refreshMediaTimeline();
    f.snapshot.pptx!.checkpoint = { renderer: 'web-ppt-0.4.5/source-v1', fingerprint: fp, completedGroups: 1,
      pose: { version: 1, scope: { sessionId: 'lesson', documentId: 'doc', slideId: 's1', revision: 0 }, entries: [] } };
    f.snapshot.media[0]!.ref.playback = { startSec: 0, endSec: 3, volume: .5, muted: false };
    vi.mocked(preparePptxSourceTimeline).mockRejectedValueOnce(Error('SYNTHETIC_SOURCE_SETTINGS_FAILED'));
    const checkpoint = structuredClone(f.snapshot.pptx!.checkpoint);
    expect(await f.runtime.refreshMediaTimeline()).toBe('unavailable'); expect(f.runtime.groups).toBe(2); expect(f.snapshot.pptx!.checkpoint).toEqual(checkpoint);
    expect(f.runtime.inspection.items.find(item => item.id === 'pptx-source-media-execution')?.status).toBe('unknown');
    await expect(f.runtime.play()).rejects.toThrow('UNAVAILABLE');
    f.snapshot.media[0]!.ref.playback!.endSec = 4;
    expect(await f.runtime.refreshMediaTimeline()).toBe('updated'); expect(f.snapshot.pptx!.checkpoint).toEqual(checkpoint); expect(f.startMedia).not.toHaveBeenCalled();
  });
  it('prepares source media calls only on explicit request and refuses disposed runtimes', async () => {
    const runtime = await openPptxRuntime(options()); expect(preparePptxSourceMediaCalls).not.toHaveBeenCalled();
    expect(await runtime.resolveSourceMediaCalls()).toEqual([]); expect(preparePptxSourceMediaCalls).toHaveBeenCalledOnce();
    expect(mocks.play).not.toHaveBeenCalled(); runtime.dispose(); await expect(runtime.resolveSourceMediaCalls()).rejects.toThrow('PPTX_RUNTIME_DISPOSED');
  });
  it('does not return late prepared calls from a disposed runtime', async () => {
    let resolve!: (calls: []) => void;
    vi.mocked(preparePptxSourceMediaCalls).mockImplementationOnce(() => new Promise<[]>(yes => { resolve = yes; }));
    const runtime = await openPptxRuntime(options()), pending = runtime.resolveSourceMediaCalls(); runtime.dispose(); resolve([]);
    await expect(pending).rejects.toThrow('PPTX_RUNTIME_DISPOSED'); expect(mocks.play).not.toHaveBeenCalled();
  });
  it.each([false, true])('reports exact official shape batch correspondence (split=%s) without enabling original media', async split => {
    const source = await loadPptxSourceModel(new File([], 'Fixture.pptx'), new AbortController().signal);
    source.model.slides[0]!.animations = [1, 2].map(target => ({ target, effect: 'fade', kind: 'entrance', trigger: 'click', durationMs: 200, delayMs: 0, clickGroup: 0 }));
    vi.mocked(inspectPptxSourceOrder).mockReturnValueOnce({ groups: split
      ? [{ timingId: 1, shapeSteps: [0], media: [] }, { timingId: 2, shapeSteps: [1], media: [] }]
      : [{ timingId: 1, shapeSteps: [], media: [{ node: 'audio', shapeId: 3, timingId: 10 }] }, { timingId: 2, shapeSteps: [0, 1], media: [] }],
      mediaOnlyGroups: split ? 0 : 1, independentMedia: [], sequences: [], timeNodes: [], executionVerified: false });
    const runtime = await openPptxRuntime(options());
    expect(runtime.inspection.items.find(item => item.id === 'pptx-source-shape-groups')?.status).toBe(split ? 'unknown' : 'warning');
    expect(runtime.sourceShapeGroups?.map(group => group.shapeGroup) ?? null).toEqual(split ? null : [null, 0]);
    expect(mocks.play).not.toHaveBeenCalled(); runtime.dispose();
  });
  it('reports unmapped source order without changing source rendering or authorizing media execution', async () => {
    vi.mocked(inspectPptxSourceOrder).mockImplementationOnce(() => { throw Error('PPTX_SOURCE_ORDER_UNVERIFIED'); });
    const runtime = await openPptxRuntime(options());
    expect(runtime.sourceOrder).toBeNull(); expect(runtime.inspection.items.find(item => item.id === 'pptx-source-order')?.status).toBe('unknown');
    expect(mocks.restore).toHaveBeenCalledOnce(); expect(mocks.play).not.toHaveBeenCalled(); runtime.dispose();
  });
  it('retains source-only media groups in diagnostics without treating them as completed model groups', async () => {
    vi.mocked(inspectPptxSourceOrder).mockReturnValueOnce({ groups: [{ timingId: 1, shapeSteps: [], media: [{ node: 'cmd', shapeId: 2, timingId: 3 }] }],
      mediaOnlyGroups: 1, independentMedia: [], sequences: [], timeNodes: [], executionVerified: false });
    const runtime = await openPptxRuntime(options());
    expect(runtime.groups).toBe(1); expect(runtime.sourceOrder?.mediaOnlyGroups).toBe(1);
    expect(runtime.inspection.items.find(item => item.id === 'pptx-source-order')?.message).toContain('미디어 전용 1개');
    expect(mocks.play).not.toHaveBeenCalled(); runtime.dispose();
  });
  async function mediaFixture() {
    const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8);
    const file = new File([bytes], 'Synthetic.wav'), input = await readMediaInput(file), src = 'blob:owned';
    const source = await loadPptxSourceModel(new File([], 'Fixture.pptx'), new AbortController().signal);
    source.model.slides[0]!.elements = [{ kind: 'image', id: 1, x: 0, y: 0, w: 100, h: 100, rot: 0, flipH: false, flipV: false, src: '', crop: null, media: { kind: 'audio', mime: 'audio/wav', src } }];
    source.ownedUrls = new Set([src]); source.ownedBlobs = new Map([[src, new Blob([bytes], { type: 'audio/wav' })]]);
    source.retain = vi.fn(() => ({ dispose: vi.fn() }) as unknown as typeof source);
    const runtime = await openPptxRuntime(options());
    return { runtime, ref: { id: 'clip', slideId: 's1', durationSec: 4, ...input,
      embeddedSource: { type: 'pptx' as const, sourceFingerprint: fp, sourcePart: 'ppt/slides/slide1.xml', elementPath: [0] } } };
  }
  it('resolves public media from the guarded owned source once without filename or media vault input', async () => {
    const { runtime, ref } = await mediaFixture(), first = await runtime.resolveMedia(ref), next = await runtime.resolveMedia(ref);
    expect(first.file).toBe(next.file); expect(first.file.size).toBe(44); expect(first.target).toBeTruthy();
    expect(first.asset).toBe(next.asset); const held = first.asset.acquire(ref); expect(held.url).toBe('blob:owned'); held.dispose();
    runtime.dispose(); await expect(runtime.resolveMedia(ref)).rejects.toThrow('PPTX_RUNTIME_DISPOSED');
    expect(() => first.asset.acquire(ref)).toThrow('PPTX_MEDIA_URL_UNAVAILABLE');
  });
  it('rejects an otherwise matching public media ref from a different original or source occurrence', async () => {
    const { runtime, ref } = await mediaFixture();
    await expect(runtime.resolveMedia({ ...ref, embeddedSource: { ...ref.embeddedSource, sourceFingerprint: 'b'.repeat(64) } })).rejects.toThrow('PPTX_MEDIA_RECONNECT_MISMATCH');
    await expect(runtime.resolveMedia({ ...ref, embeddedSource: { ...ref.embeddedSource, elementPath: [1] } })).rejects.toThrow('PPTX_MEDIA_RECONNECT_MISMATCH'); runtime.dispose();
  });
  it('restores before return, delegates play and disposes resources once', async () => {
    const runtime = await openPptxRuntime(options()); expect(mocks.restore).toHaveBeenCalledOnce();
    expect(runtime.groups).toBe(1); expect(runtime.inspection.documentId).toBe('doc');
    await expect(runtime.play()).resolves.toBe('completed'); runtime.dispose(); runtime.dispose();
    expect(mocks.invalidate).toHaveBeenCalledOnce(); expect(mocks.engineDispose).toHaveBeenCalledOnce(); expect(mocks.sourceDispose).toHaveBeenCalledOnce();
    expect(() => runtime.restore()).toThrow('PPTX_RUNTIME_DISPOSED'); await expect(runtime.play()).rejects.toThrow('PPTX_RUNTIME_DISPOSED');
  });
  it.each(['fingerprint', 'slide', 'closed'])('rejects %s mismatch before starting the engine', async boundary => {
    const value = options(); value.document = structuredClone(document);
    if (boundary === 'fingerprint' && value.document.source.type === 'pptx') value.document.source.fingerprint = 'b'.repeat(64);
    if (boundary === 'slide') value.slideId = 'missing'; if (boundary === 'closed') value.document.closed = true;
    await expect(openPptxRuntime(value)).rejects.toThrow('PPTX_MODEL_BINDING_MISMATCH');
    expect(createPptxEngineDriver).not.toHaveBeenCalled(); expect(mocks.sourceDispose).toHaveBeenCalledOnce();
  });
  it('cleans up a failed checkpoint restore', async () => {
    mocks.restore.mockImplementationOnce(() => { throw Error('PPTX_CHECKPOINT_FAILED'); });
    const value = options(); await expect(openPptxRuntime(value)).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    expect(mocks.engineDispose).toHaveBeenCalledOnce(); expect(mocks.sourceDispose).toHaveBeenCalledOnce(); expect(value.root.replaceChildren).toHaveBeenCalledOnce();
  });
});
