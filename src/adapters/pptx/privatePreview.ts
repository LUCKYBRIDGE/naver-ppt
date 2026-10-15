import { renderSlideToSvg } from '@web-ppt/core';
import type { PresentationDocumentState } from '../../core/types';
import { loadPptxSourceModel } from './sourceModel';
import { bindPptxSlideModel } from './modelBinding';
import { parseDisplaySvg } from './svgBoundary';

export async function loadPptxPrivatePreview(file: File, signal: AbortSignal, registered?: PresentationDocumentState) {
  const assets = await loadPptxSourceModel(file, signal), { parts, fingerprint } = assets;
  try {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    const document: PresentationDocumentState = registered ?? { id: crypto.randomUUID(), source: { type: 'pptx', fingerprint, name: file.name, size: file.size, lastModified: file.lastModified },
      lastSlideId: null, knownSlideCount: parts.length, slideIds: parts.map(() => crypto.randomUUID()), slideDeltas: {}, mediaBookmarks: {}, dirty: false };
    const binding = bindPptxSlideModel(document, fingerprint, parts, assets.model);
    let disposed = false;
    return { slideIds: document.slideIds, fingerprint,
      render(slideId: string) {
        if (disposed) throw Error('PPTX_PREVIEW_DISPOSED');
        const selected = binding.get(slideId);
        const svg = parseDisplaySvg(renderSlideToSvg(assets.model, selected.slide, { textMode: 'html', media: 'badge', includeNotes: false }), assets.ownedUrls);
        svg.setAttribute('width', String(assets.model.width)); svg.setAttribute('height', String(assets.model.height));
        return { svg, width: assets.model.width, height: assets.model.height };
      },
      dispose() { if (disposed) return; disposed = true; assets.dispose(); },
    };
  } catch (error) { assets.dispose(); throw error; }
}
