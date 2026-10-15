import type { TimerState } from './types';
import type { ClassSession } from '../core/types';
export function isTimerPosition(value: unknown): value is { x: number; y: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const position = value as Record<string, unknown>;
  return Object.keys(position).length === 2 && ['x', 'y'].every(key => Object.hasOwn(position, key) && typeof position[key] === 'number' && Number.isFinite(position[key]) && position[key] >= 0 && position[key] <= 1);
}
export function timerPosition(timer: TimerState) { return timer.position ?? { x: 1, y: timer.scope === 'session' ? 0 : .12 }; }
export function elapsedTimer(timer: TimerState, now: number) {
  if (!Number.isFinite(now) || now < 0) throw new Error('Invalid timer time');
  return timer.elapsedBeforeStartMs + (!timer.paused && timer.startedAt !== null ? Math.max(0, now - timer.startedAt) : 0);
}
export function pauseTimer(timer: TimerState, now: number): TimerState {
  return { ...timer, elapsedBeforeStartMs: elapsedTimer(timer, now), startedAt: null, paused: true };
}
export function timerComplete(timer: TimerState, now: number) { return timer.mode !== 'stopwatch' && elapsedTimer(timer, now) >= timer.durationSec * 1000; }
export function scopedTimer(session: ClassSession, documentId: string | null): TimerState | null {
  if (documentId === null) return session.globalTimer?.scope === 'session' ? session.globalTimer : null;
  return session.documents[documentId]?.timer ?? (session.globalTimer?.scope === 'document' && session.globalTimer.documentId === documentId ? session.globalTimer : null);
}
export function timerText(timer: TimerState, now: number) {
  const elapsed = elapsedTimer(timer, now), seconds = timer.mode === 'stopwatch' ? Math.floor(elapsed / 1000) : Math.max(0, Math.ceil(timer.durationSec - elapsed / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
