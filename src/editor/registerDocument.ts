import type { ClassSession, PresentationDocumentState } from '../core/types';
import type { SessionRequest, SessionResponse } from '../shared/sessionMessages';

export async function registerPreparedDocument(sessionId: string, document: PresentationDocumentState, signal: AbortSignal,
  send: (request: SessionRequest) => Promise<SessionResponse>): Promise<ClassSession> {
  const cancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  const commandId = crypto.randomUUID();
  for (let attempt = 0; attempt < 3; attempt++) {
    cancelled();
    const latest = await send({ type: 'GET_SESSION', sessionId });
    cancelled();
    if (!latest.ok) throw Error(latest.error);
    if (latest.kind !== 'teacher' || latest.session.id !== sessionId) throw Error('등록할 수업을 확인하지 못했습니다. 다시 연결하세요.');
    const result = await send({ type: 'SESSION_COMMAND', command: {
      type: 'REGISTER_DOCUMENT', sessionId, documentId: document.id, slideId: null,
      revision: latest.session.revision, commandId, document,
    } });
    // Only an explicit rejected revision is safe to retry. An unknown transport
    // outcome may already be committed and must not become another registration.
    if (!result.ok) {
      if (result.code === 'STALE_REVISION' && attempt < 2) continue;
      throw Error(result.error);
    }
    if (result.kind !== 'teacher' || result.session.id !== sessionId) throw Error('등록 결과를 확인하지 못했습니다. 수업을 다시 연결하세요.');
    return result.session;
  }
  throw Error('등록할 수업을 확인하지 못했습니다. 다시 연결하세요.');
}
