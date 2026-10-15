import type { Presentation, SlideElement } from '@web-ppt/core';
import { resolvePptxLocalMediaPart } from './localMediaPart';
import { matchesPptxMediaHeader } from './contentTypes';
import { PPTX_LIMITS, pptxPartByteLimit } from './packageGuard';

const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const pkg = 'http://schemas.openxmlformats.org/package/2006/relationships';
const formats = { mp3: ['audio', 'audio/mpeg'], wav: ['audio', 'audio/wav'], mp4: ['video', 'video/mp4'], webm: ['video', 'video/webm'] } as const;
const fail = (): never => { throw Error('PPTX_EMBEDDED_RECOVERY_UNVERIFIED'); };
const children = (node: Element, ns: string, tag: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === tag);
const one = (node: Element, ns: string, tag: string) => { const values = children(node, ns, tag); return values.length === 1 ? values[0]! : fail(); };

// Call after package/content-type/order guards and model hydration. Recover only
// missing media, never replace an existing renderer asset or access external URLs.
export function recoverPptxEmbeddedMedia(source: { model: Presentation; parts: readonly string[]; files: Record<string, Uint8Array>; addOwnedAsset(blob: Blob): string }, signal: AbortSignal) {
  if (source.model.slides.length !== source.parts.length) return fail();
  const cached = new Map<string, { src: string; mime: string }>();
  const summary = { recovered: 0, unresolved: 0, uniqueBytes: 0 };
  const cancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  const parse = (part: string, root: string, ns: string) => {
    const bytes = source.files[part]; if (!bytes?.length || bytes.length > PPTX_LIMITS.xml) return fail();
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length || xml.documentElement.namespaceURI !== ns || xml.documentElement.localName !== root) return fail();
    return xml.documentElement;
  };
  for (let index = 0; index < source.parts.length; index++) {
    cancelled(); const elements: SlideElement[] = [];
    const visit = (list: SlideElement[]) => { for (const element of list) { elements.push(element); if (element.kind === 'group') visit(element.children); } };
    visit(source.model.slides[index]!.elements);
    const missing = elements.filter(element => element.kind === 'image' && element.media && !element.media.src);
    if (!missing.length) continue;
    const sourcePart = source.parts[index]!;
    let xml: Element, relationships: Map<string, Element>;
    try {
      xml = parse(sourcePart, 'sld', p);
      const root = parse(sourcePart.replace(/\/([^/]+)$/, '/_rels/$1.rels'), 'Relationships', pkg);
      relationships = new Map();
      for (const relation of root.children) {
        const id = relation.getAttribute('Id');
        if (!id || relation.namespaceURI !== pkg || relation.localName !== 'Relationship' || relationships.has(id)) return fail();
        relationships.set(id, relation);
      }
    } catch { cancelled(); summary.unresolved += missing.length; continue; }
    for (const element of missing) {
      cancelled();
      try {
        if (element.kind !== 'image' || !element.media || !Number.isSafeInteger(element.id) || !element.id || elements.filter(value => value.id === element.id).length !== 1) return fail();
        const pics = [...xml.getElementsByTagNameNS(p, 'pic')].filter(pic => Number(one(one(pic, p, 'nvPicPr'), p, 'cNvPr').getAttribute('id')) === element.id);
        if (pics.length !== 1) return fail();
        const part = resolvePptxLocalMediaPart(one(one(pics[0]!, p, 'nvPicPr'), p, 'nvPr'), relationships, sourcePart, element.media.kind);
        if (!/^ppt\/media\/[^/]+\.(mp3|wav|mp4|webm)$/i.test(part)) return fail();
        const extension = part.split('.').at(-1)!.toLowerCase() as keyof typeof formats;
        const [kind, mime] = formats[extension], bytes = source.files[part];
        if (element.media.kind !== kind || element.media.mime !== mime || !bytes?.length || bytes.length > pptxPartByteLimit(part) || !matchesPptxMediaHeader(extension, bytes)) return fail();
        let owned = cached.get(part);
        if (!owned) {
          const src = source.addOwnedAsset(new Blob([bytes as Uint8Array<ArrayBuffer>], { type: mime }));
          owned = { src, mime }; cached.set(part, owned); summary.uniqueBytes += bytes.length;
        }
        if (owned.mime !== mime) return fail();
        element.media.src = owned.src; element.media.external = false; summary.recovered++;
      } catch { cancelled(); summary.unresolved++; }
    }
  }
  cancelled(); return summary;
}
