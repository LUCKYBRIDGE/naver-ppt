import { resolveInternalTarget } from './relationshipTargets';

const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const r = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
const fail = (): never => { throw Error('PPTX_LOCAL_MEDIA_PART_UNVERIFIED'); };
const children = (node: Element, ns: string, tag: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === tag);

// External compatibility targets are never read. Only the explicit, internal
// p14 relationship can supply local bytes in that case.
export function resolvePptxLocalMediaPart(nv: Element, relationships: ReadonlyMap<string, Element>, sourcePart: string, kind: 'audio' | 'video') {
  const files = children(nv, a, kind === 'audio' ? 'audioFile' : 'videoFile');
  if (files.length !== 1 || children(nv, a, kind === 'audio' ? 'videoFile' : 'audioFile').length) return fail();
  const primaryId = files[0]!.getAttributeNS(r, 'link'), primary = primaryId ? relationships.get(primaryId) : undefined;
  if (!primary || primary.namespaceURI !== pkg || primary.children.length || primary.getAttribute('Type') !== `${r}/${kind}`) return fail();
  const mode = primary.getAttribute('TargetMode');
  if (![null, 'Internal', 'External'].includes(mode)) return fail();
  const embedded = [...nv.getElementsByTagNameNS(p14, 'media')];
  if (embedded.length > 1) return fail();
  let local: string | undefined;
  if (embedded.length) {
    const ext = embedded[0]!, parent = ext.parentElement, list = parent?.parentElement;
    if (parent?.namespaceURI !== p || parent.localName !== 'ext' || list?.namespaceURI !== p || list.localName !== 'extLst' || list.parentElement !== nv) return fail();
    const id = ext.getAttributeNS(r, 'embed'), relation = id ? relationships.get(id) : undefined;
    if (!relation || relation.namespaceURI !== pkg || relation.children.length
      || relation.getAttribute('Type') !== 'http://schemas.microsoft.com/office/2007/relationships/media'
      || ![null, 'Internal'].includes(relation.getAttribute('TargetMode'))) return fail();
    const target = relation.getAttribute('Target'); if (!target || target.includes('#')) return fail();
    local = resolveInternalTarget(sourcePart, target);
  }
  if (mode === 'External') return local ?? fail();
  const target = primary.getAttribute('Target'); if (!target || target.includes('#')) return fail();
  const direct = resolveInternalTarget(sourcePart, target);
  if (local && local !== direct) return fail();
  return direct;
}
