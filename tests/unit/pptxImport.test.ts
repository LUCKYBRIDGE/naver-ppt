import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSession } from '../../src/core/session';
import { SourceVault, sourceKey } from '../../src/storage/sourceVault';
import { readPptxInput } from '../../src/adapters/pptx/input';
import { preparePptxImport } from '../../src/adapters/pptx/import';
import { readPptxPackageIsolated } from '../../src/adapters/pptx/isolatedPackage';
import { inspectPptxXml } from '../../src/adapters/pptx/packageGuard';
import { readPptxSlideOrder } from '../../src/adapters/pptx/slideOrder';
import { inspectPptxTransformReadiness } from '../../src/adapters/pptx/behaviorPreflight';
vi.mock('../../src/adapters/pptx/preparationAdmission', () => ({ withPptxPreparation: (_signal: AbortSignal, work: () => Promise<unknown>) => work() }));
vi.mock('../../src/adapters/pptx/behaviorPreflight', () => ({ inspectPptxTransformReadiness: vi.fn() }));
vi.mock('../../src/adapters/pptx/isolatedPackage', () => ({ readPptxPackageIsolated: vi.fn() }));
vi.mock('../../src/adapters/pptx/packageGuard', () => ({ inspectPptxXml: vi.fn(), PPTX_LIMITS: { xml: 4194304 } }));
vi.mock('../../src/adapters/pptx/slideOrder', () => ({ readPptxSlideOrder: vi.fn() }));
const file = (tail = 'Synthetic', name = 'Synthetic.pptx') => new File([new Uint8Array([0x50, 0x4b, 3, 4]), tail], name, { lastModified: 1 });
const vault = () => new SourceVault({ read: async () => undefined, write: async () => {} }, undefined, readPptxInput);
afterEach(() => vi.unstubAllGlobals());
beforeEach(() => {
  vi.mocked(inspectPptxTransformReadiness).mockReset().mockResolvedValue([]);
  vi.mocked(readPptxPackageIsolated).mockReset().mockResolvedValue({ files: {}, entryCount: 2, expandedBytes: 0 });
  vi.mocked(inspectPptxXml).mockReset();
  vi.mocked(readPptxSlideOrder).mockReset().mockReturnValue(['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml']);
});
describe('PPTX import preparation (parser boundaries mocked)', () => {
  it('reports unresolved local slide font references without changing the lesson', async () => {
    vi.stubGlobal('FontFace', class { async load() { throw Error('Synthetic unresolved'); } });
    vi.mocked(inspectPptxXml).mockImplementation((_files, _signal, observe) => { observe?.('Synthetic'); return {} as ReturnType<typeof inspectPptxXml>; });
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), store = vault();
    const result = await preparePptxImport(file(), session, store);
    expect(result.preflight.items.find(item => item.id === 'pptx-local-fonts')?.status).toBe('warning'); expect(session).toEqual(before); store.close();
  });
  it('does not retain the original if cancelled during a local font lookup', async () => {
    const controller = new AbortController();
    vi.stubGlobal('FontFace', class { load() { controller.abort(); return new Promise(() => {}); } });
    vi.mocked(inspectPptxXml).mockImplementation((_files, _signal, observe) => { observe?.('Synthetic'); return {} as ReturnType<typeof inspectPptxXml>; });
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), store = vault(), remember = vi.spyOn(store, 'remember');
    await expect(preparePptxImport(file(), session, store, undefined, undefined, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(remember).not.toHaveBeenCalled(); expect(session).toEqual(before); store.close();
  });
  it('includes the original broken-font warning before source retention without changing the lesson', async () => {
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), store = vault();
    vi.mocked(inspectPptxXml).mockReturnValue({ fontMetadata: { references: 3, uniqueNames: 1, invalidReferences: 3, invalidNames: 1, embeddedParts: 0, truncated: false } } as ReturnType<typeof inspectPptxXml>);
    const result = await preparePptxImport(file(), session, store);
    expect(result.preflight.items.find(item => item.id === 'pptx-font-metadata')?.status).toBe('warning'); expect(session).toEqual(before); store.close();
  });
  it('reports unsupported transform pages before retaining the source, without changing the audience', async () => {
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), store = vault();
    vi.mocked(inspectPptxTransformReadiness).mockResolvedValue([{ id: 'pptx-transform-readiness', category: 'behavior', status: 'warning', message: 'Synthetic unsupported page 1' }]);
    const result = await preparePptxImport(file(), session, store);
    expect(result.preflight.items.at(-1)?.status).toBe('warning'); expect(session).toEqual(before); store.close();
  });
  it.each(['failure', 'cancel'] as const)('does not retain a source after transform inspection %s', async boundary => {
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), store = vault(), remember = vi.spyOn(store, 'remember');
    const controller = new AbortController();
    vi.mocked(inspectPptxTransformReadiness).mockImplementation(async () => { if (boundary === 'cancel') { controller.abort(); return []; } throw Error('PPTX_MODEL_TIMEOUT'); });
    await expect(preparePptxImport(file(), session, store, undefined, undefined, controller.signal)).rejects.toThrow();
    expect(remember).not.toHaveBeenCalled(); expect(session).toEqual(before); store.close();
  });
  it('rejects over 1000 slides before registration/source retention', async () => {
    vi.mocked(readPptxSlideOrder).mockReturnValueOnce(Array.from({ length: 1001 }, (_, i) => `ppt/slides/slide${i+1}.xml`));
    const store = vault(), remember = vi.spyOn(store, 'remember');
    await expect(preparePptxImport(file(), createSession('lesson', 'Synthetic', 0), store)).rejects.toThrow('1000쪽');
    expect(remember).not.toHaveBeenCalled(); store.close();
  });
  it('prepares unique IDs/metadata and keeps the original/session unmodified', async () => {
    const session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session), source = file(), store = vault();
    const result = await preparePptxImport(source, session, store);
    expect(session).toEqual(before); expect(result.reused).toBe(false); expect(result.document.knownSlideCount).toBe(2);
    expect(new Set(result.document.slideIds).size).toBe(2); expect(result.document.lastSlideId).toBeNull();
    expect(result.document.source).toMatchObject({ type: 'pptx', size: source.size, name: source.name, lastModified: 1 });
    expect((await store.get(sourceKey(session.id, result.document.id), result.preflight.fingerprint!)).file).toBe(source);
    expect(JSON.stringify(result.document)).not.toContain('bytes'); expect(result.preflight.environment).toContain('xml-order');
    for (const id of ['registration-media', 'registration-behavior', 'registration-offline']) expect(result.preflight.items.find(item => item.id === id)?.status).toBe('unknown');
    store.close();
  });
  it('reconnects exact content under a new name without changing IDs/deltas/selections', async () => {
    const session = createSession('lesson', 'Synthetic', 0), store = vault(), first = await preparePptxImport(file(), session, store), doc = first.document;
    session.documentOrder = [doc.id]; session.documents[doc.id] = doc; doc.dirty = true;
    doc.slideDeltas[doc.slideIds[0]!] = { overlays: [], presenterNote: 'Synthetic private note', classLog: '' };
    session.presentedSelection = { documentId: doc.id, slideId: doc.slideIds[1]! }; const before = structuredClone(session);
    const result = await preparePptxImport(file('Synthetic', 'Renamed.pptx'), session, store, undefined, doc.id);
    expect(result.document).toBe(doc); expect(result.reused).toBe(true); expect(session).toEqual(before);
    expect(readPptxPackageIsolated).toHaveBeenCalledTimes(1);
    expect(result.preflight.items.find(item => item.id === 'registration-pages')?.status).toBe('unknown');
    expect(result.preflight.items.find(item => item.id === 'pptx-local-fonts')).toMatchObject({ status: 'unknown', message: expect.stringContaining('PPTX 원본 점검') });
    expect(JSON.stringify(result.preflight)).not.toContain('Synthetic private note'); store.close();
  });
  it('automatically reuses identical PPTX content', async () => {
    const session = createSession('lesson', 'Synthetic', 0), store = vault(), first = await preparePptxImport(file(), session, store);
    session.documentOrder.push(first.document.id); session.documents[first.document.id] = first.document;
    expect((await preparePptxImport(file(), session, store)).document).toBe(first.document); store.close();
  });
  it('rejects changed or absent reconnect targets without modifying the session', async () => {
    const session = createSession('lesson', 'Synthetic', 0), store = vault(), first = await preparePptxImport(file(), session, store);
    session.documentOrder.push(first.document.id); session.documents[first.document.id] = first.document; const before = structuredClone(session);
    await expect(preparePptxImport(file('Changed'), session, store, undefined, first.document.id)).rejects.toThrow('내용이 다릅니다');
    await expect(preparePptxImport(file(), session, store, undefined, 'missing')).rejects.toThrow('내용이 다릅니다');
    expect(session).toEqual(before); store.close();
  });
  it.each(['package', 'xml', 'order'])('does not remember or register an input failing %s', async boundary => {
    const store = vault(), remember = vi.spyOn(store, 'remember'), session = createSession('lesson', 'Synthetic', 0), before = structuredClone(session);
    if (boundary === 'package') vi.mocked(readPptxPackageIsolated).mockRejectedValue(Error('PPTX_PACKAGE_LIMIT'));
    if (boundary === 'xml') vi.mocked(inspectPptxXml).mockImplementation(() => { throw Error('PPTX_INVALID_XML'); });
    if (boundary === 'order') vi.mocked(readPptxSlideOrder).mockImplementation(() => { throw Error('PPTX_INVALID_SLIDE_ORDER'); });
    await expect(preparePptxImport(file(), session, store)).rejects.toThrow('PPTX_'); expect(remember).not.toHaveBeenCalled(); expect(session).toEqual(before); store.close();
  });
  it('passes cancellation to package parsing without changing the session', async () => {
    const controller = new AbortController(), session = createSession('lesson', 'Synthetic', 0), store = vault();
    vi.mocked(readPptxPackageIsolated).mockImplementation(async () => { controller.abort(); throw new DOMException('Cancelled', 'AbortError'); });
    await expect(preparePptxImport(file(), session, store, undefined, undefined, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(readPptxPackageIsolated).toHaveBeenCalledWith(expect.any(Uint8Array), { signal: controller.signal }); expect(session.documentOrder).toEqual([]); store.close();
  });
  it('refuses to claim success if the explicit handle cannot be persisted', async () => {
    const store = new SourceVault({ read: async () => undefined, write: async () => { throw Error('HANDLE_WRITE_FAILED'); } }, undefined, readPptxInput);
    const session = createSession('lesson', 'Synthetic', 0);
    await expect(preparePptxImport(file(), session, store, { kind: 'file' } as FileSystemFileHandle)).rejects.toThrow('HANDLE_WRITE_FAILED'); expect(session.documentOrder).toEqual([]); store.close();
  });
});
