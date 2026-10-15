import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
assert(teacherPath, 'Pass Playwright, Whale and read-only teacher PPTX.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const hash = async path => createHash('sha256').update(await readFile(path)).digest('hex'), originalHash = await hash(teacherPath);
const output = resolve('node_modules/.cache/whale-presentation-transition', String(Date.now())), extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
const report = { productRpc: true, playerPreparationIntegrated: true, manualCommitContractOnly: true, automaticPreparationHeldForContractAssertions: true, externalRequests: 0, pageErrors: [] }; let context;
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', '--autoplay-policy=no-user-gesture-required', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(20000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, id) => {
    const p = await context.newPage(); p.on('pageerror', e => report.pageErrors.push(e.message));
    if (role === 'player') await p.addInitScript(() => {
      const Original = window.Worker; window.contractHeldWorkers = [];
      window.Worker = class extends Original {
        postMessage(value, transfer) {
          if (value?.mode !== 'presentation') return super.postMessage(value, transfer);
          window.contractHeldWorkers.push(() => Original.prototype.postMessage.call(this, value, transfer));
        }
      };
    });
    await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p;
  };
  const send = (p, request) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), request);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic transition contract lesson' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id), remote = await page('remote', id);
  const session = async () => { const value = await send(editor, { type: 'GET_SESSION', sessionId: id }); assert(value.ok); return value.session; };
  const command = async (p, type, documentId, slideId = null, extra = {}) => {
    const commandId = extra.commandId ?? crypto.randomUUID();
    for (let attempt = 0; attempt < 4; attempt++) {
      const result = await send(p, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, ...extra, revision: (await session()).revision, commandId } });
      if (result.ok || result.code !== 'STALE_REVISION') return result;
    }
    assert.fail('Repeated stale revision');
  };
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-current.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('A', 2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor(); const pdf = Object.values((await session()).documents).find(d => d.source.type === 'pdf'); assert(pdf);
  assert((await command(remote, 'ACTIVATE_DOCUMENT', pdf.id)).ok);
  let player = await page('player', id); await player.locator('canvas[aria-label="발표 자료"]').waitFor();
  await editor.locator('#experimental-pptx-import').check(); await editor.locator('#pdf-import').setInputFiles(teacherPath);
  await editor.waitForFunction(() => !document.getElementById('pdf-import').disabled);
  const pptx = Object.values((await session()).documents).find(d => d.source.type === 'pptx'); assert(pptx);
  assert((await command(editor, 'SET_PRESENTER_NOTE', pptx.id, pptx.slideIds[2], { note: 'Synthetic private transition marker' })).ok);
  await editor.locator('#editor-document').selectOption(pdf.id); await editor.locator('#editor-slide').selectOption(pdf.slideIds[0]);
  const wav = Buffer.alloc(44 + 8000 * 12 * 2); wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  await editor.locator('#local-media-input').setInputFiles({ name: 'Synthetic-current.wav', mimeType: 'audio/wav', buffer: wav });
  let media;
  for (let i = 0; i < 100 && !media; i++) { media = Object.values((await session()).documents[pdf.id].localMedia ?? {})[0]; if (!media) await new Promise(r => setTimeout(r, 50)); }
  assert(media); await remote.getByRole('button', { name: 'Synthetic-current.wav 음소거', exact: true }).click();
  assert((await command(remote, 'PLAY_MEDIA', pdf.id, pdf.slideIds[0], { mediaId: media.id })).ok);
  await player.waitForFunction(() => { const audio = document.querySelector('audio'); return audio?.muted && !audio.paused && audio.currentTime > .1; });
  const claimed = await send(player, { type: 'CLAIM_PLAYER', sessionId: id }); assert(claimed.ok && claimed.owned);
  const playerContextId = async () => player.evaluate(async () => (await chrome.runtime.getContexts({ contextTypes: ['TAB'] })).find(c => c.documentUrl === location.href)?.documentId);
  const ownerId = await playerContextId(); assert(ownerId);
  const before = await session(), pixels = await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL());
  const request = async (playerId, slideId = pptx.slideIds[2]) => {
    const requestId = crypto.randomUUID(); assert((await command(remote, 'REQUEST_PRESENTATION', pptx.id, slideId, { playerId, commandId: requestId })).ok); return requestId;
  };
  const requestId = await request(ownerId), pending = await session();
  assert.deepEqual(pending.presentedSelection, before.presentedSelection); assert.deepEqual(pending.documents[pptx.id], before.documents[pptx.id]); assert.deepEqual(pending.documents[pdf.id].localMedia, before.documents[pdf.id].localMedia); assert.deepEqual(pending.editorSelection, before.editorSelection);
  assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  assert.equal(pending.presentationTransition.requestId, requestId);
  const targetRequest = { type: 'GET_PRESENTATION_TARGET', sessionId: id, requestId, playerId: ownerId };
  const target = await send(player, targetRequest); assert(target.ok && target.kind === 'transition-target');
  assert.deepEqual(target.target.selection, { documentId: pptx.id, slideId: pptx.slideIds[2] }); assert.equal(target.target.autoplay, null); assert.deepEqual(target.target.timers, []);
  assert(!JSON.stringify(target).includes('Synthetic private transition marker')); assert(!JSON.stringify(target).includes(pptx.source.name)); assert.deepEqual((await session()).presentedSelection, before.presentedSelection);
  assert.equal((await send(remote, targetRequest)).ok, false); assert.equal((await send(editor, targetRequest)).ok, false); report.targetProjectionIsPrivateNoteFreeAndDoesNotActivate = true;
  assert.equal((await command(remote, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId })).ok, false);
  assert.equal((await command(editor, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId })).ok, false);
  const duplicate = await page('player', id); await duplicate.getByRole('status').filter({ hasText: '다른 발표 창이 실행 중입니다.' }).waitFor();
  assert.equal((await send(duplicate, targetRequest)).ok, false);
  assert.equal((await command(duplicate, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId })).ok, false);
  report.requestPreservesCurrentPdfAndDeltas = true; report.teacherAndDuplicatePlayerDenied = true;
  const cdp = await context.newCDPSession(remote), versions = [];
  cdp.on('ServiceWorker.workerVersionUpdated', event => versions.push(...event.versions)); await cdp.send('ServiceWorker.enable');
  for (let i = 0; i < 50 && !versions.some(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); i++) await new Promise(r => setTimeout(r, 100));
  const own = versions.find(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); assert(own);
  await cdp.send('ServiceWorker.stopWorker', { versionId: own.versionId });
  assert.equal((await session()).presentationTransition.requestId, requestId); report.workerRestartKeepsPendingAndCurrent = true;
  const audioBefore = await player.evaluate(() => document.querySelector('audio').currentTime); await player.waitForFunction(time => { const audio = document.querySelector('audio'); return audio && !audio.paused && audio.currentTime > time + .1; }, audioBefore);
  report.currentMutedAudioContinuesDuringPendingAndWorkerRestart = true;
  assert((await command(remote, 'CANCEL_PRESENTATION', pptx.id, pptx.slideIds[2], { requestId })).ok);
  assert.equal((await send(player, targetRequest)).ok, false);
  assert.equal((await command(player, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId })).ok, false);
  assert.deepEqual((await session()).presentedSelection, before.presentedSelection); assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels); report.cancelRejectsLateCommit = true;
  const rejected = await request(ownerId); assert((await command(player, 'REJECT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId: rejected })).ok); assert.equal((await session()).presentationTransition, null); report.rejectPreservesCurrent = true;
  const historical = await request(ownerId); await player.close();
  player = duplicate; assert((await send(player, { type: 'CLAIM_PLAYER', sessionId: id })).owned);
  const newOwnerId = await playerContextId(); assert(newOwnerId && newOwnerId !== ownerId);
  assert.equal((await command(player, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: ownerId, requestId: historical })).ok, false);
  assert.equal((await command(player, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[2], { playerId: newOwnerId, requestId: historical })).ok, false);
  assert((await command(remote, 'CANCEL_PRESENTATION', pptx.id, pptx.slideIds[2], { requestId: historical })).ok); report.replacementOwnerCannotCommitHistoricalIntent = true;
  const fresh = await request(newOwnerId), commitCommand = { type: 'COMMIT_PRESENTATION', sessionId: id, documentId: pptx.id, slideId: pptx.slideIds[2], playerId: newOwnerId, requestId: fresh, revision: (await session()).revision, commandId: crypto.randomUUID() };
  assert((await send(player, { type: 'SESSION_COMMAND', command: commitCommand })).ok);
  const committed = await session(); assert.deepEqual(committed.presentedSelection, { documentId: pptx.id, slideId: pptx.slideIds[2] }); assert.equal(committed.presentationTransition, null);
  assert((await send(player, { type: 'SESSION_COMMAND', command: commitCommand })).ok); assert.deepEqual((await session()).presentedSelection, committed.presentedSelection); assert.deepEqual((await session()).documents[pptx.id], committed.documents[pptx.id]); report.commitAtomicAndDuplicateDoesNotReapply = true;
  // The contract intentionally commits manually. Release parsing only after its assertions.
  await player.waitForFunction(() => window.contractHeldWorkers.length > 0);
  await player.evaluate(() => { for (const release of window.contractHeldWorkers.splice(0)) { try { release(); } catch {} } });
  await player.waitForFunction(slideId => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === slideId, pptx.slideIds[2]);
  const closing = await command(remote, 'CLOSE_DOCUMENT', pptx.id); assert.equal(closing.ok, false); // Existing close API requires a separate choice.
  const close = await send(remote, { type: 'CLOSE_CURRENT_DOCUMENT', command: { type: 'CLOSE_DOCUMENT', sessionId: id, documentId: pptx.id, slideId: null, revision: (await session()).revision, commandId: crypto.randomUUID() }, decision: 'without-backup', blobUrl: null }); assert(close.ok);
  assert.equal((await session()).presentedSelection, null);
  const reopen = await request(newOwnerId, pptx.slideIds[1]); assert((await command(player, 'COMMIT_PRESENTATION', pptx.id, pptx.slideIds[1], { playerId: newOwnerId, requestId: reopen })).ok);
  assert.equal((await session()).documents[pptx.id].closed, false); assert.equal((await session()).presentedSelection.slideId, pptx.slideIds[1]); report.closedTargetReopensAtExplicitPage = true;
  const backupPending = await request(newOwnerId); const original = await session();
  const imported = await send(launcher, { type: 'IMPORT_SESSION', bundle: { format: 'whale-class-presenter', schemaVersion: 1, exportedAt: Date.now(), session: original } }); assert(imported.ok);
  assert.equal(imported.session.presentationTransition, null); assert.equal(imported.session.presentedSelection, null); assert.notEqual(imported.session.id, id); assert.equal((await session()).presentationTransition.requestId, backupPending); report.newBackupSessionDropsPendingWithoutChangingOriginal = true;
  assert((await command(remote, 'CANCEL_PRESENTATION', pptx.id, pptx.slideIds[2], { requestId: backupPending })).ok);
  report.originalUnchanged = originalHash === await hash(teacherPath); assert(report.originalUnchanged); assert.equal(report.externalRequests, 0); assert.deepEqual(report.pageErrors, []);
  report.environment = await player.evaluate(() => navigator.userAgent); report.pass = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, ...report })); }
