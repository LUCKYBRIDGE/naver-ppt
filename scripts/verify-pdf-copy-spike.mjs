import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

const [playwrightPath, executablePath] = process.argv.slice(2);
if (!playwrightPath || !executablePath) throw new Error('Supply Playwright module and Whale executable paths');
const { chromium } = await import(pathToFileURL(playwrightPath).href), output = resolve('node_modules/.cache/pdf-copy-spike');
await mkdir(output, { recursive: true });
const original = await PDFDocument.create(), font = await original.embedFont(StandardFonts.Helvetica);
for (const rotation of [0, 90, 180, 270]) {
  const page = original.addPage([800, 600]); page.setCropBox(20, 30, 500, 400); page.setRotation(degrees(rotation));
  page.drawRectangle({ x: 0, y: 0, width: 800, height: 600, color: rgb(1, 1, 1) });
  page.drawText(`Synthetic searchable ${rotation}`, { x: 220, y: 200, size: 16, font });
}
const source = await original.save(), fingerprint = createHash('sha256').update(source).digest('hex');
const document = { id: 'synthetic', source: { type: 'pdf', name: 'Synthetic.pdf', fingerprint, size: source.length, lastModified: 1 },
  slideIds: ['r0', 'r90', 'r180', 'r270'], knownSlideCount: 4, lastSlideId: 'r0', dirty: true, mediaBookmarks: {},
  slideDeltas: Object.fromEntries(['r0', 'r90', 'r180', 'r270'].map(id => [id, { presenterNote: 'Synthetic private note excluded', classLog: 'Synthetic private log excluded', overlays: [
    { kind: 'mask', id: `${id}-mask`, rect: { x: .1, y: .1, width: .2, height: .2 }, color: '#ff0000', visible: true, zIndex: 1 },
    { kind: 'textbox', id: `${id}-text`, rect: { x: .4, y: .1, width: .5, height: .2 }, text: '한글 수정본', backgroundColor: '#ffffff', color: '#000000',
      fontFamily: 'Malgun Gothic', fitMode: 'auto-max', minFontPx: 12, maxFontPx: 50, paddingPx: 5, lineHeight: 1.2, align: 'left', verticalAlign: 'middle', visible: true, zIndex: 2 },
    { kind: 'stroke', id: `${id}-stroke`, points: [{ x: .1, y: .8 }, { x: .9, y: .8 }], widthNormalized: .01, tool: 'pen', color: '#0000ff', visible: true, zIndex: 3 },
  ] }])) };
const profile = resolve(output, `profile-${Date.now()}`);
const context = await chromium.launchPersistentContext(profile, { executablePath, ignoreDefaultArgs: true, args: [
  `--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox'], viewport: { width: 1000, height: 850 } });
try {
  const page = await context.newPage(); await page.goto('http://127.0.0.1:5173/launcher/');
  const result = await page.evaluate(async ({ bytes, document, fingerprint }) => {
    const { createPdfCopyFromFile } = await import('/export/pdfCopyCanvas.ts');
    const { openPdf } = await import('/adapters/pdf/pdf.ts');
    const input = new Uint8Array(bytes), file = new File([input], 'Synthetic.pdf', { type: 'application/pdf' });
    const before = structuredClone(document), progress = [];
    const exported = await createPdfCopyFromFile(file, document, { onProgress: (done, total) => progress.push([done, total]) });
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))].map(v => v.toString(16).padStart(2, '0')).join('');
    if (hash !== fingerprint || JSON.stringify(document) !== JSON.stringify(before)) throw new Error('Source/deltas changed');
    const pdf = await openPdf(new Uint8Array(exported)), original = await openPdf(new Uint8Array(input)), proofs = [];
    document = null;
    const heading = window.document.createElement('h1'); heading.textContent = 'Synthetic PDF copy rotation proof'; window.document.body.replaceChildren(heading);
    try {
      for (let number = 1; number <= pdf.numPages; number++) {
        const outputPage = await pdf.getPage(number), originalPage = await original.getPage(number), viewport = outputPage.getViewport({ scale: 1 });
        const canvas = window.document.createElement('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        window.document.body.append(canvas); const ctx = canvas.getContext('2d');
        await outputPage.render({ canvas, canvasContext: ctx, viewport }).promise;
        const pixel = (x, y) => [...ctx.getImageData(Math.floor(viewport.width * x), Math.floor(viewport.height * y), 1, 1).data];
        const text = await outputPage.getTextContent(), sourceText = await originalPage.getTextContent();
        proofs.push({ page: number, rotation: outputPage.rotate, view: outputPage.view, sourceView: originalPage.view,
          text: text.items.filter(item => 'str' in item).map(item => item.str), sourceText: sourceText.items.filter(item => 'str' in item).map(item => item.str), mask: pixel(.15, .15), stroke: pixel(.5, .8) });
      }
    } finally { await pdf.loadingTask.destroy(); await original.loadingTask.destroy(); }
    return { bytes: [...exported], proofs, progress, userAgent: navigator.userAgent };
  }, { bytes: [...source], document, fingerprint });
  assert.equal(result.proofs.length, 4);
  for (const proof of result.proofs) {
    assert.deepEqual(proof.view, proof.sourceView); assert.deepEqual(proof.text, proof.sourceText);
    assert.deepEqual(proof.mask, [255, 0, 0, 255]); assert.deepEqual(proof.stroke, [0, 0, 255, 255]);
  }
  assert.deepEqual(result.progress, [[1, 4], [2, 4], [3, 4], [4, 4]]);
  const modified = new Uint8Array(result.bytes); assert(!new TextDecoder().decode(modified).includes('Synthetic private note'));
  await writeFile(resolve(output, 'synthetic-original.pdf'), source); await writeFile(resolve(output, 'synthetic-modified.pdf'), modified);
  await page.screenshot({ path: resolve(output, 'rotations.png'), fullPage: true });
  console.log(JSON.stringify({ result: 'PASS', userAgent: result.userAgent, sourceHash: fingerprint, outputHash: createHash('sha256').update(modified).digest('hex'),
    proofs: result.proofs, output, limitation: 'Actual Whale dev origin/Canvas/PDF.js independent re-render; Node writes synthetic PC fixtures. No product save UI, extension CSP, OS chooser/downloads or native external viewer acceptance.' }));
} finally { await context.close(); }
