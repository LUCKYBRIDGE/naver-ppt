import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { PreflightReport } from '../preflight/check';
import { PreflightResults } from './PreflightResults';

export function PptxInspectionControls({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [report, setReport] = useState<PreflightReport | null>(null), [busy, setBusy] = useState(false);
  const [name, setName] = useState(''), [status, setStatus] = useState('');
  const [inspectModel, setInspectModel] = useState(false);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => {
    setReport(null); setBusy(false); setName(''); setStatus('');
    return () => { operation.current?.abort(); operation.current = null; };
  }, [sessionId]);
  async function inspect(file: File) {
    operation.current?.abort();
    const controller = new AbortController(); operation.current = controller;
    setReport(null); setName(file.name); setBusy(true); setStatus('원본 구조를 점검 중입니다.');
    try {
      const { inspectPptxFile } = await import('../adapters/pptx/fileInspection');
      if (controller.signal.aborted) return;
      const result = await inspectPptxFile(file, controller.signal, inspectModel);
      if (operation.current === controller && !controller.signal.aborted) { setReport(result); setStatus('원본 구조 점검을 마쳤습니다. 화면 충실도와 발표 동작은 미확인입니다.'); }
    } catch {
      if (operation.current === controller && !controller.signal.aborted) setStatus('원본 구조를 점검하지 못했습니다. 파일 형식·크기·손상 여부를 확인하세요. 발표 화면은 유지했습니다.');
    } finally { if (operation.current === controller) { operation.current = null; setBusy(false); } }
  }
  return <section className="preflight-controls pptx-file-inspection" aria-label="PPTX 원본 점검">
    <h2>PPTX 원본 점검</h2>
    <label htmlFor="pptx-inspection-file">PPTX 파일</label>
    <label><input type="checkbox" checked={inspectModel} disabled={disabled || busy} onChange={event => { setInspectModel(event.target.checked); setReport(null); setStatus(''); }} /> 후보 모델 검사</label>
    <input id="pptx-inspection-file" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={disabled} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (file) void inspect(file);
    }} />
    {name && <p className="inspection-filename">{name}</p>}
    {busy && <div className="control-actions"><button title="원본 점검 취소" aria-label="원본 점검 취소" onClick={() => {
      operation.current?.abort(); operation.current = null; setBusy(false); setReport(null); setStatus('원본 점검을 취소했습니다. 발표 화면은 유지했습니다.');
    }}><X size={20} aria-hidden="true" /></button></div>}
    <p role="status" aria-live="polite">{status}</p>
    {report && <PreflightResults report={report} />}
  </section>;
}
