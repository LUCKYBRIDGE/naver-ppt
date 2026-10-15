import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectPptxFile } from '../../src/adapters/pptx/fileInspection';
import { readPptxPackageIsolated } from '../../src/adapters/pptx/isolatedPackage';
import { inspectPptxXml } from '../../src/adapters/pptx/packageGuard';
import { readPptxSlideOrder } from '../../src/adapters/pptx/slideOrder';
import { inspectPptxModelIsolated } from '../../src/adapters/pptx/isolatedModel';
import { emptyPptxMediaTiming } from '../../src/adapters/pptx/mediaTiming';
vi.mock('../../src/adapters/pptx/preparationAdmission', () => ({ withPptxPreparation: (_signal: AbortSignal, work: () => Promise<unknown>) => work() }));
vi.mock('../../src/adapters/pptx/isolatedModel', () => ({ inspectPptxModelIsolated: vi.fn() }));
vi.mock('../../src/adapters/pptx/isolatedPackage', () => ({ readPptxPackageIsolated: vi.fn() }));
vi.mock('../../src/adapters/pptx/packageGuard', () => ({ inspectPptxXml: vi.fn(), PPTX_LIMITS: { xml: 4194304 } }));
vi.mock('../../src/adapters/pptx/slideOrder', () => ({ readPptxSlideOrder: vi.fn() }));
const file = () => new File([new Uint8Array([0x50, 0x4b, 3, 4]), 'Synthetic private source'], 'Synthetic.pptx');
beforeEach(() => {
  vi.mocked(inspectPptxModelIsolated).mockReset().mockResolvedValue({ slides: 1, elements: 2, unsupported: 0, unknownKinds: 0, media: 0, animationSlides: 1, animationSteps: 1, transitions: 0, hiddenSlides: 0 });
  vi.mocked(readPptxPackageIsolated).mockReset().mockResolvedValue({ files: {}, entryCount: 2, expandedBytes: 0 });
  vi.mocked(inspectPptxXml).mockReset().mockReturnValue({ xmlCount: 2, timingSlides: 1, transitionSlides: 0, externalRelationships: 1, unsafeExternalRelationships: 1, internalRelationships: 1, typeSummary: null, mediaTiming: emptyPptxMediaTiming() });
  vi.mocked(readPptxSlideOrder).mockReset().mockReturnValue(['ppt/slides/slide1.xml']);
});
describe('PPTX file inspection (package boundaries mocked)', () => {
  it('reports verified structure separately from unverified model/render/media/behavior', async () => {
    const result = await inspectPptxFile(file(), new AbortController().signal);
    expect(result.scope).toBe('document'); expect(result.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(result.items.filter(item => item.status === 'pass').map(item => item.id)).toEqual(['pptx-file-source', 'pptx-file-package', 'pptx-file-order']);
    for (const id of ['pptx-file-fidelity', 'pptx-file-media', 'pptx-file-restart']) expect(result.items.find(item => item.id === id)?.status).toBe('unknown');
    expect(result.items.find(item => item.id === 'pptx-file-animation')?.status).toBe('warning'); expect(result.items.find(item => item.id === 'pptx-file-links')?.status).toBe('warning');
    expect(JSON.stringify(result)).not.toContain('Synthetic private source');
    expect(inspectPptxModelIsolated).not.toHaveBeenCalled();
  });
  it('runs the opted-in model only after guards and keeps fidelity unverified', async () => {
    const result = await inspectPptxFile(file(), new AbortController().signal, true);
    expect(result.items).toHaveLength(13); expect(result.environment).toContain('web-ppt-0.4.5');
    expect(result.items.find(item => item.id === 'pptx-file-model-effects')?.status).toBe('warning');
    expect(result.items.find(item => item.id === 'pptx-file-model-loss')?.status).toBe('unknown');
    expect(result.items.find(item => item.id === 'pptx-file-fidelity')?.status).toBe('unknown');
    expect(vi.mocked(inspectPptxModelIsolated).mock.invocationCallOrder[0]).toBeGreaterThan(vi.mocked(readPptxSlideOrder).mock.invocationCallOrder[0]!);
  });
  it('does not publish success for a model count different from the manifest', async () => {
    vi.mocked(inspectPptxModelIsolated).mockResolvedValue({ slides: 2, elements: 0, unsupported: 0, unknownKinds: 0, media: 0, animationSlides: 0, animationSteps: 0, transitions: 0, hiddenSlides: 0 });
    await expect(inspectPptxFile(file(), new AbortController().signal, true)).rejects.toThrow('PPTX_MODEL_ORDER_COUNT_MISMATCH');
  });
  it('discards a model completion after cancellation', async () => {
    const controller = new AbortController(); vi.mocked(inspectPptxModelIsolated).mockImplementation(async () => { controller.abort(); return { slides: 1, elements: 0, unsupported: 0, unknownKinds: 0, media: 0, animationSlides: 0, animationSteps: 0, transitions: 0, hiddenSlides: 0 }; });
    await expect(inspectPptxFile(file(), controller.signal, true)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('does not interpret absent XML timing/links as fully supported', async () => {
    vi.mocked(inspectPptxXml).mockReturnValue({ xmlCount: 2, timingSlides: 0, transitionSlides: 0, externalRelationships: 0, unsafeExternalRelationships: 0, internalRelationships: 1, typeSummary: null, mediaTiming: emptyPptxMediaTiming() });
    const result = await inspectPptxFile(file(), new AbortController().signal);
    for (const id of ['pptx-file-animation', 'pptx-file-transition', 'pptx-file-links']) expect(result.items.find(item => item.id === id)?.status).toBe('unknown');
  });
  it.each(['package', 'xml', 'order'])('returns no successful report after %s fails', async boundary => {
    if (boundary === 'package') vi.mocked(readPptxPackageIsolated).mockRejectedValue(Error('PPTX_PACKAGE_LIMIT'));
    if (boundary === 'xml') vi.mocked(inspectPptxXml).mockImplementation(() => { throw Error('PPTX_INVALID_XML'); });
    if (boundary === 'order') vi.mocked(readPptxSlideOrder).mockImplementation(() => { throw Error('PPTX_INVALID_SLIDE_ORDER'); });
    await expect(inspectPptxFile(file(), new AbortController().signal)).rejects.toThrow('PPTX_');
  });
  it('rejects pre-cancelled input without starting a worker', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectPptxFile(file(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(readPptxPackageIsolated).not.toHaveBeenCalled();
  });
  it('discards inspection cancelled during XML work', async () => {
    const controller = new AbortController(); vi.mocked(inspectPptxXml).mockImplementation(() => { controller.abort(); return { xmlCount: 2, timingSlides: 0, transitionSlides: 0, externalRelationships: 0, unsafeExternalRelationships: 0, internalRelationships: 1, typeSummary: null, mediaTiming: emptyPptxMediaTiming() }; });
    await expect(inspectPptxFile(file(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
