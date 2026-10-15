import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { patchPptxBackground, selectPptxBackgroundStyle } from '../../scripts/pptx-background-patch';
const theme = { fillStyles: [{ type: 'solid', color: 'ordinary-first' }, { type: 'solid', color: 'ordinary-second' }], bgFillStyles: [{ type: 'solid', color: 'background-first' }, { type: 'solid', color: 'background-second' }, { type: 'gradient', color: 'background-third' }] };
describe('OOXML background style matrix references', () => {
  it.each([0, 1000])('treats %s as no background', index => { expect(selectPptxBackgroundStyle(theme, index)).toBeNull(); });
  it.each([[1, 'ordinary-first'], [2, 'ordinary-second'], [1001, 'background-first'], [1002, 'background-second'], [1003, 'background-third']] as const)('selects the exact style at %s without clamping', (index, color) => { expect(selectPptxBackgroundStyle(theme, index)?.color).toBe(color); });
  it.each([-1, 0.5, NaN, Infinity, 3, 999, 1004, 2 ** 53])('rejects invalid or absent style at %s', index => { expect(() => selectPptxBackgroundStyle(theme, index)).toThrow('PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED'); });
  it('transforms only the exact pinned parser source and preserves the original source', () => {
    const path = 'node_modules/@web-ppt/core/dist/parser-CJhMJQf-.js', code = readFileSync(path, 'utf8');
    const patched = patchPptxBackground(code, '/' + path)!;
    expect(patched).toContain('__pptxBackgroundStyle(C, Ct)'); expect(patched).toContain('Ct === 0 || Ct === 1000 ? { type: "none" }');
    expect(patched).toContain('F.message === "PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED") throw F;');
    expect(patched).not.toContain('C.bgFillStyles[Math.min'); expect(readFileSync(path, 'utf8')).toBe(code);
    expect(() => patchPptxBackground(code + '\n', '/' + path)).toThrow('SOURCE_CHANGED');
    expect(() => patchPptxBackground(code, '/' + path.replace('CJhMJQf-', 'updated'))).toThrow('SOURCE_CHANGED');
    expect(patchPptxBackground(code, '/other/parser-CJhMJQf-.js')).toBeNull();
  });
});
