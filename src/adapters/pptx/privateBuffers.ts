// Only adapter-owned scratch bytes may opt into consumption. Blob snapshots,
// original Files and buffers still referenced by another package part survive.
import { consumePrivateBuffer } from '../../shared/privateBuffer';
export function dropPptxPart(files: Record<string, Uint8Array>, part: string, consume = false) {
  const bytes = files[part]; delete files[part];
  if (!consume || !bytes || !(bytes.buffer instanceof ArrayBuffer) || Object.values(files).some(value => value.buffer === bytes.buffer)) return;
  consumePrivateBuffer(bytes.buffer);
}
export function clearPptxPrivateParts(files: Record<string, Uint8Array>) {
  for (const part of Object.keys(files)) dropPptxPart(files, part, true);
}
