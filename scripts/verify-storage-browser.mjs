import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Supply the existing Playwright module path; no browser package is bundled with the product.
const modulePath = process.argv[2];
if (!modulePath) throw new Error('Usage: node scripts/verify-storage-browser.mjs <playwright/index.mjs> [base-url]');
const { chromium } = await import(pathToFileURL(resolve(modulePath)).href);
const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5173';
const profile = resolve('node_modules/.cache/storage-browser', `${Date.now()}`);
const launchOptions = { headless: true, ...(process.env.NAVER_PPT_BROWSER_CHANNEL ? { channel: process.env.NAVER_PPT_BROWSER_CHANNEL } : {}) };
await mkdir(profile, { recursive: true });
let context;
try {
  context = await chromium.launchPersistentContext(profile, launchOptions);
  const page = await context.newPage();
  await page.goto(`${baseUrl}/launcher/`);
  const first = await page.evaluate(async () => {
    const { IndexedDbSessionRepository } = await import('/storage/indexedDbSessionRepository.ts');
    const { createSession } = await import('/core/session.ts');
    const { SessionService } = await import('/storage/sessionService.ts');
    const repo = await IndexedDbSessionRepository.open();
    await repo.create(createSession('browser-smoke', 'Synthetic smoke lesson', 1));
    const service = new SessionService(repo);
    const result = await service.execute({
      type: 'REGISTER_DOCUMENT', commandId: 'register', sessionId: 'browser-smoke', revision: 0, documentId: 'A', slideId: null,
      document: { id: 'A', source: { type: 'pdf', name: 'synthetic.pdf', size: 100, lastModified: 0 },
        lastSlideId: null, knownSlideCount: 8, slideIds: Array.from({ length: 8 }, (_, i) => `A-${i + 1}`), slideDeltas: {}, mediaBookmarks: {}, dirty: false },
    });
    const commands = [
      { type: 'ACTIVATE_DOCUMENT', slideId: null, commandId: 'activate', revision: 1 },
      { type: 'GOTO_SLIDE', slideId: 'A-5', commandId: 'goto', revision: 2 },
      { type: 'SELECT_EDITOR_SLIDE', slideId: 'A-8', commandId: 'editor', revision: 3 },
      { type: 'SET_PRESENTER_NOTE', slideId: 'A-8', commandId: 'note', revision: 4, note: 'Synthetic private note' },
    ];
    for (const command of commands) {
      const ack = await service.execute({ ...command, sessionId: 'browser-smoke', documentId: 'A' });
      if (!ack.ok) throw new Error(`Command failed: ${ack.code}`);
    }
    repo.close();
    return { ok: result.ok, version: navigator.userAgent };
  });
  assert.equal(first.ok, true);
  await context.close();
  context = await chromium.launchPersistentContext(profile, launchOptions);
  const restoredPage = await context.newPage();
  await restoredPage.goto(`${baseUrl}/launcher/`);
  const restored = await restoredPage.evaluate(async () => {
    const { IndexedDbSessionRepository } = await import('/storage/indexedDbSessionRepository.ts');
    const repo = await IndexedDbSessionRepository.open();
    const state = await repo.read('browser-smoke');
    repo.close();
    return state;
  });
  assert.equal(restored.session.revision, 5);
  assert.equal(restored.session.documents.A.source.name, 'synthetic.pdf');
  assert.equal(restored.session.presentedSelection.slideId, 'A-5');
  assert.equal(restored.session.editorSelection.slideId, 'A-8');
  assert.equal(restored.session.documents.A.slideDeltas['A-8'].presenterNote, 'Synthetic private note');
  assert.equal(restored.receipts.length, 5);
  await context.setOffline(true);
  const offline = await restoredPage.evaluate(async () => {
    const { IndexedDbSessionRepository } = await import('/storage/indexedDbSessionRepository.ts');
    const repo = await IndexedDbSessionRepository.open();
    const result = await repo.read('browser-smoke');
    repo.close(); return result;
  });
  assert.deepEqual(offline, restored);
  console.log(JSON.stringify({ result: 'PASS', test: 'IndexedDB browser process restart + offline read + private note', browser: first.version, profile }));
} finally { await context?.close(); }
