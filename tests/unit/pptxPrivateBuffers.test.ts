import { describe, expect, it } from 'vitest';
import { clearPptxPrivateParts, dropPptxPart } from '../../src/adapters/pptx/privateBuffers';
import { consumePrivateBuffer } from '../../src/shared/privateBuffer';

describe('adapter-owned scratch buffer consumption', () => {
  it('consumes only an explicitly opted-in unshared package buffer', () => {
    const a = new Uint8Array([1, 2]), b = new Uint8Array([3, 4]), files = { a, b };
    dropPptxPart(files, 'a'); expect(a).toEqual(new Uint8Array([1, 2]));
    dropPptxPart(files, 'b', true); expect(b.byteLength).toBe(0); expect(files).toEqual({});
  });
  it('preserves another part or subview until its final reference is dropped', () => {
    const a = new Uint8Array([1, 2, 3]), view = a.subarray(1), files = { a, view };
    dropPptxPart(files, 'a', true); expect(view).toEqual(new Uint8Array([2, 3]));
    dropPptxPart(files, 'view', true); expect(a.byteLength).toBe(0); expect(view.byteLength).toBe(0);
  });
  it.each([undefined, () => { throw Error('Synthetic unsupported transfer'); }])('retains bytes when optional transfer is absent or fails', transfer => {
    const a = new Uint8Array([1, 2]); Object.defineProperty(a.buffer, 'transfer', { value: transfer });
    expect(consumePrivateBuffer(a.buffer)).toBe(false); expect(a).toEqual(new Uint8Array([1, 2]));
  });
  it('clears private parts once and preserves already-created Blob bytes', async () => {
    const a = new Uint8Array([1, 2]), b = new Uint8Array([3, 4]), blob = new Blob([a]), files = { a, same: a, b };
    clearPptxPrivateParts(files); clearPptxPrivateParts(files);
    expect(a.byteLength).toBe(0); expect(b.byteLength).toBe(0); expect(files).toEqual({});
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([1, 2]));
  });
});
