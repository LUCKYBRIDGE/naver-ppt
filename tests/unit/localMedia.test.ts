import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { isLocalMediaRef } from '../../src/media/validation';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { isSessionRequest, canRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';
import { readMediaInput } from '../../src/media/input';
import { SourceVault, type SourceHandleStore } from '../../src/storage/sourceVault';
const ref = { id: 'clip', slideId: 'A-2', kind: 'audio' as const, mime: 'audio/wav' as const, name: 'Synthetic-private.wav', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64), durationSec: 20 };
function fixture() { const session = fixtureSession(); session.documents.A!.localMedia = { clip: structuredClone(ref) }; return session; }
function play(session = fixture()): SessionCommand { return { type: 'PLAY_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: session.revision, commandId: 'play' }; }
function checkpoint(session = fixture(), extra = {}): Extract<SessionCommand, { type: 'CHECKPOINT_MEDIA' }> {
  return { type: 'CHECKPOINT_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: session.revision, commandId: 'checkpoint', epoch: 'play', timeSec: 7, paused: false, ended: false, ...extra };
}
describe('local media reference/playback boundary', () => {
  it('reads SHA256 of a bounded WAV header and rejects renamed binary input', async () => {
    const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8);
    expect(await readMediaInput(new File([bytes], 'Synthetic.wav'))).toMatchObject({ kind: 'audio', mime: 'audio/wav', fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) });
    await expect(readMediaInput(new File([bytes], 'Renamed.mp4'))).rejects.toThrow();
    await expect(readMediaInput(new File([], 'Empty.wav'))).rejects.toThrow();
  });
  it('revalidates native media reference using the injected validator, not the PDF parser', async () => {
    const bytes = new Uint8Array(44); bytes.set(new TextEncoder().encode('RIFF')); bytes.set(new TextEncoder().encode('WAVE'), 8);
    const file = new File([bytes], 'Synthetic.wav'), input = await readMediaInput(file);
    const handles: SourceHandleStore = { read: async key => ({ key, fingerprint: input.fingerprint, handle: { kind: 'file', getFile: async () => file } as FileSystemFileHandle }), write: async () => {} };
    const vault = new SourceVault(handles, undefined, readMediaInput);
    expect((await vault.get('synthetic-media', input.fingerprint)).file).toBe(file); vault.close();
    const pdfVault = new SourceVault(handles); await expect(pdfVault.get('synthetic-media', input.fingerprint)).rejects.toThrow(); pdfVault.close();
  });
  it('treats hostile-looking media IDs as own keys without changing map prototype', () => {
    const session = fixtureSession(), media = { ...ref, id: '__proto__' };
    const added = reduceSession(session, { type: 'ADD_LOCAL_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: session.revision, commandId: 'add', media }, 10);
    expect(toPlayerSnapshot(added).media[0]?.bookmark).toBeNull();
    const next = reduceSession(added, { type: 'PLAY_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: added.revision, commandId: 'play', mediaId: '__proto__' }, 20);
    expect(Object.getPrototypeOf(next.documents.A!.mediaBookmarks)).toBe(Object.prototype); expect(Object.hasOwn(next.documents.A!.mediaBookmarks, '__proto__')).toBe(true);
    assertSessionRecord({ session: next, receipts: [] });
  });
  it('validates bounded reference metadata and rejects binaries/URL/unverified duration', () => {
    expect(isLocalMediaRef(ref)).toBe(true);
    for (const bad of [{ ...ref, bytes: [1] }, { ...ref, url: 'https://example.com' }, { ...ref, size: 129 * 1024 * 1024 }, { ...ref, durationSec: Infinity }, { ...ref, kind: 'video' }, { ...ref, fingerprint: 'not-hash' }]) expect(isLocalMediaRef(bad)).toBe(false);
  });
  it('registers on editor target without changing presented/editor selection and rejects duplicate/unknown page', () => {
    const session = fixtureSession(), command: SessionCommand = { type: 'ADD_LOCAL_MEDIA', sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: session.revision, commandId: 'add', media: ref };
    const next = reduceSession(session, command, 10); expect(next.documents.A!.localMedia?.clip).toEqual(ref); expect(next.presentedSelection).toEqual(session.presentedSelection);
    expect(() => reduceSession(next, { ...command, revision: next.revision }, 20)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(session, { ...command, slideId: 'missing' }, 20)).toThrow('INVALID_TARGET');
  });
  it('plays current media, checkpoints position and protects immutable input', () => {
    const session = fixture(), first = reduceSession(session, play(session), 10), next = reduceSession(first, checkpoint(first), 20);
    expect(session.documents.A!.mediaBookmarks).toEqual({}); expect(next.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 7, paused: false, epoch: 'play' });
    expect(next.editorSelection).toEqual(session.editorSelection); assertSessionRecord({ session: next, receipts: [] });
  });
  it('pause changes epoch so stale running checkpoint cannot undo teacher pause', () => {
    const first = reduceSession(fixture(), play(), 10);
    const paused = reduceSession(first, { type: 'PAUSE_MEDIA', sessionId: first.id, documentId: 'A', slideId: 'A-2', mediaId: 'clip', revision: first.revision, commandId: 'pause' }, 20);
    expect(() => reduceSession(paused, checkpoint(paused), 30)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(paused, checkpoint(paused, { epoch: 'pause' }), 30)).toThrow('INVALID_TARGET');
    expect(reduceSession(paused, checkpoint(paused, { epoch: 'pause', paused: true }), 30).documents.A!.mediaBookmarks.clip?.timeSec).toBe(7);
  });
  it('allows paused tail after document switch, not stale running or wrong epoch', () => {
    const first = reduceSession(fixture(), play(), 10); first.presentedSelection = null; first.documents.A!.mediaBookmarks.clip!.paused = true;
    expect(reduceSession(first, checkpoint(first, { paused: true }), 20).documents.A!.mediaBookmarks.clip?.timeSec).toBe(7);
    expect(() => reduceSession(first, checkpoint(first), 20)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(first, checkpoint(first, { epoch: 'old', paused: true }), 20)).toThrow('INVALID_TARGET');
  });
  it('validates ended time and restart after native end', () => {
    const first = reduceSession(fixture(), play(), 10);
    expect(() => reduceSession(first, checkpoint(first, { ended: true, paused: true }), 20)).toThrow('INVALID_TARGET');
    const ended = reduceSession(first, checkpoint(first, { timeSec: 20, ended: true, paused: true }), 20);
    const restarted = reduceSession(ended, play(ended), 30); expect(restarted.documents.A!.mediaBookmarks.clip).toMatchObject({ timeSec: 0, ended: false, paused: false });
  });
  it('backups keep metadata only and restore paused; public excludes filenames', () => {
    const session = reduceSession(fixture(), play(), 10), bundle = createSessionBundle(session, 20), restored = restoreSessionBundle(bundle, 'restore', 30);
    expect(restored.documents.A!.localMedia).toEqual(session.documents.A!.localMedia); expect(restored.documents.A!.mediaBookmarks.clip?.paused).toBe(true);
    const snapshot = toPlayerSnapshot(session); expect(snapshot.media[0]?.ref.fingerprint).toBe(ref.fingerprint); expect(JSON.stringify(snapshot)).not.toMatch(/private|fileHandleKey|presenterNote|Synthetic/);
    snapshot.media[0]!.ref.durationSec = 2; expect(session.documents.A!.localMedia!.clip!.durationSec).toBe(20);
  });
  it('narrows role/shape and cannot forge URL or unknown fields in checkpoint', () => {
    const request = { type: 'SESSION_COMMAND' as const, command: checkpoint() }; expect(isSessionRequest(request)).toBe(true);
    expect(canRequest('player', request)).toBe(true); expect(canRequest('remote', request)).toBe(false); expect(canRequest('editor', request)).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...request.command, url: 'blob:foreign' } })).toBe(false);
  });
});
