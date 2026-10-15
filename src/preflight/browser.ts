import { sourceVault, sourceKey } from '../storage/sourceVault';
import { mediaVault, mediaKey } from '../media/source';
import { probeMedia } from '../media/input';
import { readPdfInput } from '../adapters/pdf/input';
import type { PreflightInspector } from './check';
import { InspectionCache, inspectionKey } from './cache';
const cache = new InspectionCache();
export function browserInspector(sessionId: string, onProgress?: (completed: number, total: number) => void, force = false): PreflightInspector {
  return {
    async pdf(document, pages, signal) {
      if (document.source.type !== 'pdf') throw new Error('UNSUPPORTED_SOURCE');
      const source = await sourceVault().get(sourceKey(sessionId, document.id), document.source.fingerprint), input = await readPdfInput(source.file);
      if (input.fingerprint !== document.source.fingerprint || signal.aborted) throw new Error('SOURCE_CHANGED');
      const { openPdf, pdfRendererVersion, PdfRenderer } = await import('../adapters/pdf/pdf');
      const ratio = typeof devicePixelRatio === 'number' ? Math.min(devicePixelRatio || 1, 2) : 1;
      const key = inspectionKey(input.fingerprint, document.knownSlideCount!, pages, `${pdfRendererVersion}|${navigator.userAgent}|${navigator.platform}|1024x768|DPR${ratio}`);
      const previous = force ? undefined : cache.get(key, Date.now());
      if (previous) { onProgress?.(pages.length, pages.length); return { ...previous, cached: true }; }
      const pdf = await openPdf(input.bytes, signal);
      const renderer = new PdfRenderer(pdf);
      const cancel = () => { void pdf.loadingTask.destroy(); }; signal.addEventListener('abort', cancel, { once: true });
      const timeout = setTimeout(cancel, pages.length > 3 ? 120000 : 30000);
      try {
        let externalLinks = 0; const annotationKinds = new Set<string>();
        const scripts = ((await pdf.getJSActions())?.size ?? 0) > 0;
        let completed = 0;
        for (const number of pages) {
          if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          const page = await pdf.getPage(number);
          try { await page.getOperatorList(); for (const annotation of await page.getAnnotations()) { if (typeof annotation.subtype === 'string') annotationKinds.add(annotation.subtype); if (annotation.url || annotation.unsafeUrl) externalLinks++; } }
          finally { page.cleanup(); }
          const canvas = await renderer.render(number, 1024, 768, signal);
          if (!canvas.width || !canvas.height) throw new Error('PDF_RENDER_FAILED');
          completed++; onProgress?.(completed, pages.length);
        }
        const result = { pageCount: pdf.numPages, inspectedPages: pages, externalLinks, scripts, annotationKinds: [...annotationKinds], renderedPages: completed };
        if (!signal.aborted && pdf.numPages === document.knownSlideCount) cache.set(key, result, Date.now());
        return result;
      } finally { clearTimeout(timeout); signal.removeEventListener('abort', cancel); await renderer.destroy(); }
    },
    async media(document, mediaId, signal) {
      const ref = document.localMedia?.[mediaId]; if (!ref || signal.aborted) throw new Error('INVALID_MEDIA');
      const source = await mediaVault().get(mediaKey(sessionId, document.id, mediaId), ref.fingerprint), checked = await probeMedia(source.file);
      if (checked.fingerprint !== ref.fingerprint || signal.aborted) throw new Error('MEDIA_CHANGED'); return checked;
    },
  };
}
