import { readPptxMediaTiming } from './mediaTiming';
import { readPptxTimeNode } from './mediaTimeNode';
import type { PptxAnimationPlayback } from './animationRun';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const fail = (): never => { throw Error('PPTX_MEDIA_CALL_DELAY_UNVERIFIED'); };

// Group-local delay only. Global root/sequence controls and media settings must
// be verified separately before a source command can be executed by the Player.
export function readPptxMediaCallDelay(xml: Document, commandTimingId: number, groupTimingId: number, signal?: AbortSignal) {
  return createPptxMediaCallDelayReader(xml, signal)(commandTimingId, groupTimingId);
}

// Build one validated index for a whole preparation pass. The returned reader
// is used synchronously with the same source XML, never stored in session data.
export function createPptxMediaCallDelayReader(xml: Document, signal?: AbortSignal) {
  if (xml.documentElement.namespaceURI !== ns || xml.documentElement.localName !== 'sld') return fail();
  const detail = readPptxMediaTiming(xml, signal);
  if (detail.summary.invalidNodes || detail.summary.unresolvedTargets || detail.summary.nonShapeTargets) return fail();
  const times = [...xml.documentElement.getElementsByTagNameNS(ns, 'cTn')];
  const byId = new Map(times.map(node => [Number(node.getAttribute('id')), node]));
  const commands = new Set(detail.targets.filter(target => target.node === 'cmd').map(target => target.timingId));
  return (commandTimingId: number, groupTimingId: number) => {
  if (!commands.has(commandTimingId)) return fail();
  const node = byId.get(commandTimingId), group = byId.get(groupTimingId);
  const container = group?.parentElement, list = container?.parentElement, main = list?.parentElement;
  if (!node || !group || group === node || group.getAttribute('nodeType') !== 'clickEffect' || container?.namespaceURI !== ns || container.localName !== 'par'
    || list?.namespaceURI !== ns || list.localName !== 'childTnLst' || main?.namespaceURI !== ns || main.localName !== 'cTn' || main.getAttribute('nodeType') !== 'mainSeq') return fail();
  let delayMs = 0, reached = false;
  const timingIds: number[] = [];
  for (let current: Element | null = node; current; current = current.parentElement) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (current.namespaceURI !== ns || current.localName === 'seq') return fail();
    if (current.localName === 'cTn') {
      const context = readPptxTimeNode(current), isCommand = current === node;
      if (context.unverified || context.end.length || context.repeatDurationMs !== null || context.repeatCount !== null && context.repeatCount !== 1 || context.autoReverse
        || context.start.length !== 1 || ![null, 'withEffect', 'withGroup', 'clickPar', ...(current === group ? ['clickEffect'] : [])].includes(context.nodeType)
        || isCommand && context.durationMs !== null && context.durationMs !== 0 || !isCommand && context.durationMs !== null && context.durationMs !== 'indefinite'
        || [...current.attributes].some(attribute => attribute.namespaceURI || !['id', 'nodeType', 'dur', 'fill', 'repeatCount', 'autoRev'].includes(attribute.name))
        || [...current.children].some(child => child.namespaceURI !== ns || !['stCondLst', 'childTnLst'].includes(child.localName))) return fail();
      const condition = context.start[0]!;
      const startList = [...current.children].find(child => child.localName === 'stCondLst')!;
      if ([...startList.children[0]!.attributes].some(attribute => attribute.namespaceURI || attribute.name !== 'delay')) return fail();
      if (condition.event !== null || condition.reference !== null || typeof condition.delayMs !== 'number' || condition.delayMs > 86400000) return fail();
      delayMs += condition.delayMs; if (delayMs > 86400000 || context.id === null) return fail(); timingIds.push(context.id);
    }
    if (current === group) { reached = true; break; }
  }
  if (!reached) return fail();
  return { commandTimingId, groupTimingId, timingIds, delayMs, executionVerified: false as const };
  };
}

export function startPptxDelayedMediaAction(delayMs: number, isCurrent: () => boolean, start: () => PptxAnimationPlayback): PptxAnimationPlayback {
  if (!Number.isFinite(delayMs) || delayMs < 0 || delayMs > 86400000) return fail();
  const deadline = performance.now() + delayMs;
  let timer: ReturnType<typeof setTimeout> | undefined, owned: PptxAnimationPlayback | undefined, cancelled = false, nativeCancelled = false;
  let resolve!: () => void, reject!: (error: Error) => void;
  const finished = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  const current = () => { try { return isCurrent() === true; } catch { return false; } };
  const stop = () => { if (nativeCancelled || !owned) return; nativeCancelled = true; try { owned.cancel(); } catch { /* Still reject the command. */ } };
  const cancel = () => { if (cancelled) return; cancelled = true; if (timer !== undefined) clearTimeout(timer); stop(); reject(Error('PPTX_MEDIA_DELAY_CANCELLED')); };
  const fire = () => {
    if (cancelled) return;
    if (!current()) { cancel(); return; }
    const remaining = deadline - performance.now();
    if (remaining > 0) { timer = setTimeout(fire, Math.min(remaining, 2147483647)); return; }
    try {
      owned = start();
      owned.finished.then(() => { if (cancelled || !current()) cancel(); else resolve(); }, () => { stop(); reject(Error('PPTX_MEDIA_DELAY_FAILED')); });
      if (cancelled) stop();
    } catch { stop(); reject(Error('PPTX_MEDIA_DELAY_FAILED')); }
  };
  fire();
  return { finished, cancel };
}
