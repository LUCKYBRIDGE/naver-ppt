import assert from 'node:assert/strict';
import { presentPptx } from './presentation-ui.mjs';
import { observeMediaMemory } from './media-memory-observer.mjs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { build } from 'vite';
import { pptxBackgroundPatch } from './pptx-background-patch.ts';

const [playwrightPath, executablePath, pptxPath, pdfPath, mode] = process.argv.slice(2);
const diagnostics = mode === '--media64' && process.argv.includes('--diagnostics');
if (!pdfPath) throw Error('Pass Playwright, Whale, read-only entry-limit PPTX, and paired PDF.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex');
const fingerprints = { pptx: await hash(pptxPath), pdf: await hash(pdfPath) };
const output = resolve('node_modules/.cache/whale-pptx-entry-limit', String(Date.now()));
const extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
if (diagnostics) {
  const mod = path => resolve(path).replaceAll('\\', '/');
  await writeFile(resolve(output, 'probe-entry.js'), `export {loadPptxSourceModel} from '${mod('src/adapters/pptx/sourceModel.ts')}';export {probeMedia} from '${mod('src/media/input.ts')}';`);
  await build({ configFile: false, base: './', logLevel: 'warn', plugins: [pptxBackgroundPatch()], worker: { format: 'es', plugins: () => [pptxBackgroundPatch(), { name: 'preserve-parser', transform(code, id) { if (id.replaceAll('\\', '/').endsWith('/@web-ppt/core/dist/worker.js')) return { code, map: null, moduleSideEffects: true }; } }] }, build: { outDir: resolve(extension, 'probe'), emptyOutDir: false, lib: { entry: resolve(output, 'probe-entry.js'), formats: ['es'], fileName: () => 'api.js' } } });
  await writeFile(resolve(extension, 'probe/index.html'), '<!doctype html><meta charset="utf-8"><input id="source" type="file"><script type="module" src="./runner.js"></script>');
  await writeFile(resolve(extension, 'probe/runner.js'), `
import {loadPptxSourceModel,probeMedia} from './api.js';
window.run = async () => {
 const file=document.getElementById('source').files[0],source=await loadPptxSourceModel(file,new AbortController().signal);
 try {
  const refs=[]; const visit=(elements,path=[])=>elements.forEach((e,i)=>{if(e.kind==='group')visit(e.children,[...path,i]);else if(e.kind==='image'&&e.media){const blob=source.ownedBlobs.get(e.media.src);refs.push({path:[...path,i],id:e.id,kind:e.media.kind,mime:e.media.mime,srcType:e.media.src==null?'null':String(e.media.src).split(':')[0],owned:source.ownedUrls.has(e.media.src),bytes:blob?.size??0});}});
  visit(source.model.slides[2].elements);
  const part='ppt/media/media1.mp3',raw=source.files[part],evidence=source.largeMediaParts?.get(part);
  const blob=[...source.ownedBlobs.values()].find(blob=>blob.size===evidence?.size&&blob.type==='audio/mpeg');
  if(!raw&&!blob)throw Error('EXPECTED_LARGE_AUDIO');
  const meta=await probeMedia(new File([raw??blob],'Synthetic-name.mp3',{type:'audio/mpeg',lastModified:0}));
  if(evidence&&meta.fingerprint!==evidence.fingerprint)throw Error('ORIGINAL_MEDIA_HASH_MISMATCH');
  return {slides:source.parts.length,selectedModelMedia:refs,native:{bytes:raw?.length??blob.size,durationSec:meta.durationSec,mime:meta.mime,fingerprint:meta.fingerprint}};
 }finally{source.dispose();}
};`);
}
let context, sampling, processMemory; let monitoring = false;
const errors = [], report = { baseline: mode === '--baseline', media64: mode === '--media64', fingerprints, externalRequests: 0 };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(30000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  if (mode === '--media64') {
    await context.addInitScript(observeMediaMemory);
    const cdp = await context.browser().newBrowserCDPSession(), execute = promisify(execFile);
    report.memory = { samples: [], measurement: 'sum of WorkingSet64 for this test browser CDP process IDs; sampled, not a hard peak', privateMeasurement: 'PrivateMemorySize64 by the same CDP process IDs; not equivalent to resident bytes' };
    processMemory = async () => {
      const { processInfo } = await cdp.send('SystemInfo.getProcessInfo');
      const types = new Map(processInfo.filter(p => Number.isSafeInteger(p.id) && p.id > 0).map(p => [p.id, /^[a-zA-Z0-9 _-]{1,64}$/.test(p.type) ? p.type : 'other']));
      const ids = [...types.keys()]; assert(ids.length);
      const { stdout } = await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `@(Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id, WorkingSet64, PrivateMemorySize64) | ConvertTo-Json -Compress`], { windowsHide: true });
      const parsed = JSON.parse(stdout), processes = (Array.isArray(parsed) ? parsed : [parsed]).map(p => ({ id: p.Id, type: types.get(p.Id), bytes: p.WorkingSet64, privateBytes: p.PrivateMemorySize64 }));
      assert(processes.length && new Set(processes.map(p => p.id)).size === processes.length);
      const byType = {};
      for (const p of processes) {
        assert(types.has(p.id) && Number.isSafeInteger(p.bytes) && p.bytes >= 0 && Number.isSafeInteger(p.privateBytes) && p.privateBytes >= 0);
        const group = byType[p.type] ??= { count: 0, bytes: 0, privateBytes: 0 }; group.count++; group.bytes += p.bytes; group.privateBytes += p.privateBytes;
      }
      const bytes = processes.reduce((sum, p) => sum + p.bytes, 0), privateBytes = processes.reduce((sum, p) => sum + p.privateBytes, 0);
      assert(bytes > 0 && bytes === Object.values(byType).reduce((sum, p) => sum + p.bytes, 0));
      return { elapsedMs: Date.now(), bytes, privateBytes, processes, byType, missingProcessCount: ids.length - processes.length };
    };
    monitoring = true;
    sampling = (async () => {
      while (monitoring) {
        report.memory.samples.push(await processMemory());
        await new Promise(r => setTimeout(r, 500));
      }
    })();
    sampling.catch(() => {});
  }
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  if (diagnostics) {
    const probe = await context.newPage(); await probe.goto(origin + '/probe/index.html'); await probe.locator('#source').setInputFiles(pptxPath);
    await probe.waitForFunction(() => typeof window.run === 'function');
    report.nativeProbe = await probe.evaluate(() => window.run()); await probe.close();
  }
  const page = async (role, id) => { const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p; };
  const send = (p, value) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), value);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Read-only corpus entry-limit verification' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id), remote = await page('remote', id), player = await page('player', id);
  const session = async () => (await send(editor, { type: 'GET_SESSION', sessionId: id })).session;
  const command = async (type, documentId, slideId = null, extra = {}) => {
    if (['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT'].includes(type) && (await session()).documents[documentId]?.source.type === 'pptx') return presentPptx(remote, documentId, slideId);
    const commandId = crypto.randomUUID();
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, revision: (await session()).revision, commandId, ...extra } });
      if (result.ok) return;
      if (result.code !== 'STALE_REVISION') assert.fail(`${type}: ${result.code}`);
    }
    assert.fail(`${type}: repeated stale revision`);
  };
  const metrics = mode === '--media64' ? await Promise.all([editor, player].map(async page => {
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable'); return cdp;
  })) : [];
  const phase = async name => {
    if (!report.memory) return;
    const observed = await Promise.all(metrics.map(async cdp => {
      const values = (await cdp.send('Performance.getMetrics')).metrics;
      const heap = await cdp.send('Runtime.getHeapUsage');
      return { ...Object.fromEntries(values.filter(value => ['JSHeapUsedSize', 'JSHeapTotalSize', 'Documents', 'Nodes'].includes(value.name)).map(value => [value.name, value.value])), heap };
    }));
    const media = await Promise.all([editor, player].map(page => page.evaluate(() => window.__mediaMemory())));
    (report.memory.phases ??= []).push({ name, at: Date.now(), processMemory: await processMemory(), contexts: { editor: observed[0], player: observed[1] }, media: { editor: media[0], player: media[1] } });
  };
  await editor.locator('#pdf-import').setInputFiles(pdfPath);
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const doc = Object.values((await session()).documents).find(doc => doc.source.type === 'pdf'); assert(doc);
  await command('ACTIVATE_DOCUMENT', doc.id);
  const waitSlide = slideId => player.waitForFunction(id => { const c = document.querySelector('canvas[aria-label="발표 자료"]'); return c?.width > 1 && c.dataset.slideId === id; }, slideId);
  const pixels = () => player.locator('canvas[aria-label="발표 자료"]').evaluate(async canvas => {
    const bytes = new TextEncoder().encode(canvas.toDataURL());
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(n => n.toString(16).padStart(2, '0')).join('');
  });
  await waitSlide(doc.slideIds[0]); const before = await session(), beforePixels = await pixels();
  await phase('reference-pdf-active');
  const baselineAssetBytes = mode === '--media64' ? await editor.evaluate(() => window.__assetBytes()) : 0;
  await editor.locator('#experimental-pptx-import').check(); await editor.locator('#pdf-import').setInputFiles(pptxPath);
  if (mode === '--media64') {
    await editor.waitForFunction(() => !document.getElementById('pdf-import').disabled);
    const registered = Object.values((await session()).documents).find(d => d.source.type === 'pptx');
    assert(registered, 'PPTX registration failed after media allowance'); assert.equal(registered.slideIds.length, doc.slideIds.length);
    assert.deepEqual((await session()).presentedSelection, before.presentedSelection); assert.equal(await pixels(), beforePixels);
    await editor.locator('#editor-document').selectOption(registered.id);
    const waitPreview = id => editor.waitForFunction(id => document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === id, id);
    await waitPreview(registered.slideIds[0]);
    await phase('pptx-registered-private-preview');
    report.largeMedia = { registered: true, privateModelPrepared: true, sampledSlides: [] };
    for (const pageNumber of [1, 26, 52, 3]) {
      await editor.locator('#editor-slide').selectOption(registered.slideIds[pageNumber - 1]); await waitPreview(registered.slideIds[pageNumber - 1]);
      report.largeMedia.sampledSlides.push(pageNumber);
    }
    await editor.getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true }).click();
    await editor.waitForFunction(() => [...document.querySelectorAll('button')].some(button => button.textContent === '이 쪽의 내장 미디어 연결·재연결' && !button.disabled));
    const statuses = await editor.getByRole('status').allTextContents();
    report.largeMedia.connectionErrorCodes = statuses.flatMap(text => text.match(/PPTX_[A-Z_]+/g) ?? []);
    const connected = statuses.some(text => /내장 미디어 \d+개 등록/.test(text));
    assert(connected, 'Product embedded media connection must succeed');
    report.largeMedia.manualConnection = connected;
    report.largeMedia.productAudioConnectionVerified = connected;
    await phase('large-media-connected-privately');
    report.largeMedia.editorParserCallsAcrossPages = await editor.evaluate(() => window.__mediaMemory().parsers.presentation ?? 0);
    assert.equal(report.largeMedia.editorParserCallsAcrossPages, 1, 'One selected PPTX document must retain its source across private page navigation');
    report.largeMedia.editorLargeMediaReads = await editor.evaluate(() => Object.entries(window.__mediaMemory().reads).filter(([key]) => Number(key.split('/')[0]) > 32 * 1024 * 1024 && key.includes('/audio/')).reduce((sum, [, value]) => sum + value.calls, 0));
    assert.equal(report.largeMedia.editorLargeMediaReads, 1, 'Same guarded media Blob/File identity must be reused across registration, source settings and metadata probe');
    report.largeMedia.acceptanceScope = 'registration, model/sample render, product media registration/native muted playback, source and audience preservation; full fidelity remains unverified';
    if (connected) {
    const linked = Object.values((await session()).documents[registered.id].localMedia ?? {}).filter(ref => ref.slideId === registered.slideIds[2] && ref.size > 32 * 1024 * 1024);
    assert.equal(linked.length, 1); assert(linked[0].durationSec > 0);
    report.largeMedia.nativeMetadata = { bytes: linked[0].size, durationSec: linked[0].durationSec, mime: linked[0].mime };
    }
    assert.deepEqual((await session()).presentedSelection, before.presentedSelection); assert.equal(await pixels(), beforePixels);
    // A separate Player model/Blob owner must also accept the same large asset.
    await command('ACTIVATE_DOCUMENT', registered.id); await phase('pptx-first-page-prepared-and-committed');
    await command('GOTO_SLIDE', registered.id, registered.slideIds[2]); await phase('pptx-media-page-prepared-and-committed');
    const assetPhases = report.memory.phases;
    const modelAssets = assetPhases.find(value => value.name === 'pptx-first-page-prepared-and-committed').media.player;
    const nativeAssets = assetPhases.find(value => value.name === 'pptx-media-page-prepared-and-committed').media.player;
    assert.equal(nativeAssets.assetBytes, modelAssets.assetBytes, 'Embedded native media must borrow the already-owned source URL');
    assert.equal(nativeAssets.assetCount, modelAssets.assetCount);
    report.largeMedia.sourceOwnedUrlReused = { modelBytes: modelAssets.assetBytes, nativeBytes: nativeAssets.assetBytes, modelCount: modelAssets.assetCount, nativeCount: nativeAssets.assetCount };
    await player.waitForFunction(id => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === id, registered.slideIds[2]);
    if (connected) {
      await player.waitForFunction(() => [...(document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelectorAll('audio') ?? [])].some(a => a.readyState >= 1 && a.duration > 0));
      report.largeMedia.playerNativeMetadata = true;
      const media = Object.values((await session()).documents[registered.id].localMedia).find(ref => ref.size > 32 * 1024 * 1024);
      await command('SET_MEDIA_PLAYBACK', registered.id, registered.slideIds[2], { mediaId: media.id, playback: { startSec: 0, endSec: media.durationSec, volume: 0, muted: true } });
      await command('PLAY_MEDIA', registered.id, registered.slideIds[2], { mediaId: media.id });
      await player.waitForFunction(() => [...document.querySelector('.pptx-audience-stage').shadowRoot.querySelectorAll('audio')].some(a => !a.paused && a.muted && a.currentTime > .2));
      const nativeTime = await player.evaluate(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio').currentTime);
      await command('PAUSE_MEDIA', registered.id, registered.slideIds[2], { mediaId: media.id });
      await player.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio')?.paused);
      report.largeMedia.mutedNativePlayback = { progressed: nativeTime, pausedByRemote: true };
      await phase('native-audio-played-and-paused');
    }
    await command('ACTIVATE_DOCUMENT', doc.id); await waitSlide(doc.slideIds[0]);
    await phase('returned-to-pdf');
    await editor.locator('#editor-document').selectOption(doc.id);
    await editor.waitForFunction(limit => window.__assetBytes() <= limit, baselineAssetBytes);
    report.largeMedia.editorAssetBytesAfterRelease = await editor.evaluate(() => window.__assetBytes());
    await phase('private-pptx-assets-released');
    await new Promise(resolve => setTimeout(resolve, 1000)); await phase('released-idle-one-second');
    await new Promise(resolve => setTimeout(resolve, 4000)); await phase('released-idle-five-seconds');
    await waitSlide(doc.slideIds[0]);
    report.pdfReturnWorks = true; report.pdfBeforeAndAfterPptxFailureUnchanged = false;
    report.pptxRegistered = true; report.visualComparison = 'model-and-sampled-render-only';
  } else {
  const message = mode === '--baseline' ? 'PPTX_ENTRY_LIMIT' : '내장 파일이나 문서 구조가 안전하게 읽을 수 있는';
  await editor.getByRole('status').filter({ hasText: message }).waitFor();
  const after = await session(); assert.deepEqual(after, before); assert.equal(await pixels(), beforePixels);
  assert.equal(Object.values(after.documents).filter(d => d.source.type === 'pptx').length, 0);
  if (mode !== '--baseline') {
    const status = await editor.getByRole('status').filter({ hasText: message }).textContent();
    assert(status.includes('PDF')); assert(status.includes('원본')); assert(!status.includes('PPTX_ENTRY_LIMIT'));
    report.safeMessage = status;
  }
  report.referencePdf = { pages: doc.slideIds.length, sampledPages: [] };
  for (const pageNumber of [...new Set([1, Math.ceil(doc.slideIds.length / 2), doc.slideIds.length])]) {
    const slideId = doc.slideIds[pageNumber - 1]; await command('GOTO_SLIDE', doc.id, slideId); await waitSlide(slideId);
    report.referencePdf.sampledPages.push({ pageNumber, pixelSha256: await pixels() });
  }
  report.pdfBeforeAndAfterPptxFailureUnchanged = true; report.failedImportSessionUnchanged = true;
  report.pptxRegistered = false; report.visualComparison = 'blocked-by-entry-limit';
  }
  report.environment = await player.evaluate(() => navigator.userAgent);
  report.originalsUnchanged = fingerprints.pptx === await hash(pptxPath) && fingerprints.pdf === await hash(pdfPath);
  assert(report.originalsUnchanged); assert.deepEqual(errors, []); assert.equal(report.externalRequests, 0); report.pass = true;
} catch (error) { report.failure = error.stack; throw error; }
finally {
  monitoring = false;
  if (sampling) {
    try { await sampling; report.memory.sampledPeakBytes = Math.max(...report.memory.samples.map(s => s.bytes), ...(report.memory.phases ?? []).map(p => p.processMemory.bytes)); assert(report.memory.sampledPeakBytes <= 1.5 * 1024 ** 3, 'Test-browser sampled WorkingSet exceeds 1.5GiB experimental budget'); }
    catch (error) { report.pass = false; report.memory.failure = error.message; process.exitCode = 1; }
  }
  report.errors = errors; await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, pass: report.pass, failure: report.failure, sampledPeakBytes: report.memory?.sampledPeakBytes }));
}
