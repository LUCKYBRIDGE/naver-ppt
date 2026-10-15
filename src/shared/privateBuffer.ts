// Call only for privately owned scratch bytes after all readers finish. This
// detaches finished scratch without requesting GC or changing File/Blob snapshots.
export function consumePrivateBuffer(buffer: ArrayBuffer) {
  const transfer = (buffer as ArrayBuffer & { transfer?: (size: number) => ArrayBuffer }).transfer;
  if (!buffer.byteLength || typeof transfer !== 'function') return false;
  try { transfer.call(buffer, 0); return buffer.byteLength === 0; } catch { return false; }
}
