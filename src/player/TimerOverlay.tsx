import { useEffect } from 'react';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import type { TimerState } from '../media/types';
import { elapsedTimer, timerComplete, timerPosition } from '../media/timer';
import { TimerReadout } from '../shared/TimerReadout';
import { sendSessionRequest } from '../shared/sessionClient';
import { Volume2 } from 'lucide-react';
import { useTimerAlarm } from './useTimerAlarm';
export function TimerOverlay({ state }: { state: PlayerSnapshot }) {
  return <div className="player-timers">{state.timers.map(timer => <TimerItem key={`${timer.scope}:${timer.documentId}`} state={state} timer={timer} />)}</div>;
}
function TimerItem({ state, timer }: { state: PlayerSnapshot; timer: TimerState }) {
  const alarm = useTimerAlarm(state.sessionId, timer);
  useEffect(() => {
    if (timer.paused || timer.mode === 'stopwatch' || !timer.epoch) return;
    let stopped = false, pending: ReturnType<typeof setTimeout>;
    async function finish() {
      if (stopped) return;
      try {
        const response = await sendSessionRequest({ type: 'GET_SESSION', sessionId: state.sessionId });
        if (stopped) return;
        if (!response.ok || response.kind !== 'player') throw new Error('TIMER_STATE_UNAVAILABLE');
        const current = response.snapshot.timers.find(item => item.documentId === timer.documentId && item.scope === timer.scope);
        if (!current || current.epoch !== timer.epoch || current.paused) return;
        if (timerComplete(current, Date.now())) await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'FINISH_TIMER', sessionId: state.sessionId, documentId: timer.documentId,
          slideId: null, epoch: timer.epoch!, revision: response.snapshot.revision, commandId: crypto.randomUUID() } });
      } catch { /* Keep the deadline; transient worker recovery must not reset the timer. */ }
      if (!stopped) pending = setTimeout(() => void finish(), 1000);
    }
    pending = setTimeout(() => void finish(), Math.max(0, Math.min(2147483647, timer.durationSec * 1000 - elapsedTimer(timer, Date.now()))));
    return () => { stopped = true; clearTimeout(pending); };
  }, [state.sessionId, timer.documentId, timer.scope, timer.epoch, timer.paused, timer.startedAt, timer.durationSec, timer.elapsedBeforeStartMs]);
  const position = timerPosition(timer);
  return <>{timer.visible === true && <div className="player-timer" data-scope={timer.scope} style={{ left: `${position.x * 100}%`, top: `${position.y * 100}%`, transform: `translate(${-position.x * 100}%, ${-position.y * 100}%)` }}><span>{timer.scope === 'session' ? '수업' : '자료'}</span><TimerReadout timer={timer} /></div>}
    {alarm.blocked && <div className="timer-alarm-error" role="status"><span>타이머 소리를 재생하지 못했습니다.</span><button title="타이머 알림 재생" aria-label="타이머 알림 재생" disabled={alarm.busy} onClick={() => void alarm.retry()}><Volume2 size={20} aria-hidden="true" /></button></div>}</>;
}
