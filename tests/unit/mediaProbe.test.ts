import { afterEach, describe, expect, it, vi } from 'vitest';
import { probeMedia } from '../../src/media/input';
const file = () => { const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8); return new File([bytes], 'Synthetic.wav'); };
function fixture(mode: 'metadata' | 'pending' | 'error' = 'metadata', duration = 4) {
  const element = { onloadedmetadata: null as (() => void) | null, onerror: null as (() => void) | null,
    duration, src: '', preload: '', pause: vi.fn(), removeAttribute: vi.fn(), load: vi.fn(() => {
      if (mode === 'metadata') queueMicrotask(() => element.onloadedmetadata?.());
      if (mode === 'error') queueMicrotask(() => element.onerror?.());
    }) };
  const create = vi.fn(() => element); vi.stubGlobal('document', { createElement: create });
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:probe'); const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return { element, create, revoke };
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('native media metadata lifecycle', () => {
  it('cleans native element, timer and URL after metadata without playing', async () => {
    vi.useFakeTimers(); const f = fixture(); const result = await probeMedia(file());
    expect(result.durationSec).toBe(4); expect(f.element.pause).toHaveBeenCalledOnce(); expect(f.revoke).toHaveBeenCalledWith('blob:probe');
    expect(f.element.onloadedmetadata).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  });
  it('rejects already cancelled input before allocating native resources', async () => {
    const f = fixture(), controller = new AbortController(); controller.abort();
    await expect(probeMedia(file(), controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(f.create).not.toHaveBeenCalled();
  });
  it('aborts pending metadata and releases native resources and timeout', async () => {
    vi.useFakeTimers(); const f = fixture('pending'), controller = new AbortController();
    const loading = probeMedia(file(), controller.signal), assertion = expect(loading).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(f.element.load).toHaveBeenCalledOnce()); controller.abort(); await assertion;
    expect(f.revoke).toHaveBeenCalledOnce(); expect(f.element.onerror).toBeNull(); expect(vi.getTimerCount()).toBe(0);
  });
  it.each(['error', 'invalid-duration'] as const)('releases resources after %s', async issue => {
    const f = fixture(issue === 'error' ? 'error' : 'metadata', Infinity);
    await expect(probeMedia(file())).rejects.toThrow(); expect(f.revoke).toHaveBeenCalledOnce(); expect(f.element.onloadedmetadata).toBeNull();
  });
});
