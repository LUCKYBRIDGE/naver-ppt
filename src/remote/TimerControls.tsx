import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Save, Move } from 'lucide-react';
import type { ClassSession } from '../core/types';
import type { SessionCommand } from '../core/commands';
import { scopedTimer, timerComplete, timerPosition } from '../media/timer';
import { TimerReadout } from '../shared/TimerReadout';
export function TimerControls({ session, disabled, execute }: { session: ClassSession; disabled: boolean; execute(command: SessionCommand): Promise<void> }) {
  const [scope, setScope] = useState<'session' | 'document'>('session'), [mode, setMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [seconds, setSeconds] = useState(300), [visible, setVisible] = useState(true);
  const documentId = scope === 'session' ? null : session.presentedSelection?.documentId ?? null;
  const timer = scope === 'document' && documentId === null ? null : scopedTimer(session, documentId), encoded = JSON.stringify(timer);
  const [position, setPosition] = useState({ x: 1, y: 0 });
  const savedPosition = JSON.stringify(timer ? timerPosition(timer) : { x: 1, y: scope === 'session' ? 0 : .12 });
  useEffect(() => { setPosition(JSON.parse(savedPosition) as { x: number; y: number }); }, [savedPosition, scope, documentId]);
  useEffect(() => { setMode(timer?.mode ?? 'countdown'); setSeconds(timer?.durationSec || 300); setVisible(timer?.visible ?? true); }, [scope, documentId, encoded]);
  const unavailable = disabled || scope === 'document' && documentId === null;
  const context = { sessionId: session.id, revision: session.revision, documentId, slideId: null };
  function control(type: 'PLAY_TIMER' | 'PAUSE_TIMER' | 'RESET_TIMER') { void execute({ ...context, type, commandId: crypto.randomUUID() }); }
  return <section className="timer-controls" aria-label="타이머"><h2>타이머</h2>
    <label htmlFor="timer-scope">적용 범위</label><select id="timer-scope" value={scope} disabled={disabled} onChange={event => setScope(event.target.value as typeof scope)}><option value="session">수업 전체</option><option value="document">현재 자료</option></select>
    <label htmlFor="timer-mode">방식</label><select id="timer-mode" value={mode} disabled={unavailable} onChange={event => setMode(event.target.value as typeof mode)}><option value="countdown">카운트다운</option><option value="stopwatch">초시계</option></select>
    {mode === 'countdown' && <><label htmlFor="timer-seconds">시간 (초)</label><input id="timer-seconds" type="number" min={1} max={86400} step={1} value={Number.isFinite(seconds) ? seconds : ''} disabled={unavailable} onChange={event => setSeconds(event.target.valueAsNumber)} /></>}
    <label className="timer-visible"><input type="checkbox" checked={visible} disabled={unavailable} onChange={event => setVisible(event.target.checked)} /> 학생 화면에 표시</label>
    <div className="control-actions"><button title="타이머 설정 적용" aria-label="타이머 설정 적용" disabled={unavailable || mode === 'countdown' && (!Number.isFinite(seconds) || seconds < 1 || seconds > 86400)} onClick={() => void execute({ ...context, type: 'SET_TIMER', commandId: crypto.randomUUID(), mode, durationSec: mode === 'stopwatch' ? 0 : seconds, visible })}><Save size={20} aria-hidden="true" /></button>
      <button title="타이머 시작" aria-label="타이머 시작" disabled={unavailable || !timer || !timer.paused || timerComplete(timer, Date.now())} onClick={() => control('PLAY_TIMER')}><Play size={20} aria-hidden="true" /></button>
      <button title="타이머 정지" aria-label="타이머 정지" disabled={unavailable || !timer || timer.paused} onClick={() => control('PAUSE_TIMER')}><Pause size={20} aria-hidden="true" /></button>
      <button title="타이머 초기화" aria-label="타이머 초기화" disabled={unavailable || !timer} onClick={() => control('RESET_TIMER')}><RotateCcw size={20} aria-hidden="true" /></button></div>
    {timer && <TimerReadout timer={timer} />}
    <label className="timer-visible"><input id="timer-sound" type="checkbox" checked={timer?.sound ?? false} disabled={unavailable || !timer || timer.mode === 'stopwatch'} onChange={event => void execute({ ...context, type: 'SET_TIMER_SOUND', sound: event.target.checked, commandId: crypto.randomUUID() })} /> 완료 알림 소리</label>
    <label htmlFor="timer-x">가로 위치 ({Math.round(position.x * 100)}%)</label><input id="timer-x" type="range" min={0} max={100} step={1} value={Math.round(position.x * 100)} disabled={unavailable || !timer} onChange={event => setPosition({ ...position, x: event.target.valueAsNumber / 100 })} />
    <label htmlFor="timer-y">세로 위치 ({Math.round(position.y * 100)}%)</label><input id="timer-y" type="range" min={0} max={100} step={1} value={Math.round(position.y * 100)} disabled={unavailable || !timer} onChange={event => setPosition({ ...position, y: event.target.valueAsNumber / 100 })} />
    <button title="타이머 위치 적용" aria-label="타이머 위치 적용" disabled={unavailable || !timer} onClick={() => void execute({ ...context, type: 'SET_TIMER_POSITION', position, commandId: crypto.randomUUID() })}><Move size={20} aria-hidden="true" /></button>
  </section>;
}
