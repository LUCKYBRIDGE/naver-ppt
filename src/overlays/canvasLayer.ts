import type { OverlayData, TextBoxOverlay } from './types';
import { fitText } from './textFit';

export function textboxLayout(box: TextBoxOverlay, context: CanvasRenderingContext2D, aspect: number) {
  const width = box.referenceWidth ?? 1280, height = box.referenceHeight ?? width / aspect;
  const measure = (text: string, fontPx: number) => {
    context.font = `${fontPx}px ${JSON.stringify(box.fontFamily)}`;
    const metrics = context.measureText(text);
    return { width: metrics.width, height: (metrics.actualBoundingBoxAscent || fontPx * .8) + (metrics.actualBoundingBoxDescent || fontPx * .2) };
  };
  return fitText(box.text, box.rect.width * width - 2 * box.paddingPx, box.rect.height * height - 2 * box.paddingPx,
    box.minFontPx, box.maxFontPx, box.lineHeight, measure, box.fitMode === 'manual' ? box.fontPx ?? box.minFontPx : undefined);
}
export async function paintOverlays(canvas: HTMLCanvasElement, overlays: OverlayData[]) {
  const context = canvas.getContext('2d'); if (!context || !canvas.width || !canvas.height) throw new Error('Overlay surface unavailable');
  await document.fonts.ready;
  const fonts = new Set(overlays.filter(item => item.kind === 'textbox').map(item => item.fontFamily));
  for (const family of fonts) await document.fonts.load(`16px ${JSON.stringify(family)}`);
  const width = 1280, height = width * canvas.height / canvas.width, failures: string[] = [];
  context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
  for (const item of [...overlays].sort((a, b) => a.zIndex - b.zIndex)) {
    if (!item.visible) continue;
    context.save();
    if (item.kind === 'stroke') {
      context.strokeStyle = item.color; context.lineWidth = item.widthNormalized * width; context.lineCap = context.lineJoin = 'round';
      context.globalAlpha = item.tool === 'highlighter' ? .35 : 1; context.beginPath();
      item.points.forEach((point, index) => index ? context.lineTo(point.x * width, point.y * height) : context.moveTo(point.x * width, point.y * height));
      if (item.points.length === 1) { const p = item.points[0]!; context.lineTo(p.x * width + .01, p.y * height); } context.stroke();
    } else {
      const x = item.rect.x * width, y = item.rect.y * height, w = item.rect.width * width, h = item.rect.height * height;
      context.fillStyle = item.kind === 'mask' ? item.color : item.backgroundColor; context.fillRect(x, y, w, h);
      if (item.kind === 'textbox') {
        context.beginPath(); context.rect(x, y, w, h); context.clip();
        const layout = textboxLayout(item, context, width / height); if (!layout.fits) failures.push(item.id);
        const scale = width / (item.referenceWidth ?? width), fontPx = layout.fontPx * scale, padding = item.paddingPx * scale;
        context.font = `${fontPx}px ${JSON.stringify(item.fontFamily)}`; context.fillStyle = item.color;
        context.textBaseline = 'top'; context.textAlign = item.align;
        const textHeight = layout.lines.length * layout.linePx * scale;
        const top = y + (item.verticalAlign === 'middle' ? (h - textHeight) / 2 : item.verticalAlign === 'bottom' ? h - textHeight - padding : padding);
        const left = x + (item.align === 'center' ? w / 2 : item.align === 'right' ? w - padding : padding);
        layout.lines.forEach((line, index) => context.fillText(line, left, top + index * layout.linePx * scale));
      }
    }
    context.restore();
  }
  return failures;
}

export function colorCandidates(canvas: HTMLCanvasElement, x: number, y: number) {
  if (canvas.dataset?.pixelSampling === 'unavailable') return [];
  const context = canvas.getContext('2d'); if (!context) return ['#000000'];
  const pixel = (px: number, py: number) => {
    const data = context.getImageData(Math.max(0, Math.min(canvas.width - 1, px)), Math.max(0, Math.min(canvas.height - 1, py)), 1, 1).data;
    return '#' + [...data.slice(0, 3)].map(v => v.toString(16).padStart(2, '0')).join('');
  };
  const px = Math.floor(x * canvas.width), py = Math.floor(y * canvas.height), counts = new Map<string, number>();
  for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6], [-6, -6], [6, 6], [-6, 6], [6, -6]]) {
    const color = pixel(px + dx!, py + dy!); counts.set(color, (counts.get(color) ?? 0) + 1);
  }
  const nearby = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? pixel(px, py);
  return [...new Set([pixel(px, py), nearby])];
}
