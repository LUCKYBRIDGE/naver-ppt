import { describe, expect, it } from 'vitest';
import { validatePptxMediaReference } from '../../src/adapters/pptx/mediaReference';

const src = 'blob:chrome-extension://test/local', owned = new Set([src]);
describe('PPTX local media reference boundary', () => {
  it.each([
    ['audio', 'audio/wav', 'wav'], ['audio', 'audio/mpeg', 'mp3'],
    ['video', 'video/mp4', 'mp4'], ['video', 'video/webm', 'webm'],
  ])('accepts owned %s %s sources', (kind, mime, extension) => {
    expect(validatePptxMediaReference({ kind, mime, src, external: false }, owned)).toEqual({ kind, mime, src, extension });
  });
  it.each([null, [], false, 'media'])('rejects malformed references', value => {
    expect(() => validatePptxMediaReference(value, owned)).toThrow('PPTX_INVALID_MEDIA_REFERENCE');
  });
  it.each([true, 'false', null])('never follows externally marked references', external => {
    expect(() => validatePptxMediaReference({ kind: 'audio', mime: 'audio/wav', src, external }, owned)).toThrow('PPTX_EXTERNAL_MEDIA');
  });
  it.each(['https://example.invalid', 'data:audio/wav;base64,AAAA', 'javascript:neverRun()', 'blob:chrome-extension://test/other', null])('rejects unowned or non-Blob sources', source => {
    expect(() => validatePptxMediaReference({ kind: 'audio', mime: 'audio/wav', src: source }, owned)).toThrow('PPTX_UNOWNED_MEDIA');
  });
  it('rejects a remote URL even if the ownership set is incorrectly populated', () => {
    const remote = 'https://example.invalid';
    expect(() => validatePptxMediaReference({ kind: 'audio', mime: 'audio/wav', src: remote }, new Set([remote]))).toThrow('PPTX_UNOWNED_MEDIA');
  });
  it.each([['video', 'audio/wav'], ['audio', 'video/mp4'], ['video', 'application/octet-stream'], ['audio', 'text/html'], ['audio', '__proto__']])('rejects mismatched or unsupported MIME', (kind, mime) => {
    expect(() => validatePptxMediaReference({ kind, mime, src }, owned)).toThrow('PPTX_MEDIA_KIND_MISMATCH');
  });
});
