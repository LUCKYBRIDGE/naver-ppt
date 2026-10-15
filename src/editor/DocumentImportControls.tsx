import { useEffect, useRef, useState } from 'react';
import type { ClassSession } from '../core/types';
import { documentPicker, prepareDocumentImport } from '../adapters/documentImport';
import { sendSessionRequest } from '../shared/sessionClient';
import type { PreflightReport } from '../preflight/check';
import { PreflightResults } from './PreflightResults';
import { registerPreparedDocument } from './registerDocument';

export function DocumentImportControls({ session, disabled, onStatus }:
  { session: ClassSession; disabled: boolean; onStatus: (message: string) => void }) {
  const [working, setWorking] = useState(false), [experimentalPptx, setExperimentalPptx] = useState(false);
  const picker = documentPicker(experimentalPptx), active = useRef<AbortController | null>(null), currentId = useRef(session.id);
  currentId.current = session.id;
  const [reports, setReports] = useState<{ name: string; report: PreflightReport }[]>([]);
  useEffect(() => { setReports([]); setExperimentalPptx(false); return () => active.current?.abort(); }, [session.id]);
  const selected = session.editorSelection ? session.documents[session.editorSelection.documentId] : undefined;
  async function add(files: { file: File; handle?: FileSystemFileHandle }[], reconnect?: string) {
    setWorking(true); setReports([]);
    const controller = new AbortController(); active.current = controller;
    let current = session;
    try {
      if (files.length > 16 || (reconnect && files.length !== 1)) throw new Error('자료는 한 번에 16개까지, 재연결은 원본 1개를 선택하세요.');
      for (const { file, handle } of files) {
        const prepared = await prepareDocumentImport(file, current, { experimentalPptx, signal: controller.signal,
          ...(handle ? { handle } : {}), ...(reconnect ? { reconnectDocumentId: reconnect } : {}) });
        if (controller.signal.aborted || currentId.current !== session.id) throw new DOMException('Cancelled', 'AbortError');
        if (!prepared.reused) {
          current = await registerPreparedDocument(current.id, prepared.document, controller.signal, sendSessionRequest);
        }
        setReports(previous => [...previous.filter(item => item.report.documentId !== prepared.document.id), { name: file.name, report: prepared.preflight }]);
      }
      onStatus(reconnect ? '같은 원본을 다시 연결했습니다.' : '자료를 등록했습니다. 발표 화면은 그대로 유지했습니다.');
    } catch (failure) { if (currentId.current === session.id) onStatus(controller.signal.aborted ? '원본 확인을 취소했습니다. 이미 등록된 자료는 유지했습니다.' : failure instanceof Error ? failure.message : '자료를 등록하지 못했습니다. 원본을 확인하세요.'); }
    finally { if (active.current === controller) active.current = null; setWorking(false); }
  }
  async function pick(reconnect?: string) {
    if (!picker) return;
    setWorking(true);
    try {
      const handles = await picker();
      await add(await Promise.all(handles.map(async handle => ({ handle, file: await handle.getFile() }))), reconnect);
    } catch (failure) {
      onStatus(failure instanceof DOMException && failure.name === 'AbortError' ? '파일 선택을 취소했습니다.' : '파일을 선택하지 못했습니다. 파일 권한을 확인하세요.');
    } finally { setWorking(false); }
  }
  return <section className="import-controls" aria-label="자료 추가와 원본 연결">
    <label><input id="experimental-pptx-import" type="checkbox" checked={experimentalPptx} disabled={disabled || working} onChange={event => setExperimentalPptx(event.target.checked)} />PPTX 실험 사용</label>
    {experimentalPptx && <p>PPTX 원본 충실도·내장 미디어·원본색 추출은 미확인입니다. 원본 앱에서 발표할 대안을 준비하세요.</p>}
    {picker ? <div className="control-actions">
      <button disabled={disabled || working} onClick={() => void pick()}>{experimentalPptx ? 'PDF / PPTX 자료 추가' : 'PDF 자료 추가'}</button>
      <button disabled={disabled || working || !selected} onClick={() => void pick(selected?.id)}>원본 다시 연결</button>
    </div> : <>
      <label htmlFor="pdf-import">{experimentalPptx ? 'PDF / PPTX 자료 추가' : 'PDF 자료 추가'}</label>
      <input id="pdf-import" type="file" accept={experimentalPptx ? '.pdf,.pptx' : '.pdf,application/pdf'} multiple disabled={disabled || working} onChange={event => {
        const files = [...(event.target.files ?? [])].map(file => ({ file })); event.target.value = ''; if (files.length) void add(files);
      }} />
      {selected && <>
        <label htmlFor="pdf-reconnect">선택 자료 원본 다시 연결</label>
        <input id="pdf-reconnect" type="file" accept={experimentalPptx ? '.pdf,.pptx' : '.pdf,application/pdf'} disabled={disabled || working} onChange={event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (file) void add([{ file }], selected.id);
        }} />
      </>}
    </>}
    {working && <><p role="status">원본 확인 중</p><button onClick={() => active.current?.abort()}>원본 확인 취소</button></>}
    {reports.map(item => <details className="registration-preflight" key={item.report.documentId} open><summary>{item.name} · 등록 점검</summary><PreflightResults report={item.report} /></details>)}
  </section>;
}
