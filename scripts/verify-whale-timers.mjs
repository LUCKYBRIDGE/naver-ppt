import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';
const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const executablePath = process.argv[3]; if (!executablePath) throw new Error('Pass installed Whale executable path.');
const output = resolve('node_modules/.cache/whale-timers'), profile = resolve(output, `profile-${Date.now()}`), extension = resolve('dist');
await mkdir(profile, { recursive: true });
const options = { executablePath, headless: true, ignoreDefaultArgs: true, timeout: 15000, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] };
let context;
try {
  context = await chromium.launchPersistentContext(profile, options); context.setDefaultTimeout(20000);
  let worker; const deadline = Date.now() + 20000;
  while (!worker && Date.now() < deadline) {
    for (const candidate of context.serviceWorkers()) try { if (await candidate.evaluate(() => chrome.runtime.getManifest().name) === 'Whale Class Presenter') { worker = candidate; break; } } catch {}
    if (!worker) await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(worker, 'Product worker loaded'); const base = `chrome-extension://${new URL(worker.url()).hostname}`;
  const launcher = await context.newPage(); await launcher.goto(`${base}/launcher/index.html`);
  await launcher.locator('#lesson-title').fill('Synthetic timer lesson'); await launcher.getByRole('button', { name: '수업 만들기', exact: true }).click();
  await launcher.getByRole('status').filter({ hasText: '수업을 저장했습니다.' }).waitFor(); const sessionId = await launcher.locator('#lesson-select').inputValue();
  async function open(role, label) { const pending = context.waitForEvent('page'); await launcher.getByRole('button', { name: label, exact: true }).click(); const page = await pending; await page.waitForURL(`${base}/${role}/index.html?sessionId=${sessionId}`); return page; }
  const player = await open('player', '발표 창 열기'); let remote = await open('remote', '독립 리모컨 열기');
  await context.addInitScript(() => { window.showOpenFilePicker = undefined; }); const editor = await open('editor', '비공개 편집창 열기');
  async function snapshot(page = editor) { const result = await page.evaluate(id => (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId: id }), sessionId); assert(result.ok); return result; }
  async function command(fields, page = remote) { const state = (await snapshot()).session; const result = await page.evaluate(command => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command }), { sessionId, revision: state.revision, commandId: crypto.randomUUID(), documentId: null, slideId: null, ...fields }); assert(result.ok, JSON.stringify(result)); return result; }
  async function savedTimer(predicate) { let state; for (let i = 0; i < 100; i++) { state = (await snapshot()).session; if (predicate(state)) { if (!remote.isClosed()) await remote.waitForFunction(revision => Number(document.querySelector('main')?.dataset.sessionRevision) >= revision, state.revision); return state; } await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error(`Timer state deadline exceeded: ${JSON.stringify(state)}; statuses=${remote.isClosed() ? 'closed' : JSON.stringify(await remote.getByRole('status').allTextContents())}`); }
  for (const name of ['A', 'B']) { await editor.locator('#pdf-import').setInputFiles({ name: `Synthetic-${name}.pdf`, mimeType: 'application/pdf', buffer: createFixturePdf(name) }); await savedTimer(state => state.documentOrder.length === (name === 'A' ? 1 : 2)); }
  const initial = (await snapshot()).session, [a, b] = initial.documentOrder;
  await command({ type: 'ACTIVATE_DOCUMENT', documentId: a }); await player.getByLabel('발표 자료', { exact: true }).waitFor();
  await remote.locator('#timer-mode').selectOption('stopwatch'); await remote.getByRole('button', { name: '타이머 설정 적용', exact: true }).click();
  await savedTimer(state => state.globalTimer?.mode === 'stopwatch'); await remote.getByRole('button', { name: '타이머 시작', exact: true }).click();
  const beforePosition = await savedTimer(state => state.globalTimer?.paused === false);
  await remote.locator('#timer-x').focus(); await remote.locator('#timer-x').press('Home'); await remote.locator('#timer-y').focus(); await remote.locator('#timer-y').press('End');
  await remote.getByRole('button', { name: '타이머 위치 적용', exact: true }).click();
  const positioned = await savedTimer(state => state.globalTimer?.position?.x === 0 && state.globalTimer?.position?.y === 1);
  assert.equal(positioned.globalTimer.epoch, beforePosition.globalTimer.epoch); assert.equal(positioned.globalTimer.startedAt, beforePosition.globalTimer.startedAt); assert.equal(positioned.globalTimer.paused, false);
  await player.waitForFunction(() => document.querySelector('[data-scope="session"] output')?.textContent === '00:01');
  await remote.close(); await player.waitForFunction(() => document.querySelector('[data-scope="session"] output')?.textContent === '00:02');
  remote = await open('remote', '독립 리모컨 열기'); await remote.locator('#timer-scope').selectOption('document');
  await remote.locator('#timer-seconds').fill('8'); await remote.getByRole('button', { name: '타이머 설정 적용', exact: true }).click(); await savedTimer(state => state.documents[a].timer?.durationSec === 8);
  await remote.getByRole('button', { name: '타이머 시작', exact: true }).click(); await savedTimer(state => state.documents[a].timer?.paused === false);
  await player.waitForFunction(() => document.querySelector('[data-scope="document"] output')?.textContent === '00:07');
  await command({ type: 'ACTIVATE_DOCUMENT', documentId: b }); const switched = await savedTimer(state => state.documents[a].timer?.paused && state.presentedSelection?.documentId === b);
  assert(switched.documents[a].timer.elapsedBeforeStartMs >= 1000); assert.equal(switched.globalTimer.paused, false);
  await remote.waitForFunction(() => document.querySelector('#timer-seconds')?.value === '300'); await remote.locator('#timer-seconds').fill('3');
  await remote.getByRole('button', { name: '타이머 설정 적용', exact: true }).click(); await savedTimer(state => state.documents[b].timer?.durationSec === 3);
  await player.evaluate(() => {
    const Native = window.AudioContext; window.timerSoundEvidence = { contexts: 0, starts: [], states: [] };
    // Only the first resume rejection is injected; retry uses the real native audio graph.
    window.AudioContext = class extends Native {
      constructor() { super(); this.syntheticBlocked = ++window.timerSoundEvidence.contexts === 1; this.addEventListener('statechange', () => window.timerSoundEvidence.states.push(super.state)); }
      get state() { return this.syntheticBlocked ? 'suspended' : super.state; }
      resume() { return this.syntheticBlocked ? Promise.reject(new Error('Synthetic policy rejection')) : super.resume(); }
      createOscillator() { const oscillator = super.createOscillator(), start = oscillator.start.bind(oscillator); oscillator.start = time => { window.timerSoundEvidence.starts.push({ time, state: super.state }); start(time); }; return oscillator; }
    };
  });
  await remote.locator('#timer-sound').click(); await savedTimer(state => state.documents[b].timer?.sound === true); assert.equal(await remote.locator('#timer-sound').isChecked(), true);
  await remote.getByRole('button', { name: '타이머 시작', exact: true }).click(); await savedTimer(state => state.documents[b].timer?.paused === false);
  const duplicate = await context.newPage(); await duplicate.goto(`${base}/player/index.html?sessionId=${sessionId}`); await duplicate.getByRole('status').filter({ hasText: '다른 발표 창' }).waitFor();
  const running = (await snapshot()).session; const denied = await duplicate.evaluate(command => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command }), { type: 'FINISH_TIMER', sessionId, revision: running.revision, commandId: crypto.randomUUID(), documentId: b, slideId: null, epoch: running.documents[b].timer.epoch });
  assert.equal(denied.code, 'NOT_PLAYER_OWNER'); assert.equal(await duplicate.locator('[role="timer"]').count(), 0);
  const deniedAlarm = await duplicate.evaluate(command => (window.whale ?? chrome).runtime.sendMessage({ type: 'SESSION_COMMAND', command }), { type: 'CLAIM_TIMER_ALARM', sessionId, revision: running.revision, commandId: crypto.randomUUID(), documentId: b, slideId: null, epoch: running.documents[b].timer.epoch }); assert.equal(deniedAlarm.code, 'NOT_PLAYER_OWNER');
  await remote.close(); const ended = await savedTimer(state => state.documents[b].timer?.paused && state.documents[b].timer.elapsedBeforeStartMs === 3000);
  assert.deepEqual(ended.presentedSelection, running.presentedSelection); assert.deepEqual(ended.editorSelection, running.editorSelection);
  assert.deepEqual(ended.documents[a].timer, switched.documents[a].timer); assert.equal(ended.globalTimer.paused, false);
  assert.equal(await player.locator('[data-scope="document"] output').textContent(), '00:00');
  await savedTimer(state => state.documents[b].timer?.alarmClaimedEpoch === running.documents[b].timer.epoch);
  await player.getByRole('button', { name: '타이머 알림 재생', exact: true }).waitFor();
  await player.setViewportSize({ width: 380, height: 760 }); await player.screenshot({ path: resolve(profile, 'alarm-blocked-380.png'), fullPage: true });
  await player.getByRole('button', { name: '타이머 알림 재생', exact: true }).click();
  await player.waitForFunction(() => window.timerSoundEvidence.starts.length === 2 && window.timerSoundEvidence.starts.every(item => item.state === 'running'));
  await player.getByRole('button', { name: '타이머 알림 재생', exact: true }).waitFor({ state: 'hidden' });
  const soundEvidence = await player.evaluate(() => window.timerSoundEvidence); assert.equal(soundEvidence.contexts, 2);
  remote = await open('remote', '독립 리모컨 열기'); await command({ type: 'ACTIVATE_DOCUMENT', documentId: a });
  await remote.locator('#timer-scope').selectOption('document'); await remote.waitForFunction(() => document.querySelector('#timer-seconds')?.value === '8');
  await remote.getByRole('button', { name: '타이머 초기화', exact: true }).click(); await savedTimer(state => state.documents[a].timer?.elapsedBeforeStartMs === 0);
  for (const viewport of [{ width: 1366, height: 768 }, { width: 380, height: 760 }]) {
    await player.setViewportSize(viewport);
    for (const position of [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }]) {
      await command({ type: 'SET_TIMER_POSITION', position });
      await player.waitForFunction(position => {
        const timer = document.querySelector('[data-scope="session"]'); if (!timer || timer.style.left !== `${position.x * 100}%` || timer.style.top !== `${position.y * 100}%`) return false;
        const rect = timer.getBoundingClientRect(); return rect.left >= 11 && rect.top >= 11 && rect.right <= innerWidth - 11 && rect.bottom <= innerHeight - 11;
      }, position);
    }
  }
  await remote.setViewportSize({ width: 380, height: 760 }); assert.equal(await remote.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await remote.screenshot({ path: resolve(profile, 'remote-380.png'), fullPage: true });
  await player.setViewportSize({ width: 380, height: 760 }); assert.equal(await player.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await player.screenshot({ path: resolve(profile, 'player-380.png'), fullPage: true });
  await command({ type: 'PAUSE_TIMER' }); const final = (await snapshot()).session;
  await writeFile(resolve(profile, 'evidence.json'), JSON.stringify({ userAgent: await launcher.evaluate(() => navigator.userAgent), session: final, denied: denied.code, soundEvidence }, null, 2));
  await context.close(); context = undefined;
  context = await chromium.launchPersistentContext(profile, options); const restoredPage = await context.newPage(); await restoredPage.goto(`${base}/remote/index.html?sessionId=${sessionId}`);
  await restoredPage.getByRole('status').filter({ hasText: '수업 연결됨' }).waitFor(); const restored = await restoredPage.evaluate(id => (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId: id }), sessionId);
  assert(restored.ok); assert.deepEqual(restored.session, final); console.log(`PASS native Whale timer scope/Remote close/Player completion/owner/position corners/alarm claim + synthetic rejection -> native audio/restart; ${profile}`);
} finally { await context?.close(); }
