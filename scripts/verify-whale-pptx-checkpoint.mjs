import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const [playwrightPath, whalePath] = process.argv.slice(2);
if (!playwrightPath || !whalePath) throw Error('Usage: node scripts/verify-whale-pptx-checkpoint.mjs <playwright> <whale>');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const output = resolve('node_modules/.cache/pptx-checkpoint', String(Date.now())), profile = resolve(output, 'profile');
await mkdir(output, { recursive: true });
const entry = resolve(output, 'entry.ts');
await writeFile(entry, `import { IndexedDbSessionRepository } from ${JSON.stringify(resolve('src/storage/indexedDbSessionRepository.ts').replaceAll('\\', '/'))};
import { SessionHub } from ${JSON.stringify(resolve('src/background/sessionHub.ts').replaceAll('\\', '/'))};
import { createSession } from ${JSON.stringify(resolve('src/core/session.ts').replaceAll('\\', '/'))};
import { createPptxSourceGroupDriver } from ${JSON.stringify(resolve('src/adapters/pptx/sourceGroupDriver.ts').replaceAll('\\', '/'))};
import { PptxDurablePlayback } from ${JSON.stringify(resolve('src/adapters/pptx/durablePlayback.ts').replaceAll('\\', '/'))};
import { toPlayerSnapshot } from ${JSON.stringify(resolve('src/core/playerSnapshot.ts').replaceAll('\\', '/'))};
import { PptxNativeMediaActions } from ${JSON.stringify(resolve('src/adapters/pptx/nativeMediaAction.ts').replaceAll('\\', '/'))};
import { PptxNativeEndpoint } from ${JSON.stringify(resolve('src/player/pptxNativeEndpoint.ts').replaceAll('\\', '/'))};
import { parsePptxMediaAction } from ${JSON.stringify(resolve('src/core/pptxMediaAction.ts').replaceAll('\\', '/'))};
import { readPptxMediaCallDelay, startPptxDelayedMediaAction } from ${JSON.stringify(resolve('src/adapters/pptx/mediaCallDelay.ts').replaceAll('\\', '/'))};
import { readPptxMediaTimelineControls } from ${JSON.stringify(resolve('src/adapters/pptx/mediaTimelineControls.ts').replaceAll('\\', '/'))};
Object.assign(window,{IndexedDbSessionRepository,SessionHub,createSession,createPptxSourceGroupDriver,PptxDurablePlayback,toPlayerSnapshot,PptxNativeMediaActions,PptxNativeEndpoint,parsePptxMediaAction,readPptxMediaCallDelay,startPptxDelayedMediaAction,readPptxMediaTimelineControls});`);
await build({ configFile: false, logLevel: 'error', build: { outDir: resolve(output, 'bundle'), emptyOutDir: false, lib: { entry, formats: ['iife'], name: 'CheckpointProbe', fileName: () => 'entry.js' } } });
const bundle = await readFile(resolve(output, 'bundle/entry.js'));
const server = createServer((request, response) => {
  response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; connect-src 'self'; media-src blob:");
  if (request.url === '/entry.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle); }
  else { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>Checkpoint probe</title><script src="/entry.js"></script>'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = `http://127.0.0.1:${server.address().port}`, options = { executablePath: resolve(whalePath), headless: true, ignoreDefaultArgs: true,
  args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox'] }; let context;
try {
  context = await chromium.launchPersistentContext(profile, options); let page = await context.newPage(); await page.goto(url);
  await page.waitForFunction(() => !!window.SessionHub);
  const first = await page.evaluate(async () => {
    const open = () => window.IndexedDbSessionRepository.open(), session = window.createSession('synthetic-pptx', 'Synthetic checkpoint', 1);
    const doc = id => ({ id, source: { type: 'pptx', name: 'Synthetic.pptx', size: 1, lastModified: 0, fingerprint: 'a'.repeat(64) }, lastSlideId: 'slide-1', knownSlideCount: 2, slideIds: ['slide-1','slide-2'], slideDeltas: {}, mediaBookmarks: {}, dirty: false });
    session.documents = { A: doc('A'), B: doc('B') }; session.documentOrder = ['A','B']; session.presentedSelection = { documentId: 'A', slideId: 'slide-1' };
    const repo = await open(); await repo.create(session); repo.close(); const hub = new window.SessionHub(open, () => {});
    const base = { sessionId: session.id, documentId: 'A', slideId: 'slide-1' };
    const send = (role, command) => hub.handle(role, { type: 'SESSION_COMMAND', command });
    const begin = { ...base, type: 'BEGIN_PPTX_GROUP', revision: 0, commandId: 'run-1' };
    if (!(await send('player', begin)).ok) throw Error('BEGIN_FAILED');
    const completion = { ...base, type: 'CHECKPOINT_PPTX_GROUP', revision: 1, commandId: 'finish-1', epoch: 'run-1', checkpoint: {
      renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: 'a'.repeat(64), completedGroups: 1,
      pose: { version: 1, scope: { ...base, revision: 1 }, entries: [{ target: 3, opacity: 1, transform: 'matrix(0,1,-1,0,240,0)', clipPath: 'none', visible: true }] } } };
    const forbidden = await send('editor', completion), complete = await send('player', completion), duplicate = await send('player', completion);
    if (!complete.ok || !duplicate.ok || forbidden.ok) throw Error('COMPLETE_FAILED');
    await send('player', { ...begin, revision: 2, commandId: 'run-2' });
    const switchTo = async (documentId, revision) => {
      const requestId = 'request-' + documentId;
      const requested = await send('remote', { ...base, type: 'REQUEST_PRESENTATION', documentId, revision, playerId: 'probe-owner', commandId: requestId });
      if (!requested.ok) throw Error('REQUEST_FAILED');
      const committed = await send('player', { ...base, type: 'COMMIT_PRESENTATION', documentId, revision: requested.session.revision, playerId: 'probe-owner', requestId, commandId: 'commit-' + documentId });
      if (!committed.ok) throw Error('COMMIT_FAILED:' + committed.code);
      return hub.handle('remote', { type: 'GET_SESSION', sessionId: session.id });
    };
    const away = await switchTo('B', 3), back = await switchTo('A', away.session.revision);
    const late = structuredClone(completion); late.revision = back.session.revision; late.commandId = 'late'; late.epoch = 'run-2'; late.checkpoint.completedGroups = 2; late.checkpoint.pose.scope.revision = back.session.revision;
    const rejected = await send('player', late);
    if (!away.ok || !back.ok || rejected.ok) throw Error('SWITCH_FAILED');
    return { revision: back.session.revision, forbidden: forbidden.code, late: rejected.code, checkpoint: back.session.documents.A.pptxPlayback };
  });
  assert.equal(first.revision, 7); assert.equal(first.forbidden, 'FORBIDDEN'); assert.equal(first.late, 'INVALID_TARGET'); assert.equal(first.checkpoint.run, null);
  const sourceGroups = await page.evaluate(async () => {
    const repo = await window.IndexedDbSessionRepository.open();
    const original = (await repo.read('synthetic-pptx')).session;
    const session = structuredClone(original); session.id = 'synthetic-source-cursor'; session.revision = 0;
    for (const doc of Object.values(session.documents)) delete doc.pptxPlayback;
    await repo.create(session); repo.close();
    let snapshot = window.toPlayerSnapshot(session), id = 0, mediaStarts = 0; const commands = [];
    const hub = new window.SessionHub(() => window.IndexedDbSessionRepository.open(), () => {});
    const root = document.createElement('div'), target = document.createElement('div'); target.dataset.el = '3'; root.append(target); document.body.append(root);
    let shapeDone = 0;
    const shape = { totalGroups: 1, targets: [3], restore(done) { shapeDone = done; target.style.transform = `translateX(${done * 20}px)`; },
      next() { return { start() { const a = target.animate([{ transform: 'translateX(0px)' }, { transform: 'translateX(20px)' }], { duration: 20, fill: 'forwards' });
        return { finished: a.finished.then(() => undefined), cancel() { a.cancel(); } }; }, complete() { shapeDone++; } }; } };
    const startMedia = () => { mediaStarts++; return { finished: Promise.resolve(), cancel() {} }; };
    const driver = window.createPptxSourceGroupDriver(shape, [{ timingId: 20, shapeGroup: null, startMedia }, { timingId: 30, shapeGroup: 0, startMedia }, { timingId: 40, shapeGroup: null, startMedia }]);
    const transport = { snapshot: () => snapshot, newId: () => `source-${++id}`, async send(command) {
      const result = await hub.handle('player', { type: 'SESSION_COMMAND', command });
      commands.push({ type: command.type, ok: result.ok, code: result.code });
      if (!result.ok || result.kind !== 'player') return { ok: false }; snapshot = result.snapshot; return { ok: true, snapshot };
    } };
    const bridge = new window.PptxDurablePlayback(root, driver, transport, { sessionId: session.id, documentId: 'A', slideId: 'slide-1', fingerprint: 'a'.repeat(64) });
    const outcomes = []; try { for (let i = 0; i < 3; i++) outcomes.push(await bridge.play()); }
    catch (error) { throw Error(JSON.stringify({ error: String(error), commands, outcomes, mediaStarts, shapeDone, snapshot })); }
    bridge.restore();
    return { outcomes, mediaStarts, shapeDone, checkpoint: snapshot.pptx.checkpoint, exhausted: await bridge.play(), nativeMedia: false };
  });
  assert.deepEqual(sourceGroups.outcomes, ['completed', 'completed', 'completed']); assert.equal(sourceGroups.mediaStarts, 3);
  assert.equal(sourceGroups.shapeDone, 1); assert.equal(sourceGroups.exhausted, 'exhausted'); assert.equal(sourceGroups.checkpoint.renderer, 'web-ppt-0.4.5/source-v1');
  const nativeMediaActions = await page.evaluate(async () => {
    const bytes = new ArrayBuffer(44 + 8000 * 4 * 2), view = new DataView(bytes);
    const ascii = (offset, text) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)));
    ascii(0, 'RIFF'); view.setUint32(4, bytes.byteLength - 8, true); ascii(8, 'WAVE'); ascii(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 8000, true);
    view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); ascii(36, 'data'); view.setUint32(40, bytes.byteLength - 44, true);
    const media = document.createElement('audio'), url = URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
    media.muted = true; media.preload = 'auto'; document.body.append(media);
    const loaded = new Promise((resolve, reject) => { media.onloadedmetadata = resolve; media.onerror = () => reject(Error('NATIVE_WAV_LOAD')); });
    media.src = url; await loaded;
    const driver = new window.PptxNativeMediaActions(media, { startSec: .2, endSec: 3.8 }, () => true);
    const command = async text => { const action = window.parsePptxMediaAction('call', text); if (!action) throw Error('ACTION_PARSE'); const run = driver.start(action); await run.finished; return run; };
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    try {
      await command('play'); const start = media.currentTime; await wait(160); const progressed = media.currentTime;
      await command('pause'); const paused = media.currentTime; await wait(100); const retained = media.currentTime;
      await command('resume'); await wait(120); const resumed = media.currentTime;
      await command('playFrom(1.25)'); const seeked = media.currentTime;
      await command('stop'); const stopped = media.paused;
      const toggled = await command('togglePause'), restarted = media.currentTime; toggled.cancel(); const cancelled = media.paused;
      driver.dispose();
      let release;
      const wrapped = { get readyState() { return media.readyState; }, get duration() { return media.duration; }, get currentTime() { return media.currentTime; }, set currentTime(value) { media.currentTime = value; },
        get paused() { return media.paused; }, get ended() { return media.ended; }, pause() { media.pause(); },
        async play() { await media.play(); await new Promise(resolve => { release = resolve; }); } };
      const delayed = new window.PptxNativeMediaActions(wrapped, { startSec: .2, endSec: 3.8 }, () => true);
      const late = delayed.start({ type: 'play' }); while (!release) await wait(10);
      late.cancel(); release(); let rejected = false; try { await late.finished; } catch { rejected = true; }
      const latePaused = media.paused; delayed.dispose();
      const repository = await window.IndexedDbSessionRepository.open();
      const session = structuredClone((await repository.read('synthetic-source-cursor')).session); session.id = 'synthetic-native-ack'; session.revision = 0;
      for (const doc of Object.values(session.documents)) delete doc.pptxPlayback;
      await repository.create(session); repository.close();
      let snapshot = window.toPlayerSnapshot(session), id = 0, releaseAck, hold = true, nativeStarts = 0;
      const hub = new window.SessionHub(() => window.IndexedDbSessionRepository.open(), () => {});
      const native = new window.PptxNativeMediaActions(media, { startSec: .2, endSec: 3.8 }, () => true);
      const startMedia = () => { nativeStarts++; return native.start({ type: 'play' }); };
      const sourceDriver = window.createPptxSourceGroupDriver({ totalGroups: 0, targets: [], restore() {}, next() { throw Error('NO_SHAPE_GROUP'); } },
        [{ timingId: 1, shapeGroup: null, startMedia }, { timingId: 2, shapeGroup: null, startMedia }]);
      const bridge = new window.PptxDurablePlayback(document.body, sourceDriver, { snapshot: () => snapshot, newId: () => `ack-${++id}`, async send(command) {
        const result = await hub.handle('player', { type: 'SESSION_COMMAND', command });
        if (!result.ok || result.kind !== 'player') throw Error('NATIVE_ACK_COMMAND');
        snapshot = result.snapshot;
        if (hold && command.type === 'CHECKPOINT_PPTX_GROUP') return await new Promise(resolve => { releaseAck = () => resolve({ ok: true, snapshot: result.snapshot }); });
        return { ok: true, snapshot };
      } }, { sessionId: session.id, documentId: 'A', slideId: 'slide-1', fingerprint: 'a'.repeat(64) });
      const pending = bridge.play(); while (!releaseAck) await wait(10);
      const beforeAck = media.currentTime; await wait(140); const ackWaitingTime = media.currentTime;
      bridge.invalidate(); const ackOutcome = await pending, ackCancelledPaused = media.paused;
      releaseAck(); hold = false; await wait(50); const lateAckStillPaused = media.paused;
      bridge.restore(); const retainedCompleted = snapshot.pptx.checkpoint.completedGroups;
      const acceptedOutcome = await bridge.play(), acceptedStillPlaying = !media.paused;
      native.dispose();
      const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
      const sourceXml = `<p:sld xmlns:p="${p}"><p:cNvPr id="7"/><p:timing><p:tnLst><p:par><p:cTn id="1" nodeType="tmRoot" dur="indefinite" restart="never"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>
        <p:audio><p:cMediaNode><p:cTn id="2" dur="indefinite"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="7"/></p:tgtEl></p:cMediaNode></p:audio>
        <p:seq><p:cTn id="10" nodeType="mainSeq" dur="indefinite"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="40" nodeType="clickEffect">
        <p:stCondLst><p:cond delay="50"/></p:stCondLst><p:childTnLst><p:cmd cmd="playFrom(0.6)"><p:cBhvr><p:cTn id="4">
        <p:stCondLst><p:cond delay="100"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="7"/></p:tgtEl></p:cBhvr></p:cmd></p:childTnLst>
        </p:cTn></p:par></p:childTnLst></p:cTn><p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing></p:sld>`;
      const xml = new DOMParser().parseFromString(sourceXml, 'application/xml'), plan = window.readPptxMediaCallDelay(xml, 4, 40);
      const controls = window.readPptxMediaTimelineControls(xml), refusedControls = [];
      for (const [name, value] of [['concurrent', '1'], ['nextAc', 'seek'], ['prevAc', 'skipTimed']]) {
        const altered = new DOMParser().parseFromString(sourceXml, 'application/xml');
        altered.getElementsByTagNameNS(p, 'seq')[0].setAttribute(name, value);
        try { window.readPptxMediaTimelineControls(altered); } catch (error) { refusedControls.push({ name, error: error.message }); }
      }
      const action = window.parsePptxMediaAction(null, xml.getElementsByTagNameNS(p, 'cmd')[0].getAttribute('cmd'));
      const delayNative = new window.PptxNativeMediaActions(media, { startSec: .2, endSec: 3.8 }, () => true);
      let starts = 0, startedAfterMs = 0; const scheduledAt = performance.now();
      const run = window.startPptxDelayedMediaAction(plan.delayMs, () => true, () => { starts++; startedAfterMs = performance.now() - scheduledAt; return delayNative.start(action); });
      const pausedBeforeDeadline = media.paused; await run.finished; const playingAfterDeadline = !media.paused;
      run.cancel(); const pausedAfterDelayCancel = media.paused;
      let cancelledStarts = 0;
      const never = window.startPptxDelayedMediaAction(plan.delayMs, () => true, () => { cancelledStarts++; return delayNative.start(action); });
      const neverOutcome = never.finished.catch(error => error.message); await wait(20); never.cancel(); await wait(180);
      const cancelledOutcome = await neverOutcome; delayNative.dispose();
      xml.getElementsByTagNameNS(p, 'cmd')[0].getElementsByTagNameNS(p, 'cond')[0].setAttribute('evt', 'onClick');
      let conditionalError = null; try { window.readPptxMediaCallDelay(xml, 4, 40); } catch (error) { conditionalError = error.message; }
      const endpointSession = structuredClone(session); endpointSession.id = 'synthetic-native-endpoint'; endpointSession.revision = 0;
      endpointSession.documents.A.localMedia = { clip: { id: 'clip', slideId: 'slide-1', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: bytes.byteLength,
        lastModified: 0, fingerprint: 'b'.repeat(64), durationSec: media.duration, playback: { startSec: .2, endSec: 3.8, volume: .25, muted: true },
        embeddedSource: { type: 'pptx', sourceFingerprint: 'a'.repeat(64), sourcePart: 'ppt/slides/slide1.xml', elementPath: [0] } } };
      const endpointRepo = await window.IndexedDbSessionRepository.open(); await endpointRepo.create(endpointSession); endpointRepo.close();
      let endpointSnapshot = window.toPlayerSnapshot(endpointSession), endpointId = 0, releaseResult, holdResult = false;
      const endpointCommands = [], endpointHub = new window.SessionHub(() => window.IndexedDbSessionRepository.open(), () => {});
      const endpointTransport = { snapshot: () => endpointSnapshot, newId: () => `endpoint-${++endpointId}`, async send(command) {
        const send = async () => {
          const result = await endpointHub.handle('player', { type: 'SESSION_COMMAND', command }); endpointCommands.push({ type: command.type, ok: result.ok, code: result.code });
          if (!result.ok || result.kind !== 'player') return { ok: false, code: result.code };
          endpointSnapshot = result.snapshot; return { ok: true, snapshot: endpointSnapshot };
        };
        if (holdResult && command.type === 'CHECKPOINT_PPTX_MEDIA') return await new Promise(resolve => { releaseResult = async () => resolve(await send()); });
        return await send();
      } };
      const endpoint = new window.PptxNativeEndpoint(media, endpointTransport, { sessionId: endpointSession.id, documentId: 'A', slideId: 'slide-1', mediaId: 'clip', fingerprint: 'b'.repeat(64) });
      await endpointTransport.send({ type: 'BEGIN_PPTX_GROUP', sessionId: endpointSession.id, documentId: 'A', slideId: 'slide-1', revision: 0, commandId: 'endpoint-run' });
      await endpoint.start({ type: 'playFrom', timeSec: .6 }).finished;
      const ownAckSuppressed = endpoint.suppressApply(endpointSnapshot.media[0].bookmark), endpointStart = media.currentTime;
      await wait(120); const endpointProgressed = media.currentTime;
      const freshEndpoint = new window.PptxNativeEndpoint(media, endpointTransport, { sessionId: endpointSession.id, documentId: 'A', slideId: 'slide-1', mediaId: 'clip', fingerprint: 'b'.repeat(64) });
      const freshHeld = freshEndpoint.suppressApply(endpointSnapshot.media[0].bookmark);
      while (!endpointSnapshot.media[0].bookmark.paused) await wait(10);
      const freshPaused = media.paused, freshSavedPosition = endpointSnapshot.media[0].bookmark.timeSec; freshEndpoint.dispose();
      await endpoint.start({ type: 'stop' }).finished; await endpoint.start({ type: 'togglePause' }).finished;
      const endpointRestart = media.currentTime;
      holdResult = true; const lateResult = endpoint.start({ type: 'playFrom', timeSec: 1.25 });
      const lateResultOutcome = lateResult.finished.then(() => 'unexpected-success', error => error.message);
      while (!releaseResult) await wait(10); lateResult.cancel(); const endpointCancelled = media.paused;
      await releaseResult(); await wait(80);
      const endpointLatePaused = media.paused, endpointSavedPaused = endpointSnapshot.media[0].bookmark.paused;
      const endpointLateAckSuppressed = endpoint.suppressApply(endpointSnapshot.media[0].bookmark);
      const teacherResult = await endpointHub.handle('remote', { type: 'SESSION_COMMAND', command: { type: 'PLAY_MEDIA', sessionId: endpointSession.id,
        documentId: 'A', slideId: 'slide-1', mediaId: 'clip', revision: endpointSnapshot.revision, commandId: 'endpoint-teacher' } });
      if (!teacherResult.ok || teacherResult.kind !== 'teacher') throw Error('ENDPOINT_TEACHER_FAILED');
      endpointSnapshot = window.toPlayerSnapshot(teacherResult.session); const teacherAckSuppressed = endpoint.suppressApply(endpointSnapshot.media[0].bookmark);
      await media.play(); lateResult.cancel(); endpoint.dispose(); const teacherStillPlaying = !media.paused;
      const nativeEndpoint = { ownAckSuppressed, endpointStart, endpointProgressed, freshHeld, freshPaused, freshSavedPosition, endpointRestart, endpointCancelled, endpointLatePaused, endpointSavedPaused,
        endpointLateAckSuppressed, lateResultOutcome: await lateResultOutcome, teacherAckSuppressed, teacherStillPlaying, commands: endpointCommands, sourceTimelineConnected: false };
      return { duration: media.duration, start, progressed, paused, retained, resumed, seeked, stopped, restarted, cancelled, lateRejected: rejected, latePaused, muted: media.muted,
        nativeEndpoint,
        sourceDelay: { plan, controls, refusedControls, starts, startedAfterMs, pausedBeforeDeadline, playingAfterDeadline, pausedAfterDelayCancel, cancelledStarts, cancelledOutcome, conditionalError },
        ackBridge: { beforeAck, ackWaitingTime, ackOutcome, ackCancelledPaused, lateAckStillPaused, retainedCompleted, acceptedOutcome, acceptedStillPlaying, nativeStarts }, productTimingConnected: false };
    } finally { driver.dispose(); media.pause(); media.removeAttribute('src'); media.load(); media.remove(); URL.revokeObjectURL(url); }
  });
  assert(nativeMediaActions.progressed > nativeMediaActions.start); assert(Math.abs(nativeMediaActions.retained - nativeMediaActions.paused) < .01);
  assert(nativeMediaActions.resumed > nativeMediaActions.retained); assert(Math.abs(nativeMediaActions.seeked - 1.25) < .05);
  assert(nativeMediaActions.stopped && nativeMediaActions.cancelled && nativeMediaActions.lateRejected && nativeMediaActions.latePaused);
  assert(Math.abs(nativeMediaActions.restarted - .2) < .05);
  assert(nativeMediaActions.ackBridge.ackWaitingTime > nativeMediaActions.ackBridge.beforeAck);
  assert.equal(nativeMediaActions.ackBridge.ackOutcome, 'superseded'); assert(nativeMediaActions.ackBridge.ackCancelledPaused && nativeMediaActions.ackBridge.lateAckStillPaused);
  assert.equal(nativeMediaActions.ackBridge.retainedCompleted, 1); assert.equal(nativeMediaActions.ackBridge.acceptedOutcome, 'completed');
  assert(nativeMediaActions.ackBridge.acceptedStillPlaying); assert.equal(nativeMediaActions.ackBridge.nativeStarts, 2);
  assert.equal(nativeMediaActions.sourceDelay.plan.delayMs, 150); assert.equal(nativeMediaActions.sourceDelay.starts, 1); assert(nativeMediaActions.sourceDelay.startedAfterMs >= 150);
  assert(nativeMediaActions.sourceDelay.pausedBeforeDeadline && nativeMediaActions.sourceDelay.playingAfterDeadline && nativeMediaActions.sourceDelay.pausedAfterDelayCancel);
  assert.equal(nativeMediaActions.sourceDelay.cancelledStarts, 0); assert.equal(nativeMediaActions.sourceDelay.cancelledOutcome, 'PPTX_MEDIA_DELAY_CANCELLED');
  assert.equal(nativeMediaActions.sourceDelay.conditionalError, 'PPTX_MEDIA_CALL_DELAY_UNVERIFIED');
  assert.equal(nativeMediaActions.sourceDelay.controls.controlsVerified, true); assert.equal(nativeMediaActions.sourceDelay.controls.executionVerified, false);
  assert.deepEqual(nativeMediaActions.sourceDelay.controls.groupTimingIds, [40]); assert.deepEqual(nativeMediaActions.sourceDelay.controls.declarationTimingIds, [2]);
  assert.equal(nativeMediaActions.sourceDelay.refusedControls.length, 3);
  assert(nativeMediaActions.sourceDelay.refusedControls.every(item => item.error === 'PPTX_MEDIA_TIMELINE_CONTROLS_UNVERIFIED'));
  assert(nativeMediaActions.nativeEndpoint.ownAckSuppressed && nativeMediaActions.nativeEndpoint.endpointProgressed > nativeMediaActions.nativeEndpoint.endpointStart);
  assert(nativeMediaActions.nativeEndpoint.freshHeld && nativeMediaActions.nativeEndpoint.freshPaused);
  assert(Math.abs(nativeMediaActions.nativeEndpoint.freshSavedPosition - .6) < .05);
  assert(Math.abs(nativeMediaActions.nativeEndpoint.endpointRestart - .2) < .05);
  assert(nativeMediaActions.nativeEndpoint.endpointCancelled && nativeMediaActions.nativeEndpoint.endpointLatePaused && nativeMediaActions.nativeEndpoint.endpointSavedPaused);
  assert(nativeMediaActions.nativeEndpoint.endpointLateAckSuppressed); assert.match(nativeMediaActions.nativeEndpoint.lateResultOutcome, /CANCELLED/);
  assert.equal(nativeMediaActions.nativeEndpoint.teacherAckSuppressed, false); assert(nativeMediaActions.nativeEndpoint.teacherStillPlaying);
  assert(nativeMediaActions.nativeEndpoint.commands.every(command => command.ok));
  await context.close(); context = await chromium.launchPersistentContext(profile, options); page = await context.newPage(); await page.goto(url); await page.waitForFunction(() => !!window.SessionHub);
  const restored = await page.evaluate(async () => { const repo = await window.IndexedDbSessionRepository.open(); try { return await repo.read('synthetic-pptx'); } finally { repo.close(); } });
  assert.deepEqual(restored.session.documents.A.pptxPlayback, first.checkpoint); assert.equal(restored.session.revision, first.revision); assert.equal(restored.receipts.length, 7);
  const sourceRestored = await page.evaluate(async () => {
    const repo = await window.IndexedDbSessionRepository.open(); let saved; try { saved = await repo.read('synthetic-source-cursor'); } finally { repo.close(); }
    let mediaStarts = 0, shapeDone = -1;
    const shape = { totalGroups: 1, targets: [3], restore(done) { shapeDone = done; }, next() { throw Error('HISTORICAL_SHAPE_REPLAY'); } };
    const startMedia = () => { mediaStarts++; throw Error('HISTORICAL_MEDIA_REPLAY'); };
    const driver = window.createPptxSourceGroupDriver(shape, [{ timingId: 20, shapeGroup: null, startMedia }, { timingId: 30, shapeGroup: 0, startMedia }, { timingId: 40, shapeGroup: null, startMedia }]);
    const root = document.createElement('div'), target = document.createElement('div'); target.dataset.el = '3'; root.append(target); document.body.append(root);
    const snapshot = window.toPlayerSnapshot(saved.session);
    const bridge = new window.PptxDurablePlayback(root, driver, { snapshot: () => snapshot, send() { throw Error('HISTORICAL_COMMAND'); }, newId() { throw Error('HISTORICAL_COMMAND'); } },
      { sessionId: saved.session.id, documentId: 'A', slideId: 'slide-1', fingerprint: 'a'.repeat(64) });
    bridge.restore(); return { mediaStarts, shapeDone, checkpoint: snapshot.pptx.checkpoint };
  });
  assert.equal(sourceRestored.mediaStarts, 0); assert.equal(sourceRestored.shapeDone, 1); assert.deepEqual(sourceRestored.checkpoint, sourceGroups.checkpoint);
  const report = { profile, userAgent: await page.evaluate(() => navigator.userAgent), first, sourceGroups, sourceRestored, nativeMediaActions, restarted: true, checkpointEqual: true, receipts: restored.receipts.length, productRendering: false };
  await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report));
} finally { await context?.close(); await new Promise(resolve => server.close(resolve)); }
