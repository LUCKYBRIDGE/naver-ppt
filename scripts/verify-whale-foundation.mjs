import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';
import { createPreflightPdf } from '../tests/fixtures/createPreflightPdf.mjs';
import { PDFDocument } from 'pdf-lib';
import { createHash } from 'node:crypto';
import { waitForBrowserState } from './async-browser-state.mjs';

const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const executablePath = process.argv[3];
if (!executablePath) throw new Error('Pass the installed Whale executable path.');
const output = resolve('node_modules/.cache/whale-foundation'); await mkdir(output, { recursive: true });
const syntheticA = await createPreflightPdf();
const profile = resolve(output, `profile-${Date.now()}`), extension = resolve('dist');
// Explicit profile/transport flags keep the test independent of bundled launch defaults.
const options = { executablePath, headless: true, ignoreDefaultArgs: true, timeout: 15000,
  args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox',
    `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] };
let context;
try {
  context = await chromium.launchPersistentContext(profile, options); context.setDefaultTimeout(20000);
  let worker; const seen = new Map(), deadline = Date.now() + 20000;
  while (!worker && Date.now() < deadline) {
    for (const candidate of context.serviceWorkers()) {
      try {
        const name = await candidate.evaluate(() => chrome.runtime.getManifest().name); seen.set(candidate.url(), name);
        if (name === 'Whale Class Presenter') { worker = candidate; break; }
      } catch { /* Built-in workers can stop during startup. */ }
    }
    if (!worker) await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (!worker) throw new Error(`Product worker not loaded: ${JSON.stringify([...seen])}`);
  const extensionId = new URL(worker.url()).hostname, base = `chrome-extension://${extensionId}`;
  const launcher = await context.newPage(); await launcher.goto(`${base}/launcher/index.html`);
  const environment = await launcher.evaluate(() => ({ userAgent: navigator.userAgent, platform: navigator.platform,
    chrome: typeof chrome?.runtime?.getContexts, whale: typeof window.whale?.runtime?.getContexts }));
  await launcher.locator('#lesson-title').fill('Synthetic Whale lesson'); await launcher.getByRole('button', { name: '수업 만들기', exact: true }).click();
  await launcher.getByRole('status').filter({ hasText: '수업을 저장했습니다.' }).waitFor();
  const sessionId = await launcher.locator('#lesson-select').inputValue(); assert(sessionId);
  async function open(role, label) {
    const pending = context.waitForEvent('page'); await launcher.getByRole('button', { name: label, exact: true }).click();
    const page = await pending; await page.waitForURL(`${base}/${role}/index.html?sessionId=${sessionId}`); return page;
  }
  const player = await open('player', '발표 창 열기'), remote = await open('remote', '독립 리모컨 열기');
  // Only the native chooser is bypassed for synthetic input; runtime/windows/DB/PDF APIs are real.
  await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  const editor = await open('editor', '비공개 편집창 열기'); await player.locator('.standby').waitFor();
  const beforeReuse = context.pages().length;
  await launcher.getByRole('button', { name: '발표 창 열기', exact: true }).click();
  await launcher.getByRole('status').filter({ hasText: '발표 창 열기 완료' }).waitFor(); assert.equal(context.pages().length, beforeReuse);
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-A.pdf', mimeType: 'application/pdf', buffer: syntheticA });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const registrationCheck = editor.locator('.registration-preflight'); await registrationCheck.waitFor();
  assert.equal(await registrationCheck.locator('[data-result="pass"]').count(), 2); assert.equal(await registrationCheck.locator('[data-result="unknown"]').count(), 3);
  async function snapshot(page) {
    return page.evaluate(id => (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId: id }), sessionId);
  }
  const registered = await snapshot(editor); assert.equal(registered.ok, true);
  const documentId = registered.session.documentOrder[0], slides = registered.session.documents[documentId].slideIds;
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-B.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('B') });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  await remote.waitForFunction(() => document.querySelector('#remote-document')?.options.length === 3);
  await remote.locator('#remote-document').selectOption(documentId); await remote.getByRole('button', { name: '자료 발표', exact: true }).click();
  await remote.locator('#remote-slide').selectOption(slides[4]); await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[4]);
  await editor.locator('#editor-document').selectOption(documentId); await editor.locator('#editor-slide').selectOption(slides[7]);
  await editor.locator('#presenter-note').fill('Synthetic private Whale note'); await editor.getByRole('button', { name: '노트 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  const quickBefore = (await snapshot(editor)).session;
  const quickPageCount = context.pages().length;
  await editor.locator('#presenter-note').fill('Synthetic draft held during Player quick edit');
  await player.locator('.player-screen').click({ button: 'right', position: { x: 100, y: 100 } });
  await player.screenshot({ path: resolve(output, 'player-quick-editor.png'), fullPage: true });
  await player.getByRole('button', { name: '현재 페이지 편집', exact: true }).click();
  await player.waitForFunction(() => !document.querySelector('.player-tools button')?.disabled);
  const quickAfter = (await snapshot(editor)).session;
  assert.deepEqual(quickAfter.presentedSelection, quickBefore.presentedSelection);
  assert.deepEqual(quickAfter.documents, quickBefore.documents);
  assert.equal(context.pages().length, quickPageCount);
  assert.deepEqual(quickAfter.editorSelection, quickBefore.presentedSelection);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Synthetic draft held during Player quick edit');
  await editor.getByRole('button', { name: '변경 취소', exact: true }).click();
  await editor.locator('#editor-slide').selectOption(slides[7]);
  await player.locator('.player-screen').dispatchEvent('pointerdown', { pointerType: 'touch', clientX: 100, clientY: 100 });
  await player.waitForFunction(() => document.querySelector('.player-tools')?.dataset.visible === 'true');
  await player.locator('.player-screen').dispatchEvent('pointerup', { pointerType: 'touch', clientX: 100, clientY: 100 });
  await player.getByRole('button', { name: '현재 페이지 편집', exact: true }).click();
  await player.waitForFunction(() => !document.querySelector('.player-tools button')?.disabled);
  await editor.locator('#editor-slide').selectOption(slides[7]);
  const wrongQuick = await player.evaluate(sessionId => (window.whale ?? chrome).runtime.sendMessage({ type: 'OPEN_CURRENT_EDITOR', command: {
    type: 'SELECT_EDITOR_SLIDE', sessionId: `${sessionId}-other`, documentId: 'synthetic', slideId: 'synthetic', revision: 0, commandId: crypto.randomUUID() } }), sessionId);
  assert.equal(wrongQuick.code, 'FORBIDDEN');
  const committed = (await snapshot(editor)).session;
  assert.equal(committed.presentedSelection.slideId, slides[4]); assert.equal(committed.editorSelection.slideId, slides[7]);
  const publicResponse = await snapshot(player); assert.equal(publicResponse.kind, 'player');
  assert(!JSON.stringify(publicResponse).includes('Synthetic private Whale note')); assert(!JSON.stringify(publicResponse).includes('Synthetic-A.pdf'));
  const reconnectBefore = (await snapshot(editor)).session;
  await editor.locator('#pdf-reconnect').setInputFiles({ name: 'Synthetic-B.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('B') });
  await editor.getByRole('status').filter({ hasText: '등록된 원본과 내용이 다릅니다.' }).waitFor();
  assert.equal(await registrationCheck.count(), 0); assert.deepEqual((await snapshot(editor)).session, reconnectBefore);
  await editor.locator('#pdf-reconnect').setInputFiles({ name: 'Synthetic-A.pdf', mimeType: 'application/pdf', buffer: syntheticA });
  await editor.getByRole('status').filter({ hasText: '같은 원본을 다시 연결했습니다.' }).waitFor(); await registrationCheck.waitFor();
  assert.equal(await registrationCheck.locator('[data-result="pass"]').count(), 1); assert.equal(await registrationCheck.locator('[data-result="unknown"]').count(), 4);
  assert.deepEqual((await snapshot(editor)).session, reconnectBefore);
  await editor.waitForFunction(slideId => {
    const canvas = document.querySelector('.pdf-stage canvas[aria-label]'); if (!canvas || canvas.dataset.slideId !== slideId || !canvas.width || !canvas.height) return false;
    const pixel = canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data; return pixel[0] + pixel[1] + pixel[2] > 50;
  }, slides[7]);
  await editor.setViewportSize({ width: 380, height: 760 }); assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await editor.screenshot({ path: resolve(output, 'registration-preflight-380.png'), fullPage: true }); await editor.setViewportSize({ width: 1366, height: 768 });
  const beforePreflight = (await snapshot(editor)).session;
  await editor.locator('#presenter-note').fill('Synthetic draft protected during preflight');
  await editor.getByRole('button', { name: '선택 자료 점검', exact: true }).click();
  const preflight = editor.getByRole('region', { name: '발표 전 점검', exact: true });
  await preflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor();
  assert(await preflight.locator('[data-result="pass"]').count() >= 2); assert(await preflight.locator('[data-result="unknown"]').count() >= 2);
  assert.equal(await preflight.locator('[data-result="warning"]').count(), 2);
  assert((await preflight.textContent()).includes('외부 링크 1개')); assert((await preflight.textContent()).includes('문서 스크립트가 있습니다.'));
  assert.equal(await preflight.locator('[data-result="error"]').count(), 0);
  assert.deepEqual((await snapshot(editor)).session, beforePreflight);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Synthetic draft protected during preflight');
  assert.equal(await player.locator('.pdf-stage canvas').first().getAttribute('data-slide-id'), slides[4]);
  await editor.setViewportSize({ width: 380, height: 760 }); assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await editor.screenshot({ path: resolve(output, 'preflight-380.png'), fullPage: true });
  await editor.locator('#preflight-scope').selectOption('document');
  await editor.getByRole('button', { name: '선택 자료 점검', exact: true }).click();
  await preflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor();
  const fullInspectionText = await preflight.textContent(); assert(fullInspectionText.includes('전체 페이지 점검'));
  assert(fullInspectionText.includes('8/8쪽 읽기')); assert(fullInspectionText.includes('외부 링크 2개'));
  assert(fullInspectionText.includes('8/8쪽의 실제 Canvas 렌더'));
  assert(!fullInspectionText.includes('캐시 사용'));
  await editor.getByRole('button', { name: '선택 자료 점검', exact: true }).click();
  await preflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor();
  assert((await preflight.textContent()).includes('동일 원본·범위·환경의 캐시 사용'));
  await editor.getByRole('button', { name: '캐시 없이 다시 검사', exact: true }).click();
  await preflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor(); assert(!(await preflight.textContent()).includes('캐시 사용'));
  assert.deepEqual((await snapshot(editor)).session, beforePreflight); assert.equal(await editor.locator('#presenter-note').inputValue(), 'Synthetic draft protected during preflight');
  assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await editor.screenshot({ path: resolve(output, 'preflight-document-380.png'), fullPage: true });
  await editor.locator('#preflight-scope').selectOption('sample');
  await editor.setViewportSize({ width: 1366, height: 768 });
  await editor.getByRole('button', { name: '캐시 없이 다시 검사', exact: true }).click();
  await editor.getByRole('button', { name: '점검 취소', exact: true }).click();
  await preflight.getByRole('status').filter({ hasText: '점검을 취소했습니다.' }).waitFor();
  assert.equal(await preflight.locator('.preflight-results').count(), 0); assert.deepEqual((await snapshot(editor)).session, beforePreflight);
  await editor.getByRole('button', { name: '변경 취소', exact: true }).click();
  const nativeName = await editor.evaluate(async () => {
    const root = await navigator.storage.getDirectory(), handle = await root.getFileHandle('synthetic-backup.wcp.json', { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await editor.getByRole('button', { name: '편집정보 저장', exact: true }).click(); await editor.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const savedText = await editor.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), nativeName);
  const savedPath = resolve(output, 'synthetic-backup.wcp.json'); await writeFile(savedPath, savedText, 'utf8');
  await editor.locator('#session-verify-file').setInputFiles(savedPath);
  try { await editor.getByRole('status').filter({ hasText: '파일을 확인했습니다.' }).waitFor(); }
  catch (error) {
    const diagnostic = await editor.evaluate(async ({ text, sessionId, revision }) => {
      const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      try { return await (window.whale ?? chrome).runtime.sendMessage({ type: 'VERIFY_SAVED_BACKUP', sessionId, revision, blobUrl: url }); }
      finally { URL.revokeObjectURL(url); }
    }, { text: savedText, sessionId, revision: committed.revision });
    throw new Error(`${error.message}; statuses=${JSON.stringify(await editor.getByRole('status').allTextContents())}; verification=${JSON.stringify(diagnostic)}`);
  }
  const tampered = JSON.parse(savedText); tampered.session.documents[documentId].slideDeltas[slides[7]].presenterNote = 'Tampered synthetic note';
  await editor.locator('#session-verify-file').setInputFiles({ name: 'tampered.wcp.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) });
  await editor.getByRole('status').filter({ hasText: '일치하는 파일을 확인하지 못했습니다.' }).waitFor(); assert.deepEqual((await snapshot(editor)).session, committed);
  const rejected = await player.evaluate(({ sessionId, documentId, slideId, revision }) => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND',
    command: { type: 'SET_PRESENTER_NOTE', sessionId, documentId, slideId, revision, commandId: crypto.randomUUID(), note: 'Forbidden synthetic note' } }),
  { sessionId, documentId, slideId: slides[4], revision: committed.revision }); assert.equal(rejected.ok, false);
  const otherId = committed.documentOrder.find(id => id !== documentId), otherBefore = committed.documents[otherId];
  const secondEditor = await context.newPage(); await secondEditor.goto(`${base}/editor/index.html?sessionId=${sessionId}`);
  await secondEditor.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  await secondEditor.locator('#presenter-note').fill('Second independent synthetic draft');
  await editor.locator('#presenter-note').fill('Uncommitted synthetic draft retained across close');
  await remote.getByRole('button', { name: '현재 자료 종료', exact: true }).click();
  const closeDialog = remote.getByRole('dialog', { name: '현재 자료 종료', exact: true }); await closeDialog.waitFor();
  await closeDialog.getByRole('button', { name: '취소', exact: true }).click(); assert.deepEqual((await snapshot(editor)).session, committed);
  await remote.getByRole('button', { name: '현재 자료 종료', exact: true }).click();
  await closeDialog.locator('#close-backup-file').setInputFiles({ name: 'tampered.wcp.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(tampered)) });
  await closeDialog.getByRole('button', { name: '종료 확정', exact: true }).click();
  await closeDialog.getByRole('status').filter({ hasText: '일치하는 파일을 확인하지 못했습니다.' }).waitFor();
  assert.deepEqual((await snapshot(editor)).session, committed);
  await remote.setViewportSize({ width: 380, height: 760 });
  assert.equal(await closeDialog.evaluate(node => node.scrollWidth > node.clientWidth), false);
  await remote.screenshot({ path: resolve(output, 'close-dialog-380.png'), fullPage: true });
  await closeDialog.locator('#close-backup-file').setInputFiles(savedPath);
  await closeDialog.getByRole('button', { name: '종료 확정', exact: true }).click(); await closeDialog.waitFor({ state: 'hidden' });
  await player.locator('.standby').waitFor(); assert.equal(await player.locator('.standby').evaluate(node => getComputedStyle(node).backgroundColor), 'rgb(0, 0, 0)');
  let closed = (await snapshot(editor)).session;
  assert.equal(closed.presentedSelection, null); assert.equal(closed.documents[documentId].closed, true); assert.deepEqual(closed.documents[otherId], otherBefore);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Uncommitted synthetic draft retained across close');
  assert.equal(await secondEditor.locator('#presenter-note').inputValue(), 'Second independent synthetic draft');
  assert.deepEqual(closed.documents[documentId].slideDeltas, committed.documents[documentId].slideDeltas);
  await remote.getByRole('button', { name: '다시 발표', exact: true }).click();
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[4]);
  await secondEditor.getByRole('button', { name: '변경 취소', exact: true }).click();
  await secondEditor.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[7]);
  await secondEditor.getByRole('button', { name: '판서', exact: true }).click();
  const surface = await secondEditor.locator('.overlay-interaction').boundingBox(); assert(surface);
  await secondEditor.mouse.move(surface.x + surface.width * .2, surface.y + surface.height * .2); await secondEditor.mouse.down();
  await secondEditor.mouse.move(surface.x + surface.width * .5, surface.y + surface.height * .5, { steps: 4 }); await secondEditor.mouse.up();
  await secondEditor.getByRole('status').filter({ hasText: '확정하지 않은 편집이 있습니다.' }).waitFor();
  const draftLayerId = await secondEditor.locator('#overlay-selection').inputValue(); assert(draftLayerId);
  await remote.getByRole('button', { name: '현재 자료 종료', exact: true }).click();
  await closeDialog.getByRole('radio', { name: '새 백업 없이 종료', exact: true }).check();
  await closeDialog.getByRole('button', { name: '종료 확정', exact: true }).click(); await closeDialog.waitFor({ state: 'hidden' }); await player.locator('.standby').waitFor();
  closed = (await snapshot(editor)).session; assert.deepEqual(closed.documents[otherId], otherBefore);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Uncommitted synthetic draft retained across close');
  assert.equal(await secondEditor.locator('#overlay-selection').inputValue(), draftLayerId);
  await secondEditor.getByRole('status').filter({ hasText: '확정하지 않은 편집이 있습니다.' }).waitFor();
  await secondEditor.getByRole('button', { name: '편집 취소', exact: true }).click(); await secondEditor.close();
  await editor.getByRole('button', { name: '변경 취소', exact: true }).click();
  await remote.getByRole('button', { name: '다시 발표', exact: true }).click();
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[4]);
  await editor.locator('#editor-document').selectOption(otherId);
  const otherSlides = (await snapshot(editor)).session.documents[otherId].slideIds;
  await editor.locator('#editor-slide').selectOption(otherSlides[7]);
  await editor.locator('#presenter-note').fill('Synthetic B committed note');
  await editor.getByRole('button', { name: '노트 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  const beforeAll = (await snapshot(editor)).session;
  await editor.locator('#presenter-note').fill('Uncommitted B draft retained across all close');
  await remote.getByRole('button', { name: '전체 자료 종료', exact: true }).click();
  const allDialog = remote.getByRole('dialog', { name: '전체 자료 종료', exact: true });
  await allDialog.getByRole('button', { name: '취소', exact: true }).click();
  assert.deepEqual((await snapshot(editor)).session, beforeAll);
  await remote.getByRole('button', { name: '전체 자료 종료', exact: true }).click();
  await allDialog.locator(`[data-document-id="${documentId}"]`).selectOption('without-backup');
  await allDialog.locator('#all-close-backup').setInputFiles(savedPath);
  await allDialog.getByRole('button', { name: '전체 종료 확정', exact: true }).click();
  await allDialog.getByRole('status').filter({ hasText: '1개 종료 · 1개 유지' }).waitFor();
  await player.locator('.standby').waitFor();
  const partial = (await snapshot(editor)).session;
  assert.equal(partial.documents[documentId].closed, true); assert.equal(partial.presentedSelection, null);
  assert.deepEqual(partial.documents[otherId], beforeAll.documents[otherId]);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Uncommitted B draft retained across all close');
  assert.equal(await allDialog.evaluate(node => node.scrollWidth > node.clientWidth), false);
  await remote.screenshot({ path: resolve(output, 'all-close-partial-380.png'), fullPage: true });
  await allDialog.getByRole('button', { name: '남은 자료 다시 확인', exact: true }).click();
  const allNativeName = await remote.evaluate(async () => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle(`all-close-${crypto.randomUUID()}.wcp.json`, { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await allDialog.getByRole('button', { name: '편집정보 저장', exact: true }).click();
  await allDialog.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const allSavedText = await remote.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), allNativeName);
  const allSavedPath = resolve(output, 'all-close-backup.wcp.json'); await writeFile(allSavedPath, allSavedText, 'utf8');
  await allDialog.locator('#all-close-backup').setInputFiles(allSavedPath);
  await allDialog.getByRole('button', { name: '전체 종료 확정', exact: true }).click();
  await allDialog.waitFor({ state: 'hidden' }); await player.locator('.standby').waitFor();
  const allClosed = (await snapshot(editor)).session;
  assert(allClosed.documentOrder.every(id => allClosed.documents[id].closed));
  assert.equal(allClosed.presentedSelection, null);
  assert.deepEqual(allClosed.documents[otherId].slideDeltas, beforeAll.documents[otherId].slideDeltas);
  assert.equal(await editor.locator('#presenter-note').inputValue(), 'Uncommitted B draft retained across all close');
  await editor.getByRole('button', { name: '변경 취소', exact: true }).click();
  await editor.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, otherSlides[7]);
  await editor.getByRole('button', { name: '가리개', exact: true }).click();
  const copySurface = await editor.locator('.overlay-interaction').boundingBox(); assert(copySurface);
  await editor.mouse.move(copySurface.x + copySurface.width * .2, copySurface.y + copySurface.height * .3); await editor.mouse.down();
  await editor.mouse.move(copySurface.x + copySurface.width * .5, copySurface.y + copySurface.height * .5); await editor.mouse.up();
  assert.equal(await editor.getByRole('button', { name: 'PDF 수정본 저장', exact: true }).isDisabled(), true);
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  await editor.getByText('가리개는 원본 내용을 삭제하지 않습니다. 개인정보를 지우는 용도로 사용하지 마세요.', { exact: true }).waitFor();
  const beforePdf = (await snapshot(editor)).session;
  const pdfNativeName = await editor.evaluate(async () => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle(`synthetic-${crypto.randomUUID()}.pdf`, { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await editor.getByRole('button', { name: 'PDF 수정본 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: 'PDF 수정본' }).filter({ hasText: '저장 완료' }).waitFor();
  const pdfOutput = new Uint8Array(await editor.evaluate(async name => [...new Uint8Array(await (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).arrayBuffer())], pdfNativeName));
  const pdfPath = resolve(output, 'synthetic-modified.pdf'); await writeFile(pdfPath, pdfOutput);
  const loadedCopy = await PDFDocument.load(pdfOutput); assert.equal(loadedCopy.getPageCount(), 8);
  assert.equal(createHash('sha256').update(createFixturePdf('B')).digest('hex'), beforePdf.documents[otherId].source.fingerprint);
  assert.deepEqual((await snapshot(editor)).session, beforePdf);
  await editor.getByRole('button', { name: 'PDF 수정본 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '기존 파일은 덮어쓰지 않습니다.' }).waitFor();
  assert.deepEqual((await snapshot(editor)).session, beforePdf);
  assert.deepEqual(new Uint8Array(await editor.evaluate(async name => [...new Uint8Array(await (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).arrayBuffer())], pdfNativeName)), pdfOutput);
  await editor.evaluate(() => { window.showSaveFilePicker = async () => { throw new DOMException('Synthetic cancellation', 'AbortError'); }; });
  await editor.getByRole('button', { name: 'PDF 수정본 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: 'PDF 저장을 취소했습니다.' }).waitFor();
  assert.deepEqual((await snapshot(editor)).session, beforePdf);
  // Render the generated PC fixture with a reader outside the extension writer/browser context.
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs'), { createCanvas } = await import('@napi-rs/canvas');
  const task = getDocument({ data: new Uint8Array(pdfOutput), useSystemFonts: false,
    standardFontDataUrl: resolve('node_modules/pdfjs-dist/standard_fonts').replaceAll('\\', '/') + '/' });
  try {
    const pdf = await task.promise, page = await pdf.getPage(8), viewport = page.getViewport({ scale: .4 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height)), canvasContext = canvas.getContext('2d');
    await page.render({ canvas, canvasContext, viewport }).promise;
    const overlay = beforePdf.documents[otherId].slideDeltas[otherSlides[7]].overlays[0];
    const pixel = [...canvasContext.getImageData(Math.floor((overlay.rect.x + overlay.rect.width / 2) * canvas.width), Math.floor((overlay.rect.y + overlay.rect.height / 2) * canvas.height), 1, 1).data];
    assert.deepEqual(pixel, [0, 0, 0, 255]);
    assert((await page.getTextContent()).items.some(item => item.str === 'B - Page 8'));
    await writeFile(resolve(output, 'pdf-copy-reader.png'), canvas.toBuffer('image/png'));
  } finally { await task.destroy(); }
  await remote.close(); assert.deepEqual((await snapshot(player)).snapshot.selection, beforePdf.presentedSelection);
  for (const [name, page] of [['player', player], ['editor', editor], ['launcher', launcher]]) await page.screenshot({ path: resolve(output, `${name}.png`), fullPage: true });
  await editor.setViewportSize({ width: 380, height: 760 });
  assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await editor.screenshot({ path: resolve(output, 'editor-380.png'), fullPage: true });
  const executionRemote = await context.newPage(); await executionRemote.goto(`${base}/remote/index.html?sessionId=${sessionId}`);
  async function playbackCommand(type, slideId = null) {
    const current = (await snapshot(editor)).session;
    const response = await executionRemote.evaluate(command => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command }), {
      type, sessionId, documentId, slideId, revision: current.revision, commandId: crypto.randomUUID(),
    }); assert.equal(response.ok, true); return response.session;
  }
  await playbackCommand('REOPEN_DOCUMENT'); await playbackCommand('GOTO_SLIDE', slides[0]);
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[0]);
  await executionRemote.locator('#autoplay-seconds').fill('1');
  await executionRemote.locator('#autoplay-loop').selectOption('range');
  await executionRemote.getByLabel('시작 페이지', { exact: true }).selectOption(slides[0]);
  await executionRemote.getByLabel('끝 페이지', { exact: true }).selectOption(slides[1]);
  await executionRemote.getByRole('button', { name: '자동 넘김 설정 적용', exact: true }).click();
  await executionRemote.getByRole('button', { name: '자동 넘김 재개', exact: true }).waitFor();
  await executionRemote.getByRole('button', { name: '자동 넘김 재개', exact: true }).click();
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[1]);
  const firstAdvance = (await snapshot(editor)).session;
  const duplicatePlayer = await context.newPage(); await duplicatePlayer.goto(`${base}/player/index.html?sessionId=${sessionId}`);
  await duplicatePlayer.getByRole('status').filter({ hasText: '다른 발표 창이 실행 중입니다.' }).waitFor();
  assert.equal(await duplicatePlayer.locator('video,audio,.pdf-stage canvas').count(), 0);
  const duplicateSnapshot = await snapshot(duplicatePlayer);
  const duplicateAdvance = await duplicatePlayer.evaluate(({ sessionId, state }) => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command: {
    type: 'ADVANCE_AUTOPLAY', sessionId, documentId: state.selection.documentId, slideId: state.selection.slideId,
    epoch: state.autoplay.checkpoint.epoch, revision: state.revision, commandId: crypto.randomUUID(),
  } }), { sessionId, state: duplicateSnapshot.snapshot });
  assert.equal(duplicateAdvance.code, 'NOT_PLAYER_OWNER');
  for (const type of ['PLAY_MEDIA', 'CHECKPOINT_MEDIA']) {
    const rejectedDuplicate = await duplicatePlayer.evaluate(({ type, sessionId, state }) => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command: {
      type, sessionId, documentId: state.selection.documentId, slideId: state.selection.slideId, mediaId: 'synthetic', revision: state.revision, commandId: crypto.randomUUID(),
      ...(type === 'CHECKPOINT_MEDIA' ? { epoch: 'synthetic', timeSec: 0, paused: true, ended: false } : {}),
    } }), { type, sessionId, state: duplicateSnapshot.snapshot });
    assert.equal(rejectedDuplicate.code, 'NOT_PLAYER_OWNER');
  }
  await duplicatePlayer.setViewportSize({ width: 380, height: 760 });
  await duplicatePlayer.screenshot({ path: resolve(output, 'duplicate-player-380.png'), fullPage: true });
  await duplicatePlayer.close();
  const playbackPrivate = structuredClone(firstAdvance.documents[documentId].slideDeltas);
  await executionRemote.close();
  await waitForBrowserState(player, async ({ sessionId, revision }) => {
    const response = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    return response.ok && response.snapshot.revision >= revision + 2;
  }, { sessionId, revision: firstAdvance.revision });
  const continued = (await snapshot(editor)).session;
  assert.equal(continued.documents[documentId].autoplayCheckpoint.paused, false);
  assert.deepEqual(continued.editorSelection, firstAdvance.editorSelection);
  assert.deepEqual(continued.documents[documentId].slideDeltas, playbackPrivate);
  const stopRemote = await context.newPage(); await stopRemote.goto(`${base}/remote/index.html?sessionId=${sessionId}`);
  await stopRemote.getByRole('button', { name: '자동 넘김 정지', exact: true }).click();
  await stopRemote.waitForFunction(() => document.querySelector('button[aria-label="자동 넘김 재개"]')?.disabled === false);
  const stoppedExecution = (await snapshot(editor)).session;
  assert.equal(stoppedExecution.documents[documentId].autoplayCheckpoint.paused, true);
  await stopRemote.setViewportSize({ width: 380, height: 760 });
  assert.equal(await stopRemote.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await stopRemote.screenshot({ path: resolve(output, 'autoplay-remote-380.png'), fullPage: true });
  const wrongAdvance = await player.evaluate(sessionId => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command: {
    type: 'ADVANCE_AUTOPLAY', sessionId: `${sessionId}-other`, documentId: 'synthetic', slideId: 'synthetic', epoch: 'synthetic', revision: 0, commandId: crypto.randomUUID(),
  } }), sessionId); assert.equal(wrongAdvance.code, 'FORBIDDEN');
  // Synthetic PCM source: actual HTMLAudioElement decode/play/checkpoint, muted only for this test.
  await editor.locator('#editor-document').selectOption(documentId); await editor.locator('#editor-slide').selectOption(slides[0]);
  const wav = Buffer.alloc(44 + 8000 * 12 * 2); wav.write('RIFF', 0); wav.writeUInt32LE(wav.length - 8, 4); wav.write('WAVEfmt ', 8);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(8000, 24); wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write('data', 36); wav.writeUInt32LE(wav.length - 44, 40);
  for (let i = 0; i < 8000 * 12; i++) wav.writeInt16LE(Math.round(Math.sin(i * 2 * Math.PI * 440 / 8000) * 1000), 44 + i * 2);
  await editor.locator('#local-media-input').setInputFiles({ name: 'Synthetic.wav', mimeType: 'audio/wav', buffer: wav });
  await editor.getByRole('status').filter({ hasText: '로컬 미디어를 연결했습니다.' }).waitFor();
  async function checkMediaPreflight(expectedCount) {
    const before = (await snapshot(editor)).session;
    await editor.getByRole('button', { name: '선택 자료 점검', exact: true }).click();
    await preflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor();
    assert((await preflight.textContent()).includes(`연결 미디어 ${expectedCount}/${expectedCount}개`));
    assert.equal(await preflight.locator('[data-result="error"]').count(), 0); assert.deepEqual((await snapshot(editor)).session, before);
    return before;
  }
  await checkMediaPreflight(1);
  async function mediaCommand(page, type, targetId, slideId) {
    const current = (await snapshot(editor)).session;
    const response = await page.evaluate(command => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command }), {
      type, sessionId, documentId: targetId, slideId, revision: current.revision, commandId: crypto.randomUUID(),
    }); assert.equal(response.ok, true); return response.session;
  }
  await mediaCommand(stopRemote, 'GOTO_SLIDE', documentId, slides[0]);
  await player.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
  await player.evaluate(() => {
    const audio = document.querySelector('audio'); audio.volume = 0;
    const nativePlay = audio.play.bind(audio); let rejectOnce = true;
    audio.play = () => { if (rejectOnce) { rejectOnce = false; return Promise.reject(new DOMException('Synthetic autoplay refusal', 'NotAllowedError')); } return nativePlay(); };
  });
  const registeredMedia = (await snapshot(editor)).session, mediaId = Object.keys(registeredMedia.documents[documentId].localMedia)[0];
  assert.equal(registeredMedia.documents[documentId].localMedia[mediaId].fingerprint, createHash('sha256').update(wav).digest('hex'));
  assert.equal(registeredMedia.documents[documentId].localMedia[mediaId].durationSec, 12);
  await stopRemote.getByRole('button', { name: 'Synthetic.wav 재생', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.paused === false || !!document.querySelector('button[aria-label="미디어 재생 허용"]'));
  if (await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).count()) await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.currentTime >= .5 && document.querySelector('audio')?.paused === false);
  const nativePosition = await player.evaluate(() => document.querySelector('audio').currentTime);
  const cdp = await context.newCDPSession(launcher); let workerVersions = []; const workerTransitions = [];
  cdp.on('ServiceWorker.workerVersionUpdated', event => { workerVersions = event.versions;
    workerTransitions.push(...event.versions.filter(version => version.scriptURL === `${base}/background.js`).map(version => version.runningStatus)); });
  await cdp.send('ServiceWorker.enable');
  const workerDeadline = Date.now() + 5000;
  while (!workerVersions.some(version => version.scriptURL === `${base}/background.js` && version.runningStatus === 'running') && Date.now() < workerDeadline) await new Promise(resolve => setTimeout(resolve, 50));
  const ownVersion = workerVersions.find(version => version.scriptURL === `${base}/background.js` && version.runningStatus === 'running'); assert(ownVersion);
  workerTransitions.length = 0;
  await cdp.send('ServiceWorker.stopWorker', { versionId: ownVersion.versionId });
  let retainedOwner; const restartDeadline = Date.now() + 15000;
  while (Date.now() < restartDeadline) {
    retainedOwner = await player.evaluate(sessionId => (window.whale ?? chrome).runtime.sendMessage({ type: 'CLAIM_PLAYER', sessionId }), sessionId).catch(() => null);
    if (retainedOwner?.owned === true && workerTransitions.includes('stopped') && workerTransitions.at(-1) === 'running') break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  await writeFile(resolve(output, 'worker-restart.json'), JSON.stringify({ workerTransitions, retainedOwner }, null, 2));
  assert(workerTransitions.includes('stopped') && workerTransitions.at(-1) === 'running', JSON.stringify(workerTransitions));
  await player.waitForFunction(time => document.querySelector('audio')?.currentTime >= time + .5 && document.querySelector('audio')?.paused === false, nativePosition);
  assert.equal(retainedOwner.owned, true);
  const restartDuplicate = await context.newPage(); await restartDuplicate.goto(`${base}/player/index.html?sessionId=${sessionId}`);
  await restartDuplicate.getByRole('status').filter({ hasText: '다른 발표 창이 실행 중입니다.' }).waitFor();
  assert.equal(await restartDuplicate.locator('audio,video').count(), 0); await restartDuplicate.close(); await cdp.detach();
  await stopRemote.close();
  await player.waitForFunction(time => document.querySelector('audio')?.currentTime >= time + .5 && document.querySelector('audio')?.paused === false, nativePosition);
  const mediaRemote = await context.newPage(); await mediaRemote.goto(`${base}/remote/index.html?sessionId=${sessionId}`);
  const privateMediaBefore = (await snapshot(editor)).session.documents[documentId].slideDeltas;
  await mediaCommand(mediaRemote, 'REOPEN_DOCUMENT', otherId, null);
  await player.waitForFunction(() => !document.querySelector('audio'));
  await waitForBrowserState(editor, async ({ sessionId, documentId, mediaId, minimum }) => {
    const response = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    const bookmark = response.session.documents[documentId].mediaBookmarks[mediaId]; return bookmark.paused && bookmark.timeSec >= minimum;
  }, { sessionId, documentId, mediaId, minimum: nativePosition });
  const afterMediaSwitch = (await snapshot(editor)).session;
  assert.deepEqual(afterMediaSwitch.documents[documentId].slideDeltas, privateMediaBefore);
  await mediaCommand(mediaRemote, 'ACTIVATE_DOCUMENT', documentId, null);
  await player.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
  const returnedMedia = (await snapshot(editor)).session.documents[documentId].mediaBookmarks[mediaId]; assert.equal(returnedMedia.paused, true);
  await player.waitForFunction(time => Math.abs(document.querySelector('audio').currentTime - time) < .15 && document.querySelector('audio').paused, returnedMedia.timeSec);
  await player.evaluate(() => { document.querySelector('audio').volume = 0; });
  await mediaRemote.getByRole('button', { name: 'Synthetic.wav 재생', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.paused === false || !!document.querySelector('button[aria-label="미디어 재생 허용"]'));
  if (await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).count()) await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.paused === false);
  await player.evaluate(() => { document.querySelector('audio').currentTime = 11.7; });
  await player.waitForFunction(() => document.querySelector('audio')?.ended === true);
  await waitForBrowserState(editor, async ({ sessionId, documentId, mediaId }) => {
    const response = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    const bookmark = response.session.documents[documentId].mediaBookmarks[mediaId]; return bookmark.paused && bookmark.ended && bookmark.timeSec >= 11.75;
  }, { sessionId, documentId, mediaId });
  await mediaRemote.setViewportSize({ width: 380, height: 760 });
  assert.equal(await mediaRemote.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mediaRemote.screenshot({ path: resolve(output, 'media-remote-380.png'), fullPage: true });
  const publicMedia = await snapshot(player); assert(!JSON.stringify(publicMedia).includes('Synthetic.wav'));
  async function startMediaAutoplay(mode, seconds) {
    await mediaRemote.locator('#autoplay-mode').selectOption(mode);
    if (seconds !== undefined) await mediaRemote.locator('#autoplay-seconds').fill(String(seconds));
    await mediaRemote.locator('#autoplay-loop').selectOption('none');
    await mediaRemote.getByRole('button', { name: '자동 넘김 설정 적용', exact: true }).click();
    await mediaRemote.getByRole('button', { name: '자동 넘김 재개', exact: true }).click();
    await player.waitForFunction(() => document.querySelector('audio')?.paused === false || !!document.querySelector('button[aria-label="미디어 재생 허용"]'));
    if (await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).count()) await player.getByRole('button', { name: '미디어 재생 허용', exact: true }).click();
    await player.waitForFunction(() => document.querySelector('audio')?.paused === false);
  }
  await startMediaAutoplay('media-end');
  const mediaCycle = (await snapshot(editor)).session;
  assert.equal(mediaCycle.documents[documentId].mediaBookmarks[mediaId].autoplayEpoch, mediaCycle.documents[documentId].autoplayCheckpoint.epoch);
  await player.evaluate(() => { document.querySelector('audio').currentTime = 11.7; });
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[1]);
  const afterEndedAdvance = (await snapshot(editor)).session; assert.equal(afterEndedAdvance.documents[documentId].autoplayCheckpoint.paused, true);
  await mediaCommand(mediaRemote, 'GOTO_SLIDE', documentId, slides[0]);
  await player.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
  await player.evaluate(() => { document.querySelector('audio').volume = 0; });
  await startMediaAutoplay('later-of-time-and-media', 5);
  await player.evaluate(() => { document.querySelector('audio').currentTime = 11.7; });
  await waitForBrowserState(editor, async ({ sessionId, documentId, mediaId }) => {
    const response = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    return response.session.documents[documentId].mediaBookmarks[mediaId].ended === true;
  }, { sessionId, documentId, mediaId });
  const earlyEnded = (await snapshot(editor)).session;
  assert.equal(earlyEnded.presentedSelection.slideId, slides[0]);
  assert(Date.now() - earlyEnded.documents[documentId].autoplayCheckpoint.startedAt < 5000);
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[1]);
  const afterLaterAdvance = (await snapshot(editor)).session;
  assert(afterLaterAdvance.updatedAt - earlyEnded.documents[documentId].autoplayCheckpoint.startedAt >= 5000);
  assert.equal(afterLaterAdvance.documents[documentId].autoplayCheckpoint.paused, true);
  await mediaRemote.screenshot({ path: resolve(output, 'media-ended-autoplay-380.png'), fullPage: true });
  await mediaCommand(mediaRemote, 'GOTO_SLIDE', documentId, slides[0]);
  await player.waitForFunction(() => document.querySelector('audio')?.readyState >= 1);
  await mediaRemote.locator(`#media-${mediaId}-start`).fill('3');
  await mediaRemote.locator(`#media-${mediaId}-end`).fill('5');
  await mediaRemote.locator(`#media-${mediaId}-volume`).press('Home');
  await mediaRemote.locator(`#media-${mediaId}-volume`).press('ArrowRight');
  await mediaRemote.getByRole('button', { name: 'Synthetic.wav 설정 적용', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.paused && Math.abs(document.querySelector('audio').currentTime - 3) < .1 && Math.abs(document.querySelector('audio').volume - .01) < .001);
  await mediaRemote.getByRole('button', { name: 'Synthetic.wav 음소거', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('audio')?.muted);
  await mediaRemote.locator(`#media-${mediaId}-seek`).press('Home');
  await mediaRemote.locator(`#media-${mediaId}-seek`).press('PageUp');
  await mediaRemote.locator(`#media-${mediaId}-seek`).press('PageUp');
  const seekTime = Number(await mediaRemote.locator(`#media-${mediaId}-seek`).inputValue());
  assert(seekTime >= 3.1);
  await mediaRemote.getByRole('button', { name: 'Synthetic.wav 위치 이동', exact: true }).click();
  await player.waitForFunction(time => document.querySelector('audio')?.paused && Math.abs(document.querySelector('audio').currentTime - time) < .05, seekTime);
  await mediaRemote.screenshot({ path: resolve(output, 'media-settings-380.png'), fullPage: true });
  assert.equal(await mediaRemote.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await startMediaAutoplay('media-end');
  await player.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[1]);
  const trimEnded = (await snapshot(editor)).session.documents[documentId].mediaBookmarks[mediaId];
  assert.equal(trimEnded.ended, true); assert.equal(trimEnded.timeSec, 5);
  // Run the native recorder spike first; never substitute a header-only video fixture.
  const videoPath = resolve('node_modules/.cache/whale-video-spike/synthetic.mp4'), videoBytes = await readFile(videoPath);
  await mediaRemote.locator('#autoplay-mode').selectOption('manual');
  await mediaRemote.getByRole('button', { name: '자동 넘김 설정 적용', exact: true }).click();
  const beforeVideoGoto = await mediaCommand(mediaRemote, 'GOTO_SLIDE', documentId, slides[2]);
  try { await editor.waitForFunction(revision => Number(document.querySelector('main')?.dataset.sessionRevision) >= revision, beforeVideoGoto.revision); }
  catch (failure) {
    const ui = await editor.evaluate(() => ({ revision: document.querySelector('main')?.dataset.sessionRevision, statuses: [...document.querySelectorAll('[role="status"]')].map(node => node.textContent), selected: document.querySelector('#editor-slide')?.value }));
    throw new Error(`${failure.message}; Editor=${JSON.stringify(ui)}; expectedRevision=${beforeVideoGoto.revision}`);
  }
  await editor.locator('#editor-slide').selectOption(slides[2]);
  await editor.waitForFunction(({ slideId }) => document.querySelector('#editor-slide')?.value === slideId && document.querySelector('#local-media-input')?.disabled === false, { slideId: slides[2] });
  const beforeVideoImport = (await snapshot(editor)).session; assert.equal(beforeVideoImport.editorSelection.slideId, slides[2]);
  await editor.locator('#local-media-input').setInputFiles({ name: 'Synthetic.mp4', mimeType: 'video/mp4', buffer: videoBytes });
  await editor.getByRole('status').filter({ hasText: '로컬 미디어를 연결했습니다.' }).waitFor();
  const videoRegistered = (await snapshot(editor)).session;
  const videoRef = Object.values(videoRegistered.documents[documentId].localMedia).find(ref => ref.kind === 'video'); assert(videoRef);
  assert.equal(videoRef.slideId, slides[2]);
  assert.equal(videoRef.fingerprint, createHash('sha256').update(videoBytes).digest('hex'));
  assert(videoRef.durationSec > 1 && videoRef.durationSec < 4);
  await checkMediaPreflight(2);
  try { await player.waitForFunction(() => document.querySelector('video')?.readyState >= 1); }
  catch (failure) {
    const diagnostic = await player.evaluate(async sessionId => {
      const video = document.querySelector('video');
      return { snapshot: await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId }),
        media: video ? { src: video.getAttribute('src'), readyState: video.readyState, networkState: video.networkState, error: video.error?.message, duration: video.duration } : null,
        statuses: [...document.querySelectorAll('[role="status"]')].map(node => node.textContent) };
    }, sessionId);
    await writeFile(resolve(output, 'video-diagnostic.json'), JSON.stringify(diagnostic, null, 2));
    throw new Error(`${failure.message}; video=${JSON.stringify(diagnostic)}`);
  }
  await player.evaluate(() => { document.querySelector('video').muted = true; });
  await mediaRemote.getByRole('button', { name: 'Synthetic.mp4 재생', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('video')?.currentTime >= .3 && !document.querySelector('video').paused);
  const videoPixels = await player.evaluate(async () => {
    const video = document.querySelector('video'), canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext('2d'), corners = new Set(); let center;
    for (let i = 0; i < 12; i++) {
      ctx.drawImage(video, 0, 0, 320, 180); center = [...ctx.getImageData(160, 90, 1, 1).data];
      const rgb = [...ctx.getImageData(10, 10, 1, 1).data]; corners.add(rgb[0] > rgb[1] ? 'red' : 'green');
      if (corners.size === 2) break; await new Promise(resolve => setTimeout(resolve, 50));
    }
    return { center, corners: [...corners], width: video.videoWidth, height: video.videoHeight, time: video.currentTime };
  });
  assert.equal(videoPixels.width, 320); assert.equal(videoPixels.height, 180);
  assert(videoPixels.center.slice(0, 3).every(value => value > 220)); assert.equal(videoPixels.corners.length, 2);
  const beforeVideoVolume = (await snapshot(editor)).session.documents[documentId].mediaBookmarks[videoRef.id];
  await mediaRemote.locator(`#media-${videoRef.id}-volume`).press('Home');
  await mediaRemote.locator(`#media-${videoRef.id}-volume`).press('ArrowRight');
  await mediaRemote.getByRole('button', { name: 'Synthetic.mp4 설정 적용', exact: true }).click();
  await player.waitForFunction(time => !document.querySelector('video').paused && document.querySelector('video').currentTime >= time && Math.abs(document.querySelector('video').volume - .01) < .001, videoPixels.time);
  assert.equal((await snapshot(editor)).session.documents[documentId].mediaBookmarks[videoRef.id].epoch, beforeVideoVolume.epoch);
  await mediaRemote.getByRole('button', { name: 'Synthetic.mp4 정지', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('video').paused);
  await waitForBrowserState(editor, async ({ sessionId, documentId, mediaId }) => {
    const state = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    const bookmark = state.session.documents[documentId].mediaBookmarks[mediaId]; return bookmark?.paused && bookmark.timeSec >= .3;
  }, { sessionId, documentId, mediaId: videoRef.id });
  const videoPaused = (await snapshot(editor)).session.documents[documentId].mediaBookmarks[videoRef.id]; assert(videoPaused.timeSec >= .3);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 380, height: 760 }]) {
    await player.setViewportSize(viewport);
    const box = await player.locator('video').boundingBox(); assert(box && box.width > 0 && box.height > 0);
    assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1);
    assert.equal(await player.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await player.screenshot({ path: resolve(output, `video-player-${viewport.width}.png`), fullPage: true });
  }
  await mediaCommand(mediaRemote, 'ACTIVATE_DOCUMENT', otherId, null); await player.waitForFunction(() => !document.querySelector('video'));
  await mediaCommand(mediaRemote, 'ACTIVATE_DOCUMENT', documentId, null);
  await player.waitForFunction(time => document.querySelector('video')?.paused && Math.abs(document.querySelector('video').currentTime - time) < .15, videoPaused.timeSec);
  await player.evaluate(() => { document.querySelector('video').muted = true; });
  await mediaRemote.getByRole('button', { name: 'Synthetic.mp4 재생', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('video')?.paused === false);
  const beforeVideoRemoteClose = await player.evaluate(() => document.querySelector('video').currentTime);
  await mediaRemote.close();
  await player.waitForFunction(time => document.querySelector('video')?.currentTime >= time + .2, beforeVideoRemoteClose);
  await player.waitForFunction(() => document.querySelector('video')?.ended);
  await waitForBrowserState(editor, async ({ sessionId, documentId, mediaId }) => {
    const state = await (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId });
    const bookmark = state.session.documents[documentId].mediaBookmarks[mediaId]; return bookmark?.ended && bookmark.paused;
  }, { sessionId, documentId, mediaId: videoRef.id });
  assert.deepEqual((await snapshot(editor)).session.documents[documentId].slideDeltas, videoRegistered.documents[documentId].slideDeltas);
  assert(!JSON.stringify(await snapshot(player)).includes('Synthetic.mp4'));
  // Seed running metadata only in this isolated fixture DB; no media playback is claimed.
  const checkpointFixture = await editor.evaluate(async ({ sessionId, documentId, otherId, slideId }) => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('naver-ppt-sessions', 1);
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('sessions', 'readwrite', { durability: 'strict' }), store = tx.objectStore('sessions');
        const request = store.get(sessionId); let session;
        request.onsuccess = () => {
          const record = request.result; session = record.session;
          session.documents[documentId].closed = false; session.documents[otherId].closed = false;
          session.presentedSelection = { documentId, slideId }; session.documents[documentId].lastSlideId = slideId;
          session.documents[documentId].autoplay = { mode: 'manual', loop: 'none', pauseWhileEditing: false };
          const startedAt = Date.now() - 1000;
          session.documents[documentId].autoplayCheckpoint = { slideId, epoch: 'synthetic-running', elapsedMs: 500, startedAt, paused: false };
          session.documents[documentId].mediaBookmarks.clip = { mediaId: 'clip', slideId, timeSec: 7, paused: false, replayPolicy: 'resume' };
          session.globalTimer = { scope: 'document', documentId, durationSec: 60, elapsedBeforeStartMs: 50, startedAt, paused: false };
          store.put(record);
        };
        tx.oncomplete = () => resolve(session); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error);
      });
    } finally { db.close(); }
  }, { sessionId, documentId, otherId, slideId: slides[4] });
  const checkpointRemote = await context.newPage(); await checkpointRemote.goto(`${base}/remote/index.html?sessionId=${sessionId}`);
  async function activateCheckpointDocument(id) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const current = (await snapshot(editor)).session;
      const response = await checkpointRemote.evaluate(({ sessionId, documentId, revision }) => (window.whale ?? chrome).runtime.sendMessage({
        type: 'SESSION_COMMAND', command: { type: 'ACTIVATE_DOCUMENT', sessionId, documentId, slideId: null, revision, commandId: crypto.randomUUID() },
      }), { sessionId, documentId: id, revision: current.revision });
      if (!response.ok && response.code === 'STALE_REVISION' && attempt === 0) continue;
      assert.equal(response.ok, true, JSON.stringify(response)); return response.session;
    }
  }
  const switchedCheckpoint = await activateCheckpointDocument(otherId);
  const elapsedDelta = switchedCheckpoint.updatedAt - checkpointFixture.documents[documentId].autoplayCheckpoint.startedAt;
  assert.deepEqual(switchedCheckpoint.documents[documentId].autoplayCheckpoint, {
    slideId: slides[4], epoch: 'synthetic-running', elapsedMs: 500 + elapsedDelta, startedAt: null, paused: true,
  });
  assert.equal(switchedCheckpoint.globalTimer.elapsedBeforeStartMs, 50 + elapsedDelta);
  assert.equal(switchedCheckpoint.globalTimer.paused, true);
  assert.deepEqual(switchedCheckpoint.documents[documentId].mediaBookmarks.clip, { mediaId: 'clip', slideId: slides[4], timeSec: 7, paused: true, replayPolicy: 'resume' });
  assert.deepEqual(switchedCheckpoint.editorSelection, checkpointFixture.editorSelection);
  assert.deepEqual(switchedCheckpoint.documents[documentId].slideDeltas, checkpointFixture.documents[documentId].slideDeltas);
  const recoveryExpected = await activateCheckpointDocument(documentId);
  assert.equal(recoveryExpected.presentedSelection.slideId, slides[4]);
  assert.deepEqual(recoveryExpected.documents[documentId].autoplayCheckpoint, switchedCheckpoint.documents[documentId].autoplayCheckpoint);
  await checkpointRemote.close(); assert.deepEqual((await snapshot(editor)).session, recoveryExpected);
  const successor = await context.newPage(); await successor.goto(`${base}/player/index.html?sessionId=${sessionId}`);
  await successor.getByRole('status').filter({ hasText: '다른 발표 창이 실행 중입니다.' }).waitFor();
  await player.close();
  await successor.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slides[4]);
  assert.deepEqual((await snapshot(editor)).session, recoveryExpected);
  await context.close(); context = await chromium.launchPersistentContext(profile, options);
  const recovered = await context.newPage(); await recovered.goto(`${base}/editor/index.html?sessionId=${sessionId}`);
  await recovered.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  assert.deepEqual((await snapshot(recovered)).session, recoveryExpected);
  await recovered.getByRole('button', { name: '선택 자료 점검', exact: true }).click();
  const coldPreflight = recovered.getByRole('region', { name: '발표 전 점검', exact: true });
  await coldPreflight.getByRole('status').filter({ hasText: '점검을 마쳤습니다.' }).waitFor();
  assert(await coldPreflight.locator('[data-result="error"]').count() >= 1); assert((await coldPreflight.textContent()).includes('같은 원본을 다시 연결하세요.'));
  assert.deepEqual((await snapshot(recovered)).session, recoveryExpected);
  const report = { result: 'PASS', test: 'Actual Whale MV3/windows + Player quick editor contextmenu/synthetic longpress/reuse/draft preservation + PDF/private notes + saved-file revalidation + current/all close/draft preservation + PDF copy extension CSP/UI/native writer/readback + existing-file refusal/cancel/snapshot preservation + independent Node PDF reader mask/text + clean restart paused checkpoint recovery',
    preflight: 'PASS: synthetic external link/document script warnings, native WAV/MP4 source/hash/metadata inspection without session mutation, cold restart missing source errors retain session, cancel/private/Player preserved; no full fidelity/offline claim',
    checkpoint: 'PASS: isolated running metadata fixture, actual worker A-B-A/CAS/strict DB pauses elapsed/media/document timer and retains last-page/editor/deltas; Remote close and clean restart retain full state',
    autoplay: 'PASS: actual Remote settings/play/pause + Player one-second range loop continues at least two advances with Remote closed; private state/editor selection retained; other-session advance forbidden; 380px no overflow',
    media: 'PASS: actual WAV metadata/SHA256, synthetic autoplay rejection -> Player gesture -> native muted Audio decode/time progression with Remote closed, document switch pause/tail checkpoint, return seeks retained position paused, native ended checkpoint, public excludes filename',
    mediaAutoplay: 'PASS: native WAV ended moves A1 to A2, no-media A2 pauses; later-of mode retains A1 after early ended and advances only after five-second deadline; cycle binding retained',
    mediaControls: 'PASS: Remote trim 3-5s/volume 1%/mute/paused seek, native Player properties and actual trim end checkpoint -> media-end advance, 380px settings',
    playerOwner: 'PASS: actual sender.documentId/getContexts/Web Locks/strict owner DB, duplicate Player black standby without media/PDF and ADVANCE/PLAY/CHECKPOINT denied; actual CDP stops only product worker -> replacement worker, WAV continues and owner retained/duplicate denied; original close -> successor gets authority without session mutation; clean process restart recovers session',
    video: { result: 'PASS: native synthetic H.264 MP4 registration/hash/duration, actual Player moving decoded pixels, Remote pause/resume, A-B-A paused position, Remote closed progression, natural ended checkpoint, private deltas retained, 1366/380px bounded video', videoPixels },
    environment, executablePath, output, profile, limitation: 'Headless isolated Whale profile; synthetic input and OPFS output picker stand-ins. Actual muted WAV and synthetic H.264 MP4 playback run in Player; separate checkpoint fixture seeds metadata only. Other MP4 codecs/MP3/WebM, audible output, native OS chooser/downloads/external PDF viewer, physical monitors, abnormal crash, IME/touch and five-minute focus remain separate gates.' };
  await writeFile(resolve(profile, 'verification-result.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await context?.close(); }
