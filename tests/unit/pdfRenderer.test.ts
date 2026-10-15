import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PDFDocumentProxy } from 'pdfjs-dist';

const pdfjs = vi.hoisted(() => ({ getDocument: vi.fn(), GlobalWorkerOptions: { workerSrc: '' } }));
vi.mock('pdfjs-dist', () => pdfjs);
beforeEach(() => {
  vi.stubGlobal('location', { href: 'http://127.0.0.1:5173/editor/' }); vi.stubGlobal('devicePixelRatio', 1);
  vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => ({}) }) });
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

function documentMock() {
  const cleanup = vi.fn(), render = vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() }));
  const page = { getViewport: ({ scale }: { scale: number }) => ({ width: 1280 * scale, height: 720 * scale }), render, cleanup };
  const destroy = vi.fn().mockResolvedValue(undefined);
  const pdf = { numPages: 8, getPage: vi.fn().mockResolvedValue(page), loadingTask: { destroy } };
  return { pdf: pdf as unknown as PDFDocumentProxy, cleanup, render, destroy };
}
describe('PDF renderer resource lifetime and bounds', () => {
  it('keeps a maximum of three canvases and reuses a cached render', async () => {
    const { PdfRenderer } = await import('../../src/adapters/pdf/pdf'); const mock = documentMock(), renderer = new PdfRenderer(mock.pdf);
    const signal = new AbortController().signal;
    const first = await renderer.render(1, 1920, 1080, signal);
    expect(await renderer.render(1, 1920, 1080, signal)).toBe(first); expect(mock.render).toHaveBeenCalledTimes(1);
    for (let page = 2; page <= 5; page++) await renderer.render(page, 1920, 1080, signal);
    expect(first.width).toBe(0); expect(renderer.cacheBytes).toBe(3 * 1920 * 1080 * 4);
    expect(mock.cleanup).toHaveBeenCalledTimes(5);
    await renderer.destroy(); expect(renderer.cacheBytes).toBe(0); expect(mock.destroy).toHaveBeenCalledTimes(1);
  });
  it('enforces the byte ceiling and only prefetches in-range neighbors', async () => {
    const { PdfRenderer } = await import('../../src/adapters/pdf/pdf'); const mock = documentMock(), renderer = new PdfRenderer(mock.pdf);
    const signal = new AbortController().signal;
    for (let page = 1; page <= 4; page++) await renderer.render(page, 10000, 10000, signal);
    expect(renderer.cacheBytes).toBeLessThanOrEqual(64 * 1024 * 1024);
    await renderer.prefetch(1, 380, 260, signal);
    expect(mock.pdf.getPage).toHaveBeenCalledWith(2); expect(mock.pdf.getPage).not.toHaveBeenCalledWith(0);
    await renderer.destroy();
  });
  it('rejects cancelled and invalid jobs and cannot render after destruction', async () => {
    const { PdfRenderer } = await import('../../src/adapters/pdf/pdf'); const mock = documentMock(), renderer = new PdfRenderer(mock.pdf);
    const controller = new AbortController(); controller.abort();
    await expect(renderer.render(1, 100, 100, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(renderer.render(9, 100, 100, new AbortController().signal)).rejects.toThrow('Invalid page');
    await renderer.destroy();
    await expect(renderer.render(1, 100, 100, new AbortController().signal)).rejects.toMatchObject({ name: 'AbortError' });
    expect(mock.render).not.toHaveBeenCalled();
  });
  it('cancels an in-flight render, releases resources and permits a subsequent job', async () => {
    const { PdfRenderer } = await import('../../src/adapters/pdf/pdf'); const mock = documentMock(), renderer = new PdfRenderer(mock.pdf);
    let reject: (error: Error) => void = () => {};
    const pending = new Promise<void>((_, fail) => { reject = fail; });
    const cancel = vi.fn(() => reject(new DOMException('Cancelled', 'AbortError')));
    mock.render.mockReturnValueOnce({ promise: pending, cancel });
    const controller = new AbortController(); const operation = renderer.render(1, 100, 100, controller.signal);
    const result = expect(operation).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(mock.render).toHaveBeenCalled()); controller.abort(); await result;
    expect(cancel).toHaveBeenCalledOnce(); expect(renderer.cacheBytes).toBe(0);
    await renderer.render(2, 100, 100, new AbortController().signal);
    expect(mock.cleanup).toHaveBeenCalledTimes(2); await renderer.destroy();
  });
  it('destroys a failed loading task and bounds page counts', async () => {
    const { openPdf } = await import('../../src/adapters/pdf/pdf'); const destroy = vi.fn().mockResolvedValue(undefined);
    pdfjs.getDocument.mockReturnValue({ promise: Promise.resolve({ numPages: 2001 }), destroy });
    await expect(openPdf(new Uint8Array([1]))).rejects.toThrow('허용 범위'); expect(destroy).toHaveBeenCalledOnce();
    expect(pdfjs.getDocument.mock.calls[0]![0]).toMatchObject({ enableXfa: false, useSystemFonts: false,
      cMapUrl: 'http://127.0.0.1:5173/pdf-resources/cmaps/', standardFontDataUrl: 'http://127.0.0.1:5173/pdf-resources/standard_fonts/' });
    const aborted = new AbortController(); aborted.abort();
    await expect(openPdf(new Uint8Array(), aborted.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
