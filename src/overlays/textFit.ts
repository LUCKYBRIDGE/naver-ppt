export interface TextMeasure { width: number; height: number }
export interface TextLayout { fontPx: number; lines: string[]; linePx: number; fits: boolean }
export function fitText(text: string, width: number, height: number, min: number, max: number, lineHeight: number,
  measure: (text: string, fontPx: number) => TextMeasure, manual?: number): TextLayout {
  if (![width, height, min, max, lineHeight, ...(manual === undefined ? [] : [manual])].every(Number.isFinite)
    || min <= 0 || max < min || lineHeight <= 0) throw new RangeError('Invalid text layout bounds');
  const graphemes = new Intl.Segmenter('ko', { granularity: 'grapheme' });
  function layout(fontPx: number): TextLayout {
    const lines: string[] = [];
    const overflow = () => ({ fontPx, lines, linePx: fontPx * lineHeight, fits: false });
    if (width <= 0 || height <= 0) { lines.push(text); return overflow(); }
    for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
      let line = '';
      for (const { segment } of graphemes.segment(paragraph)) {
        if (line && measure(line + segment, fontPx).width > width) {
          lines.push(line); line = '';
          // Further lines cannot recover a vertical overflow; avoid measuring invisible tails.
          if ((lines.length + 1) * fontPx * lineHeight > height) return overflow();
        }
        line += segment;
      }
      lines.push(line);
      if (lines.length * fontPx * lineHeight > height) return overflow();
    }
    const linePx = Math.max(fontPx * lineHeight, ...lines.map(line => measure(line || '한Ag', fontPx).height));
    return { fontPx, lines, linePx, fits: width > 0 && height > 0 && lines.length * linePx <= height
      && lines.every(line => measure(line, fontPx).width <= width) };
  }
  if (manual !== undefined) return layout(Math.max(min, Math.min(max, manual)));
  const smallest = layout(min); if (!smallest.fits) return smallest;
  let lo = Math.ceil(min), hi = Math.floor(max), best = smallest;
  while (lo <= hi) { const middle = Math.floor((lo + hi) / 2), candidate = layout(middle);
    if (candidate.fits) { best = candidate; lo = middle + 1; } else hi = middle - 1;
  }
  return best;
}
