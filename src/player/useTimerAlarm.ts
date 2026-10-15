import { useEffect, useRef, useState } from 'react';
import type { TimerState } from '../media/types';
import { sendSessionRequest } from '../shared/sessionClient';
import { playTimerSound } from './timerSound';
export function useTimerAlarm(sessionId: string, timer: TimerState) {
  const [blocked, setBlocked] = useState(false), [busy, setBusy] = useState(false);
  const audio = useRef<AbortController | null>(null);
  async function play() {
    if (audio.current) return;
    const controller = new AbortController(); audio.current = controller; setBusy(true);
    try { await playTimerSound(controller.signal); if (!controller.signal.aborted) setBlocked(false); }
    catch { if (!controller.signal.aborted) setBlocked(true); }
    finally { if (audio.current === controller) audio.current = null; if (!controller.signal.aborted) setBusy(false); }
  }
  useEffect(() => {
    setBlocked(false); setBusy(false);
    if (!timer.sound || !timer.epoch || timer.completedEpoch !== timer.epoch) return;
    let stopped = false, retry: ReturnType<typeof setTimeout>;
    async function claim() {
      try {
        const response = await sendSessionRequest({ type: 'GET_SESSION', sessionId });
        if (stopped) return;
        if (!response.ok || response.kind !== 'player') throw new Error('ALARM_STATE_UNAVAILABLE');
        const current = response.snapshot.timers.find(item => item.scope === timer.scope && item.documentId === timer.documentId);
        if (!current?.sound || current.epoch !== timer.epoch || current.completedEpoch !== timer.epoch || current.alarmClaimedEpoch === timer.epoch) return;
        const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'CLAIM_TIMER_ALARM', sessionId, documentId: timer.documentId, slideId: null,
          revision: response.snapshot.revision, commandId: crypto.randomUUID(), epoch: timer.epoch! } });
        if (stopped) return;
        if (result.ok) { void play(); return; }
      } catch { /* Recovery retries claim, never an already claimed alarm. */ }
      if (!stopped) retry = setTimeout(() => void claim(), 1000);
    }
    void claim();
    return () => { stopped = true; clearTimeout(retry); audio.current?.abort(); audio.current = null; };
  }, [sessionId, timer.scope, timer.documentId, timer.epoch, timer.completedEpoch, timer.sound]);
  return { blocked, busy, retry: play };
}
