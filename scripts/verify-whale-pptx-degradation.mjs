import assert from 'node:assert/strict';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'vite';
import { pptxBackgroundPatch } from './pptx-background-patch.ts';
import { createPptx } from '../tests/fixtures/createPptx.mjs';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const [playwrightPath, executablePath, generatorPath] = process.argv.slice(2);
if (!generatorPath) throw Error('Pass Playwright, Whale, bundled PptxGenJS paths.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const output = resolve('node_modules/.cache/whale-pptx-degradation', String(Date.now()));
const extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
await writeFile(resolve(extension, 'seed.pptx'), await createPptx(generatorPath));
const mod = path => resolve(path).replaceAll('\\', '/');
await writeFile(resolve(output, 'entry.js'), `
export {addSyntheticPptxEffects} from '${mod('tests/fixtures/pptxEffects.mjs')}';
export {loadPptxSourceModel} from '${mod('src/adapters/pptx/sourceModel.ts')}';
export {createPptxEngineDriver} from '${mod('src/adapters/pptx/engineDriver.ts')}';
export {inspectPptxTransformReadiness} from '${mod('src/adapters/pptx/behaviorPreflight.ts')}';
export {PresentationState} from '@web-ppt/viewer-core';
export {unzipSync,zipSync} from 'fflate';`);
await build({ configFile: false, base: './', logLevel: 'warn', plugins: [pptxBackgroundPatch()], worker: { format: 'es', plugins: () => [pptxBackgroundPatch(), { name: 'preserve-parser',
  transform(code, id) { if (id.replaceAll('\\', '/').endsWith('/@web-ppt/core/dist/worker.js')) return { code, map: null, moduleSideEffects: true }; },
}] }, build: { outDir: resolve(extension, 'probe'), emptyOutDir: false, lib: { entry: resolve(output, 'entry.js'), formats: ['es'], fileName: () => 'api.js' } } });
await writeFile(resolve(extension, 'probe/index.html'), '<!doctype html><meta charset="utf-8"><script type="module" src="./runner.js"></script>');
await writeFile(resolve(extension, 'probe/runner.js'), `
import * as api from './api.js';
window.run = async () => {
  const seed = new Uint8Array(await (await fetch('../seed.pptx')).arrayBuffer());
  const baseline = api.addSyntheticPptxEffects(seed, api).bytes;
  const check = async bytes => {
    const source = await api.loadPptxSourceModel(new File([bytes], 'Synthetic.pptx'), new AbortController().signal);
    let engine, failure = null;
    try { engine = api.createPptxEngineDriver({ root: document.createElement('div'), sourceXml: new TextDecoder().decode(source.files[source.parts[0]]),
      createState: () => new api.PresentationState(source.model, { index: 0, skipHidden: false, animate: true, autoAdvance: false }),
      paint() {}, visible() {}, playGroup() { throw Error('UNEXPECTED_PLAY'); } }); }
    catch (error) { failure = error.message; }
    try { return { failure, report: await api.inspectPptxTransformReadiness(bytes, source.files, source.parts), slides: source.parts.length }; }
    finally { engine?.dispose(); source.dispose(); }
  };
  const normal = await check(baseline), files = api.unzipSync(baseline), xml = new DOMParser().parseFromString(new TextDecoder().decode(files['ppt/slides/slide1.xml']), 'application/xml');
  const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
  // A positive 20.001s duration is valid OOXML; our verified rotation range ends at 10s.
  const rotation = xml.getElementsByTagNameNS(ns, 'animRot')[0];
  rotation.getElementsByTagNameNS(ns, 'cTn')[0].setAttribute('dur', '20001');
  files['ppt/slides/slide1.xml'] = new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
  const variant = api.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') });
  return { normal, unsupported: await check(variant), bytes: Array.from(variant) };
};`);
let context; const errors = [], report = { synthetic: true, productRendererReplaced: false };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  context.setDefaultTimeout(20000); await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname;
  const probe = await context.newPage(); await probe.goto(origin + '/probe/index.html'); await probe.waitForFunction(() => typeof window.run === 'function');
  const result = await probe.evaluate(() => window.run());
  assert.equal(result.normal.failure, null); assert.equal(result.unsupported.failure, 'PPTX_ROTATION_UNVERIFIED');
  assert.equal(result.normal.report[0].status, 'unknown'); assert.equal(result.unsupported.report[0].status, 'warning');
  const fixture = resolve(output, 'synthetic-long-rotation.pptx'), bytes = new Uint8Array(result.bytes); await writeFile(fixture, bytes);
  report.probe = { normal: result.normal, unsupported: result.unsupported, durationMs: 20001, sha256: createHash('sha256').update(bytes).digest('hex') };
  const page = async (role, sessionId) => { const p = await context.newPage(); p.on('pageerror', e => errors.push(e.message)); await p.goto(origin + '/' + role + '/index.html' + (sessionId ? '?sessionId=' + sessionId : '')); return p; };
  const send = (p, value) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), value);
  const launcher = await page('launcher'), created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic degradation lesson' }); assert(created.ok);
  const id = created.session.id, editor = await page('editor', id), remote = await page('remote', id), player = await page('player', id);
  const session = async () => (await send(editor, { type: 'GET_SESSION', sessionId: id })).session;
  const command = async (type, documentId, slideId = null) => { assert((await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId, slideId, revision: (await session()).revision, commandId: crypto.randomUUID() } })).ok); };
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('B', 2) });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor(); const pdf = (await session()).documentOrder[0];
  await command('ACTIVATE_DOCUMENT', pdf); await player.waitForFunction(() => !!document.querySelector('.pdf-stage canvas')?.width);
  const before = (await session()).presentedSelection, pixels = await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL());
  await editor.locator('#experimental-pptx-import').check(); await editor.locator('#pdf-import').setInputFiles(fixture);
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  await editor.getByText(/회전·확대 효과를 준비할 수 없는 쪽 1개: 1/).waitFor();
  assert.deepEqual((await session()).presentedSelection, before); assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  await editor.bringToFront();
  await editor.screenshot({ path: resolve(output, 'warning.png'), fullPage: true });
  report.viewports = [];
  for (const [width, height] of [[1920, 1080], [1366, 768], [1280, 800], [768, 1024], [380, 760]]) {
    await editor.setViewportSize({ width, height });
    await editor.bringToFront();
    await editor.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await editor.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await editor.screenshot({ path: resolve(output, `warning-${width}.png`), fullPage: true }); report.viewports.push([width, height]);
  }
  const pptx = Object.values((await session()).documents).find(d => d.source.type === 'pptx'); assert(pptx);
  await remote.bringToFront(); await remote.locator('#remote-document').selectOption(pptx.id);
  const unchanged = await session();
  for (const type of ['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT']) {
    const denied = await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId: id, documentId: pptx.id,
      slideId: type === 'GOTO_SLIDE' ? pptx.slideIds[0] : null, revision: unchanged.revision, commandId: crypto.randomUUID() } });
    assert.equal(denied.code, 'PRESENTATION_PREPARATION_REQUIRED'); assert.deepEqual(await session(), unchanged);
    assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  }
  await player.evaluate(() => {
    window.NativeTransitionWorker = window.Worker; window.transitionHold = { sent: 0, terminated: 0, release: null };
    window.Worker = class extends window.NativeTransitionWorker {
      postMessage(value, transfer) { if (value?.mode !== 'presentation') return super.postMessage(value, transfer); this.held = true; window.transitionHold.sent++; window.transitionHold.release = () => window.NativeTransitionWorker.prototype.postMessage.call(this, value, transfer); }
      terminate() { if (this.held) window.transitionHold.terminated++; super.terminate(); }
    };
  });
  await remote.getByRole('button', { name: '자료 발표', exact: true }).click();
  await player.waitForFunction(() => window.transitionHold.sent === 1);
  assert.deepEqual((await session()).presentedSelection, before);
  assert.equal(await player.locator('.player-scene[data-active="false"]').evaluate(node => getComputedStyle(node).visibility), 'hidden');
  await remote.getByRole('button', { name: '전환 확인 취소', exact: true }).press('Enter');
  await remote.getByRole('status').filter({ hasText: '전환이 적용되지 않았습니다.' }).waitFor();
  await player.waitForFunction(() => window.transitionHold.terminated === 1);
  await player.evaluate(() => { try { window.transitionHold.release(); } catch {} window.Worker = window.NativeTransitionWorker; });
  const preserved = async reference => { const state = await session(); assert.deepEqual(state.presentedSelection, reference.presentedSelection); assert.deepEqual(state.documents, reference.documents); assert.equal(state.presentationTransition ?? null, null); };
  await preserved(unchanged); assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  await remote.getByRole('button', { name: '자료 발표', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '전환이 적용되지 않았습니다.' }).waitFor();
  await preserved(unchanged); assert.equal(await player.locator('canvas[aria-label="발표 자료"]').evaluate(c => c.toDataURL()), pixels);
  await player.evaluate(() => {
    window.preparedSurface = null;
    window.sceneObserver = new MutationObserver(() => {
      const node = document.querySelector('.pptx-preparing-stage');
      if (node?.shadowRoot?.querySelector('[data-slide-id]')) window.preparedSurface = { node, surface: node.shadowRoot.querySelector('[data-slide-id]') };
    });
    window.sceneObserver.observe(document.querySelector('.player-scenes'), { subtree: true, childList: true, attributes: true });
  });
  await remote.locator('#remote-slide').selectOption(pptx.slideIds[1]);
  await remote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await player.waitForFunction(slide => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === slide, pptx.slideIds[1]);
  const safe = await session(); assert.deepEqual(safe.presentedSelection, { documentId: pptx.id, slideId: pptx.slideIds[1] });
  assert.equal(await player.evaluate(() => {
    const host = document.querySelector('.pptx-audience-stage'), prior = window.preparedSurface;
    window.sceneObserver.disconnect();
    return !!prior && prior.node === host && prior.surface === host.shadowRoot.querySelector('[data-slide-id]');
  }), true);
  await remote.getByRole('button', { name: '이전 페이지', exact: true }).click();
  await remote.getByRole('status').filter({ hasText: '전환이 적용되지 않았습니다.' }).waitFor();
  await preserved(safe);
  assert.equal(await player.locator('.pptx-audience-stage').evaluate(host => host.shadowRoot.querySelector('[data-slide-id]')?.dataset.slideId), pptx.slideIds[1]);
  report.remoteViewports = [];
  for (const [width, height] of [[1920,1080], [1366,768], [1280,800], [768,1024], [380,820]]) {
    await remote.setViewportSize({ width, height }); await remote.bringToFront(); assert(await remote.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await remote.screenshot({ path: resolve(output, `remote-protected-${width}.png`), fullPage: true }); report.remoteViewports.push([width, height]);
  }
  await command('ACTIVATE_DOCUMENT', pdf); await player.waitForFunction(() => !!document.querySelector('.pdf-stage canvas')?.width);
  assert.equal((await session()).documents[pptx.id].pptxPlayback?.checkpoint ?? null, null);
  report.product = { warningBeforeSwitch: true, pdfSelectionAndPixelsPreserved: true, remoteCancellationAndLateResultProtected: true, unsupportedActivationDoesNotCommit: true, unsupportedPreviousDoesNotCommit: true, explicitSafePageAtomicActivation: true, playerPreparationIntegrated: true, preparedDomPromotedWithoutRemount: true, hiddenPreparation: true, nextSlideWorks: true, pdfReturnWorks: true, automaticStaticReveal: false, directCommandAdmissionVerified: true };
  report.whale = await context.browser().version(); assert.deepEqual(errors, []); report.pass = true;
} catch (error) { report.failure = error.stack; throw error; }
finally { report.errors = errors; await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, pass: report.pass, failure: report.failure })); }
