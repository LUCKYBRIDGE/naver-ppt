import { unzipSync, type UnzipFileInfo } from 'fflate';
import { isUnsafeExternalTarget, relationshipSource, resolveInternalTarget } from './relationshipTargets';
import { inspectContentTypes, type ContentTypeDeclaration } from './contentTypes';
import { emptyPptxMediaTiming, inspectPptxMediaTiming, isPptxMediaTimingSummary } from './mediaTiming';
import { createPptxFontMetadata, type PptxFontMetadata } from './fontMetadata';

export const PPTX_LIMITS = { input: 128 * 1024 * 1024, entries: 4000, entry: 32 * 1024 * 1024, mediaEntry: 64 * 1024 * 1024, xml: 4 * 1024 * 1024, expanded: 256 * 1024 * 1024, ratio: 1000 } as const;
export function pptxPartByteLimit(name: string): number {
  if (/\.(xml|rels)$/i.test(name)) return PPTX_LIMITS.xml;
  return /^ppt\/media\/[^/]+\.(mp3|wav|mp4|webm)$/i.test(name) ? PPTX_LIMITS.mediaEntry : PPTX_LIMITS.entry;
}
export function readPptxPackage(bytes: Uint8Array, signal?: AbortSignal) {
  if (!bytes.length || bytes.length > PPTX_LIMITS.input) throw new Error('PPTX_INPUT_LIMIT');
  const names = new Set<string>(), entries: UnzipFileInfo[] = [];
  let expandedBytes = 0;
  const checkAbort = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  checkAbort();
  // A metadata-only pass checks the entire directory before allocating output.
  unzipSync(bytes, { filter(entry) {
    checkAbort();
    const name = entry.name, key = name.toLowerCase();
    if (!name || name.length > 512 || /[\\\x00-\x1f:%?#]/.test(name) || name.startsWith('/') || ['__proto__', 'constructor', 'prototype'].includes(key) || name.split('/').some(part => part === '.' || part === '..' || part === '' && !name.endsWith('/')) || names.has(key)) throw new Error('PPTX_UNSAFE_ENTRY');
    if (name.split('/').slice(0, -1).some(part => !part)) throw new Error('PPTX_UNSAFE_ENTRY');
    if (entry.compression !== 0 && entry.compression !== 8) throw new Error('PPTX_COMPRESSION_UNSUPPORTED');
    if (![entry.size, entry.originalSize].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('PPTX_ENTRY_LIMIT');
    if (entry.originalSize > pptxPartByteLimit(name) || entry.originalSize > Math.max(1, entry.size) * PPTX_LIMITS.ratio) throw new Error('PPTX_ENTRY_LIMIT');
    names.add(key); entries.push({ ...entry }); expandedBytes += entry.originalSize;
    if (entries.length > PPTX_LIMITS.entries || expandedBytes > PPTX_LIMITS.expanded) throw new Error('PPTX_PACKAGE_LIMIT');
    if (/vbaproject\.bin$|\.(exe|dll|js|mjs|html|htm)$/i.test(name)) throw new Error('PPTX_ACTIVE_CONTENT');
    return false;
  } });
  if (!entries.some(entry => entry.name === '[Content_Types].xml') || !entries.some(entry => entry.name === 'ppt/presentation.xml')) throw new Error('PPTX_REQUIRED_PART_MISSING');
  checkAbort();
  const files = unzipSync(bytes);
  for (const entry of entries) if (files[entry.name]?.length !== entry.originalSize) throw new Error('PPTX_ENTRY_SIZE_MISMATCH');
  checkAbort();
  return { files, entryCount: entries.length, expandedBytes };
}

export function inspectPptxXml(files: Record<string, Uint8Array>, signal?: AbortSignal, onSlideTypeface?: (name: string) => void) {
  const decoder = new TextDecoder('utf-8', { fatal: true }), parser = new DOMParser();
  let xmlCount = 0, timingSlides = 0, transitionSlides = 0, externalRelationships = 0, internalRelationships = 0, unsafeExternalRelationships = 0;
  const contentTypes: ContentTypeDeclaration[] = [];
  const mediaTiming = emptyPptxMediaTiming();
  const fonts = createPptxFontMetadata(Object.keys(files).filter(name => /^ppt\/fonts\/[^/]+\.(fntdata|odttf|ttf|otf)$/i.test(name)).length);
  for (const [name, bytes] of Object.entries(files)) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (!/\.(xml|rels)$/i.test(name)) continue;
    const text = decoder.decode(bytes);
    if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) throw new Error('PPTX_XML_DECLARATION_FORBIDDEN');
    const xml = parser.parseFromString(text, 'application/xml');
    if (xml.getElementsByTagName('parsererror').length) throw new Error('PPTX_INVALID_XML');
    fonts.inspect(xml, /^ppt\/slides\/slide\d+\.xml$/.test(name) ? onSlideTypeface : undefined);
    xmlCount++;
    if (xml.getElementsByTagNameNS('*', 'script').length) throw new Error('PPTX_ACTIVE_CONTENT');
    if (name === '[Content_Types].xml') {
      const namespace = 'http://schemas.openxmlformats.org/package/2006/content-types', root = xml.documentElement;
      if (root.localName !== 'Types' || root.namespaceURI !== namespace) throw new Error('PPTX_INVALID_CONTENT_TYPES');
      for (const element of root.children) {
        const kind = element.localName;
        if (element.namespaceURI !== namespace || element.children.length || (kind !== 'Default' && kind !== 'Override')) throw new Error('PPTX_INVALID_CONTENT_TYPES');
        contentTypes.push({ kind, key: element.getAttribute(kind === 'Default' ? 'Extension' : 'PartName') ?? '', mime: element.getAttribute('ContentType') ?? '' });
      }
    }
    if (/^ppt\/slides\/slide\d+\.xml$/.test(name)) {
      const timing = inspectPptxMediaTiming(xml, signal);
      for (const key of Object.keys(mediaTiming) as (keyof typeof mediaTiming)[]) mediaTiming[key] += timing[key];
      if (!isPptxMediaTimingSummary(mediaTiming)) throw Error('PPTX_MEDIA_TIMING_LIMIT');
      if (xml.getElementsByTagNameNS('*', 'timing').length) timingSlides++;
      if (xml.getElementsByTagNameNS('*', 'transition').length) transitionSlides++;
    }
    if (/\.rels$/i.test(name)) {
      const namespace = 'http://schemas.openxmlformats.org/package/2006/relationships';
      const root = xml.documentElement, source = relationshipSource(name), ids = new Set<string>();
      if (root.localName !== 'Relationships' || root.namespaceURI !== namespace || source !== null && !Object.hasOwn(files, source)) throw new Error('PPTX_INVALID_RELATIONSHIPS');
      for (const relationship of root.children) {
        const id = relationship.getAttribute('Id'), type = relationship.getAttribute('Type'), target = relationship.getAttribute('Target') ?? '', mode = relationship.getAttribute('TargetMode');
        if (relationship.localName !== 'Relationship' || relationship.namespaceURI !== namespace || relationship.children.length || !id || ids.has(id) || !type || !/^[a-z][a-z0-9+.-]*:/i.test(type) || (mode !== null && mode !== 'Internal' && mode !== 'External')) throw new Error('PPTX_INVALID_RELATIONSHIPS');
        ids.add(id);
        if (mode === 'External') {
          externalRelationships++;
          if (isUnsafeExternalTarget(target)) unsafeExternalRelationships++;
        } else {
          const resolved = resolveInternalTarget(source, target);
          if (resolved === '[Content_Types].xml' || /(^|\/)_rels\//.test(resolved) || !Object.hasOwn(files, resolved) || resolved.endsWith('/')) throw new Error('PPTX_TARGET_MISSING_OR_FORBIDDEN');
          internalRelationships++;
        }
      }
    }
  }
  // Do not expose link URLs or slide text in the safety summary.
  const typeSummary = Object.hasOwn(files, '[Content_Types].xml') ? inspectContentTypes(files, contentTypes) : null;
  const fontMetadata: { fontMetadata?: PptxFontMetadata } = { fontMetadata: fonts.summary() };
  return { xmlCount, timingSlides, transitionSlides, externalRelationships, internalRelationships, unsafeExternalRelationships, typeSummary, mediaTiming, ...fontMetadata };
}
