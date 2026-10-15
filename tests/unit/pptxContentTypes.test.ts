import { describe, expect, it } from 'vitest';
import { inspectContentTypes, PRESENTATION_MIME, type ContentTypeDeclaration } from '../../src/adapters/pptx/contentTypes';

const files = { '[Content_Types].xml': new Uint8Array(), 'ppt/presentation.xml': new Uint8Array(), 'ppt/media/image.png': new Uint8Array([137,80,78,71,13,10,26,10]) };
const declarations: ContentTypeDeclaration[] = [
  { kind: 'Default', key: 'xml', mime: 'application/xml' },
  { kind: 'Default', key: 'png', mime: 'image/png' },
  { kind: 'Override', key: '/ppt/presentation.xml', mime: PRESENTATION_MIME },
];
describe('PPTX content declarations and header cross-check', () => {
  it('applies defaults and exact overrides without changing bytes', () => {
    const before = files['ppt/media/image.png'].slice();
    expect(inspectContentTypes(files, declarations)).toEqual({ typedParts: 2, checkedMediaHeaders: 1, uncheckedMediaParts: 0, orphanOverrides: 0 });
    expect(files['ppt/media/image.png']).toEqual(before);
  });
  it.each([
    { kind: 'Default', key: 'PNG', mime: 'image/png' },
    { kind: 'Default', key: '../png', mime: 'image/png' },
    { kind: 'Default', key: 'jpg', mime: 'invalid mime' },
    { kind: 'Override', key: '/ppt/presentation.xml', mime: PRESENTATION_MIME },
    { kind: 'Override', key: '/ppt/presentation.xml#fragment', mime: 'application/xml' },
  ] as ContentTypeDeclaration[])('rejects invalid or duplicate declaration $key', extra => {
    expect(() => inspectContentTypes(files, [...declarations, extra])).toThrow('PPTX_INVALID_CONTENT_TYPES');
  });
  it.each(['application/vnd.ms-powerpoint.presentation.macroEnabled.main+xml', 'application/vnd.ms-office.vbaProject', 'text/html', 'application/javascript'])('rejects active MIME %s even if unused', mime => {
    expect(() => inspectContentTypes(files, [...declarations, { kind: 'Default', key: 'bin', mime }])).toThrow('PPTX_ACTIVE_CONTENT');
  });
  it('reports a harmless stale override without inventing a part', () => {
    expect(inspectContentTypes(files, [...declarations, { kind: 'Override', key: '/ppt/slideMasters/missing.xml', mime: 'application/xml' }])).toEqual({ typedParts: 2, checkedMediaHeaders: 1, uncheckedMediaParts: 0, orphanOverrides: 1 });
  });
  it('rejects untyped, wrong presentation and wrong relationship types', () => {
    expect(() => inspectContentTypes({ ...files, 'ppt/data.bin': new Uint8Array() }, declarations)).toThrow('PPTX_CONTENT_TYPE_MISSING');
    expect(() => inspectContentTypes(files, declarations.slice(0, 2))).toThrow('PPTX_PRESENTATION_TYPE_MISMATCH');
    expect(() => inspectContentTypes({ ...files, '_rels/.rels': new Uint8Array() }, [...declarations, { kind: 'Default', key: 'rels', mime: 'application/xml' }])).toThrow('PPTX_RELATIONSHIP_TYPE_MISMATCH');
  });
  it('rejects truncated and MIME/header-mismatched PNG', () => {
    expect(() => inspectContentTypes({ ...files, 'ppt/media/image.png': new Uint8Array([137,80]) }, declarations)).toThrow('PPTX_MEDIA_HEADER_MISMATCH');
    expect(() => inspectContentTypes(files, [...declarations, { kind: 'Override', key: '/ppt/media/image.png', mime: 'audio/wav' }])).toThrow('PPTX_MEDIA_HEADER_MISMATCH');
  });
  it.each([
    ['wav', 'audio/wav', [82,73,70,70,0,0,0,0,87,65,86,69]],
    ['mp3', 'audio/mpeg', [73,68,51]],
    ['mp4', 'video/mp4', [0,0,0,12,102,116,121,112,105,115,111,109]],
    ['webm', 'video/webm', [26,69,223,163]],
  ] as const)('checks %s initial container header, not full decoding', (extension, mime, header) => {
    const input = { ...files, [`ppt/media/test.${extension}`]: new Uint8Array(header) };
    const types = [...declarations, { kind: 'Default' as const, key: extension, mime }];
    expect(inspectContentTypes(input, types).checkedMediaHeaders).toBe(2);
    expect(() => inspectContentTypes({ ...input, [`ppt/media/test.${extension}`]: new Uint8Array([1]) }, types)).toThrow('PPTX_MEDIA_HEADER_MISMATCH');
  });
  it('reports other media as unchecked, never as verified', () => {
    expect(inspectContentTypes({ ...files, 'ppt/media/image.emf': new Uint8Array([1]) }, [...declarations, { kind: 'Default', key: 'emf', mime: 'image/x-emf' }]).uncheckedMediaParts).toBe(1);
  });
});
