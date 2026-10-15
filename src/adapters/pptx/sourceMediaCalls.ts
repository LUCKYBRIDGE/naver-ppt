import { parsePptxMediaAction, type PptxMediaAction } from '../../core/pptxMediaAction';
import { readPptxMediaTiming } from './mediaTiming';
import { bindPptxMediaTimingTargets, type BoundPptxMediaTimingTarget } from './mediaTimingBinding';
import { PPTX_LIMITS } from './packageGuard';

const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const children = (node: Element, tag: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === tag);
const fail = (): never => { throw Error('PPTX_SOURCE_MEDIA_CALL_UNVERIFIED'); };
export interface PptxSourceMediaCall { timingId: number; declarationTimingId: number; target: BoundPptxMediaTimingTarget; action: PptxMediaAction }

// Internal structural binding only. A valid call still needs source conditions,
// settings and a current Player run before native execution can be authorized.
export function bindPptxSourceMediaCalls(xml: Document, bound: readonly BoundPptxMediaTimingTarget[], signal?: AbortSignal): PptxSourceMediaCall[] {
  const cancelled = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  cancelled();
  if (xml.documentElement.namespaceURI !== ns || xml.documentElement.localName !== 'sld' || bound.length > 5000) return fail();
  const timing = readPptxMediaTiming(xml, signal);
  if (timing.summary.invalidNodes || timing.summary.unresolvedTargets || timing.summary.nonShapeTargets || timing.targets.length !== bound.length) return fail();
  const keys = new Map<string, BoundPptxMediaTimingTarget>();
  for (const target of bound) {
    const key = `${target.node}/${target.timingId}/${target.shapeId}`;
    if (keys.has(key)) return fail(); keys.set(key, target);
  }
  for (const target of timing.targets) if (!keys.has(`${target.node}/${target.timingId}/${target.shapeId}`)) return fail();
  const commands = timing.targets.filter(target => target.node === 'cmd');
  if (!commands.length) return [];
  const times = [...xml.documentElement.getElementsByTagNameNS(ns, 'cTn')], roots = times.filter(node => node.getAttribute('nodeType') === 'tmRoot');
  if (roots.length !== 1 || children(roots[0]!, 'childTnLst').length !== 1) return fail();
  const root = roots[0]!, rootList = children(root, 'childTnLst')[0]!;
  const par = root.parentElement, list = par?.parentElement, container = list?.parentElement;
  if (par?.namespaceURI !== ns || par.localName !== 'par' || list?.namespaceURI !== ns || list.localName !== 'tnLst'
    || container?.namespaceURI !== ns || container.localName !== 'timing' || container.parentElement !== xml.documentElement) return fail();
  const timeMap = new Map(times.map(node => [Number(node.getAttribute('id')), node]));
  const declaration = new Map<number, BoundPptxMediaTimingTarget>();
  for (const target of timing.targets.filter(target => target.node !== 'cmd')) {
    const time = timeMap.get(target.timingId), common = time?.parentElement, media = common?.parentElement;
    if (common?.namespaceURI !== ns || common.localName !== 'cMediaNode' || media?.namespaceURI !== ns || media.localName !== target.node || media.parentElement !== rootList) continue;
    if (declaration.has(target.shapeId)) return fail();
    declaration.set(target.shapeId, keys.get(`${target.node}/${target.timingId}/${target.shapeId}`)!);
  }
  return commands.map(command => {
    cancelled();
    const target = keys.get(`cmd/${command.timingId}/${command.shapeId}`)!, declared = declaration.get(command.shapeId);
    const time = timeMap.get(command.timingId), common = time?.parentElement, node = common?.parentElement;
    if (!declared || common?.namespaceURI !== ns || common.localName !== 'cBhvr' || node?.namespaceURI !== ns || node.localName !== 'cmd'
      || [...node.attributes].some(attribute => attribute.namespaceURI || !['type', 'cmd'].includes(attribute.name))
      || target.kind !== declared.kind || target.sourceFingerprint !== declared.sourceFingerprint || target.sourcePart !== declared.sourcePart
      || target.slideId !== declared.slideId || target.mediaFingerprint !== declared.mediaFingerprint || JSON.stringify(target.elementPath) !== JSON.stringify(declared.elementPath)) return fail();
    // The command must belong to the same root, not an unrelated timing tree.
    let ancestor: Element | null = node;
    while (ancestor && ancestor !== root) ancestor = ancestor.parentElement;
    if (!ancestor) return fail();
    const action = parsePptxMediaAction(node.getAttribute('type'), node.getAttribute('cmd')); if (!action) return fail();
    return { timingId: command.timingId, declarationTimingId: declared.timingId, target: { ...target, elementPath: [...target.elementPath] }, action };
  });
}

export async function preparePptxSourceMediaCalls(document: Parameters<typeof bindPptxMediaTimingTargets>[0], source: Parameters<typeof bindPptxMediaTimingTargets>[1], slideId: string, signal: AbortSignal) {
  const bound = await bindPptxMediaTimingTargets(document, source, slideId, signal);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (!bound.length) return [];
  const part = bound[0]!.sourcePart, bytes = source.files[part];
  if (!bytes?.length || bytes.length > PPTX_LIMITS.xml) return fail();
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
  const xml = new DOMParser().parseFromString(text, 'application/xml'); if (xml.getElementsByTagName('parsererror').length) return fail();
  return bindPptxSourceMediaCalls(xml, bound, signal);
}
