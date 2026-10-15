import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';
import { presentPptx } from './presentation-ui.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
if (!teacherPath) throw Error('Pass Playwright, Whale and local teacher-01.pptx.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const hash = createHash('sha256').update(await readFile(teacherPath)).digest('hex');
const output = resolve('node_modules/.cache/whale-pptx-player', String(Date.now())), profile = resolve(output, 'profile'), extension = resolve(output, 'extension');
await mkdir(output, { recursive: true }); await cp(resolve('dist'), extension, { recursive: true });
const changedReconnectPath = resolve(output, 'Synthetic-changed.pptx'); await writeFile(changedReconnectPath, Buffer.concat([await readFile(teacherPath), Buffer.from([0])]));
let context; const errors = [], report = { profile, productPlayer: true, injectedRenderer: false };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(20000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r,250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const page = async (role, id) => { const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(`${origin}/${role}/index.html${id ? '?sessionId=' + id : ''}`); return p; };
  const send = (p, request) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), request);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic product PPTX lesson' }); assert(created.ok);
  const sessionId = created.session.id, editor = await page('editor', sessionId), remote = await page('remote', sessionId), player = await page('player', sessionId);
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-B.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('B',2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const teacher = async () => { const r = await send(editor, { type: 'GET_SESSION', sessionId }); assert(r.ok); return r.session; };
  const b = (await teacher()).documentOrder[0];
  assert((await send(remote, { type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId, documentId: b, slideId: null, revision: (await teacher()).revision, commandId: crypto.randomUUID() } })).ok);
  await player.waitForFunction(() => !!document.querySelector('.pdf-stage canvas')?.width);
  const beforeImport = (await teacher()).presentedSelection, beforePixels = await player.locator('canvas[aria-label="발표 자료"]').evaluate(canvas => canvas.toDataURL());
  await editor.locator('#pdf-import').setInputFiles(teacherPath);
  await editor.getByRole('status').filter({ hasText: 'PPTX 실험 사용을 먼저 선택하세요.' }).waitFor();
  assert.equal((await teacher()).documentOrder.length, 1);
  await editor.locator('#experimental-pptx-import').check();
  await editor.locator('#pdf-import').setInputFiles(teacherPath);
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const registered = Object.values((await teacher()).documents).find(doc => doc.source.type === 'pptx'); assert(registered);
  const prepared = { id: registered.id, slideIds: registered.slideIds };
  assert.deepEqual((await teacher()).presentedSelection, beforeImport);
  assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(canvas => canvas.toDataURL()), beforePixels);
  await editor.locator('#pdf-import').setInputFiles(teacherPath);
  for (let i = 0; i < 100 && await editor.locator('#pdf-import').isDisabled(); i++) await new Promise(r => setTimeout(r,50));
  assert.equal((await teacher()).documentOrder.length, 2);
  await editor.getByText(/빠른 재연결에서는 로컬 글꼴 검사를 다시 실행하지 않았습니다/).waitFor();
  report.productImport = { uiOnly: true, optInRequired: true, duplicateReuses: true, existingAudienceSelectionAndPixelsPreserved: true };
  report.productImport.reusedFontCheckExplicitlyUnverified = true;
  const command = async (type, documentId, slideId = null) => {
    if (['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT'].includes(type) && (await teacher()).documents[documentId]?.source.type === 'pptx') return presentPptx(remote, documentId, slideId);
    const r = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId, documentId, slideId, revision: (await teacher()).revision, commandId: crypto.randomUUID() } }); assert(r.ok);
  };
  await remote.locator('#remote-document').selectOption(prepared.id); await remote.locator('#remote-slide').selectOption(prepared.slideIds[2]);
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  report.productImport.transitionReadinessUi = true;
  const waitSlide = async (p, id) => p.waitForFunction(id => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === id, id);
  await waitSlide(player, prepared.slideIds[2]);
  // No owner: persist an intent, then verify a newly created Player holds it.
  await player.close();
  const requestId = crypto.randomUUID();
  const request = { type: 'SESSION_COMMAND', command: { type: 'REQUEST_PPTX_GROUP', sessionId, documentId: prepared.id,
    slideId: prepared.slideIds[2], revision: (await teacher()).revision, commandId: requestId } };
  assert((await send(remote, request)).ok);
  assert((await send(remote, request)).ok); // Duplicate receipt must not requeue.
  const heldPlayer = await page('player', sessionId); await waitSlide(heldPlayer, prepared.slideIds[2]);
  await remote.getByRole('status').filter({ hasText: '이전 요청을 보류했습니다.' }).waitFor();
  await heldPlayer.waitForTimeout(350);
  assert.deepEqual((await send(heldPlayer, { type: 'GET_SESSION', sessionId })).snapshot.pptx.request, { commandId: requestId, slideId: prepared.slideIds[2] });
  const beginRequested = async (p, token = requestId) => send(p, { type: 'SESSION_COMMAND', command: { type: 'BEGIN_REQUESTED_PPTX_GROUP',
    sessionId, documentId: prepared.id, slideId: prepared.slideIds[2], revision: (await teacher()).revision, commandId: crypto.randomUUID(), requestId: token } });
  assert.equal((await beginRequested(editor)).ok, false);
  const duplicate = await page('player', sessionId);
  await duplicate.getByRole('status').filter({ hasText: '다른 발표 창이 실행 중입니다.' }).waitFor();
  assert.equal((await beginRequested(duplicate)).ok, false);
  await duplicate.close();
  await remote.getByRole('button', { name: 'PPTX 효과 취소', exact: true }).click();
  assert.equal((await beginRequested(heldPlayer)).ok, false);
  const cancelled = (await send(heldPlayer, { type: 'GET_SESSION', sessionId })).snapshot.pptx;
  assert.equal(cancelled.run, null); assert.equal(cancelled.checkpoint, null);
  report.remoteIntentContract = { durableRequest: true, duplicateReceipt: true, editorRejected: true, duplicatePlayerRejected: true,
    historicalRequestHeld: true, cancellationInvalidatesLateBegin: true, remoteUiConnected: true };
  const visibility = p => p.evaluate(() => [...document.querySelector('.pptx-audience-stage').shadowRoot.querySelectorAll('[data-el]')].map(node => ({ id: node.getAttribute('data-el'), visible: getComputedStyle(node).visibility !== 'hidden' })));
  const before = await visibility(heldPlayer); assert(before.some(item => !item.visible));
  await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
  let committed;
  for (let attempt = 0; attempt < 100; attempt++) {
    const response = await send(heldPlayer, { type: 'GET_SESSION', sessionId });
    if (response.snapshot?.pptx?.checkpoint?.completedGroups === 1 && response.snapshot.pptx.run === null) { committed = response.snapshot; break; }
    await new Promise(resolve => setTimeout(resolve,50));
  }
  assert(committed, await heldPlayer.locator('.player-tools').textContent());
  const completed = await visibility(heldPlayer); report.effectVisibilityChanged = JSON.stringify(completed) !== JSON.stringify(before);
  await editor.locator('#editor-document').selectOption(prepared.id);
  await editor.locator('#editor-slide').selectOption(prepared.slideIds[5]);
  await editor.waitForFunction(id => document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === id, prepared.slideIds[5]);
  await editor.locator('#presenter-note').fill('Synthetic private PPTX note');
  await editor.getByRole('button', { name: '노트 저장', exact: true }).click();
  for (let i = 0; i < 100 && (await teacher()).documents[prepared.id].slideDeltas[prepared.slideIds[5]]?.presenterNote !== 'Synthetic private PPTX note'; i++) await new Promise(r => setTimeout(r,50));
  assert.equal((await teacher()).documents[prepared.id].slideDeltas[prepared.slideIds[5]].presenterNote, 'Synthetic private PPTX note');
  assert.equal((await teacher()).presentedSelection.slideId, prepared.slideIds[2]);
  assert.deepEqual(await visibility(heldPlayer), completed);
  assert(!JSON.stringify((await send(heldPlayer, { type: 'GET_SESSION', sessionId })).snapshot).includes('Synthetic private PPTX note'));
  report.privateEditor = { registeredIds: true, pageNavigationIndependent: true, privateNoteSaved: true, audiencePoseUnchanged: true, noteNotPublic: true };
  const overlayPixels = p => p.evaluate(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('.overlay-canvas')?.toDataURL());
  await heldPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('.overlay-canvas')?.width === 1280);
  const blankOverlay = await overlayPixels(heldPlayer);
  const draw = async (tool,x1,y1,x2,y2) => {
    await editor.getByRole('button', { name: tool, exact: true }).click();
    const box = await editor.locator('.overlay-interaction').boundingBox(); assert(box);
    await editor.mouse.move(box.x+box.width*x1,box.y+box.height*y1); await editor.mouse.down();
    await editor.mouse.move(box.x+box.width*x2,box.y+box.height*y2,{steps:6}); await editor.mouse.up();
  };
  await draw('글상자',.1,.1,.6,.45); await editor.locator('#overlay-text').fill('Synthetic private overlay');
  assert.equal(await overlayPixels(heldPlayer),blankOverlay);
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  assert.equal(await overlayPixels(heldPlayer),blankOverlay); // Different page remains private after commit.
  await editor.locator('#editor-slide').selectOption(prepared.slideIds[2]);
  await editor.waitForFunction(id => document.querySelector('[aria-label="등록 PPTX 비공개 미리보기"] .preview-stage').shadowRoot.querySelector('[data-slide-id]')?.dataset.slideId === id, prepared.slideIds[2]);
  await draw('글상자',.1,.1,.6,.45); await editor.locator('#overlay-text').fill('가'.repeat(2000));
  await editor.getByRole('status').filter({ hasText: '글상자에 내용이 맞지 않습니다.' }).waitFor();
  assert(await editor.getByRole('button', { name: '편집 확정', exact: true }).isDisabled());
  await editor.locator('#overlay-text').fill('PPTX 레이어 합성 예제');
  await draw('가리개',.75,.75,.9,.9); await draw('판서',.1,.7,.5,.85);
  assert.equal(await overlayPixels(heldPlayer),blankOverlay);
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  await heldPlayer.waitForFunction(before => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('.overlay-canvas')?.toDataURL() !== before,blankOverlay);
  const committedOverlay = await overlayPixels(heldPlayer);
  assert.deepEqual(await visibility(heldPlayer),completed);
  const savedOverlays = (await teacher()).documents[prepared.id].slideDeltas[prepared.slideIds[2]].overlays;
  assert.deepEqual(savedOverlays.map(item=>item.kind),['textbox','mask','stroke']);
  await heldPlayer.bringToFront(); await heldPlayer.screenshot({path:resolve(output,'pptx-overlays-player.png')});
  report.overlays = { privateDraftPreserved: true, otherPageCommitPrivate: true, minimumFontOverflowBlocksCommit: true, currentCommitUpdatesAudience: true, textMaskStroke: true, effectPoseUnchanged: true, originalPixelSamplingUnavailable: true };
  const beforeReconnectFailure = await teacher();
  await editor.locator('#pdf-reconnect').setInputFiles(changedReconnectPath);
  await editor.getByRole('status').filter({ hasText: '등록된 원본과 내용이 다릅니다.' }).waitFor();
  assert.deepEqual(await teacher(), beforeReconnectFailure);
  await editor.evaluate(() => {
    const original = File.prototype.arrayBuffer; window.originalFileRead = original;
    File.prototype.arrayBuffer = async function () { window.delayedReadStarted = true; await new Promise(resolve => { window.releaseDelayedRead = resolve; }); return original.call(this); };
  });
  await editor.locator('#pdf-import').setInputFiles(teacherPath);
  await editor.waitForFunction(() => window.delayedReadStarted === true);
  await editor.getByRole('button', { name: '원본 확인 취소', exact: true }).click();
  await editor.evaluate(() => window.releaseDelayedRead());
  await editor.getByRole('status').filter({ hasText: '원본 확인을 취소했습니다.' }).waitFor();
  assert.deepEqual(await teacher(), beforeReconnectFailure);
  await editor.evaluate(() => { File.prototype.arrayBuffer = window.originalFileRead; delete window.originalFileRead; delete window.delayedReadStarted; delete window.releaseDelayedRead; });
  report.productImport.changedOriginalRejected = true; report.productImport.delayedReadCancelledWithoutRegistration = true;
  report.editorViewports = []; await editor.bringToFront();
  for (const [width,height] of [[1920,1080],[1366,768],[1280,800],[768,1024],[380,820]]) {
    await editor.setViewportSize({width,height});
    await editor.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await editor.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    report.editorViewports.push({width,height,noHorizontalOverflow:true});
  }
  await editor.getByRole('region', { name: '등록 PPTX 비공개 미리보기', exact: true }).screenshot({ path: resolve(output,'registered-preview-380.png') });
  await editor.setViewportSize({width:1366,height:768});
  // Controlled lost BEGIN response, using the real Remote UI and runtime boundary.
  report.phase = 'lost-begin-response';
  await heldPlayer.evaluate(() => {
    const api = (window.whale ?? chrome).runtime, original = api.sendMessage.bind(api);
    api.sendMessage = async (...args) => {
      if (args[0]?.command?.type === 'BEGIN_REQUESTED_PPTX_GROUP') { api.sendMessage = original; throw Error('TEST_BEGIN_RESPONSE_FAILURE'); }
      return original(...args);
    };
  });
  await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '효과를 확정하지 못했습니다.' }).waitFor();
  assert.equal((await teacher()).documents[prepared.id].pptxPlayback.checkpoints[prepared.slideIds[2]].completedGroups, 1);
  await remote.getByRole('button', { name: 'PPTX 효과 취소', exact: true }).click();
  // Slow native animation only for cancellation observation; restore before original timing tests.
  await heldPlayer.evaluate(() => {
    window.originalAnimate = Element.prototype.animate;
    Element.prototype.animate = function (...args) { const value = window.originalAnimate.apply(this, args); value.updatePlaybackRate(.01); return value; };
  });
  await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
  await heldPlayer.waitForFunction(() => !!document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.getAnimations({ subtree: true }).length);
  const cdp = await context.newCDPSession(launcher); let versions = []; const transitions = [];
  cdp.on('ServiceWorker.workerVersionUpdated', event => { versions = event.versions; transitions.push(...event.versions.filter(v => v.scriptURL === `${origin}/background.js`).map(v => v.runningStatus)); });
  await cdp.send('ServiceWorker.enable');
  for (let i = 0; i < 100 && !versions.some(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); i++) await new Promise(r => setTimeout(r,50));
  const own = versions.find(v => v.scriptURL === `${origin}/background.js` && v.runningStatus === 'running'); assert(own);
  await cdp.send('ServiceWorker.stopWorker', { versionId: own.versionId });
  await remote.getByRole('button', { name: 'PPTX 효과 취소', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '효과를 취소하고 마지막 확정 화면을 복원했습니다.' }).waitFor();
  report.phase = 'worker-restart-during-effect';
  assert.deepEqual(await visibility(heldPlayer), completed);
  assert.equal(await overlayPixels(heldPlayer),committedOverlay);
  assert.equal((await teacher()).documents[prepared.id].pptxPlayback.checkpoints[prepared.slideIds[2]].completedGroups, 1);
  await heldPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('[data-slide-id]').getAnimations({ subtree: true }).length === 0);
  await heldPlayer.evaluate(() => { Element.prototype.animate = window.originalAnimate; delete window.originalAnimate; });
  assert(transitions.includes('stopped') && transitions.includes('running'), JSON.stringify(transitions));
  report.failureAndCancel = { controlledBeginFailure: true, explicitRetry: true, nativeCancellation: true, completedPosePreserved: true, workerTransitions: transitions };
  const editorSelection = (await teacher()).editorSelection;
  await command('ACTIVATE_DOCUMENT', b); await heldPlayer.waitForFunction(() => !!document.querySelector('.pdf-stage canvas')?.width);
  await command('ACTIVATE_DOCUMENT', prepared.id); await waitSlide(heldPlayer, prepared.slideIds[2]);
  assert.deepEqual(await visibility(heldPlayer), completed);
  assert.deepEqual((await teacher()).editorSelection, editorSelection);
  await heldPlayer.close(); const replacement = await page('player', sessionId); await waitSlide(replacement, prepared.slideIds[2]); assert.deepEqual(await visibility(replacement), completed);
  await replacement.waitForFunction(expected => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('.overlay-canvas')?.toDataURL() === expected,committedOverlay);
  await replacement.bringToFront(); await replacement.setViewportSize({ width: 1366, height: 768 }); await replacement.screenshot({ path: resolve(output, 'player-restored.png') });
  let groupsTotal = 0;
  for (const pageIndex of [2,8,11,18]) {
    const target = prepared.slideIds[pageIndex]; await command('GOTO_SLIDE', prepared.id, target); await waitSlide(replacement, target);
    const match = /효과 (\d+)그룹/.exec(await replacement.locator('.player-tools').textContent()); assert(match);
    const groups = Number(match[1]); groupsTotal += groups;
    const initialCheckpoint = (await send(replacement, { type: 'GET_SESSION', sessionId })).snapshot.pptx.checkpoint?.completedGroups ?? 0;
    for (let done = initialCheckpoint + 1; done <= groups; done++) {
      await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
      let confirmed = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        const response = await send(replacement, { type: 'GET_SESSION', sessionId });
        if (response.snapshot?.pptx?.checkpoint?.completedGroups === done && response.snapshot.pptx.run === null) { confirmed = true; break; }
        await new Promise(resolve => setTimeout(resolve,50));
      }
      assert(confirmed, await replacement.locator('.player-tools').textContent());
    }
    await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
    await remote.getByRole('status').filter({ hasText: '현재 쪽의 효과를 모두 재생했습니다.' }).waitFor();
    assert.equal((await teacher()).presentedSelection.slideId, target);
    await remote.getByRole('button', { name: 'PPTX 효과 취소', exact: true }).click();
  }
  assert(groupsTotal > 0); report.allOriginalClickGroups = groupsTotal;
  report.remoteViewports = [];
  await remote.bringToFront();
  for (const [width,height] of [[1920,1080],[1366,768],[1280,800],[768,1024],[380,820]]) {
    await remote.setViewportSize({width,height});
    assert(await remote.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    report.remoteViewports.push({width,height,noHorizontalOverflow:true});
  }
  await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).focus();
  assert(await remote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).evaluate(node => node === document.activeElement));
  await remote.screenshot({ path: resolve(output, 'remote-380.png'), fullPage: true });
  report.viewports = [];
  await replacement.bringToFront();
  for (const [width,height] of [[1920,1080],[1366,768],[1280,800],[768,1024],[380,820]]) {
    await replacement.setViewportSize({width,height});
    await replacement.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert(await replacement.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    const fit = await replacement.evaluate(() => { const host = document.querySelector('.pptx-audience-stage'), rect = host.shadowRoot.querySelector('[data-slide-id]').getBoundingClientRect(); return { width: rect.width, height: rect.height, inside: rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1 }; });
    assert(fit.inside && fit.width > 1 && fit.height > 1); report.viewports.push({width,height,inside:true});
  }
  const publicState = await send(replacement, { type: 'GET_SESSION', sessionId }); assert.equal(publicState.snapshot.pptx.slideIds.length, prepared.slideIds.length); assert(!JSON.stringify(publicState).includes(basename(teacherPath)));
  const backupVisibility = await visibility(replacement), backupSlide = publicState.snapshot.selection.slideId;
  await replacement.close();
  await command('REQUEST_PPTX_GROUP', prepared.id, backupSlide);
  const beforeBackup = await teacher(); assert(beforeBackup.documents[prepared.id].pptxPlayback.request);
  const nativeName = await editor.evaluate(async () => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle('pptx-metadata-backup.wcp.json', { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await editor.getByRole('button', { name: '편집정보 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const backupText = await editor.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), nativeName);
  const backupPath = resolve(output, 'pptx-metadata-backup.wcp.json'); await writeFile(backupPath, backupText, 'utf8');
  const bundle = JSON.parse(backupText); assert(!backupText.includes('fileHandleKey'));
  assert(bundle.session.documents[prepared.id].pptxPlayback.request);
  await editor.locator('#session-verify-file').setInputFiles(backupPath);
  await editor.getByRole('status').filter({ hasText: '파일을 확인했습니다.' }).waitFor();
  assert.deepEqual(await teacher(), beforeBackup);
  await launcher.locator('#session-import').setInputFiles(backupPath);
  await launcher.getByRole('status').filter({ hasText: '새 복구 수업을 만들었습니다.' }).waitFor();
  const restoredId = await launcher.locator('#lesson-select').inputValue(); assert.notEqual(restoredId, sessionId);
  const restoredEditor = await page('editor', restoredId), restoredRemote = await page('remote', restoredId), restoredPlayer = await page('player', restoredId);
  await restoredPlayer.getByRole('heading', { name: '발표 대기', exact: true }).waitFor();
  const restoredResponse = await send(restoredEditor, { type: 'GET_SESSION', sessionId: restoredId }); assert(restoredResponse.ok);
  const restored = restoredResponse.session, savedDoc = beforeBackup.documents[prepared.id], restoredDoc = restored.documents[prepared.id];
  assert.equal(restored.revision, 0); assert.equal(restored.presentedSelection, null);
  assert.equal(restoredDoc.pptxPlayback.request, null); assert.equal(restoredDoc.pptxPlayback.run, null);
  assert.deepEqual(restoredDoc.slideDeltas, savedDoc.slideDeltas);
  for (const [id, cp] of Object.entries(savedDoc.pptxPlayback.checkpoints)) {
    assert.deepEqual(restoredDoc.pptxPlayback.checkpoints[id].pose.entries, cp.pose.entries);
    assert.deepEqual(restoredDoc.pptxPlayback.checkpoints[id].pose.scope, { ...cp.pose.scope, sessionId: restoredId, revision: 0 });
  }
  await restoredEditor.locator('#experimental-pptx-import').check();
  await restoredEditor.locator('#editor-document').selectOption(prepared.id);
  await restoredEditor.locator('#pdf-reconnect').setInputFiles(teacherPath);
  await restoredEditor.getByRole('status').filter({ hasText: '같은 원본을 다시 연결했습니다.' }).waitFor();
  assert.equal((await send(restoredEditor, { type: 'GET_SESSION', sessionId: restoredId })).session.documentOrder.length, restored.documentOrder.length);
  const readyToActivate = (await send(restoredEditor, { type: 'GET_SESSION', sessionId: restoredId })).session;
  await presentPptx(restoredRemote, prepared.id);
  await waitSlide(restoredPlayer, backupSlide); assert.deepEqual(await visibility(restoredPlayer), backupVisibility);
  const afterRestore = (await send(restoredEditor,{type:'GET_SESSION',sessionId:restoredId})).session;
  await presentPptx(restoredRemote, prepared.id, prepared.slideIds[2]);
  await waitSlide(restoredPlayer,prepared.slideIds[2]);
  await restoredPlayer.waitForFunction(expected => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('.overlay-canvas')?.toDataURL() === expected,committedOverlay);
  report.overlays.restoredOverlayPixelsMatch = true;
  assert.deepEqual(await teacher(), beforeBackup);
  report.localBackup = { nativeOpfsWriteReadback: true, savedFileVerification: true, launcherFileImport: true, newSessionScope: true, historicalRequestDropped: true, standbyBeforeExplicitActivation: true, originalReconnectUi: true, completedVisibilityRestored: true, existingSessionUnchanged: true };
  assert.deepEqual(errors, []); assert.equal(createHash('sha256').update(await readFile(teacherPath)).digest('hex'), hash);
  Object.assign(report, { slides: prepared.slideIds.length, clickGroupCommitted: true, documentReturnRestored: true, replacementPlayerRestored: true, editorSelectionUnchanged: true, originalUnchanged: true, pageErrors: errors });
  await writeFile(resolve(output,'result.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify(report));
} catch (error) {
  report.failure = error.stack;
  report.runtimeFailure = await Promise.all((context?.pages() ?? []).filter(page => /\/(?:player|remote)\/index\.html/.test(page.url())).map(async page => ({
    role: page.url().includes('/player/') ? 'player' : 'remote',
    state: await page.evaluate(async () => {
      const locks = await navigator.locks.query(), name = 'naver-ppt-pptx-preparation-v1';
      return { held: locks.held.filter(lock => lock.name === name).length, pending: locks.pending.filter(lock => lock.name === name).length,
        effect: document.querySelector('[aria-label="PPTX 효과 제어"] [role="status"]')?.textContent,
        effectDisabled: document.querySelector('[aria-label="PPTX 효과 제어"] button')?.disabled,
        preparation: document.querySelector('.pptx-audience-stage')?.dataset.preparation };
    }).catch(() => ({ unavailable: true })),
  })));
  await writeFile(resolve(output, 'failure.json'), JSON.stringify(report, null, 2)); throw error;
} finally { await context?.close(); }
