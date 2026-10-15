import { PDFDocument, concatTransformationMatrix, pushGraphicsState, popGraphicsState } from 'pdf-lib';
import type { PresentationDocumentState } from '../core/types';
import type { OverlayData } from '../overlays/types';
import { isOverlayList } from '../overlays/validation';
import { PDF_MAX_BYTES, PDF_MAX_PAGES } from '../adapters/pdf/input';

export type PdfMatrix = [number, number, number, number, number, number];
export interface PdfOverlayImage { png: Uint8Array; width: number; height: number; transform: PdfMatrix }
export type PdfOverlayRenderer = (pageNumber: number, overlays: OverlayData[]) => Promise<PdfOverlayImage>;
export const PDF_COPY_MAX_BYTES = 256 * 1024 * 1024;

// PDF.js maps PDF coordinates to top-left viewport coordinates. Images use bottom-left coordinates.
export function overlayImageMatrix(transform: PdfMatrix, height: number): PdfMatrix {
  if (transform.length !== 6 || !transform.every(Number.isFinite) || !Number.isFinite(height) || height <= 0) throw new Error('PDF 좌표를 확인하지 못했습니다.');
  const [a, b, c, d, e, f] = transform, determinant = a * d - b * c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) throw new Error('PDF 좌표를 확인하지 못했습니다.');
  return [d / determinant, -b / determinant, c / determinant, -a / determinant,
    (-c * height + c * f - d * e) / determinant, (a * height + b * e - a * f) / determinant];
}
function checkCancelled(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); }
function checkPng(png: Uint8Array) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (png.length < 24 || png.length > 32 * 1024 * 1024 || !signature.every((byte, index) => png[index] === byte)
    || String.fromCharCode(...png.slice(12, 16)) !== 'IHDR') throw new Error('PDF 레이어 이미지를 확인하지 못했습니다.');
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength), width = view.getUint32(16), height = view.getUint32(20);
  if (!width || !height || width * height > 8_000_000) throw new Error('PDF 레이어 이미지 한도를 초과했습니다.');
}
export async function createPdfCopy(input: Uint8Array, document: PresentationDocumentState, render: PdfOverlayRenderer,
  options: { signal?: AbortSignal; onProgress?: (done: number, total: number) => void } = {}): Promise<Uint8Array> {
  checkCancelled(options.signal);
  const captured = structuredClone(document), bytes = new Uint8Array(input);
  if (captured.source.type !== 'pdf' || !captured.source.fingerprint || !/^[a-f0-9]{64}$/.test(captured.source.fingerprint)
    || !bytes.length || bytes.length > PDF_MAX_BYTES || !captured.slideIds.length || captured.slideIds.length > PDF_MAX_PAGES
    || captured.knownSlideCount !== captured.slideIds.length || new Set(captured.slideIds).size !== captured.slideIds.length
    || Object.keys(captured.slideDeltas).some(id => !captured.slideIds.includes(id))
    || !Object.values(captured.slideDeltas).every(delta => isOverlayList(delta.overlays))) throw new Error('PDF 자료와 확정 편집정보를 확인하지 못했습니다.');
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  if (hash !== captured.source.fingerprint) throw new Error('원본 내용이 바뀌었습니다. 같은 PDF를 다시 연결하세요.');
  checkCancelled(options.signal);
  // Never ignore encryption or flatten the original pages into screenshots.
  const pdf = await PDFDocument.load(bytes, { updateMetadata: false, throwOnInvalidObject: true });
  if (pdf.getPageCount() !== captured.slideIds.length) throw new Error('원본 PDF 페이지 수가 등록된 자료와 다릅니다.');
  let imageBytes = 0;
  for (const [index, id] of captured.slideIds.entries()) {
    checkCancelled(options.signal);
    const overlays = captured.slideDeltas[id]?.overlays.filter(item => item.visible) ?? [];
    if (overlays.length) {
      const image = await render(index + 1, overlays);
      checkCancelled(options.signal); checkPng(image.png);
      if (![image.width, image.height].every(value => Number.isFinite(value) && value > 0 && value <= 100_000)) throw new Error('PDF 페이지 크기를 확인하지 못했습니다.');
      imageBytes += image.png.length;
      if (imageBytes > PDF_MAX_BYTES) throw new Error('PDF 레이어 전체 용량 한도를 초과했습니다. 자료를 나누세요.');
      const matrix = overlayImageMatrix(image.transform, image.height), embedded = await pdf.embedPng(image.png), page = pdf.getPage(index);
      page.pushOperators(pushGraphicsState(), concatTransformationMatrix(...matrix));
      page.drawImage(embedded, { x: 0, y: 0, width: image.width, height: image.height });
      page.pushOperators(popGraphicsState());
    }
    options.onProgress?.(index + 1, captured.slideIds.length);
  }
  checkCancelled(options.signal);
  const output = await pdf.save({ updateFieldAppearances: false });
  checkCancelled(options.signal);
  if (output.length > PDF_COPY_MAX_BYTES) throw new Error('PDF 수정본이 256MB를 초과했습니다. 자료를 나누세요.');
  return output;
}
