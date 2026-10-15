import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
if (!teacherPath) throw Error('Pass Playwright, installed Whale and a local PPTX sample.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const originalHash = createHash('sha256').update(await readFile(teacherPath)).digest('hex');
const output = resolve('node_modules/.cache/whale-pptx-inspection', String(Date.now())), profile = resolve(output, 'profile'), extension = resolve('dist');
await mkdir(output, { recursive: true });
const errors = [], requests = [], report = { profile, productDist: true };
let context;
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [
    `--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
  ] });
  context.setDefaultTimeout(20000);
  context.on('request', request => requests.push(request.url()));
  await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) {
    for (const candidate of context.serviceWorkers()) if (await candidate.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = candidate;
    if (!worker) await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, sessionId) => { const p = await context.newPage(); p.on('pageerror', error => errors.push(error.message)); await p.goto(`${origin}/${role}/index.html${sessionId ? '?sessionId=' + sessionId : ''}`); return p; };
  const send = (p, value) => p.evaluate(request => (window.whale ?? chrome).runtime.sendMessage(request), value);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic PPTX inspection lesson' }); assert(created.ok);
  const sessionId = created.session.id, editor = await page('editor', sessionId), remote = await page('remote', sessionId), player = await page('player', sessionId);
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-A.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('A', 2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const teacher = async () => { const result = await send(editor, { type: 'GET_SESSION', sessionId }); assert(result.ok); return result.session; };
  const initial = await teacher(), documentId = initial.documentOrder[0], slideId = initial.documents[documentId].slideIds[0];
  assert((await send(remote, { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId, documentId, slideId: null, revision: initial.revision, commandId: 'activate-synthetic' } })).ok);
  await player.waitForFunction(id => { const canvas = document.querySelector('.pdf-stage canvas'); return canvas?.dataset.slideId === id && canvas.width && canvas.height && canvas.getContext('2d').getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data[3] === 255; }, slideId);
  const canvasHash = () => player.evaluate(async () => { const canvas = document.querySelector('.pdf-stage canvas'), pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, digest = await crypto.subtle.digest('SHA-256', pixels); return { width: canvas.width, height: canvas.height, hash: [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('') }; });
  const before = await teacher(), audienceBefore = await send(player, { type: 'GET_SESSION', sessionId }), pixelsBefore = await canvasHash();
  const panel = editor.getByRole('region', { name: 'PPTX 원본 점검', exact: true });
  await editor.evaluate(() => {
    const NativeWorker = window.Worker; window.modelJobs = [];
    window.Worker = class extends NativeWorker {
      constructor(url, options) {
        super(url, options);
        if (String(url).includes('modelWorker-')) {
          const job = { url: String(url), terminated: false }; this.job = job; window.modelJobs.push(job);
          this.addEventListener('message', event => { job.result = event.data; });
          this.addEventListener('error', event => { job.error = event.message; });
        }
      }
      terminate() { if (this.job) this.job.terminated = true; super.terminate(); }
    };
  });
  await panel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
  await panel.getByRole('status').filter({ hasText: '원본 구조 점검을 마쳤습니다.' }).waitFor();
  const registrationItems = await panel.locator('.preflight-results li').count();
  const registrationPasses = await panel.locator('[data-result="pass"]').count();
  const registrationWarnings = await panel.locator('[data-result="warning"]').count();
  const registrationText = await panel.textContent();
  const slideCountMatch = registrationText.match(/원본 XML 순서에서 (\d+)쪽/);
  const detectedSlideCount = slideCountMatch ? Number(slideCountMatch[1]) : null;
  report.registration = { items: registrationItems, passes: registrationPasses, warnings: registrationWarnings, detectedSlideCount, textEvidence: Boolean(registrationText.includes('원본 XML 순서')) };
  const localCounts = (await panel.textContent()).match(/슬라이드에 명시된 글꼴 이름 (\d+)종 중 로컬 참조 확인 (\d+)종, 확인 실패 (\d+)종, 미확인 (\d+)종/);
  if (localCounts) report.localFonts = { candidates: Number(localCounts[1]), resolved: Number(localCounts[2]), unresolved: Number(localCounts[3]), pending: Number(localCounts[4]) };
  assert.deepEqual(await teacher(), before); assert.deepEqual(await send(player, { type: 'GET_SESSION', sessionId }), audienceBefore); assert.deepEqual(await canvasHash(), pixelsBefore);
  report.teacherFileInspection = { slideCount: detectedSlideCount, sourceHash: originalHash, registered: false, sessionUnchanged: true, audienceUnchanged: true, canvasUnchanged: true };
  assert.equal(requests.filter(url => /\/(?:modelWorker|worker)-[\w-]+\.js/.test(url)).length, 0);
  await panel.getByRole('checkbox', { name: '후보 모델 검사' }).check();
  await panel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
  await editor.waitForFunction(() => window.modelJobs.some(job => job.terminated));
  assert(await editor.evaluate(() => window.modelJobs.every(job => job.terminated && job.result?.ok === true)));
  await panel.getByRole('status').filter({ hasText: '원본 구조 점검을 마쳤습니다.' }).waitFor();
  const modelText = await panel.textContent();
  const modelCounts = modelText.match(/후보 모델 (\d+)쪽·요소 (\d+)개/);
  const effectCounts = modelText.match(/모델 효과 (\d+)쪽·(\d+)개/);
  report.modelInspection = { items: await panel.locator('.preflight-results li').count(), modelSlides: modelCounts ? Number(modelCounts[1]) : null, elements: modelCounts ? Number(modelCounts[2]) : null, effectSlides: effectCounts ? Number(effectCounts[1]) : null, effects: effectCounts ? Number(effectCounts[2]) : null };
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore);
  report.productModelInspection = { ...report.modelInspection, noRegistration: true, sessionUnchanged: true, canvasUnchanged: true };
  await editor.bringToFront(); await panel.scrollIntoViewIfNeeded();
  await panel.getByRole('checkbox', { name: '후보 모델 검사' }).uncheck();
  await editor.evaluate(() => {
    window.nativeFontFace = window.FontFace; window.fontLookupStarted = 0; window.fontLookupReleases = [];
    window.FontFace = class { load() { window.fontLookupStarted++; return new Promise(resolve => window.fontLookupReleases.push(() => resolve(this))); } };
  });
  await panel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
  let fontLookupApplicable = true;
  try { await editor.waitForFunction(() => window.fontLookupStarted > 0, null, { timeout: 5000 }); } catch { fontLookupApplicable = false; }
  if (fontLookupApplicable) {
    const fontCancel = panel.getByRole('button', { name: '원본 점검 취소', exact: true }); await fontCancel.focus(); await fontCancel.press('Enter');
    await panel.getByRole('status').filter({ hasText: '원본 점검을 취소했습니다.' }).waitFor();
    await editor.evaluate(async () => { window.fontLookupReleases.forEach(release => release()); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); });
    assert.equal(await panel.locator('.preflight-results').count(), 0);
    assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore); report.fontLookupCancellationPreservesAudience = true;
    await editor.evaluate(() => { window.FontFace = class { load() { return new Promise(() => {}); } }; });
    await panel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
    await panel.getByRole('status').filter({ hasText: '원본 구조 점검을 마쳤습니다.' }).waitFor();
    const pendingCounts = (await panel.textContent()).match(/로컬 참조 확인 0종, 확인 실패 0종, 미확인 (\d+)종/);
    report.fontLookupTimeoutUnknown = Boolean(pendingCounts && Number(pendingCounts[1]) > 0);
    await editor.evaluate(() => { window.FontFace = window.nativeFontFace; });
  } else report.fontLookup = 'not-applicable-no-font-candidates';
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore);
  const previewPanel = editor.getByRole('region', { name: 'PPTX 비공개 미리보기', exact: true });
  await editor.evaluate(() => {
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
    window.previewAssets = new Set();
    URL.createObjectURL = blob => { const url = create(blob); window.previewAssets.add(url); return url; };
    URL.revokeObjectURL = url => { window.previewAssets.delete(url); revoke(url); };
  });
  const assetsBefore = await editor.evaluate(() => window.previewAssets.size);
  await previewPanel.locator('#pptx-preview-file').setInputFiles(teacherPath);
  await previewPanel.getByRole('status').last().waitFor({ state: 'visible', timeout: 35000 });
  await editor.waitForFunction(() => {
    const text = document.querySelector('section.pptx-private-preview [role="status"]')?.textContent ?? '';
    return !text.includes('PPTX 미리보기를 준비 중입니다.');
  }, undefined, { timeout: 35000 });
  const previewStatus = await previewPanel.getByRole('status').last().textContent();
  if (!previewStatus?.includes('준비했습니다')) {
    report.privatePreview = { slides: 0, decodedImages: 0, preserved: true, unavailable: true, status: previewStatus?.trim() ?? '' };
    assert.deepEqual(await teacher(), before); assert.deepEqual(await send(player, { type: 'GET_SESSION', sessionId }), audienceBefore); assert.deepEqual(await canvasHash(), pixelsBefore);
    report.privatePreview.invalidOrUnsupportedPreservesAudience = true;
    await context.close(); context = undefined;
    await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ output, executionPassed: true, report }));
    process.exit(0);
  }
  const previewSlides = await previewPanel.getByRole('combobox', { name: '쪽 이동' }).locator('option').count();
  report.privatePreview = { slides: previewSlides, decodedImages: 0, preserved: true, unavailableSlides: [] };
  for (let index = 0; index < previewSlides; index++) {
    await previewPanel.getByRole('combobox', { name: '쪽 이동' }).selectOption(String(index));
    try { await editor.waitForFunction(i => document.querySelector('.pptx-preview-stage')?.shadowRoot?.querySelector('svg')?.dataset.previewIndex === String(i), index); } catch (error) { report.privatePreview.unavailableSlides.push({ index: index + 1, error: String(error.message ?? error) }); continue; }
    const decoded = await previewPanel.locator('.pptx-preview-stage').evaluate(async host => {
      const svg = host.shadowRoot.querySelector('svg'), images = [...svg.querySelectorAll('image')];
      for (const node of images) { const image = new Image(); image.src = node.getAttribute('href') ?? node.getAttributeNS('http://www.w3.org/1999/xlink', 'href'); await image.decode(); if (!image.naturalWidth) throw Error('PREVIEW_EMPTY_IMAGE'); }
      return images.length;
    });
    report.privatePreview.decodedImages += decoded;
  }
  report.privatePreview.hasDecodedImages = report.privatePreview.decodedImages > 0;
  assert.deepEqual(await teacher(), before); assert.deepEqual(await send(player, { type: 'GET_SESSION', sessionId }), audienceBefore); assert.deepEqual(await canvasHash(), pixelsBefore);
  if (previewSlides >= 3) {
    // Values are zero-based; choose the middle option before testing next/previous.
    await previewPanel.getByRole('combobox', { name: '쪽 이동' }).selectOption('1');
    await previewPanel.getByRole('button', { name: '다음 미리보기 쪽', exact: true }).click();
    assert.equal(await previewPanel.getByRole('combobox', { name: '쪽 이동' }).inputValue(), '2');
    await previewPanel.getByRole('button', { name: '이전 미리보기 쪽', exact: true }).click();
    assert.equal(await previewPanel.getByRole('combobox', { name: '쪽 이동' }).inputValue(), '1');
  }
  await editor.bringToFront();
  report.viewports = [];
  for (const [width, height] of [[1920,1080], [1366,768], [1280,800], [768,1024], [380,820]]) {
    await editor.setViewportSize({ width, height }); await panel.scrollIntoViewIfNeeded();
    assert(await editor.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(await panel.evaluate(root => [...root.querySelectorAll('li, input, button, p, h2')].every(node => { const r = node.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; })));
    await editor.screenshot({ path: resolve(output, `inspection-${width}.png`), fullPage: true }); report.viewports.push({ width, height, noHorizontalOverflow: true });
    if ([1366,380].includes(width)) await previewPanel.screenshot({ path: resolve(output, `preview-${width}.png`) });
  }
  await previewPanel.getByRole('button', { name: '미리보기 닫기', exact: true }).click();
  assert.equal(await editor.evaluate(() => window.previewAssets.size), assetsBefore);
  assert.equal(await previewPanel.locator('.pptx-preview-stage').evaluate(host => host.shadowRoot?.childElementCount ?? 0), 0);
  report.privatePreview.urlsReleased = true;
  await previewPanel.locator('#pptx-preview-file').setInputFiles(teacherPath);
  await previewPanel.getByRole('status').filter({ hasText: '비공개 미리보기를 준비했습니다.' }).waitFor();
  assert((await editor.evaluate(() => window.previewAssets.size)) > assetsBefore);
  await previewPanel.locator('#pptx-preview-file').setInputFiles({ name: 'Synthetic-invalid.pptx', mimeType: 'application/octet-stream', buffer: Buffer.from('Not a PPTX') });
  await previewPanel.getByRole('status').filter({ hasText: '미리보기를 준비하지 못했습니다.' }).waitFor();
  assert.equal(await editor.evaluate(() => window.previewAssets.size), assetsBefore);
  assert.equal(await previewPanel.locator('.pptx-preview-stage').evaluate(host => host.shadowRoot?.childElementCount ?? 0), 0);
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore); report.privatePreview.invalidFilePreservesAudience = true;
  await panel.locator('#pptx-inspection-file').setInputFiles({ name: 'Synthetic-invalid.pptx', mimeType: 'application/octet-stream', buffer: Buffer.from('Not a PPTX') });
  await panel.getByRole('status').filter({ hasText: '원본 구조를 점검하지 못했습니다.' }).waitFor(); assert.equal(await panel.locator('.preflight-results').count(), 0);
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore); report.invalidFileClearsSuccess = true;
  const cancelled = await page('editor', sessionId); await cancelled.bringToFront(); await cancelled.setViewportSize({ width: 1280, height: 800 });
  await cancelled.evaluate(() => {
    const NativeWorker = window.Worker; window.zipCancellation = { started: 0, terminated: 0, release: null };
    window.Worker = class extends NativeWorker {
      constructor(url, options) { super(url, options); this.zip = String(url).includes('packageWorker-'); }
      postMessage(value, transfer) { if (!this.zip) return super.postMessage(value, transfer); window.zipCancellation.started++; window.zipCancellation.release = () => NativeWorker.prototype.postMessage.call(this, value, transfer); }
      terminate() { if (this.zip) window.zipCancellation.terminated++; super.terminate(); }
    };
  });
  const cancelledPanel = cancelled.getByRole('region', { name: 'PPTX 원본 점검', exact: true });
  await cancelledPanel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
  await cancelled.waitForFunction(() => window.zipCancellation.started === 1);
  const cancelButton = cancelledPanel.getByRole('button', { name: '원본 점검 취소', exact: true }); await cancelButton.focus(); await cancelButton.press('Enter');
  assert.equal(await cancelled.evaluate(() => window.zipCancellation.terminated), 1);
  await cancelled.evaluate(() => { try { window.zipCancellation.release(); } catch { /* A terminated native Worker may reject the late send. */ } });
  await cancelled.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await cancelledPanel.getByRole('status').filter({ hasText: '원본 점검을 취소했습니다.' }).waitFor(); assert.equal(await cancelledPanel.locator('.preflight-results').count(), 0);
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore); report.cancelDuringWorkerSend = { nativeWorkerTerminated: true, lateReportAbsent: true, sessionUnchanged: true, canvasUnchanged: true };
  await cancelled.evaluate(() => {
    const NativeWorker = window.Worker; window.modelCancellation = { started: 0, terminated: 0, release: null };
    window.Worker = class extends NativeWorker {
      constructor(url, options) { super(url, options); this.model = String(url).includes('modelWorker-'); }
      postMessage(value, transfer) { if (!this.model) return super.postMessage(value, transfer); window.modelCancellation.started++; window.modelCancellation.release = () => NativeWorker.prototype.postMessage.call(this, value, transfer); }
      terminate() { if (this.model) window.modelCancellation.terminated++; super.terminate(); }
    };
    // Allow the ZIP guard to complete for the model cancellation phase.
    window.zipCancellation.release = null;
  });
  await cancelled.evaluate(() => { window.zipCancellation.started = -100; });
  await cancelledPanel.getByRole('checkbox', { name: '후보 모델 검사' }).check();
  // The earlier ZIP wrapper intentionally held sends; release its next job.
  const zipRelease = cancelled.waitForFunction(() => typeof window.zipCancellation.release === 'function');
  await cancelledPanel.locator('#pptx-inspection-file').setInputFiles(teacherPath);
  await zipRelease; await cancelled.evaluate(() => window.zipCancellation.release());
  await cancelled.waitForFunction(() => window.modelCancellation.started === 1);
  await cancelButton.focus(); await cancelButton.press('Enter');
  assert.equal(await cancelled.evaluate(() => window.modelCancellation.terminated), 1);
  await cancelled.evaluate(() => { try { window.modelCancellation.release(); } catch {} });
  assert.equal(await cancelledPanel.locator('.preflight-results').count(), 0);
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore);
  report.modelCancellation = { nativeWorkerTerminated: true, noLateReport: true, canvasUnchanged: true };
  const previewCancelEditor = await page('editor', sessionId); await previewCancelEditor.bringToFront();
  await previewCancelEditor.evaluate(() => {
    const NativeWorker = window.Worker; window.previewCancellation = { started: 0, terminated: 0, release: null };
    window.Worker = class extends NativeWorker {
      constructor(url, options) { super(url, options); this.model = String(url).includes('modelWorker-'); }
      postMessage(value, transfer) { if (!this.model) return super.postMessage(value, transfer); window.previewCancellation.started++; window.previewCancellation.release = () => NativeWorker.prototype.postMessage.call(this, value, transfer); }
      terminate() { if (this.model) window.previewCancellation.terminated++; super.terminate(); }
    };
  });
  const previewCancelPanel = previewCancelEditor.getByRole('region', { name: 'PPTX 비공개 미리보기', exact: true });
  await previewCancelPanel.locator('#pptx-preview-file').setInputFiles(teacherPath);
  await previewCancelEditor.waitForFunction(() => window.previewCancellation.started === 1);
  const previewCancelButton = previewCancelPanel.getByRole('button', { name: '미리보기 준비 취소', exact: true }); await previewCancelButton.focus(); await previewCancelButton.press('Enter');
  assert.equal(await previewCancelEditor.evaluate(() => window.previewCancellation.terminated), 1);
  await previewCancelEditor.evaluate(() => { try { window.previewCancellation.release(); } catch {} });
  await previewCancelPanel.getByRole('status').filter({ hasText: '미리보기를 닫았습니다.' }).waitFor();
  assert.equal(await previewCancelPanel.getByRole('combobox').count(), 0);
  assert.deepEqual(await teacher(), before); assert.deepEqual(await canvasHash(), pixelsBefore);
  report.privatePreview.cancelledPreparation = true;
  report.lazyModelLoading = true; report.externalRequests = requests.filter(url => /^https?:/.test(url)).length;
  assert.equal(report.externalRequests, 0);
  assert.equal(createHash('sha256').update(await readFile(teacherPath)).digest('hex'), originalHash); assert.deepEqual(errors, []);
  report.originalUnchanged = true; report.pageErrors = errors; report.userAgent = await editor.evaluate(() => navigator.userAgent);
  await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} catch (error) {
  await writeFile(resolve(output, 'failure.json'), JSON.stringify({ ...report, failure: error.stack, pageErrors: errors }, null, 2));
  throw error;
} finally { await context?.close(); }
