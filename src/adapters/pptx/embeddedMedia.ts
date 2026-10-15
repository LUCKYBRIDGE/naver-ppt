import type { Presentation, SlideElement } from '@web-ppt/core';
import type { PresentationDocumentState } from '../../core/types';
import { readMediaInput } from '../../media/input';
import { MEDIA_MAX_BYTES } from '../../media/validation';
import { embeddedMediaKey, isLocalMediaRef } from '../../media/validation';
import type { LocalMediaRef, PptxEmbeddedMediaSource } from '../../media/types';
import { bindPptxSlideModel } from './modelBinding';
import { inspectPptxModel } from './modelInspection';
import { validatePptxMediaReference } from './mediaReference';

export const PPTX_MAX_MEDIA_REFERENCES = 100;
type MediaSource = { model: Presentation; fingerprint: string; parts: readonly string[];
  ownedUrls: ReadonlySet<string>; ownedBlobs: ReadonlyMap<string, Blob> };
const checkedBlobs = new WeakMap<Blob, Promise<{ file: File; input: Awaited<ReturnType<typeof readMediaInput>> }>>();
export type PptxMediaOrigin = { slideId: string; sourceFingerprint: string; sourcePart: string; elementPath: number[] };
export type PreparedPptxMedia = PptxMediaOrigin & { file: File; input: Awaited<ReturnType<typeof readMediaInput>> };
export function pptxEmbeddedSource(media: PptxMediaOrigin): PptxEmbeddedMediaSource {
  return { type: 'pptx', sourceFingerprint: media.sourceFingerprint, sourcePart: media.sourcePart, elementPath: [...media.elementPath] };
}
export function matchPptxEmbeddedMedia(ref: LocalMediaRef, prepared: readonly PreparedPptxMedia[]) {
  if (!isLocalMediaRef(ref) || !ref.embeddedSource) throw Error('PPTX_MEDIA_RECONNECT_MISMATCH');
  const matches = prepared.filter(media => media.slideId === ref.slideId && embeddedMediaKey(pptxEmbeddedSource(media)) === embeddedMediaKey(ref.embeddedSource!)
    && media.input.fingerprint === ref.fingerprint && media.input.kind === ref.kind && media.input.mime === ref.mime && media.file.size === ref.size);
  if (matches.length !== 1) throw Error('PPTX_MEDIA_RECONNECT_MISMATCH');
  return matches[0]!;
}

// No fetch: only the exact Blob retained by the guarded parser's asset owner.
// This prepares bytes, not a registered or playable media reference. Geometry and
// source triggers must be validated separately before claiming source fidelity.
export async function preparePptxEmbeddedMedia(document: PresentationDocumentState, source: MediaSource, signal: AbortSignal, selectedSlideId?: string) {
  const cancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  cancelled(); inspectPptxModel(source.model);
  const binding = bindPptxSlideModel(document, source.fingerprint, source.parts, source.model);
  const candidates: (PptxMediaOrigin & { ref: ReturnType<typeof validatePptxMediaReference>; blob: Blob })[] = [];
  const uniqueBlobs = new Set<Blob>(); let totalBytes = 0;
  if (selectedSlideId !== undefined) binding.get(selectedSlideId);
  for (const slideId of selectedSlideId === undefined ? document.slideIds : [selectedSlideId]) {
    const entry = binding.get(slideId);
    const visit = (elements: SlideElement[], parent: number[]) => {
      elements.forEach((element, index) => {
        cancelled(); const elementPath = [...parent, index];
        if (element.kind === 'group') visit(element.children, elementPath);
        else if (element.kind === 'image' && element.media) {
          if (candidates.length >= PPTX_MAX_MEDIA_REFERENCES) throw Error('PPTX_MEDIA_COUNT_LIMIT');
          const ref = validatePptxMediaReference(element.media, source.ownedUrls), blob = source.ownedBlobs.get(ref.src);
          if (!blob || blob.type !== ref.mime || !blob.size || blob.size > MEDIA_MAX_BYTES) throw Error('PPTX_INVALID_MEDIA_ASSET');
          if (!uniqueBlobs.has(blob)) { uniqueBlobs.add(blob); totalBytes += blob.size; }
          if (totalBytes > MEDIA_MAX_BYTES) throw Error('PPTX_MEDIA_BYTES_LIMIT');
          candidates.push({ slideId, sourceFingerprint: source.fingerprint, sourcePart: entry.sourcePart, elementPath, ref, blob });
        }
      });
    };
    visit(entry.slide.elements, []);
  }
  // Validate the entire reference set before reading any binary. A rejected
  // external/unsupported reference cannot yield a partially successful batch.
  const checked = new Map<Blob, { file: File; input: Awaited<ReturnType<typeof readMediaInput>> }>();
  const result: PreparedPptxMedia[] = [];
  for (const candidate of candidates) {
    cancelled(); let asset = checked.get(candidate.blob);
    if (!asset) {
      let pending = checkedBlobs.get(candidate.blob);
      if (!pending) {
        const file = new File([candidate.blob], `PPTX-media-${checked.size + 1}.${candidate.ref.extension}`, { type: candidate.ref.mime, lastModified: 0 });
        pending = readMediaInput(file).then(input => ({ file, input })); checkedBlobs.set(candidate.blob, pending);
        const captured = pending;
        void pending.catch(() => { if (checkedBlobs.get(candidate.blob) === captured) checkedBlobs.delete(candidate.blob); });
      }
      const value = await pending; cancelled();
      asset = { file: value.file, input: { ...value.input } }; checked.set(candidate.blob, asset);
    }
    if (asset.input.kind !== candidate.ref.kind || asset.input.mime !== candidate.ref.mime) throw Error('PPTX_MEDIA_KIND_MISMATCH');
    result.push({ slideId: candidate.slideId, sourceFingerprint: candidate.sourceFingerprint, sourcePart: candidate.sourcePart, elementPath: candidate.elementPath, ...asset });
  }
  cancelled();
  if (candidates.some(candidate => !source.ownedUrls.has(candidate.ref.src) || source.ownedBlobs.get(candidate.ref.src) !== candidate.blob)) throw Error('PPTX_UNOWNED_MEDIA');
  return result;
}
