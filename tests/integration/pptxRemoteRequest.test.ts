import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { canRequest, isSessionRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';

function fixture() {
  const s = fixtureSession(); s.revision = 0; s.documents.A!.source.type = 'pptx';
  s.documents.B = { ...structuredClone(s.documents.A!), id: 'B', source: { type: 'pdf', name: 'Synthetic.pdf', size: 1, lastModified: 0 } };
  s.documentOrder.push('B'); return s;
}
function command(type: 'REQUEST_PPTX_GROUP' | 'CANCEL_PPTX_GROUP' | 'RESET_PPTX_SLIDE' | 'BEGIN_PPTX_GROUP', revision = 0, commandId = `${type}-${revision}`): Extract<SessionCommand, { type: 'REQUEST_PPTX_GROUP' | 'CANCEL_PPTX_GROUP' | 'RESET_PPTX_SLIDE' | 'BEGIN_PPTX_GROUP' }> {
  return { type, commandId, sessionId: 'original', documentId: 'A', slideId: 'A-2', revision };
}
function consume(revision = 1, requestId = 'REQUEST_PPTX_GROUP-0'): SessionCommand {
  return { type: 'BEGIN_REQUESTED_PPTX_GROUP', commandId: `consume-${revision}`, requestId,
    sessionId: 'original', documentId: 'A', slideId: 'A-2', revision };
}
function completed() {
  const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1);
  return reduceSession(started, { type: 'CHECKPOINT_PPTX_GROUP', commandId: 'complete', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 1,
    epoch: 'BEGIN_PPTX_GROUP-0', checkpoint: { renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: 'a'.repeat(64), completedGroups: 1,
      pose: { version: 1, scope: { sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 1 }, entries: [] } } }, 2);
}
function queued() { return reduceSession(fixture(), command('REQUEST_PPTX_GROUP'), 1); }

