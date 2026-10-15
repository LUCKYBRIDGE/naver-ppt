import { readPptxInput } from './input';
import { readPptxPackageIsolated } from './isolatedPackage';
import { runPptxParserJob } from './isolatedModel';
import { inspectPptxXml } from './packageGuard';
import { readPptxSlideOrder } from './slideOrder';
import { hydratePptxAssets } from './assetModel';
import { recoverPptxEmbeddedMedia } from './recoverEmbeddedMedia';
import { releasePptxLargeMediaParts } from './largeMediaParts';
import { releasePptxDuplicateImageParts, releasePptxDuplicateMediaParts } from './duplicateImageParts';
import { clearPptxPrivateParts } from './privateBuffers';
import { withPptxPreparation } from './preparationAdmission';
import { measurePptxSourceBytes, PptxResourceInventory } from './resourceInventory';
const resources = new PptxResourceInventory();
export const getPptxResourceInventory = () => resources.snapshot();

async function parsePptxSourceModel(file: File, signal: AbortSignal) {
  const input = await readPptxInput(file, signal), checked = await readPptxPackageIsolated(input.bytes, { signal });
  const inspection = inspectPptxXml(checked.files, signal), parts = readPptxSlideOrder(checked.files);
  // Package guards have finished with these private bytes. Transfer them rather
  // than retaining another full PPTX copy while the parser allocates its model.
  const assets = await runPptxParserJob(input.bytes, { signal, consumeInput: true }, 'presentation', data => hydratePptxAssets(data, undefined, true));
  if (signal.aborted || assets.model.slides.length !== parts.length) {
    assets.dispose();
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    throw Error('PPTX_MODEL_BINDING_MISMATCH');
  }
  try {
    const embeddedRecovery = recoverPptxEmbeddedMedia({ ...assets, parts, files: checked.files }, signal);
    const largeEvidence = await releasePptxLargeMediaParts(checked.files, signal, true);
    const duplicateMediaParts = await releasePptxDuplicateMediaParts(checked.files, assets.ownedBlobs, signal, true);
    const largeMediaParts = new Map([...largeEvidence, ...duplicateMediaParts]);
    const duplicateImageParts = await releasePptxDuplicateImageParts(checked.files, assets.ownedBlobs, signal, true);
    let disposed = false;
    return { ...assets, fingerprint: input.fingerprint, parts, files: checked.files, inspection, embeddedRecovery, largeMediaParts, duplicateImageParts, duplicateMediaParts,
      dispose() { if (disposed) return; disposed = true; try { assets.dispose(); } finally { clearPptxPrivateParts(checked.files); } } };
  } catch (error) { try { assets.dispose(); } finally { clearPptxPrivateParts(checked.files); } throw error; }
}

type Source = Awaited<ReturnType<typeof parsePptxSourceModel>>;
type Shared = { source: Source; users: number; token: symbol };
type SourceLease = Source & { retain(): SourceLease };
// Same immutable File object in one window only. No fingerprint-only reuse,
// persistent cache, or retention after the final source owner releases it.
const readySources = new WeakMap<File, Shared>();
type Pending = { controller: AbortController; waiters: number; promise: Promise<Shared>; token: symbol; shared?: Shared };
const pendingSources = new WeakMap<File, Pending>();
const cancelled = () => new DOMException('Cancelled', 'AbortError');
function release(file: File, owner: Shared) {
  resources.leases(owner.token, --owner.users);
  if (owner.users === 0) { if (readySources.get(file) === owner) readySources.delete(file); try { owner.source.dispose(); } finally { resources.remove(owner.token); } }
}
function lease(file: File, owner: Shared): SourceLease {
  let released = false;
  return { ...owner.source, retain() {
    if (released) throw Error('PPTX_SOURCE_RELEASED');
    owner.users++; resources.leases(owner.token, owner.users); return lease(file, owner);
  }, dispose() {
    if (released) return; released = true;
    release(file, owner);
  } };
}
export async function loadPptxSourceModel(file: File, signal: AbortSignal) {
  if (signal.aborted) throw cancelled();
  const ready = readySources.get(file);
  if (ready) { ready.users++; resources.leases(ready.token, ready.users); return lease(file, ready); }
  let pending = pendingSources.get(file);
  if (!pending) {
    const job: Pending = { controller: new AbortController(), waiters: 0, promise: null!, token: resources.begin(file.size) };
    pendingSources.set(file, job);
    job.promise = Promise.resolve().then(() => withPptxPreparation(job.controller.signal, () => {
      resources.stage(job.token, 'preparing'); return parsePptxSourceModel(file, job.controller.signal);
    })).then(source => {
      if (job.controller.signal.aborted || !job.waiters) { source.dispose(); throw cancelled(); }
      // Reserve an owner for every live waiter before any promise continuation
      // can cancel/dispose its lease. A sibling never sees disposed assets.
      const owner = { source, users: job.waiters, token: job.token }; job.shared = owner;
      resources.ready(job.token, measurePptxSourceBytes(source.files, source.ownedBlobs), owner.users);
      if (pendingSources.get(file) === job) pendingSources.delete(file);
      readySources.set(file, owner); return owner;
    }).finally(() => { if (pendingSources.get(file) === job) pendingSources.delete(file); if (!job.shared) resources.remove(job.token); });
    pending = job;
  }
  const job = pending; job.waiters++;
  const result = await new Promise<ReturnType<typeof lease>>((resolve, reject) => {
    let settled = false;
    const abort = () => {
      if (settled) return; settled = true; signal.removeEventListener('abort', abort); job.waiters--;
      if (job.shared) release(file, job.shared);
      else if (!job.waiters) { if (pendingSources.get(file) === job) pendingSources.delete(file); resources.stage(job.token, 'cancelling'); job.controller.abort(); }
      reject(cancelled());
    };
    signal.addEventListener('abort', abort, { once: true });
    job.promise.then(owner => {
      if (settled) return;
      if (signal.aborted) { abort(); return; }
      settled = true; signal.removeEventListener('abort', abort); resolve(lease(file, owner));
    }, error => { if (!settled) { settled = true; signal.removeEventListener('abort', abort); reject(error); } });
    if (signal.aborted) abort();
  });
  if (signal.aborted) { result.dispose(); throw cancelled(); }
  return result;
}
