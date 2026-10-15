import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { isSupportedAutoplayRule, mediaEndedForAutoplay } from '../../src/media/autoplay';
import type { SessionCommand } from '../../src/core/commands';
import type { AutoplayRule } from '../../src/media/types';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
function fixture(mode: AutoplayRule['mode'] = 'media-end') {
  const session = fixtureSession(), document = session.documents.A!; document.lastSlideId = 'A-1'; session.presentedSelection!.slideId = 'A-1';
  document.autoplay = { mode, seconds: 5, loop: 'none', pauseWhileEditing: false };
  document.localMedia = { clip: { id: 'clip', slideId: 'A-1', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64), durationSec: 2 } }; return session;
}
function play(session = fixture()): Extract<SessionCommand, { type: 'PLAY_AUTOPLAY' }> { return { type: 'PLAY_AUTOPLAY', sessionId: session.id, documentId: 'A', slideId: 'A-1', revision: session.revision, commandId: 'cycle' }; }
function finish(session: ReturnType<typeof fixture>, mediaId = 'clip', commandId = 'end') {
  return reduceSession(session, { type: 'CHECKPOINT_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-1', revision: session.revision, commandId, mediaId, epoch: 'cycle', timeSec: 2, paused: true, ended: true }, 3000);
}
function advance(session: ReturnType<typeof fixture>): Extract<SessionCommand, { type: 'ADVANCE_AUTOPLAY' }> { return { ...play(session), type: 'ADVANCE_AUTOPLAY', epoch: 'cycle', commandId: 'advance' }; }
describe('native ended autoplay cycles', () => {
  it('validates four modes while requiring seconds for later-of and refusing edit-pause', () => {
    for (const mode of ['manual', 'seconds', 'media-end', 'later-of-time-and-media'] as const) expect(isSupportedAutoplayRule({ mode, seconds: 2, loop: 'none', pauseWhileEditing: false })).toBe(true);
    expect(isSupportedAutoplayRule({ mode: 'later-of-time-and-media', loop: 'none', pauseWhileEditing: false })).toBe(false);
    expect(isSupportedAutoplayRule({ mode: 'media-end', loop: 'none', pauseWhileEditing: true })).toBe(false);
  });
  it('starts actual media request with bound cycle and waits for native ended, no guessed duration completion', () => {
    const initial = fixture(), session = reduceSession(initial, play(initial), 1000);
    expect(session.documents.A!.mediaBookmarks.clip).toMatchObject({ paused: false, epoch: 'cycle', autoplayEpoch: 'cycle', ended: false });
    expect(() => reduceSession(session, advance(session), 999999)).toThrow('INVALID_TARGET');
    const ended = finish(session), next = reduceSession(ended, advance(ended), 3100);
    expect(next.presentedSelection?.slideId).toBe('A-2'); expect(next.documents.A!.autoplayCheckpoint?.paused).toBe(true);
  });
  it('later-of waits for time when native media already ended and waits for media when time passed', () => {
    const session = reduceSession(fixture('later-of-time-and-media'), play(fixture('later-of-time-and-media')), 1000);
    expect(() => reduceSession(session, advance(session), 6000)).toThrow('INVALID_TARGET');
    const ended = finish(session); expect(() => reduceSession(ended, advance(ended), 5999)).toThrow('INVALID_TARGET');
    expect(reduceSession(ended, advance(ended), 6000).presentedSelection?.slideId).toBe('A-2');
  });
  it('requires every registered media to end in the same cycle, not old end records', () => {
    const initial = fixture(), ref = initial.documents.A!.localMedia!.clip!; initial.documents.A!.localMedia!.second = { ...ref, id: 'second' };
    let session = reduceSession(initial, play(initial), 1000); session = finish(session);
    expect(mediaEndedForAutoplay(session.documents.A!, 'A-1', 'cycle')).toBe(false);
    session = finish(session, 'second', 'end-second'); expect(mediaEndedForAutoplay(session.documents.A!, 'A-1', 'cycle')).toBe(true);
    session.documents.A!.mediaBookmarks.second!.autoplayEpoch = 'old'; expect(() => reduceSession(session, advance(session), 6000)).toThrow('INVALID_TARGET');
  });
  it('loops same page with a fresh cycle/time and restarts completed media at zero', () => {
    const initial = fixture(); initial.documents.A!.autoplay!.loop = 'slide';
    const ended = finish(reduceSession(initial, play(initial), 1000)), next = reduceSession(ended, advance(ended), 3100);
    expect(next.presentedSelection?.slideId).toBe('A-1'); expect(next.documents.A!.autoplayCheckpoint).toMatchObject({ epoch: 'advance', elapsedMs: 0, startedAt: 3100 });
    expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ autoplayEpoch: 'advance', epoch: 'advance', timeSec: 0, paused: false, ended: false });
    expect(mediaEndedForAutoplay(next.documents.A!, 'A-1', 'advance')).toBe(false);
  });
  it('gesture play updates media epoch without losing its autoplay cycle', () => {
    let session = reduceSession(fixture(), play(), 1000); session = reduceSession(session, { type: 'CHECKPOINT_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-1', mediaId: 'clip', epoch: 'cycle', timeSec: 0, paused: true, ended: false, revision: session.revision, commandId: 'blocked' }, 1100);
    const next = reduceSession(session, { type: 'PLAY_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-1', mediaId: 'clip', revision: session.revision, commandId: 'gesture' }, 1200);
    expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ epoch: 'gesture', autoplayEpoch: 'cycle', paused: false });
    expect(toPlayerSnapshot(next).autoplay?.mediaEnded).toBe(false);
  });
  it('missing media refuses start and unknown ended remains null', () => {
    const session = fixture(); delete session.documents.A!.localMedia;
    expect(mediaEndedForAutoplay(session.documents.A!, 'A-1', 'cycle')).toBeNull(); expect(() => reduceSession(session, play(session), 1000)).toThrow('INVALID_TARGET');
  });
  it('pause/resume preserves unfinished position but rebinds the new cycle', () => {
    let session = reduceSession(fixture(), play(), 1000); session.documents.A!.mediaBookmarks.clip!.timeSec = .5;
    session = reduceSession(session, { ...play(session), type: 'PAUSE_AUTOPLAY', commandId: 'pause' }, 1500);
    const next = reduceSession(session, { ...play(session), commandId: 'resume' }, 2000);
    expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: .5, autoplayEpoch: 'resume', epoch: 'resume', paused: false });
    expect(next.documents.A!.autoplayCheckpoint?.elapsedMs).toBe(500);
  });
});
