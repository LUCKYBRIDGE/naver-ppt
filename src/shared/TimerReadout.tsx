import { useEffect, useState } from 'react';
import type { TimerState } from '../media/types';
import { timerText } from '../media/timer';
export function TimerReadout({ timer }: { timer: TimerState }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { setNow(Date.now()); if (timer.paused) return;
    const interval = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(interval);
  }, [timer.startedAt, timer.elapsedBeforeStartMs, timer.paused]);
  return <output role="timer" aria-live="off" className="timer-readout">{timerText(timer, now)}</output>;
}
