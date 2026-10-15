import { describe, expect, it } from 'vitest';
import { measurePptxSourceBytes, PptxResourceInventory } from '../../src/adapters/pptx/resourceInventory';
describe('numeric source resource inventory', () => {
  it('normalizes invalid numeric input without allowing negative or non-finite accounting', () => {
    const inventory = new PptxResourceInventory(), token = inventory.begin(-1);
    inventory.ready(token, { rawBytes: -2, rawBackingBytes: Number.NaN, assetBytes: Infinity, assetBlobs: -1, assetUrls: 1.5 }, -3);
    expect(inventory.snapshot()).toMatchObject({ readyFileBytes: 0, rawBackingBytes: 0, assetBytes: 0, leases: 0 });
    expect(inventory.snapshot().sources[0]).toMatchObject({ fileBytes: 0, rawBytes: 0, assetBlobs: 0, assetUrls: 0, leases: 0 });
  });
  it('counts shared backing buffers and Blob aliases once within a source', () => {
    const bytes = new Uint8Array(8), blob = new Blob(['abc']);
    expect(measurePptxSourceBytes({ a: bytes.subarray(0, 4), b: bytes.subarray(4) }, new Map([['blob:a', blob], ['blob:b', blob]])))
      .toEqual({ rawBytes: 8, rawBackingBytes: 8, assetBytes: 3, assetBlobs: 1, assetUrls: 2 });
  });
  it('separates queued/cancelling input candidates from ready bytes and leases', () => {
    const inventory = new PptxResourceInventory(), token = inventory.begin(100);
    expect(inventory.snapshot()).toMatchObject({ jobs: 1, preparingFileBytes: 100, readySources: 0, rawBackingBytes: 0 });
    inventory.stage(token, 'preparing'); inventory.stage(token, 'cancelling');
    expect(inventory.snapshot().sources[0]?.stage).toBe('cancelling'); inventory.remove(token); expect(inventory.snapshot().jobs).toBe(0);
    const ready = inventory.begin(100); inventory.ready(ready, { rawBytes: 4, rawBackingBytes: 8, assetBytes: 3, assetBlobs: 1, assetUrls: 2 }, 2);
    inventory.leases(ready, 4); expect(inventory.snapshot()).toMatchObject({ readySources: 1, leases: 4, readyFileBytes: 100, preparingFileBytes: 0, rawBackingBytes: 8, assetBytes: 3 });
    inventory.remove(ready); inventory.remove(ready); expect(inventory.snapshot()).toMatchObject({ jobs: 0, readySources: 0, leases: 0, assetBytes: 0 });
  });
  it('returns detached numeric snapshots without identities or an invented physical estimate', () => {
    const inventory = new PptxResourceInventory(), token = inventory.begin(100), snapshot = inventory.snapshot();
    snapshot.sources[0]!.fileBytes = 999; snapshot.sources.length = 0;
    expect(inventory.snapshot().sources[0]?.fileBytes).toBe(100);
    expect(inventory.snapshot()).toMatchObject({ scope: 'current-module-realm', physicalMemoryBytes: null, modelHeapBytes: null });
    expect(JSON.stringify(inventory.snapshot())).not.toMatch(/fingerprint|fileName|documentId|blob:|modelText|token/);
    inventory.remove(token);
  });
});
