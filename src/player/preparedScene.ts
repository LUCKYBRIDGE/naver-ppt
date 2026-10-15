import type { PlayerSnapshot } from '../core/playerSnapshot';

export const sceneKey = (state: PlayerSnapshot) => JSON.stringify([state.sessionId, state.selection?.documentId, state.selection?.slideId]);
export function sceneElements(root: ParentNode): Element[] {
  const result: Element[] = [];
  function visit(parent: ParentNode, depth: number) {
    if (depth > 16) throw Error('PREPARATION_NODE_LIMIT');
    for (const element of parent.querySelectorAll('*')) {
      if (result.length >= 100000) throw Error('PREPARATION_NODE_LIMIT');
      result.push(element); if (element.shadowRoot) visit(element.shadowRoot, depth + 1);
    }
  }
  visit(root, 0); return result;
}
export function sceneReadiness(root: ParentNode, state: PlayerSnapshot, active = false) {
  const all = sceneElements(root), stage = all.find(element => element.classList.contains(active ? 'pptx-audience-stage' : 'pptx-preparing-stage')) as HTMLElement | undefined;
  if (!stage || stage.dataset.preparation === 'loading') return 'waiting';
  if (stage.dataset.preparation === 'failed') return 'failed';
  const settled = active ? ['ready', 'held', 'completed', 'cancelled', 'exhausted'].includes(stage.dataset.preparation ?? '') : stage.dataset.preparation === 'ready';
  if (!settled || !stage.shadowRoot?.querySelector('[data-slide-id]')) return 'waiting';
  for (const { ref } of state.media) {
    const media = all.find(element => ['AUDIO', 'VIDEO'].includes(element.tagName) && element.parentElement?.dataset.mediaId === ref.id) as HTMLMediaElement | undefined;
    if (media?.error) return 'failed';
    if (!media || media.readyState < 2 || media.seeking) return 'waiting';
    if (!active && !media.paused) return 'failed';
  }
  return 'ready';
}
export function preparationDeadline<T>(work: Promise<T>, signal: AbortSignal, remainingMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => finish(() => reject(new DOMException('Cancelled', 'AbortError')));
    const timer = setTimeout(() => finish(() => reject(Error('PRESENTATION_PREPARATION_TIMEOUT'))), Math.max(0, remainingMs));
    function finish(deliver: () => void) { clearTimeout(timer); signal.removeEventListener('abort', abort); deliver(); }
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    work.then(value => finish(() => resolve(value)), error => finish(() => reject(error)));
  });
}
export async function waitForPreparedScene(root: ParentNode, state: PlayerSnapshot, signal: AbortSignal, active = false) {
  let imagesDone = false;
  const started = Date.now();
  while (!signal.aborted) {
    const readiness = sceneReadiness(root, state, active);
    if (readiness === 'failed' || Date.now() - started > 30000) throw Error('PRESENTATION_PREPARATION_FAILED');
    if (readiness === 'ready') {
      if (!imagesDone) {
        const images = sceneElements(root).filter(element => element.localName === 'image');
        await preparationDeadline(Promise.all(images.map(async element => { const src = (element as SVGImageElement).href?.baseVal; if (src) { const image = new Image(); image.src = src; await image.decode(); } })), signal, 30000 - (Date.now() - started));
        await preparationDeadline(document.fonts.ready, signal, 30000 - (Date.now() - started)); imagesDone = true;
        await preparationDeadline(new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))), signal, 30000 - (Date.now() - started));
      }
      if (signal.aborted) break;
      if (sceneReadiness(root, state, active) === 'ready') return;
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new DOMException('Cancelled', 'AbortError');
}
