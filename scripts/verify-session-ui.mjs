import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Layout-only synthetic runtime. This is not Whale extension compatibility evidence.
const modulePath = process.argv[2];
if (!modulePath) throw new Error('Usage: node scripts/verify-session-ui.mjs <playwright/index.mjs> [base-url]');
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const browser = await chromium.launch({ headless: true, channel: process.env.NAVER_PPT_BROWSER_CHANNEL ?? 'msedge' });
const base = process.argv[3] ?? 'http://127.0.0.1:5173';
const output = resolve('node_modules/.cache/session-ui');
await mkdir(output, { recursive: true });
try {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const session = { id: 'synthetic', title: '합성 수업 자료 확인', revision: 0, documentOrder: ['A'],
      documents: { A: { id: 'A', source: { type: 'pdf', name: '합성자료.pdf' }, slideIds: ['A-1', 'A-2'], lastSlideId: 'A-1',
        slideDeltas: { 'A-2': { presenterNote: '교사만 보는 합성 노트', overlays: [] } } } },
      presentedSelection: { documentId: 'A', slideId: 'A-1' }, editorSelection: { documentId: 'A', slideId: 'A-2' } };
    const handlers = [];
    const response = () => location.pathname.includes('player')
      ? { ok: true, kind: 'player', snapshot: { sessionId: session.id, revision: session.revision, selection: session.presentedSelection, overlays: [] } }
      : { ok: true, kind: 'teacher', session: structuredClone(session) };
    window.whale = { runtime: { id: 'layout-only',
      connect: () => ({ onMessage: { addListener: fn => { handlers.push(fn); queueMicrotask(() => fn(response())); } },
        onDisconnect: { addListener: () => {} }, disconnect: () => {} }),
      sendMessage: async request => {
        if (request.type === 'LIST_SESSIONS') return { ok: true, kind: 'list', sessions: [{ id: session.id, title: session.title }] };
        if (request.type === 'CREATE_SESSION') { session.title = request.title; return response(); }
        if (request.type === 'OPEN_WINDOW') return { ok: true, windowId: 1 };
        if (request.command?.type === 'SET_PRESENTER_NOTE') {
          session.documents.A.slideDeltas['A-2'].presenterNote = request.command.note;
          session.revision++; handlers.forEach(fn => fn(response()));
        }
        return response();
      },
    } };
  });
  for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 800], [768, 1024], [380, 760]]) {
    for (const role of ['launcher', 'remote', 'editor', 'player']) {
      const page = await context.newPage(); await page.setViewportSize({ width, height });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/${role}/?sessionId=synthetic`);
      if (role === 'launcher') await page.locator('#lesson-select').selectOption('synthetic');
      else if (role !== 'player') await page.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
      if (role === 'editor') {
        await page.locator('#presenter-note').fill('수정한 합성 노트');
        assert.equal(await page.locator('#editor-document').isDisabled(), true);
        await page.getByRole('button', { name: '노트 저장' }).click();
        await page.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor();
        assert.equal(await page.locator('#presenter-note').inputValue(), '수정한 합성 노트');
      }
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        controls: [...document.querySelectorAll('input,select,textarea,button')].map(el => {
          const rect = el.getBoundingClientRect(); return { left: rect.left, right: rect.right, height: rect.height };
        }),
        background: getComputedStyle(document.querySelector('main')).backgroundColor,
      }));
      assert.equal(geometry.overflow, false, `${role}/${width}: horizontal overflow`);
      assert(geometry.controls.every(rect => rect.left >= 0 && rect.right <= width && rect.height >= 44));
      if (role === 'player') {
        assert.equal(geometry.background, 'rgb(0, 0, 0)');
        assert.equal(await page.getByText('교사만 보는 합성 노트').count(), 0);
      }
      assert.deepEqual(errors, []);
      await page.screenshot({ path: resolve(output, `${role}-${width}.png`), fullPage: true });
      await page.close();
    }
  }
  console.log(JSON.stringify({ result: 'PASS', test: '20 synthetic UI layouts + note draft/save', output,
    limitation: 'Mocked runtime in auxiliary browser; NOT Whale compatibility or real PDF rendering' }));
} finally { await browser.close(); }
