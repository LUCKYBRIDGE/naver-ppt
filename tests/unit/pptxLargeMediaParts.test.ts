import { afterEach, describe, expect, it, vi } from 'vitest';
import { releasePptxLargeMediaParts } from '../../src/adapters/pptx/largeMediaParts';
vi.mock('../../src/adapters/pptx/packageGuard', () => ({ PPTX_LIMITS: { entry: 4 } }));
afterEach(() => vi.restoreAllMocks());
describe('original large media byte evidence', () => {
  it('consumes opted-in private media only after capturing original hash and size', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]), expected = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
    const result = await releasePptxLargeMediaParts({ 'ppt/media/a.mp3': bytes }, new AbortController().signal, true);
    expect(bytes.byteLength).toBe(0); expect(result.get('ppt/media/a.mp3')).toEqual({ size: 5, fingerprint: expected });
  });
  it('captures the original hash/size before releasing only the duplicate large media buffer', async () => {
    const bytes = new Uint8Array([1, 2, 3, 4, 5]), files = { 'ppt/media/a.mp3': bytes, 'ppt/media/small.wav': bytes.subarray(0, 4), 'ppt/slides/a.xml': bytes };
    const expected = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
    const result = await releasePptxLargeMediaParts(files, new AbortController().signal);
    expect(result.get('ppt/media/a.mp3')).toEqual({ size: 5, fingerprint: expected }); expect(files).not.toHaveProperty('ppt/media/a.mp3');
    expect(bytes).toEqual(new Uint8Array([1, 2, 3, 4, 5])); expect(files['ppt/media/small.wav']).toHaveLength(4); expect(files['ppt/slides/a.xml']).toBe(bytes);
  });
  it('retains bytes on a cancelled hash', async () => {
    const bytes = new Uint8Array(5), files = { 'ppt/media/a.mp3': bytes }, controller = new AbortController(), digest = crypto.subtle.digest.bind(crypto.subtle);
    vi.spyOn(crypto.subtle, 'digest').mockImplementation(async (...args) => { const value = await digest(...args); controller.abort(); return value; });
    await expect(releasePptxLargeMediaParts(files, controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(files['ppt/media/a.mp3']).toBe(bytes);
  });
});
