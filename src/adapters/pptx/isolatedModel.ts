import { PPTX_LIMITS } from './packageGuard';
import type { inspectPptxModel } from './modelInspection';

type Summary = ReturnType<typeof inspectPptxModel>;
type ModelWorker = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;
export type PptxParserJobOptions = { signal?: AbortSignal; timeoutMs?: number; workerFactory?: () => ModelWorker; consumeInput?: boolean };
export const PPTX_MODEL_TIMEOUT_MS = 15000;
const fields: (keyof Summary)[] = ['slides', 'elements', 'unsupported', 'unknownKinds', 'media', 'animationSlides', 'animationSteps', 'transitions', 'hiddenSlides'];
function validSummary(value: unknown): value is Summary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const summary = value as Summary;
  return Object.keys(summary).length === fields.length && fields.every(key => Number.isSafeInteger(summary[key]) && summary[key] >= 0 && summary[key] <= 100000)
    && summary.slides >= 1 && summary.slides <= 1000 && summary.animationSlides <= summary.slides && summary.transitions <= summary.slides && summary.hiddenSlides <= summary.slides
    && summary.animationSlides <= summary.animationSteps && summary.unsupported + summary.unknownKinds <= summary.elements && summary.media <= summary.elements;
}

// Call only after the package/XML/order guards, never as a substitute for them.
export function inspectPptxModelIsolated(bytes: Uint8Array, options: PptxParserJobOptions = {}): Promise<Summary> {
  return runPptxParserJob(bytes, options, 'summary', data => {
    const summary = (data as { summary?: unknown }).summary;
    if (!validSummary(summary)) throw Error('PPTX_MODEL_FAILED');
    return { ...summary };
  });
}

export async function runPptxParserJob<T>(bytes: Uint8Array, options: PptxParserJobOptions, mode: 'summary' | 'presentation', decode: (data: unknown) => T): Promise<T> {
  if (!bytes.length || bytes.length > PPTX_LIMITS.input) throw Error('PPTX_MODEL_INPUT_LIMIT');
  const timeout = options.timeoutMs ?? PPTX_MODEL_TIMEOUT_MS;
  if (!Number.isFinite(timeout) || timeout < 1 || timeout > PPTX_MODEL_TIMEOUT_MS) throw Error('PPTX_MODEL_INVALID_TIMEOUT');
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const worker = options.workerFactory?.() ?? new Worker(new URL('./modelWorker.ts', import.meta.url), { type: 'module' });
  return new Promise((resolve, reject) => {
    let settled = false, sent = false;
    const finish = (error: Error | null, result?: T) => {
      if (settled) return;
      settled = true; clearTimeout(timer); options.signal?.removeEventListener('abort', abort);
      worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; worker.terminate();
      if (error) reject(error); else resolve(result!);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(Error('PPTX_MODEL_TIMEOUT')), timeout);
    worker.onmessage = event => {
      const data = event.data;
      if (settled) return;
      if (data?.ready === true && !sent) {
        sent = true;
        try {
          const copy = options.consumeInput && bytes.buffer instanceof ArrayBuffer && bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes : bytes.slice();
          worker.postMessage({ id: 1, mode, bytes: copy.buffer }, [copy.buffer]);
        }
        catch { finish(Error('PPTX_MODEL_SEND_ERROR')); }
        return;
      }
      if (sent && data?.id === 1 && data.ok === true) {
        try { finish(null, decode(data)); } catch { finish(Error('PPTX_MODEL_FAILED')); }
      } else finish(Error('PPTX_MODEL_FAILED'));
    };
    worker.onerror = () => finish(Error('PPTX_MODEL_WORKER_ERROR'));
    worker.onmessageerror = () => finish(Error('PPTX_MODEL_MESSAGE_ERROR'));
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) { abort(); return; }
  });
}
