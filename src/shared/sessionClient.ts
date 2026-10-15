import { useCallback, useEffect, useState } from 'react';
import { extensionApi } from './extensionApi';
import type { SessionRequest, SessionResponse } from './sessionMessages';

export async function sendSessionRequest(request: SessionRequest): Promise<SessionResponse> {
  const api = extensionApi();
  if (!api) throw new Error('수업에 연결할 수 없습니다. 웨일에서 다시 열어주세요.');
  const response: SessionResponse | undefined = await api.runtime.sendMessage(request);
  if (!response) throw new Error('수업 응답이 없습니다. 잠시 후 다시 시도하세요.');
  return response;
}

export function useSessionState(kind: 'teacher' | 'player') {
  const sessionId = new URL(location.href).searchParams.get('sessionId');
  const [snapshot, setSnapshot] = useState<Extract<SessionResponse, { ok: true; kind: 'teacher' | 'player' }> | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const receiveSnapshot = useCallback((response: Extract<SessionResponse, { ok: true; kind: 'teacher' | 'player' }>) => {
    if (response.kind !== kind) return;
    const id = response.kind === 'player' ? response.snapshot.sessionId : response.session.id;
    if (id !== sessionId) return;
    setSnapshot(previous => {
      const revision = response.kind === 'player' ? response.snapshot.revision : response.session.revision;
      const before = previous?.kind === 'player' ? previous.snapshot.revision : previous?.session.revision ?? -1;
      return revision >= before ? response : previous;
    });
  }, [kind, sessionId]);
  useEffect(() => {
    const api = extensionApi();
    if (!sessionId || !api) { setError('수업에 연결할 수 없습니다. 수업 목록에서 다시 열어주세요.'); return; }
    let stopped = false;
    let port: chrome.runtime.Port | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    function connect() {
      if (stopped || !api) return;
      try {
        port = api.runtime.connect({ name: 'naver-ppt-session' });
        port.onMessage.addListener((response: SessionResponse) => {
          if (stopped) return;
          if (!response.ok) { setError(response.error); setConnected(false); return; }
          if (response.kind !== kind) return;
          const id = response.kind === 'player' ? response.snapshot.sessionId : response.session.id;
          if (id !== sessionId) return;
          setSnapshot(previous => {
            const revision = response.kind === 'player' ? response.snapshot.revision : response.session.revision;
            const previousRevision = previous?.kind === 'player' ? previous.snapshot.revision : previous?.session.revision ?? -1;
            return revision >= previousRevision ? response : previous;
          });
          setConnected(true); setError('');
        });
        port.onDisconnect.addListener(() => {
          void api.runtime.lastError;
          if (stopped) return;
          setConnected(false); setError('수업에 다시 연결하고 있습니다.');
          retry = setTimeout(connect, 1000);
        });
      } catch {
        setConnected(false); setError('수업에 다시 연결하고 있습니다.'); retry = setTimeout(connect, 1000);
      }
    }
    connect();
    return () => { stopped = true; if (retry) clearTimeout(retry); port?.disconnect(); };
  }, [sessionId, kind]);
  return { sessionId, snapshot, connected, error, setError, receiveSnapshot };
}
