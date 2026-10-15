import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import type { SessionResponse } from '../shared/sessionMessages';
import { sendSessionRequest } from '../shared/sessionClient';
import { sceneKey } from './preparedScene';

type Receive = (response: Extract<SessionResponse, { ok: true; kind: 'teacher' | 'player' }>) => void;
export function usePresentationStage(state: PlayerSnapshot | null, owned: boolean, playerId: string | null, receive: Receive) {
  const [target, setTarget] = useState<PlayerSnapshot | null>(null);
  const job = useRef<{ key: string; resolve: () => void; reject: (error: unknown) => void } | null>(null);
  const requestId = owned && state?.presentationTransition?.playerId === playerId ? state.presentationTransition.requestId : null;
  const sessionId = state?.sessionId;
  const onPrepared = useCallback((key: string, error?: unknown) => {
    if (job.current?.key !== key) return;
    if (error) job.current.reject(error); else job.current.resolve();
  }, []);
  useEffect(() => {
    if (!requestId || !sessionId || !playerId) return;
    const controller = new AbortController();
    const commandId = crypto.randomUUID();
    const read = async () => {
      const response = await sendSessionRequest({ type: 'GET_SESSION', sessionId });
      if (!response.ok || response.kind !== 'player') throw Error('TRANSITION_STATE_UNAVAILABLE');
      if (!controller.signal.aborted) receive(response);
      return response.snapshot;
    };
    const pause = () => new Promise<void>(resolve => {
      const done = () => { clearTimeout(timer); controller.signal.removeEventListener('abort', done); resolve(); };
      const timer = setTimeout(done, 250); controller.signal.addEventListener('abort', done, { once: true });
    });
    // On an uncertain acknowledgement retain both surfaces and reconcile durable state.
    async function settle(type: 'COMMIT_PRESENTATION' | 'REJECT_PRESENTATION') {
      while (!controller.signal.aborted) {
        try {
          const current = await read(), pending = current.presentationTransition;
          if (controller.signal.aborted || pending?.requestId !== requestId || pending.playerId !== playerId) return;
          const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type, sessionId: sessionId!, playerId: playerId!,
            documentId: pending.documentId, slideId: pending.slideId, requestId: requestId!, revision: current.revision, commandId } });
          if (result.ok && result.kind === 'player') { if (!controller.signal.aborted) receive(result); return; }
          if (!result.ok && result.code !== 'STALE_REVISION' && result.code !== 'PERSISTENCE_FAILED') { await read(); return; }
        } catch { /* A lost response is not proof that the durable commit failed. */ }
        if (!controller.signal.aborted) await pause();
      }
    }
    void (async () => {
      try {
        const response = await sendSessionRequest({ type: 'GET_PRESENTATION_TARGET', sessionId, requestId, playerId });
        if (controller.signal.aborted) return;
        if (!response.ok || response.kind !== 'transition-target' || response.requestId !== requestId || response.target.sessionId !== sessionId) throw Error('TRANSITION_TARGET_UNAVAILABLE');
        const prepared = new Promise<void>((resolve, reject) => { job.current = { key: sceneKey(response.target), resolve, reject }; });
        // Attach rejection handling before the prepared scene can report a media failure.
        const ready = prepared.then(() => true, () => false);
        setTarget(response.target);
        const abort = () => job.current?.reject(new DOMException('Cancelled', 'AbortError'));
        controller.signal.addEventListener('abort', abort, { once: true });
        const succeeded = await ready; controller.signal.removeEventListener('abort', abort);
        if (!controller.signal.aborted) await settle(succeeded ? 'COMMIT_PRESENTATION' : 'REJECT_PRESENTATION');
      } catch { if (!controller.signal.aborted) await settle('REJECT_PRESENTATION'); }
      finally { if (!controller.signal.aborted) { job.current = null; setTarget(null); } }
    })();
    return () => { controller.abort(); job.current = null; setTarget(null); };
  }, [sessionId, requestId, playerId, receive]);
  return { target, onPrepared };
}
