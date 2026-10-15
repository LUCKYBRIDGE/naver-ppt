import { readPptxTimeNode, type PptxTimeNode } from './mediaTimeNode';
import { parsePptxMediaAction } from '../../core/pptxMediaAction';
const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
export const emptyPptxMediaTiming = () => ({ audioNodes: 0, videoNodes: 0, commands: 0, recognizedCalls: 0, otherCommands: 0,
  invalidNodes: 0, unresolvedTargets: 0, nonShapeTargets: 0, conditionalNodes: 0, settingsNodes: 0, crossSlideNodes: 0,
  repeatNodes: 0, reverseNodes: 0, endConditionNodes: 0, interactiveNodes: 0, trimNodes: 0, unverifiedTimingNodes: 0 });
export type PptxMediaTimingSummary = ReturnType<typeof emptyPptxMediaTiming>;
export function isPptxMediaTimingSummary(value: unknown): value is PptxMediaTimingSummary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const expected = Object.keys(emptyPptxMediaTiming()), record = value as Record<string, unknown>;
  return Object.keys(record).length === expected.length && expected.every(key => Object.hasOwn(record, key)
    && typeof record[key] === 'number' && Number.isSafeInteger(record[key]) && record[key] >= 0 && record[key] <= 100000)
    && Number(record.recognizedCalls) + Number(record.otherCommands) === record.commands;
}
export function recognizedPptxMediaCall(type: string | null, command: string | null) {
  return parsePptxMediaAction(type, command) !== null;
}
const children = (node: Element, name: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === name);
const id = (raw: string | null) => raw !== null && /^\d+$/.test(raw) && Number(raw) > 0 && Number(raw) <= 4294967295 ? Number(raw) : null;

