import { useEffect, useRef, useState } from 'react';
import { sendSessionRequest, useSessionState } from '../shared/sessionClient';
import type { SessionCommand } from '../core/commands';
import { CurrentCloseControls } from './CurrentCloseControls';
import { AllCloseControls } from './AllCloseControls';
import { AutoplayControls } from './AutoplayControls';
import { MediaControls } from './MediaControls';
import { TimerControls } from './TimerControls';
import { PptxEffectControls } from './PptxEffectControls';
import { preparePresentationCommand, pptxTransitionTarget } from './prepareTransition';

export function Remote() {
  const { snapshot, connected, error, setError, receiveSnapshot } = useSessionState('teacher');
  const session = snapshot?.kind === 'teacher' ? snapshot.session : null;
  const [documentId, setDocumentId] = useState('');
  const [slideId, setSlideId] = useState('');
  const [sending, setBusy] = useState(false), [notice, setNotice] = useState('');
  const pending = session?.presentationTransition;
  const busy = sending || !!pending, preparing = !!pending;
  const previousPending = useRef(pending);
  useEffect(() => {
    const before = previousPending.current; previousPending.current = pending;
    if (pending) setNotice('Player에서 PPTX 전환을 확인하고 있습니다. 현재 학생 화면과 재생은 유지합니다.');
    else if (before) setNotice(session?.presentedSelection?.documentId === before.documentId && session.presentedSelection.slideId === before.slideId
      ? '준비한 페이지로 전환했습니다.' : '전환이 적용되지 않았습니다. 원본 재연결·재검사 또는 기준 PDF·원본 앱 발표를 이용하세요.');
  }, [pending?.requestId, session?.presentedSelection?.documentId, session?.presentedSelection?.slideId]);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => () => { operation.current?.abort(); operation.current = null; }, []);
  const document = session && Object.hasOwn(session.documents, documentId) ? session.documents[documentId] : undefined;
  const presented = session?.presentedSelection;
  const current = session && presented ? session.documents[presented.documentId] : undefined;
  const index = current?.slideIds.indexOf(presented?.slideId ?? '') ?? -1;
  async function execute(command: SessionCommand) {
    if (operation.current) return;
    const controller = new AbortController(); operation.current = controller;
    const checkingPptx = !!(session && command.documentId && session.documents[command.documentId]?.source.type === 'pptx' && ['ACTIVATE_DOCUMENT', 'REOPEN_DOCUMENT', 'GOTO_SLIDE'].includes(command.type));
    let submitted = false;
    setBusy(true);
    try {
      if (session && checkingPptx) {
        setNotice('발표 창을 확인하고 있습니다.');
        const owner = await sendSessionRequest({ type: 'GET_PRESENTATION_OWNER', sessionId: session.id });
        if (!owner.ok || owner.kind !== 'presentation-owner' || !owner.playerId) throw Error('발표 창을 먼저 열고 다시 요청하세요.');
        command = await preparePresentationCommand(session, command, controller.signal, {
          async inspect() { /* The owning Player prepares the actual scene. */ },
          async read() { const latest = await sendSessionRequest({ type: 'GET_SESSION', sessionId: session.id }); if (!latest.ok || latest.kind !== 'teacher') throw Error('PPTX_TRANSITION_TARGET_CHANGED'); return latest.session; },
        });
        const target = pptxTransitionTarget(session, command);
        if (!target) throw Error('PPTX_TRANSITION_TARGET_CHANGED');
        command = { type: 'REQUEST_PRESENTATION', sessionId: session.id, revision: command.revision, commandId: command.commandId,
          documentId: target.document.id, slideId: target.slideId, playerId: owner.playerId };
      }
      if (controller.signal.aborted) return;
      submitted = true;
      const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command });
      if (result.ok && result.kind === 'teacher') receiveSnapshot(result);
      setError(result.ok ? '' : result.error);
    } catch (failure) { setNotice(''); setError(controller.signal.aborted && !submitted ? '전환 확인을 취소했습니다. 현재 학생 화면을 유지했습니다.' : failure instanceof Error && failure.message.includes('발표 창을 먼저') ? failure.message : checkingPptx && !submitted
      ? 'PPTX 전환 준비 또는 대상 확인을 마치지 못했습니다. 현재 학생 화면을 유지했습니다. 원본을 편집창에서 다시 연결하거나 기준 PDF·원본 앱으로 발표하세요. 다시 누르면 재검사합니다.' : failure instanceof Error ? failure.message : '발표 상태를 바꾸지 못했습니다.'); }
    finally { if (operation.current === controller) { operation.current = null; setBusy(false); } }
  }
  async function cancelTransition() {
    operation.current?.abort();
    if (!pending || !session) return;
    const commandId = crypto.randomUUID();
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const latest = await sendSessionRequest({ type: 'GET_SESSION', sessionId: session.id });
        if (!latest.ok || latest.kind !== 'teacher') throw Error('전환 상태를 확인하지 못했습니다.');
        if (latest.session.presentationTransition?.requestId !== pending.requestId) { receiveSnapshot(latest); return; }
        const response = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'CANCEL_PRESENTATION', commandId,
          sessionId: session.id, documentId: pending.documentId, slideId: pending.slideId, requestId: pending.requestId, revision: latest.session.revision } });
        if (response.ok && response.kind === 'teacher') { receiveSnapshot(response); return; }
        if (!response.ok && response.code !== 'STALE_REVISION') throw Error(response.error);
      }
      throw Error('전환 취소 상태를 확인하지 못했습니다. 다시 요청하세요.');
    } catch (failure) { setNotice(failure instanceof Error ? failure.message : '전환 취소 상태를 확인하지 못했습니다.'); }
  }
  const context = session ? { sessionId: session.id, revision: session.revision } : null;
  function move(offset: number) {
    const target = current?.slideIds[index + offset];
    if (!context || !current || !target) return;
    void execute({ ...context, commandId: crypto.randomUUID(), type: 'GOTO_SLIDE', documentId: current.id, slideId: target });
  }
  return (
    <main data-session-revision={session?.revision}>
      <p className="eyebrow">발표 제어</p>
      <h1>{session?.title ?? '수업'}</h1>
      <p>{session?.documentOrder.length ? `열린 자료 ${session.documentOrder.filter(id => !session.documents[id]?.closed).length}개` : '등록된 자료가 없습니다.'}</p>
      <label htmlFor="remote-document">자료</label>
      <select id="remote-document" value={documentId} disabled={!connected || busy} onChange={event => {
        setDocumentId(event.target.value);
        const doc = session?.documents[event.target.value]; setSlideId(doc?.lastSlideId ?? doc?.slideIds[0] ?? '');
      }}>
        <option value="">자료 선택</option>
        {session?.documentOrder.map(id => <option key={id} value={id}>{session.documents[id]?.closed ? '[종료] ' : ''}{session.documents[id]?.source.type && 'name' in session.documents[id]!.source ? session.documents[id]!.source.name : id}</option>)}
      </select>
      <button disabled={!connected || busy || !document || !context} onClick={() => {
        if (context && document) void execute({ ...context, commandId: crypto.randomUUID(), type: document.closed ? 'REOPEN_DOCUMENT' : 'ACTIVATE_DOCUMENT', documentId: document.id, slideId: null });
      }}>{document?.closed ? '다시 발표' : '자료 발표'}</button>
      <label htmlFor="remote-slide">페이지</label>
      <select id="remote-slide" value={slideId} disabled={!connected || busy || !document} onChange={event => setSlideId(event.target.value)}>
        <option value="">페이지 선택</option>
        {document?.slideIds.map((id, i) => <option key={id} value={id}>{i + 1}페이지</option>)}
      </select>
      <button disabled={!connected || busy || !slideId || !document || document.closed && document.source.type !== 'pptx'} onClick={() => {
        if (context) void execute({ ...context, commandId: crypto.randomUUID(), type: presented?.documentId === documentId ? 'GOTO_SLIDE' : 'ACTIVATE_DOCUMENT', documentId, slideId });
      }}>선택 페이지 발표</button>
      <div className="control-actions">
        <button disabled={!connected || busy || index <= 0} onClick={() => move(-1)}>이전 페이지</button>
        <button disabled={!connected || busy || !current || index < 0 || index >= current.slideIds.length - 1} onClick={() => move(1)}>다음 페이지</button>
      </div>
      <p role="status" aria-live="polite">{error || notice || (connected ? '수업 연결됨' : '연결 확인 중')}</p>
      {preparing && <button onClick={() => void cancelTransition()}>전환 확인 취소</button>}
      {session && <AutoplayControls session={session} disabled={!connected || busy} execute={execute} />}
      {session && <PptxEffectControls session={session} disabled={!connected || busy} execute={execute} />}
      {session && <MediaControls session={session} disabled={!connected || busy} execute={execute} />}
      {session && <TimerControls session={session} disabled={!connected || busy} execute={execute} />}
      {session && <CurrentCloseControls session={session} disabled={!connected || busy} />}
      {session && <AllCloseControls session={session} disabled={!connected || busy} />}
    </main>
  );
}
