import type { ExportResult } from './types';
import type { SaveJournal, SaveOutcome } from '../storage/saveJournal';
import { decodeSessionBundle } from '../storage/sessionBundle';

export type SavePicker = (options: { suggestedName: string; excludeAcceptAllOption: boolean;
  types: { description: string; accept: Record<string, string[]> }[] }) => Promise<FileSystemFileHandle>;
type Downloads = Pick<typeof chrome.downloads, 'download' | 'search' | 'onChanged'>;
export function savePicker(): SavePicker | undefined {
  const api = globalThis as unknown as { showSaveFilePicker?: SavePicker };
  return api.showSaveFilePicker ? options => api.showSaveFilePicker!(options) : undefined;
}
export function backupFilename(title: string, revision: number, now = Date.now()) {
  const name = title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 60) || '수업';
  return `${name}_편집정보_r${revision}_${now}.wcp.json`;
}
interface SaveOptions {
  picker?: SavePicker | undefined; downloads?: Downloads | undefined; extensionId?: string | undefined; timeoutMs?: number;
  audit?: { sessionId: string; revision: number; journal: SaveJournal };
}
interface FileFormat { suffix: string; mime: string; description: string }
const sessionFormat: FileFormat = { suffix: '.wcp.json', mime: 'application/json', description: 'naver-ppt 편집정보' };
export const pdfFormat: FileFormat = { suffix: '.pdf', mime: 'application/pdf', description: 'PDF 수정본' };
export function pdfCopyFilename(title: string, revision: number, now = Date.now()) {
  const name = title.replace(/\.pdf$/i, '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '').slice(0, 60) || '자료';
  return `${name}_수정본_r${revision}_${now}.pdf`;
}
export async function savePdfFile(input: Uint8Array, filename: string, options: Omit<SaveOptions, 'audit'>): Promise<ExportResult> {
  const exportId = crypto.randomUUID(), bytes = new Uint8Array(input);
  if (!filename.toLowerCase().endsWith('.pdf') || /[\\/\u0000]/.test(filename) || !bytes.length || bytes.length > 256 * 1024 * 1024
    || new TextDecoder('ascii').decode(bytes.slice(0, 5)) !== '%PDF-') return { state: 'failed', exportId, error: '저장할 PDF를 확인하지 못했습니다.' };
  return writeLocalFile(bytes, filename, options, exportId, async () => {}, pdfFormat);
}
export async function saveSessionFile(input: Uint8Array, filename: string, options: SaveOptions): Promise<ExportResult> {
  const exportId = crypto.randomUUID();
  const bytes = new Uint8Array(input);
  if (!filename.endsWith('.wcp.json') || /[\\/\u0000]/.test(filename) || !bytes.byteLength || bytes.byteLength > 16 * 1024 * 1024) return { state: 'failed', exportId, error: '저장할 파일을 확인하지 못했습니다.' };
  let prepared = false, createdAt = 0;
  const audit = options.audit;
  try {
    if (audit) {
      const bundle = decodeSessionBundle(bytes);
      if (bundle.session.id !== audit.sessionId || bundle.session.revision !== audit.revision) throw new Error('저장할 수업과 revision이 일치하지 않습니다.');
    }
  } catch { return { state: 'failed', exportId, error: '저장할 수업과 편집정보를 확인하지 못했습니다.' }; }
  async function prepare() {
    if (!audit) return;
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
    const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
    createdAt = Date.now();
    try {
      await audit.journal.prepare({ exportId, sessionId: audit.sessionId, revision: audit.revision, bytes: bytes.length, sha256, createdAt });
    } catch { throw new Error('저장 준비 기록을 남기지 못했습니다. 편집정보는 유지했습니다.'); }
    prepared = true;
  }
  // Invoke the picker before any hashing/storage await, preserving the user's gesture.
  const result = await writeLocalFile(bytes, filename, options, exportId, prepare, sessionFormat);
  if (!audit || !prepared) return result;
  const completedAt = Math.max(createdAt, Date.now());
  const outcome: SaveOutcome = result.state !== 'complete' ? { state: result.state, completedAt }
    : result.transport === 'downloads' ? { state: 'complete', completedAt, transport: 'downloads', downloadId: result.downloadId }
      : { state: 'complete', completedAt, transport: 'filesystem' };
  try {
    await audit.journal.finish(exportId, outcome);
    return result.state === 'complete' ? { ...result, journal: 'recorded' } : result;
  } catch {
    return result.state === 'complete' ? { ...result, journal: 'unrecorded' } : result;
  }
}
async function writeLocalFile(bytes: Uint8Array<ArrayBuffer>, filename: string, options: SaveOptions,
  exportId: string, prepare: () => Promise<void>, format: FileFormat): Promise<ExportResult> {
  if (options.picker) {
    let writer: FileSystemWritableFileStream | undefined;
    try {
      const handle = await options.picker({ suggestedName: filename, excludeAcceptAllOption: true,
        types: [{ description: format.description, accept: { [format.mime]: [format.suffix] } }] });
      if (!handle.name.toLowerCase().endsWith(format.suffix)) throw new Error(`새 ${format.suffix} 파일로 저장하세요.`);
      if ((await handle.getFile()).size !== 0) throw new Error('기존 파일은 덮어쓰지 않습니다. 새 이름을 선택하세요.');
      await prepare();
      writer = await handle.createWritable({ keepExistingData: false });
      await writer.write(bytes as Uint8Array<ArrayBuffer>); await writer.close(); writer = undefined;
      const readback = new Uint8Array(await (await handle.getFile()).arrayBuffer());
      if (readback.length !== bytes.length || !readback.every((byte, index) => byte === bytes[index])) throw new Error('파일을 다시 읽어 저장 내용을 확인하지 못했습니다.');
      return { state: 'complete', exportId, transport: 'filesystem', filename: handle.name, bytes: bytes.length };
    } catch (error) {
      try { await writer?.abort(); } catch { /* The close may already have failed. */ }
      return error instanceof DOMException && error.name === 'AbortError' ? { state: 'cancelled', exportId }
        : { state: 'failed', exportId, error: error instanceof Error ? error.message : '파일 저장을 확인하지 못했습니다.' };
    }
  }
  const downloads = options.downloads;
  if (!downloads || !options.extensionId) return { state: 'failed', exportId, error: '웨일 파일 저장 API를 사용할 수 없습니다. 기존 편집은 유지했습니다.' };
  try { await prepare(); } catch { return { state: 'failed', exportId, error: '저장 준비 기록을 남기지 못해 다운로드를 시작하지 않았습니다. 편집정보는 유지했습니다.' }; }
  const blob = new Blob([bytes as Uint8Array<ArrayBuffer>], { type: format.mime }); const url = URL.createObjectURL(blob);
  return new Promise(resolve => {
    let id: number | undefined, settled = false, checking = false;
    let timeout: ReturnType<typeof setTimeout> | undefined, poll: ReturnType<typeof setInterval> | undefined;
    function finish(result: ExportResult) {
      if (settled) return; settled = true;
      if (timeout) clearTimeout(timeout); if (poll) clearInterval(poll);
      downloads!.onChanged.removeListener(changed); URL.revokeObjectURL(url); resolve(result);
    }
    async function inspect() {
      if (id === undefined || settled || checking) return; checking = true;
      try {
        const [item] = await downloads!.search({ id });
        if (!item) return;
        if (item.byExtensionId !== options.extensionId || item.url !== url) { finish({ state: 'failed', exportId, error: '요청한 다운로드를 확인하지 못했습니다.' }); return; }
        if (item.state === 'interrupted') finish(item.error === 'USER_CANCELED' ? { state: 'cancelled', exportId }
          : { state: 'failed', exportId, error: '다운로드가 중단되었습니다. 편집정보는 유지했습니다.' });
        else if (item.state === 'complete') {
          if (!item.exists || item.fileSize !== bytes.length || item.bytesReceived !== bytes.length) finish({ state: 'failed', exportId, error: '다운로드 파일의 저장 완료를 확인하지 못했습니다.' });
          else finish({ state: 'complete', exportId, transport: 'downloads', filename: item.filename, downloadId: id, bytes: bytes.length });
        }
      } catch { finish({ state: 'failed', exportId, error: '다운로드 상태를 확인하지 못했습니다. 기존 편집은 유지했습니다.' }); }
      finally { checking = false; }
    }
    function changed(delta: chrome.downloads.DownloadDelta) { if (delta.id === id) void inspect(); }
    downloads.onChanged.addListener(changed);
    void Promise.resolve().then(() => downloads.download({ url, filename, saveAs: true, conflictAction: 'uniquify' })).then(downloadId => {
      if (!Number.isSafeInteger(downloadId) || downloadId < 0) { finish({ state: 'failed', exportId, error: '다운로드 요청 ID를 확인하지 못했습니다.' }); return; }
      id = downloadId;
      timeout = setTimeout(() => finish({ state: 'failed', exportId, error: '저장 완료를 제한 시간 안에 확인하지 못했습니다. 웨일 다운로드에서 상태를 확인하세요.' }), options.timeoutMs ?? 300000);
      poll = setInterval(() => void inspect(), 1000); void inspect();
    }).catch(error => finish(error instanceof DOMException && error.name === 'AbortError' ? { state: 'cancelled', exportId }
      : { state: 'failed', exportId, error: '파일 저장이 취소되었거나 시작되지 않았습니다. 기존 편집은 유지했습니다.' }));
  });
}
