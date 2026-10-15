const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const children = (node: Element, name: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === name);
const events = ['onBegin', 'onEnd', 'begin', 'end', 'onClick', 'onDblClick', 'onMouseOver', 'onMouseOut', 'onNext', 'onPrev', 'onStopAudio'] as const;
const types = ['tmRoot', 'mainSeq', 'interactiveSeq', 'clickEffect', 'withEffect', 'afterEffect', 'clickPar', 'withGroup', 'afterGroup'] as const;
export type PptxTimeValue = number | 'indefinite' | null;
export interface PptxTimeCondition { event: typeof events[number] | 'unknown' | null; delayMs: PptxTimeValue;
  reference: { kind: 'time' | 'shape' | 'slide' | 'unknown'; id: number | null } | null }
export interface PptxTimeNode { id: number | null; parentId: number | null; nodeType: typeof types[number] | 'unknown' | null;
  durationMs: PptxTimeValue; repeatCount: PptxTimeValue; repeatDurationMs: PptxTimeValue; autoReverse: boolean | null;
  start: PptxTimeCondition[]; end: PptxTimeCondition[]; unverified: boolean }

// Preserve condition references and parent timing; never flatten to one click.
// Values outside the bounded vocabulary stay unverified rather than becoming defaults.
export function readPptxTimeNode(node: Element): PptxTimeNode {
  let unverified = node.namespaceURI !== ns || node.localName !== 'cTn';
  const uint = (raw: string | null, positive = false) => {
    if (raw === null) return null;
    if (!/^\d+$/.test(raw) || Number(raw) > 4294967295 || positive && Number(raw) === 0) { unverified = true; return null; }
    return Number(raw);
  };
  const time = (raw: string | null): PptxTimeValue => raw === 'indefinite' ? raw : uint(raw);
  const conditions = (name: string): PptxTimeCondition[] => {
    const lists = children(node, name);
    if (lists.length > 1 || lists.some(list => !list.children.length)) unverified = true;
    return lists.flatMap(list => [...list.children].map(condition => {
      if (condition.namespaceURI !== ns || condition.localName !== 'cond') unverified = true;
      const rawEvent = condition.getAttribute('evt');
      const event: PptxTimeCondition['event'] = rawEvent === null ? null : events.includes(rawEvent as typeof events[number]) ? rawEvent as typeof events[number] : 'unknown';
      if (event === 'unknown') unverified = true;
      let reference: PptxTimeCondition['reference'] = null;
      if (condition.children.length) {
        if (condition.children.length !== 1) unverified = true;
        const child = condition.children[0]!;
        if (child.namespaceURI === ns && child.localName === 'tn' && !child.children.length) reference = { kind: 'time', id: uint(child.getAttribute('val'), true) };
        else if (child.namespaceURI === ns && child.localName === 'tgtEl' && child.children.length === 1) {
          const target = child.children[0]!;
          if (target.namespaceURI === ns && target.localName === 'spTgt' && !target.children.length) reference = { kind: 'shape', id: uint(target.getAttribute('spid'), true) };
          else if (target.namespaceURI === ns && target.localName === 'sldTgt' && !target.children.length) reference = { kind: 'slide', id: null };
        }
        if (!reference) { reference = { kind: 'unknown', id: null }; unverified = true; }
        if (reference.kind !== 'slide' && reference.id === null) unverified = true;
      }
      return { event, delayMs: time(condition.getAttribute('delay')), reference };
    }));
  };
  let parentId: number | null = null, depth = 0;
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (++depth > 128) { unverified = true; break; }
    if (parent.namespaceURI === ns && parent.localName === 'cTn') { parentId = uint(parent.getAttribute('id'), true); break; }
  }
  const rawType = node.getAttribute('nodeType'), rawReverse = node.getAttribute('autoRev');
  const nodeType: PptxTimeNode['nodeType'] = rawType === null ? null : types.includes(rawType as typeof types[number]) ? rawType as typeof types[number] : 'unknown';
  if (nodeType === 'unknown' || rawReverse !== null && !['0', '1', 'true', 'false'].includes(rawReverse)) unverified = true;
  if (['spd', 'speed', 'tmFilter', 'restart', 'syncBehavior'].some(key => node.hasAttribute(key))
    || ['accel', 'decel'].some(key => node.hasAttribute(key) && !['0', '0%'].includes(node.getAttribute(key)!))
    || children(node, 'iterate').length) unverified = true;
  const result = { id: uint(node.getAttribute('id'), true), parentId, nodeType, durationMs: time(node.getAttribute('dur')),
    repeatCount: time(node.getAttribute('repeatCount')), repeatDurationMs: time(node.getAttribute('repeatDur')),
    autoReverse: rawReverse === null ? null : rawReverse === '1' || rawReverse === 'true', start: conditions('stCondLst'), end: conditions('endCondLst') };
  if (typeof result.repeatCount === 'number') result.repeatCount /= 1000;
  if (result.id === null) unverified = true;
  return { ...result, unverified };
}
