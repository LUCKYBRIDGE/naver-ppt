import assert from 'node:assert/strict';
import { presentPptx } from './presentation-ui.mjs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { pptxBackgroundPatch } from './pptx-background-patch.ts';
import { createFixturePdf } from '../tests/fixtures/createPdf.mjs';

const [playwrightPath, executablePath, teacherPath] = process.argv.slice(2);
if (!teacherPath) throw Error('Pass Playwright, Whale and read-only teacher PPTX.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const { PNG } = (await import(pathToFileURL(resolve(dirname(playwrightPath), '../pngjs/lib/png.js')).href)).default;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const teacherHash = hash(await readFile(teacherPath));
const output = resolve('node_modules/.cache/whale-pptx-embedded-media', String(Date.now()));
const extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
const modulePath = name => resolve(name).replaceAll('\\', '/');
await writeFile(resolve(output, 'entry.js'), `
export {loadPptxSourceModel} from '${modulePath('src/adapters/pptx/sourceModel.ts')}';
export {preparePptxEmbeddedMedia} from '${modulePath('src/adapters/pptx/embeddedMedia.ts')}';
export {probeMedia} from '${modulePath('src/media/input.ts')}';
export {PptxMediaSlots} from '${modulePath('src/adapters/pptx/mediaSlots.ts')}';
export {createSessionBundle,restoreSessionBundle} from '${modulePath('src/storage/sessionBundle.ts')}';
export {canonicalPptxAudio} from '${modulePath('tests/fixtures/canonicalPptxAudio.mjs')}';
export {cropSyntheticPptxMedia} from '${modulePath('tests/fixtures/pptxCroppedMedia.mjs')}';
export {addSyntheticMediaTiming,addSyntheticMediaOrder,addSyntheticExecutableMediaTimeline} from '${modulePath('tests/fixtures/pptxMediaTiming.mjs')}';
export {inspectPptxFile} from '${modulePath('src/adapters/pptx/fileInspection.ts')}';
export {bindPptxMediaTimingTargets} from '${modulePath('src/adapters/pptx/mediaTimingBinding.ts')}';
export {readPptxMediaTiming} from '${modulePath('src/adapters/pptx/mediaTiming.ts')}';
export {bindPptxSourceOrder} from '${modulePath('src/adapters/pptx/sourceOrder.ts')}';
export {bindPptxSourceShapeGroups} from '${modulePath('src/adapters/pptx/sourceShapeGroups.ts')}';
export {preparePptxSourceMediaCalls} from '${modulePath('src/adapters/pptx/sourceMediaCalls.ts')}';
export {preparePptxSourceMediaSettings,sourceMediaPlayback} from '${modulePath('src/adapters/pptx/sourceMediaSettings.ts')}';
export {preparePptxSourceTimeline} from '${modulePath('src/adapters/pptx/sourceTimeline.ts')}';
export {toPlayerSnapshot} from '${modulePath('src/core/playerSnapshot.ts')}';
export {unzipSync,zipSync} from 'fflate';
`);
await build({ configFile: false, base: './', logLevel: 'warn', plugins: [pptxBackgroundPatch()], worker: { format: 'es', plugins: () => [pptxBackgroundPatch(), {
  name: 'preserve-pptx-worker-initializer',
  transform(code, id) { if (id.replaceAll('\\', '/').endsWith('/@web-ppt/core/dist/worker.js')) return { code, map: null, moduleSideEffects: true }; },
}] },
  build: { outDir: resolve(extension, 'probe'), emptyOutDir: false,
    lib: { entry: resolve(output, 'entry.js'), formats: ['es'], fileName: () => 'probe.js' } } });
await writeFile(resolve(extension, 'probe/index.html'), '<!doctype html><html lang="ko"><meta charset="utf-8"><title>PPTX embedded boundary probe</title><input type="file" id="source"><script type="module" src="./entry.js"></script></html>');
await writeFile(resolve(extension, 'probe/entry.js'), `import * as api from './probe.js'; window.api=api;`);
const errors = [], requests = [], report = { profile, productExtractionModule: true, productMediaUI: true, embeddedPlayerIntegration: true, teacherHash };
let context;
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [
    '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox',
    '--autoplay-policy=no-user-gesture-required', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`,
  ] });
  context.on('request', request => requests.push(request.url()));
  await context.addInitScript(() => { window.showOpenFilePicker = undefined; });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) {
    for (const candidate of context.serviceWorkers()) if (await candidate.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = candidate;
    if (!worker) await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(worker); const origin = 'chrome-extension://' + new URL(worker.url()).hostname, page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/probe/index.html'); await page.waitForFunction(() => window.api);
  await page.locator('#source').setInputFiles(teacherPath);
  report.teacher = await page.evaluate(async () => {
    const file = document.querySelector('#source').files[0], signal = new AbortController().signal;
    const source = await window.api.loadPptxSourceModel(file, signal);
    try {
      const doc = { id: 'teacher-boundary', source: { type: 'pptx', fingerprint: source.fingerprint }, knownSlideCount: source.parts.length,
        slideIds: source.parts.map((_, i) => 'teacher-' + i), slideDeltas: {}, mediaBookmarks: {}, lastSlideId: null, dirty: false };
      const media = await window.api.preparePptxEmbeddedMedia(doc, source, signal);
      const order = source.parts.map((part, index) => window.api.bindPptxSourceOrder(new DOMParser().parseFromString(new TextDecoder().decode(source.files[part]), 'application/xml'), source.model.slides[index].animations ?? []));
      const shapeGroups = order.map((slide, index) => window.api.bindPptxSourceShapeGroups(slide.groups, source.model.slides[index].animations ?? [], signal));
      return { slides: source.parts.length, media: media.length, ownedAssets: source.ownedBlobs.size, mediaTiming: source.inspection.mediaTiming,
        officialShapeGroups: shapeGroups.reduce((sum, groups) => sum + groups.filter(group => group.shapeGroup !== null).length, 0),
        orderGroups: order.reduce((sum, slide) => sum + slide.groups.length, 0), orderShapeSteps: order.reduce((sum, slide) => sum + slide.groups.reduce((count, group) => count + group.shapeSteps.length, 0), 0) };
    } finally { source.dispose(); window.teacherDisposed = source.ownedBlobs.size === 0 && source.ownedUrls.size === 0; }
  });
  assert.equal(report.teacher.slides, 23); assert.equal(report.teacher.media, 0); assert(await page.evaluate(() => window.teacherDisposed));
  assert.equal(report.teacher.orderGroups, 12); assert.equal(report.teacher.orderShapeSteps, 12);
  assert.equal(report.teacher.officialShapeGroups, 12);
  await page.locator('#source').setInputFiles(resolve('node_modules/.cache/pptx-spike/synthetic.pptx'));
  const canonicalBytes = Buffer.from(await page.evaluate(async () => Array.from(window.api.canonicalPptxAudio(await document.querySelector('#source').files[0].arrayBuffer(), window.api).bytes)));
  report.synthetic = await page.evaluate(async () => {
    const api = window.api, file = document.querySelector('#source').files[0];
    // Transform only the generated synthetic fixture; never a user's original.
    const canonical = api.canonicalPptxAudio(await file.arrayBuffer(), api);
    const controller = new AbortController(), source = await api.loadPptxSourceModel(new File([canonical.bytes], 'Synthetic-canonical.pptx'), controller.signal);
    const doc = { id: 'synthetic-boundary', source: { type: 'pptx', fingerprint: source.fingerprint }, knownSlideCount: source.parts.length,
      slideIds: source.parts.map((_, i) => 'synthetic-' + i), slideDeltas: {}, mediaBookmarks: {}, lastSlideId: null, dirty: false };
    let result;
    try {
      const prepared = await api.preparePptxEmbeddedMedia(doc, source, controller.signal), clips = [];
      for (const item of prepared) {
        const metadata = await api.probeMedia(item.file);
        clips.push({ slideId: item.slideId, sourcePart: item.sourcePart, elementPath: item.elementPath, size: item.file.size, ...metadata });
      }
      const host = document.createElement('div'); document.body.append(host);
      const slots = new api.PptxMediaSlots(host), svg = (includeSecond = true) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const group = document.createElementNS(node.namespaceURI, 'g'), content = document.createElementNS(node.namespaceURI, 'g');
        group.dataset.el = '3'; content.setAttribute('transform', 'translate(0 0)'); group.append(content); node.append(group);
        if (includeSecond) { const second = group.cloneNode(true); second.dataset.el = '4'; node.append(second); }
        return node;
      };
      slots.paint(svg());
      const target = slots.add('stateful-probe', { id: 3, w: 320, h: 180, flipH: false, flipV: false, media: { kind: 'video' } });
      slots.add('second-probe', { id: 4, w: 320, h: 180, media: { kind: 'audio' } });
      const moving = document.createElement('video'), movingUrl = URL.createObjectURL(prepared.find(item => item.input.kind === 'video').file);
      moving.muted = true; moving.src = movingUrl; target.append(moving);
      let repaintContinuity, failedRepaintContinuity;
      try {
        await moving.play(); await new Promise(resolve => setTimeout(resolve, 180)); const before = moving.currentTime;
        slots.paint(svg()); await new Promise(resolve => setTimeout(resolve, 180));
        repaintContinuity = { before, after: moving.currentTime, paused: moving.paused, sameConnectedNativeNode: host.querySelector('video') === moving && moving.isConnected };
        const previousSvg = host.querySelector('svg'), beforeFailure = moving.currentTime; let failure;
        try { slots.paint(svg(false)); } catch (error) { failure = error.message; }
        await new Promise(resolve => setTimeout(resolve, 180));
        failedRepaintContinuity = { failure, previousSvgRetained: host.querySelector('svg') === previousSvg,
          sameConnectedNativeNode: host.querySelector('video') === moving && moving.isConnected, before: beforeFailure, after: moving.currentTime, paused: moving.paused };
      } finally { moving.pause(); moving.removeAttribute('src'); moving.load(); URL.revokeObjectURL(movingUrl); slots.dispose(); host.remove(); }
      const originalRef = source.model.slides.flatMap(slide => slide.elements).find(element => element.media)?.media;
      if (!originalRef) throw Error('SYNTHETIC_MEDIA_MISSING');
      const old = { ...originalRef }; originalRef.external = true; originalRef.src = 'https://example.invalid/private-media';
      let externalError;
      try { await api.preparePptxEmbeddedMedia(doc, source, controller.signal); }
      catch (error) { externalError = error.message; }
      Object.assign(originalRef, old); if (old.external === undefined) delete originalRef.external;
      controller.abort(); let cancelError;
      try { await api.preparePptxEmbeddedMedia(doc, source, controller.signal); }
      catch (error) { cancelError = error.name; }
      result = { clips, externalError, cancelError, edits: canonical.edits, repaintContinuity, failedRepaintContinuity };
    } finally { source.dispose(); }
    return { ...result, disposed: source.ownedBlobs.size === 0 && source.ownedUrls.size === 0 };
  });
  assert.equal(report.synthetic.clips.length, 2); assert.equal(report.synthetic.externalError, 'PPTX_EXTERNAL_MEDIA');
  assert.equal(report.synthetic.cancelError, 'AbortError'); assert.equal(report.synthetic.edits, 1); assert(report.synthetic.disposed);
  assert(report.synthetic.repaintContinuity.sameConnectedNativeNode); assert.equal(report.synthetic.repaintContinuity.paused, false);
  assert(report.synthetic.repaintContinuity.after > report.synthetic.repaintContinuity.before + .05);
  assert.equal(report.synthetic.failedRepaintContinuity.failure, 'PPTX_MEDIA_TARGET_MISSING');
  assert(report.synthetic.failedRepaintContinuity.previousSvgRetained); assert(report.synthetic.failedRepaintContinuity.sameConnectedNativeNode);
  assert.equal(report.synthetic.failedRepaintContinuity.paused, false);
  assert(report.synthetic.failedRepaintContinuity.after > report.synthetic.failedRepaintContinuity.before + .05);
  for (const kind of ['audio', 'video']) {
    const clip = report.synthetic.clips.find(item => item.kind === kind); assert(clip);
    const original = await readFile(resolve(kind === 'audio' ? 'node_modules/.cache/pptx-spike/synthetic.wav' : 'node_modules/.cache/whale-video-spike/synthetic.mp4'));
    assert.equal(clip.fingerprint, hash(original)); assert.equal(clip.size, original.length);
    assert.equal(clip.slideId, 'synthetic-2'); assert.equal(clip.sourcePart, 'ppt/slides/slide3.xml'); assert(clip.durationSec > 0);
  }
  const send = (p, request) => p.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), request);
  const launcher = await context.newPage(); await launcher.goto(origin + '/launcher/index.html');
  const created = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic embedded media contract' }); assert(created.ok);
  const sessionId = created.session.id, editor = await context.newPage();
  editor.on('pageerror', error => errors.push(error.message)); await editor.goto(origin + '/editor/index.html?sessionId=' + sessionId);
  await editor.locator('#experimental-pptx-import').check();
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-canonical.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: canonicalBytes });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const initial = await send(editor, { type: 'GET_SESSION', sessionId }); assert(initial.ok);
  const doc = initial.session.documents[initial.session.documentOrder[0]], slideId = doc.slideIds[2], clip = report.synthetic.clips.find(item => item.kind === 'audio');
  const media = { id: 'embedded-audio', slideId, kind: clip.kind, mime: clip.mime, name: 'Synthetic-private.wav', size: clip.size,
    lastModified: 0, durationSec: clip.durationSec, fingerprint: clip.fingerprint,
    embeddedSource: { type: 'pptx', sourceFingerprint: doc.source.fingerprint, sourcePart: clip.sourcePart, elementPath: clip.elementPath } };
  const command = { type: 'ADD_LOCAL_MEDIA', sessionId, documentId: doc.id, slideId, revision: initial.session.revision, commandId: 'embedded-add', media };
  const wrong = structuredClone(command); wrong.commandId = 'wrong-original'; wrong.media.embeddedSource.sourceFingerprint = 'c'.repeat(64);
  assert.equal((await send(editor, { type: 'SESSION_COMMAND', command: wrong })).ok, false);
  assert.deepEqual((await send(editor, { type: 'GET_SESSION', sessionId })).session, initial.session);
  const added = await send(editor, { type: 'SESSION_COMMAND', command }); assert(added.ok);
  const current = (await send(editor, { type: 'GET_SESSION', sessionId })).session;
  const duplicate = { ...command, revision: current.revision, commandId: 'duplicate-source', media: { ...media, id: 'different-id' } };
  assert.equal((await send(editor, { type: 'SESSION_COMMAND', command: duplicate })).ok, false);
  await editor.locator('#editor-document').selectOption(doc.id); await editor.locator('#editor-slide').selectOption(slideId);
  await editor.waitForFunction(id => document.querySelector('.preview-stage')?.shadowRoot?.querySelector('[data-slide-id]')?.dataset.slideId === id, slideId);
  const remote = await context.newPage(); await remote.goto(origin + '/remote/index.html?sessionId=' + sessionId);
  const preActivate = (await send(editor, { type: 'GET_SESSION', sessionId })).session;
  const player = await context.newPage(); player.on('pageerror', error => errors.push(error.message)); await player.goto(origin + '/player/index.html?sessionId=' + sessionId);
  await presentPptx(remote, doc.id);
  await player.locator('.pptx-audience-stage svg').waitFor();
  const audienceSvg = await player.locator('.pptx-audience-stage svg').evaluate(svg => svg.outerHTML);
  const beforeCancel = (await send(editor, { type: 'GET_SESSION', sessionId })).session;
  await editor.evaluate(() => {
    window.originalRead = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      // A ready same-File source is shared now. Hold the still-real media hash
      // read so cancellation exercises the active preparation rather than a
      // redundant source parse that no longer occurs.
      if (this.name.startsWith('PPTX-media-')) { window.readHeld = true; await new Promise(resolve => { window.releasePptxRead = resolve; }); }
      return window.originalRead.call(this);
    };
  });
  const panel = editor.getByRole('region', { name: 'PPTX 내장 미디어 연결', exact: true });
  const connectButton = panel.getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true });
  await connectButton.click(); await editor.waitForFunction(() => window.readHeld);
  assert(await editor.locator('#editor-slide').isDisabled());
  await panel.getByRole('button', { name: '내장 미디어 연결 취소', exact: true }).click();
  await editor.evaluate(() => { window.releasePptxRead(); File.prototype.arrayBuffer = window.originalRead; });
  await editor.getByRole('status').filter({ hasText: '내장 미디어 연결을 취소했습니다.' }).waitFor();
  assert.deepEqual((await send(editor, { type: 'GET_SESSION', sessionId })).session, beforeCancel);
  await connectButton.click();
  await editor.getByRole('status').filter({ hasText: '내장 미디어 1개 등록·1개 재연결했습니다.' }).waitFor();
  const connected = (await send(editor, { type: 'GET_SESSION', sessionId })).session;
  assert.equal(Object.keys(connected.documents[doc.id].localMedia).length, 2);
  assert.deepEqual(connected.presentedSelection, beforeCancel.presentedSelection); assert.deepEqual(connected.documents[doc.id].mediaBookmarks, beforeCancel.documents[doc.id].mediaBookmarks);
  assert.equal(await player.locator('.pptx-audience-stage svg').evaluate(svg => svg.outerHTML), audienceSvg); assert.equal(await player.locator('audio,video').count(), 0);
  await connectButton.focus(); await connectButton.press('Enter');
  await editor.getByRole('status').filter({ hasText: '내장 미디어 0개 등록·2개 재연결했습니다.' }).waitFor();
  assert.deepEqual((await send(editor, { type: 'GET_SESSION', sessionId })).session, connected);
  await editor.evaluate(() => {
    // Successful immutable hashes are reused; native metadata is still checked.
    window.originalMetadataElement = Document.prototype.createElement;
    Document.prototype.createElement = function (...args) {
      const element = window.originalMetadataElement.apply(this, args);
      if (String(args[0]).toLowerCase() === 'audio') element.load = () => queueMicrotask(() => element.onerror?.(new Event('error')));
      return element;
    };
  });
  await connectButton.click(); await editor.getByRole('status').filter({ hasText: '웨일에서 이 미디어를 읽지 못했습니다.' }).waitFor();
  await editor.evaluate(() => { Document.prototype.createElement = window.originalMetadataElement; });
  assert.deepEqual((await send(editor, { type: 'GET_SESSION', sessionId })).session, connected);
  report.editorMediaUi = { explicitCurrentSlideOnly: true, cancelledReadPreservesSession: true, failedMetadataPreservesSession: true,
    registeredAudioVideo: true, duplicateReconnects: true, keyboardEnter: true, audienceSvgUnchanged: true, audienceMediaNotMounted: true, bookmarksUnchanged: true, viewports: [] };
  for (const [width, height] of [[1920,1080],[1366,768],[1280,800],[768,1024],[380,820]]) {
    await editor.setViewportSize({ width, height }); await panel.scrollIntoViewIfNeeded();
    assert(await editor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    report.editorMediaUi.viewports.push({ width, height, noHorizontalOverflow: true });
  }
  await panel.screenshot({ path: resolve(output, 'embedded-controls-380.png') });
  const teacher = async () => (await send(editor, { type: 'GET_SESSION', sessionId })).session;
  const remoteCommand = async (type, documentId, target = null) => {
    const latest = await teacher();
    if (['ACTIVATE_DOCUMENT', 'GOTO_SLIDE', 'REOPEN_DOCUMENT'].includes(type) && latest.documents[documentId]?.source.type === 'pptx') return presentPptx(remote, documentId, target);
    assert((await send(remote, { type: 'SESSION_COMMAND', command: { type, sessionId, documentId, slideId: target, revision: latest.revision, commandId: crypto.randomUUID() } })).ok);
  };
  await remoteCommand('GOTO_SLIDE', doc.id, slideId);
  await player.waitForFunction(() => [...document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelectorAll('video,audio') ?? []].length === 2
    && [...document.querySelector('.pptx-audience-stage').shadowRoot.querySelectorAll('video,audio')].every(media => media.readyState >= 1 && media.paused));
  assert.equal(await player.locator('.player-media video,.player-media audio').count(), 0);
  const refs = Object.values((await teacher()).documents[doc.id].localMedia), videoRef = refs.find(ref => ref.kind === 'video'), audioRef = refs.find(ref => ref.kind === 'audio');
  const mediaControls = remote.getByRole('region', { name: '미디어 재생', exact: true });
  await mediaControls.getByRole('button', { name: videoRef.name + ' 음소거', exact: true }).click();
  await mediaControls.getByRole('button', { name: audioRef.name + ' 음소거', exact: true }).click();
  await player.setViewportSize({ width: 1366, height: 768 });
  const geometry = await player.evaluate(() => {
    const shadow = document.querySelector('.pptx-audience-stage').shadowRoot, svg = shadow.querySelector('svg').getBoundingClientRect(), video = shadow.querySelector('video').getBoundingClientRect();
    return { x: (video.x - svg.x) / svg.width, y: (video.y - svg.y) / svg.height, w: video.width / svg.width, h: video.height / svg.height };
  });
  assert(Math.abs(geometry.x - .3) < .001); assert(Math.abs(geometry.y - 2 / 7.5) < .001); assert(Math.abs(geometry.w - .3) < .001); assert(Math.abs(geometry.h - .3) < .001);
  await mediaControls.getByRole('button', { name: videoRef.name + ' 재생', exact: true }).click();
  await player.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return !video.paused && video.currentTime > .25; });
  await player.evaluate(() => { window.nativeVideo = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); window.beforeUnrelated = window.nativeVideo.currentTime; });
  const noteState = await teacher();
  assert((await send(editor, { type: 'SESSION_COMMAND', command: { type: 'SET_PRESENTER_NOTE', sessionId, documentId: doc.id, slideId, revision: noteState.revision, commandId: 'unrelated-note', note: 'Synthetic private media note' } })).ok);
  await player.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return video === window.nativeVideo && !video.paused && video.currentTime > window.beforeUnrelated + .1; });
  const pixels = await player.evaluate(() => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'), canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
    canvas.getContext('2d').drawImage(video, 0, 0, 320, 180); return { width: video.videoWidth, height: video.videoHeight, time: video.currentTime, center: [...canvas.getContext('2d').getImageData(160, 90, 1, 1).data] };
  }); assert.equal(pixels.width, 320); assert.equal(pixels.height, 180); assert.equal(pixels.center[3], 255);
  await player.screenshot({ path: resolve(output, 'embedded-player-1366.png') });
  await mediaControls.getByRole('button', { name: videoRef.name + ' 정지', exact: true }).click();
  await player.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused);
  // Force a revision change while the new PDF bytes are being inspected.
  await editor.evaluate(() => {
    File.prototype.arrayBuffer = async function () {
      if (this.name === 'Synthetic-cross.pdf') { window.importHeld = true; await new Promise(resolve => { window.releaseImport = resolve; }); }
      return window.originalRead.call(this);
    };
  });
  await editor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-cross.pdf', mimeType: 'application/pdf', buffer: createFixturePdf('B', 2) });
  await editor.waitForFunction(() => window.importHeld);
  const importBefore = await teacher();
  assert((await send(editor, { type: 'SESSION_COMMAND', command: { type: 'SET_PRESENTER_NOTE', sessionId, documentId: doc.id, slideId,
    revision: importBefore.revision, commandId: 'revision-during-import', note: 'Synthetic note during new source read' } })).ok);
  await editor.evaluate(() => { window.releaseImport(); File.prototype.arrayBuffer = window.originalRead; });
  await editor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor().catch(async error => {
    await writeFile(resolve(output, 'import-failure.json'), JSON.stringify({ statuses: await editor.getByRole('status').allTextContents(), pageErrors: errors }, null, 2)); throw error;
  });
  const importedWhileRevisionChanged = await teacher();
  assert.deepEqual(importedWhileRevisionChanged.presentedSelection, importBefore.presentedSelection);
  assert.equal(importedWhileRevisionChanged.documents[doc.id].slideDeltas[slideId].presenterNote, 'Synthetic note during new source read');
  report.importDuringRevision = { controlledReadDelay: true, concurrentNoteRevision: true, registrationSucceeded: true, audienceSelectionPreserved: true, notePreserved: true };
  const pdf = Object.values((await teacher()).documents).find(value => value.source.type === 'pdf'); assert(pdf);
  await remoteCommand('ACTIVATE_DOCUMENT', pdf.id); await player.locator('canvas[aria-label="발표 자료"]').waitFor();
  const bookmark = (await teacher()).documents[doc.id].mediaBookmarks[videoRef.id]; assert(bookmark.paused); assert(bookmark.timeSec > .2);
  await remoteCommand('ACTIVATE_DOCUMENT', doc.id);
  const waitRestored = p => p.waitForFunction(expected => { const video = document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video'); return video?.readyState >= 1 && video.paused && Math.abs(video.currentTime - expected) < .1; }, bookmark.timeSec);
  await waitRestored(player); await player.close();
  const replacement = await context.newPage(); replacement.on('pageerror', error => errors.push(error.message));
  await replacement.addInitScript(() => {
    const NativeChannel = BroadcastChannel; window.mediaChannelRequests = 0;
    window.BroadcastChannel = class extends NativeChannel { constructor(name) { super(name); this.mediaName = name; }
      postMessage(value) { if (this.mediaName === 'naver-ppt-media-v1' && value.type === 'request') window.mediaChannelRequests++; super.postMessage(value); } };
  });
  await replacement.goto(origin + '/player/index.html?sessionId=' + sessionId); await waitRestored(replacement);
  assert.equal(await replacement.evaluate(() => window.mediaChannelRequests), 0);
  report.playerMedia = { originalPlacement: geometry, nativePixels: pixels, noGlobalVideoFallback: true, remoteMutePlayPause: true,
    unrelatedRevisionKeepsNativeVideoAndPlayback: true, documentSwitchPausedPosition: bookmark.timeSec, returnPausedAtBookmark: true,
    replacementReextractsOriginal: true, mediaChannelRequests: 0, sourceTriggersVerified: false };
  await mediaControls.getByRole('button', { name: audioRef.name + ' 재생', exact: true }).click();
  await replacement.waitForFunction(() => { const audio = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio'); return !audio.paused && audio.currentTime > .15; });
  await replacement.evaluate(() => { window.audioBefore = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio').currentTime; });
  await remote.close(); await editor.locator('#editor-slide').selectOption(doc.slideIds[0]);
  await replacement.waitForFunction(() => { const audio = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio'); return !audio.paused && audio.currentTime > window.audioBefore + .15; });
  const audioRemote = await context.newPage(); await audioRemote.goto(origin + '/remote/index.html?sessionId=' + sessionId);
  await audioRemote.getByRole('region', { name: '미디어 재생', exact: true }).getByRole('button', { name: audioRef.name + ' 정지', exact: true }).click();
  await replacement.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('audio').paused);
  report.playerMedia.audioContinuesWithRemoteClosedAndEditorBrowsing = true;
  const nativeName = await editor.evaluate(async () => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle('embedded-backup.wcp.json', { create: true });
    window.showSaveFilePicker = async () => handle; return handle.name;
  });
  await editor.getByRole('button', { name: '편집정보 저장', exact: true }).click();
  await editor.getByRole('status').filter({ hasText: '저장 완료' }).waitFor();
  const backupText = await editor.evaluate(async name => (await (await (await navigator.storage.getDirectory()).getFileHandle(name)).getFile()).text(), nativeName);
  const backupPath = resolve(output, 'embedded-backup.wcp.json'); await writeFile(backupPath, backupText, 'utf8');
  await editor.locator('#session-verify-file').setInputFiles(backupPath); await editor.getByRole('status').filter({ hasText: '파일을 확인했습니다.' }).waitFor();
  const beforeRestore = await teacher();
  await launcher.locator('#session-import').setInputFiles(backupPath); await launcher.getByRole('status').filter({ hasText: '새 복구 수업을 만들었습니다.' }).waitFor();
  const restoredId = await launcher.locator('#lesson-select').inputValue(), restoredEditor = await context.newPage(), restoredRemote = await context.newPage(), restoredPlayer = await context.newPage();
  restoredPlayer.on('pageerror', error => errors.push(error.message)); restoredEditor.on('pageerror', error => errors.push(error.message));
  await restoredEditor.goto(origin + '/editor/index.html?sessionId=' + restoredId); await restoredRemote.goto(origin + '/remote/index.html?sessionId=' + restoredId);
  await restoredPlayer.goto(origin + '/player/index.html?sessionId=' + restoredId); await restoredPlayer.getByRole('heading', { name: '발표 대기', exact: true }).waitFor();
  await restoredEditor.locator('#experimental-pptx-import').check(); await restoredEditor.locator('#editor-document').selectOption(doc.id);
  await restoredEditor.locator('#pdf-reconnect').setInputFiles({ name: 'Synthetic-canonical.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: canonicalBytes });
  await restoredEditor.getByRole('status').filter({ hasText: '같은 원본을 다시 연결했습니다.' }).waitFor();
  const toActivate = (await send(restoredEditor, { type: 'GET_SESSION', sessionId: restoredId })).session;
  await presentPptx(restoredRemote, doc.id);
  await waitRestored(restoredPlayer);
  assert.equal(await restoredPlayer.locator('audio,video').count(), 2); assert.equal(await restoredPlayer.locator('.player-media video').count(), 0);
  assert.deepEqual(await teacher(), beforeRestore);
  report.playerMedia.localBackup = { nativeOpfsSaveReadback: true, savedFileRevalidated: true, launcherImport: true, sameOriginalReconnectOnly: true,
    embeddedReconnectButtonNotNeeded: true, originalSessionUnchanged: true, restoredVideoPausedAtBookmark: true };
  await restoredRemote.getByRole('button', { name: '현재 자료 종료', exact: true }).click();
  const closeDialog = restoredRemote.getByRole('dialog', { name: '현재 자료 종료', exact: true });
  await closeDialog.getByRole('radio', { name: '새 백업 없이 종료', exact: true }).check();
  await closeDialog.getByRole('button', { name: '종료 확정', exact: true }).click();
  await restoredPlayer.getByRole('heading', { name: '발표 대기', exact: true }).waitFor(); assert.equal(await restoredPlayer.locator('video,audio').count(), 0);
  assert.equal((await send(restoredEditor, { type: 'GET_SESSION', sessionId: restoredId })).session.presentedSelection, null);
  report.playerMedia.currentCloseBlackStandby = true;
  // Generated variant only: verify crop and ellipse through the actual product.
  // The coexistence assertion needs a clip longer than the effect/UI roundtrip.
  // Generate this variant locally; retain the original short ended-event fixture.
  const coexistenceVideo = Buffer.from(await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext('2d'), stream = canvas.captureStream(15), chunks = [];
    const mime = ['video/mp4;codecs=avc1.42001E', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw Error('Synthetic coexistence MP4 recorder unavailable');
    const recorder = new MediaRecorder(stream, { mimeType: mime }); let frame = 0;
    const draw = () => { ctx.fillStyle = frame++ % 2 ? '#e52535' : '#20b358'; ctx.fillRect(0, 0, 320, 180); ctx.fillStyle = '#fff'; ctx.fillRect(100, 50, 120, 80); };
    draw(); recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise(resolve => { recorder.onstop = resolve; }); recorder.start(100);
    const timer = setInterval(draw, 100);
    try { await new Promise(resolve => setTimeout(resolve, 12000)); recorder.stop(); await stopped; }
    finally { clearInterval(timer); if (recorder.state !== 'inactive') recorder.stop(); stream.getTracks().forEach(track => track.stop()); }
    return Array.from(new Uint8Array(await new Blob(chunks, { type: 'video/mp4' }).arrayBuffer()));
  }));
  await writeFile(resolve(output, 'coexistence-fixture.mp4'), coexistenceVideo);
  const croppedBytes = Buffer.from(await page.evaluate(({ bytes, video }) => {
    const parts = window.api.unzipSync(new Uint8Array(bytes)), targets = Object.keys(parts).filter(part => /^ppt\/media\/[^/]+\.mp4$/i.test(part));
    if (targets.length !== 1) throw Error('Expected one synthetic MP4 package part');
    parts[targets[0]] = new Uint8Array(video);
    return Array.from(window.api.cropSyntheticPptxMedia(window.api.zipSync(parts), window.api));
  }, { bytes: Array.from(canonicalBytes), video: Array.from(coexistenceVideo) }));
  const cropSession = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic cropped video' }); assert(cropSession.ok);
  const cropId = cropSession.session.id, cropEditor = await context.newPage(), cropRemote = await context.newPage(), cropPlayer = await context.newPage();
  cropPlayer.on('pageerror', error => errors.push(error.message)); cropEditor.on('pageerror', error => errors.push(error.message));
  await cropEditor.goto(origin + '/editor/index.html?sessionId=' + cropId); await cropEditor.locator('#experimental-pptx-import').check();
  await cropEditor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-cropped-ellipse.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: croppedBytes });
  await cropEditor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const cropDoc = Object.values((await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session.documents)[0];
  await cropEditor.locator('#editor-document').selectOption(cropDoc.id); await cropEditor.locator('#editor-slide').selectOption(cropDoc.slideIds[2]);
  await cropEditor.getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true }).click();
  await cropEditor.getByRole('status').filter({ hasText: '내장 미디어 2개 등록·0개 재연결했습니다.' }).waitFor();
  await cropRemote.goto(origin + '/remote/index.html?sessionId=' + cropId);
  const cropLatest = (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session;
  await cropPlayer.setViewportSize({ width: 1366, height: 768 }); await cropPlayer.goto(origin + '/player/index.html?sessionId=' + cropId);
  await presentPptx(cropRemote, cropDoc.id, cropDoc.slideIds[2]);
  await cropPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video')?.readyState >= 2);
  await cropPlayer.getByRole('status').filter({ hasText: '원본 구조 1개·미디어 전용 0개.' }).waitFor();
  await cropPlayer.getByRole('status').filter({ hasText: '도형 그룹 대응 확인.' }).waitFor();
  report.productSourceOrderDiagnostic = true;
  const box = await cropPlayer.evaluate(() => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'), object = video.closest('foreignObject'), rect = object.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, clip: object.getAttribute('clip-path'), videoWidth: video.getBoundingClientRect().width };
  }); assert(box.clip?.startsWith('url(#pptx-media-')); assert(Math.abs(box.videoWidth / box.width - 2) < .001);
  const capture = await cropPlayer.screenshot({ path: resolve(output, 'cropped-ellipse-player-1366.png') }), decoded = PNG.sync.read(capture);
  const pixel = (x, y) => { const offset = (Math.round(box.y + box.height * y) * decoded.width + Math.round(box.x + box.width * x)) * 4; return [...decoded.data.subarray(offset, offset + 4)]; };
  const sample = { corner: pixel(.05, .05), croppedCenterBand: pixel(.2, .5), coloredInterior: pixel(.5, .1) };
  const white = value => value[0] > 240 && value[1] > 240 && value[2] > 240;
  assert(white(sample.corner)); assert(white(sample.croppedCenterBand)); assert(!white(sample.coloredInterior));
  report.croppedEllipse = { actualProductUi: true, nativeWidthRatio: box.videoWidth / box.width, sourceClipApplied: true, pixels: sample };
  // Restart only this isolated extension worker while the product native video plays.
  const cdp = await context.newCDPSession(launcher), transitions = []; let versions = [];
  cdp.on('ServiceWorker.workerVersionUpdated', event => {
    versions = event.versions;
    transitions.push(...event.versions.filter(value => value.scriptURL === origin + '/background.js').map(value => value.runningStatus));
  });
  await cdp.send('ServiceWorker.enable');
  const versionDeadline = Date.now() + 5000;
  while (!versions.some(value => value.scriptURL === origin + '/background.js' && value.runningStatus === 'running') && Date.now() < versionDeadline) await new Promise(resolve => setTimeout(resolve, 50));
  const ownVersion = versions.find(value => value.scriptURL === origin + '/background.js' && value.runningStatus === 'running'); assert(ownVersion);
  const cropVideo = Object.values((await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session.documents[cropDoc.id].localMedia).find(value => value.kind === 'video');
  const cropControls = cropRemote.getByRole('region', { name: '미디어 재생', exact: true });
  await cropControls.getByRole('button', { name: cropVideo.name + ' 음소거', exact: true }).click();
  await cropControls.getByRole('button', { name: cropVideo.name + ' 재생', exact: true }).click();
  await cropPlayer.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return !video.paused && video.currentTime > .1; });
  await cropPlayer.evaluate(() => { window.workerVideo = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); window.workerVideoTime = window.workerVideo.currentTime; });
  transitions.length = 0;
  await cdp.send('ServiceWorker.stopWorker', { versionId: ownVersion.versionId });
  let owner; const restartDeadline = Date.now() + 15000;
  while (Date.now() < restartDeadline) {
    owner = await send(cropPlayer, { type: 'CLAIM_PLAYER', sessionId: cropId }).catch(() => null);
    if (owner?.owned && transitions.includes('stopped') && transitions.at(-1) === 'running') break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert(owner?.owned); assert(transitions.includes('stopped') && transitions.at(-1) === 'running');
  await cropPlayer.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return video === window.workerVideo && video.isConnected && !video.paused && video.currentTime > window.workerVideoTime + .15; });
  const continuity = await cropPlayer.evaluate(() => ({ before: window.workerVideoTime, after: window.workerVideo.currentTime, paused: window.workerVideo.paused }));
  await cropControls.getByRole('button', { name: cropVideo.name + ' 정지', exact: true }).click();
  await cropPlayer.waitForFunction(() => window.workerVideo.paused);
  report.embeddedWorkerRestart = { transitions, retainedOwner: true, sameConnectedNativeNode: true, ...continuity, remotePauseAfterRestart: true };
  await cdp.detach();
  // Run the OOXML video-shape rotation through Remote while native video plays.
  // The two-second clip can finish during CDP cleanup. Establish an explicit
  // paused source position instead of comparing replay against an ended time.
  const positionCommand = async fields => {
    const commandId = crypto.randomUUID();
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session;
      const result = await send(cropRemote, { type: 'SESSION_COMMAND', command: { ...fields, sessionId: cropId, documentId: cropDoc.id,
        slideId: cropDoc.slideIds[2], mediaId: cropVideo.id, revision: latest.revision, commandId } });
      if (result.ok) return;
      // A late native checkpoint may advance revision after GET_SESSION. Only
      // an explicit stale rejection permits retrying this test precondition.
      if (result.code !== 'STALE_REVISION' || attempt === 2) assert.fail(JSON.stringify(result));
    }
  };
  await positionCommand({ type: 'PAUSE_MEDIA' });
  await cropPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused);
  await positionCommand({ type: 'SEEK_MEDIA', timeSec: .1 });
  await cropPlayer.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return video.paused && Math.abs(video.currentTime - .1) < .01; });
  const beforeEffect = await cropPlayer.evaluate(() => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video');
    window.effectVideo = video;
    const matrix = video.closest('foreignObject').getScreenCTM();
    return { angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, time: video.currentTime };
  });
  await cropControls.getByRole('button', { name: cropVideo.name + ' 재생', exact: true }).click();
  await cropPlayer.waitForFunction(() => !window.effectVideo.paused);
  await cropRemote.getByRole('button', { name: '다음 PPTX 효과', exact: true }).click();
  await cropRemote.getByRole('status').filter({ hasText: '효과를 확정했습니다.' }).waitFor();
  const combined = await cropPlayer.evaluate(() => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'), object = video.closest('foreignObject'), matrix = object.getScreenCTM();
    return { sameConnectedNativeNode: video === window.effectVideo && video.isConnected, time: video.currentTime, paused: video.paused, duration: video.duration, ended: video.ended,
      angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, clipRetained: object.getAttribute('clip-path')?.startsWith('url(#pptx-media-') };
  });
  await writeFile(resolve(output, 'combined-effect-observation.json'), JSON.stringify({ beforeEffect, combined,
    session: (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session }, null, 2));
  assert(combined.duration > 10); assert.equal(combined.ended, false);
  assert(combined.sameConnectedNativeNode); assert.equal(combined.paused, false); assert(combined.time > beforeEffect.time + .1);
  assert(Math.abs(combined.angle - beforeEffect.angle - 90) < .01); assert(combined.clipRetained);
  const combinedSession = (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session;
  assert.equal(combinedSession.documents[cropDoc.id].pptxPlayback.checkpoints[cropDoc.slideIds[2]].completedGroups, 1);
  await positionCommand({ type: 'PAUSE_MEDIA' });
  await cropPlayer.waitForFunction(() => window.effectVideo.paused);
  await cropPlayer.screenshot({ path: resolve(output, 'rotated-cropped-video-1366.png') });
  report.embeddedEffectCoexistence = { actualRemoteClick: true, sourceRotationDegrees: 90, before: beforeEffect, after: combined, completedGroups: 1 };
  const nativeStop = await cropPlayer.evaluate(() => window.effectVideo.currentTime);
  let stoppedBookmark;
  const bookmarkDeadline = Date.now() + 5000;
  while (Date.now() < bookmarkDeadline) {
    stoppedBookmark = (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session.documents[cropDoc.id].mediaBookmarks[cropVideo.id];
    if (stoppedBookmark?.paused && Math.abs(stoppedBookmark.timeSec - nativeStop) < .05) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert(stoppedBookmark?.paused && Math.abs(stoppedBookmark.timeSec - nativeStop) < .05);
  await cropPlayer.close();
  const combinedReplacement = await context.newPage(); combinedReplacement.on('pageerror', error => errors.push(error.message));
  await combinedReplacement.setViewportSize({ width: 1366, height: 768 });
  await combinedReplacement.goto(origin + '/player/index.html?sessionId=' + cropId);
  await combinedReplacement.waitForFunction(expected => {
    const video = document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video');
    return video?.readyState >= 2 && video.paused && Math.abs(video.currentTime - expected) < .05;
  }, stoppedBookmark.timeSec);
  const combinedRestored = await combinedReplacement.evaluate(() => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'), object = video.closest('foreignObject'), matrix = object.getScreenCTM();
    return { angle: Math.atan2(matrix.b, matrix.a) * 180 / Math.PI, paused: video.paused, time: video.currentTime,
      clipRetained: object.getAttribute('clip-path')?.startsWith('url(#pptx-media-') };
  });
  assert(Math.abs(combinedRestored.angle - 90) < .01); assert(combinedRestored.clipRetained);
  await combinedReplacement.screenshot({ path: resolve(output, 'restored-rotated-cropped-video-1366.png') });
  report.embeddedEffectCoexistence.replacementPlayer = combinedRestored;
  // Inspect a source timeline missing from the shape-effect model without executing it.
  const timingBytes = Buffer.from(await page.evaluate(bytes => Array.from(window.api.addSyntheticMediaTiming(new Uint8Array(bytes), window.api)), Array.from(canonicalBytes)));
  report.sourceMediaTiming = await page.evaluate(async bytes => {
    const file = new File([new Uint8Array(bytes)], 'Synthetic-media-timing.pptx'), signal = new AbortController().signal;
    const source = await window.api.loadPptxSourceModel(file, signal);
    try {
      const doc = { id: 'timing-boundary', source: { type: 'pptx', fingerprint: source.fingerprint }, knownSlideCount: source.parts.length,
        slideIds: source.parts.map((_, i) => 'timing-' + i), slideDeltas: {}, mediaBookmarks: {}, lastSlideId: null, dirty: false };
        const bound = await window.api.bindPptxMediaTimingTargets(doc, source, 'timing-2', signal);
        window.sourceMediaCalls = await window.api.preparePptxSourceMediaCalls(doc, source, 'timing-2', signal);
      const errors = {};
      const rejected = async name => {
        try { await window.api.bindPptxMediaTimingTargets(doc, source, 'timing-2', signal); }
        catch (error) { errors[name] = error.message; return; }
        throw Error('Expected rejected media binding: ' + name);
      };
      const media = source.model.slides[2].elements.find(element => element.id === bound[0].shapeId), originalId = media.id;
      media.id = 4294967295; await rejected('missingModelTarget'); media.id = originalId;
      const packageFiles = window.api.unzipSync(new Uint8Array(bytes));
      const mediaPart = Object.keys(packageFiles).find(part => part.startsWith('ppt/media/') && packageFiles[part].length === 64044);
      if (!mediaPart) throw Error('Expected synthetic WAV package part');
      if (source.files[mediaPart]) throw Error('Expected verified duplicate WAV raw release');
      const evidence = source.largeMediaParts.get(mediaPart);
      if (!evidence || evidence.size !== 64044) throw Error('Expected released WAV byte evidence');
      source.largeMediaParts.delete(mediaPart); await rejected('missingReleasedEvidence');
      source.largeMediaParts.set(mediaPart, { ...evidence, fingerprint: '0'.repeat(64) }); await rejected('changedReleasedEvidence');
      source.largeMediaParts.set(mediaPart, { ...evidence, size: evidence.size + 1 }); await rejected('changedReleasedSize');
      source.largeMediaParts.set(mediaPart, evidence);
      source.files[mediaPart] = packageFiles[mediaPart]; source.files[mediaPart][43] ^= 1;
      await rejected('changedPackageBytes'); delete source.files[mediaPart];
      const detailed = window.api.readPptxMediaTiming(new DOMParser().parseFromString(new TextDecoder().decode(source.files['ppt/slides/slide3.xml']), 'application/xml'));
      const rebound = await window.api.bindPptxMediaTimingTargets(doc, source, 'timing-2', signal);
      if (JSON.stringify(rebound) !== JSON.stringify(bound)) throw Error('Released WAV binding did not recover');
      return { releasedRawBindingVerified: true, summary: source.inspection.mediaTiming, timeNodes: detailed.timeNodes, bindings: bound, bindingErrors: errors, report: await window.api.inspectPptxFile(file, signal, true) };
    }
    finally { source.dispose(); }
  }, Array.from(timingBytes));
  assert.equal(report.sourceMediaTiming.summary.audioNodes, 1); assert.equal(report.sourceMediaTiming.summary.videoNodes, 1);
  assert.equal(report.sourceMediaTiming.summary.recognizedCalls, 1); assert.equal(report.sourceMediaTiming.summary.crossSlideNodes, 2);
  assert.equal(report.sourceMediaTiming.summary.invalidNodes, 0); assert.equal(report.sourceMediaTiming.summary.unresolvedTargets, 0);
  assert.equal(report.sourceMediaTiming.summary.repeatNodes, 1); assert.equal(report.sourceMediaTiming.summary.reverseNodes, 1);
  assert.equal(report.sourceMediaTiming.summary.endConditionNodes, 1); assert.equal(report.sourceMediaTiming.summary.trimNodes, 1);
  assert.equal(report.sourceMediaTiming.summary.unverifiedTimingNodes, 0);
  assert.deepEqual(report.sourceMediaTiming.timeNodes.map(node => [node.id, node.parentId]), [[1, null], [2, 1], [3, 1], [4, 1]]);
  assert.deepEqual(report.sourceMediaTiming.timeNodes[2].end, [{ event: 'onEnd', delayMs: 0, reference: { kind: 'time', id: 2 } }]);
  assert.deepEqual(report.sourceMediaTiming.bindings.map(target => target.node), ['audio', 'video', 'cmd']);
  assert.deepEqual(report.sourceMediaTiming.bindings.map(target => target.elementPath), [[1], [2], [2]]);
  assert(report.sourceMediaTiming.bindings.every(target => target.slideId === 'timing-2' && target.sourcePart === 'ppt/slides/slide3.xml' && /^[a-f0-9]{64}$/.test(target.mediaFingerprint)));
  assert.equal(report.sourceMediaTiming.releasedRawBindingVerified, true);
  assert.deepEqual(report.sourceMediaTiming.bindingErrors, Object.fromEntries(['missingModelTarget', 'missingReleasedEvidence', 'changedReleasedEvidence', 'changedReleasedSize', 'changedPackageBytes'].map(name => [name, 'PPTX_MEDIA_TIMING_BINDING_UNVERIFIED'])));
  report.sourceMediaCalls = await page.evaluate(() => window.sourceMediaCalls);
  assert.equal(report.sourceMediaCalls.length, 1); assert.deepEqual(report.sourceMediaCalls[0].action, { type: 'playFrom', timeSec: .25 });
  assert.equal(report.sourceMediaCalls[0].declarationTimingId, 3); assert.deepEqual(report.sourceMediaCalls[0].target.elementPath, [2]);
  report.sourceMediaOrder = await page.evaluate(async bytes => {
    const ordered = window.api.addSyntheticMediaOrder(new Uint8Array(bytes), window.api), signal = new AbortController().signal;
    const source = await window.api.loadPptxSourceModel(new File([ordered], 'Synthetic-media-order.pptx'), signal);
    try {
      const xml = new DOMParser().parseFromString(new TextDecoder().decode(source.files['ppt/slides/slide3.xml']), 'application/xml');
        const steps = source.model.slides[2].animations ?? [], bound = window.api.bindPptxSourceOrder(xml, steps, signal);
        const shapeGroups = window.api.bindPptxSourceShapeGroups(bound.groups, steps, signal);
        const doc = { id: 'order-calls', source: { type: 'pptx', fingerprint: source.fingerprint }, knownSlideCount: source.parts.length,
          slideIds: source.parts.map((_, index) => `order-${index}`), slideDeltas: {}, mediaBookmarks: {}, lastSlideId: null, dirty: false };
        let callError = null; try { await window.api.preparePptxSourceMediaCalls(doc, source, 'order-2', signal); } catch (error) { callError = error.message; }
        return { ...bound, modelStepCount: steps.length, shapeGroups, callError };
    } finally { source.dispose(); }
  }, Array.from(timingBytes));
  assert.equal(report.sourceMediaOrder.modelStepCount, 1); assert.equal(report.sourceMediaOrder.mediaOnlyGroups, 2);
  assert.deepEqual(report.sourceMediaOrder.groups.map(group => [group.timingId, group.shapeSteps, group.media.map(target => target.node)]), [[20, [], ['audio']], [30, [0], ['video']], [40, [], ['cmd']]]);
  assert.equal(report.sourceMediaOrder.executionVerified, false); assert.deepEqual(report.sourceMediaOrder.independentMedia, []);
  assert.deepEqual(report.sourceMediaOrder.shapeGroups.map(group => group.shapeGroup), [null, 0, null]);
  assert.equal(report.sourceMediaOrder.callError, 'PPTX_SOURCE_MEDIA_CALL_UNVERIFIED');
  const inspectionPanel = cropEditor.getByRole('region', { name: 'PPTX 원본 점검', exact: true });
  const timingBefore = (await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session;
  const audienceBeforeTiming = await combinedReplacement.locator('.pptx-audience-stage svg').evaluate(svg => svg.outerHTML);
  await inspectionPanel.locator('#pptx-inspection-file').setInputFiles({ name: 'Synthetic-media-timing.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: timingBytes });
  await inspectionPanel.getByRole('status').filter({ hasText: '원본 구조 점검을 마쳤습니다.' }).waitFor();
  await inspectionPanel.getByText(/음원 1개·영상 1개·명령 1개/).waitFor();
  assert.deepEqual((await send(cropEditor, { type: 'GET_SESSION', sessionId: cropId })).session, timingBefore);
  assert.equal(await combinedReplacement.locator('.pptx-audience-stage svg').evaluate(svg => svg.outerHTML), audienceBeforeTiming);
  assert(await combinedReplacement.evaluate(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused));
  await cropEditor.setViewportSize({ width: 380, height: 820 }); await inspectionPanel.scrollIntoViewIfNeeded();
  assert(await cropEditor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  report.sourceMediaTiming.layout = await inspectionPanel.evaluate(panel => {
    const bounds = panel.getBoundingClientRect();
    return { width: bounds.width, right: bounds.right, viewport: innerWidth,
      content: [...panel.querySelectorAll('.preflight-results li, .preflight-results span, p')].map(node => {
        const rect = node.getBoundingClientRect(); return { width: rect.width, right: rect.right, scroll: node.scrollWidth, client: node.clientWidth };
      }) };
  });
  assert(report.sourceMediaTiming.layout.content.every(value => value.right <= report.sourceMediaTiming.layout.right + 1 && value.scroll <= value.client + 1));
  // A tall element screenshot can resize the viewport and reflow text while clipping
  // to its old bounds. Capture the real viewport in two scroll positions instead.
  await cropEditor.bringToFront();
  await inspectionPanel.evaluate(panel => panel.scrollIntoView({ block: 'start' }));
  await cropEditor.screenshot({ path: resolve(output, 'media-timing-preflight-380.png') });
  await inspectionPanel.getByText(/음원 1개·영상 1개·명령 1개/).evaluate(node => node.scrollIntoView({ block: 'center' }));
  await cropEditor.screenshot({ path: resolve(output, 'media-timing-detail-380.png') });
  report.sourceMediaTiming.actualProductInspectionUi = true; report.sourceMediaTiming.sessionAndAudiencePreserved = true;
  // Original explicit settings must reach the actual Editor -> strict DB ->
  // native Player path, rather than remaining a standalone XML diagnostic.
  const settingsCreated = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic source playback settings' }); assert(settingsCreated.ok);
  const settingsId = settingsCreated.session.id, settingsEditor = await context.newPage();
  settingsEditor.on('pageerror', error => errors.push(error.message));
  await settingsEditor.goto(origin + '/editor/index.html?sessionId=' + settingsId);
  await settingsEditor.locator('#experimental-pptx-import').check();
  await settingsEditor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-source-settings.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: timingBytes });
  await settingsEditor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const settingsSession = async () => (await send(settingsEditor, { type: 'GET_SESSION', sessionId: settingsId })).session;
  const settingsInitial = await settingsSession(), settingsDoc = settingsInitial.documents[settingsInitial.documentOrder[0]], settingsSlide = settingsDoc.slideIds[2];
  await settingsEditor.locator('#editor-document').selectOption(settingsDoc.id);
  await settingsEditor.locator('#editor-slide').selectOption(settingsSlide);
  const settingsPanel = settingsEditor.getByRole('region', { name: 'PPTX 내장 미디어 연결', exact: true });
  await settingsPanel.getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true }).click();
  await settingsEditor.getByRole('status').filter({ hasText: '내장 미디어 2개 등록·0개 재연결했습니다.' }).waitFor();
  assert((await settingsEditor.getByRole('status').allTextContents()).some(text => text.includes('여러 쪽 재생·정지 시 숨김은 지원하지 않으며')));
  const settingsConnected = await settingsSession(), settingsRefs = Object.values(settingsConnected.documents[settingsDoc.id].localMedia);
  const settingsVideo = settingsRefs.find(ref => ref.kind === 'video'), settingsAudio = settingsRefs.find(ref => ref.kind === 'audio');
  assert.equal(settingsVideo.playback.startSec, .10025); assert(Math.abs(settingsVideo.playback.endSec - (settingsVideo.durationSec - .2005)) < .000001);
  for (const ref of settingsRefs) { assert.equal(ref.playback.volume, .25); assert.equal(ref.playback.muted, true); }
  assert.equal(settingsAudio.playback.startSec, 0); assert.equal(settingsAudio.playback.endSec, settingsAudio.durationSec);
  const settingsRemote = await context.newPage(); await settingsRemote.goto(origin + '/remote/index.html?sessionId=' + settingsId);
  const settingsCommand = async (type, extra) => {
    const commandId = crypto.randomUUID();
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await settingsSession(), response = await send(settingsRemote, { type: 'SESSION_COMMAND', command: {
        type, sessionId: settingsId, documentId: settingsDoc.id, slideId: settingsSlide, revision: latest.revision, commandId, ...extra } });
      if (response.ok) return;
      if (response.code !== 'STALE_REVISION' || attempt === 2) assert.fail(JSON.stringify(response));
    }
  };
  const settingsPlayer = await context.newPage(); settingsPlayer.on('pageerror', error => errors.push(error.message));
  await settingsPlayer.goto(origin + '/player/index.html?sessionId=' + settingsId);
  await presentPptx(settingsRemote, settingsDoc.id, settingsSlide);
  await settingsPlayer.waitForFunction(() => { const video = document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video'); return video?.readyState >= 1 && video.paused && video.muted && video.volume === .25 && Math.abs(video.currentTime - .10025) < .01; });
  const settingsNative = await settingsPlayer.evaluate(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return { volume: video.volume, muted: video.muted, position: video.currentTime, duration: video.duration }; });
  await settingsRemote.getByRole('button', { name: settingsVideo.name + ' 재생', exact: true }).click();
  await settingsPlayer.waitForFunction(end => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); return video.paused && Math.abs(video.currentTime - end) < .02; }, settingsVideo.playback.endSec);
  const changedPlayback = { ...settingsVideo.playback, volume: .6 };
  await settingsCommand('SET_MEDIA_PLAYBACK', { mediaId: settingsVideo.id, playback: changedPlayback });
  await settingsPanel.getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true }).click();
  await settingsEditor.getByRole('status').filter({ hasText: '내장 미디어 0개 등록·2개 재연결했습니다.' }).waitFor();
  const settingsFinal = await settingsSession(); assert.deepEqual(settingsFinal.documents[settingsDoc.id].localMedia[settingsVideo.id].playback, changedPlayback);
  const settingsBackup = await page.evaluate(value => { const restored = window.api.restoreSessionBundle(window.api.createSessionBundle(value, Date.now()), 'settings-restored', Date.now()); return restored.documents[restored.documentOrder[0]].localMedia; }, settingsFinal);
  assert.deepEqual(settingsBackup[settingsVideo.id].playback, changedPlayback);
  await settingsEditor.setViewportSize({ width: 380, height: 820 }); await settingsPanel.scrollIntoViewIfNeeded();
  assert(await settingsEditor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  // This long-running, multi-tab Whale probe can stall in Playwright's
  // screenshot preparation after fonts have loaded. Capture the foreground
  // viewport directly; retain the DOM/layout checks and inspect the PNG.
  await settingsEditor.bringToFront();
  const settingsCapture = await context.newCDPSession(settingsEditor); let captureDeadline;
  try {
    const captured = await Promise.race([settingsCapture.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }),
      new Promise((_, reject) => { captureDeadline = setTimeout(() => reject(Error('SETTINGS_VIEWPORT_CAPTURE_TIMEOUT')), 15000); })]);
    await writeFile(resolve(output, 'source-settings-controls-380.png'), Buffer.from(captured.data, 'base64'));
  } finally { clearTimeout(captureDeadline); await settingsCapture.detach(); }
  report.sourcePlaybackSettings = { refs: settingsRefs.map(ref => ({ kind: ref.kind, durationSec: ref.durationSec, playback: ref.playback })), native: settingsNative,
    originalTrimEndStopsNative: true, userSettingsPreservedOnReconnect: true, metadataBackupPreserved: true, limitationsShown: true, noHorizontalOverflow380: true,
    sourceTriggersVerified: false };
  const acceptedNative = await settingsPlayer.evaluate(async () => {
    const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); video.currentTime = .5; await video.play();
    return { timeSec: video.currentTime, paused: video.paused, ended: video.ended };
  });
  const beforeSourceBegin = await settingsSession();
  assert((await send(settingsPlayer, { type: 'SESSION_COMMAND', command: { type: 'BEGIN_PPTX_GROUP', sessionId: settingsId, documentId: settingsDoc.id,
    slideId: settingsSlide, revision: beforeSourceBegin.revision, commandId: 'synthetic-source-native-run' } })).ok);
  const beforeSourceCommit = await settingsSession();
  const sourceResult = { type: 'SESSION_COMMAND', command: { type: 'CHECKPOINT_PPTX_MEDIA', sessionId: settingsId, documentId: settingsDoc.id,
    slideId: settingsSlide, revision: beforeSourceCommit.revision, commandId: 'synthetic-source-native-result', mediaId: settingsVideo.id,
    epoch: 'synthetic-source-native-run', expectedMediaEpoch: beforeSourceCommit.documents[settingsDoc.id].mediaBookmarks[settingsVideo.id]?.epoch ?? null,
    playback: changedPlayback, ...acceptedNative } };
  assert.equal((await send(settingsEditor, sourceResult)).code, 'FORBIDDEN'); assert.equal((await send(settingsRemote, sourceResult)).code, 'FORBIDDEN');
  const duplicateSourcePlayer = await context.newPage(); await duplicateSourcePlayer.goto(origin + '/player/index.html?sessionId=' + settingsId);
  assert.equal((await send(duplicateSourcePlayer, sourceResult)).code, 'NOT_PLAYER_OWNER');
  const sourceCommitted = await send(settingsPlayer, sourceResult); assert(sourceCommitted.ok, JSON.stringify(sourceCommitted));
  const storedSource = (await settingsSession()).documents[settingsDoc.id].mediaBookmarks[settingsVideo.id];
  assert.equal(storedSource.sourceRunEpoch, 'synthetic-source-native-run'); assert.equal(storedSource.epoch, 'synthetic-source-native-result');
  await settingsPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused);
  for (let attempt = 0; attempt < 30; attempt++) {
    if ((await settingsSession()).documents[settingsDoc.id].mediaBookmarks[settingsVideo.id].paused) break;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert((await settingsSession()).documents[settingsDoc.id].mediaBookmarks[settingsVideo.id].paused, 'Unowned historical source result must be held');
  await settingsCommand('SET_MEDIA_PLAYBACK', { mediaId: settingsVideo.id, playback: { ...changedPlayback, volume: .65 } });
  assert.equal((await settingsSession()).documents[settingsDoc.id].mediaBookmarks[settingsVideo.id].sourceRunEpoch, 'synthetic-source-native-run');
  await settingsCommand('CANCEL_PPTX_GROUP', {});
  await settingsPlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused);
  const afterSourceCancel = await settingsSession();
  const lateSource = structuredClone(sourceResult); lateSource.command.commandId = 'late-source-result'; lateSource.command.revision = afterSourceCancel.revision;
  lateSource.command.expectedMediaEpoch = storedSource.epoch;
  let lateResponse;
  for (let attempt = 0; attempt < 3; attempt++) {
    lateSource.command.revision = (await settingsSession()).revision; lateResponse = await send(settingsPlayer, lateSource);
    if (lateResponse.code !== 'STALE_REVISION') break;
  }
  assert.equal(lateResponse.code, 'INVALID_TARGET');
  assert((await send(settingsPlayer, sourceResult)).ok);
  assert(await settingsPlayer.evaluate(() => document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video').paused));
  const restoredSourceBookmark = await page.evaluate(value => {
    const restored = window.api.restoreSessionBundle(window.api.createSessionBundle(value, Date.now()), 'source-native-restored', Date.now());
    return Object.values(restored.documents[restored.documentOrder[0]].mediaBookmarks).find(bookmark => bookmark.epoch === 'synthetic-source-native-result');
  }, await settingsSession());
  assert(restoredSourceBookmark.paused); assert.equal(restoredSourceBookmark.sourceRunEpoch, undefined);
  report.sourceNativeCheckpoint = { nativeAccepted: acceptedNative, editorAndRemoteDenied: true, duplicatePlayerDenied: true,
    ownerCommit: true, historicalSourceResultHeld: true, cancelledNativePaused: true, lateResultRejected: true, duplicateReceiptDoesNotRestart: true, restoredPausedWithoutRunTag: true,
    sourceTimelineConnected: false };
  const timelineBytes = Buffer.from(await page.evaluate(value => Array.from(window.api.addSyntheticExecutableMediaTimeline(new Uint8Array(value), window.api)), Array.from(canonicalBytes)));
  const timelineCreated = await send(launcher, { type: 'CREATE_SESSION', title: 'Synthetic executable media timeline' }); assert(timelineCreated.ok);
  const timelineId = timelineCreated.session.id, timelineEditor = await context.newPage(); timelineEditor.on('pageerror', error => errors.push(error.message));
  await timelineEditor.goto(origin + '/editor/index.html?sessionId=' + timelineId);
  await timelineEditor.locator('#experimental-pptx-import').check();
  await timelineEditor.locator('#pdf-import').setInputFiles({ name: 'Synthetic-source-timeline.pptx', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', buffer: timelineBytes });
  await timelineEditor.getByRole('status').filter({ hasText: '자료를 등록했습니다.' }).waitFor();
  const readTimeline = async () => (await send(timelineEditor, { type: 'GET_SESSION', sessionId: timelineId })).session;
  const timelineInitial = await readTimeline(), timelineDoc = timelineInitial.documents[timelineInitial.documentOrder[0]], timelineSlide = timelineDoc.slideIds[2];
  await timelineEditor.locator('#editor-document').selectOption(timelineDoc.id); await timelineEditor.locator('#editor-slide').selectOption(timelineSlide);
  const timelineRemote = await context.newPage(); timelineRemote.on('pageerror', error => errors.push(error.message));
  await timelineRemote.goto(origin + '/remote/index.html?sessionId=' + timelineId);
  const timelineCommand = async (type, extra = {}) => {
    const commandId = crypto.randomUUID();
    for (let attempt = 0; attempt < 3; attempt++) {
      const state = await readTimeline(), result = await send(timelineRemote, { type: 'SESSION_COMMAND', command: { type, sessionId: timelineId,
        documentId: timelineDoc.id, slideId: timelineSlide, revision: state.revision, commandId, ...extra } });
      if (result.ok) return; if (result.code !== 'STALE_REVISION' || attempt === 2) assert.fail(JSON.stringify(result));
    }
  };
  let timelinePlayer = await context.newPage(); timelinePlayer.on('pageerror', error => errors.push(error.message));
  await timelinePlayer.addInitScript(() => {
    window.timelineNativeCalls = [];
    for (const name of ['play', 'pause']) {
      const original = HTMLMediaElement.prototype[name];
      HTMLMediaElement.prototype[name] = function (...args) {
        window.timelineNativeCalls.push({ name, time: this.currentTime, at: performance.now(), stack: new Error().stack });
        return original.apply(this, args);
      };
    }
  });
  await timelinePlayer.goto(origin + '/player/index.html?sessionId=' + timelineId);
  await presentPptx(timelineRemote, timelineDoc.id, timelineSlide);
  const nativeState = player => player.evaluate(() => { const video = document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video');
    return video ? { time: video.currentTime, paused: video.paused, ready: video.readyState } : null; });
  await timelinePlayer.waitForFunction(() => document.body.textContent.includes('효과 0그룹.'));
  await timelinePlayer.evaluate(() => { window.timelineOriginalSurface = document.querySelector('.pptx-audience-stage').shadowRoot.firstChild; });
  assert.equal(await nativeState(timelinePlayer), null);
  const nextTimeline = timelineRemote.getByRole('button', { name: '다음 PPTX 효과', exact: true }), cancelTimeline = timelineRemote.getByRole('button', { name: 'PPTX 효과 취소', exact: true });
  await timelineRemote.bringToFront(); await nextTimeline.click();
  await timelineRemote.getByRole('status').filter({ hasText: '현재 쪽의 효과를 모두 재생했습니다.' }).waitFor();
  const historicalPending = (await readTimeline()).documents[timelineDoc.id].pptxPlayback.request.commandId;
  await timelineEditor.bringToFront();
  await timelineEditor.getByRole('region', { name: 'PPTX 내장 미디어 연결', exact: true }).getByRole('button', { name: '이 쪽의 내장 미디어 연결·재연결', exact: true }).click();
  await timelineEditor.getByRole('status').filter({ hasText: '내장 미디어 2개 등록·0개 재연결했습니다.' }).waitFor();
  await timelinePlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video')?.readyState >= 1);
  assert((await nativeState(timelinePlayer)).paused);
  assert.equal(await timelinePlayer.evaluate(() => window.timelineNativeCalls.filter(call => call.name === 'play').length), 0);
  assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.request.commandId, historicalPending);
  await timelineRemote.bringToFront(); await cancelTimeline.click();
  await timelinePlayer.waitForFunction(() => document.body.textContent.includes('검사한 미디어 클릭 그룹 실행.'));
  assert(await timelinePlayer.evaluate(() => window.timelineOriginalSurface === document.querySelector('.pptx-audience-stage').shadowRoot.firstChild));
  const timelinePrepared = await page.evaluate(async ({ bytes, session, doc, slide }) => {
    const signal = new AbortController().signal, source = await window.api.loadPptxSourceModel(new File([new Uint8Array(bytes)], 'Synthetic-source-timeline.pptx'), signal);
    try { return await window.api.preparePptxSourceTimeline(session.documents[doc], source, slide, window.api.toPlayerSnapshot(session), signal); }
    finally { source.dispose(); }
  }, { bytes: Array.from(timelineBytes), session: await readTimeline(), doc: timelineDoc.id, slide: timelineSlide });
  assert.equal(timelinePrepared.groups.length, 5); assert.equal(timelinePrepared.groups[0].actions[0].delayMs, 750);
  // Installed Playwright treats a Promise predicate as truthy rather than
  // polling its resolved boolean. Await the authoritative runtime response here.
  const waitTimeline = async predicate => {
    const deadline = Date.now() + 15000; let latest;
    while (Date.now() < deadline) {
      latest = await readTimeline(); if (predicate(latest.documents[timelineDoc.id].pptxPlayback)) return latest;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    throw Error('TIMELINE_CHECKPOINT_TIMEOUT:' + JSON.stringify(latest.documents[timelineDoc.id].pptxPlayback));
  };
  const waitGroup = count => waitTimeline(value => value?.checkpoints[timelineSlide]?.completedGroups === count);
  // Cancel an original 750ms source delay before the native action starts.
  await timelineRemote.bringToFront();
  await nextTimeline.click();
  await waitTimeline(value => !!value?.run);
  await cancelTimeline.click(); await timelineRemote.getByRole('status').filter({ hasText: '효과를 취소하고' }).waitFor();
  assert((await nativeState(timelinePlayer)).paused); assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide], undefined);
  // A real native action followed by an explicit failed storage response.
  await timelinePlayer.evaluate(() => { const api = window.whale ?? chrome, original = api.runtime.sendMessage.bind(api.runtime);
    api.runtime.sendMessage = async (...args) => { if (args[0]?.command?.type === 'CHECKPOINT_PPTX_MEDIA') { api.runtime.sendMessage = original; return { ok: false, code: 'PERSISTENCE_FAILED', error: 'Synthetic endpoint write failure' }; } return original(...args); };
  });
  await nextTimeline.click(); await timelineRemote.getByRole('status').filter({ hasText: '효과를 확정하지 못했습니다.' }).waitFor();
  assert((await nativeState(timelinePlayer)).paused); await cancelTimeline.click();
  const firstRequestedAt = Date.now(); await nextTimeline.click(); await waitGroup(1);
  const firstTimeline = await nativeState(timelinePlayer);
  assert(!firstTimeline.paused, JSON.stringify({ firstTimeline, elapsed: Date.now() - firstRequestedAt,
    calls: await timelinePlayer.evaluate(() => window.timelineNativeCalls.slice(-12)), document: (await readTimeline()).documents[timelineDoc.id] }));
  assert(Date.now() - firstRequestedAt >= 750);
  await new Promise(resolve => setTimeout(resolve, 150)); assert((await nativeState(timelinePlayer)).time > firstTimeline.time);
  const timelineVideoRef = Object.values((await readTimeline()).documents[timelineDoc.id].localMedia).find(ref => ref.kind === 'video');
  const beforeReprepare = await timelinePlayer.evaluate(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video'); window.timelineContinuityVideo = video; return video.currentTime; });
  await timelineCommand('SET_MEDIA_PLAYBACK', { mediaId: timelineVideoRef.id, playback: { ...timelineVideoRef.playback, volume: .35 } });
  await timelineRemote.getByRole('status').filter({ hasText: '다음 효과를 요청할 수 있습니다.' }).waitFor();
  const afterReprepare = await timelinePlayer.evaluate(() => { const video = document.querySelector('.pptx-audience-stage').shadowRoot.querySelector('video');
    return { same: video === window.timelineContinuityVideo && video.isConnected, time: video.currentTime, paused: video.paused, volume: video.volume }; });
  assert(afterReprepare.same && !afterReprepare.paused && afterReprepare.time >= beforeReprepare && Math.abs(afterReprepare.volume - .35) < .001);
  assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].completedGroups, 1);
  await nextTimeline.click(); await waitGroup(2); const timelinePaused = await nativeState(timelinePlayer); assert(timelinePaused.paused);
  await nextTimeline.click(); await waitGroup(3); const timelineSeek = await nativeState(timelinePlayer); assert(!timelineSeek.paused && Math.abs(timelineSeek.time - .5) < .2);
  await nextTimeline.click(); await waitGroup(4); assert((await nativeState(timelinePlayer)).paused);
  await nextTimeline.click(); await waitGroup(5); const timelineRestart = await nativeState(timelinePlayer); assert(!timelineRestart.paused && timelineRestart.time < .25);
  const timelineCompleted = await readTimeline(); assert.equal(timelineCompleted.documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].renderer, 'web-ppt-0.4.5/source-v1');
  await nextTimeline.click(); await timelineRemote.getByRole('status').filter({ hasText: '현재 쪽의 효과를 모두 재생했습니다.' }).waitFor();
  await cancelTimeline.click();
  // A user clip that excludes the original playFrom(.5) must keep the source
  // cursor recoverable, including in a replacement Player.
  await timelineCommand('SET_MEDIA_PLAYBACK', { mediaId: timelineVideoRef.id, playback: { ...timelineVideoRef.playback, startSec: 1, volume: .35 } });
  await timelineRemote.getByRole('status').filter({ hasText: '효과를 확정하지 못했습니다.' }).waitFor();
  await timelineRemote.getByText('원본 연결과 미디어 재생 구간을 확인하세요. 완료한 효과와 편집 내용은 유지됩니다.', { exact: true }).waitFor();
  await timelinePlayer.close(); timelinePlayer = await context.newPage();
  await timelinePlayer.addInitScript(() => { window.nativePlayCalls = 0; const original = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function (...args) { window.nativePlayCalls++; return original.apply(this, args); }; });
  timelinePlayer.on('pageerror', error => errors.push(error.message)); await timelinePlayer.goto(origin + '/player/index.html?sessionId=' + timelineId);
  await timelinePlayer.waitForFunction(() => document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video')?.readyState >= 1);
  assert((await nativeState(timelinePlayer)).paused); assert.equal(await timelinePlayer.evaluate(() => window.nativePlayCalls), 0);
  assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].completedGroups, 5);
  await timelinePlayer.waitForFunction(() => document.body.textContent.includes('효과 5그룹.') && document.body.textContent.includes('효과를 확정하지 못했습니다.'));
  await timelinePlayer.evaluate(() => { window.timelineRecoverySurface = document.querySelector('.pptx-audience-stage').shadowRoot.firstChild; });
  await timelineCommand('SET_MEDIA_PLAYBACK', { mediaId: timelineVideoRef.id, playback: { ...timelineVideoRef.playback, volume: .35 } });
  await timelinePlayer.waitForFunction(() => document.body.textContent.includes('검사한 미디어 클릭 그룹 실행.'));
  assert(await timelinePlayer.evaluate(() => window.timelineRecoverySurface === document.querySelector('.pptx-audience-stage').shadowRoot.firstChild));
  assert.equal(await timelinePlayer.evaluate(() => window.nativePlayCalls), 0);
  const timelineRecovered = await readTimeline();
  assert.equal(timelineRecovered.documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].completedGroups, 5);
  await timelineRemote.locator('#remote-document').selectOption(timelineDoc.id); await timelineRemote.locator('#remote-slide').selectOption(timelineSlide);
  await timelineRemote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await timelineRemote.waitForFunction(revision => Number(document.querySelector('main')?.dataset.sessionRevision) > revision, timelineRecovered.revision);
  await timelineRemote.waitForFunction(() => document.querySelector('main')?.dataset.sessionRevision && ![...document.querySelectorAll('button')].some(button => button.textContent === '전환 확인 취소'));
  assert(!(await timelineRemote.getByRole('status').filter({ hasText: '전환 준비 또는 대상 확인을 마치지 못했습니다' }).count()));
  assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].completedGroups, 5);
  const beforeSceneClose = await readTimeline();
  assert((await send(timelineRemote, { type: 'CLOSE_CURRENT_DOCUMENT', decision: 'without-backup', blobUrl: null, command: {
    type: 'CLOSE_DOCUMENT', sessionId: timelineId, documentId: timelineDoc.id, slideId: null, revision: beforeSceneClose.revision, commandId: crypto.randomUUID() } })).ok);
  await timelinePlayer.getByRole('heading', { name: '발표 대기', exact: true }).waitFor();
  await timelinePlayer.evaluate(() => {
    window.preparedNative = null; const api = window.whale ?? chrome, original = api.runtime.sendMessage.bind(api.runtime);
    api.runtime.sendMessage = async (...args) => {
      if (args[0]?.command?.type === 'COMMIT_PRESENTATION') {
        const host = document.querySelector('.pptx-preparing-stage'), native = host?.shadowRoot?.querySelector('video');
        window.preparedNative = { host, native, ready: native?.readyState, paused: native?.paused, calls: window.nativePlayCalls };
      }
      return original(...args);
    };
  });
  await timelineRemote.getByRole('button', { name: '선택 페이지 발표', exact: true }).click();
  await timelinePlayer.waitForFunction(() => !!document.querySelector('.pptx-audience-stage')?.shadowRoot?.querySelector('video'));
  const promotedNative = await timelinePlayer.evaluate(() => {
    const before = window.preparedNative, host = document.querySelector('.pptx-audience-stage');
    return { sameHost: before?.host === host, sameNative: before?.native === host.shadowRoot.querySelector('video'),
      preparedData: before?.ready >= 2, preparedPaused: before?.paused, playCallsBefore: before?.calls, playCallsAfter: window.nativePlayCalls };
  });
  assert.deepEqual(promotedNative, { sameHost: true, sameNative: true, preparedData: true, preparedPaused: true, playCallsBefore: 0, playCallsAfter: 0 });
  assert.equal((await readTimeline()).documents[timelineDoc.id].pptxPlayback.checkpoints[timelineSlide].completedGroups, 5);
  report.preparedNativeScene = { ...promotedNative, sourceCheckpointFivePreserved: true, closedExplicitPageReopened: true };
  const sourceBackup = await page.evaluate(value => {
    const restored = window.api.restoreSessionBundle(window.api.createSessionBundle(value, Date.now()), 'timeline-restored', Date.now());
    const doc = restored.documents[restored.documentOrder[0]];
    return { selection: restored.presentedSelection, checkpoint: Object.values(doc.pptxPlayback.checkpoints)[0], bookmarks: Object.values(doc.mediaBookmarks), request: doc.pptxPlayback.request, run: doc.pptxPlayback.run };
  }, timelineRecovered);
  assert.equal(sourceBackup.selection, null); assert.equal(sourceBackup.checkpoint.completedGroups, 5); assert.equal(sourceBackup.checkpoint.renderer, 'web-ppt-0.4.5/source-v1');
  assert(sourceBackup.bookmarks.every(bookmark => bookmark.paused && !bookmark.sourceRunEpoch)); assert.equal(sourceBackup.request, null); assert.equal(sourceBackup.run, null);
  report.sourceTimelineExecution = { productUi: true, originalDelayMs: 750, cancelledBeforeNative: true, explicitStorageFailurePaused: true, retrySucceeded: true,
    lateRegistrationSameRuntime: true, historicalRequestNotExecuted: true, reprepareContinuity: { before: beforeReprepare, ...afterReprepare },
    invalidClipReplacementPreservesCompletedCursor: true, correctedClipSameRuntimeRecovers: true, sourceMetadataBackupRestoresPaused: true,
    first: firstTimeline, pause: timelinePaused, seek: timelineSeek, restart: timelineRestart, groups: 5, renderer: 'web-ppt-0.4.5/source-v1',
    exhausted: true, replacementPlayerNativePlayCalls: 0, sourceTimelineConnected: true, mixedShapeTimingVerified: false };
  const restored = await page.evaluate(session => {
    const bundle = window.api.createSessionBundle(session, Date.now()), value = window.api.restoreSessionBundle(bundle, 'restored-boundary', Date.now());
    return { document: value.documents[value.documentOrder[0]], selection: value.presentedSelection, serialized: JSON.stringify(bundle) };
  }, current);
  assert.deepEqual(restored.document.localMedia['embedded-audio'].embeddedSource, media.embeddedSource); assert.equal(restored.selection, null);
  assert(!restored.serialized.includes('blob:')); assert(!restored.serialized.includes('base64'));
  report.productContract = { uiRegisteredPptx: true, editorCommandAccepted: true, wrongOriginalRejected: true, duplicateOriginRejected: true,
    metadataBackupRestored: true, restoreStandby: true, embeddedMediaUiConnected: true };
  report.externalRequests = requests.filter(url => /^https?:/.test(url)); assert.deepEqual(report.externalRequests, []);
  assert.deepEqual(errors, []); report.pageErrors = errors;
  assert.equal(hash(await readFile(teacherPath)), teacherHash); report.originalUnchanged = true;
  await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
} finally { await context?.close(); }
