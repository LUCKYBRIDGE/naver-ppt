import type { PresentationDocumentState } from '../../core/types';
import { PPTX_MAX_SLIDES } from './slideOrder';

// The guarded, pinned parser must preserve manifest order; count alone cannot prove it.
export function bindPptxSlideModel<S>(document: PresentationDocumentState, fingerprint: string, parts: readonly string[], model: { source: string; slides: readonly S[] }) {
  const fail = (): never => { throw new Error('PPTX_MODEL_BINDING_MISMATCH'); };
  const count = parts.length;
  if (document.closed || document.source.type !== 'pptx' || !/^[a-f0-9]{64}$/.test(fingerprint) || document.source.fingerprint !== fingerprint
    || model.source !== 'pptx' || !count || count > PPTX_MAX_SLIDES || count !== document.knownSlideCount || count !== document.slideIds.length || count !== model.slides.length
    || new Set(parts).size !== count || parts.some(part => !/^ppt\/slides\/[^/]+\.xml$/.test(part) || /[\\\x00-\x1f:%?#]/.test(part))
    || new Set(document.slideIds).size !== count || document.slideIds.some(id => typeof id !== 'string' || !id || id.length > 200)) return fail();
  const entries = new Map(document.slideIds.map((id, index) => {
    const slide = model.slides[index];
    if (!slide || typeof slide !== 'object' || Array.isArray(slide)) return fail();
    return [id, Object.freeze({ slideId: id, sourcePart: parts[index]!, index, slide })] as const;
  }));
  return { count, get(slideId: string | null) { const result = slideId === null ? undefined : entries.get(slideId); return result ?? fail(); } };
}
