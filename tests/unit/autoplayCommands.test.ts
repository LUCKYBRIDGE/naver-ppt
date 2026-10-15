import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import type { SessionCommand } from '../../src/core/commands';
import type { AutoplayRule } from '../../src/media/types';
import { isTimeAutoplayRule } from '../../src/media/autoplay';
import { isSessionRequest, canRequest } from '../../src/shared/sessionMessages';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
const rule: AutoplayRule = { mode: 'seconds', seconds: 1, loop: 'document', pauseWhileEditing: false };
function setup() { const session = fixtureSession(); session.documents.A!.autoplay = structuredClone(rule); return session; }
function command(session = setup()): Extract<SessionCommand, { type: 'PLAY_AUTOPLAY' }> {
  return { type: 'PLAY_AUTOPLAY', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: session.revision, commandId: 'play' };
}
function playing() { return reduceSession(setup(), command(), 100); }
function advance(session = playing()): Extract<SessionCommand, { type: 'ADVANCE_AUTOPLAY' }> {
  return { ...command(session), type: 'ADVANCE_AUTOPLAY', commandId: 'advance', epoch: 'play' };
}
describe('time autoplay commands', () => {
  it('starts only current target and preserves private state', () => {
    const session = setup(), next = reduceSession(session, command(session), 100);
    expect(next.documents.A!.autoplayCheckpoint).toEqual({ slideId: 'A-2', epoch: 'play', startedAt: 100, elapsedMs: 0, paused: false });
    expect(next.editorSelection).toEqual(session.editorSelection); expect(next.documents.A!.slideDeltas).toEqual(session.documents.A!.slideDeltas);
    expect(session.documents.A!.autoplayCheckpoint).toBeUndefined();
    expect(() => reduceSession(session, { ...command(session), slideId: 'A-1' }, 100)).toThrow('INVALID_TARGET');
  });
  it('pauses and resumes retained elapsed with a fresh epoch', () => {
    const first = playing(), paused = reduceSession(first, { ...command(first), type: 'PAUSE_AUTOPLAY', commandId: 'pause' }, 600);
    expect(paused.documents.A!.autoplayCheckpoint).toMatchObject({ elapsedMs: 500, paused: true, startedAt: null });
    const resumed = reduceSession(paused, { ...command(paused), commandId: 'resume' }, 900);
    expect(resumed.documents.A!.autoplayCheckpoint).toMatchObject({ elapsedMs: 500, epoch: 'resume', startedAt: 900, paused: false });
  });
  it('refuses early, stale epoch/revision and paused advances', () => {
    const session = playing(); expect(() => reduceSession(session, advance(session), 1099)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(session, { ...advance(session), epoch: 'old' } as SessionCommand, 1100)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(session, { ...advance(session), revision: 0 }, 1100)).toThrow('STALE_REVISION');
    session.documents.A!.autoplayCheckpoint!.paused = true; session.documents.A!.autoplayCheckpoint!.startedAt = null;
    expect(() => reduceSession(session, advance(session), 1100)).toThrow('INVALID_TARGET');
  });
  it('advances document loop and resets page time/epoch without changing editor', () => {
    const session = playing(), next = reduceSession(session, advance(session), 1100);
    expect(next.presentedSelection?.slideId).toBe('A-1'); expect(next.documents.A!.lastSlideId).toBe('A-1');
    expect(next.documents.A!.autoplayCheckpoint).toEqual({ slideId: 'A-1', epoch: 'advance', startedAt: 1100, elapsedMs: 0, paused: false });
    expect(next.editorSelection).toEqual(session.editorSelection);
  });
  it('terminal page stops without exposing another document', () => {
    const session = playing(); session.documents.A!.autoplay!.loop = 'none';
    const next = reduceSession(session, advance(session), 1100);
    expect(next.presentedSelection).toEqual(session.presentedSelection); expect(next.documents.A!.autoplayCheckpoint).toMatchObject({ paused: true, elapsedMs: 1000, startedAt: null });
  });
  it('same page loop creates a fresh epoch and manual next page stops', () => {
    const session = playing(); session.documents.A!.autoplay!.loop = 'slide';
    const same = reduceSession(session, advance(session), 1100); expect(same.presentedSelection).toEqual(session.presentedSelection);
    expect(same.documents.A!.autoplayCheckpoint).toMatchObject({ epoch: 'advance', elapsedMs: 0 });
    session.documents.A!.autoplay!.loop = 'document'; session.documents.A!.slideDeltas['A-1'] = { overlays: [], presenterNote: '', classLog: '', autoplay: { ...rule, mode: 'manual' } };
    expect(reduceSession(session, advance(session), 1100).documents.A!.autoplayCheckpoint).toMatchObject({ paused: true, startedAt: null });
  });
  it('configures inheritance scopes, removes override and resets playback', () => {
    let session = playing(); const config = { ...command(session), type: 'SET_AUTOPLAY' as const, scope: 'slide' as const, rule: { ...rule, seconds: 3 } };
    session = reduceSession(session, config, 600); expect(session.documents.A!.slideDeltas['A-2']!.autoplay?.seconds).toBe(3);
    expect(session.documents.A!.autoplayCheckpoint).toMatchObject({ paused: true, elapsedMs: 0 });
    session = reduceSession(session, { ...config, revision: session.revision, commandId: 'inherit', rule: null }, 700);
    expect(session.documents.A!.slideDeltas['A-2']!.autoplay).toBeUndefined();
    const changed = reduceSession(session, { ...config, revision: session.revision, commandId: 'session-default', scope: 'session' }, 800);
    expect(changed.defaultAutoplay.seconds).toBe(3); expect(changed.documents.A!.slideDeltas['A-2']!.presenterNote).toBe('Synthetic teacher note');
  });
  it('rejects wrong/reversed range and session range', () => {
    const session = setup(), config = { ...command(session), type: 'SET_AUTOPLAY' as const, scope: 'document' as const, rule: { ...rule, loop: 'range' as const, range: { startSlideId: 'A-2', endSlideId: 'A-1' } } };
    expect(() => reduceSession(session, config, 100)).toThrow('INVALID_TARGET');
    config.rule.range = { startSlideId: 'A-1', endSlideId: 'A-2' };
    expect(() => reduceSession(session, { ...config, scope: 'session' }, 100)).toThrow('INVALID_TARGET');
    expect(reduceSession(session, config, 100).documents.A!.autoplay?.loop).toBe('range');
  });
  it('does not activate unsupported media or edit-pause settings silently', () => {
    for (const bad of [{ ...rule, seconds: 0 }, { ...rule, seconds: Infinity }, { ...rule, bytes: [1] }, { ...rule, mode: ['seconds'] }, { ...rule, loop: ['document'] }, { ...rule, mode: 'media-end' }, { ...rule, pauseWhileEditing: true }]) expect(isTimeAutoplayRule(bad)).toBe(false);
    const session = setup(); session.documents.A!.autoplay = { ...rule, mode: 'media-end' };
    expect(() => reduceSession(session, command(session), 100)).toThrow('INVALID_TARGET');
  });
  it('refuses range playback when the current page is outside the selected range', () => {
    const session = setup(); session.documents.A!.autoplay = { ...rule, loop: 'range', range: { startSlideId: 'A-1', endSlideId: 'A-1' } };
    expect(() => reduceSession(session, command(session), 100)).toThrow('INVALID_TARGET');
  });
  it('allows only remote configuration and narrow Player advance, exact request keys', () => {
    const request = { type: 'SESSION_COMMAND' as const, command: advance() }; expect(isSessionRequest(request)).toBe(true);
    expect(canRequest('player', request)).toBe(true); expect(canRequest('remote', request)).toBe(false); expect(canRequest('editor', request)).toBe(false);
    expect(canRequest('player', { ...request, command: command() })).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...request.command, mediaEnded: true } })).toBe(false);
  });
  it('exposes cloned playback execution metadata without teacher information', () => {
    const session = playing(), snapshot = toPlayerSnapshot(session); expect(snapshot.autoplay?.checkpoint?.epoch).toBe('play');
    expect(JSON.stringify(snapshot)).not.toMatch(/Synthetic|presenterNote|classLog|fileHandleKey|editorSelection/);
    snapshot.autoplay!.rule.seconds = 20; snapshot.autoplay!.checkpoint!.elapsedMs = 99;
    expect(session.documents.A!.autoplay!.seconds).toBe(1); expect(session.documents.A!.autoplayCheckpoint!.elapsedMs).toBe(0);
  });
});
