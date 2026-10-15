import { describe, expect, it } from 'vitest';
import { inspectPptxModel } from '../../src/adapters/pptx/modelInspection';
import { pptxModelPreflight } from '../../src/adapters/pptx/preflight';
import { emptyPptxMediaTiming } from '../../src/adapters/pptx/mediaTiming';
import type { PresentationDocumentState } from '../../src/core/types';
const model = () => ({ source: 'pptx', slides: [{ elements: [{ kind: 'shape' }] }] });
const fingerprint = 'a'.repeat(64), parts = ['ppt/slides/slide1.xml'];
const doc = (): PresentationDocumentState => ({ id: 'D', source: { type: 'pptx', name: 'Synthetic.pptx', size: 10, lastModified: 0, fingerprint }, knownSlideCount: 1, slideIds: ['unique-A'], lastSlideId: null, slideDeltas: { 'unique-A': { overlays: [], presenterNote: 'Synthetic private note', classLog: '' } }, mediaBookmarks: {}, dirty: false });
const source = () => ({ timingSlides: 0, transitionSlides: 0, externalRelationships: 0, unsafeExternalRelationships: 0 });
describe('PPTX model summary/limits (not fidelity proof)', () => {
  it('warns about source media commands even when the renderer model omits media', () => {
    const report = pptxModelPreflight(doc(), fingerprint, parts, model(), { ...source(), mediaTiming: {
      ...emptyPptxMediaTiming(), videoNodes: 1, commands: 1, recognizedCalls: 1,
    } }, 1);
    expect(report.items.find(item => item.id === 'pptx-media')?.status).toBe('unknown');
    const item = report.items.find(item => item.id === 'pptx-source-media-timing');
    expect(item?.status).toBe('warning'); expect(item?.message).toContain('명령 1개'); expect(item?.message).toContain('명령을 실행하지');
  });
  it('rejects malformed source media counts before publishing a preflight result', () => {
    expect(() => pptxModelPreflight(doc(), fingerprint, parts, model(), { ...source(), mediaTiming: { ...emptyPptxMediaTiming(), commands: -1 } }, 1)).toThrow('PPTX_INVALID_MEDIA_TIMING_SUMMARY');
  });
  it.each(['trimNodes', 'unverifiedTimingNodes'] as const)('warns about source %s even when the model has no media', key => {
    const report = pptxModelPreflight(doc(), fingerprint, parts, model(), { ...source(), mediaTiming: { ...emptyPptxMediaTiming(), [key]: 1 } }, 1);
    expect(report.items.find(item => item.id === 'pptx-source-media-timing')?.status).toBe('warning');
  });
  it('counts nested placeholders/media and model effects/transitions without copying content', () => {
    const result = inspectPptxModel({ source: 'pptx', slides: [{ hidden: true, transition: {}, animations: [{ label: 'private' }], elements: [{ kind: 'group', children: [{ kind: 'unsupported', label: 'private' }, { kind: 'image', media: { src: 'https://example.invalid/private' } }, { kind: 'futureKind' }] }] }] });
    expect(result).toEqual({ slides: 1, elements: 4, unsupported: 1, unknownKinds: 1, media: 1, animationSlides: 1, animationSteps: 1, transitions: 1, hiddenSlides: 1 }); expect(JSON.stringify(result)).not.toContain('private');
  });
  it.each([null, {}, { source: 'ppt', slides: [{}] }, { source: 'pptx', slides: [] }, { source: 'pptx', slides: [{}] }, { source: 'pptx', slides: [{ elements: [null] }] }, { source: 'pptx', slides: [{ elements: [{ kind: 'group' }] }] }, { source: 'pptx', slides: [{ elements: [], animations: [null] }] }, { source: 'pptx', slides: [{ elements: [], animations: new Array(1) }] }])('rejects malformed input %#', value => { expect(() => inspectPptxModel(value)).toThrow('PPTX_INVALID_INSPECTION_MODEL'); });
  it('bounds pages/elements/animations', () => {
    expect(() => inspectPptxModel({ source: 'pptx', slides: Array.from({ length: 1001 }, () => ({ elements: [] })) })).toThrow();
    expect(() => inspectPptxModel({ source: 'pptx', slides: [{ elements: Array.from({ length: 100001 }, () => ({ kind: 'shape' })) }] })).toThrow();
    expect(() => inspectPptxModel({ source: 'pptx', slides: [{ elements: [], animations: Array.from({ length: 5001 }, () => ({})) }] })).toThrow();
  });
  it('rejects cycles and excessively deep groups', () => {
    const cycle: { kind: string; children: unknown[] } = { kind: 'group', children: [] }; cycle.children.push(cycle);
    expect(() => inspectPptxModel({ source: 'pptx', slides: [{ elements: [cycle] }] })).toThrow();
    let nested: unknown = { kind: 'shape' }; for (let i = 0; i < 34; i++) nested = { kind: 'group', children: [nested] };
    expect(() => inspectPptxModel({ source: 'pptx', slides: [{ elements: [nested] }] })).toThrow();
  });
  it('does not turn absent model features into support/fidelity success', () => {
    const document = doc(), before = structuredClone(document), report = pptxModelPreflight(document, fingerprint, parts, model(), source(), 1);
    expect(document).toEqual(before); expect(report.items.filter(item => item.status === 'pass').map(item => item.id)).toEqual(['pptx-model']);
    for (const id of ['pptx-fallback', 'pptx-fidelity', 'pptx-animation', 'pptx-transition', 'pptx-media', 'pptx-links', 'pptx-restart']) expect(report.items.find(item => item.id === id)?.status).toBe('unknown');
    expect(JSON.stringify(report)).not.toContain('Synthetic private note');
  });
  it('warns about native placeholders, original timing, media and external references', () => {
    const presentation = { source: 'pptx', slides: [{ hidden: true, transition: {}, elements: [{ kind: 'unsupported', label: 'secret' }, { kind: 'image', media: { src: 'file:///private' } }] }] };
    const report = pptxModelPreflight(doc(), fingerprint, parts, presentation, { timingSlides: 1, transitionSlides: 1, externalRelationships: 1, unsafeExternalRelationships: 1 }, 1);
    for (const id of ['pptx-fallback', 'pptx-animation', 'pptx-transition', 'pptx-hidden', 'pptx-media', 'pptx-links']) expect(report.items.find(item => item.id === id)?.status).toBe('warning');
    expect(JSON.stringify(report)).not.toMatch(/secret|file:|private/); expect(report.items.find(item => item.id === 'pptx-animation')?.message).toContain('모델 효과 0쪽');
  });
  it('rejects source/model identity or unbounded source summaries', () => {
    expect(() => pptxModelPreflight(doc(), 'b'.repeat(64), parts, model(), source(), 1)).toThrow();
    for (const changed of [{ timingSlides: 2 }, { transitionSlides: -1 }, { externalRelationships: Infinity }, { unsafeExternalRelationships: 1 }]) expect(() => pptxModelPreflight(doc(), fingerprint, parts, model(), { ...source(), ...changed }, 1)).toThrow('PPTX_INVALID_INSPECTION_SOURCE');
    expect(() => pptxModelPreflight(doc(), fingerprint, parts, model(), source(), NaN)).toThrow();
  });
});
