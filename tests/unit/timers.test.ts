import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import type { ClassSession } from '../../src/core/types';
import type { SessionCommand } from '../../src/core/commands';
import { elapsedTimer, timerText, timerComplete, scopedTimer } from '../../src/media/timer';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { canRequest, isSessionRequest } from '../../src/shared/sessionMessages';
function run(session: ClassSession, fields: object, now = 100) {
  return reduceSession(session, { sessionId: session.id, documentId: null, slideId: null, revision: session.revision, commandId: `c-${session.revision}`, ...fields } as SessionCommand, now);
}
const config = { type: 'SET_TIMER', mode: 'countdown', durationSec: 5, visible: true };
describe('session/document countdown and stopwatch', () => {
  it('allows one completed countdown alarm claim per epoch and suppresses old backup alerts', () => {
    let state = run(run(fixtureSession(), config), { type: 'SET_TIMER_SOUND', sound: true });
    state = run(state, { type: 'PLAY_TIMER' }, 1000); const epoch = state.globalTimer!.epoch;
    expect(() => run(state, { type: 'CLAIM_TIMER_ALARM', epoch }, 6000)).toThrow();
    state = run(state, { type: 'FINISH_TIMER', epoch }, 6000);
    const restored = restoreSessionBundle(createSessionBundle(state, 6000), 'copy', 7000);
    expect(restored.globalTimer?.alarmClaimedEpoch).toBe(epoch);
    const claimed = run(state, { type: 'CLAIM_TIMER_ALARM', epoch }, 6000);
    expect(claimed.globalTimer?.alarmClaimedEpoch).toBe(epoch); expect(() => run(claimed, { type: 'CLAIM_TIMER_ALARM', epoch }, 6000)).toThrow();
    const replay = run(run(claimed, { type: 'RESET_TIMER' }), { type: 'PLAY_TIMER' }, 7000);
    expect(replay.globalTimer?.sound).toBe(true); expect(replay.globalTimer?.epoch).not.toBe(epoch);
    expect(() => run(replay, { type: 'CLAIM_TIMER_ALARM', epoch }, 12000)).toThrow();
    const muted = run(state, { type: 'SET_TIMER_SOUND', sound: false }); expect(() => run(muted, { type: 'CLAIM_TIMER_ALARM', epoch })).toThrow();
  });
  it('moves running timer without resetting elapsed, epoch, selection or private edits', () => {
    const started = run(run(fixtureSession(), config), { type: 'PLAY_TIMER' }, 1000);
    const moved = run(started, { type: 'SET_TIMER_POSITION', position: { x: 0, y: 1 } }, 2000);
    expect(moved.globalTimer).toEqual({ ...started.globalTimer, position: { x: 0, y: 1 } });
    expect(moved.documents).toEqual(started.documents); expect(moved.presentedSelection).toEqual(started.presentedSelection);
    const restored = restoreSessionBundle(createSessionBundle(moved, 3000), 'copy', 4000);
    expect(restored.globalTimer).toMatchObject({ position: { x: 0, y: 1 }, paused: true, elapsedBeforeStartMs: 2000 });
    expect(run(moved, config).globalTimer?.position).toEqual({ x: 0, y: 1 });
  });
  it('rejects invalid positions and permits only Remote position changes', () => {
    const session = run(fixtureSession(), config);
    for (const position of [{ x: -1, y: 0 }, { x: 0, y: 1.01 }, { x: NaN, y: 0 }, { x: 0 }, { x: 0, y: 0, path: 'invalid' }, null]) {
      expect(() => run(session, { type: 'SET_TIMER_POSITION', position })).toThrow();
      const invalid = structuredClone(session); Object.assign(invalid.globalTimer!, { position }); expect(() => assertSessionRecord({ session: invalid, receipts: [] })).toThrow();
    }
    const request = { type: 'SESSION_COMMAND' as const, command: { type: 'SET_TIMER_POSITION', sessionId: session.id, documentId: null, slideId: null, revision: session.revision, commandId: 'move', position: { x: .5, y: .5 } } as SessionCommand };
    expect(isSessionRequest(request)).toBe(true); expect(canRequest('remote', request)).toBe(true); expect(canRequest('player', request)).toBe(false);
    expect(() => run(fixtureSession(), { type: 'SET_TIMER_POSITION', position: { x: 0, y: 0 } })).toThrow();
  });
  it('uses absolute elapsed time, clamps negative clock movement and formats completion', () => {
    const timer = { scope: 'session' as const, documentId: null, durationSec: 60, elapsedBeforeStartMs: 100, startedAt: 100, paused: false };
    expect(elapsedTimer(timer, 1100)).toBe(1100); expect(elapsedTimer(timer, 0)).toBe(100);
    expect(timerText(timer, 1100)).toBe('00:59'); expect(timerText(timer, 100000)).toBe('00:00'); expect(timerComplete(timer, 100000)).toBe(true);
    expect(timerText({ ...timer, mode: 'stopwatch' }, 1100)).toBe('00:01'); expect(timerComplete({ ...timer, mode: 'stopwatch' }, 100000)).toBe(false);
  });
  it('sets and runs session timer independently of document activation/editor selection', () => {
    const original = fixtureSession(), configured = run(original, config), started = run(configured, { type: 'PLAY_TIMER' });
    expect(original.globalTimer).toBeNull(); expect(started.globalTimer?.paused).toBe(false);
    const edited = run(started, { type: 'SELECT_EDITOR_SLIDE', documentId: 'A', slideId: 'A-1' }, 200);
    expect(edited.globalTimer).toEqual(started.globalTimer); expect(edited.presentedSelection).toEqual(started.presentedSelection);
    assertSessionRecord({ session: edited, receipts: [] });
  });
  it('preserves separate A/B timers while session timer keeps running', () => {
    let session = fixtureSession(); session.documents.B = { ...structuredClone(session.documents.A!), id: 'B' }; session.documentOrder.push('B');
    session = run(run(session, config), { type: 'PLAY_TIMER' });
    session = run(run(session, { ...config, documentId: 'A' }), { type: 'PLAY_TIMER', documentId: 'A' }, 200);
    const switched = run(session, { type: 'ACTIVATE_DOCUMENT', documentId: 'B' }, 1200);
    expect(switched.documents.A!.timer).toMatchObject({ elapsedBeforeStartMs: 1000, paused: true }); expect(switched.globalTimer?.paused).toBe(false);
    const b = run(switched, { ...config, documentId: 'B', durationSec: 8 });
    const back = run(b, { type: 'ACTIVATE_DOCUMENT', documentId: 'A' }, 1300);
    expect(scopedTimer(back, 'A')?.durationSec).toBe(5); expect(scopedTimer(back, 'B')?.durationSec).toBe(8);
    expect(toPlayerSnapshot(back).timers).toHaveLength(2); assertSessionRecord({ session: back, receipts: [] });
  });
  it('rejects early/old epoch expiry, stores exact duration after completion and reset permits replay', () => {
    const started = run(run(fixtureSession(), config), { type: 'PLAY_TIMER' }, 1000), epoch = started.globalTimer!.epoch;
    expect(() => run(started, { type: 'FINISH_TIMER', epoch }, 5999)).toThrow('INVALID_TARGET');
    expect(() => run(started, { type: 'FINISH_TIMER', epoch: 'old' }, 6000)).toThrow('INVALID_TARGET');
    const ended = run(started, { type: 'FINISH_TIMER', epoch }, 6000);
    expect(ended.globalTimer).toMatchObject({ paused: true, startedAt: null, elapsedBeforeStartMs: 5000 });
    expect(() => run(ended, { type: 'PLAY_TIMER' })).toThrow('INVALID_TARGET');
    expect(run(run(ended, { type: 'RESET_TIMER' }), { type: 'PLAY_TIMER' }).globalTimer?.paused).toBe(false);
  });
  it('pauses elapsed once, resumes correctly and preserves stopped state in backup', () => {
    const started = run(run(fixtureSession(), config), { type: 'PLAY_TIMER' }, 1000), stopped = run(started, { type: 'PAUSE_TIMER' }, 2000);
    expect(stopped.globalTimer?.elapsedBeforeStartMs).toBe(1000);
    const resumed = run(stopped, { type: 'PLAY_TIMER' }, 3000), restored = restoreSessionBundle(createSessionBundle(resumed, 4000), 'copy', 5000);
    expect(restored.globalTimer).toMatchObject({ paused: true, startedAt: null, elapsedBeforeStartMs: 2000 });
  });
  it('reads legacy document global timer and migrates without losing it when setting session timer', () => {
    const session = fixtureSession(); session.globalTimer = { scope: 'document', documentId: 'A', durationSec: 60, startedAt: null, elapsedBeforeStartMs: 1000, paused: true };
    const configured = run(session, config);
    expect(configured.documents.A!.timer?.elapsedBeforeStartMs).toBe(1000); expect(configured.globalTimer?.scope).toBe('session'); assertSessionRecord({ session: configured, receipts: [] });
  });
  it('rejects invalid scope target/config/record and hides private fields', () => {
    const session = fixtureSession();
    for (const extra of [{ durationSec: 0 }, { durationSec: Infinity }, { documentId: 'missing' }, { slideId: 'A-2' }, { mode: 'unknown' }]) expect(() => run(session, { ...config, ...extra })).toThrow();
    const configured = run(session, config); const projection = toPlayerSnapshot(configured);
    expect(JSON.stringify(projection.timers)).not.toMatch(/note|name|path/); projection.timers[0]!.durationSec = 10; expect(configured.globalTimer?.durationSec).toBe(5);
    const bad = structuredClone(configured); Object.assign(bad.globalTimer!, { bytes: [1] }); expect(() => assertSessionRecord({ session: bad, receipts: [] })).toThrow();
  });
  it('permits Remote control and only Player expiry with exact request keys', () => {
    const command = { ...config, sessionId: 's', revision: 0, commandId: 'id', documentId: null, slideId: null } as SessionCommand;
    const request = { type: 'SESSION_COMMAND' as const, command }; expect(isSessionRequest(request)).toBe(true); expect(canRequest('remote', request)).toBe(true); expect(canRequest('player', request)).toBe(false);
    const finish = { ...request, command: { ...command, type: 'FINISH_TIMER', epoch: 'id' } as SessionCommand }; expect(canRequest('player', finish)).toBe(true); expect(canRequest('remote', finish)).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...command, other: true } })).toBe(false);
  });
});
