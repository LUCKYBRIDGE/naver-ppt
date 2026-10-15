import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPptxPrivatePreview } from '../../src/adapters/pptx/privatePreview';
import { runPptxParserJob } from '../../src/adapters/pptx/isolatedModel';
import { inspectPptxXml } from '../../src/adapters/pptx/packageGuard';
import { parseDisplaySvg } from '../../src/adapters/pptx/svgBoundary';
import { renderSlideToSvg } from '@web-ppt/core';
import { readPptxInput } from '../../src/adapters/pptx/input';
import type { PresentationDocumentState } from '../../src/core/types';
vi.mock('../../src/adapters/pptx/isolatedPackage', () => ({ readPptxPackageIsolated: vi.fn(async () => ({ files: {} })) }));
vi.mock('../../src/adapters/pptx/packageGuard', () => ({ inspectPptxXml: vi.fn() }));
vi.mock('../../src/adapters/pptx/slideOrder', () => ({ PPTX_MAX_SLIDES: 2000, readPptxSlideOrder: vi.fn(() => ['ppt/slides/slide1.xml']) }));
vi.mock('../../src/adapters/pptx/isolatedModel', () => ({ runPptxParserJob: vi.fn() }));
vi.mock('../../src/adapters/pptx/svgBoundary', () => ({ parseDisplaySvg: vi.fn(() => ({ setAttribute: vi.fn() })) }));
vi.mock('@web-ppt/core', () => ({ renderSlideToSvg: vi.fn(() => '<svg/>') }));
const file = () => new File([new Uint8Array([80,75,3,4])], 'Synthetic.pptx');
const dispose = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(runPptxParserJob).mockResolvedValue({ model: { source: 'pptx', width: 960, height: 540, slides: [{ elements: [] }] }, ownedUrls: new Set(), dispose });
});
describe('private PPTX preview (parser/DOM boundaries mocked)', () => {
  it('binds registered IDs without mutating private deltas or creating another registration', async () => {
    const input = file(), { fingerprint } = await readPptxInput(input);
    const registered: PresentationDocumentState = { id: 'registered', source: { type: 'pptx', name: input.name, size: input.size, lastModified: 0, fingerprint },
      knownSlideCount: 1, slideIds: ['registered-slide'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
    const before = structuredClone(registered), preview = await loadPptxPrivatePreview(input, new AbortController().signal, registered);
    expect(preview.slideIds).toEqual(['registered-slide']); preview.render('registered-slide');
    expect(registered).toEqual(before); preview.dispose(); expect(dispose).toHaveBeenCalledOnce();
  });
  it('rejects a different registered fingerprint and releases loaded assets', async () => {
    const input = file(), registered: PresentationDocumentState = { id: 'registered', source: { type: 'pptx', name: input.name, size: input.size, lastModified: 0, fingerprint: 'a'.repeat(64) },
      knownSlideCount: 1, slideIds: ['registered-slide'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
    await expect(loadPptxPrivatePreview(input, new AbortController().signal, registered)).rejects.toThrow('PPTX_MODEL_BINDING_MISMATCH'); expect(dispose).toHaveBeenCalledOnce();
  });
  it('binds private IDs and excludes notes and playable media', async () => {
    const preview = await loadPptxPrivatePreview(file(), new AbortController().signal);
    expect(preview.slideIds).toHaveLength(1); expect(preview.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    preview.render(preview.slideIds[0]!);
    expect(renderSlideToSvg).toHaveBeenCalledWith(expect.anything(), expect.anything(), { textMode: 'html', media: 'badge', includeNotes: false });
    expect(parseDisplaySvg).toHaveBeenCalled(); expect(() => preview.render('missing')).toThrow('PPTX_MODEL_BINDING_MISMATCH');
    preview.dispose(); preview.dispose(); expect(dispose).toHaveBeenCalledOnce();
    expect(() => preview.render(preview.slideIds[0]!)).toThrow('PPTX_PREVIEW_DISPOSED');
  });
  it('does not launch the parser after unsafe XML', async () => {
    vi.mocked(inspectPptxXml).mockImplementationOnce(() => { throw Error('PPTX_UNSAFE_XML'); });
    await expect(loadPptxPrivatePreview(file(), new AbortController().signal)).rejects.toThrow('PPTX_UNSAFE_XML'); expect(runPptxParserJob).not.toHaveBeenCalled();
  });
  it('disposes completed assets on mismatched model count', async () => {
    vi.mocked(runPptxParserJob).mockResolvedValueOnce({ model: { source: 'pptx', width: 960, height: 540, slides: [] }, ownedUrls: new Set(), dispose });
    await expect(loadPptxPrivatePreview(file(), new AbortController().signal)).rejects.toThrow('PPTX_MODEL_BINDING_MISMATCH'); expect(dispose).toHaveBeenCalledOnce();
  });
  it('disposes assets when cancellation happens at completion', async () => {
    const controller = new AbortController(); vi.mocked(runPptxParserJob).mockImplementationOnce(async () => { controller.abort(); return { model: { slides: [] }, dispose }; });
    await expect(loadPptxPrivatePreview(file(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(dispose).toHaveBeenCalledOnce();
  });
});
