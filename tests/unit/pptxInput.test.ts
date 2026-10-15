import { describe, expect, it, vi } from 'vitest';
import { PPTX_MAX_BYTES, readPptxInput } from '../../src/adapters/pptx/input';
import { SourceVault, sourceKey, type SourceHandleStore } from '../../src/storage/sourceVault';

const file = (tail = 'Synthetic', name = 'synthetic.pptx') => new File([new Uint8Array([0x50, 0x4b, 3, 4]), tail], name, { lastModified: 1 });
const handles = (): SourceHandleStore => ({ read: async () => undefined, write: async () => {} });
describe('PPTX File/source boundary (not package validation)', () => {
  it('uses all bytes for identity, independent of filename', async () => {
    const a = await readPptxInput(file()), b = await readPptxInput(file('Synthetic', '다른이름.PPTX'));
    expect(a.fingerprint).toBe(b.fingerprint); expect(a.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(a.fingerprint).not.toBe((await readPptxInput(file('Changed'))).fingerprint);
    expect(a.bytes).toEqual(new Uint8Array(await file().arrayBuffer()));
  });
  it('rejects wrong formats, missing content and oversized files before reading', async () => {
    for (const name of ['a.ppt', 'a.show', 'a.pdf', 'a.pptx.exe']) await expect(readPptxInput(file('', name))).rejects.toThrow('PPTX 파일');
    for (const size of [0, 3, PPTX_MAX_BYTES + 1, NaN, 4.5]) await expect(readPptxInput({ name: 'a.pptx', size } as File)).rejects.toThrow('128MB');
  });
  it('rejects a misleading filename/header', async () => {
    for (const bytes of ['%PDF-1.7', '<html>bad', 'PK\u0005\u0006']) await expect(readPptxInput(new File([bytes], 'a.pptx'))).rejects.toThrow('패키지');
  });
  it('rejects a partial read', async () => {
    const source = file(); vi.spyOn(source, 'arrayBuffer').mockResolvedValue(new ArrayBuffer(4));
    await expect(readPptxInput(source)).rejects.toThrow('끝까지');
  });
  it('cancels before touching a File', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(readPptxInput({} as File, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('cancels after an asynchronous read', async () => {
    const source = file(), controller = new AbortController();
    vi.spyOn(source, 'arrayBuffer').mockImplementation(async () => { controller.abort(); return new ArrayBuffer(source.size); });
    await expect(readPptxInput(source, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('retains bytes only in runtime; persists only an explicit handle', async () => {
    const writes: unknown[] = [], vault = new SourceVault({ ...handles(), write: async value => { writes.push(value); } }, undefined, readPptxInput);
    const source = file(), { fingerprint } = await readPptxInput(source), key = sourceKey('lesson', 'A');
    await vault.remember(key, source, fingerprint); expect((await vault.get(key, fingerprint)).file).toBe(source); expect(writes).toEqual([]);
    const handle = { kind: 'file', getFile: async () => source } as unknown as FileSystemFileHandle;
    await vault.remember(key, source, fingerprint, handle); expect(Object.keys(writes[0] as object)).toEqual(['key', 'fingerprint', 'handle']); vault.close();
  });
  it('revalidates a cold handle and rejects changed bytes', async () => {
    const source = file(), { fingerprint } = await readPptxInput(source);
    for (const returned of [source, file('Changed')]) {
      const vault = new SourceVault({ ...handles(), read: async key => ({ key, fingerprint, handle: { kind: 'file', getFile: async () => returned } as unknown as FileSystemFileHandle }) }, undefined, readPptxInput);
      if (returned === source) expect((await vault.get('A', fingerprint)).file).toBe(source);
      else await expect(vault.get('A', fingerprint)).rejects.toThrow('바뀌었습니다');
      vault.close();
    }
  });
  it('preserves PDF validation and refuses mismatched or absent references', async () => {
    const source = file(), { fingerprint } = await readPptxInput(source);
    const store: SourceHandleStore = { ...handles(), read: async key => ({ key, fingerprint, handle: { kind: 'file', getFile: async () => source } as unknown as FileSystemFileHandle }) };
    const pdf = new SourceVault(store); await expect(pdf.get('A', fingerprint)).rejects.toThrow('PDF 파일'); pdf.close();
    const pptx = new SourceVault(store, undefined, readPptxInput); await expect(pptx.get('A', 'a'.repeat(64))).rejects.toThrow('참조가 다릅니다'); pptx.close();
    const missing = new SourceVault(handles(), undefined, readPptxInput); await expect(missing.get('A', fingerprint)).rejects.toThrow('다시 연결'); missing.close();
  });
});
