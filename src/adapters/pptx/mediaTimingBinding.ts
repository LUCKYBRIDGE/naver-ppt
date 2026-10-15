import type { Presentation, SlideElement } from '@web-ppt/core';
import type { PresentationDocumentState } from '../../core/types';
import { bindPptxSlideModel } from './modelBinding';
import { preparePptxEmbeddedMedia } from './embeddedMedia';
import { readPptxMediaTiming, type PptxMediaTimingTarget } from './mediaTiming';
import { resolvePptxLocalMediaPart } from './localMediaPart';
import type { PptxMediaPartEvidence } from './largeMediaParts';
import { PPTX_LIMITS } from './packageGuard';

const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const packageNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
const fail = (): never => { throw Error('PPTX_MEDIA_TIMING_BINDING_UNVERIFIED'); };
const children = (node: Element, ns: string, tag: string) => [...node.children].filter(child => child.namespaceURI === ns && child.localName === tag);
const one = (node: Element, ns: string, tag: string) => { const list = children(node, ns, tag); return list.length === 1 ? list[0]! : fail(); };
type Source = { model: Presentation; fingerprint: string; parts: readonly string[]; files: Record<string, Uint8Array>;
  ownedUrls: ReadonlySet<string>; ownedBlobs: ReadonlyMap<string, Blob>; largeMediaParts?: ReadonlyMap<string, PptxMediaPartEvidence> };
export type BoundPptxMediaTimingTarget = PptxMediaTimingTarget & { slideId: string; sourcePart: string; sourceFingerprint: string;
  elementPath: number[]; kind: 'audio' | 'video'; mediaFingerprint: string };

// Diagnostic binding only: the returned target is not a playback instruction.
// Validate source shape, registered path and exact package bytes independently of
// the renderer's target numbering. Never fetch or store source command strings.
export async function bindPptxMediaTimingTargets(document: PresentationDocumentState, source: Source, slideId: string, signal: AbortSignal): Promise<BoundPptxMediaTimingTarget[]> {
  const cancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  cancelled();
  const entry = bindPptxSlideModel(document, source.fingerprint, source.parts, source.model).get(slideId);
  const parse = (part: string, root: string, ns: string) => {
    const bytes = source.files[part]; if (!bytes?.length || bytes.length > PPTX_LIMITS.xml) return fail();
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length || xml.documentElement.localName !== root || xml.documentElement.namespaceURI !== ns) return fail();
    return xml;
  };
  const xml = parse(entry.sourcePart, 'sld', p), timing = readPptxMediaTiming(xml, signal);
  if (timing.summary.invalidNodes || timing.summary.unresolvedTargets || timing.summary.nonShapeTargets || timing.targets.length > 5000) return fail();
  if (!timing.targets.length) return [];
  const prepared = await preparePptxEmbeddedMedia(document, source, signal, slideId); cancelled();
  const elements = new Map<number, { element: SlideElement; path: number[] }[]>();
  const visit = (list: SlideElement[], parent: number[]) => list.forEach((element, index) => {
    const path = [...parent, index];
    if (element.id !== undefined) {
      const matches = elements.get(element.id) ?? []; matches.push({ element, path }); elements.set(element.id, matches);
    }
    if (element.kind === 'group') visit(element.children, path);
  });
  visit(entry.slide.elements, []);
  const pictures = new Map<number, Element[]>();
  for (const pic of xml.getElementsByTagNameNS(p, 'pic')) {
    const nv = children(pic, p, 'nvPicPr'); if (nv.length !== 1) continue;
    for (const value of children(nv[0]!, p, 'cNvPr')) {
      const id = Number(value.getAttribute('id')), matches = pictures.get(id) ?? [];
      matches.push(pic); pictures.set(id, matches);
    }
  }
  const relPart = entry.sourcePart.replace(/\/([^/]+)$/, '/_rels/$1.rels');
  const rels = parse(relPart, 'Relationships', packageNs).documentElement;
  const relationships = new Map<string, Element>();
  for (const rel of rels.children) {
    const id = rel.getAttribute('Id');
    if (rel.namespaceURI !== packageNs || rel.localName !== 'Relationship' || rel.children.length || !id || relationships.has(id)) return fail();
    relationships.set(id, rel);
  }
  const digest = new Map<string, string>(), usedAssets = new Map<string, Blob>(), result: BoundPptxMediaTimingTarget[] = [];
  for (const target of timing.targets) {
    cancelled();
    const matches = elements.get(target.shapeId);
    if (matches?.length !== 1 || matches[0]!.element.kind !== 'image' || !matches[0]!.element.media) return fail();
    const { element, path } = matches[0]!;
    if (element.kind !== 'image' || !element.media) return fail();
    const url = element.media.src, blob = url ? source.ownedBlobs.get(url) : undefined;
    if (!url || !source.ownedUrls.has(url) || !blob) return fail();
    usedAssets.set(url, blob);
    const kind = element.media.kind;
    if (target.node !== 'cmd' && target.node !== kind) return fail();
    const found = prepared.filter(media => JSON.stringify(media.elementPath) === JSON.stringify(path));
    if (found.length !== 1 || found[0]!.input.kind !== kind) return fail();
    const pics = pictures.get(target.shapeId);
    if (pics?.length !== 1) return fail();
    const nv = one(one(pics[0]!, p, 'nvPicPr'), p, 'nvPr');
    let rawPart: string;
    try { rawPart = resolvePptxLocalMediaPart(nv, relationships, entry.sourcePart, kind); } catch { return fail(); }
    const bytes = source.files[rawPart], evidence = source.largeMediaParts?.get(rawPart);
    if (bytes ? bytes.length !== found[0]!.file.size : !evidence || evidence.size !== found[0]!.file.size || !/^[a-f0-9]{64}$/.test(evidence.fingerprint)) return fail();
    let hash = digest.get(rawPart);
    if (!hash) {
      hash = bytes ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>))].map(byte => byte.toString(16).padStart(2, '0')).join('') : evidence!.fingerprint;
      cancelled(); digest.set(rawPart, hash);
    }
    if (hash !== found[0]!.input.fingerprint) return fail();
    if (!source.ownedUrls.has(url) || source.ownedBlobs.get(url) !== blob) return fail();
    result.push({ ...target, slideId, sourcePart: entry.sourcePart, sourceFingerprint: source.fingerprint, elementPath: [...path], kind, mediaFingerprint: hash });
  }
  cancelled();
  for (const [url, blob] of usedAssets) if (!source.ownedUrls.has(url) || source.ownedBlobs.get(url) !== blob) return fail();
  return result;
}
