import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
assert(teacherPath, 'Pass Playwright, Whale and read-only teacher PPTX.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const hash = async () => createHash('sha256').update(await readFile(teacherPath)).digest('hex'), originalHash = await hash();
const output = resolve('node_modules/.cache/whale-prepared-scene', String(Date.now())), extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
let context; const report = { productUi: true, rendererReplaced: false, externalRequests: 0, pageErrors: [] };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(20000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, id) => { const p = await context.newPage(); p.on('pageerror', e => report.pageErrors.push(e.message)); await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p; };
  const send = (p, request) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), request);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic prepared scene lesson' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id), remote = await page('remote', id), player = await page('player', id);
  const session = async () => { const result = await send(editor, { type: 'GET_SESSION', sessionId: id }); assert(result.ok); return result.session; };
  const command = async (type, documentId, slideId = null, extra = {}) => {
    const commandId = crypto.randomUUID();
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, ...extra, revision: (await session()).revision, commandId } });
      if (response.ok || response.code !== 'STALE_REVISION') { assert(response.ok, response.error); return; }
    }
    assert.fail('Repeated stale revision');
  };
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-current.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('A', 2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor(); const pdf = (await session()).documentOrder[0];
  await command('ACTIVATE_DOCUMENT', pdf); await player.locator('canvas[aria-label="발표 자료"]').waitFor();
  await editor.locator('#experimental-pptx-import').check(); await editor.locator('#pdf-import').setInputFiles(teacherPath);
  await editor.waitForFunction(() => !document.getElementById('pdf-import').disabled);
  const pptx = Object.values((await session()).documents).find(d => d.source.type === 'pptx'); assert(pptx);
  await editor.locator('#editor-document').selectOption(pdf); const pdfSlide = (await session()).documents[pdf].slideIds[0]; await editor.locator('#editor-slide').selectOption(pdfSlide);
  const wav = Buffer.alloc(44 + 8000 * 60 * 2); wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  await editor.locator('#local-media-input').setInputFiles({ name: 'Synthetic-current.wav', mimeType: 'audio/wav', buffer: wav });
  let media;
  for (let i = 0; i < 100 && !media; i++) { media = Object.values((await session()).documents[pdf].localMedia ?? {})[0]; if (!media) await new Promise(r => setTimeout(r, 50)); }
  assert(media); await remote.getByRole('button', { name: 'Synthetic-current.wav 음소거', exact: true }).click();
  await command('PLAY_MEDIA', pdf, pdfSlide, { mediaId: media.id });
  await player.waitForFunction(() => { const audio = document.querySelector('audio'); return audio?.muted && !audio.paused && audio.currentTime > .1; });
  // Actual SourceVault validation must leave the native queue on UI cancellation.
  await editor.evaluate(() => {
    window.releasePreparationGate = null;
    void navigator.locks.request('naver-ppt-pptx-preparation-v1', () => new Promise(resolve => { window.releasePreparationGate = resolve; }));
  });
  await editor.waitForFunction(() => typeof window.releasePreparationGate === 'function');
  await player.evaluate(size => {
    window.originalQueuedFileRead = File.prototype.arrayBuffer; window.queuedPptxReads = 0;
    File.prototype.arrayBuffer = function (...args) { if (this.size === size) window.queuedPptxReads++; return window.originalQueuedFileRead.apply(this, args); };
    window.OriginalQueuedWorker = window.Worker; window.queuedWorkers = 0;
    window.Worker = class extends window.OriginalQueuedWorker { constructor(...args) { super(...args); window.queuedWorkers++; } };
  }, pptx.source.size);
  const queuedPdfSelection = (await session()).presentedSelection;
  const queuedAudioTime = await player.evaluate(() => document.querySelector('audio').currentTime);
  await remote.locator('#remote-document').selectOption(pptx.id); await remote.locator('#remote-slide').selectOption(pptx.slideIds[2]);
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await player.waitForFunction(async () => (await navigator.locks.query()).pending.some(lock => lock.name === 'naver-ppt-pptx-preparation-v1'));
  assert.deepEqual((await session()).presentedSelection, queuedPdfSelection);
  assert.deepEqual(await player.evaluate(() => ({ reads: window.queuedPptxReads, workers: window.queuedWorkers })), { reads: 0, workers: 0 });
  await remote.getByRole('button', { name: '전환 확인 취소', exact: true }).click();
  await player.waitForFunction(async () => !(await navigator.locks.query()).pending.some(lock => lock.name === 'naver-ppt-pptx-preparation-v1'));
  assert.deepEqual((await session()).presentedSelection, queuedPdfSelection);
  assert(await player.evaluate(before => { const audio = document.querySelector('audio'); return !audio.paused && audio.currentTime > before; }, queuedAudioTime));
  await editor.evaluate(() => window.releasePreparationGate());
  await player.evaluate(() => { File.prototype.arrayBuffer = window.originalQueuedFileRead; window.Worker = window.OriginalQueuedWorker; });
  report.queuedSourceReconnectCancelled = { actualRemoteUi: true, nativeGateQueueRemoved: true, pptxReads: 0, workers: 0, currentPdfAndAudioPreserved: true };
  await player.evaluate(() => {
    window.oldAudio = document.querySelector('audio'); window.OldWorker = window.Worker; window.held = [];
    window.Worker = class extends window.OldWorker {
      postMessage(value, transfer) { if (value?.mode !== 'presentation') return super.postMessage(value, transfer); window.held.push(() => window.OldWorker.prototype.postMessage.call(this, value, transfer)); }
    };
    window.prepared = null;
    window.observer = new MutationObserver(() => {
      const host = document.querySelector('.pptx-preparing-stage');
      if (host?.shadowRoot?.querySelector('[data-slide-id]')) window.prepared = { host, surface: host.shadowRoot.querySelector('[data-slide-id]') };
    });
    window.observer.observe(document.querySelector('.player-scenes'), { subtree: true, attributes: true, childList: true });
  });
  const pixels = await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL());
  await remote.locator('#remote-document').selectOption(pptx.id); await remote.locator('#remote-slide').selectOption(pptx.slideIds[2]);
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await player.waitForFunction(() => window.held.length > 0);
  const pending = (await session()).presentationTransition; assert(pending);
  for (const type of ['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT']) {
    const before = await session();
    const response = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId: pptx.id,
      slideId: type === 'GOTO_SLIDE' ? pptx.slideIds[2] : null, revision: before.revision, commandId: crypto.randomUUID() } });
    assert.equal(response.code, 'PRESENTATION_PREPARATION_REQUIRED');
    const after = await session(); assert.deepEqual(after.presentationTransition, before.presentationTransition); assert.deepEqual(after.presentedSelection, before.presentedSelection);
  }
  report.directTransitionsCannotBypassPending = true;
  const cdp = await context.newCDPSession(remote), versions = [];
  cdp.on('ServiceWorker.workerVersionUpdated', event => versions.push(...event.versions)); await cdp.send('ServiceWorker.enable');
  for (let i = 0; i < 50 && !versions.some(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); i++) await new Promise(r => setTimeout(r, 100));
  const own = versions.find(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); assert(own);
  await cdp.send('ServiceWorker.stopWorker', { versionId: own.versionId });
  assert.equal((await session()).presentationTransition.requestId, pending.requestId);
  const time = await player.evaluate(() => window.oldAudio.currentTime);
  await player.waitForFunction(time => window.oldAudio === document.querySelector('audio') && !window.oldAudio.paused && window.oldAudio.currentTime > time + .2, time);
  assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  assert.equal(await player.locator('.player-scene[data-active="false"]').evaluate(node => getComputedStyle(node).visibility), 'hidden');
  report.workerRestartAndCurrentNativePlaybackPreserved = true;
  await player.evaluate(() => {
    const api = window.whale ?? chrome, send = api.runtime.sendMessage.bind(api.runtime); window.commitCount = 0;
    api.runtime.sendMessage = async (...args) => {
      const request = args[0], result = await send(...args);
      if (request?.command?.type === 'COMMIT_PRESENTATION') { window.commitCount++; if (window.commitCount === 1) throw Error('Synthetic lost commit acknowledgement'); }
      return result;
    };
    for (const release of window.held) release(); window.Worker = window.OldWorker;
  });
  await player.waitForFunction(slide => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === slide, pptx.slideIds[2]);
  assert.equal(await player.evaluate(() => {
    const host = document.querySelector('.pptx-audience-stage'); window.observer.disconnect();
    return window.prepared?.host === host && window.prepared.surface === host.shadowRoot.querySelector('[data-slide-id]') && window.oldAudio.paused && !window.oldAudio.isConnected && window.commitCount === 1;
  }), true);
  assert.equal((await session()).presentationTransition, null); report.lostCommitAckReconciledWithoutRemount = true;
  const beforeAuto = await session(), auto = await send(player, { type: 'SESSION_COMMAND', command: { type: 'ADVANCE_AUTOPLAY', sessionId: id,
    documentId: pptx.id, slideId: pptx.slideIds[2], revision: beforeAuto.revision, commandId: crypto.randomUUID(), epoch: 'Synthetic-auto' } });
  assert.equal(auto.code, 'PRESENTATION_PREPARATION_REQUIRED'); assert.deepEqual(await session(), beforeAuto); report.pptxAutoplayBypassDenied = true;
  // A same-page request uses the existing active scene; it must not deadlock.
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '준비한 페이지로 전환했습니다.' }).waitFor();
  for (let i = 0; i < 100 && (await session()).presentationTransition; i++) await new Promise(r => setTimeout(r, 50));
  assert.equal((await session()).presentationTransition, null); report.samePageRequestSettles = true;
  // Closing the owner during preparation leaves the old intent held by a new context.
  await command('ACTIVATE_DOCUMENT', pdf);
  await player.waitForFunction(() => !!document.querySelector('.pdf-stage canvas')?.width);
  await player.evaluate(() => { window.Worker = class extends window.OldWorker { postMessage(value, transfer) { if (value?.mode !== 'presentation') super.postMessage(value, transfer); } }; });
  await remote.locator('#remote-slide').selectOption(pptx.slideIds[3]); await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await player.locator('.pptx-preparing-stage').waitFor({ state: 'attached' });
  const historical = (await session()).presentationTransition; assert(historical); await player.close();
  const replacement = await page('player', id); await replacement.locator('canvas[aria-label="발표 자료"]').waitFor();
  assert.equal((await session()).presentationTransition.requestId, historical.requestId);
  assert.equal(await replacement.locator('.pptx-preparing-stage').count(), 0);
  await remote.getByRole('button', { name: '전환 확인 취소', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '전환이 적용되지 않았습니다.' }).waitFor();
  assert.equal((await session()).presentationTransition, null); report.replacementHoldsHistoricalRequestAndRemoteCancels = true;
  // With every source-holding window closed, a missing original must keep PDF visible.
  await editor.close();
  const retained = await send(remote, { type: 'GET_SESSION', sessionId: id }); assert(retained.ok);
  const missingPixels = await replacement.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL());
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '전환이 적용되지 않았습니다.' }).waitFor();
  const missing = await send(remote, { type: 'GET_SESSION', sessionId: id }); assert(missing.ok);
  assert.deepEqual(missing.session.presentedSelection, retained.session.presentedSelection);
  assert.equal(await replacement.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), missingPixels);
  assert.equal(await replacement.locator('.pptx-preparing-stage').count(), 0); report.missingSourceKeepsPdf = true;
  const reconnect = await page('editor', id);
  await reconnect.locator('#experimental-pptx-import').check(); await reconnect.locator('#editor-document').selectOption(pptx.id);
  await reconnect.waitForFunction(documentId => document.getElementById('editor-document')?.value === documentId && !document.getElementById('pdf-reconnect')?.disabled, pptx.id);
  await reconnect.locator('#pdf-reconnect').setInputFiles(teacherPath);
  await reconnect.getByRole('status').filter({ hasText: '같은 원본을 다시 연결했습니다.' }).waitFor();
  const closing = await send(remote, { type: 'GET_SESSION', sessionId: id }); assert(closing.ok);
  assert((await send(remote, { type: 'CLOSE_ALL_DOCUMENTS', sessionId: id, revision: closing.session.revision, commandId: crypto.randomUUID(), blobUrl: null,
    choices: closing.session.documentOrder.map(documentId => ({ documentId, decision: 'without-backup' })) })).ok);
  await replacement.getByRole('heading', { name: '발표 대기', exact: true }).waitFor();
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await replacement.waitForFunction(slide => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === slide, pptx.slideIds[3]);
  const reopened = await send(remote, { type: 'GET_SESSION', sessionId: id }); assert(reopened.ok);
  assert.equal(reopened.session.documents[pptx.id].closed, false); assert.equal(reopened.session.documents[pdf].closed, true);
  assert.deepEqual(reopened.session.presentedSelection, { documentId: pptx.id, slideId: pptx.slideIds[3] });
  report.reconnectedClosedTargetExplicitPageFromStandby = true;
  assert.equal(await hash(), originalHash); assert.deepEqual(report.pageErrors, []); assert.equal(report.externalRequests, 0);
  report.whale = await context.browser().version(); report.originalHashUnchanged = true; report.pass = true;
} catch (error) {
  report.failure = error.stack;
  report.statuses = await Promise.all((context?.pages() ?? []).filter(p => !p.isClosed()).map(async p => ({ role: new URL(p.url()).pathname, status: await p.getByRole('status').allTextContents().catch(() => []) })));
  throw error;
}
finally { await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, pass: report.pass, failure: report.failure })); }
