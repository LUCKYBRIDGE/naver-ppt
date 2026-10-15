type Stage = 'queued' | 'preparing' | 'ready' | 'cancelling';
export type PptxSourceBytes = { rawBytes: number; rawBackingBytes: number; assetBytes: number; assetBlobs: number; assetUrls: number };
type RecordValue = PptxSourceBytes & { stage: Stage; fileBytes: number; leases: number };
const finiteCount = (value: number) => Number.isFinite(value) && value >= 0 && Number.isInteger(value) ? value : 0;
const finiteBytes = (value: number) => Number.isFinite(value) && value >= 0 ? value : 0;
export function measurePptxSourceBytes(files: Record<string, Uint8Array>, blobs: ReadonlyMap<string, Blob> | undefined): PptxSourceBytes {
  const views = Object.values(files), buffers = new Set(views.map(value => value.buffer)), unique = new Set(blobs?.values());
  return { rawBytes: views.reduce((sum, value) => sum + value.byteLength, 0), rawBackingBytes: [...buffers].reduce((sum, value) => sum + value.byteLength, 0),
    assetBytes: [...unique].reduce((sum, value) => sum + value.size, 0), assetBlobs: unique.size, assetUrls: blobs?.size ?? 0 };
}
export class PptxResourceInventory {
  private records = new Map<symbol, RecordValue>();
  begin(fileBytes: number) {
    const token = Symbol(); this.records.set(token, { stage: 'queued', fileBytes: finiteBytes(fileBytes), leases: 0, rawBytes: 0, rawBackingBytes: 0, assetBytes: 0, assetBlobs: 0, assetUrls: 0 }); return token;
  }
  stage(token: symbol, stage: Stage) { const value = this.records.get(token); if (value) value.stage = stage; }
  ready(token: symbol, bytes: PptxSourceBytes, leases: number) { const value = this.records.get(token); if (value) Object.assign(value, { rawBytes: finiteBytes(bytes.rawBytes), rawBackingBytes: finiteBytes(bytes.rawBackingBytes), assetBytes: finiteBytes(bytes.assetBytes), assetBlobs: finiteCount(bytes.assetBlobs), assetUrls: finiteCount(bytes.assetUrls), stage: 'ready', leases: finiteCount(leases) }); }
  leases(token: symbol, leases: number) { const value = this.records.get(token); if (value) value.leases = finiteCount(leases); }
  remove(token: symbol) { this.records.delete(token); }
  snapshot() {
    const values = [...this.records.values()];
    return { scope: 'current-module-realm' as const, physicalMemoryBytes: null, modelHeapBytes: null,
      sources: values.map(value => ({ ...value })), jobs: values.filter(value => value.stage !== 'ready').length,
      readySources: values.filter(value => value.stage === 'ready').length,
      leases: values.reduce((sum, value) => sum + value.leases, 0),
      readyFileBytes: values.filter(value => value.stage === 'ready').reduce((sum, value) => sum + value.fileBytes, 0),
      preparingFileBytes: values.filter(value => value.stage !== 'ready').reduce((sum, value) => sum + value.fileBytes, 0),
      rawBackingBytes: values.reduce((sum, value) => sum + value.rawBackingBytes, 0), assetBytes: values.reduce((sum, value) => sum + value.assetBytes, 0) };
  }
}
