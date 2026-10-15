import { describe, expect, it } from 'vitest';
import { inspectPptxWorkerEnvelope } from '../../src/adapters/pptx/workerEnvelope';
import { PPTX_LIMITS } from '../../src/adapters/pptx/packageGuard';

const model = { width: 960, height: 540, slides: [{ elements: [{ kind: 'image' }] }] };
const response = () => ({ id: 1, ok: true, presentation: model, assets: [{ mime: 'image/png', data: new ArrayBuffer(8) }] });
describe('candidate PPTX Worker envelope bounds', () => {
  it('counts only metadata, never exposes source content', () => {
    expect(inspectPptxWorkerEnvelope(response())).toEqual({ slides: 1, topLevelElements: 1, assets: 1, assetBytes: 8 });
  });
  it.each([null, [], { ...response(), ok: false }, { ...response(), id: 0 }, { ...response(), id: NaN }, { ...response(), presentation: [] }])('rejects malformed envelopes', value => {
    expect(() => inspectPptxWorkerEnvelope(value)).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it.each([0, -1, Infinity, NaN, 1000001])('rejects invalid canvas dimensions', width => {
    expect(() => inspectPptxWorkerEnvelope({ ...response(), presentation: { ...model, width } })).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it.each([[], Array(1001).fill({ elements: [] }), [null], [{ elements: {} }], [{ elements: Array(100001).fill(null) }]])('limits slide and top-level element containers', slides => {
    expect(() => inspectPptxWorkerEnvelope({ ...response(), presentation: { ...model, slides } })).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it.each([[{ mime: 'image/png', data: new Uint8Array(8) }], [{ mime: 'text/html;inject', data: new ArrayBuffer(1) }], [null], Array(PPTX_LIMITS.entries + 1).fill({ mime: 'image/png', data: new ArrayBuffer(0) })])('rejects malformed or excessive assets', assets => {
    expect(() => inspectPptxWorkerEnvelope({ ...response(), assets })).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it('limits individual and aggregate bytes', () => {
    const oversize = { mime: 'image/png', data: new ArrayBuffer(PPTX_LIMITS.entry + 1) };
    expect(() => inspectPptxWorkerEnvelope({ ...response(), assets: [oversize] })).toThrow('PPTX_INVALID_PARSER_RESULT');
    const chunk = { mime: 'image/png', data: new ArrayBuffer(PPTX_LIMITS.entry) };
    expect(() => inspectPptxWorkerEnvelope({ ...response(), assets: Array(9).fill(chunk) })).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it('rejects an empty asset instead of creating an unusable Blob', () => {
    expect(() => inspectPptxWorkerEnvelope({ ...response(), assets: [{ mime: 'image/png', data: new ArrayBuffer(0) }] })).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
});
