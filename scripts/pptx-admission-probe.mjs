import assert from 'node:assert/strict';

// Local native-window verification, numbers/booleans only. Delays delivery of
// real immutable File bytes; it never fabricates parser results or registration.
export async function verifyPptxAdmission({ context, caller, origin, teacherPath, fingerprint }) {
  const open = async label => {
    const url = `${origin}/probe/index.html?admission=${label}`;
    const created = await caller.evaluate(url => (window.whale ?? chrome).windows.create({ url, type: 'popup', width: 600, height: 500 }), url);
    let page; const deadline = Date.now() + 10000;
    while (!page && Date.now() < deadline) { page = context.pages().find(p => p.url() === url); if (!page) await new Promise(resolve => setTimeout(resolve, 50)); }
    assert(page); await page.waitForFunction(() => !!window.api); await page.locator('#source').setInputFiles(teacherPath);
    await page.evaluate(fingerprint => {
      window.expectedFingerprint = fingerprint;
      window.input = document.querySelector('#source').files[0]; window.reads = 0; window.workerStarts = 0;
      const read = Blob.prototype.arrayBuffer, NativeWorker = window.Worker;
      Blob.prototype.arrayBuffer = function (...args) {
        const pending = read.apply(this, args);
        if (this !== window.jobFile) return pending;
        window.reads++;
        return window.holdReads ? pending.then(bytes => new Promise(resolve => { window.releaseRead = () => { window.holdReads = false; resolve(bytes); }; })) : pending;
      };
      window.Worker = class extends NativeWorker { constructor(...args) { super(...args); window.workerStarts++; } };
      window.beginJob = (kind, hold = false) => {
        window.prepared?.dispose(); window.prepared = null; window.reads = 0; window.workerStarts = 0; window.releaseRead = null; window.holdReads = hold;
        const invalid = new Uint8Array(64); invalid.set([80, 75, 3, 4]);
        window.jobFile = new File([kind === 'invalid' ? invalid : window.input], 'Synthetic.pptx', { lastModified: 0 }); window.controller = new AbortController();
        let pending;
        if (kind === 'source' || kind === 'invalid') pending = window.api.loadPptxSourceModel(window.jobFile, window.controller.signal);
        else if (kind === 'inspection') pending = window.api.inspectPptxFile(window.jobFile, window.controller.signal, true);
        else if (kind === 'identity') pending = window.api.readPptxSourceIdentity(window.jobFile, window.controller.signal);
        else if (kind === 'vault') {
          const vault = new window.api.SourceVault({ read: async key => ({ key, fingerprint: window.expectedFingerprint, handle: { getFile: async () => window.jobFile } }), write: async () => {} }, undefined, window.api.readPptxSourceIdentity);
          pending = vault.get('synthetic-key', window.expectedFingerprint, window.controller.signal);
        }
        else {
          const session = window.api.createSession(crypto.randomUUID(), 'Synthetic admitted import', Date.now());
          const vault = new window.api.SourceVault({ read: async () => undefined, write: async () => {} });
          pending = window.api.preparePptxImport(window.jobFile, session, vault, undefined, undefined, window.controller.signal);
        }
        window.done = pending.then(value => {
          if (kind === 'source') { window.prepared = value; return { fingerprint: value.fingerprint, assets: value.ownedUrls.size, slides: value.parts.length }; }
          return { fingerprint: kind === 'import' ? value.document.source.fingerprint : value.fingerprint };
        }, error => ({ error: error.name, code: error.message }));
      };
    }, fingerprint);
    return { page, windowId: created.id };
  };
  const a = await open('A'), b = await open('B'); assert.notEqual(a.windowId, b.windowId);
  const query = page => page.evaluate(async () => {
    const state = await navigator.locks.query(), name = window.api.PPTX_PREPARATION_LOCK;
    return { held: state.held.filter(lock => lock.name === name).length, pending: state.pending.filter(lock => lock.name === name).length };
  });
  const held = async (kind = 'source') => { await a.page.evaluate(kind => window.beginJob(kind, true), kind); await a.page.waitForFunction(() => typeof window.releaseRead === 'function'); assert.deepEqual(await query(a.page), { held: 1, pending: 0 }); };
  const queued = async kind => {
    await b.page.evaluate(kind => window.beginJob(kind), kind);
    await b.page.waitForFunction(async () => (await navigator.locks.query()).pending.some(lock => lock.name === window.api.PPTX_PREPARATION_LOCK));
    assert.deepEqual(await b.page.evaluate(() => ({ reads: window.reads, workers: window.workerStarts })), { reads: 0, workers: 0 });
    assert.deepEqual(await query(b.page), { held: 1, pending: 1 });
  };
  const outcomes = []; let twoRealmInventory;
  for (const kind of ['source', 'import', 'inspection', 'identity', 'vault']) {
    await held(); await queued(kind);
    {
      await b.page.evaluate(() => window.controller.abort()); assert.equal((await b.page.evaluate(() => window.done)).error, 'AbortError');
      await b.page.waitForFunction(async () => !(await navigator.locks.query()).pending.some(lock => lock.name === window.api.PPTX_PREPARATION_LOCK));
      await queued(kind);
    }
    await a.page.evaluate(() => window.releaseRead());
    const first = await a.page.evaluate(() => window.done), second = await b.page.evaluate(() => window.done);
    assert.equal(first.fingerprint, fingerprint); assert(first.assets > 0); assert.equal(second.fingerprint, fingerprint);
    assert(await a.page.evaluate(() => window.prepared.ownedUrls.size > 0), 'Ready current owner remains alive while another job is admitted');
    if (kind === 'source') {
      const snapshots = await Promise.all([a.page, b.page].map(page => page.evaluate(() => window.api.getPptxResourceInventory())));
      for (const snapshot of snapshots) { assert.equal(snapshot.readySources, 1); assert.equal(snapshot.leases, 1); assert.equal(snapshot.jobs, 0); }
      twoRealmInventory = { scope: 'sum-of-two-test-realms-logical', snapshots, sources: snapshots.reduce((sum, value) => sum + value.readySources, 0), assetBytes: snapshots.reduce((sum, value) => sum + value.assetBytes, 0), physicalMemoryBytes: null };
    }
    assert.deepEqual(await query(b.page), { held: 0, pending: 0 });
    outcomes.push({ kind, queuedWithoutReadOrWorker: true, queuedCancellation: true, admittedAfterRelease: true });
  }
  await held(); await queued('source');
  await a.page.evaluate(() => window.controller.abort()); assert.equal((await a.page.evaluate(() => window.done)).error, 'AbortError');
  assert.deepEqual(await query(b.page), { held: 1, pending: 1 });
  assert.deepEqual(await b.page.evaluate(() => ({ reads: window.reads, workers: window.workerStarts })), { reads: 0, workers: 0 });
  await a.page.evaluate(() => window.releaseRead()); assert.equal((await b.page.evaluate(() => window.done)).fingerprint, fingerprint);
  assert.equal(await a.page.evaluate(() => window.workerStarts), 0, 'Aborted read never reaches ZIP/model workers');
  await held('invalid'); await queued('source'); await a.page.evaluate(() => window.releaseRead());
  assert.equal((await a.page.evaluate(() => window.done)).error, 'Error');
  assert.equal((await b.page.evaluate(() => window.done)).fingerprint, fingerprint);
  await held(); await queued('source'); await a.page.close();
  assert.equal((await b.page.evaluate(() => window.done)).fingerprint, fingerprint);
  assert.deepEqual(await query(b.page), { held: 0, pending: 0 });
  await b.page.evaluate(() => { Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined }); window.beginJob('source'); });
  assert.equal((await b.page.evaluate(() => window.done)).code, 'PPTX_PREPARATION_LOCK_UNAVAILABLE');
  assert.deepEqual(await b.page.evaluate(() => ({ reads: window.reads, workers: window.workerStarts })), { reads: 0, workers: 0 });
  await b.page.close();
  return { nativePopupWindows: 2, distinctFileObjects: true, outcomes, twoRealmInventory, activeCancelRetainsReservationUntilReadDelivery: true, failedPreparationReleasesGate: true, ownerCloseReleasesNativeGate: true, missingApiFailsClosedWithoutRead: true, readyOwnerPreserved: true, windowsClosedGracefully: true };
}
