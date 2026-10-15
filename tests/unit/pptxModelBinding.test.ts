import { describe, expect, it } from 'vitest';
import { bindPptxSlideModel } from '../../src/adapters/pptx/modelBinding';
import type { PresentationDocumentState } from '../../src/core/types';
const fingerprint = 'a'.repeat(64), parts = ['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'];
const doc = (): PresentationDocumentState => ({ id: 'D', source: { type: 'pptx', name: 'Synthetic.pptx', size: 10, lastModified: 0, fingerprint }, knownSlideCount: 2, slideIds: ['unique-B', 'unique-A'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false });
const model = () => ({ source: 'pptx', slides: [{ title: 'B' }, { title: 'A' }] });
describe('PPTX registered ID/source/model binding', () => {
  it('binds IDs to manifest order instead of filename sort', () => {
    const presentation = model(), document = doc(), before = structuredClone(document), binding = bindPptxSlideModel(document, fingerprint, parts, presentation);
    expect(binding.get('unique-B')).toMatchObject({ sourcePart: parts[0], index: 0, slide: { title: 'B' } }); expect(binding.get('unique-A').slide).toBe(presentation.slides[1]); expect(document).toEqual(before);
    document.slideIds.reverse(); expect(binding.get('unique-B').index).toBe(0); expect(Object.isFrozen(binding.get('unique-B'))).toBe(true);
  });
  it.each([null, '', 'missing', '0'])('never defaults an absent ID %s to the first page', id => { const binding = bindPptxSlideModel(doc(), fingerprint, parts, model()); expect(() => binding.get(id)).toThrow('PPTX_MODEL_BINDING_MISMATCH'); });
  it.each(['fingerprint', 'source', 'closed', 'count', 'duplicate-id', 'empty-id', 'long-id', 'parts', 'path', 'model-count', 'model-source', 'missing-model'])('rejects %s mismatch', condition => {
    const document = doc(), source = model(), ordered = [...parts]; let hash = fingerprint;
    if (condition === 'fingerprint') hash = 'b'.repeat(64);
    if (condition === 'source') document.source.type = 'pdf';
    if (condition === 'closed') document.closed = true;
    if (condition === 'count') document.knownSlideCount = 3;
    if (condition === 'duplicate-id') document.slideIds[1] = document.slideIds[0]!;
    if (condition === 'empty-id') document.slideIds[0] = '';
    if (condition === 'long-id') document.slideIds[0] = 'x'.repeat(201);
    if (condition === 'parts') ordered[1] = ordered[0]!;
    if (condition === 'path') ordered[0] = 'ppt/slides/../slide1.xml';
    if (condition === 'model-count') source.slides.pop();
    if (condition === 'model-source') source.source = 'ppt';
    if (condition === 'missing-model') delete source.slides[0];
    expect(() => bindPptxSlideModel(document, hash, ordered, source)).toThrow('PPTX_MODEL_BINDING_MISMATCH');
  });
});
