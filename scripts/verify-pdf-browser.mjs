import assert from 'node:assert/strict';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const modulePath = process.argv[2];
if (!modulePath) throw new Error('Usage: node scripts/verify-pdf-browser.mjs <playwright/index.mjs> [base-url]');
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const base = process.argv[3] ?? 'http://127.0.0.1:5173';
const pageBase = process.argv[4] ?? base;
const output = resolve('node_modules/.cache/pdf-browser'); await mkdir(output, { recursive: true });
const fixtures = ['A', 'B'].map(name => ({ name: `${name}.pdf`, mimeType: 'application/pdf', buffer: createFixturePdf(name) }));
for (const file of fixtures) await writeFile(resolve(output, file.name), file.buffer);
const hashes = fixtures.map(file => createHash('sha256').update(file.buffer).digest('hex'));
const browser = await chromium.launch({ channel: process.env.NAVER_PPT_BROWSER_CHANNEL ?? 'msedge', headless: true });
try {
  const context = await browser.newContext(); const pages = new Map(); const errors = [], external = [];
  context.setDefaultTimeout(20000);
  console.log('PDF browser: context ready');
  if (pageBase !== base) {
    const manifest = JSON.parse(await readFile(resolve('dist/manifest.json'), 'utf8'));
    await context.route(`${pageBase}/**`, async route => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': manifest.content_security_policy.extension_pages } });
    });
  }
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  context.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith(pageBase) && !request.url().startsWith('data:')) external.push(request.url()); });
  const control = await context.newPage(); await control.goto(`${base}/launcher/`);
  await control.exposeBinding('__publish', async (_, session) => {
    for (const [role, page] of pages) {
      const response = await control.evaluate(async ({ role, session }) => {
        const { snapshotFor } = await import('/background/sessionHub.ts'); return snapshotFor(role, session);
      }, { role, session });
      await page.evaluate(response => window.__receive(response), response);
    }
  });
  const sessionId = await control.evaluate(async () => {
    const { SessionHub } = await import('/background/sessionHub.ts');
    const { IndexedDbSessionRepository } = await import('/storage/indexedDbSessionRepository.ts');
    window.__hub = new SessionHub(async () => {
      const repo = await IndexedDbSessionRepository.open(), commit = repo.commit.bind(repo);
      repo.commit = (...args) => window.__failWrites ? Promise.reject(new DOMException('Synthetic full disk', 'QuotaExceededError')) : commit(...args);
      return repo;
    }, session => { void window.__publish(session); });
    const result = await window.__hub.handle('launcher', { type: 'CREATE_SESSION', title: 'Synthetic PDF lesson' });
    if (!result.ok) throw new Error('create failed'); return result.session.id;
  });
  async function rolePage(role) {
    const page = await context.newPage(); pages.set(role, page);
    await page.exposeBinding('__transport', async (_, request) => control.evaluate(({ role, request }) => window.__hub.handle(role, request), { role, request }));
    await page.addInitScript(() => {
      window.showOpenFilePicker = undefined;
      const listeners = []; window.__receive = response => listeners.forEach(fn => fn(response));
      window.whale = { runtime: { id: 'auxiliary-pdf-test', sendMessage: request => window.__transport(request),
        connect: () => ({ onMessage: { addListener: fn => {
          listeners.push(fn); window.__transport({ type: 'GET_SESSION', sessionId: new URL(location.href).searchParams.get('sessionId') }).then(fn);
        } }, onDisconnect: { addListener: () => {} }, disconnect: () => {} }),
      } };
    });
    await page.goto(`${pageBase}/${role}/?sessionId=${sessionId}`); return page;
  }
  const editor = await rolePage('editor'); await editor.setViewportSize({ width: 1366, height: 768 });
  await editor.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  await editor.locator('#pdf-import').setInputFiles(fixtures);
  try { await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor(); }
  catch (error) { await editor.screenshot({ path: resolve(output, 'failure.png'), fullPage: true }); throw new Error(`${error.message}\n${await editor.locator('body').innerText()}\n${JSON.stringify(errors)}`); }
  const state = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, sessionId);
  console.log('PDF browser: imports ready');
  assert.equal(state.documentOrder.length, 2); assert.equal(state.presentedSelection, null);
  const [a, b] = state.documentOrder;
  assert.equal(state.documents[a].source.fingerprint, hashes[0]); assert.equal(state.documents[b].source.fingerprint, hashes[1]);
  const player = await rolePage('player'); await player.setViewportSize({ width: 1366, height: 768 });
  const remote = await rolePage('remote');
  async function command(role, type, docId, pageIndex = null, extra = {}) {
    return control.evaluate(async ({ role, type, docId, pageIndex, extra, sessionId }) => {
      const state = (await window.__hub.handle(role, { type: 'GET_SESSION', sessionId })).session;
      return window.__hub.handle(role, { type: 'SESSION_COMMAND', command: { type, sessionId, documentId: docId,
        slideId: pageIndex === null ? null : state.documents[docId].slideIds[pageIndex - 1], revision: state.revision,
        commandId: crypto.randomUUID(), ...extra } });
    }, { role, type, docId, pageIndex, extra, sessionId });
  }
  async function pixel(page, slideId) {
    await page.waitForFunction(id => { const canvas = document.querySelector('.pdf-stage canvas'); return canvas?.dataset.slideId === id && canvas.width > 0; }, slideId);
    return page.locator('.pdf-stage canvas').first().evaluate(canvas => [...canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data]);
  }
  const near = (actual, expected) => expected.forEach((value, i) => assert(Math.abs(actual[i] - value) <= 2, `${actual} != ${expected}`));
  assert.equal((await command('remote', 'ACTIVATE_DOCUMENT', a)).ok, true);
  await command('remote', 'GOTO_SLIDE', a, 5); const a5 = state.documents[a].slideIds[4];
  near(await pixel(player, a5), [128, 38, 77, 255]);
  console.log('PDF browser: A5 rendered');
  await command('editor', 'SELECT_EDITOR_SLIDE', b, 8); const b8 = state.documents[b].slideIds[7];
  near(await pixel(editor, b8), [26, 204, 77, 255]); near(await pixel(player, a5), [128, 38, 77, 255]);
  await editor.locator('#presenter-note').fill('Synthetic teacher-only note'); await editor.getByRole('button', { name: '노트 저장' }).click();
  await editor.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
  assert(!(await player.locator('body').innerText()).includes('teacher-only'));
  console.log('PDF browser: B8/private note ready');
  async function dragOverlay(tool, start, end) {
    await editor.getByRole('button', { name: tool, exact: true }).click();
    const rect = await editor.locator('.overlay-interaction').boundingBox(); assert(rect);
    await editor.mouse.move(rect.x + rect.width * start[0], rect.y + rect.height * start[1]);
    await editor.mouse.down(); await editor.mouse.move(rect.x + rect.width * end[0], rect.y + rect.height * end[1], { steps: 12 }); await editor.mouse.up();
  }
  async function overlayPixel(page) {
    return page.locator('.overlay-canvas').evaluate(canvas => [...canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data]);
  }
  await dragOverlay('가리개', [.4, .4], [.6, .6]);
  console.log('PDF browser: B8 mask drafted');
  assert.equal((await overlayPixel(player))[3], 0); assert.equal(await editor.locator('#editor-slide').isDisabled(), true);
  await editor.getByRole('button', { name: '실행 취소', exact: true }).click();
  assert.equal(await editor.locator('#overlay-selection option').count(), 1);
  await editor.getByRole('button', { name: '다시 실행', exact: true }).click();
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  console.log('PDF browser: B8 mask committed');
  assert.equal((await overlayPixel(player))[3], 0); near(await pixel(player, a5), [128, 38, 77, 255]);
  await command('editor', 'SELECT_EDITOR_SLIDE', a, 5); await pixel(editor, a5);
  await dragOverlay('가리개', [.4, .4], [.6, .6]); assert.equal((await overlayPixel(player))[3], 0);
  await command('editor', 'SELECT_EDITOR_SLIDE', b, 8);
  assert.equal(await editor.locator('#editor-slide').inputValue(), a5);
  await command('editor', 'SELECT_EDITOR_SLIDE', a, 5);
  await control.evaluate(() => { window.__failWrites = true; });
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '변경을 저장하지 못했습니다.' }).waitFor();
  assert.equal((await overlayPixel(player))[3], 0); assert.equal(await editor.locator('#editor-slide').isDisabled(), true);
  await control.evaluate(() => { window.__failWrites = false; });
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await player.waitForFunction(() => { const c = document.querySelector('.overlay-canvas'); return c && c.getContext('2d').getImageData(c.width / 2, c.height / 2, 1, 1).data[3] === 255; });
  near(await overlayPixel(player), [0, 0, 0, 255]); near(await pixel(player, a5), [128, 38, 77, 255]);
  console.log('PDF browser: A5 mask committed');
  await dragOverlay('글상자', [.05, .05], [.8, .3]);
  await editor.locator('#overlay-text').fill('교실에서 함께 배우는 한글');
  await editor.locator('#overlay-text').dispatchEvent('compositionstart');
  assert.equal(await editor.getByRole('button', { name: '편집 확정', exact: true }).isDisabled(), true);
  await editor.locator('#overlay-text').dispatchEvent('compositionend');
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  await editor.locator('#overlay-text').fill('가'.repeat(10000));
  await editor.getByRole('status').filter({ hasText: '글상자에 내용이 맞지 않습니다.' }).waitFor();
  assert.equal(await editor.getByRole('button', { name: '편집 확정', exact: true }).isDisabled(), true);
  await editor.getByRole('button', { name: '편집 취소', exact: true }).click();
  await dragOverlay('판서', [.05, .8], [.3, .9]);
  await editor.getByRole('button', { name: '편집 확정', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '편집을 확정했습니다.' }).waitFor();
  const overlayState = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, sessionId);
  assert.equal(overlayState.documents[a].slideDeltas[a5].overlays.length, 3);
  assert.equal(overlayState.documents[a].slideDeltas[a5].overlays[2].kind, 'stroke');
  assert.equal(overlayState.documents[b].slideDeltas[b8].presenterNote, 'Synthetic teacher-only note');
  await command('editor', 'SELECT_EDITOR_SLIDE', b, 8); await pixel(editor, b8);
  const fontFits = await control.evaluate(async () => {
    const { textboxLayout, colorCandidates } = await import('/overlays/canvasLayer.ts');
    await document.fonts.ready; await document.fonts.load('16px "Malgun Gothic"');
    const canvas = document.createElement('canvas'); canvas.width = 1280; canvas.height = 720; const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, 1280, 720);
    if (colorCandidates(canvas, .5, .5)[0] !== '#000000') throw new Error('black sampling lost');
    const results = [];
    for (const aspect of [16 / 9, 4 / 3, 3 / 4]) for (const text of ['함께 배우는 한글', '첫 줄\n두 번째 줄', '가'.repeat(1000)]) {
      const box = { kind: 'textbox', id: 'fit', visible: true, zIndex: 1, rect: { x: .1, y: .1, width: .35, height: .25 }, text,
        color: '#000000', backgroundColor: '#ffffff', fontFamily: 'Malgun Gothic', minFontPx: 12, maxFontPx: 96,
        fitMode: 'auto-max', paddingPx: 8, lineHeight: 1.25, align: 'left', verticalAlign: 'top' };
      const fit = textboxLayout(box, ctx, aspect);
      if (fit.fits && fit.fontPx < 96 && textboxLayout({ ...box, fitMode: 'manual', fontPx: fit.fontPx + 1 }, ctx, aspect).fits) throw new Error('not maximum font');
      if (text.length === 1000 && fit.fits) throw new Error('overflow hidden');
      results.push({ aspect, length: text.length, fontPx: fit.fontPx, fits: fit.fits });
    }
    return results;
  });
  await command('remote', 'ACTIVATE_DOCUMENT', b); await command('remote', 'GOTO_SLIDE', b, 2);
  near(await pixel(player, state.documents[b].slideIds[1]), [26, 51, 77, 255]);
  await command('remote', 'ACTIVATE_DOCUMENT', a); near(await pixel(player, a5), [128, 38, 77, 255]);
  await editor.locator('#pdf-import').setInputFiles(fixtures[0]);
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const after = await control.evaluate(async id => (await window.__hub.handle('editor', { type: 'GET_SESSION', sessionId: id })).session, sessionId);
  assert.equal(after.documentOrder.length, 2); assert.equal(after.documents[b].slideDeltas[b8].presenterNote, 'Synthetic teacher-only note');
  assert.equal(after.presentedSelection.slideId, a5);
  await remote.close(); pages.delete('remote'); near(await pixel(player, a5), [128, 38, 77, 255]);
  for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 800], [768, 1024], [380, 760]]) {
    await player.setViewportSize({ width, height }); await editor.setViewportSize({ width, height });
    await pixel(player, a5); await pixel(editor, b8);
    assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await player.screenshot({ path: resolve(output, `player-${width}.png`) });
    await editor.screenshot({ path: resolve(output, `editor-${width}.png`), fullPage: true });
  }
  await context.setOffline(true);
  await command('remote', 'GOTO_SLIDE', a, 6);
  near(await pixel(player, state.documents[a].slideIds[5]), [153, 38, 77, 255]);
  await context.setOffline(false);
  const handleKey = 'synthetic-native-handle';
  await control.evaluate(async ({ bytes, fingerprint, key }) => {
    // This generated OPFS fixture is test input, never an automatic copy path in the product.
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('synthetic-handle.pdf', { create: true });
    const writer = await handle.createWritable(); await writer.write(new Uint8Array(bytes)); await writer.close();
    const { IndexedDbSourceHandles } = await import('/storage/sourceVault.ts');
    await new IndexedDbSourceHandles().write({ key, fingerprint, handle });
  }, { bytes: [...fixtures[0].buffer], fingerprint: hashes[0], key: handleKey });
  await control.reload();
  const recoveredHash = await control.evaluate(async key => {
    const { IndexedDbSourceHandles, SourceVault } = await import('/storage/sourceVault.ts');
    const vault = new SourceVault(new IndexedDbSourceHandles()); const source = await vault.get(key); vault.close(); return source.fingerprint;
  }, handleKey);
  assert.equal(recoveredHash, hashes[0]);
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  assert.deepEqual(fixtures.map(file => createHash('sha256').update(file.buffer).digest('hex')), hashes);
  console.log(JSON.stringify({ result: 'PASS', test: 'real PDFs + draft/commit + undo/redo + write failure/retry + pinned draft selection + IME events + actual font maxima/overflow + A5/B2/A5 + resize + offline + handle IDB', pageBase, productionCsp: pageBase !== base, hashes, fontFits, output,
    limitation: 'Auxiliary Edge web origin, mocked extension transport. Whale/FSA restart/advanced PDF fidelity remain unverified.' }));
} finally { await browser.close(); }
