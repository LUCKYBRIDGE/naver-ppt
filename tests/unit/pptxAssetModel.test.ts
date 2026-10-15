import { describe, expect, it, vi } from 'vitest';
import { hydratePptxAssets } from '../../src/adapters/pptx/assetModel';
const asset = () => ({ mime: 'image/png', data: new Uint8Array([1,2,3]).buffer });
const envelope = (src = 'asset:0') => ({ id: 1, ok: true, assets: [asset()], presentation: { source: 'pptx', width: 960, height: 540, slides: [{ elements: [{ kind: 'image', src }] }] } });
const urls = () => ({ create: vi.fn(() => 'blob:owned-test'), revoke: vi.fn() });
describe('PPTX asset ownership', () => {
  it('consumes private asset buffers only after Blob snapshots and reference hydration succeed', async () => {
    const data = envelope(), bytes = data.assets[0]!.data, api = urls();
    const result = hydratePptxAssets(data, api, true);
    expect(bytes.byteLength).toBe(0);
    expect(new Uint8Array(await result.ownedBlobs.get('blob:owned-test')!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
    expect(result.model.slides[0]!.elements[0]).toMatchObject({ src: 'blob:owned-test' });
    result.dispose(); expect(api.revoke).toHaveBeenCalledOnce();
  });
  it('preserves default caller buffers and consumes repeated buffer identity after all snapshots', async () => {
    const data = envelope(), buffer = data.assets[0]!.data;
    const defaultModel = hydratePptxAssets(data, urls()); expect(buffer.byteLength).toBe(3); defaultModel.dispose();
    data.presentation.slides[0]!.elements[0]!.src = 'asset:0'; data.assets.push({ data: buffer, mime: 'image/png' });
    const api = urls(); api.create.mockReturnValueOnce('blob:a').mockReturnValueOnce('blob:b');
    const consumed = hydratePptxAssets(data, api, true); expect(buffer.byteLength).toBe(0);
    for (const blob of consumed.ownedBlobs.values()) expect(new Uint8Array(await blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });
  it('owns recovered media until the same source owner disposes', () => {
    const api = urls(); api.create.mockReturnValueOnce('blob:image').mockReturnValueOnce('blob:audio');
    const result = hydratePptxAssets(envelope(), api);
    expect(result.addOwnedAsset(new Blob(['ID3synthetic'], { type: 'audio/mpeg' }))).toBe('blob:audio');
    expect(result.ownedBlobs.get('blob:audio')?.type).toBe('audio/mpeg'); result.dispose();
    expect(api.revoke).toHaveBeenCalledTimes(2); expect(() => result.addOwnedAsset(new Blob(['x']))).toThrow('PPTX_ASSETS_DISPOSED');
  });
  it('hydrates package asset IDs only and disposes exactly once', () => {
    const api = urls(), result = hydratePptxAssets(envelope(), api);
    expect(result.ownedUrls.has('blob:owned-test')).toBe(true);
    expect(result.ownedBlobs.get('blob:owned-test')).toMatchObject({ type: 'image/png', size: 3 });
    expect(result.model.slides[0]!.elements[0]).toMatchObject({ src: 'blob:owned-test' });
    result.dispose(); result.model.dispose?.(); expect(api.revoke).toHaveBeenCalledOnce(); expect(result.ownedUrls.size).toBe(0); expect(result.ownedBlobs.size).toBe(0);
  });
  it.each(['blob:attacker', 'https://private.invalid/file', 'data:image/png;base64,AQ==', 'asset:1', 'asset:-1', 'asset:00', 'asset:9007199254740992'])('rejects unowned or invalid reference %s and releases all created URLs', src => {
    const api = urls(); expect(() => hydratePptxAssets(envelope(src), api)).toThrow('PPTX_UNOWNED_ASSET_REFERENCE'); expect(api.revoke).toHaveBeenCalledOnce();
  });
  it.each(['image/svg+xml', 'text/html', 'application/javascript', 'application/xhtml+xml'])('rejects active asset MIME %s before allocating', mime => {
    const data = envelope(); data.assets[0]!.mime = mime; const api = urls();
    expect(() => hydratePptxAssets(data, api)).toThrow('PPTX_UNSAFE_ASSET'); expect(api.create).not.toHaveBeenCalled();
  });
  it('cleans up partial allocation on creation failure', () => {
    const data = envelope(); data.assets.push(asset()); const api = urls(); api.create.mockImplementationOnce(() => 'blob:owned-test').mockImplementationOnce(() => { throw Error('allocation failure'); });
    expect(() => hydratePptxAssets(data, api)).toThrow('allocation failure'); expect(api.revoke).toHaveBeenCalledOnce();
  });
  it('hydrates nested group/background/fill/table/bullet references and leaves external media unplayed', () => {
    const data = { id: 1, ok: true, assets: [asset()], presentation: { source: 'pptx', width: 960, height: 540, slides: [{ background: { type: 'image', src: 'asset:0' }, elements: [
      { kind: 'group', children: [{ kind: 'shape', fill: { type: 'image', src: 'asset:0' }, text: { paragraphs: [{ bulletImage: 'asset:0' }] } }] },
      { kind: 'table', rows: [{ cells: [{ fill: { type: 'image', src: 'asset:0' } }] }] },
      { kind: 'image', src: '', media: { kind: 'video', src: 'https://private.invalid/video', external: true } },
    ] }], embeddedFonts: [{ src: 'asset:0' }] } };
    const api = urls(), result = hydratePptxAssets(data, api);
    expect(data.presentation.slides[0]!.background.src).toBe('blob:owned-test');
    expect(JSON.stringify(data)).not.toContain('asset:0');
    expect(JSON.stringify(data)).toContain('https://private.invalid/video'); result.dispose();
  });
});
