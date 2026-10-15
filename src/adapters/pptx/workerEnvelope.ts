import { PPTX_LIMITS } from './packageGuard';

export function inspectPptxWorkerEnvelope(value: unknown) {
  const invalid = () => { throw new Error('PPTX_INVALID_PARSER_RESULT'); };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  const result = value as Record<string, unknown>, model = result.presentation as Record<string, unknown> | undefined;
  if (result.ok !== true || !Number.isSafeInteger(result.id) || (result.id as number) <= 0 || !model || typeof model !== 'object' || Array.isArray(model)) return invalid();
  for (const dimension of [model.width, model.height]) {
    if (typeof dimension !== 'number' || !Number.isFinite(dimension) || dimension <= 0 || dimension > 1000000) return invalid();
  }
  if (!Array.isArray(model.slides) || !model.slides.length || model.slides.length > 1000) return invalid();
  let topLevelElements = 0;
  for (const slide of model.slides) {
    if (!slide || typeof slide !== 'object' || Array.isArray(slide) || !Array.isArray(slide.elements)) return invalid();
    topLevelElements += slide.elements.length;
    if (topLevelElements > 100000) return invalid();
  }
  if (!Array.isArray(result.assets) || result.assets.length > PPTX_LIMITS.entries) return invalid();
  let assetBytes = 0;
  for (const asset of result.assets) {
    if (!asset || typeof asset !== 'object' || typeof asset.mime !== 'string' || !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(asset.mime) || asset.mime.length > 200 || !(asset.data instanceof ArrayBuffer) || !asset.data.byteLength) return invalid();
    const limit = ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'].includes(asset.mime) ? PPTX_LIMITS.mediaEntry : PPTX_LIMITS.entry;
    if (asset.data.byteLength > limit) return invalid();
    assetBytes += asset.data.byteLength;
    if (assetBytes > PPTX_LIMITS.expanded) return invalid();
  }
  return { slides: model.slides.length, topLevelElements, assets: result.assets.length, assetBytes };
}
