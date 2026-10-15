import { useEffect, useState } from 'react';
import type { ClassSession } from '../core/types';
import type { SessionCommand } from '../core/commands';
import { effectChannel, effectMessages, readEffectFeedback, type EffectFeedback } from '../shared/pptxEffectStatus';

export function PptxEffectControls({ session, disabled, execute }: { session: ClassSession; disabled: boolean; execute(command: SessionCommand): Promise<void> }) {
  const selection = session.presentedSelection, document = selection && session.documents[selection.documentId];
  const slideId = selection?.slideId, documentId = document?.id;
  const [feedback, setFeedback] = useState<EffectFeedback | null>(null);
  useEffect(() => {
    setFeedback(null);
    if (!documentId || !slideId || document?.source.type !== 'pptx') return;
    const channel = effectChannel(session.id, documentId, slideId);
    channel.onmessage = event => { const value = readEffectFeedback(event.data); if (value && value.revision >= session.revision) setFeedback(value); };
    channel.postMessage('query');
    return () => channel.close();
  }, [session.id, session.revision, documentId, slideId, document?.source.type]);
  if (!document || document.source.type !== 'pptx' || !slideId) return null;
  const pending = !!document.pptxPlayback?.request, running = !!document.pptxPlayback?.run;
  function send(type: 'REQUEST_PPTX_GROUP' | 'CANCEL_PPTX_GROUP') {
    void execute({ type, sessionId: session.id, revision: session.revision, documentId: documentId!, slideId: slideId!, commandId: crypto.randomUUID() });
  }
  return <section aria-label="PPTX 효과 제어">
    <h2>PPTX 효과 · 실험적</h2>
    <p role="status">{feedback ? effectMessages[feedback.status] : running ? '재생 요청이 진행 중입니다. 새 발표 창에서는 취소 후 다시 요청하세요.' : pending ? '요청이 대기 중입니다. 이전 요청은 취소 후 다시 요청하세요.' : '발표 창의 효과 준비 상태를 확인하고 있습니다.'}</p>
    {feedback?.status === 'failed' && !pending && !running && <p>원본 연결과 미디어 재생 구간을 확인하세요. 완료한 효과와 편집 내용은 유지됩니다.</p>}
    <div className="control-actions">
      <button disabled={disabled || pending || running || !feedback || ['loading', 'failed', 'exhausted'].includes(feedback.status)} onClick={() => send('REQUEST_PPTX_GROUP')}>다음 PPTX 효과</button>
      <button disabled={disabled || (!pending && !running)} onClick={() => send('CANCEL_PPTX_GROUP')}>PPTX 효과 취소</button>
    </div>
    <p>원본 충실도와 내장 미디어는 미확인입니다. 취소해도 완료한 효과는 유지합니다.</p>
  </section>;
}
