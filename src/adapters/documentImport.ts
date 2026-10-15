import type { ClassSession, PresentationDocumentState } from '../core/types';
import { readPdfInput } from './pdf/input';
import { sourceKey, type SourceVault } from '../storage/sourceVault';
import { registrationPreflight } from '../preflight/registration';

export async function preparePdfImport(file: File, session: ClassSession, vault: SourceVault,
  handle?: FileSystemFileHandle, reconnectDocumentId?: string) {
  const input = await readPdfInput(file);
  const existing = session.documentOrder.map(id => session.documents[id]!).find(doc => doc.source.type === 'pdf' && doc.source.fingerprint === input.fingerprint);
  if (reconnectDocumentId) {
    const expected = session.documents[reconnectDocumentId];
    if (!expected || expected.source.type !== 'pdf' || expected.source.fingerprint !== input.fingerprint) {
      throw new Error('등록된 원본과 내용이 다릅니다. 기존 편집은 유지했습니다. 같은 원본 PDF를 선택하세요.');
    }
    await vault.remember(sourceKey(session.id, expected.id), file, input.fingerprint, handle);
    return { document: expected, reused: true, preflight: registrationPreflight(expected, null, Date.now()) };
  }
  if (existing) {
    await vault.remember(sourceKey(session.id, existing.id), file, input.fingerprint, handle);
    return { document: existing, reused: true, preflight: registrationPreflight(existing, null, Date.now()) };
  }
  const { openPdf } = await import('./pdf/pdf');
  const pdf = await openPdf(input.bytes);
  let count: number;
  try { count = pdf.numPages; } finally { await pdf.loadingTask.destroy(); }
  const id = crypto.randomUUID();
  const document: PresentationDocumentState = { id,
    source: { type: 'pdf', name: file.name, size: file.size, lastModified: file.lastModified, fingerprint: input.fingerprint,
      ...(handle ? { fileHandleKey: sourceKey(session.id, id) } : {}) },
    lastSlideId: null, knownSlideCount: count, slideIds: Array.from({ length: count }, () => crypto.randomUUID()),
    slideDeltas: {}, mediaBookmarks: {}, dirty: false };
  await vault.remember(sourceKey(session.id, id), file, input.fingerprint, handle);
  return { document, reused: false, preflight: registrationPreflight(document, count, Date.now()) };
}

export type PdfPicker = () => Promise<FileSystemFileHandle[]>;
export function pdfPicker(): PdfPicker | undefined {
  const api = window as unknown as { showOpenFilePicker?: (options: unknown) => Promise<FileSystemFileHandle[]> };
  return api.showOpenFilePicker ? () => api.showOpenFilePicker!({ multiple: true, types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }], excludeAcceptAllOption: true }) : undefined;
}

export async function prepareDocumentImport(file: File, session: ClassSession, options: {
  experimentalPptx: boolean; handle?: FileSystemFileHandle; reconnectDocumentId?: string; signal?: AbortSignal;
}) {
  if (options.signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  if (/\.pdf$/i.test(file.name)) {
    const { sourceVault } = await import('../storage/sourceVault');
    return preparePdfImport(file, session, sourceVault(), options.handle, options.reconnectDocumentId);
  }
  if (/\.pptx$/i.test(file.name) && options.experimentalPptx) {
    const [{ preparePptxImport }, { pptxSourceVault }] = await Promise.all([import('./pptx/import'), import('./pptx/source')]);
    try { return await preparePptxImport(file, session, pptxSourceVault(), options.handle, options.reconnectDocumentId, options.signal); }
    catch (error) {
      if (error instanceof Error && error.message === 'PPTX_ENTRY_LIMIT') {
        throw new Error('내장 파일이나 문서 구조가 안전하게 읽을 수 있는 크기·압축 한도를 넘었습니다. 이 PPTX는 추가하지 않았으며 현재 발표와 원본은 유지했습니다. PowerPoint에서 내보낸 PDF를 별도 자료로 추가하거나 원본 앱에서 발표하세요.', { cause: error });
      }
      throw error;
    }
  }
  throw new Error(/\.pptx$/i.test(file.name) ? 'PPTX 실험 사용을 먼저 선택하세요. 원본 충실도와 내장 미디어는 미확인입니다.' : 'PDF 또는 실험 사용을 선택한 PPTX만 등록할 수 있습니다.');
}

export function documentPicker(experimentalPptx: boolean): PdfPicker | undefined {
  if (!experimentalPptx) return pdfPicker();
  const api = window as unknown as { showOpenFilePicker?: (options: unknown) => Promise<FileSystemFileHandle[]> };
  return api.showOpenFilePicker ? () => api.showOpenFilePicker!({ multiple: true, types: [
    { description: 'PDF / 실험적 PPTX', accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'] } },
  ], excludeAcceptAllOption: true }) : undefined;
}
