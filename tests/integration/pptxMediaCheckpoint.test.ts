import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { isSessionRequest, canRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';
const playback = { startSec: .2, endSec: 3.8, volume: .25, muted: true };
function fixture() {
  const session = fixtureSession(); session.revision = 0; session.documents.A!.source.type = 'pptx';
  session.documents.A!.localMedia = { clip: { id: 'clip', slideId: 'A-2', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: 100,
    lastModified: 0, fingerprint: 'b'.repeat(64), durationSec: 4, playback: { ...playback },
    embeddedSource: { type: 'pptx', sourceFingerprint: 'a'.repeat(64), sourcePart: 'ppt/slides/slide2.xml', elementPath: [1] } } };
  return reduceSession(session, { type: 'BEGIN_PPTX_GROUP', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: 0, commandId: 'run' }, 2);
}
const command = (revision = 1): Extract<SessionCommand, { type: 'CHECKPOINT_PPTX_MEDIA' }> => ({ type: 'CHECKPOINT_PPTX_MEDIA', sessionId: 'original', documentId: 'A', slideId: 'A-2',
  revision, commandId: 'native-result', mediaId: 'clip', epoch: 'run', expectedMediaEpoch: null, playback: { ...playback }, timeSec: 1.25, paused: false, ended: false });
const cancel = (revision: number) => ({ type: 'CANCEL_PPTX_GROUP' as const, sessionId: 'original', documentId: 'A', slideId: 'A-2', revision, commandId: 'cancel' });
describe('source media native result durable contract', () => {
  it('records only the matching active source run without completing the group', () => {
    const previous = fixture(), next = reduceSession(previous, command(), 3);
    expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 1.25, paused: false, epoch: 'native-result', positionEpoch: 'native-result', sourceRunEpoch: 'run' });
    expect(next.documents.A!.pptxPlayback).toEqual(previous.documents.A!.pptxPlayback); expect(previous.documents.A!.mediaBookmarks).toEqual({});
    assertSessionRecord({ session: next, receipts: [] });
  });
  it.each(['oldRun', 'oldMedia', 'wrongSettings', 'outside', 'endedWhilePlaying', 'missingRef', 'foreignSource', 'manualMedia', 'pdf', 'wrongSlide'] as const)('rejects %s atomically', boundary => {
    const s = fixture(), c = command();
    if (boundary === 'oldRun') c.epoch = 'older';
    if (boundary === 'oldMedia') c.expectedMediaEpoch = 'older';
    if (boundary === 'wrongSettings') c.playback.volume = .5;
    if (boundary === 'outside') c.timeSec = 4;
    if (boundary === 'endedWhilePlaying') { c.timeSec = 3.8; c.ended = true; }
    if (boundary === 'missingRef') c.mediaId = 'missing';
    if (boundary === 'foreignSource') s.documents.A!.localMedia!.clip!.embeddedSource!.sourceFingerprint = 'c'.repeat(64);
    if (boundary === 'manualMedia') delete s.documents.A!.localMedia!.clip!.embeddedSource;
    if (boundary === 'pdf') s.documents.A!.source.type = 'pdf';
    if (boundary === 'wrongSlide') c.slideId = 'A-1';
    expect(() => reduceSession(s, c, 3)).toThrow('INVALID_TARGET'); expect(s.documents.A!.mediaBookmarks).toEqual({});
  });
  it('invalidates late native results on cancel and pauses only media owned by that run', () => {
    const accepted = reduceSession(fixture(), command(), 3), cancelled = reduceSession(accepted, cancel(2), 4);
    expect(cancelled.documents.A!.mediaBookmarks.clip!.paused).toBe(true);
    expect(() => reduceSession(cancelled, { ...command(3), expectedMediaEpoch: 'native-result' }, 5)).toThrow('INVALID_TARGET');
  });
  it('does not pause a teacher-owned pause/resume after the source command', () => {
    const accepted = reduceSession(fixture(), command(), 3);
    const paused = reduceSession(accepted, { type: 'PAUSE_MEDIA', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: 2, commandId: 'manual-pause' }, 4);
    const playing = reduceSession(paused, { type: 'PLAY_MEDIA', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: 3, commandId: 'manual-play' }, 5);
    expect(reduceSession(playing, cancel(4), 6).documents.A!.mediaBookmarks.clip).toMatchObject({ paused: false, epoch: 'manual-play' });
    expect(() => reduceSession(playing, { ...command(4), expectedMediaEpoch: 'native-result' }, 6)).toThrow('INVALID_TARGET');
  });
  it('volume-only edits retain source ownership while invalidating the old native settings result', () => {
    const accepted = reduceSession(fixture(), command(), 3);
    const changed = reduceSession(accepted, { type: 'SET_MEDIA_PLAYBACK', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip',
      revision: 2, commandId: 'volume', playback: { ...playback, volume: .6 } }, 4);
    expect(changed.documents.A!.mediaBookmarks.clip!.sourceRunEpoch).toBe('run');
    expect(reduceSession(changed, cancel(3), 5).documents.A!.mediaBookmarks.clip!.paused).toBe(true);
    expect(() => reduceSession(changed, { ...command(3), expectedMediaEpoch: 'native-result' }, 5)).toThrow('INVALID_TARGET');
  });
  it('preserves completed source media playback on group ACK and pauses it on reset', () => {
    const accepted = reduceSession(fixture(), command(), 3);
    const completed = reduceSession(accepted, { type: 'CHECKPOINT_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 2, commandId: 'ack', epoch: 'run',
      checkpoint: { renderer: 'web-ppt-0.4.5/source-v1', fingerprint: 'a'.repeat(64), completedGroups: 1,
        pose: { version: 1, scope: { sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 2 }, entries: [] } } }, 4);
    expect(completed.documents.A!.mediaBookmarks.clip!.paused).toBe(false);
    expect(reduceSession(completed, cancel(3), 5).documents.A!.mediaBookmarks.clip!.paused).toBe(false);
    expect(reduceSession(completed, { ...cancel(3), type: 'RESET_PPTX_SLIDE' }, 5).documents.A!.mediaBookmarks.clip!.paused).toBe(true);
    const restored = restoreSessionBundle(createSessionBundle(completed, 5), 'new-session', 6);
    expect(restored.documents.A!.mediaBookmarks.clip!.paused).toBe(true); expect(restored.documents.A!.mediaBookmarks.clip).not.toHaveProperty('sourceRunEpoch');
  });
  it('checks exact message keys and Player-only writer role', () => {
    const request = { type: 'SESSION_COMMAND', command: command() } as const;
    expect(isSessionRequest(request)).toBe(true); expect(canRequest('player', request)).toBe(true);
    for (const role of ['remote', 'editor', 'launcher'] as const) expect(canRequest(role, request)).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...request.command, rawCommand: 'play' } })).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...request.command, expectedMediaEpoch: undefined } })).toBe(false);
  });
  it('persists and deduplicates the result before publication, including after cancellation', async () => {
    const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }), repo = await open();
    const initial = fixture(); initial.revision = 0; initial.documents.A!.pptxPlayback!.run = null; await repo.create(initial); repo.close();
    const publish = vi.fn(), hub = new SessionHub(open, publish), request = { type: 'SESSION_COMMAND', command: command() };
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: { type: 'BEGIN_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 0, commandId: 'run' } })).toMatchObject({ ok: true });
    publish.mockClear();
    const result = await hub.handle('player', request); expect(result).toMatchObject({ ok: true });
    expect(await hub.handle('player', request)).toEqual(result); expect(publish).toHaveBeenCalledOnce();
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: cancel(2) })).toMatchObject({ ok: true });
    expect(await hub.handle('player', request)).toMatchObject({ ok: true });
    const fresh = await open(); expect((await fresh.read('original'))!.session.documents.A!.mediaBookmarks.clip!.paused).toBe(true); fresh.close();
  });
  it('rejects late regular media checkpoints after source cancellation', () => {
    const accepted = reduceSession(fixture(), command(), 3), cancelled = reduceSession(accepted, cancel(2), 4);
    expect(() => reduceSession(cancelled, { type: 'CHECKPOINT_MEDIA', sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip',
      revision: 3, commandId: 'late-native', epoch: 'native-result', timeSec: 1.5, paused: false, ended: false }, 5)).toThrow('INVALID_TARGET');
  });
  it('pauses the abandoned source run when replacing it', () => {
    const accepted = reduceSession(fixture(), command(), 3), replaced = reduceSession(accepted, { type: 'BEGIN_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 2, commandId: 'replacement' }, 4);
    expect(replaced.documents.A!.mediaBookmarks.clip!.paused).toBe(true);
    expect(() => reduceSession(replaced, { ...command(3), expectedMediaEpoch: 'native-result' }, 5)).toThrow('INVALID_TARGET');
  });
  it.each(['missingRef', 'wrongSource'])('rejects stored source-run tag with %s', boundary => {
    const accepted = reduceSession(fixture(), command(), 3);
    if (boundary === 'missingRef') delete accepted.documents.A!.localMedia;
    else accepted.documents.A!.source.type = 'pdf';
    expect(() => assertSessionRecord({ session: accepted, receipts: [] })).toThrow('INVALID_RECORD');
  });
});
