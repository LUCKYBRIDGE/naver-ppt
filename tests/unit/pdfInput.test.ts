import { describe, expect, it } from 'vitest';
import { PDF_MAX_BYTES, readPdfInput, renderDimensions } from '../../src/adapters/pdf/input';
import { IndexedDbSourceHandles, SourceVault, sourceKey, type SourceHandleStore, type SourceHandleRecord } from '../../src/storage/sourceVault';
import { IDBFactory } from 'fake-indexeddb';
import { createSession } from '../../src/core/session';
import { preparePdfImport } from '../../src/adapters/documentImport';

const file = (text = '%PDF-1.7\nSynthetic', name = 'synthetic.pdf') => new File([text], name, { lastModified: 1 });
const store = (): SourceHandleStore => ({ read: async () => undefined, write: async () => {} });
describe('bounded PDF input and original references', () => {
  it('uses a content fingerprint, not a filename identity', async () => {
    const a = await readPdfInput(file()), b = await readPdfInput(file(undefined, 'renamed.pdf'));
    expect(a.fingerprint).toBe(b.fingerprint); expect(a.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(a.fingerprint).not.toBe((await readPdfInput(file('%PDF-1.7\nDifferent'))).fingerprint);
  });
  it('rejects wrong format, empty, oversized and spoofed files before parsing', async () => {
    await expect(readPdfInput(file('text', 'file.pptx'))).rejects.toThrow('PDF 파일');
    await expect(readPdfInput(file(''))).rejects.toThrow('빈 파일');
    await expect(readPdfInput({ name: 'huge.pdf', size: PDF_MAX_BYTES + 1 } as File)).rejects.toThrow('128MB');
    await expect(readPdfInput(file('<html>not a pdf</html>'))).rejects.toThrow('PDF 내용');
  });
  it('fits both axes and bounds pixels even on an extreme monitor', () => {
    const small = renderDimensions(1280, 720, 380, 260, 1);
    expect(small.width).toBeLessThanOrEqual(380); expect(small.height).toBeLessThanOrEqual(260);
    const large = renderDimensions(800, 1000, 20000, 20000, 4);
    expect(large.width * large.height).toBeLessThanOrEqual(8_000_000);
    expect(() => renderDimensions(0, 100, 100, 100, 1)).toThrow();
  });
  it('keeps original File in runtime, and writes only a provided handle reference', async () => {
    const writes: unknown[] = [];
    const vault = new SourceVault({ read: async () => undefined, write: async value => { writes.push(value); } });
    const source = file(), fingerprint = (await readPdfInput(source)).fingerprint;
    await vault.remember('key', source, fingerprint);
    expect((await vault.get('key')).file).toBe(source); expect(writes).toEqual([]);
    await expect(vault.get('key', 'a'.repeat(64))).rejects.toThrow('내용이 다릅니다');
    const handle = { kind: 'file', getFile: async () => source } as unknown as FileSystemFileHandle;
    await vault.remember('key', source, fingerprint, handle);
    expect(Object.keys(writes[0] as object)).toEqual(['key', 'fingerprint', 'handle']); vault.close();
  });
  it('detects changed original content after reading a saved handle', async () => {
    const source = file(), changed = file('%PDF-1.7\nchanged');
    const fingerprint = (await readPdfInput(source)).fingerprint;
    const vault = new SourceVault({ write: async () => {}, read: async key => ({ key, fingerprint,
      handle: { kind: 'file', getFile: async () => changed } as unknown as FileSystemFileHandle }) });
    await expect(vault.get('key')).rejects.toThrow('바뀌었습니다'); vault.close();
  });
  it('keeps missing and denied references recoverable', async () => {
    const vault = new SourceVault({ ...store(), read: async () => { throw new Error('permission denied'); } });
    await expect(vault.get('missing')).rejects.toThrow('다시 연결'); vault.close();
  });
  it('bounds retained files and has collision-free session/document keys', async () => {
    expect(sourceKey('a:b', 'c')).not.toBe(sourceKey('a', 'b:c'));
    const vault = new SourceVault(store()), source = file(), fingerprint = (await readPdfInput(source)).fingerprint;
    for (let i = 0; i < 16; i++) await vault.remember(String(i), source, fingerprint);
    await expect(vault.remember('17', source, fingerprint)).rejects.toThrow('한도');
    await vault.remember('0', source, fingerprint); vault.close();
  });
  it('reuses the same source and refuses reconnecting changed bytes without touching deltas', async () => {
    const session = createSession('lesson', 'Synthetic', 0), source = file(), fingerprint = (await readPdfInput(source)).fingerprint;
    session.documentOrder = ['A']; session.documents.A = { id: 'A', source: { type: 'pdf', name: source.name, size: source.size, lastModified: 1, fingerprint },
      lastSlideId: 'A5', knownSlideCount: 1, slideIds: ['A5'], slideDeltas: {}, mediaBookmarks: {}, dirty: true };
    session.presentedSelection = { documentId: 'A', slideId: 'A5' };
    const before = structuredClone(session), vault = new SourceVault(store());
    expect(await preparePdfImport(source, session, vault)).toMatchObject({ reused: true, document: { id: 'A' } });
    await expect(preparePdfImport(file('%PDF-1.7\nchanged'), session, vault, undefined, 'A')).rejects.toThrow('내용이 다릅니다');
    expect(session).toEqual(before); vault.close();
  });
  it('rejects raw bytes or unrecognized fields in persistent source references', async () => {
    const handles = new IndexedDbSourceHandles(new IDBFactory());
    const handle = { kind: 'file', getFile: async () => file() };
    await expect(handles.write({ key: 'key', fingerprint: 'a'.repeat(64), handle, bytes: new Uint8Array([1]) } as unknown as SourceHandleRecord))
      .rejects.toThrow('원본 참조');
    await expect(handles.write({ key: 'key', fingerprint: 'a'.repeat(64), handle: file() } as unknown as SourceHandleRecord))
      .rejects.toThrow('원본 참조');
  });
});
