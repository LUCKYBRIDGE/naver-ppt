import type { LocalMediaRef } from './types';
export type BorrowedMediaRef = Pick<LocalMediaRef, 'id' | 'slideId' | 'kind' | 'fingerprint' | 'mime' | 'embeddedSource'>;
export type BorrowedMediaUrl = { acquire(expected: BorrowedMediaRef): { url: string; dispose(): void } };
type Owner = { ownedUrls: ReadonlySet<string>; ownedBlobs: ReadonlyMap<string, Blob>; retain(): { dispose(): void } };
export function borrowedMediaKey(ref: BorrowedMediaRef) {
  return JSON.stringify([ref.id, ref.slideId, ref.kind, ref.fingerprint, ref.mime, ref.embeddedSource]);
}
// The caller has already guarded/bound/hash-checked this media. No new URL or
// codec conversion; a separate owner keeps the original URL alive for native use.
export function createBorrowedMediaUrl(owner: Owner, url: string, ref: BorrowedMediaRef, live: () => boolean): BorrowedMediaUrl {
  const key = borrowedMediaKey(ref), blob = owner.ownedBlobs.get(url), mime = ref.mime;
  return { acquire(expected) {
    if (!live() || key !== borrowedMediaKey(expected) || !ref.embeddedSource || !blob || blob.type !== mime
      || !owner.ownedUrls.has(url) || owner.ownedBlobs.get(url) !== blob) throw Error('PPTX_MEDIA_URL_UNAVAILABLE');
    const held = owner.retain(); let released = false;
    return { url, dispose() { if (released) return; released = true; held.dispose(); } };
  } };
}
