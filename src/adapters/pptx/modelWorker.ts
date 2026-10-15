import { inspectPptxWorkerEnvelope } from './workerEnvelope';
import { inspectPptxModel } from './modelInspection';
import { PPTX_LIMITS } from './packageGuard';

// Dynamic loading preserves the pinned package's Worker initializer.
await import('@web-ppt/core/worker');
const parser = self.onmessage, send = self.postMessage.bind(self) as (message: unknown, transfer?: Transferable[]) => void;
let preview = false;
self.postMessage = (result: unknown) => {
  const data = result as { id?: unknown; ok?: unknown; presentation?: unknown };
  try {
    inspectPptxWorkerEnvelope(result);
    const summary = inspectPptxModel(data.presentation);
    if (preview) {
      const assets = (result as { assets: { data: ArrayBuffer }[] }).assets;
      send(result, assets.map(asset => asset.data)); return;
    }
    // No document text, links, asset bytes or Blob URLs leave this diagnostic job.
    send({ id: data.id, ok: true, summary });
  } catch { send({ id: data?.id, ok: false, code: 'PPTX_MODEL_FAILED' }); }
};
self.onmessage = event => {
  const data = event.data;
  if (data?.id !== 1 || !(data.bytes instanceof ArrayBuffer) || !data.bytes.byteLength || data.bytes.byteLength > PPTX_LIMITS.input || !parser) {
    send({ id: 1, ok: false, code: 'PPTX_MODEL_INPUT_LIMIT' }); return;
  }
  preview = data.mode === 'presentation';
  try { parser.call(self, event); }
  catch { send({ id: 1, ok: false, code: 'PPTX_MODEL_FAILED' }); }
};
send({ ready: true });
