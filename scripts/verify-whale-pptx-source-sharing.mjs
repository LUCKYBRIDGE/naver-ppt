import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { pptxBackgroundPatch } from './pptx-background-patch.ts';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';
import { verifyPptxAdmission } from './pptx-admission-probe.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
assert(teacherPath, 'Pass Playwright, Whale and read-only local teacher PPTX.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const hash = async () => createHash('sha256').update(await readFile(teacherPath)).digest('hex'), originalHash = await hash();
const output = resolve('node_modules/.cache/whale-pptx-source-sharing', String(Date.now())), extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
const modulePath = path => resolve(path).replaceAll('\\', '/');
await writeFile(resolve(output, 'entry.ts'), `
export {loadPptxSourceModel,getPptxResourceInventory} from '${modulePath('src/adapters/pptx/sourceModel.ts')}';
export {PPTX_PREPARATION_LOCK} from '${modulePath('src/adapters/pptx/preparationAdmission.ts')}';
export {preparePptxImport} from '${modulePath('src/adapters/pptx/import.ts')}';
export {inspectPptxFile} from '${modulePath('src/adapters/pptx/fileInspection.ts')}';
export {readPptxSourceIdentity} from '${modulePath('src/adapters/pptx/source.ts')}';
export {SourceVault} from '${modulePath('src/storage/sourceVault.ts')}';
export {createSession} from '${modulePath('src/core/session.ts')}';`);
await build({ configFile: false, base: './', logLevel: 'warn', plugins: [pptxBackgroundPatch()], worker: { format: 'es', plugins: () => [pptxBackgroundPatch(), { name: 'preserve-parser', transform(code, id) { if (id.replaceAll('\\', '/').endsWith('/@web-ppt/core/dist/worker.js')) return { code, map: null, moduleSideEffects: true }; } }] }, build: { outDir: resolve(extension, 'probe'), emptyOutDir: false, lib: { entry: resolve(output, 'entry.ts'), formats: ['es'], fileName: () => 'api.js' } } });
await writeFile(resolve(extension, 'probe/index.html'), '<!doctype html><meta charset="utf-8"><input id="source" type="file"><script type="module" src="./runner.js"></script>');
await writeFile(resolve(extension, 'probe/runner.js'), "import * as api from './api.js'; window.api = api;");
let context; const report = { actualWorker: true, productModule: true, productRendering: false, externalRequests: 0, pageErrors: [] };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(20000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, id) => { const p = await context.newPage(); p.on('pageerror', e => report.pageErrors.push(e.message)); await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p; };
  const send = (p, request) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), request);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic sharing protection' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id), remote = await page('remote', id), player = await page('player', id);
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-current.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('A', 2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const beforeActivation = (await send(editor, { type: 'GET_SESSION', sessionId: id })).session;
  assert((await send(remote, { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId: id, documentId: beforeActivation.documentOrder[0], slideId: null, revision: beforeActivation.revision, commandId: crypto.randomUUID() } })).ok);
  await player.waitForFunction(() => !!document.querySelector('canvas[aria-label="발표 자료"]')?.width);
  const before = (await send(editor, { type: 'GET_SESSION', sessionId: id })).session, pixels = await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL());
  const probe = await page('probe'); await probe.waitForFunction(() => !!window.api); await probe.locator('#source').setInputFiles(teacherPath);
  await probe.evaluate(() => {
    window.input = document.getElementById('source').files[0]; window.requests = 0; window.terminated = 0; window.held = [];
    const Original = window.Worker;
    window.Worker = class extends Original {
      postMessage(value, transfer) {
        if (value?.mode !== 'presentation') return super.postMessage(value, transfer);
        this.presentation = true; window.requests++; window.held.push(() => Original.prototype.postMessage.call(this, value, transfer));
      }
      terminate() { if (this.presentation) window.terminated++; super.terminate(); }
    };
    window.a = new AbortController(); window.b = new AbortController();
    window.first = window.api.loadPptxSourceModel(window.input, window.a.signal).then(value => { window.firstSource = value; return 'ready'; }, error => error.name);
    window.second = window.api.loadPptxSourceModel(window.input, window.b.signal).then(value => { window.secondSource = value; return 'ready'; }, error => error.name);
  });
  await probe.waitForFunction(() => window.requests === 1); await probe.evaluate(() => window.a.abort());
  const preparingInventory = await probe.evaluate(() => window.api.getPptxResourceInventory());
  assert.equal(preparingInventory.jobs, 1); assert.equal(preparingInventory.readySources, 0);
  assert.equal(await probe.evaluate(() => window.first), 'AbortError'); assert.equal(await probe.evaluate(() => window.terminated), 0);
  await probe.evaluate(() => window.held.shift()()); assert.equal(await probe.evaluate(() => window.second), 'ready');
  const sharing = await probe.evaluate(async () => {
    const third = await window.api.loadPptxSourceModel(window.input, new AbortController().signal), source = window.secondSource;
    const readyInventory = window.api.getPptxResourceInventory();
    const same = source.model === third.model, fingerprint = source.fingerprint, slides = source.model.slides.length, assets = source.ownedUrls.size;
    source.dispose(); const retained = source.ownedUrls.size === assets;
    const releasedImageParts = source.duplicateImageParts.size, releasedImageBytes = [...source.duplicateImageParts.values()].reduce((sum, value) => sum + value.size, 0),
      releasedMediaParts = source.duplicateMediaParts.size, releasedMediaBytes = [...source.duplicateMediaParts.values()].reduce((sum, value) => sum + value.size, 0);
    const ownedTypes = {}, remainingRaster = { parts: 0, bytes: 0 };
    for (const blob of source.ownedBlobs.values()) { const entry = ownedTypes[blob.type] ??= { count: 0, bytes: 0 }; entry.count++; entry.bytes += blob.size; }
    for (const [part, bytes] of Object.entries(source.files)) if (/\.(png|jpe?g|gif|webp)$/i.test(part)) { remainingRaster.parts++; remainingRaster.bytes += bytes.length; }
    const rawViews = Object.values(source.files), rawBytes = rawViews.reduce((sum, value) => sum + value.byteLength, 0),
      rawBackingBytes = [...new Set(rawViews.map(value => value.buffer))].reduce((sum, buffer) => sum + buffer.byteLength, 0);
    const nativeOwner = third.retain(); third.dispose(); const retainedAfterParentsRelease = source.ownedUrls.size === assets;
    const nativeInventory = window.api.getPptxResourceInventory();
    nativeOwner.dispose(); nativeOwner.dispose(); return { same, fingerprint, slides, assets, retained, retainedAfterParentsRelease, released: source.ownedUrls.size === 0,
      readyInventory, nativeInventory, finalInventory: window.api.getPptxResourceInventory(),
      rawPartsAfterFinalRelease: Object.keys(source.files).length, releasedImageParts, releasedImageBytes, releasedMediaParts, releasedMediaBytes, ownedTypes, remainingRaster, rawBytes, rawBackingBytes, requests: window.requests, terminated: window.terminated };
  });
  assert(sharing.same && sharing.retained && sharing.released && sharing.assets > 0); assert.equal(sharing.fingerprint, originalHash); assert.equal(sharing.requests, 1); assert.equal(sharing.terminated, 1); report.shared = sharing;
  assert.equal(sharing.rawPartsAfterFinalRelease, 0); assert(sharing.releasedImageParts > 0 && sharing.releasedImageBytes > 0);
  assert.equal(sharing.retainedAfterParentsRelease, true);
  assert.equal(sharing.readyInventory.readySources, 1); assert.equal(sharing.readyInventory.leases, 2);
  assert.equal(sharing.nativeInventory.readySources, 1); assert.equal(sharing.nativeInventory.leases, 1);
  assert.equal(sharing.nativeInventory.assetBytes, sharing.readyInventory.assetBytes);
  assert.equal(sharing.finalInventory.readySources, 0); assert.equal(sharing.finalInventory.jobs, 0); assert.equal(sharing.finalInventory.assetBytes, 0);
  report.preparingInventory = preparingInventory;
  await probe.evaluate(() => {
    window.c = new AbortController(); window.d = new AbortController();
    window.cancelOne = window.api.loadPptxSourceModel(window.input, window.c.signal).then(() => 'unexpected', error => error.name);
    window.cancelTwo = window.api.loadPptxSourceModel(window.input, window.d.signal).then(() => 'unexpected', error => error.name);
  });
  await probe.waitForFunction(() => window.requests === 2); await probe.evaluate(() => { window.c.abort(); window.d.abort(); });
  assert.deepEqual(await probe.evaluate(() => Promise.all([window.cancelOne, window.cancelTwo])), ['AbortError', 'AbortError']);
  assert.equal(await probe.evaluate(() => window.terminated), 2);
  await probe.evaluate(() => { try { window.held.shift()(); } catch {} window.retry = window.api.loadPptxSourceModel(window.input, new AbortController().signal); });
  await probe.waitForFunction(() => window.requests === 3); await probe.evaluate(() => window.held.shift()());
  const retried = await probe.evaluate(async () => { const source = await window.retry; const result = { fingerprint: source.fingerprint, assets: source.ownedUrls.size }; source.dispose(); return result; });
  assert.equal(retried.fingerprint, originalHash); assert(retried.assets > 0); report.allCancelledTerminatesAndRetrySucceeds = true;
  report.admission = await verifyPptxAdmission({ context, caller: probe, origin, teacherPath, fingerprint: originalHash });
  assert.deepEqual((await send(editor, { type: 'GET_SESSION', sessionId: id })).session, before);
  assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels); report.currentPdfAndSessionPreserved = true;
  assert.equal(await hash(), originalHash); report.originalHashUnchanged = true; assert.equal(report.externalRequests, 0); assert.deepEqual(report.pageErrors, []);
  report.environment = await probe.evaluate(() => navigator.userAgent);
  report.privateBufferTransferSupported = await probe.evaluate(() => typeof ArrayBuffer.prototype.transfer === 'function'); report.pass = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, ...report })); }
