import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import type { ClassSession } from '../core/types';
import { pdfCopyFilename, pdfFormat, savePdfFile, savePicker } from '../export/localFile';
import { sourceVault, sourceKey } from '../storage/sourceVault';
import { extensionApi } from '../shared/extensionApi';

export function PdfExportControls({ session, documentId, disabled, onWorking }: {
  session: ClassSession; documentId: string; disabled: boolean; onWorking: (working: boolean) => void;
}) {
  const [working, setWorking] = useState(false), [generating, setGenerating] = useState(false), [status, setStatus] = useState('');
  const abort = useRef<AbortController | null>(null), latestRevision = useRef(session.revision); latestRevision.current = session.revision;
  useEffect(() => { onWorking(working); return () => onWorking(false); }, [working, onWorking]);
  useEffect(() => {
    if (!working) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [working]);
  async function save() {
    if (working || disabled) return;
    const captured = structuredClone(session.documents[documentId]), revision = session.revision, sessionId = session.id;
    if (!captured || captured.source.type !== 'pdf' || !captured.source.fingerprint) return;
    const filename = pdfCopyFilename(captured.source.name, revision), controller = new AbortController(); abort.current = controller;
    setWorking(true); setStatus(`PDF r${revision} 저장 위치 확인 중`);
    try {
      // Select the output while the click's transient activation is still available.
      const picker = savePicker(), handle = picker ? await picker({ suggestedName: filename, excludeAcceptAllOption: true,
        types: [{ description: pdfFormat.description, accept: { [pdfFormat.mime]: [pdfFormat.suffix] } }] }) : undefined;
      if (handle && (!handle.name.toLowerCase().endsWith('.pdf') || (await handle.getFile()).size !== 0)) throw new Error('기존 파일은 덮어쓰지 않습니다. 새 .pdf 이름을 선택하세요.');
      setGenerating(true);
      const source = await sourceVault().get(sourceKey(sessionId, captured.id), captured.source.fingerprint, controller.signal);
      const { createPdfCopyFromFile } = await import('../export/pdfCopyCanvas');
      const bytes = await createPdfCopyFromFile(source.file, captured, { signal: controller.signal,
        onProgress: (done, total) => setStatus(`PDF r${revision} 생성 중 · ${done}/${total}페이지`) });
      setGenerating(false); setStatus(`PDF r${revision} 파일 저장 확인 중`);
      const api = extensionApi(), result = await savePdfFile(bytes, filename, { picker: handle ? async () => handle : undefined,
        downloads: api?.downloads, extensionId: api?.runtime.id });
      setStatus(result.state === 'complete' ? `PDF 수정본 r${revision} 저장 완료${latestRevision.current !== revision ? ' · 이후 변경은 추가 저장이 필요합니다.' : ''}`
        : result.state === 'cancelled' ? 'PDF 저장을 취소했습니다. 편집정보는 유지했습니다.' : result.error);
    } catch (error) {
      setStatus(error instanceof DOMException && error.name === 'AbortError' ? 'PDF 저장을 취소했습니다. 편집정보는 유지했습니다.'
        : error instanceof Error ? error.message : 'PDF 저장을 확인하지 못했습니다. 편집정보는 유지했습니다.');
    } finally { abort.current = null; setWorking(false); setGenerating(false); }
  }
  return <section className="session-save" aria-label="PDF 수정본 로컬 저장">
    <div className="control-actions"><button disabled={disabled || working} onClick={() => void save()}><Download size={20} aria-hidden="true" /> PDF 수정본 저장</button>
      {working && generating && <button title="PDF 생성 취소" onClick={() => abort.current?.abort()}><X size={20} aria-hidden="true" /> 생성 취소</button>}</div>
    <p>확정된 글상자·판서·가리개만 저장합니다. 노트·수업 기록·미디어·타이머는 포함하지 않습니다. 오버레이 글씨는 이미지로 저장됩니다.</p>
    <p>가리개는 원본 내용을 삭제하지 않습니다. 개인정보를 지우는 용도로 사용하지 마세요.</p>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
