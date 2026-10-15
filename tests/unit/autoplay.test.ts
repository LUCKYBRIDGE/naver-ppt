import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { autoplayDue, autoplayNextSlide, elapsedAutoplay, pauseAutoplay, resolveAutoplay } from '../../src/media/autoplay';
import { reduceSession } from '../../src/core/session';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import type { AutoplayRule } from '../../src/media/types';

function fixture() {
  const session = fixtureSession(), document = session.documents.A!;
  document.autoplayCheckpoint = { epoch: 'start', slideId: 'A-2', elapsedMs: 500, startedAt: 100, paused: false };
  document.mediaBookmarks.clip = { mediaId: 'clip', slideId: 'A-2', timeSec: 7, paused: false, replayPolicy: 'resume' };
  session.documents.B = { ...structuredClone(document), id: 'B', lastSlideId: 'A-1', mediaBookmarks: {}, autoplayCheckpoint: { epoch: 'B', slideId: 'A-1', elapsedMs: 200, startedAt: null, paused: true } };
  session.documentOrder.push('B'); return session;
}
const seconds: AutoplayRule = { mode: 'seconds', seconds: 5, loop: 'none', pauseWhileEditing: false };
describe('autoplay timing and document switch foundation', () => {
  it('resolves slide > document > session without leaking or mutating stored rules', () => {
    const session = fixture(), document = session.documents.A!; session.defaultAutoplay = seconds;
    expect(resolveAutoplay(session, document, 'A-2')).toEqual(seconds);
    document.autoplay = { ...seconds, seconds: 3 }; expect(resolveAutoplay(session, document, 'A-2').seconds).toBe(3);
    document.slideDeltas['A-2']!.autoplay = { ...seconds, seconds: 2 };
    const rule = resolveAutoplay(session, document, 'A-2'); expect(rule.seconds).toBe(2); rule.seconds = 99;
    expect(document.slideDeltas['A-2']!.autoplay.seconds).toBe(2);
  });
  it('uses elapsed timestamps, pauses once and ignores backwards wall-clock deltas', () => {
    const checkpoint = fixture().documents.A!.autoplayCheckpoint!;
    expect(elapsedAutoplay(checkpoint, 3100)).toBe(3500); expect(elapsedAutoplay(checkpoint, 50)).toBe(500);
    const paused = pauseAutoplay(checkpoint, 3100); expect(paused).toMatchObject({ elapsedMs: 3500, startedAt: null, paused: true });
    expect(pauseAutoplay(paused, 9000)).toEqual(paused); expect(() => elapsedAutoplay(checkpoint, NaN)).toThrow();
  });
  it('requires both time and media for later-of, no guessed media-end when unavailable', () => {
    expect(autoplayDue(seconds, 4999, null)).toBe(false); expect(autoplayDue(seconds, 5000, null)).toBe(true);
    expect(autoplayDue({ ...seconds, mode: 'manual' }, 50000, true)).toBe(false);
    expect(autoplayDue({ ...seconds, mode: 'media-end' }, 0, null)).toBe(false);
    expect(autoplayDue({ ...seconds, mode: 'media-end' }, 0, true)).toBe(true);
    const later = { ...seconds, mode: 'later-of-time-and-media' as const };
    expect(autoplayDue(later, 5000, false)).toBe(false); expect(autoplayDue(later, 1000, true)).toBe(false);
    expect(autoplayDue(later, 5000, true)).toBe(true); expect(autoplayDue({ ...seconds, seconds: NaN }, 5000, true)).toBe(false);
  });
  it('finds next/terminal/slide/document/range targets by IDs and refuses invalid ranges', () => {
    const document = fixture().documents.A!;
    expect(autoplayNextSlide(document, 'A-1', seconds)).toBe('A-2'); expect(autoplayNextSlide(document, 'A-2', seconds)).toBeNull();
    expect(autoplayNextSlide(document, 'A-2', { ...seconds, loop: 'document' })).toBe('A-1');
    expect(autoplayNextSlide(document, 'A-2', { ...seconds, loop: 'slide' })).toBe('A-2');
    const range = { ...seconds, loop: 'range' as const, range: { startSlideId: 'A-1', endSlideId: 'A-2' } };
    expect(autoplayNextSlide(document, 'A-2', range)).toBe('A-1');
    expect(autoplayNextSlide(document, 'A-1', { ...range, range: { startSlideId: 'A-2', endSlideId: 'A-1' } })).toBeNull();
    expect(autoplayNextSlide(document, 'missing', range)).toBeNull(); document.closed = true; expect(autoplayNextSlide(document, 'A-2', range)).toBeNull();
  });
  it('pauses previous playback and document timer, preserves bookmarks/last-page/deltas, return stays paused', () => {
    const original = fixture(); original.globalTimer = { scope: 'document', documentId: 'A', durationSec: 60, startedAt: 100, elapsedBeforeStartMs: 50, paused: false };
    const before = structuredClone(original), next = reduceSession(original, { type: 'ACTIVATE_DOCUMENT', sessionId: original.id, revision: 4, commandId: 'switch', documentId: 'B', slideId: null }, 1100);
    expect(original).toEqual(before); expect(next.documents.A!.autoplayCheckpoint).toMatchObject({ elapsedMs: 1500, paused: true, startedAt: null });
    expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 7, paused: true }); expect(next.documents.A!.slideDeltas).toEqual(original.documents.A!.slideDeltas);
    expect(next.globalTimer).toMatchObject({ elapsedBeforeStartMs: 1050, startedAt: null, paused: true }); expect(next.editorSelection).toEqual(original.editorSelection);
    const back = reduceSession(next, { type: 'ACTIVATE_DOCUMENT', sessionId: next.id, revision: next.revision, commandId: 'return', documentId: 'A', slideId: null }, 3100);
    expect(back.presentedSelection?.slideId).toBe('A-2'); expect(back.documents.A!.autoplayCheckpoint).toEqual(next.documents.A!.autoplayCheckpoint);
  });
  it('does not pause on same-document activation, editor navigation or session timer across documents', () => {
    const session = fixture(); session.globalTimer = { scope: 'session', documentId: null, durationSec: 60, startedAt: 100, elapsedBeforeStartMs: 0, paused: false };
    for (const command of [{ type: 'ACTIVATE_DOCUMENT' as const, documentId: 'A', slideId: null }, { type: 'SELECT_EDITOR_SLIDE' as const, documentId: 'B', slideId: 'A-1' }]) {
      const next = reduceSession(session, { ...command, sessionId: session.id, revision: 4, commandId: command.type }, 1100);
      expect(next.documents.A!.autoplayCheckpoint).toEqual(session.documents.A!.autoplayCheckpoint); expect(next.globalTimer).toEqual(session.globalTimer);
    }
    const next = reduceSession(session, { type: 'ACTIVATE_DOCUMENT', documentId: 'B', slideId: null, sessionId: session.id, revision: 4, commandId: 'switch' }, 1100);
    expect(next.globalTimer).toEqual(session.globalTimer);
  });
  it('manual page changes stop page playback/reset epoch but leave document timer running', () => {
    const session = fixture(); session.globalTimer = { scope: 'document', documentId: 'A', durationSec: 60, startedAt: 100, elapsedBeforeStartMs: 0, paused: false };
    const next = reduceSession(session, { type: 'GOTO_SLIDE', documentId: 'A', slideId: 'A-1', sessionId: session.id, revision: 4, commandId: 'manual' }, 1100);
    expect(next.documents.A!.autoplayCheckpoint).toEqual({ slideId: 'A-1', epoch: 'manual', elapsedMs: 0, startedAt: null, paused: true });
    expect(next.globalTimer).toEqual(session.globalTimer); expect(next.documents.A!.mediaBookmarks.clip?.timeSec).toBe(7);
  });
  it('validates checkpoint shape/active scope and preserves checkpoint through backup with paused restore', () => {
    const session = fixture(); assertSessionRecord({ session, receipts: [] });
    const bundle = createSessionBundle(session, 1100), before = structuredClone(bundle), restored = restoreSessionBundle(bundle, 'restored', 3100);
    expect(bundle).toEqual(before); expect(restored.presentedSelection).toBeNull();
    expect(restored.documents.A!.autoplayCheckpoint).toMatchObject({ elapsedMs: 1500, startedAt: null, paused: true });
    const bad = structuredClone(session); bad.documents.A!.autoplayCheckpoint!.elapsedMs = -1;
    expect(() => assertSessionRecord({ session: bad, receipts: [] })).toThrow();
    bad.documents.A!.autoplayCheckpoint!.elapsedMs = 0; bad.documents.A!.autoplayCheckpoint!.slideId = 'missing';
    expect(() => assertSessionRecord({ session: bad, receipts: [] })).toThrow();
    const inactive = structuredClone(session); inactive.documents.B!.autoplayCheckpoint = { epoch: 'bad', slideId: 'A-1', elapsedMs: 0, startedAt: 0, paused: false };
    expect(() => assertSessionRecord({ session: inactive, receipts: [] })).toThrow();
  });
});