describe('durable Remote PPTX intent', () => {
  it('queues metadata without starting playback or moving Editor selection', () => {
    const before = fixture(), next = reduceSession(before, command('REQUEST_PPTX_GROUP'), 1);
    expect(next.documents.A!.pptxPlayback).toEqual({ checkpoints: {}, run: null, request: { commandId: 'REQUEST_PPTX_GROUP-0', slideId: 'A-2' } });
    expect(next.editorSelection).toEqual(before.editorSelection); expect(before.documents.A!.pptxPlayback).toBeUndefined();
    assertSessionRecord({ session: next, receipts: [] });
  });
  it('atomically consumes the matching request with a different receipt ID', () => {
    const next = reduceSession(queued(), consume(), 2);
    expect(next.documents.A!.pptxPlayback).toEqual({ checkpoints: {}, request: null, run: { epoch: 'consume-1', slideId: 'A-2' } });
    assertSessionRecord({ session: next, receipts: [] });
    expect(() => reduceSession(next, consume(2), 3)).toThrow('INVALID_TARGET');
  });
  it('does not let direct Player BEGIN bypass a pending Remote intent', () => {
    expect(() => reduceSession(queued(), command('BEGIN_PPTX_GROUP', 1), 2)).toThrow('INVALID_TARGET');
  });
  it('rejects extra requests while queued or running', () => {
    expect(() => reduceSession(queued(), command('REQUEST_PPTX_GROUP', 1), 2)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(reduceSession(queued(), consume(), 2), command('REQUEST_PPTX_GROUP', 2), 3)).toThrow('INVALID_TARGET');
  });
  it('rejects a wrong token or token reused as BEGIN commandId', () => {
    expect(() => reduceSession(queued(), consume(1, 'other'), 2)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(queued(), { ...consume(), commandId: 'REQUEST_PPTX_GROUP-0' }, 2)).toThrow('INVALID_TARGET');
  });
  it('cancelled requests cannot run after a newer request even with a fresh revision', () => {
    const cancel = reduceSession(queued(), command('CANCEL_PPTX_GROUP', 1), 2);
    expect(() => reduceSession(cancel, consume(2), 3)).toThrow('INVALID_TARGET');
    const retry = reduceSession(cancel, command('REQUEST_PPTX_GROUP', 2), 3);
    expect(() => reduceSession(retry, consume(3), 4)).toThrow('INVALID_TARGET');
    expect(reduceSession(retry, consume(3, 'REQUEST_PPTX_GROUP-2'), 4).documents.A!.pptxPlayback!.run?.epoch).toBe('consume-3');
  });
  it('cancels a run without deleting the last completed pose', () => {
    const first = completed(), next = reduceSession(first, command('REQUEST_PPTX_GROUP', 2), 3);
    const run = reduceSession(next, consume(3, 'REQUEST_PPTX_GROUP-2'), 4);
    const cancel = reduceSession(run, command('CANCEL_PPTX_GROUP', 4), 5);
    expect(cancel.documents.A!.pptxPlayback!.checkpoints).toEqual(first.documents.A!.pptxPlayback!.checkpoints);
    expect(cancel.documents.A!.pptxPlayback).toMatchObject({ request: null, run: null });
    assertSessionRecord({ session: cancel, receipts: [] });
  });
  it('RESET clears a pending request and resets only the selected completed pose', () => {
    const next = reduceSession(completed(), command('REQUEST_PPTX_GROUP', 2), 3);
    expect(reduceSession(next, command('RESET_PPTX_SLIDE', 3), 4).documents.A!.pptxPlayback).toEqual({ checkpoints: {}, request: null, run: null });
  });
  it('rejects late completion after cancellation at the latest global revision', () => {
    const run = reduceSession(queued(), consume(), 2), cancelled = reduceSession(run, command('CANCEL_PPTX_GROUP', 2), 3);
    expect(() => reduceSession(cancelled, { type: 'CHECKPOINT_PPTX_GROUP', commandId: 'late', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 3,
      epoch: 'consume-1', checkpoint: { renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: 'a'.repeat(64), completedGroups: 1,
        pose: { version: 1, scope: { sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 3 }, entries: [] } } }, 4)).toThrow('INVALID_TARGET');
  });
  it('requires the current revision and a presented PPTX target', () => {
    expect(() => reduceSession(queued(), command('CANCEL_PPTX_GROUP'), 2)).toThrow('STALE_REVISION');
    const wrong = fixture(); wrong.documents.A!.source.type = 'pdf';
    expect(() => reduceSession(wrong, command('REQUEST_PPTX_GROUP'), 1)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(fixture(), { ...command('REQUEST_PPTX_GROUP'), slideId: 'A-1' }, 1)).toThrow('INVALID_TARGET');
  });
  it.each(['GOTO_SLIDE', 'ACTIVATE_DOCUMENT', 'CLOSE_DOCUMENT'] as const)('invalidates pending requests on %s', type => {
    const c: SessionCommand = type === 'GOTO_SLIDE'
      ? { type, documentId: 'A', slideId: 'A-1', sessionId: 'original', revision: 1, commandId: 'away' }
      : { type, documentId: type === 'ACTIVATE_DOCUMENT' ? 'B' : 'A', slideId: null, sessionId: 'original', revision: 1, commandId: 'away' };
    const next = reduceSession(queued(), c, 2);
    expect(next.documents.A!.pptxPlayback!.request).toBeNull();
    assertSessionRecord({ session: next, receipts: [] });
    expect(() => reduceSession(next, consume(2), 3)).toThrow('INVALID_TARGET');
  });
  it('Editor navigation and notes do not cancel a pending request', () => {
    let next = reduceSession(queued(), { type: 'SELECT_EDITOR_SLIDE', sessionId: 'original', documentId: 'B', slideId: 'A-1', revision: 1, commandId: 'edit' }, 2);
    next = reduceSession(next, { type: 'SET_PRESENTER_NOTE', sessionId: 'original', documentId: 'B', slideId: 'A-1', revision: 2, commandId: 'note', note: 'Synthetic private' }, 3);
    expect(reduceSession(next, consume(3), 4).documents.A!.pptxPlayback!.run?.epoch).toBe('consume-3');
  });
  it('projects only current intent as a clone without teacher data', () => {
    const next = queued(), snapshot = toPlayerSnapshot(next);
    expect(snapshot.pptx?.request).toEqual(next.documents.A!.pptxPlayback!.request);
    snapshot.pptx!.request!.commandId = 'changed'; expect(next.documents.A!.pptxPlayback!.request!.commandId).toBe('REQUEST_PPTX_GROUP-0');
    expect(JSON.stringify(snapshot)).not.toContain('Synthetic teacher note');
    const away = reduceSession(next, { type: 'ACTIVATE_DOCUMENT', sessionId: next.id, documentId: 'B', slideId: null, revision: 1, commandId: 'away' }, 2);
    expect(toPlayerSnapshot(away).pptx).toBeUndefined();
  });
  it.each(['request', 'cancel', 'consume'] as const)('validates strict fields and role for %s', kind => {
    const c = kind === 'consume' ? consume() : command(kind === 'request' ? 'REQUEST_PPTX_GROUP' : 'CANCEL_PPTX_GROUP');
    const request = { type: 'SESSION_COMMAND', command: c } as const;
    expect(isSessionRequest(request)).toBe(true);
    expect(isSessionRequest({ ...request, command: { ...c, bytes: [] } })).toBe(false);
    for (const role of ['launcher', 'editor', 'remote', 'player'] as const) expect(canRequest(role, request)).toBe(role === (kind === 'consume' ? 'player' : 'remote'));
  });
  it.each(['extra', 'wrong-slide', 'running', 'closed', 'oversized', 'undefined'] as const)('rejects corrupt stored request: %s', kind => {
    const next = queued(), p = next.documents.A!.pptxPlayback!;
    if (kind === 'extra') Object.assign(p.request!, { bytes: [] });
    if (kind === 'wrong-slide') p.request!.slideId = 'A-1';
    if (kind === 'running') p.run = { epoch: 'run', slideId: 'A-2' };
    if (kind === 'closed') next.documents.A!.closed = true;
    if (kind === 'oversized') p.request!.commandId = 'x'.repeat(201);
    if (kind === 'undefined') Object.assign(p, { request: undefined });
    expect(() => assertSessionRecord({ session: next, receipts: [] })).toThrow('INVALID_RECORD');
  });
  it('persists across repository reconnect, deduplicates, and does not requeue after consume', async () => {
    const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory });
    const db = await open(); await db.create(fixture()); db.close(); const publish = vi.fn(), hub = new SessionHub(open, publish);
    const request = { type: 'SESSION_COMMAND', command: command('REQUEST_PPTX_GROUP') } as const;
    const accepted = await hub.handle('remote', request); expect(accepted).toMatchObject({ ok: true });
    expect(await hub.handle('remote', request)).toEqual(accepted); expect(publish).toHaveBeenCalledTimes(1);
    const reopened = await open(); expect((await reopened.read('original'))!.session.documents.A!.pptxPlayback!.request).toEqual(queued().documents.A!.pptxPlayback!.request); reopened.close();
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: consume() })).toMatchObject({ ok: true });
    await hub.handle('remote', request);
    const final = await open(); expect((await final.read('original'))!.session.documents.A!.pptxPlayback).toMatchObject({ request: null, run: { epoch: 'consume-1' } }); final.close();
    expect(publish).toHaveBeenCalledTimes(2);
  });
  it('does not acknowledge or publish an intent when strict commit fails', async () => {
    const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }); const db = await open(); await db.create(fixture()); db.close();
    const publish = vi.fn(), hub = new SessionHub(async () => { const repo = await open(); vi.spyOn(repo, 'commit').mockRejectedValue(Error('Synthetic failure')); return repo; }, publish);
    expect(await hub.handle('remote', { type: 'SESSION_COMMAND', command: command('REQUEST_PPTX_GROUP') })).toMatchObject({ ok: false }); expect(publish).not.toHaveBeenCalled();
    const final = await open(); expect((await final.read('original'))!.session.documents.A!.pptxPlayback).toBeUndefined(); final.close();
  });
});
