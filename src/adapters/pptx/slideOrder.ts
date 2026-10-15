import { resolveInternalTarget } from './relationshipTargets';
import { PPTX_LIMITS } from './packageGuard';

const presentationNamespace = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const relationshipNamespace = 'http://schemas.openxmlformats.org/package/2006/relationships';
const officeRelationshipNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
export const PPTX_MAX_SLIDES = 2000;

export function readPptxSlideOrder(files: Record<string, Uint8Array>): string[] {
  const fail = (): never => { throw new Error('PPTX_INVALID_SLIDE_ORDER'); };
  const parse = (name: string, rootName: string, namespace: string) => {
    const bytes = files[name];
    if (!bytes?.length || bytes.length > PPTX_LIMITS.xml) return fail();
    let text: string;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { return fail(); }
    if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length || xml.documentElement.localName !== rootName || xml.documentElement.namespaceURI !== namespace) return fail();
    return xml.documentElement;
  };
  const presentation = parse('ppt/presentation.xml', 'presentation', presentationNamespace);
  const lists = [...presentation.children].filter(node => node.localName === 'sldIdLst' && node.namespaceURI === presentationNamespace);
  if (lists.length !== 1 || presentation.getElementsByTagNameNS(presentationNamespace, 'sldIdLst').length !== 1) return fail();
  const slides = [...lists[0]!.children];
  if (!slides.length || slides.length > PPTX_MAX_SLIDES) return fail();
  const relationships = parse('ppt/_rels/presentation.xml.rels', 'Relationships', relationshipNamespace);
  const references = new Map<string, Element>();
  for (const node of relationships.children) {
    const id = node.getAttribute('Id');
    if (node.namespaceURI !== relationshipNamespace || node.localName !== 'Relationship' || !id || references.has(id) || node.children.length) return fail();
    references.set(id, node);
  }
  const ids = new Set<number>(), links = new Set<string>(), parts = new Set<string>();
  return slides.map(node => {
    const id = node.getAttribute('id'), link = node.getAttributeNS(officeRelationshipNamespace, 'id');
    const number = id && /^\d+$/.test(id) ? Number(id) : NaN;
    if (node.namespaceURI !== presentationNamespace || node.localName !== 'sldId' || !Number.isSafeInteger(number) || number < 256 || number > 2147483647 || ids.has(number) || !link || link.length > 200 || links.has(link)) return fail();
    const reference = references.get(link);
    if (!reference || reference.getAttribute('Type') !== `${officeRelationshipNamespace}/slide` || reference.getAttribute('TargetMode') !== null && reference.getAttribute('TargetMode') !== 'Internal') return fail();
    const target = reference.getAttribute('Target');
    if (!target || target.includes('#')) return fail();
    let part: string;
    try { part = resolveInternalTarget('ppt/presentation.xml', target); } catch { return fail(); }
    if (!/^ppt\/slides\/[^/]+\.xml$/.test(part) || parts.has(part)) return fail();
    parse(part, 'sld', presentationNamespace);
    ids.add(number); links.add(link); parts.add(part);
    return part;
  });
}
