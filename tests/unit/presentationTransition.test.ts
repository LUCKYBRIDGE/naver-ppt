import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { isPresentationTransition } from '../../src/core/presentationTransition';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { createSessionBundle, restoreSessionBundle } from '../../src/storage/sessionBundle';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { canRequest, isSessionRequest } from '../../src/shared/sessionMessages';
import { SessionService } from '../../src/storage/sessionService';
import type { SessionRecord } from '../../src/storage/sessionService';
import type { SessionCommand } from '../../src/core/commands';
function setup(closed = false) {
  const session = fixtureSession();
  session.documents.B = { id: 'B', source: { type: 'pptx', name: 'Synthetic.pptx', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64) }, knownSlideCount: 2, slideIds: ['B-1', 'B-2'], lastSlideId: 'B-1', mediaBookmarks: {}, slideDeltas: {}, dirty: false, closed };
  session.documentOrder.push('B');
  const request: SessionCommand = { type: 'REQUEST_PRESENTATION', sessionId: session.id, commandId: 'request', revision: session.revision, documentId: 'B', slideId: 'B-2', playerId: 'owner' };
  const pending = reduceSession(session, request, 10);
  const commit: SessionCommand = { type: 'COMMIT_PRESENTATION', sessionId: session.id, commandId: 'commit', revision: pending.revision, documentId: 'B', slideId: 'B-2', playerId: 'owner', requestId: 'request' };
  return { session, request, pending, commit };
}
describe('durable presentation intent separate from current playback', () => {
  it('binds a bounded source-v1 checkpoint stamp and rejects later target completion changes', () => {
    const { session, request } = setup();
    session.documents.B!.pptxPlayback = { run: null, checkpoints: { 'B-2': { renderer: 'web-ppt-0.4.5/source-v1', fingerprint: 'b'.repeat(64), completedGroups: 5, pose: { version: 1, scope: { sessionId: session.id, documentId: 'B', slideId: 'B-2', revision: 3 }, entries: [] } } } };
    const pending = reduceSession(session, request, 10);
    expect(pending.presentationTransition?.checkpoint).toEqual(['web-ppt-0.4.5/source-v1', 5, 3]); expect(() => assertSessionRecord({ session: pending, receipts: [] })).not.toThrow();
    const changed = structuredClone(pending); changed.documents.B!.pptxPlayback!.checkpoints['B-2']!.completedGroups = 6;
    expect(() => assertSessionRecord({ session: changed, receipts: [] })).toThrow();
  });
  it.each(['request', 'commit'] as const)('does not acknowledge or mutate %s when durable commit fails', async phase => {
    const { session, request, pending, commit } = setup();
    const record = { session: phase === 'request' ? session : pending, receipts: [] }, before = structuredClone(record);
    const service = new SessionService({ read: async () => structuredClone(record), async commit() { throw Error('Synthetic persistence failure'); } }, () => 20);
    expect(await service.execute(phase === 'request' ? request : commit)).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' }); expect(record).toEqual(before);
  });
  it('preserves selection, media, overlays, editor and original when requesting', () => {
    const { session, pending } = setup(); expect(pending.revision).toBe(session.revision + 1);
    expect(pending.presentedSelection).toEqual(session.presentedSelection); expect(pending.editorSelection).toEqual(session.editorSelection);
    expect(pending.documents).toEqual(session.documents); expect(pending.history).toEqual(session.history);
    expect(pending.presentationTransition).toMatchObject({ requestId: 'request', playerId: 'owner', slideId: 'B-2', from: session.presentedSelection, fingerprint: 'b'.repeat(64) });
    expect(toPlayerSnapshot(pending).presentationTransition).toEqual(pending.presentationTransition);
    expect(JSON.stringify(pending.presentationTransition)).not.toContain('Synthetic');
    expect(() => assertSessionRecord({ session: pending, receipts: [] })).not.toThrow();
  });
  it.each([false, true])('commits one explicit target atomically, including closed=%s', closed => {
    const { pending, commit } = setup(closed), before = structuredClone(pending), result = reduceSession(pending, commit, 20);
    expect(result.presentedSelection).toEqual({ documentId: 'B', slideId: 'B-2' }); expect(result.documents.B?.closed).toBe(false);
    expect(result.documents.B?.lastSlideId).toBe('B-2'); expect(result.editorSelection).toEqual(before.editorSelection); expect(result.presentationTransition).toBeNull();
    expect(result.revision).toBe(pending.revision + 1); expect(pending).toEqual(before);
  });
  it.each(['CANCEL_PRESENTATION', 'REJECT_PRESENTATION'] as const)('clears %s without stopping or switching current playback', type => {
    const { pending, commit } = setup();
    const command: SessionCommand = type === 'CANCEL_PRESENTATION' ? { type, commandId: 'cancel', sessionId: pending.id, revision: pending.revision, documentId: 'B', slideId: 'B-2', requestId: 'request' } : { ...commit, type };
    const result = reduceSession(pending, command, 20);
    expect(result.presentationTransition).toBeNull(); expect(result.presentedSelection).toEqual(pending.presentedSelection); expect(result.documents).toEqual(pending.documents);
    expect(() => reduceSession(result, { ...commit, revision: result.revision }, 30)).toThrow();
  });
  it.each(['request', 'owner', 'page', 'revision'] as const)('rejects a wrong %s without mutating the pending state', kind => {
    const { pending, commit } = setup(), before = structuredClone(pending);
    const wrong = { ...commit, ...(kind === 'request' ? { requestId: 'old' } : kind === 'owner' ? { playerId: 'other' } : kind === 'page' ? { slideId: 'B-1' } : { revision: pending.revision - 1 }) };
    expect(() => reduceSession(pending, wrong, 20)).toThrow(); expect(pending).toEqual(before);
  });
  it('allows editor notes while invalidating a competing audience transition', () => {
    const { pending, commit } = setup();
    const edited = reduceSession(pending, { type: 'SET_PRESENTER_NOTE', commandId: 'note', sessionId: pending.id, revision: pending.revision, documentId: 'A', slideId: 'A-1', note: 'Synthetic' }, 20);
    expect(edited.presentationTransition).toEqual(pending.presentationTransition);
    expect(reduceSession(edited, { ...commit, revision: edited.revision }, 30).presentedSelection?.documentId).toBe('B');
    const moved = reduceSession(pending, { type: 'GOTO_SLIDE', commandId: 'move', sessionId: pending.id, revision: pending.revision, documentId: 'A', slideId: 'A-1' }, 20);
    expect(moved.presentationTransition).toBeNull(); expect(() => reduceSession(moved, { ...commit, revision: moved.revision }, 30)).toThrow();
  });
  it('invalidates target overlay changes and rejects concurrent requests', () => {
    const { pending, request } = setup();
    expect(() => reduceSession(pending, { ...request, commandId: 'second', revision: pending.revision }, 20)).toThrow();
    const edited = reduceSession(pending, { type: 'SET_SLIDE_OVERLAYS', commandId: 'overlay', sessionId: pending.id, revision: pending.revision, documentId: 'B', slideId: 'B-2', overlays: [] }, 20);
    expect(edited.presentationTransition).toBeNull();
  });
  it('keeps old records valid and clears historical transition intent in a new backup session', () => {
    const { session, pending } = setup(); expect(() => assertSessionRecord({ session, receipts: [] })).not.toThrow();
    const restored = restoreSessionBundle(createSessionBundle(pending, 20), 'restored', 30);
    expect(restored.presentationTransition).toBeNull(); expect(restored.presentedSelection).toBeNull(); expect(restored.documents.B?.lastSlideId).toBe('B-1');
  });
  it('rejects tampered intent fields and mismatched source fingerprints at the record boundary', () => {
    const { pending } = setup();
    expect(isPresentationTransition({ ...pending.presentationTransition, arbitrary: true })).toBe(false);
    expect(() => assertSessionRecord({ session: { ...pending, presentationTransition: undefined }, receipts: [] })).toThrow();
    expect(isPresentationTransition({ ...pending.presentationTransition, from: Object.assign(Object.create({ documentId: 'A', slideId: 'A-2' }), { fake: 1, extra: 2 }) })).toBe(false);
    for (const change of [{ fingerprint: 'c'.repeat(64) }, { from: null }, { closed: true }, { checkpoint: ['unknown', 1, 0] }]) {
      const bad = structuredClone(pending); Object.assign(bad.presentationTransition!, change); expect(() => assertSessionRecord({ session: bad, receipts: [] })).toThrow();
    }
  });
  it('enforces role and strict payload keys for each new command', () => {
    const { request, commit } = setup();
    for (const command of [request, commit]) { const value = { type: 'SESSION_COMMAND' as const, command }; expect(isSessionRequest(value)).toBe(true); expect(isSessionRequest({ ...value, extra: 1 })).toBe(false); expect(isSessionRequest({ ...value, command: { ...command, extra: 1 } })).toBe(false); }
    expect(canRequest('remote', { type: 'SESSION_COMMAND', command: request })).toBe(true); expect(canRequest('player', { type: 'SESSION_COMMAND', command: request })).toBe(false);
    expect(canRequest('player', { type: 'SESSION_COMMAND', command: commit })).toBe(true); expect(canRequest('remote', { type: 'SESSION_COMMAND', command: commit })).toBe(false); expect(canRequest('editor', { type: 'SESSION_COMMAND', command: commit })).toBe(false);
    const target = { type: 'GET_PRESENTATION_TARGET' as const, sessionId: 'original', requestId: 'request', playerId: 'owner' };
    expect(isSessionRequest(target)).toBe(true); expect(isSessionRequest({ ...target, privateNote: 'Synthetic' })).toBe(false);
    expect(canRequest('player', target)).toBe(true); expect(canRequest('remote', target)).toBe(false); expect(canRequest('editor', target)).toBe(false);
    const owner = { type: 'GET_PRESENTATION_OWNER' as const, sessionId: 'original' };
    expect(isSessionRequest(owner)).toBe(true); expect(isSessionRequest({ ...owner, playerId: 'owner' })).toBe(false);
    expect(canRequest('remote', owner)).toBe(true);
    for (const role of ['player', 'editor', 'launcher'] as const) expect(canRequest(role, owner)).toBe(false);
  });
  it('stores request/commit receipts atomically and does not reapply duplicate commit', async () => {
    const { session, request } = setup(); let record: SessionRecord = { session, receipts: [] };
    const service = new SessionService({ read: async () => structuredClone(record), async commit(next, expected) { expect(record.session.revision).toBe(expected); assertSessionRecord(next); record = structuredClone(next); } }, () => 20);
    expect((await service.execute(request)).ok).toBe(true);
    const commit: SessionCommand = { type: 'COMMIT_PRESENTATION', sessionId: session.id, documentId: 'B', slideId: 'B-2', revision: record.session.revision, requestId: 'request', playerId: 'owner', commandId: 'commit' };
    expect((await service.execute(commit)).ok).toBe(true); const saved = structuredClone(record);
    expect(await service.execute(commit)).toMatchObject({ ok: true, duplicate: true }); expect(record).toEqual(saved);
  });
});