// Counts only. Recognizing a vocabulary entry does not authorize its execution.
export interface PptxMediaTimingTarget { node: 'audio' | 'video' | 'cmd'; shapeId: number; timingId: number }
export function readPptxMediaTiming(xml: Document, signal?: AbortSignal) {
  const targets: PptxMediaTimingTarget[] = [];
  const timeNodes: PptxTimeNode[] = [];
  const summary = emptyPptxMediaTiming(), shapes = new Map<number, number>(), nodes: { node: Element; timing: boolean }[] = [];
  const stack: { node: Element; depth: number; timing: boolean }[] = [{ node: xml.documentElement, depth: 0, timing: false }];
  while (stack.length) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const value = stack.pop()!;
    if (nodes.length >= 100000 || value.depth > 128) throw Error('PPTX_MEDIA_TIMING_LIMIT');
    const timing = value.timing || value.node.namespaceURI === ns && value.node.localName === 'timing';
    nodes.push({ node: value.node, timing });
    if (value.node.namespaceURI === ns && value.node.localName === 'cNvPr') {
      const target = id(value.node.getAttribute('id'));
      if (target !== null) shapes.set(target, (shapes.get(target) ?? 0) + 1);
    }
    for (const child of [...value.node.children].reverse()) stack.push({ node: child, depth: value.depth + 1, timing });
  }
  const times = new Set<number>(), mediaTargets = new Map<number, number>(), commandTargets: number[] = [];
  const target = (parent: Element) => {
    const targets = children(parent, 'tgtEl');
    if (targets.length !== 1 || targets[0]!.children.length !== 1) { summary.invalidNodes++; return null; }
    const shape = children(targets[0]!, 'spTgt');
    if (shape.length !== 1 || shape[0]!.children.length) { summary.nonShapeTargets++; return null; }
    const number = id(shape[0]!.getAttribute('spid'));
    if (number === null || shapes.get(number) !== 1) { summary.unresolvedTargets++; return null; }
    return number;
  };
  for (const { node, timing } of nodes) {
    // Media trim belongs to the picture's p14 extension, outside p:timing.
    if (node.namespaceURI === p14 && node.localName === 'trim') {
      summary.trimNodes++;
      const values = ['st', 'end'].map(key => node.getAttribute(key));
      if (node.parentElement?.namespaceURI !== p14 || node.parentElement.localName !== 'media' || node.children.length
        || values.some(value => value !== null && (!/^\d+(?:\.\d+)?$/.test(value) || Number(value) > 86400000))) summary.unverifiedTimingNodes++;
    }
    if (!timing) continue;
    if (node.namespaceURI !== ns) {
      if (['audio', 'video', 'cmd', 'cMediaNode'].includes(node.localName)) summary.invalidNodes++;
      continue;
    }
    const name = node.localName;
    if (name === 'cTn') {
      const context = readPptxTimeNode(node); timeNodes.push(context);
      if (node.hasAttribute('repeatCount') || node.hasAttribute('repeatDur')) summary.repeatNodes++;
      if (context.autoReverse) summary.reverseNodes++;
      if (context.end.length) summary.endConditionNodes++;
      if (context.nodeType === 'interactiveSeq') summary.interactiveNodes++;
      const number = id(node.getAttribute('id'));
      if (number === null || times.has(number)) summary.invalidNodes++;
      else times.add(number);
    }
    if (name === 'cond' && (node.hasAttribute('evt') || node.children.length || node.getAttribute('delay') !== null && node.getAttribute('delay') !== '0')) summary.conditionalNodes++;
    if (name === 'audio' || name === 'video') {
      summary[name === 'audio' ? 'audioNodes' : 'videoNodes']++;
      const media = children(node, 'cMediaNode');
      if (media.length !== 1 || node.children.length !== 1) summary.invalidNodes++;
    }
    if (name === 'cMediaNode') {
      if (node.parentElement?.namespaceURI !== ns || !['audio', 'video'].includes(node.parentElement.localName)
        || children(node, 'cTn').length !== 1 || node.children.length !== 2) summary.invalidNodes++;
      const mediaTarget = target(node);
      if (mediaTarget !== null) mediaTargets.set(mediaTarget, (mediaTargets.get(mediaTarget) ?? 0) + 1);
      const timingId = id(children(node, 'cTn')[0]?.getAttribute('id') ?? null);
      const mediaKind = node.parentElement?.localName;
      if (mediaTarget !== null && timingId !== null && (mediaKind === 'audio' || mediaKind === 'video')) targets.push({ node: mediaKind, shapeId: mediaTarget, timingId });
      if (node.attributes.length) summary.settingsNodes++;
      const boolean = (key: string) => !node.hasAttribute(key) || ['0', '1', 'true', 'false'].includes(node.getAttribute(key)!);
      const volume = node.getAttribute('vol'), count = node.getAttribute('numSld');
      if (!boolean('mute') || !boolean('showWhenStopped') || volume !== null && (!/^\d+$/.test(volume) || Number(volume) > 100000)
        || count !== null && (!/^\d+$/.test(count) || Number(count) > 4294967295)) summary.invalidNodes++;
      if (count !== null && /^\d+$/.test(count) && Number(count) > 1) summary.crossSlideNodes++;
    }
    if (name === 'cmd') {
      summary.commands++;
      summary[recognizedPptxMediaCall(node.getAttribute('type'), node.getAttribute('cmd')) ? 'recognizedCalls' : 'otherCommands']++;
      const common = children(node, 'cBhvr');
      if (common.length !== 1 || node.children.length !== 1) summary.invalidNodes++;
      if (common.length === 1) {
        if (children(common[0]!, 'cTn').length !== 1) summary.invalidNodes++;
        const commandTarget = target(common[0]!); if (commandTarget !== null) commandTargets.push(commandTarget);
        const timingId = id(children(common[0]!, 'cTn')[0]?.getAttribute('id') ?? null);
        if (commandTarget !== null && timingId !== null) targets.push({ node: 'cmd', shapeId: commandTarget, timingId });
      }
    }
  }
  for (const commandTarget of commandTargets) if (mediaTargets.get(commandTarget) !== 1) summary.unresolvedTargets++;
  for (const context of timeNodes) {
    for (const condition of [...context.start, ...context.end]) {
      const ref = condition.reference;
      if (ref?.kind === 'time' && (ref.id === null || !times.has(ref.id))
        || ref?.kind === 'shape' && (ref.id === null || shapes.get(ref.id) !== 1)) context.unverified = true;
    }
    if (context.unverified) summary.unverifiedTimingNodes++;
  }
  return { summary, targets, timeNodes };
}
export function inspectPptxMediaTiming(xml: Document, signal?: AbortSignal): PptxMediaTimingSummary {
  return readPptxMediaTiming(xml, signal).summary;
}
export function pptxMediaTimingMessage(summary?: PptxMediaTimingSummary) {
  if (!summary) return '원본 미디어 타이밍을 검사하지 않았습니다. 원본 트리거 재생은 미확인입니다.';
  if (!isPptxMediaTimingSummary(summary)) throw Error('PPTX_INVALID_MEDIA_TIMING_SUMMARY');
  return `원본 타이밍의 음원 ${summary.audioNodes}개·영상 ${summary.videoNodes}개·명령 ${summary.commands}개(인식 호출 ${summary.recognizedCalls}개·기타 ${summary.otherCommands}개), 전체 조건/지연 ${summary.conditionalNodes}개입니다. 설정 ${summary.settingsNodes}개·여러 쪽 재생 ${summary.crossSlideNodes}개, 전체 반복 ${summary.repeatNodes}개·역재생 ${summary.reverseNodes}개·종료 조건 ${summary.endConditionNodes}개·상호작용 ${summary.interactiveNodes}개·미디어 자르기 ${summary.trimNodes}개·미검증 시간값 ${summary.unverifiedTimingNodes}개, 미확인 대상 ${summary.unresolvedTargets + summary.nonShapeTargets}개·구조/값 경고 ${summary.invalidNodes}개입니다. 명령을 실행하지 않았으며 미발견도 원본 미디어 부재나 재생 지원을 뜻하지 않습니다.`;
}
