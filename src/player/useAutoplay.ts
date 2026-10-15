import { useEffect } from 'react';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import { elapsedAutoplay, isSupportedAutoplayRule, autoplayDue } from '../media/autoplay';
import { sendSessionRequest } from '../shared/sessionClient';

export function useAutoplay(state: PlayerSnapshot | null, readyKey: string) {
  useEffect(() => {
    const selected = state?.selection, playback = state?.autoplay;
    if (!state || !selected?.slideId || !playback?.checkpoint || playback.checkpoint.paused || playback.rule.mode === 'manual'
      || !isSupportedAutoplayRule(playback.rule) || readyKey !== JSON.stringify([selected.documentId, selected.slideId])) return;
    const epoch = playback.checkpoint.epoch, sessionId = state.sessionId;
    let disposed = false, timer: ReturnType<typeof setTimeout>;
    async function tick() {
      if (disposed) return;
      try {
        const latest = await sendSessionRequest({ type: 'GET_SESSION', sessionId });
        if (disposed || !latest.ok || latest.kind !== 'player') { if (!disposed) timer = setTimeout(tick, 1000); return; }
        const current = latest.snapshot, currentPlayback = current.autoplay;
        if (current.selection?.documentId !== selected!.documentId || current.selection?.slideId !== selected!.slideId
          || currentPlayback?.checkpoint?.epoch !== epoch || currentPlayback.checkpoint.paused) return;
        if (!autoplayDue(currentPlayback.rule, elapsedAutoplay(currentPlayback.checkpoint, Date.now()), currentPlayback.mediaEnded)) { timer = setTimeout(tick, 500); return; }
        const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'ADVANCE_AUTOPLAY', sessionId, documentId: selected!.documentId,
          slideId: selected!.slideId!, epoch, revision: current.revision, commandId: crypto.randomUUID() } });
        if (!disposed) timer = setTimeout(tick, result.ok ? 500 : 1000);
      } catch { if (!disposed) timer = setTimeout(tick, 1000); }
    }
    const remaining = playback.rule.mode === 'media-end' ? playback.mediaEnded === true ? 0 : 500
      : Math.max(0, playback.rule.seconds! * 1000 - elapsedAutoplay(playback.checkpoint, Date.now()));
    timer = setTimeout(tick, Math.max(0, Math.min(remaining, 2147483647)));
    return () => { disposed = true; clearTimeout(timer); };
  }, [state, readyKey]);
}
