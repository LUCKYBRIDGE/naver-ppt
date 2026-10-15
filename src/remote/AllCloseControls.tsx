import { useEffect, useRef, useState } from 'react';
import { SquareX, X } from 'lucide-react';
import type { ClassSession } from '../core/types';
import type { CloseChoice, CloseOutcome } from '../shared/sessionMessages';
import { sendSessionRequest } from '../shared/sessionClient';
import { SessionSaveControls } from '../editor/SessionSaveControls';
import { MAX_BUNDLE_BYTES } from '../storage/sessionBundle';

export function AllCloseControls({ session, disabled }: { session: ClassSession; disabled: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), latestRevision = useRef(session.revision); latestRevision.current = session.revision;
  const [review, setReview] = useState<ClassSession | null>(null), [choices, setChoices] = useState<Record<string, CloseChoice['decision']>>({});
  const [backup, setBackup] = useState<File | null>(null), [busy, setBusy] = useState(false), [saving, setSaving] = useState(false);
  const [results, setResults] = useState<CloseOutcome[] | null>(null), [resultRevision, setResultRevision] = useState<number | null>(null), [status, setStatus] = useState('');
  const opened = session.documentOrder.filter(id => !session.documents[id]?.closed);
  const ids = review?.documentOrder.filter(id => !review.documents[id]?.closed) ?? [];
  const hasSaved = ids.some(id => choices[id] === 'saved'), stale = !!review && review.revision !== session.revision;
  useEffect(() => {
    if (!review) return;
    dialog.current?.showModal(); return () => { dialog.current?.close(); };
  }, [review]);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  function begin() {
    setReview(structuredClone(session)); setChoices(Object.fromEntries(opened.map(id => [id, session.documents[id]?.dirty ? 'saved' : 'unchanged'])));
    setBackup(null); setResults(null); setResultRevision(null); setStatus('');
  }
  async function confirm() {
    if (!review || busy || saving || stale || results) return;
    if (hasSaved && (!backup || !backup.size || backup.size > MAX_BUNDLE_BYTES)) { setStatus('확인할 수업 편집정보 파일은 16MB까지 선택하세요.'); return; }
    setBusy(true); setStatus('전체 종료 확인 중');
    const url = hasSaved && backup ? URL.createObjectURL(backup) : null;
    try {
      const result = await sendSessionRequest({ type: 'CLOSE_ALL_DOCUMENTS', sessionId: review.id, revision: review.revision, commandId: crypto.randomUUID(),
        choices: ids.map(documentId => ({ documentId, decision: choices[documentId]! })), blobUrl: url });
      if (result.ok && result.kind === 'close-all') {
        const closed = result.results.filter(item => item.state === 'closed').length;
        setResults(result.results); setResultRevision(result.revision); setStatus(`${closed}개 종료 · ${result.results.length - closed}개 유지`);
        if (closed === result.results.length) setReview(null);
      } else setStatus(!result.ok ? result.error : '전체 종료 결과를 확인하지 못했습니다.');
    } catch { setStatus('전체 종료를 확인하지 못했습니다. 자료를 유지했습니다.'); }
    finally { if (url) URL.revokeObjectURL(url); setBusy(false); }
  }
  return <section className="all-close" aria-label="전체 자료 종료">
    <button disabled={disabled || busy || !opened.length} onClick={begin}><SquareX size={18} aria-hidden="true" /> 전체 자료 종료</button>
    {!review && <p role="status">{status}</p>}
    <dialog ref={dialog} aria-labelledby="all-close-title" onCancel={event => { if (busy || saving) event.preventDefault(); else setReview(null); }}>
      {review && <>
        <div className="dialog-heading"><h2 id="all-close-title">전체 자료 종료</h2><button aria-label="전체 종료 취소" title="취소" disabled={busy || saving} onClick={() => setReview(null)}><X size={18} /></button></div>
        <p>열린 자료 {ids.length}개</p>
        <p>저장 파일에는 수업 전체의 확정 편집정보가 포함됩니다. 미확정 초안은 포함되지 않으며 편집창에 남습니다.</p>
        {ids.map(id => {
          const doc = review.documents[id]!, outcome = results?.find(item => item.documentId === id);
          return <div className="close-choice-row" key={id}>
            <label htmlFor={`close-choice-${id}`}>{'name' in doc.source ? doc.source.name : doc.source.title}</label>
            <select id={`close-choice-${id}`} data-document-id={id} value={choices[id]} disabled={busy || saving || stale || !!results}
              onChange={event => setChoices(previous => ({ ...previous, [id]: event.target.value as CloseChoice['decision'] }))}>
              <option value="saved">편집정보 저장 확인 후 종료</option><option value="without-backup">저장 확인 없이 종료</option>
              {!doc.dirty && <option value="unchanged">변경 없는 자료 종료</option>}
            </select>
            {outcome && <p>{outcome.state === 'closed' ? '종료됨' : outcome.error ?? '유지됨'}</p>}
          </div>;
        })}
        {hasSaved && !results && <>
          <SessionSaveControls session={review} disabled={busy || stale} onWorking={setSaving} />
          <label htmlFor="all-close-backup">수업 전체 편집정보 파일</label>
          <input id="all-close-backup" type="file" accept=".wcp.json,application/json" disabled={busy || saving || stale} onChange={event => setBackup(event.target.files?.[0] ?? null)} />
        </>}
        <p>임시 복구 데이터와 원본 파일은 삭제하지 않습니다. 저장 확인에 실패한 자료는 유지됩니다.</p>
        {stale && !results && <p role="alert">수업 상태가 바뀌었습니다. 취소 후 다시 확인하세요.</p>}
        <p role="status">{status}</p>
        <div className="control-actions">
          {results ? <button disabled={busy || saving || resultRevision !== latestRevision.current} onClick={begin}>남은 자료 다시 확인</button>
            : <button disabled={busy || saving || stale || hasSaved && !backup} onClick={() => void confirm()}>전체 종료 확정</button>}
          <button disabled={busy || saving} onClick={() => setReview(null)}>{results ? '닫기' : '취소'}</button>
        </div>
      </>}
    </dialog>
  </section>;
}
