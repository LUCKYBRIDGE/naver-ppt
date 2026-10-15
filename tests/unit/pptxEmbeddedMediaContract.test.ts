import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { isLocalMediaRef, isPptxEmbeddedMediaSource } from '../../src/media/validation';
import { reduceSession } from '../../src/core/session';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { matchPptxEmbeddedMedia, pptxEmbeddedSource, type PreparedPptxMedia } from '../../src/adapters/pptx/embeddedMedia';
import type { LocalMediaRef } from '../../src/media/types';
const fingerprint = 'a'.repeat(64);
const origin = () => ({ type: 'pptx' as const, sourceFingerprint: fingerprint, sourcePart: 'ppt/slides/slide2.xml', elementPath: [2, 0] });
const ref = (): LocalMediaRef => ({ id: 'embedded', slideId: 'A-2', kind: 'audio', mime: 'audio/wav', name: 'Synthetic-private.wav',
  size: 44, lastModified: 0, durationSec: 4, fingerprint: 'b'.repeat(64), embeddedSource: origin() });
const fixture = () => { const session = fixtureSession(); session.documents.A!.source.type = 'pptx'; return session; };
function add(media = ref(), session = fixture()) { return reduceSession(session, { type: 'ADD_LOCAL_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: session.revision, commandId: 'add', media }, 10); }
const prepared = (): PreparedPptxMedia => ({ slideId: 'A-2', ...origin(), file: new File([new Uint8Array(44)], 'Synthetic.wav'), input: { kind: 'audio', mime: 'audio/wav', fingerprint: 'b'.repeat(64) } });
describe('PPTX embedded media durable source contract', () => {
  it('preserves old local refs and validates bounded source metadata', () => {
    expect(isPptxEmbeddedMediaSource(origin())).toBe(true); const old = ref(); delete old.embeddedSource; expect(isLocalMediaRef(old)).toBe(true);
  });
  it.each([
    { url: 'https://example.invalid' }, { type: 'pdf' }, { sourceFingerprint: 'b' }, { sourcePart: '../slide2.xml' },
    { sourcePart: 'ppt/slides/a%2f.xml' }, { elementPath: [] }, { elementPath: [NaN] }, { elementPath: [-1] },
    { elementPath: [1.5] }, { elementPath: [100000] }, { elementPath: Array(34).fill(0) }, { elementPath: Array(1) },
  ])('rejects malformed or injected source %j', change => {
    expect(isLocalMediaRef({ ...ref(), embeddedSource: { ...origin(), ...change } })).toBe(false);
  });
  it('rejects PDF or different-original attachments in commands and durable records', () => {
    expect(() => add(ref(), fixtureSession())).toThrow('INVALID_TARGET');
    const wrong = ref(); wrong.embeddedSource!.sourceFingerprint = 'c'.repeat(64);
    expect(() => add(wrong)).toThrow('INVALID_TARGET');
    const session = add(), source = session.documents.A!.source;
    if (source.type === 'pptx') source.fingerprint = 'c'.repeat(64);
    expect(() => assertSessionRecord({ session, receipts: [] })).toThrow('INVALID_RECORD');
  });
  it('rejects a second ID for the same source occurrence but allows identical bytes at a different occurrence', () => {
    const session = add(), second = ref(); second.id = 'second';
    expect(() => add(second, session)).toThrow('INVALID_TARGET');
    second.embeddedSource!.elementPath = [2, 1]; const accepted = add(second, session); assertSessionRecord({ session: accepted, receipts: [] });
    accepted.documents.A!.localMedia!.second!.embeddedSource!.elementPath = [2, 0];
    expect(() => assertSessionRecord({ session: accepted, receipts: [] })).toThrow('INVALID_RECORD');
  });
  it('backs up metadata without bytes/URLs, restores paused and deeply clones public source without filenames', () => {
    const session = add(); session.documents.A!.mediaBookmarks.embedded = { mediaId: 'embedded', slideId: 'A-2', timeSec: 2, paused: false, replayPolicy: 'ask', epoch: 'play' };
    const bundle = createSessionBundle(session, 20), restored = restoreSessionBundle(bundle, 'restored', 30);
    expect(restored.documents.A!.localMedia!.embedded!.embeddedSource).toEqual(origin());
    expect(restored.documents.A!.mediaBookmarks.embedded!.paused).toBe(true); expect(restored.presentedSelection).toBeNull();
    const snapshot = toPlayerSnapshot(session); expect(JSON.stringify(snapshot)).not.toMatch(/Synthetic|private|blob:|https:/);
    snapshot.media[0]!.ref.embeddedSource!.elementPath[0] = 9; expect(session.documents.A!.localMedia!.embedded!.embeddedSource!.elementPath).toEqual([2, 0]);
  });
  it('reconnects only exact original/part/path/slide and verified asset, never first or hash-only match', () => {
    const item = prepared(); expect(pptxEmbeddedSource(item)).toEqual(origin()); expect(matchPptxEmbeddedMedia(ref(), [item])).toBe(item);
    for (const change of [{ slideId: 'A-1' }, { sourceFingerprint: 'c'.repeat(64) }, { sourcePart: 'ppt/slides/slide1.xml' }, { elementPath: [0] }, { input: { ...item.input, fingerprint: 'c'.repeat(64) } }, { file: new File(['x'], 'Small.wav') }]) {
      expect(() => matchPptxEmbeddedMedia(ref(), [{ ...item, ...change }])).toThrow('PPTX_MEDIA_RECONNECT_MISMATCH');
    }
    expect(() => matchPptxEmbeddedMedia(ref(), [])).toThrow(); expect(() => matchPptxEmbeddedMedia(ref(), [item, item])).toThrow();
  });
});
