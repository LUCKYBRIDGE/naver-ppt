import { describe, expect, it } from 'vitest';
import { fitText } from '../../src/overlays/textFit';
import { isOverlayList } from '../../src/overlays/validation';
import type { OverlayData } from '../../src/overlays/types';
const measure = (text: string, font: number) => ({ width: [...new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(text)].length * font, height: font });
const mask: OverlayData = { kind: 'mask', id: 'mask', visible: true, zIndex: 1, color: '#000000', rect: { x: .1, y: .1, width: .5, height: .4 } };
describe('FR-009/010/016 text fitting and bounded overlays', () => {
  it('finds the largest size satisfying both axes without expanding the box', () => {
    const fit = fitText('가나다라', 100, 60, 12, 96, 1.25, measure);
    expect(fit).toMatchObject({ fontPx: 25, fits: true, lines: ['가나다라'] });
    expect(fitText('가나다라', 100, 25, 12, 96, 1.25, measure).fontPx).toBe(20);
  });
  it('preserves paragraphs and grapheme clusters while wrapping', () => {
    expect(fitText('가\r\n나', 100, 60, 12, 96, 1.25, measure).fontPx).toBe(24);
    const result = fitText('👨‍👩‍👧‍👦가', 12, 30, 12, 12, 1, measure);
    expect(result.lines).toEqual(['👨‍👩‍👧‍👦', '가']); expect(result.fits).toBe(true);
  });
  it('reports minimum overflow and respects manual size', () => {
    expect(fitText('가', 11, 100, 12, 96, 1.25, measure)).toMatchObject({ fits: false, fontPx: 12 });
    expect(fitText('가', 100, 10, 12, 96, 1.25, measure).fits).toBe(false);
    expect(fitText('가', 100, 100, 12, 96, 1.25, measure, 32).fontPx).toBe(32);
    expect(fitText('', 100, 100, 12, 96, 1.25, measure).fits).toBe(true);
    expect(() => fitText('가', 100, 100, 12, Infinity, 1.25, measure)).toThrow(RangeError);
  });
  it('accepts normalized data but rejects hidden fields, duplicate ids and invalid colors', () => {
    expect(isOverlayList([mask])).toBe(true);
    expect(isOverlayList([mask, mask])).toBe(false);
    expect(isOverlayList([{ ...mask, sourceBytes: 'forbidden' }])).toBe(false);
    expect(isOverlayList([{ ...mask, rect: { ...mask.rect, x: .9 } }])).toBe(false);
    expect(isOverlayList([{ ...mask, color: '#12345' }])).toBe(false);
    expect(isOverlayList([{ ...mask, color: '#12345678' }])).toBe(true);
  });
  it('bounds stroke points and rejects nonfinite coordinates', () => {
    const stroke = { id: 'stroke', kind: 'stroke', zIndex: 2, visible: true, color: '#000', widthNormalized: .004, tool: 'pen', points: [{ x: .5, y: .5 }] };
    expect(isOverlayList([stroke])).toBe(true);
    expect(isOverlayList([{ ...stroke, points: [{ x: NaN, y: 0 }] }])).toBe(false);
    expect(isOverlayList([{ ...stroke, points: Array(10001).fill({ x: 0, y: 0 }) }])).toBe(false);
    expect(isOverlayList(Array.from({ length: 6 }, (_, i) => ({ ...stroke, id: `${i}`, points: Array(10000).fill({ x: 0, y: 0 }) })))).toBe(false);
  });
});
