import { useEffect, useRef, useState } from 'react';
import { Square, X } from 'lucide-react';
import type { ClassSession } from '../core/types';
import { SessionSaveControls } from '../editor/SessionSaveControls';
import { sendSessionRequest } from '../shared/sessionClient';
import { MAX_BUNDLE_BYTES } from '../storage/sessionBundle';

export function CurrentCloseControls({ session, disabled }: { session: ClassSession; disabled: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [review, setReview] = useState<ClassSession | null>(null), [decision, setDecision] = useState<'saved' | 'without-backup' | 'unchanged'>('saved');
  const [backup, setBackup] = useState<File | null>(null), [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const current = session.presentedSelection && session.documents[session.presentedSelection.documentId];
  const target = review?.presentedSelection && review.documents[review.presentedSelection.documentId];
  const stale = review !== null && review.revision !== session.revision;
  useEffect(() => {
    if (!review) return;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); };
  }, [review]);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [busy]);
  function begin() {
    setReview(structuredClone(session)); setBackup(null); setStatus(''); setDecision(current?.dirty ? 'saved' : 'unchanged');
  }
  async function confirm() {
    if (!review || !target || stale || busy || saving) return;
    if (decision === 'saved' && (!backup || !backup.size || backup.size > MAX_BUNDLE_BYTES)) { setStatus('확인할 편집정보 파일은 16MB까지 선택하세요.'); return; }
    setBusy(true); setStatus('종료 확인 중');
    const url = decision === 'saved' && backup ? URL.createObjectURL(backup) : null;
    try {
      const result = await sendSessionRequest({ type: 'CLOSE_CURRENT_DOCUMENT', decision, blobUrl: url,
        command: { type: 'CLOSE_DOCUMENT', sessionId: review.id, documentId: target.id, slideId: null, revision: review.revision, commandId: crypto.randomUUID() } });
      if (result.ok) { setReview(null); setStatus('현재 자료의 발표를 종료했습니다.'); }
      else setStatus(result.error);
    } catch { setStatus('종료를 확인하지 못했습니다. 현재 자료를 유지했습니다.'); }
    finally { if (url) URL.revokeObjectURL(url); setBusy(false); }
  }
  return <section className="current-close" aria-label="현재 자료 종료">
    <button disabled={disabled || busy || !current} onClick={begin}><Square size={18} aria-hidden="true" /> 현재 자료 종료</button>
    {!review && <p role="status">{status}</p>}
    <dialog ref={dialog} aria-labelledby="close-title" onCancel={event => { if (busy || saving) event.preventDefault(); else setReview(null); }}>
      {review && target && <>
        <div className="dialog-heading"><h2 id="close-title">현재 자료 종료</h2><button title="취소" aria-label="종료 취소" disabled={busy || saving} onClick={() => setReview(null)}><X size={18} /></button></div>
        <p>{'name' in target.source ? target.source.name : target.source.title}</p>
        <p>편집창의 미확정 내용은 저장 파일에 포함되지 않습니다. 편집창과 초안은 유지됩니다.</p>
        <fieldset disabled={busy || saving || stale}>
          <legend>저장 선택</legend>
          {!target.dirty && <label><input type="radio" name="close-decision" checked={decision === 'unchanged'} onChange={() => setDecision('unchanged')} /> 변경 없는 자료 종료</label>}
          <label><input type="radio" name="close-decision" checked={decision === 'saved'} onChange={() => setDecision('saved')} /> 확정 편집정보 저장 후 종료</label>
          <label><input type="radio" name="close-decision" checked={decision === 'without-backup'} onChange={() => setDecision('without-backup')} /> 새 백업 없이 종료</label>
        </fieldset>
        {decision === 'saved' && <>
          <SessionSaveControls session={review} disabled={busy || stale} onWorking={setSaving} />
          <label htmlFor="close-backup-file">종료에 사용할 저장 파일</label>
          <input id="close-backup-file" type="file" accept=".wcp.json,application/json" disabled={busy || saving || stale} onChange={event => { setBackup(event.target.files?.[0] ?? null); }} />
        </>}
        {decision === 'without-backup' && <p>새 로컬 백업은 만들지 않습니다. 임시 복구 데이터와 원본 파일은 삭제하지 않습니다.</p>}
        {stale && <p role="alert">수업 상태가 바뀌었습니다. 취소 후 다시 종료하세요.</p>}
        <p role="status">{status}</p>
        <div className="control-actions"><button disabled={busy || saving || stale || decision === 'saved' && !backup} onClick={() => void confirm()}>종료 확정</button>
          <button disabled={busy || saving} onClick={() => setReview(null)}>취소</button></div>
      </>}
    </dialog>
  </section>;
}
