import { describe, expect, it, vi } from 'vitest';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { createPdfCopy, overlayImageMatrix, type PdfMatrix, type PdfOverlayRenderer } from '../../src/export/pdfCopy';
import { fixtureSession } from '../fixtures/session';

async function fixture() {
  const pdf = await PDFDocument.create(), font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage([640, 480]).drawText('Synthetic searchable original', { font, x: 30, y: 60 });
  const second = pdf.addPage([800, 600]); second.setCropBox(20, 30, 500, 400); second.setRotation(degrees(90));
  const bytes = await pdf.save(), original = fixtureSession().documents.A!;
  if (!('name' in original.source)) throw new Error('Expected PDF source');
  const document = { ...original, source: original.source };
  document.source.fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  return { bytes, document };
}
const png = new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'));
const layer = () => Promise.resolve({ png, width: 400, height: 500, transform: [0, 1, 1, 0, -30, -20] as PdfMatrix });
describe('PDF copy', () => {
  it('preserves original bytes/pages/crop/rotation, adds public overlay only, does not change deltas', async () => {
    const { bytes, document } = await fixture(), before = new Uint8Array(bytes), captured = structuredClone(document), render = vi.fn<PdfOverlayRenderer>(layer);
    const output = await createPdfCopy(bytes, document, render), decoded = await PDFDocument.load(output);
    expect(bytes).toEqual(before); expect(document).toEqual(captured); expect(decoded.getPageCount()).toBe(2);
    expect(decoded.getPage(1).getCropBox()).toEqual({ x: 20, y: 30, width: 500, height: 400 }); expect(decoded.getPage(1).getRotation().angle).toBe(90);
    expect(render).toHaveBeenCalledWith(2, captured.slideDeltas['A-2']!.overlays);
    expect(render.mock.calls[0]![1]).not.toHaveProperty('presenterNote');
    expect(new TextDecoder().decode(output)).not.toContain('Synthetic teacher note');
  });
  it('skips hidden layers and captures original input before asynchronous rendering', async () => {
    const { bytes, document } = await fixture(), render = vi.fn(layer);
    document.slideDeltas['A-2']!.overlays[0]!.visible = false;
    await createPdfCopy(bytes, document, render); expect(render).not.toHaveBeenCalled();
    document.slideDeltas['A-2']!.overlays[0]!.visible = true;
    const pending = createPdfCopy(bytes, document, render); document.slideDeltas['A-2']!.overlays = [];
    await pending; expect(render).toHaveBeenCalledTimes(1);
  });
  it('rejects source mismatch, missing fingerprint, page mismatch and invalid overlays before generating', async () => {
    const { bytes, document } = await fixture(), render = vi.fn(layer), bad = structuredClone(document);
    bad.source.fingerprint = 'b'.repeat(64); await expect(createPdfCopy(bytes, bad, render)).rejects.toThrow('원본 내용');
    delete bad.source.fingerprint; await expect(createPdfCopy(bytes, bad, render)).rejects.toThrow('확인하지');
    bad.source.fingerprint = document.source.fingerprint!; bad.slideIds.push('A-3'); bad.knownSlideCount = 3;
    await expect(createPdfCopy(bytes, bad, render)).rejects.toThrow('페이지 수');
    document.slideDeltas['A-2']!.overlays[0]!.zIndex = NaN;
    await expect(createPdfCopy(bytes, document, render)).rejects.toThrow('확인하지'); expect(render).not.toHaveBeenCalled();
  });
  it('keeps source and deltas after render failure or cancellation', async () => {
    const { bytes, document } = await fixture(), captured = structuredClone(document), abort = new AbortController();
    await expect(createPdfCopy(bytes, document, async () => { throw new Error('font overflow'); })).rejects.toThrow('font overflow');
    await expect(createPdfCopy(bytes, document, async () => { abort.abort(); return layer(); }, { signal: abort.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(document).toEqual(captured);
  });
  it('rejects invalid image and oversized decompression dimensions', async () => {
    const { bytes, document } = await fixture();
    await expect(createPdfCopy(bytes, document, async () => ({ ...await layer(), png: new Uint8Array(25) }))).rejects.toThrow('이미지');
    const huge = new Uint8Array(png); new DataView(huge.buffer).setUint32(16, 100_000);
    new DataView(huge.buffer).setUint32(20, 100_000);
    await expect(createPdfCopy(bytes, document, async () => ({ ...await layer(), png: huge }))).rejects.toThrow('한도');
  });
  it.each<PdfMatrix>([[1, 0, 0, -1, -20, 430], [0, 1, 1, 0, -30, -20], [-1, 0, 0, 1, 520, -30], [0, -1, -1, 0, 430, 520], [2, 0, 0, -2, -40, 860]])('inverts viewport crop/rotation/UserUnit %j', (...matrix) => {
    const transform = matrix as PdfMatrix, height = 400, image = overlayImageMatrix(transform, height);
    for (const [x, y] of [[0, 0], [100, 50], [200, 400]]) {
      const px = image[0] * x! + image[2] * y! + image[4], py = image[1] * x! + image[3] * y! + image[5];
      expect(transform[0] * px + transform[2] * py + transform[4]).toBeCloseTo(x!);
      expect(transform[1] * px + transform[3] * py + transform[5]).toBeCloseTo(height - y!);
    }
  });
  it('refuses singular and nonfinite transforms', () => {
    expect(() => overlayImageMatrix([0, 0, 0, 0, 1, 1], 100)).toThrow();
    expect(() => overlayImageMatrix([1, 0, 0, -1, NaN, 100], 100)).toThrow();
  });
});
