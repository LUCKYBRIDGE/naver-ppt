import { afterEach, describe, expect, it, vi } from 'vitest';
import { readMediaInput } from '../../src/media/input';
function wav() { const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8); return new File([bytes], 'Synthetic.wav'); }
afterEach(() => vi.restoreAllMocks());
describe('immutable File media identity reuse', () => {
  it.each(['success', 'header', 'digest'] as const)('consumes only the read scratch on %s and preserves the File for retry', async mode => {
    const file = mode === 'header' ? new File([new Uint8Array(44)], 'Synthetic.wav') : wav();
    const original = new Uint8Array(await file.arrayBuffer()), nativeRead = file.arrayBuffer.bind(file);
    let scratch: ArrayBuffer | undefined;
    vi.spyOn(file, 'arrayBuffer').mockImplementation(async () => { scratch = await nativeRead(); return scratch; });
    const digest = mode === 'digest' ? vi.spyOn(crypto.subtle, 'digest').mockRejectedValueOnce(Error('Synthetic hash failure')) : undefined;
    if (mode === 'success') await readMediaInput(file); else await expect(readMediaInput(file)).rejects.toThrow();
    expect(scratch!.byteLength).toBe(0); expect(new Uint8Array(await nativeRead())).toEqual(original);
    if (mode === 'digest') { digest!.mockRestore(); expect(await readMediaInput(file)).toMatchObject({ mime: 'audio/wav' }); }
  });
  it('reads once per exact File and returns metadata copies without retaining raw bytes', async () => {
    const file = wav(), read = vi.spyOn(file, 'arrayBuffer');
    const first = await readMediaInput(file), before = { ...first }; first.fingerprint = 'changed';
    expect(await readMediaInput(file)).toEqual(before); expect(read).toHaveBeenCalledOnce();
    const other = wav(), readOther = vi.spyOn(other, 'arrayBuffer'); expect(await readMediaInput(other)).toEqual(before); expect(readOther).toHaveBeenCalledOnce();
  });
  it('does not cache failure or ignore changed format/size metadata', async () => {
    const file = wav(), read = vi.spyOn(file, 'arrayBuffer').mockRejectedValueOnce(Error('Synthetic read failure'));
    await expect(readMediaInput(file)).rejects.toThrow('read failure'); await readMediaInput(file); expect(read).toHaveBeenCalledTimes(2);
    Object.defineProperty(file, 'name', { value: 'Renamed.mp4', configurable: true });
    await expect(readMediaInput(file)).rejects.toThrow('형식'); expect(read).toHaveBeenCalledTimes(3);
    Object.defineProperty(file, 'size', { value: 0 }); await expect(readMediaInput(file)).rejects.toThrow();
  });
});
