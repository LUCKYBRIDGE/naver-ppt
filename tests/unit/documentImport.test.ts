import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareDocumentImport, documentPicker } from '../../src/adapters/documentImport';
import { fixtureSession } from '../fixtures/session';
const mocks = vi.hoisted(() => ({ pdf: vi.fn(), pptx: vi.fn(), remember: vi.fn(), destroy: vi.fn(), picker: vi.fn() }));
vi.mock('../../src/adapters/pdf/input', () => ({ readPdfInput: mocks.pdf }));
vi.mock('../../src/adapters/pdf/pdf', () => ({ openPdf: async () => ({ numPages: 2, loadingTask: { destroy: mocks.destroy } }) }));
vi.mock('../../src/storage/sourceVault', () => ({ sourceKey: (s: string, d: string) => `${s}:${d}`, sourceVault: () => ({ remember: mocks.remember }) }));
vi.mock('../../src/adapters/pptx/import', () => ({ preparePptxImport: mocks.pptx }));
vi.mock('../../src/adapters/pptx/source', () => ({ pptxSourceVault: () => ({ kind: 'pptx-only' }) }));
beforeEach(() => { vi.clearAllMocks(); mocks.pptx.mockReset(); mocks.pdf.mockResolvedValue({ bytes: new Uint8Array([1]), fingerprint: 'b'.repeat(64) }); });
afterEach(() => vi.unstubAllGlobals());
describe('common product import format boundary', () => {
  it('explains PPTX entry-limit failure and a safe PDF alternative without changing the lesson', async () => {
    const session = fixtureSession(), before = structuredClone(session), error = Error('PPTX_ENTRY_LIMIT');
    mocks.pptx.mockRejectedValue(error);
    const result = prepareDocumentImport(new File(['pptx'], 'Synthetic.pptx'), session, { experimentalPptx: true });
    await expect(result).rejects.toThrow('내장 파일이나 문서 구조');
    await expect(result).rejects.toThrow('PDF'); await expect(result).rejects.toHaveProperty('cause', error);
    expect(session).toEqual(before); expect(mocks.remember).not.toHaveBeenCalled(); expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it.each([Error('PPTX_ZIP_TIMEOUT'), new DOMException('Cancelled', 'AbortError'), Error('원본 내용이 다릅니다.')])('preserves unrelated import errors and cancellation (%s)', async error => {
    mocks.pptx.mockRejectedValue(error);
    await expect(prepareDocumentImport(new File(['pptx'], 'Synthetic.pptx'), fixtureSession(), { experimentalPptx: true })).rejects.toBe(error);
  });
  it('retains PDF registration without experimental permission or PPTX parser', async () => {
    const session = fixtureSession(), before = structuredClone(session);
    const result = await prepareDocumentImport(new File(['pdf'], 'Synthetic.PDF'), session, { experimentalPptx: false });
    expect(result.document.source.type).toBe('pdf'); expect(mocks.pptx).not.toHaveBeenCalled(); expect(session).toEqual(before);
  });
  it('requires explicit permission before loading PPTX preparation', async () => {
    await expect(prepareDocumentImport(new File(['pptx'], 'Synthetic.pptx'), fixtureSession(), { experimentalPptx: false })).rejects.toThrow('실험 사용');
    expect(mocks.pptx).not.toHaveBeenCalled(); expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it('dispatches PPTX to its own vault with exact reconnect target and abort signal', async () => {
    const file = new File(['pptx'], 'Synthetic.PPTX'), session = fixtureSession(), controller = new AbortController();
    mocks.pptx.mockResolvedValue({ reused: true });
    expect(await prepareDocumentImport(file, session, { experimentalPptx: true, reconnectDocumentId: 'A', signal: controller.signal })).toEqual({ reused: true });
    expect(mocks.pptx).toHaveBeenCalledExactlyOnceWith(file, session, { kind: 'pptx-only' }, undefined, 'A', controller.signal);
    expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it.each(['Synthetic.ppt', 'Synthetic.show', 'Synthetic.exe', 'Synthetic.pptx.exe'])('rejects unsupported %s without parser work', async name => {
    await expect(prepareDocumentImport(new File(['data'], name), fixtureSession(), { experimentalPptx: true })).rejects.toThrow('등록할 수');
    expect(mocks.pptx).not.toHaveBeenCalled(); expect(mocks.pdf).not.toHaveBeenCalled();
  });
  it('rejects cancellation before any file parser', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(prepareDocumentImport(new File(['data'], 'Synthetic.pptx'), fixtureSession(), { experimentalPptx: true, signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(mocks.pptx).not.toHaveBeenCalled();
  });
  it('native picker exposes PPTX only with permission and disables arbitrary file types', async () => {
    vi.stubGlobal('window', { showOpenFilePicker: mocks.picker });
    await documentPicker(false)!(); expect(JSON.stringify(mocks.picker.mock.calls[0])).not.toContain('.pptx');
    await documentPicker(true)!(); expect(mocks.picker.mock.calls[1]![0]).toMatchObject({ excludeAcceptAllOption: true });
    expect(JSON.stringify(mocks.picker.mock.calls[1])).toContain('.pptx');
  });
});
