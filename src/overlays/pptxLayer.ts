// A sizing surface for overlay coordinates/font measurement, never source pixels.
export function createPptxLayer(width: number, height: number, slideId: string) {
  if (![width, height].every(n => Number.isFinite(n) && n > 0) || !slideId) throw Error('PPTX_LAYER_TARGET');
  const rasterHeight = Math.round(1280 * height / width);
  if (!Number.isSafeInteger(rasterHeight) || rasterHeight < 1 || rasterHeight > 8192) throw Error('PPTX_LAYER_ASPECT');
  const source = document.createElement('canvas'); source.width = 1280; source.height = rasterHeight;
  source.dataset.slideId = slideId; source.dataset.pixelSampling = 'unavailable';
  const root = document.createElement('div'); root.dataset.pptxLayer = slideId;
  root.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
  const style = document.createElement('style');
  style.textContent = '.overlay-canvas,.overlay-interaction{position:absolute;inset:0;width:100%;height:100%}.overlay-canvas{pointer-events:none}.overlay-interaction{touch-action:none;cursor:crosshair}.overlay-selection{position:absolute;border:2px dashed #fff;outline:1px solid #172b25;pointer-events:none}.overlay-selection span{position:absolute;right:-5px;bottom:-5px;width:10px;height:10px;background:#fff;border:1px solid #172b25}';
  root.append(style);
  return { source, root, slideId };
}
