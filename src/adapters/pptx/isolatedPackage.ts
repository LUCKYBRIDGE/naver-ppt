import { PPTX_LIMITS, pptxPartByteLimit, type readPptxPackage } from './packageGuard';

type PackageResult = ReturnType<typeof readPptxPackage>;
type PackageWorker = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;
export const PPTX_ZIP_TIMEOUT_MS = 15000;
function createPackageWorker(): PackageWorker {
  return new Worker(new URL('./packageWorker.ts', import.meta.url), { type: 'module' });
}

function isPackageResult(value: unknown): value is PackageResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as PackageResult;
  if (!result.files || typeof result.files !== 'object' || !Number.isSafeInteger(result.entryCount) || result.entryCount < 2 || result.entryCount > PPTX_LIMITS.entries || !Number.isSafeInteger(result.expandedBytes) || result.expandedBytes < 0 || result.expandedBytes > PPTX_LIMITS.expanded) return false;
  const entries = Object.entries(result.files);
  let size = 0;
  for (const [name, bytes] of entries) {
    if (!(bytes instanceof Uint8Array) || bytes.length > pptxPartByteLimit(name)) return false;
    size += bytes.length;
  }
  return entries.length === result.entryCount && size === result.expandedBytes && Object.hasOwn(result.files, '[Content_Types].xml') && Object.hasOwn(result.files, 'ppt/presentation.xml');
}

export async function readPptxPackageIsolated(bytes: Uint8Array, options: { signal?: AbortSignal; timeoutMs?: number; workerFactory?: () => PackageWorker } = {}): Promise<PackageResult> {
  if (!bytes.length || bytes.length > PPTX_LIMITS.input) throw new Error('PPTX_INPUT_LIMIT');
  const timeout = options.timeoutMs ?? PPTX_ZIP_TIMEOUT_MS;
  if (!Number.isFinite(timeout) || timeout < 1 || timeout > PPTX_ZIP_TIMEOUT_MS) throw new Error('PPTX_INVALID_TIMEOUT');
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const worker = (options.workerFactory ?? createPackageWorker)();
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error: Error | null, result?: PackageResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
      worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null;
      worker.terminate();
      if (error) reject(error); else resolve(result!);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = setTimeout(() => finish(new Error('PPTX_ZIP_TIMEOUT')), timeout);
    worker.onmessage = event => {
      const data = event.data as { ok?: unknown; result?: unknown; code?: unknown } | null;
      if (data?.ok === true && isPackageResult(data.result)) finish(null, data.result);
      else finish(new Error(data?.ok === false && typeof data.code === 'string' && /^PPTX_[A-Z_]+$/.test(data.code) ? data.code : 'PPTX_INVALID_WORKER_RESULT'));
    };
    worker.onerror = () => finish(new Error('PPTX_WORKER_ERROR'));
    worker.onmessageerror = () => finish(new Error('PPTX_WORKER_MESSAGE_ERROR'));
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) { abort(); return; }
    try {
      // Preserve the caller's original bytes; only this copy is detached by transfer.
      const input = bytes.slice();
      worker.postMessage(input, [input.buffer]);
    } catch {
      finish(new Error('PPTX_WORKER_SEND_ERROR'));
    }
  });
}
