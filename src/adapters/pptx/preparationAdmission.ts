export const PPTX_PREPARATION_LOCK = 'naver-ppt-pptx-preparation-v1';

// Origin-wide preparation only; completed sources and playback keep their leases.
// Aborting an admitted job never releases its slot before its work settles.
export async function withPptxPreparation<T>(signal: AbortSignal | undefined, work: () => Promise<T>, locks: Pick<LockManager, 'request'> | undefined = globalThis.navigator?.locks): Promise<T> {
  const check = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  check();
  if (!locks) throw Error('PPTX_PREPARATION_LOCK_UNAVAILABLE');
  return locks.request(PPTX_PREPARATION_LOCK, { mode: 'exclusive', ...(signal ? { signal } : {}) }, async lock => {
    check(); if (!lock) throw Error('PPTX_PREPARATION_LOCK_UNAVAILABLE');
    return work();
  });
}
