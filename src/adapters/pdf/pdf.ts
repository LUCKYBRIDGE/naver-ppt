import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy, type RenderTask } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDF_MAX_PAGES, renderDimensions } from './input';
export { version as pdfRendererVersion } from 'pdfjs-dist';

GlobalWorkerOptions.workerSrc = workerUrl;
const resourceBase = import.meta.env.DEV ? new URL('/pdf-resources/', location.href).href : new URL(/* @vite-ignore */ '../pdf-resources/', import.meta.url).href;

export async function openPdf(bytes: Uint8Array, signal?: AbortSignal): Promise<PDFDocumentProxy> {
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const task = getDocument({ data: bytes, useSystemFonts: false, stopAtErrors: true,
    cMapUrl: `${resourceBase}cmaps/`, cMapPacked: true, standardFontDataUrl: `${resourceBase}standard_fonts/`,
    wasmUrl: `${resourceBase}wasm/`, iccUrl: `${resourceBase}iccs/`, maxImageSize: 32_000_000,
    canvasMaxAreaInBytes: 32_000_000, enableXfa: false, verbosity: 0 });
  let timedOut = false;
  const cancel = () => { void task.destroy(); };
  signal?.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => { timedOut = true; cancel(); }, 30_000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages < 1 || pdf.numPages > PDF_MAX_PAGES) throw new Error('PDF 페이지 수가 허용 범위를 초과합니다. 자료를 나누어 선택하세요.');
    return pdf;
  } catch (error) {
    await task.destroy();
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (timedOut) throw new Error('PDF 확인 시간이 초과되었습니다. 자료를 나누어 다시 선택하세요.');
    if (error instanceof Error && error.name === 'PasswordException') throw new Error('암호가 있는 PDF입니다. 원본에서 암호를 해제한 복사본을 선택하세요.');
    throw error instanceof Error && error.message.includes('허용 범위') ? error : new Error('PDF를 읽지 못했습니다. 손상 여부를 확인하고 원본에서 다시 저장하세요.');
  } finally { clearTimeout(timeout); signal?.removeEventListener('abort', cancel); }
}

export class PdfRenderer {
  private cache = new Map<string, HTMLCanvasElement>();
  private queue: Promise<unknown> = Promise.resolve();
  private task: RenderTask | undefined;
  private destroyed = false;
  constructor(readonly pdf: PDFDocumentProxy) {}
  render(pageNumber: number, width: number, height: number, signal: AbortSignal): Promise<HTMLCanvasElement> {
    const operation = this.queue.then(async () => {
      if (this.destroyed || signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > this.pdf.numPages) throw new Error('Invalid page');
      const page = await this.pdf.getPage(pageNumber);
      if (this.destroyed || signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const original = page.getViewport({ scale: 1 });
      const dimensions = renderDimensions(original.width, original.height, width, height, devicePixelRatio || 1);
      const key = `${pageNumber}:${dimensions.width}:${dimensions.height}`;
      const cached = this.cache.get(key);
      if (cached) { this.cache.delete(key); this.cache.set(key, cached); return cached; }
      const canvas = document.createElement('canvas'); canvas.width = dimensions.width; canvas.height = dimensions.height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable');
      this.task = page.render({ canvas, canvasContext: context, viewport: page.getViewport({ scale: dimensions.scale }) });
      const cancel = () => this.task?.cancel(); signal.addEventListener('abort', cancel, { once: true });
      try { await this.task.promise; }
      catch (error) { canvas.width = canvas.height = 0; throw error; }
      finally { signal.removeEventListener('abort', cancel); this.task = undefined; page.cleanup(); }
      if (this.destroyed || signal.aborted) { canvas.width = canvas.height = 0; throw new DOMException('Cancelled', 'AbortError'); }
      this.cache.set(key, canvas); this.trim(); return canvas;
    });
    this.queue = operation.catch(() => undefined); return operation;
  }
  async prefetch(page: number, width: number, height: number, signal: AbortSignal) {
    for (const neighbor of [page + 1, page - 1]) {
      if (signal.aborted || this.destroyed) return;
      if (neighbor >= 1 && neighbor <= this.pdf.numPages) await this.render(neighbor, width, height, signal).catch(() => undefined);
    }
  }
  get cacheBytes() { return [...this.cache.values()].reduce((sum, canvas) => sum + canvas.width * canvas.height * 4, 0); }
  private trim() {
    while (this.cache.size > 3 || this.cacheBytes > 64 * 1024 * 1024) {
      const [key, canvas] = this.cache.entries().next().value!; this.cache.delete(key); canvas.width = canvas.height = 0;
    }
  }
  async destroy() {
    this.destroyed = true; this.task?.cancel(); await this.queue;
    for (const canvas of this.cache.values()) canvas.width = canvas.height = 0;
    this.cache.clear(); await this.pdf.loadingTask.destroy();
  }
}
