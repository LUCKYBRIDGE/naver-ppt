import { PPTX_LIMITS } from './packageGuard';
import { dropPptxPart } from './privateBuffers';
export type PptxMediaPartEvidence = Readonly<{ size: number; fingerprint: string }>;

// Source-local evidence, captured from guarded original bytes before releasing
// the duplicate large buffer. The original File and owned playback Blob remain.
export async function releasePptxLargeMediaParts(files: Record<string, Uint8Array>, signal: AbortSignal, consumeBuffers = false) {
  const evidence = new Map<string, PptxMediaPartEvidence>();
  for (const [part, bytes] of Object.entries(files)) {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (!/^ppt\/media\/[^/]+\.(mp3|wav|mp4|webm)$/i.test(part) || bytes.length <= PPTX_LIMITS.entry) continue;
    const hash = await crypto.subtle.digest('SHA-256', bytes as Uint8Array<ArrayBuffer>);
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    evidence.set(part, Object.freeze({ size: bytes.length, fingerprint: [...new Uint8Array(hash)].map(value => value.toString(16).padStart(2, '0')).join('') }));
    dropPptxPart(files, part, consumeBuffers);
  }
  return evidence as ReadonlyMap<string, PptxMediaPartEvidence>;
}
