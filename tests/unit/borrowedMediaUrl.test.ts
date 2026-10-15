import { describe, expect, it, vi } from 'vitest';
import { borrowedMediaKey, createBorrowedMediaUrl } from '../../src/media/borrowedUrl';
const ref = () => ({ id: 'clip', slideId: 'slide', kind: 'audio' as const, mime: 'audio/wav' as const, fingerprint: 'a'.repeat(64),
  embeddedSource: { type: 'pptx' as const, sourceFingerprint: 'b'.repeat(64), sourcePart: 'ppt/slides/slide1.xml', elementPath: [0] } });
function fixture() {
  const value = ref(), blob = new Blob(['Synthetic'], { type: 'audio/wav' }), release = vi.fn();
  const owner = { ownedUrls: new Set(['blob:owned']), ownedBlobs: new Map([['blob:owned', blob]]), retain: vi.fn(() => ({ dispose: release })) };
  return { value, blob, owner, release };
}
describe('verified borrowed media URL ownership', () => {
  it('reuses the owned URL with an independent idempotent native lease', () => {
    const f = fixture(), asset = createBorrowedMediaUrl(f.owner, 'blob:owned', f.value, () => true);
    const a = asset.acquire(f.value), b = asset.acquire(structuredClone(f.value)); expect(a.url).toBe('blob:owned'); expect(b.url).toBe(a.url); expect(f.owner.retain).toHaveBeenCalledTimes(2);
    a.dispose(); a.dispose(); expect(f.release).toHaveBeenCalledOnce(); b.dispose(); expect(f.release).toHaveBeenCalledTimes(2);
  });
  it.each(['stopped', 'unowned', 'replaced', 'mime', 'fingerprint', 'origin'] as const)('rejects %s before retaining an owner', mode => {
    const f = fixture(), asset = createBorrowedMediaUrl(f.owner, 'blob:owned', f.value, () => mode !== 'stopped'), expected = structuredClone(f.value);
    if (mode === 'unowned') f.owner.ownedUrls.clear();
    if (mode === 'replaced') f.owner.ownedBlobs.set('blob:owned', new Blob(['Synthetic'], { type: 'audio/wav' }));
    if (mode === 'mime') f.owner.ownedBlobs.set('blob:owned', new Blob(['Synthetic'], { type: 'video/mp4' }));
    if (mode === 'fingerprint') expected.fingerprint = 'c'.repeat(64);
    if (mode === 'origin') expected.embeddedSource.elementPath = [1];
    expect(() => asset.acquire(expected)).toThrow('PPTX_MEDIA_URL_UNAVAILABLE'); expect(f.owner.retain).not.toHaveBeenCalled();
  });
  it('keeps transport settings outside byte identity so a stable factory can continue native playback', () => {
    const f = fixture(), changed = { ...f.value, playback: { startSec: .5, endSec: 4, volume: .2, muted: true } };
    expect(borrowedMediaKey(changed)).toBe(borrowedMediaKey(f.value));
    const held = createBorrowedMediaUrl(f.owner, 'blob:owned', f.value, () => true).acquire(changed); held.dispose();
  });
});
