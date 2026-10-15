import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const [playwrightPath, executablePath, pptxPath, pdfPath, selectedPagesArg] = process.argv.slice(2);
if (!pdfPath) throw Error('Pass Playwright, Whale, read-only PPTX and paired reference PDF.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const { PNG } = (await import(pathToFileURL(resolve(dirname(playwrightPath), '../pngjs/lib/png.js')).href)).default;
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const fingerprints = { pptx: await hash(pptxPath), pdf: await hash(pdfPath) };
const output = resolve('node_modules/.cache/whale-pptx-visual', String(Date.now())), extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
const width = 720, height = 540;
function normalize(png) {
  if (png.width === width && png.height === height) return png;
  const target = new PNG({ width, height });
  target.data.fill(255);
  const scale = Math.min(width / png.width, height / png.height), fittedWidth = Math.max(1, Math.round(png.width * scale)), fittedHeight = Math.max(1, Math.round(png.height * scale));
  const offsetX = Math.floor((width - fittedWidth) / 2), offsetY = Math.floor((height - fittedHeight) / 2);
  for (let y = 0; y < fittedHeight; y++) for (let x = 0; x < fittedWidth; x++) {
    const targetX = offsetX + x, targetY = offsetY + y, a = (targetY * width + targetX) * 4, b = (Math.min(png.height - 1, Math.floor(y / scale)) * png.width + Math.min(png.width - 1, Math.floor(x / scale))) * 4;
    for (let c = 0; c < 4; c++) target.data[a + c] = png.data[b + c];
  }
  return target;
}
function compare(a, b) {
  let sum = 0, squares = 0, changed = 0; const difference = new PNG({ width, height });
  for (let i = 0; i < a.data.length; i += 4) {
    let max = 0;
    for (let c = 0; c < 3; c++) { const delta = Math.abs(a.data[i + c] - b.data[i + c]); sum += delta; squares += delta * delta; max = Math.max(max, delta); }
    if (max > 24) changed++;
    difference.data[i] = max; difference.data[i + 1] = 0; difference.data[i + 2] = 0; difference.data[i + 3] = 255;
  }
  const channels = width * height * 3;
  return { mae: sum / channels, rmse: Math.sqrt(squares / channels), changedPixelFraction24: changed / (width * height), difference };
}
let context; const errors = [], report = { fingerprints, size: { width, height }, productRenderer: true, referenceOriginUnverified: true, rows: [], externalRequests: 0 };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(30000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, id, viewport) => { const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.setViewportSize(viewport); await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p; };
  const send = (p, value) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), value);
  const launcher = await page('launcher', null, { width: 960, height: 800 }), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Read-only full-deck visual verification' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id, { width: 960, height: 1100 }), remote = await page('remote', id, { width: 960, height: 800 }), player = await page('player', id, { width, height });
  const session = async () => (await send(editor, { type: 'GET_SESSION', sessionId: id })).session;
  const command = async (type, documentId, slideId = null) => {
    const commandId = crypto.randomUUID();
    for (let retry = 0; retry < 4; retry++) { const result = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, revision: (await session()).revision, commandId } }); if (result.ok) return; assert.equal(result.code, 'STALE_REVISION'); }
    assert.fail('Repeated stale revision');
  };
  await editor.locator('#pdf-import').setInputFiles(pdfPath); await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const pdf = Object.values((await session()).documents).find(d => d.source.type === 'pdf'); assert(pdf);
  await command('ACTIVATE_DOCUMENT', pdf.id);
  const waitPdf = slide => player.waitForFunction(id => { const c = document.querySelector('canvas[aria-label="발표 자료"]'); return c?.width > 1 && c.dataset.slideId === id; }, slide);
  await waitPdf(pdf.slideIds[0]); const before = (await session()).presentedSelection;
  await editor.locator('#experimental-pptx-import').check(); await editor.locator('#pdf-import').setInputFiles(pptxPath);
  await editor.waitForFunction(() => !document.getElementById('pdf-import').disabled);
  const pptx = Object.values((await session()).documents).find(d => d.source.type === 'pptx'); assert(pptx);
  report.referencePageCount = pdf.slideIds.length; report.pptxPageCount = pptx.slideIds.length;
  report.pageCountMismatch = pptx.slideIds.length !== pdf.slideIds.length;
  report.registrationFontMetadataShown = await editor.getByText(/글꼴 이름 \d+종·참조/).count() > 0;
  report.registrationLocalFontWarningShown = await editor.getByText(/슬라이드에 명시된 글꼴 이름.*글꼴이 대체되어/).count() > 0;
  assert.deepEqual((await session()).presentedSelection, before);
  await editor.addStyleTag({ content: '[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage{width:720px!important;height:540px!important;min-height:540px!important;max-width:none!important;aspect-ratio:auto!important}' });
  await editor.locator('#editor-document').selectOption(pptx.id);
  const selectedPages = selectedPagesArg ? selectedPagesArg.split(',').map(Number) : pptx.slideIds.map((_, i) => i + 1);
  assert(selectedPages.length && new Set(selectedPages).size === selectedPages.length && selectedPages.every(n => Number.isSafeInteger(n) && n >= 1 && n <= pptx.slideIds.length));
  report.totalPages = pptx.slideIds.length; report.selectedPages = selectedPages;
  const cdp = selectedPagesArg ? await context.newCDPSession(editor) : null;
  if (cdp) { await cdp.send('DOM.enable'); await cdp.send('CSS.enable'); }
  for (let index = 0; index < pdf.slideIds.length; index++) {
    if (!selectedPages.includes(index + 1)) continue;
    const number = index + 1, token = String(number).padStart(3, '0');
    await command('GOTO_SLIDE', pdf.id, pdf.slideIds[index]); await waitPdf(pdf.slideIds[index]);
    await editor.waitForFunction(revision => Number(document.querySelector('main')?.dataset.sessionRevision) >= revision, (await session()).revision);
    try {
      await editor.locator('#editor-slide').selectOption(pptx.slideIds[index]);
      await editor.waitForFunction(id => document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage')?.shadowRoot?.querySelector('div[data-slide-id]')?.dataset.slideId === id, pptx.slideIds[index]);
    } catch (error) {
      const previewState = await editor.evaluate(() => {
        const host = document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage');
        const root = host?.shadowRoot;
        return { hostPresent: Boolean(host), previewState: host?.dataset.previewState ?? null, shadowChildren: root?.childElementCount ?? 0, slideId: root?.querySelector('div[data-slide-id]')?.dataset.slideId ?? null, svg: Boolean(root?.querySelector('svg')), status: [...document.querySelectorAll('[role="status"]')].map(node => node.textContent?.trim()).filter(Boolean).slice(-3) };
      }).catch(() => null);
      const retry = editor.getByRole('button', { name: '같은 원본으로 미리보기 다시 준비', exact: true });
      let retryTriggered = false;
      if (await retry.count()) { await retry.click(); await editor.waitForFunction(() => document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage')?.dataset.previewState === 'preparing'); retryTriggered = true; }
      report.rows.push({ pageNumber: number, comparison: 'unavailable', reason: 'pptx-preview-not-ready', requestedSlideId: pptx.slideIds[index], previewState, retryButton: await retry.count() > 0, retryTriggered, error: String(error.message ?? error) });
      continue;
    }
    const metadata = await editor.evaluate(async () => {
      const root = document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage').shadowRoot, svg = root.querySelector('svg');
      const images = [...svg.querySelectorAll('image')];
      await Promise.all(images.map(async node => { const src = node.href?.baseVal; if (!src) return; const image = new Image(); image.src = src; await image.decode(); }));
      await document.fonts.ready; await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const walker = document.createTreeWalker(svg, NodeFilter.SHOW_TEXT), fonts = new Set(); let content = '', node;
      while (node = walker.nextNode()) { if (node.parentElement?.closest('style,script,title,desc')) continue; content += node.textContent; if (node.textContent.trim() && node.parentElement) fonts.add(getComputedStyle(node.parentElement).fontFamily); }
      const normalized = content.normalize('NFC').replace(/[\s\u200b\u200c\u200d\ufeff]+/gu, '');
      const textSha256 = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized)))].map(n => n.toString(16).padStart(2, '0')).join('');
      return { images: images.length, textLength: [...normalized].length, textSha256, cssFonts: [...fonts].sort() };
    });
    if (cdp) {
      metadata.localFontProbe = await editor.evaluate(async families => {
        const names = [...new Set([...families.map(s => s.split(',')[0].trim().replace(/^"|"$/g, '')), 'Calibri', 'Malgun Gothic', '맑은 고딕', 'PptxSyntheticAbsent-8f19'])];
        return Promise.all(names.map(async name => {
          let timer;
          try {
            const face = new FontFace('pptx-local-probe', `local(${JSON.stringify(name)})`);
            const status = await Promise.race([face.load().then(() => 'resolved', () => 'unresolved'), new Promise(r => { timer = setTimeout(() => r('timeout'), 1500); })]);
            return { name, status };
          } finally { clearTimeout(timer); }
        }));
      }, metadata.cssFonts);
      await editor.evaluate(() => {
        const svg = document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage').shadowRoot.querySelector('svg');
        const walker = document.createTreeWalker(svg, NodeFilter.SHOW_TEXT); let node, i = 0;
        while (node = walker.nextNode()) if (node.textContent.trim() && !node.parentElement.closest('style,script,title,desc')) node.parentElement.setAttribute('data-font-probe', String(i++));
      });
      const root = (await cdp.send('DOM.getDocument', { depth: -1, pierce: true })).root, nodes = [];
      function visit(node) { if (node.attributes?.includes('data-font-probe')) nodes.push(node.nodeId); for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) visit(child); }
      visit(root);
      const fonts = new Map();
      for (const nodeId of nodes) for (const font of (await cdp.send('CSS.getPlatformFontsForNode', { nodeId })).fonts) {
        const key = JSON.stringify([font.familyName, font.postScriptName, font.isCustomFont]);
        const previous = fonts.get(key); fonts.set(key, { familyName: font.familyName, postScriptName: font.postScriptName, isCustomFont: font.isCustomFont, glyphCount: (previous?.glyphCount ?? 0) + font.glyphCount });
      }
      metadata.platformFonts = [...fonts.values()]; metadata.platformFontProbeNodes = nodes.length;
    }
    assert.deepEqual((await session()).presentedSelection, { documentId: pdf.id, slideId: pdf.slideIds[index] });
    await player.bringToFront(); const pdfRaw = PNG.sync.read(await player.locator('canvas[aria-label="발표 자료"]').screenshot());
    await editor.bringToFront();
    const stage = editor.locator('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage');
    await stage.scrollIntoViewIfNeeded();
    const stageBox = await stage.boundingBox(); assert(stageBox);
    assert(Math.abs(stageBox.width - width) < .01 && Math.abs(stageBox.height - height) < .01);
    const pptxRaw = PNG.sync.read(await editor.screenshot({ clip: { x: stageBox.x, y: stageBox.y, width, height } }));
    const pdfImage = normalize(pdfRaw), pptxImage = normalize(pptxRaw), stats = compare(pdfImage, pptxImage);
    if (cdp) {
      // Diagnostic control only. Restore every inline style before leaving this page.
      const originals = await editor.evaluate(() => {
        const nodes = [...document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage').shadowRoot.querySelectorAll('[data-font-probe]')];
        const previous = nodes.map(n => n.getAttribute('style'));
        nodes.forEach(n => n.style.setProperty('font-family', '"Malgun Gothic"', 'important')); return previous;
      });
      try {
        await editor.evaluate(async () => { await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
        const control = PNG.sync.read(await editor.screenshot({ clip: { x: stageBox.x, y: stageBox.y, width, height } }));
        assert.equal(control.width, width); assert.equal(control.height, height);
        const controlStats = compare(pdfImage, control); delete controlStats.difference;
        metadata.fontControl = { diagnosticDomOverride: true, family: 'Malgun Gothic', ...controlStats, maeDeltaFromBaseline: controlStats.mae - stats.mae };
        await writeFile(resolve(output, `${token}-font-control.png`), PNG.sync.write(control));
      } finally {
        await editor.evaluate(previous => {
          const nodes = [...document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage').shadowRoot.querySelectorAll('[data-font-probe]')];
          nodes.forEach((n, i) => previous[i] === null ? n.removeAttribute('style') : n.setAttribute('style', previous[i]));
        }, originals);
      }
    }
    await writeFile(resolve(output, `${token}-pdf.png`), PNG.sync.write(pdfImage)); await writeFile(resolve(output, `${token}-pptx.png`), PNG.sync.write(pptxImage)); await writeFile(resolve(output, `${token}-diff.png`), PNG.sync.write(stats.difference));
    delete stats.difference;
    const backgroundSamples = [[10, 10], [10, 200], [700, 200], [100, 300], [600, 500]].map(([x, y]) => ({ x, y, pdf: [...pdfRaw.data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)], pptx: [...pptxRaw.data.subarray((y * width + x) * 4, (y * width + x) * 4 + 4)] }));
    report.rows.push({ pageNumber: number, pdfCaptured: [pdfRaw.width, pdfRaw.height], pptxCaptured: [pptxRaw.width, pptxRaw.height], referenceAspectRatio: pdfRaw.width / pdfRaw.height, productAspectRatio: pptxRaw.width / pptxRaw.height, aspectRatioMismatch: Math.abs(pdfRaw.width / pdfRaw.height - pptxRaw.width / pptxRaw.height) > 0.001, stageBox, resampled: pdfRaw.width !== width || pdfRaw.height !== height || pptxRaw.width !== width || pptxRaw.height !== height, normalization: 'aspect-preserving-letterbox', backgroundSamples, ...metadata, ...stats });
    if (number % 10 === 0) console.log(JSON.stringify({ completed: number, total: pdf.slideIds.length }));
  }
  for (const number of selectedPages.filter(page => page > pdf.slideIds.length)) {
    report.rows.push({ pageNumber: number, comparison: 'unavailable', reason: 'reference-page-unavailable', requestedSlideId: pptx.slideIds[number - 1] });
  }
  report.pages = report.rows.length; report.comparisonRows = report.rows.filter(row => row.comparison !== 'unavailable').length; report.unavailableRows = report.rows.length - report.comparisonRows; report.aspectRatioMismatchPages = report.rows.filter(row => row.aspectRatioMismatch === true).map(row => row.pageNumber); report.privateSelectionIndependent = true;
  report.worstByPixelDifference = [...report.rows].sort((a, b) => b.changedPixelFraction24 - a.changedPixelFraction24).slice(0, 10).map(row => ({ pageNumber: row.pageNumber, mae: row.mae, changedPixelFraction24: row.changedPixelFraction24 }));
  report.environment = await player.evaluate(() => navigator.userAgent);
  report.originalsUnchanged = fingerprints.pptx === await hash(pptxPath) && fingerprints.pdf === await hash(pdfPath);
  assert(report.originalsUnchanged); assert.deepEqual(errors, []); assert.equal(report.externalRequests, 0);
  report.executionPassed = true; report.visualAcceptance = 'unverified-needs-reference-environment-and-human-review';
} catch (error) { report.failure = error.stack; throw error; }
finally {
  report.errors = errors; await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2));
  const rows = report.rows.map(row => { const token = String(row.pageNumber).padStart(3, '0'); if (row.comparison === 'unavailable') return `<section><h2>Page ${row.pageNumber} · unavailable</h2><p>${row.reason}: ${row.error}</p></section>`; return `<section><h2>Page ${row.pageNumber} · MAE ${row.mae.toFixed(2)} · changed ${(row.changedPixelFraction24 * 100).toFixed(2)}%</h2><div><figure><figcaption>Reference PDF</figcaption><img src="${token}-pdf.png"></figure><figure><figcaption>Product PPTX private view</figcaption><img src="${token}-pptx.png"></figure><figure><figcaption>Absolute pixel difference</figcaption><img src="${token}-diff.png"></figure></div></section>`; }).join('');
  await writeFile(resolve(output, 'comparison.html'), `<!doctype html><meta charset="utf-8"><title>Local full-deck comparison</title><style>body{font:16px sans-serif;margin:24px;background:#eee}section{margin-bottom:32px}section>div{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0;width:480px}img{width:100%;display:block}figcaption{padding:8px}</style><h1>Local reference comparison</h1><p>Pixel differences are diagnostics. Static comparison does not validate animation, audio, fonts or final support.</p>${rows}`);
  await context?.close(); console.log(JSON.stringify({ output, executionPassed: report.executionPassed, pages: report.rows.length, failure: report.failure }));
}
