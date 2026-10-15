import { describe, expect, it } from 'vitest';
import { createPptxFontMetadata, pptxFontPreflight } from '../../src/adapters/pptx/fontMetadata';
const xml = (names: (string | null)[]) => ({ getElementsByTagName: () => names.map(name => ({ getAttribute: () => name })) }) as unknown as Document;
describe('bounded original font metadata without source text', () => {
  it('counts unique broken names separately from repeated references and embedded parts', () => {
    const fonts = createPptxFontMetadata(2); fonts.inspect(xml(['SyntheticFont', 'a\uFFFDfont', 'a\uFFFDfont', '', null]));
    const summary = fonts.summary();
    expect(summary).toEqual({ references: 3, uniqueNames: 2, invalidReferences: 2, invalidNames: 1, embeddedParts: 2, truncated: false });
    const report = pptxFontPreflight(summary); expect(report[0]?.status).toBe('warning'); expect(report[0]?.message).toContain('기준 PDF');
    expect(JSON.stringify(report)).not.toContain('SyntheticFont'); expect(JSON.stringify(summary)).not.toContain('a\uFFFDfont');
  });
  it('does not declare good font names or embedded parts applied/supported', () => {
    const fonts = createPptxFontMetadata(1); fonts.inspect(xml(['Arial', '맑은 고딕']));
    const item = pptxFontPreflight(fonts.summary())[0]!;
    expect(item.status).toBe('unknown'); expect(item.message).toContain('실제 적용'); expect(item.message).toContain('미확인');
  });
  it('keeps absent metadata backward compatible and empty font scan unverified', () => {
    expect(pptxFontPreflight()).toEqual([]); expect(pptxFontPreflight(createPptxFontMetadata(0).summary())[0]?.status).toBe('unknown');
  });
  it('bounds distinct name retention but continues reference counting', () => {
    const fonts = createPptxFontMetadata(0); fonts.inspect(xml(Array.from({ length: 5001 }, (_, i) => `Synthetic-${i}`)));
    expect(fonts.summary()).toMatchObject({ references: 5001, uniqueNames: 5000, truncated: true }); expect(pptxFontPreflight(fonts.summary())[0]?.status).toBe('warning');
  });
  it('does not retain oversized font names and treats control characters as invalid', () => {
    const fonts = createPptxFontMetadata(0); fonts.inspect(xml(['x'.repeat(201), 'a\u0001font']));
    expect(fonts.summary()).toMatchObject({ references: 2, invalidReferences: 2, uniqueNames: 1, truncated: true });
  });
});
