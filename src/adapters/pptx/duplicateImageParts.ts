import { PPTX_LIMITS } from './packageGuard';
import type { PptxMediaPartEvidence } from './largeMediaParts';
import { dropPptxPart } from './privateBuffers';

const mimeFor = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp' } as const;
const mediaMimeFor = { mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4', webm: 'video/webm' } as const;
const fingerprint = async (bytes: ArrayBuffer | Uint8Array<ArrayBuffer>) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
async function equalBytes(blob: Blob, bytes: Uint8Array, signal: AbortSignal) {
  const reader = blob.stream().getReader(), abort = () => { void reader.cancel().catch(() => {}); };
  const check = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  signal.addEventListener('abort', abort, { once: true });
  try {
    let offset = 0;
    while (true) {
      check(); const chunk = await reader.read(); check();
      if (chunk.done) return offset === bytes.length;
      if (!(chunk.value instanceof Uint8Array) || !chunk.value.length || offset + chunk.value.length > bytes.length) return false;
      for (let index = 0; index < chunk.value.length; index++) if (bytes[offset + index] !== chunk.value[index]) return false;
      offset += chunk.value.length;
    }
  } finally { signal.removeEventListener('abort', abort); try { await reader.cancel(); } finally { reader.releaseLock(); } }
}

// Called only after the package guards, model hydration and embedded recovery.
// Unknown/converted/non-owned images remain available; exact byte equality is
// required. No quality conversion and no access to the original File here.
async function releaseDuplicateParts(files: Record<string, Uint8Array>, ownedBlobs: ReadonlyMap<string, Blob>, signal: AbortSignal, pattern: RegExp, types: Readonly<Record<string, string>>, consumeBuffers: boolean) {
  const evidence = new Map<string, PptxMediaPartEvidence>(), matches = new Map<Blob, Map<string, boolean>>();
  const check = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  for (const part of Object.keys(files)) {
    check(); const bytes = files[part], match = pattern.exec(part);
    if (!match || !bytes?.length || bytes.length > PPTX_LIMITS.entry) continue;
    const mime = types[match[1]!.toLowerCase()];
    const candidates = [...ownedBlobs.entries()].filter(([, blob]) => blob.type === mime && blob.size === bytes.length);
    if (!candidates.length) continue;
    const hash = await fingerprint(bytes as Uint8Array<ArrayBuffer>); check();
    for (const [url, blob] of candidates) {
      let equal = matches.get(blob)?.get(hash);
      if (equal === undefined) {
        equal = await equalBytes(blob, bytes, signal); check();
        const known = matches.get(blob) ?? new Map<string, boolean>(); known.set(hash, equal); matches.set(blob, known);
      }
      if (!equal || ownedBlobs.get(url) !== blob) continue;
      if (files[part] !== bytes) throw Error('PPTX_IMAGE_PART_CHANGED');
      evidence.set(part, Object.freeze({ size: bytes.length, fingerprint: hash })); dropPptxPart(files, part, consumeBuffers); break;
    }
  }
  check(); return evidence as ReadonlyMap<string, PptxMediaPartEvidence>;
}
export function releasePptxDuplicateImageParts(files: Record<string, Uint8Array>, ownedBlobs: ReadonlyMap<string, Blob>, signal: AbortSignal, consumeBuffers = false) {
  return releaseDuplicateParts(files, ownedBlobs, signal, /^ppt\/media\/[^/]+\.(png|jpe?g|gif|webp)$/i, mimeFor, consumeBuffers);
}
export function releasePptxDuplicateMediaParts(files: Record<string, Uint8Array>, ownedBlobs: ReadonlyMap<string, Blob>, signal: AbortSignal, consumeBuffers = false) {
  return releaseDuplicateParts(files, ownedBlobs, signal, /^ppt\/media\/[^/]+\.(mp3|wav|mp4|webm)$/i, mediaMimeFor, consumeBuffers);
}
