import type { PresentationDocumentState } from '../core/types';
import { readPdfInput, renderDimensions } from '../adapters/pdf/input';
import { paintOverlays } from '../overlays/canvasLayer';
import { createPdfCopy, type PdfMatrix } from './pdfCopy';

export async function createPdfCopyFromFile(file: File, sourceDocument: PresentationDocumentState,
  options: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {}) {
  const captured = structuredClone(sourceDocument), input = await readPdfInput(file);
  if (captured.source.type !== 'pdf' || input.fingerprint !== captured.source.fingerprint) throw new Error('원본 내용이 바뀌었습니다. 같은 PDF를 다시 연결하세요.');
  const { openPdf } = await import('../adapters/pdf/pdf'), pdf = await openPdf(new Uint8Array(input.bytes), options.signal);
  try {
    return await createPdfCopy(input.bytes, captured, async (pageNumber, overlays) => {
      const page = await pdf.getPage(pageNumber), viewport = page.getViewport({ scale: 1 });
      const dimensions = renderDimensions(viewport.width, viewport.height, 2560, 2560 * viewport.height / viewport.width, 1);
      const canvas = document.createElement('canvas'); canvas.width = dimensions.width; canvas.height = dimensions.height;
      try {
        const failures = await paintOverlays(canvas, overlays);
        if (failures.length) throw new Error(`${pageNumber}페이지의 글씨가 상자에 맞지 않습니다. 편집창에서 확인하세요.`);
        if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('PDF 레이어를 생성하지 못했습니다.')), 'image/png'));
        return { png: new Uint8Array(await blob.arrayBuffer()), width: viewport.width, height: viewport.height, transform: viewport.transform as PdfMatrix };
      } finally { canvas.width = canvas.height = 0; page.cleanup(); }
    }, options);
  } finally { await pdf.loadingTask.destroy(); }
}
