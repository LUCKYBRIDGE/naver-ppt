import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const base = process.argv[3] ?? 'http://127.0.0.1:5173', pageBase = process.argv[4] ?? base;
const output = resolve('node_modules/.cache/session-files-browser'); await mkdir(output, { recursive: true });
const source = { name: 'Synthetic-A.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('A') };
const hash = createHash('sha256').update(source.buffer).digest('hex');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const context = await browser.newContext({ acceptDownloads: true }); context.setDefaultTimeout(20000);
  const pages = new Map(), errors = [], external = [], saved = [];
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  context.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith(pageBase) && !/^(?:blob:|data:|edge:|chrome:)/.test(request.url())) external.push(request.url()); });
  if (pageBase !== base) {
    const manifest = JSON.parse(await readFile(resolve('dist/manifest.json'), 'utf8'));
    await context.route(`${pageBase}/**`, async route => { const response = await route.fetch(); await route.fulfill({ response,
      headers: { ...response.headers(), 'content-security-policy': manifest.content_security_policy.extension_pages } }); });
  }
  const control = await context.newPage(); await control.goto(`${base}/launcher/`);
  await control.exposeBinding('__publish', async (_, session) => {
    for (const [page, role] of pages) {
      const snapshot = await control.evaluate(async ({ session, role }) => (await import('/background/sessionHub.ts')).snapshotFor(role, session), { session, role });
      await page.evaluate(snapshot => window.__receive(snapshot), snapshot);
    }
  });
  const originalId = await control.evaluate(async () => {
    const { SessionHub } = await import('/background/sessionHub.ts'), { IndexedDbSessionRepository } = await import('/storage/indexedDbSessionRepository.ts');
    window.__hub = new SessionHub(() => IndexedDbSessionRepository.open(), session => { void window.__publish(session); });
    const result = await window.__hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Synthetic backup lesson' }); return result.session.id;
  });
  async function rolePage(role, sessionId = originalId) {
    const page = await context.newPage(); pages.set(page, role);
    await page.exposeBinding('__transport', (_, request) => control.evaluate(({ role, request }) => window.__hub.handle(role, request), { role, request }));
    await page.addInitScript(() => {
      window.showOpenFilePicker = undefined; window.showSaveFilePicker = undefined;
      const listeners = [], downloadListeners = new Set(); let nextId = 1;
      window.__downloads = new Map(); window.__mode = 'normal'; window.__receive = response => {
        if (response.ok && response.kind === 'teacher' && response.session.id !== new URL(location.href).searchParams.get('sessionId')) return;
        listeners.forEach(fn => fn(response));
      };
      window.whale = { runtime: { id: 'auxiliary-save-test', sendMessage: request => window.__transport(request),
        connect: () => ({ onMessage: { addListener: fn => { listeners.push(fn); window.__transport({ type: 'GET_SESSION', sessionId: new URL(location.href).searchParams.get('sessionId') }).then(fn); } },
          onDisconnect: { addListener: () => {} }, disconnect: () => {} }) },
        downloads: { download: async options => {
          if (window.__mode === 'cancel') throw new DOMException('Synthetic chooser cancel', 'AbortError');
          const id = nextId++; window.__downloads.set(id, { id, url: options.url, filename: options.filename, byExtensionId: 'auxiliary-save-test',
            state: 'in_progress', exists: false, fileSize: 0, bytesReceived: 0 });
          const a = document.createElement('a'); a.href = options.url; a.download = options.filename; document.body.append(a); a.click(); a.remove(); return id;
        }, search: async query => [window.__downloads.get(query.id)], onChanged: { addListener: fn => downloadListeners.add(fn), removeListener: fn => downloadListeners.delete(fn) } } };
      window.__completeDownload = ({ name, path, size }) => {
        const item = [...window.__downloads.values()].find(item => item.filename === name && item.state === 'in_progress');
        if (!item) throw new Error('matching download missing'); Object.assign(item, { state: 'complete', exists: true, fileSize: size, bytesReceived: size, filename: path });
        downloadListeners.forEach(fn => fn({ id: item.id, state: { current: 'complete' } }));
      };
    });
    page.on('download', async download => {
      try {
        const path = resolve(output, download.suggestedFilename()); await download.saveAs(path); const bytes = await readFile(path);
        saved.push({ name: download.suggestedFilename(), path, bytes });
        if (await page.evaluate(() => window.__mode !== 'hold')) await page.evaluate(data => window.__completeDownload(data), { name: download.suggestedFilename(), path, size: bytes.length });
      } catch (error) { errors.push(error.message); }
    });
    await page.goto(`${pageBase}/${role}/?sessionId=${sessionId}`); return page;
  }
  const editor = await rolePage('editor');
  async function journalRecords(page) {
    return page.evaluate(() => new Promise((resolve, reject) => {
      const request = indexedDB.open('naver-ppt-save-journal', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result, tx = db.transaction('attempts'), get = tx.objectStore('attempts').getAll();
        tx.oncomplete = () => { db.close(); resolve(get.result); };
        tx.onabort = () => { db.close(); reject(tx.error); };
      };
    }));
  }
  await editor.locator('#pdf-import').setInputFiles(source);
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const original = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, originalId);
  const documentId = original.documentOrder[0], slideId = original.documents[documentId].slideIds[4];
  async function command(type, extra = {}, id = originalId) {
    return control.evaluate(async ({ type, extra, id, documentId, slideId }) => {
      const current = (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session;
      return window.__hub.handle(type === 'ACTIVATE_DOCUMENT' || type === 'GOTO_SLIDE' ? 'remote' : 'editor', { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, revision: current.revision, commandId: crypto.randomUUID(), ...extra } });
    }, { type, extra, id, documentId, slideId });
  }
  await command('ACTIVATE_DOCUMENT', { slideId: null }); await command('GOTO_SLIDE');
  await command('SELECT_EDITOR_SLIDE'); await command('SET_PRESENTER_NOTE', { note: 'Synthetic private backup note' });
  await command('SET_SLIDE_OVERLAYS', { overlays: [{ id: 'mask', kind: 'mask', visible: true, zIndex: 1, color: '#000000', rect: { x: .4, y: .4, width: .2, height: .2 } }] });
  await editor.locator('#presenter-note').fill('Uncommitted note'); assert.equal(await editor.getByRole('button', { name: '편집정보 저장', exact: true }).isDisabled(), true);
  await editor.getByRole('button', { name: '변경 취소', exact: true }).click();
  await editor.evaluate(() => { window.__mode = 'hold'; });
  await editor.getByRole('button', { name: '편집정보 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '파일 저장 확인 중' }).waitFor();
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { clearInterval(poll); reject(new Error('PC download did not finish')); }, 20000);
    const poll = setInterval(() => { if (saved.length) { clearInterval(poll); clearTimeout(timeout); resolve(); } }, 50);
  });
  assert.equal(await editor.getByRole('status').filter({ hasText: '저장 완료' }).count(), 0);
  const prepared = (await journalRecords(editor))[0];
  assert.equal(prepared.state, 'prepared'); assert.equal(prepared.sessionId, originalId);
  assert.equal(prepared.sha256, createHash('sha256').update(saved[0].bytes).digest('hex'));
  assert.equal(prepared.bytes, saved[0].bytes.length); assert(!('filename' in prepared)); assert(!('file' in prepared));
  // A real PC file is read before the transport double reports downloads completion.
  await editor.evaluate(data => window.__completeDownload(data), { name: saved[0].name, path: saved[0].path, size: saved[0].bytes.length });
  await editor.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const bundle = JSON.parse(saved[0].bytes.toString('utf8')); assert.equal(bundle.format, 'whale-class-presenter');
  assert.deepEqual((await journalRecords(editor))[0], { ...prepared, state: 'complete', completedAt: (await journalRecords(editor))[0].completedAt,
    transport: 'downloads', downloadId: 1 });
  assert.equal(prepared.revision, bundle.session.revision);
  assert.equal(bundle.session.documents[documentId].slideDeltas[slideId].presenterNote, 'Synthetic private backup note');
  assert.equal(bundle.session.documents[documentId].slideDeltas[slideId].overlays.length, 1); assert.equal(bundle.session.documents[documentId].source.fingerprint, hash);
  assert(!saved[0].bytes.toString('utf8').includes('fileHandleKey'));
  const before = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, originalId);
  await editor.evaluate(() => { window.__mode = 'cancel'; }); await editor.getByRole('button', { name: '편집정보 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '저장을 취소했습니다.' }).waitFor();
  assert.deepEqual(await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, originalId), before);
  const launcher = await rolePage('launcher'); await launcher.locator('#session-import').setInputFiles(saved[0].path);
  const reopenedEvidence = (await journalRecords(launcher)).find(record => record.exportId === prepared.exportId);
  assert.equal(reopenedEvidence.state, 'complete'); assert.equal(reopenedEvidence.sha256, prepared.sha256);
  assert((await journalRecords(launcher)).some(record => record.state === 'cancelled'));
  await launcher.getByRole('status').filter({ hasText: '새 복구 수업을 만들었습니다.' }).waitFor();
  const restoredId = await launcher.locator('#lesson-select').inputValue(); assert.notEqual(restoredId, originalId);
  const restored = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, restoredId);
  assert.equal(restored.revision, 0); assert.equal(restored.presentedSelection, null); assert.equal(restored.documents[documentId].dirty, true);
  assert.equal(restored.documents[documentId].lastSlideId, slideId);
  assert.deepEqual(restored.documents[documentId].slideDeltas, bundle.session.documents[documentId].slideDeltas);
  await launcher.locator('#session-import').setInputFiles({ name: 'bad.wcp.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ ...bundle, schemaVersion: 99 })) });
  await launcher.getByRole('status').filter({ hasText: '지원하지 않는 편집정보 버전' }).waitFor(); assert.equal(await launcher.locator('#lesson-select').inputValue(), restoredId);
  const restoredEditor = await rolePage('editor', restoredId); await restoredEditor.locator('#pdf-reconnect').setInputFiles(source);
  await restoredEditor.getByRole('status').filter({ hasText: '같은 원본을 다시 연결했습니다.' }).waitFor();
  await restoredEditor.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slideId);
  assert.equal(await restoredEditor.locator('#presenter-note').inputValue(), 'Synthetic private backup note');
  const restoredPlayer = await rolePage('player', restoredId); await restoredPlayer.locator('.standby').waitFor();
  assert(!(await restoredPlayer.locator('body').innerText()).includes('Synthetic private backup note'));
  await command('ACTIVATE_DOCUMENT', { slideId: null }, restoredId);
  await restoredPlayer.waitForFunction(id => document.querySelector('.pdf-stage canvas')?.dataset.slideId === id, slideId);
  await restoredEditor.waitForFunction(() => { const c = document.querySelector('.overlay-canvas'); return c && c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3] === 255; });
  const native = await restoredEditor.evaluate(async () => {
    // Generated test output only: product does not copy source PDFs into OPFS.
    const root = await navigator.storage.getDirectory(); const handle = await root.getFileHandle(`synthetic-${crypto.randomUUID()}.wcp.json`, { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await restoredEditor.getByRole('button', { name: '편집정보 저장', exact: true }).click(); await restoredEditor.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const nativeText = await restoredEditor.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), native);
  assert.equal(JSON.parse(nativeText).session.id, restoredId);
  await restoredEditor.getByRole('button', { name: '편집정보 저장', exact: true }).click(); await restoredEditor.getByRole('status').filter({ hasText: '기존 파일은 덮어쓰지 않습니다.' }).waitFor();
  assert.equal(await restoredEditor.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), native), nativeText);
  for (const width of [1366, 380]) {
    await editor.setViewportSize({ width, height: 768 }); await launcher.setViewportSize({ width, height: 768 });
    assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await launcher.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await editor.screenshot({ path: resolve(output, `editor-${width}.png`), fullPage: true }); await launcher.screenshot({ path: resolve(output, `launcher-${width}.png`), fullPage: true });
  }
  assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.equal(createHash('sha256').update(source.buffer).digest('hex'), hash);
  assert.deepEqual(await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, originalId), before);
  console.log(JSON.stringify({ result: 'PASS', test: 'PC JSON download/read + prepared/hash before completion + durable terminal evidence from another page + cancel preservation + new strict import + corrupt rejection + reconnect + native OPFS write/readback/no overwrite',
    pageBase, productionCsp: pageBase !== base, output, sourceHash: hash, backupHash: createHash('sha256').update(saved[0].bytes).digest('hex'),
    limitation: 'Edge web origin; extension runtime/downloads broker and OS chooser are doubles; actual PC download and native OPFS writer used. Whale still unverified.' }));
} finally { await browser.close(); }
