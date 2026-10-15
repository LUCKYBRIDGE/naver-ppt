import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { isLocalMediaRef, isMediaPlayback } from '../../src/media/validation';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { mediaEndedForAutoplay } from '../../src/media/autoplay';
import { canRequest, isSessionRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';
const playback = { startSec: 3, endSec: 9, volume: .25, muted: true };
function fixture() {
  const session = fixtureSession();
  session.documents.A!.localMedia = { clip: { id: 'clip', slideId: 'A-2', kind: 'audio', mime: 'audio/wav', name: 'Synthetic.wav', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64), durationSec: 20 } };
  return session;
}
function run(session: ReturnType<typeof fixture>, fields: object) {
  return reduceSession(session, { sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: session.revision, commandId: `c-${session.revision}`, mediaId: 'clip', ...fields } as SessionCommand, session.revision + 100);
}
describe('media playback settings and seek', () => {
  it('accepts exact bounded optional settings and legacy refs', () => {
    const ref = fixture().documents.A!.localMedia!.clip!;
    expect(isLocalMediaRef(ref)).toBe(true); expect(isLocalMediaRef({ ...ref, playback })).toBe(true);
    for (const bad of [{ ...playback, volume: 2 }, { ...playback, startSec: 9 }, { ...playback, endSec: 21 }, { ...playback, url: 'bad' }, { ...playback, muted: 1 }, { ...playback, volume: NaN }]) expect(isMediaPlayback(bad, 20)).toBe(false);
  });
  it('trim pauses at start, preserves private state and rejects old epochs', () => {
    const playing = run(fixture(), { type: 'PLAY_MEDIA' }), old = playing.documents.A!.mediaBookmarks.clip!;
    const trimmed = run(playing, { type: 'SET_MEDIA_PLAYBACK', playback });
    expect(trimmed.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 3, paused: true, ended: false, positionEpoch: `c-${playing.revision}` });
    expect(trimmed.editorSelection).toEqual(playing.editorSelection); expect(trimmed.documents.A!.slideDeltas).toEqual(playing.documents.A!.slideDeltas);
    expect(playing.documents.A!.localMedia!.clip!.playback).toBeUndefined();
    expect(() => run(trimmed, { type: 'CHECKPOINT_MEDIA', epoch: old.epoch, timeSec: 4, paused: true, ended: false })).toThrow('INVALID_TARGET');
    assertSessionRecord({ session: trimmed, receipts: [] });
  });
  it('volume-only changes preserve position, epoch and running state', () => {
    const playing = run(fixture(), { type: 'PLAY_MEDIA' });
    const changed = run(playing, { type: 'SET_MEDIA_PLAYBACK', playback: { ...playback, startSec: 0, endSec: 20 } });
    expect(changed.documents.A!.mediaBookmarks).toEqual(playing.documents.A!.mediaBookmarks);
    expect(changed.documents.A!.localMedia!.clip!.playback?.volume).toBe(.25);
  });
  it('seek preserves running state/cycle and invalidates late reports', () => {
    const session = run(fixture(), { type: 'PLAY_MEDIA' }); session.documents.A!.mediaBookmarks.clip!.autoplayEpoch = 'cycle';
    const moved = run(session, { type: 'SEEK_MEDIA', timeSec: 7 });
    expect(moved.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 7, paused: false, ended: false, autoplayEpoch: 'cycle', epoch: `c-${session.revision}`, positionEpoch: `c-${session.revision}` });
    expect(() => run(moved, { type: 'CHECKPOINT_MEDIA', epoch: session.documents.A!.mediaBookmarks.clip!.epoch, timeSec: 1, paused: false, ended: false })).toThrow('INVALID_TARGET');
  });
  it('seek without playback stays paused and rejects endpoints/other pages', () => {
    const trimmed = run(fixture(), { type: 'SET_MEDIA_PLAYBACK', playback });
    expect(run(trimmed, { type: 'SEEK_MEDIA', timeSec: 5 }).documents.A!.mediaBookmarks.clip?.paused).toBe(true);
    for (const timeSec of [2, 9, Infinity]) expect(() => run(trimmed, { type: 'SEEK_MEDIA', timeSec })).toThrow('INVALID_TARGET');
    expect(() => run(trimmed, { type: 'SEEK_MEDIA', slideId: 'A-1', timeSec: 4 })).toThrow('INVALID_TARGET');
  });
  it('uses trim end for ended/autoplay and restarts at trim start', () => {
    const trimmed = run(fixture(), { type: 'SET_MEDIA_PLAYBACK', playback });
    const playing = run(trimmed, { type: 'PLAY_MEDIA' }); playing.documents.A!.mediaBookmarks.clip!.autoplayEpoch = 'cycle';
    const ended = run(playing, { type: 'CHECKPOINT_MEDIA', epoch: playing.documents.A!.mediaBookmarks.clip!.epoch, timeSec: 9, paused: true, ended: true });
    expect(mediaEndedForAutoplay(ended.documents.A!, 'A-2', 'cycle')).toBe(true);
    assertSessionRecord({ session: ended, receipts: [] });
    expect(run(ended, { type: 'PLAY_MEDIA' }).documents.A!.mediaBookmarks.clip?.timeSec).toBe(3);
  });
  it('retains settings and paused seek in metadata-only backup', () => {
    const moved = run(run(fixture(), { type: 'SET_MEDIA_PLAYBACK', playback }), { type: 'SEEK_MEDIA', timeSec: 6 });
    const restored = restoreSessionBundle(createSessionBundle(moved, 500), 'new', 600);
    expect(restored.documents.A!.localMedia!.clip!.playback).toEqual(playback); expect(restored.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 6, paused: true });
  });
  it('allows only Remote exact shaped requests', () => {
    const command = { type: 'SET_MEDIA_PLAYBACK', sessionId: 's', documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: 0, commandId: 'id', playback };
    const request = { type: 'SESSION_COMMAND' as const, command: command as SessionCommand };
    expect(isSessionRequest(request)).toBe(true); expect(canRequest('remote', request)).toBe(true);
    for (const role of ['player', 'editor', 'launcher'] as const) expect(canRequest(role, request)).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...command, extra: true } })).toBe(false);
  });
});
