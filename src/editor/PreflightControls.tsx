import { useEffect, useRef, useState } from 'react';
import { ClipboardCheck, X, RefreshCw } from 'lucide-react';
import type { PresentationDocumentState } from '../core/types';
import { checkPreflight, type PreflightReport } from '../preflight/check';
import { browserInspector } from '../preflight/browser';
import { PreflightResults } from './PreflightResults';
export function PreflightControls({ sessionId, document, page, disabled }: { sessionId: string; document: PresentationDocumentState; page: number; disabled: boolean }) {
  const [report, setReport] = useState<PreflightReport | null>(null), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const operation = useRef<AbortController | null>(null);
  const [mode, setMode] = useState<'sample' | 'document'>('sample');
  const target = JSON.stringify([sessionId, document.id, document.source, document.localMedia, page, mode]);
  useEffect(() => { setReport(null); setStatus(''); setBusy(false); return () => { operation.current?.abort(); operation.current = null; }; }, [target]);
  async function inspect(force = false) {
    if (operation.current) return;
    const controller = new AbortController(); operation.current = controller; setBusy(true); setReport(null); setStatus('자료를 점검 중입니다.');
    try { const result = await checkPreflight(document, page, browserInspector(sessionId, (completed, total) => { if (!controller.signal.aborted) setStatus(`페이지 읽기 ${completed}/${total}쪽`); }, force), controller.signal, `${navigator.userAgent}|PDF.js-local`, Date.now(), mode); if (!controller.signal.aborted) { setReport(result); setStatus('점검을 마쳤습니다.'); } }
    catch { if (!controller.signal.aborted) setStatus('점검을 완료하지 못했습니다.'); }
    finally { if (operation.current === controller) { operation.current = null; setBusy(false); } }
  }
  return <section className="preflight-controls" aria-label="발표 전 점검"><h2>발표 전 점검</h2><label htmlFor="preflight-scope">검사 범위</label>
    <select id="preflight-scope" value={mode} disabled={disabled || busy} onChange={event => setMode(event.target.value as typeof mode)}><option value="sample">일부 페이지</option><option value="document">전체 페이지</option></select><div className="control-actions">
    <button title="선택 자료 점검" aria-label="선택 자료 점검" disabled={disabled || busy} onClick={() => void inspect()}><ClipboardCheck size={20} aria-hidden="true" /></button>
    <button title="캐시 없이 다시 검사" aria-label="캐시 없이 다시 검사" disabled={disabled || busy} onClick={() => void inspect(true)}><RefreshCw size={20} aria-hidden="true" /></button>
    {busy && <button title="점검 취소" aria-label="점검 취소" onClick={() => { operation.current?.abort(); operation.current = null; setBusy(false); setStatus('점검을 취소했습니다.'); }}><X size={20} aria-hidden="true" /></button>}</div>
    <p role="status">{status}</p>{report && <PreflightResults report={report} />}
  </section>;
}
