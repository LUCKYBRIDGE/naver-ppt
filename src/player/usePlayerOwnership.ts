import { useEffect, useState } from 'react';
import { extensionApi } from '../shared/extensionApi';
export function usePlayerOwnership(sessionId: string | undefined) {
  const [owned, setOwned] = useState(false), [message, setMessage] = useState('발표 창을 확인하고 있습니다.');
  const [playerId, setPlayerId] = useState<string | null>(null);
  useEffect(() => {
    setOwned(false); setPlayerId(null); let stopped = false, retry: ReturnType<typeof setTimeout> | undefined;
    async function claim() {
      if (stopped || !sessionId) return;
      try {
        const result = await extensionApi()?.runtime.sendMessage({ type: 'CLAIM_PLAYER', sessionId });
        if (stopped) return;
        if (result?.ok === true && result.kind === 'player-owner' && typeof result.owned === 'boolean') {
          setOwned(result.owned);
          setPlayerId(typeof result.playerId === 'string' ? result.playerId : null);
          if (result.owned) return;
          setMessage('다른 발표 창이 실행 중입니다.');
        } else setMessage('발표 창을 확인하지 못했습니다. 다시 연결 중입니다.');
      } catch { if (!stopped) setMessage('발표 창을 확인하지 못했습니다. 다시 연결 중입니다.'); }
      if (!stopped) retry = setTimeout(() => void claim(), 2000);
    }
    void claim(); return () => { stopped = true; if (retry) clearTimeout(retry); };
  }, [sessionId]);
  return { owned, message, playerId };
}
