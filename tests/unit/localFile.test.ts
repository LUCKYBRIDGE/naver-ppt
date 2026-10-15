import { afterEach, describe, expect, it, vi } from 'vitest';
import { backupFilename, pdfCopyFilename, savePdfFile, saveSessionFile, type SavePicker } from '../../src/export/localFile';
import { fixtureSession } from '../fixtures/session';
import { encodeSessionBundle } from '../../src/storage/sessionBundle';
import { IndexedDbSaveJournal } from '../../src/storage/saveJournal';
import { IDBFactory } from 'fake-indexeddb';
const bytes = new TextEncoder().encode('synthetic bytes'), filename = 'lesson.wcp.json';
afterEach(() => vi.restoreAllMocks());
function native(options: { existing?: string; fail?: 'write' | 'close' | 'read'; cancelled?: boolean; name?: string } = {}) {
  let data = new TextEncoder().encode(options.existing ?? '');
  const writer = { write: vi.fn(async (input: Uint8Array) => { if (options.fail === 'write') throw new Error('write failed'); data = new Uint8Array(input); }),
    close: vi.fn(async () => { if (options.fail === 'close') throw new Error('close failed'); }), abort: vi.fn(async () => {}) };
  let reads = 0;
  const handle = { name: options.name ?? filename, createWritable: vi.fn(async () => writer), getFile: vi.fn(async () => {
    reads++; return new Blob([options.fail === 'read' && reads > 1 ? new Uint8Array([1]) : data]);
  }) };
  const picker = vi.fn(async () => { if (options.cancelled) throw new DOMException('cancel', 'AbortError'); return handle; }) as unknown as SavePicker;
  return { handle, writer, picker };
}
function downloadApi() {
  const listeners = new Set<(delta: chrome.downloads.DownloadDelta) => void>();
  const item = { id: 7, byExtensionId: 'ours', url: '', state: 'in_progress', exists: true, fileSize: bytes.length, bytesReceived: bytes.length, filename };
  const api = { download: vi.fn(async (options: chrome.downloads.DownloadOptions) => { item.url = options.url; return 7; }), search: vi.fn(async () => [item]),
    onChanged: { addListener: (fn: (delta: chrome.downloads.DownloadDelta) => void) => listeners.add(fn), removeListener: (fn: (delta: chrome.downloads.DownloadDelta) => void) => listeners.delete(fn) } };
  return { api: api as unknown as typeof chrome.downloads, item, listeners,
    change: () => listeners.forEach(fn => fn({ id: 7, state: { current: item.state as chrome.downloads.State } })) };
}
describe('FR-013/014 native new-file write/close/readback', () => {
  it('confirms actual readback and retains an owned byte copy', async () => {
    const { picker, writer } = native(); const input = new Uint8Array(bytes);
    const pending = saveSessionFile(input, filename, { picker }); input.fill(0);
    expect(await pending).toMatchObject({ state: 'complete', transport: 'filesystem', bytes: bytes.length });
    expect(writer.write.mock.calls[0]?.[0]).toEqual(bytes);
  });
  it('never opens a writer for existing nonempty files', async () => {
    const { picker, handle } = native({ existing: 'original' });
    expect(await saveSessionFile(bytes, filename, { picker })).toMatchObject({ state: 'failed' }); expect(handle.createWritable).not.toHaveBeenCalled();
  });
  it.each(['write', 'close', 'read'] as const)('does not claim completion on %s failure', async fail => {
    const { picker } = native({ fail }); expect(await saveSessionFile(bytes, filename, { picker })).toMatchObject({ state: 'failed' });
  });
  it('distinguishes cancelled picker and missing APIs', async () => {
    expect(await saveSessionFile(bytes, filename, { picker: native({ cancelled: true }).picker })).toMatchObject({ state: 'cancelled' });
    expect(await saveSessionFile(bytes, filename, {})).toMatchObject({ state: 'failed' });
    expect(await saveSessionFile(bytes, '../lesson.wcp.json', {})).toMatchObject({ state: 'failed' });
    expect(backupFilename('../시험:수업', 4, 1)).not.toMatch(/[\\/:]/);
  });
});
describe('PDF output is separate from session backup evidence', () => {
  const pdf = new TextEncoder().encode('%PDF-1.7\nsynthetic output'), pdfName = 'synthetic.pdf';
  it('opens PDF picker synchronously and confirms owned bytes after readback, without a backup receipt', async () => {
    const output = native({ name: pdfName }), input = new Uint8Array(pdf);
    const pending = savePdfFile(input, pdfName, { picker: output.picker }); input.fill(0);
    expect(output.picker).toHaveBeenCalledWith(expect.objectContaining({ types: [{ description: 'PDF 수정본', accept: { 'application/pdf': ['.pdf'] } }] }));
    const result = await pending; expect(result).toMatchObject({ state: 'complete', bytes: pdf.length }); expect(result).not.toHaveProperty('journal');
    expect(output.writer.write.mock.calls[0]?.[0]).toEqual(pdf);
  });
  it('rejects existing file or wrong extension before opening a writer', async () => {
    const existing = native({ name: pdfName, existing: 'Original bytes' }), wrong = native();
    expect((await savePdfFile(pdf, pdfName, { picker: existing.picker })).state).toBe('failed');
    expect((await savePdfFile(pdf, pdfName, { picker: wrong.picker })).state).toBe('failed');
    expect(existing.handle.createWritable).not.toHaveBeenCalled(); expect(wrong.handle.createWritable).not.toHaveBeenCalled();
  });
  it.each(['write', 'close', 'read'] as const)('refuses completion on PDF %s failure', async fail => {
    expect((await savePdfFile(pdf, pdfName, { picker: native({ name: pdfName, fail }).picker })).state).toBe('failed');
  });
  it('distinguishes PDF cancellation and refuses non-PDF/path inputs', async () => {
    expect((await savePdfFile(pdf, pdfName, { picker: native({ cancelled: true }).picker })).state).toBe('cancelled');
    expect((await savePdfFile(bytes, pdfName, {})).state).toBe('failed');
    expect((await savePdfFile(pdf, '../synthetic.pdf', {})).state).toBe('failed');
    expect(pdfCopyFilename('../수업:자료.PDF', 1, 1)).toBe('.._수업_자료_수정본_r1_1.pdf');
  });
  it('uses matching download completion with PDF MIME and no backup journal', async () => {
    const { api, item, change } = downloadApi(); item.fileSize = item.bytesReceived = pdf.length;
    const pending = savePdfFile(pdf, pdfName, { downloads: api, extensionId: 'ours' });
    await new Promise(resolve => setTimeout(resolve, 0)); item.state = 'complete'; change();
    expect(await pending).toMatchObject({ state: 'complete', transport: 'downloads' });
    expect(api.download).toHaveBeenCalledWith(expect.objectContaining({ filename: pdfName, saveAs: true, conflictAction: 'uniquify' }));
  });
});
describe('FR-014 exporter-owned durable result evidence', () => {
  const bundle = encodeSessionBundle(fixtureSession());
  const audit = (journal = new IndexedDbSaveJournal({ factory: new IDBFactory() })) => ({ sessionId: 'original', revision: 4, journal });
  it('opens the picker synchronously, records prepared before writing and complete after exact readback', async () => {
    const output = native(), evidence = audit();
    const write = output.writer.write.getMockImplementation()!;
    output.writer.write.mockImplementation(async input => {
      const prepared = vi.mocked(evidence.journal.prepare).mock.calls[0]?.[0];
      expect(prepared).toMatchObject({ sessionId: 'original', revision: 4, bytes: bundle.length });
      expect((await evidence.journal.read(prepared!.exportId))?.state).toBe('prepared'); await write(input);
    });
    vi.spyOn(evidence.journal, 'prepare');
    const pending = saveSessionFile(bundle, filename, { picker: output.picker, audit: evidence });
    expect(output.picker).toHaveBeenCalledTimes(1);
    const result = await pending; expect(result).toMatchObject({ state: 'complete', journal: 'recorded' });
    expect(await evidence.journal.read(result.exportId)).toMatchObject({ state: 'complete', transport: 'filesystem', revision: 4 });
  });
  it('does not open a writer if preparation fails or snapshot identity differs', async () => {
    const output = native(), evidence = audit(); vi.spyOn(evidence.journal, 'prepare').mockRejectedValue(new Error('quota'));
    expect(await saveSessionFile(bundle, filename, { picker: output.picker, audit: evidence })).toMatchObject({ state: 'failed' });
    expect(output.handle.createWritable).not.toHaveBeenCalled();
    const other = native();
    expect(await saveSessionFile(bundle, filename, { picker: other.picker, audit: { ...audit(), revision: 5 } })).toMatchObject({ state: 'failed' });
    expect(other.picker).not.toHaveBeenCalled();
  });
  it('distinguishes actual file completion from a failed evidence transaction', async () => {
    const evidence = audit(); vi.spyOn(evidence.journal, 'finish').mockRejectedValue(new Error('quota'));
    const result = await saveSessionFile(bundle, filename, { picker: native().picker, audit: evidence });
    expect(result).toMatchObject({ state: 'complete', journal: 'unrecorded' });
    expect((await evidence.journal.read(result.exportId))?.state).toBe('prepared');
  });
  it('retains failed write evidence and does not create successful receipts for cancellation', async () => {
    const evidence = audit();
    const failed = await saveSessionFile(bundle, filename, { picker: native({ fail: 'close' }).picker, audit: evidence });
    expect(failed.state).toBe('failed'); expect((await evidence.journal.read(failed.exportId))?.state).toBe('failed');
    const cancelled = await saveSessionFile(bundle, filename, { picker: native({ cancelled: true }).picker, audit: evidence });
    expect(cancelled.state).toBe('cancelled'); expect(await evidence.journal.read(cancelled.exportId)).toBeNull();
  });
});
describe('FR-014 downloads completion boundary', () => {
  it('waits for the matching completion and confirms metadata after the event', async () => {
    const { api, item, change, listeners } = downloadApi(); let settled = false;
    const pending = saveSessionFile(bytes, filename, { downloads: api, extensionId: 'ours' }).then(result => { settled = true; return result; });
    await new Promise(resolve => setTimeout(resolve, 0)); expect(settled).toBe(false);
    item.state = 'complete'; change(); expect(await pending).toMatchObject({ state: 'complete', transport: 'downloads', downloadId: 7 });
    expect(api.download).toHaveBeenCalledWith(expect.objectContaining({ saveAs: true, conflictAction: 'uniquify' })); expect(listeners.size).toBe(0);
  });
  it('observes early completion even if the event precedes the returned ID', async () => {
    const { api, item } = downloadApi(); item.state = 'complete';
    expect(await saveSessionFile(bytes, filename, { downloads: api, extensionId: 'ours' })).toMatchObject({ state: 'complete' });
  });
  it.each(['wrong-owner', 'missing', 'wrong-size', 'interrupted'] as const)('rejects %s evidence', async reason => {
    const { api, item } = downloadApi(); item.state = 'complete';
    if (reason === 'wrong-owner') item.byExtensionId = 'other'; if (reason === 'missing') item.exists = false;
    if (reason === 'wrong-size') item.fileSize = 1; if (reason === 'interrupted') item.state = 'interrupted';
    expect(await saveSessionFile(bytes, filename, { downloads: api, extensionId: 'ours' })).toMatchObject({ state: 'failed' });
  });
  it('classifies USER_CANCELED and cleans up a completion timeout', async () => {
    const cancelled = downloadApi(); Object.assign(cancelled.item, { state: 'interrupted', error: 'USER_CANCELED' });
    expect(await saveSessionFile(bytes, filename, { downloads: cancelled.api, extensionId: 'ours' })).toMatchObject({ state: 'cancelled' });
    const { api, listeners } = downloadApi();
    expect(await saveSessionFile(bytes, filename, { downloads: api, extensionId: 'ours', timeoutMs: 10 })).toMatchObject({ state: 'failed' }); expect(listeners.size).toBe(0);
  });
});
