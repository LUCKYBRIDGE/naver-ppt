import type { Fill, Presentation, SlideElement } from '@web-ppt/core';
import { inspectPptxWorkerEnvelope } from './workerEnvelope';
import { inspectPptxModel } from './modelInspection';
import { PPTX_LIMITS } from './packageGuard';
import { consumePrivateBuffer } from '../../shared/privateBuffer';

export function hydratePptxAssets(result: unknown, urls = { create: (blob: Blob) => URL.createObjectURL(blob), revoke: (url: string) => URL.revokeObjectURL(url) }, consumeBuffers = false) {
  inspectPptxWorkerEnvelope(result);
  const data = result as { presentation: Presentation; assets: { data: ArrayBuffer; mime: string }[] };
  inspectPptxModel(data.presentation);
  const owned = new Set<string>(), references: string[] = [], blobs = new Map<string, Blob>();
  let disposed = false;
  const dispose = () => { if (disposed) return; disposed = true; for (const url of owned) urls.revoke(url); owned.clear(); blobs.clear(); };
  let totalBytes = 0;
  const addOwnedAsset = (blob: Blob) => {
    if (disposed) throw Error('PPTX_ASSETS_DISPOSED');
    const limit = ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'].includes(blob.type) ? PPTX_LIMITS.mediaEntry : PPTX_LIMITS.entry;
    if (!blob.size || blob.size > limit || totalBytes + blob.size > PPTX_LIMITS.expanded || owned.size >= PPTX_LIMITS.entries
      || /^(?:image\/svg\+xml|text\/|application\/(?:xml|javascript|xhtml\+xml))/i.test(blob.type)) throw Error('PPTX_UNSAFE_ASSET');
    const url = urls.create(blob); owned.add(url); blobs.set(url, blob); totalBytes += blob.size; return url;
  };
  try {
    for (const asset of data.assets) {
      if (/^(?:image\/svg\+xml|text\/|application\/(?:xml|javascript|xhtml\+xml))/i.test(asset.mime)) throw Error('PPTX_UNSAFE_ASSET');
      const blob = new Blob([asset.data], { type: asset.mime }), url = addOwnedAsset(blob);
      references.push(url);
    }
    const resolve = (value: string): string => {
      if (!value) return '';
      const match = /^asset:(0|[1-9][0-9]*)$/.exec(value), index = match ? Number(match[1]) : -1;
      if (!Number.isSafeInteger(index) || !references[index]) throw Error('PPTX_UNOWNED_ASSET_REFERENCE');
      return references[index]!;
    };
    const fill = (value: Fill | null | undefined) => { if (value?.type === 'image') value.src = resolve(value.src); };
    const visit = (elements: SlideElement[]) => {
      for (const element of elements) {
        if (element.kind === 'image') {
          element.src = resolve(element.src);
          if (element.media?.src && !element.media.external) element.media.src = resolve(element.media.src);
        } else if (element.kind === 'group') visit(element.children);
        else if (element.kind === 'shape') {
          fill(element.fill);
          for (const paragraph of element.text?.paragraphs ?? []) if (paragraph.bulletImage) paragraph.bulletImage = resolve(paragraph.bulletImage);
        } else if (element.kind === 'table') for (const row of element.rows) for (const cell of row.cells) fill(cell.fill);
      }
    };
    for (const slide of data.presentation.slides) { fill(slide.background); visit(slide.elements); }
    for (const font of data.presentation.embeddedFonts ?? []) font.src = resolve(font.src);
    if (consumeBuffers) for (const buffer of new Set(data.assets.map(asset => asset.data))) consumePrivateBuffer(buffer);
    data.presentation.dispose = dispose;
    return { model: data.presentation, ownedUrls: owned as ReadonlySet<string>, ownedBlobs: blobs as ReadonlyMap<string, Blob>, addOwnedAsset, dispose };
  } catch (error) { dispose(); throw error; }
}
