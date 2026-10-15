import { readPptxMediaTiming } from './mediaTiming';
import { readPptxTimeNode } from './mediaTimeNode';

const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const fail = (): never => { throw Error('PPTX_MEDIA_TIMELINE_CONTROLS_UNVERIFIED'); };
const children = (node: Element, name: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === name);
const only = (node: Element, name: string) => { const found = children(node, name); return found.length === 1 ? found[0]! : fail(); };
const attributes = (node: Element, allowed: readonly string[]) => {
  if ([...node.attributes].some(attr => attr.namespaceURI || !allowed.includes(attr.name))) fail();
};
const childNames = (node: Element, allowed: readonly string[]) => {
  if ([...node.children].some(child => child.namespaceURI !== ns || !allowed.includes(child.localName))) fail();
};
const unconditionalStart = (node: Element, delay: string) => {
  const list = only(node, 'stCondLst'); attributes(list, []);
  const condition = only(list, 'cond');
  if (list.children.length !== 1 || condition.children.length || condition.getAttribute('delay') !== delay) fail();
  attributes(condition, ['delay']);
};

// This is a global-control gate, not permission to execute a whole timeline.
// Media settings, exact source group mapping and local delays remain separate.
export function readPptxMediaTimelineControls(xml: Document, signal?: AbortSignal) {
  const detail = readPptxMediaTiming(xml, signal);
  if (xml.documentElement.namespaceURI !== ns || xml.documentElement.localName !== 'sld'
    || detail.summary.invalidNodes || detail.summary.unresolvedTargets || detail.summary.nonShapeTargets) return fail();
  const timing = only(xml.documentElement, 'timing'); childNames(timing, ['tnLst']); attributes(timing, []);
  const list = only(timing, 'tnLst'); attributes(list, []);
  const parallel = only(list, 'par'); attributes(parallel, []);
  if (list.children.length !== 1 || parallel.children.length !== 1) return fail();
  const root = only(parallel, 'cTn');
  const validateContainer = (node: Element, type: 'tmRoot' | 'mainSeq') => {
    attributes(node, ['id', 'nodeType', 'dur', ...(type === 'tmRoot' ? ['restart'] : [])]);
    childNames(node, ['stCondLst', 'childTnLst']);
    const time = readPptxTimeNode(node);
    if (time.id === null || time.nodeType !== type || time.durationMs !== 'indefinite'
      || node.hasAttribute('restart') && node.getAttribute('restart') !== 'never') fail();
    unconditionalStart(node, '0');
    return time.id!;
  };
  const rootTimingId = validateContainer(root, 'tmRoot'), rootChildren = only(root, 'childTnLst'); attributes(rootChildren, []);
  childNames(rootChildren, ['seq', 'audio', 'video']);
  const sequence = only(rootChildren, 'seq'); attributes(sequence, ['concurrent', 'nextAc', 'prevAc']);
  childNames(sequence, ['cTn', 'nextCondLst']);
  // Missing values have the standard's disabled/none defaults. Malformed
  // lexical booleans must never silently inherit those defaults.
  if (![null, '0', 'false'].includes(sequence.getAttribute('concurrent'))
    || ![null, 'none'].includes(sequence.getAttribute('nextAc'))
    || ![null, 'none'].includes(sequence.getAttribute('prevAc'))) return fail();
  const main = only(sequence, 'cTn'), mainTimingId = validateContainer(main, 'mainSeq');
  const nextList = only(sequence, 'nextCondLst'); attributes(nextList, []);
  const next = only(nextList, 'cond'); attributes(next, ['evt', 'delay']);
  if (nextList.children.length !== 1 || next.getAttribute('evt') !== 'onNext' || next.getAttribute('delay') !== '0' || next.children.length !== 1) return fail();
  const target = only(next, 'tgtEl'); attributes(target, []);
  const slide = only(target, 'sldTgt'); attributes(slide, []);
  if (target.children.length !== 1 || slide.children.length) return fail();
  const groups = only(main, 'childTnLst'); attributes(groups, []); childNames(groups, ['par']);
  if (!groups.children.length || groups.children.length > 5000) return fail();
  const groupTimingIds = [...groups.children].map(group => {
    attributes(group, []); if (group.children.length !== 1) return fail();
    const time = readPptxTimeNode(only(group, 'cTn'));
    if (time.id === null || time.nodeType !== 'clickEffect') return fail();
    return time.id;
  });
  const declarationTimingIds = [...rootChildren.children].filter(node => node !== sequence).map(media => {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const common = only(media, 'cMediaNode'), time = only(common, 'cTn');
    attributes(time, ['id', 'dur']); childNames(time, ['stCondLst']);
    const context = readPptxTimeNode(time);
    if (context.unverified || context.id === null || context.durationMs !== 'indefinite') return fail();
    unconditionalStart(time, 'indefinite');
    return context.id;
  });
  if (xml.documentElement.getElementsByTagNameNS(ns, 'seq').length !== 1) return fail();
  return { rootTimingId, mainTimingId, groupTimingIds, declarationTimingIds,
    concurrent: false as const, nextAction: 'none' as const, previousAction: 'none' as const,
    controlsVerified: true as const, executionVerified: false as const };
}
