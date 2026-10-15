import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { IndexedDbSessionRepository } from '../../src/storage/indexedDbSessionRepository';
import { SessionHub } from '../../src/background/sessionHub';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { canRequest, isSessionRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';
import type { PptxCompletedCheckpoint } from '../../src/core/pptxPlayback';
import { restoredPptxCheckpointPose } from '../../src/core/pptxPlayback';

function fixture() {
  const session = fixtureSession(); session.revision = 0; session.documents.A!.source.type = 'pptx';
  session.documents.B = { ...structuredClone(session.documents.A!), id: 'B', source: { type: 'pdf', name: 'Synthetic.pdf', size: 1, lastModified: 0 } };
  session.documentOrder.push('B'); return session;
}
function command(type: 'BEGIN_PPTX_GROUP' | 'RESET_PPTX_SLIDE', revision = 0): SessionCommand {
  return { type, sessionId: 'original', documentId: 'A', slideId: 'A-2', revision, commandId: type + revision };
}
function complete(revision = 1, completedGroups = 1): Extract<SessionCommand, { type: 'CHECKPOINT_PPTX_GROUP' }> {
  return { type: 'CHECKPOINT_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision, commandId: 'complete' + revision,
    epoch: 'BEGIN_PPTX_GROUP0', checkpoint: { renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: 'a'.repeat(64), completedGroups,
      pose: { version: 1, scope: { sessionId: 'original', documentId: 'A', slideId: 'A-2', revision }, entries: [{ target: 3, opacity: 1, transform: 'matrix(0,1,-1,0,0,0)', clipPath: 'none', visible: true }] } } };
}
function finished() { return reduceSession(reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1), complete(), 2); }

describe('PPTX completed checkpoint contract', () => {
  it.each(['web-ppt-0.4.5/transform-v1', 'web-ppt-0.4.5/source-v1'] as const)('persists %s but rejects changing cursor contracts mid-history', renderer => {
    const first = complete(); first.checkpoint.renderer = renderer;
    const saved = reduceSession(reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1), first, 2);
    assertSessionRecord({ session: saved, receipts: [] });
    const started = reduceSession(saved, command('BEGIN_PPTX_GROUP', 2), 3), next = complete(3, 2); next.epoch = 'BEGIN_PPTX_GROUP2';
    next.checkpoint.renderer = renderer === 'web-ppt-0.4.5/source-v1' ? 'web-ppt-0.4.5/transform-v1' : 'web-ppt-0.4.5/source-v1';
    expect(() => reduceSession(started, next, 4)).toThrow('INVALID_TARGET');
    expect(started.documents.A!.pptxPlayback!.checkpoints['A-2']!.renderer).toBe(renderer);
  });
  it('restores prior pose into a new session revision only after immutable source and scope verification', () => {
    const checkpoint = complete().checkpoint, scope = { ...checkpoint.pose.scope, revision: 10 };
    const pose = restoredPptxCheckpointPose(checkpoint, checkpoint.fingerprint, scope);
    expect(pose.scope.revision).toBe(10); expect(checkpoint.pose.scope.revision).toBe(1);
    expect(() => restoredPptxCheckpointPose(checkpoint, 'b'.repeat(64), scope)).toThrow('PPTX_CHECKPOINT_MISMATCH');
    expect(() => restoredPptxCheckpointPose(checkpoint, checkpoint.fingerprint, { ...scope, documentId: 'B' })).toThrow('PPTX_CHECKPOINT_MISMATCH');
    expect(() => restoredPptxCheckpointPose(checkpoint, checkpoint.fingerprint, { ...scope, revision: 0 })).toThrow('PPTX_CHECKPOINT_MISMATCH');
  });
  it('commits only after a matching Player run and clones pose', () => {
    const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1), c = complete(), next = reduceSession(started, c, 2);
    expect(next.documents.A!.pptxPlayback).toEqual({ run: null, checkpoints: { 'A-2': c.checkpoint } });
    c.checkpoint.pose.entries[0]!.opacity = 0;
    expect(next.documents.A!.pptxPlayback!.checkpoints['A-2']!.pose.entries[0]!.opacity).toBe(1);
    expect(started.documents.A!.pptxPlayback!.checkpoints).toEqual({}); assertSessionRecord({ session: next, receipts: [] });
  });
  it('preserves completed pose through A→B→A while invalidating in-flight work', () => {
    const first = finished(), started = reduceSession(first, command('BEGIN_PPTX_GROUP', 2), 3);
    const away = reduceSession(started, { type: 'ACTIVATE_DOCUMENT', sessionId: first.id, documentId: 'B', slideId: null, revision: 3, commandId: 'B' }, 4);
    expect(away.documents.A!.pptxPlayback!.run).toBeNull();
    const back = reduceSession(away, { type: 'ACTIVATE_DOCUMENT', sessionId: first.id, documentId: 'A', slideId: null, revision: 4, commandId: 'A' }, 5);
    expect(back.documents.A!.pptxPlayback!.checkpoints).toEqual(first.documents.A!.pptxPlayback!.checkpoints);
    expect(() => reduceSession(back, complete(5, 2), 6)).toThrow('INVALID_TARGET');
  });
  it('keeps run independent of Editor navigation and notes', () => {
    const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1);
    const edit = reduceSession(started, { type: 'SET_PRESENTER_NOTE', sessionId: started.id, documentId: 'B', slideId: 'A-1', revision: 1, commandId: 'note', note: 'Synthetic private' }, 2);
    expect(edit.documents.A!.pptxPlayback!.run).toEqual(started.documents.A!.pptxPlayback!.run);
    expect(reduceSession(edit, complete(2), 3).documents.A!.pptxPlayback!.run).toBeNull();
  });
  it('resets only selected slide and invalidates the previous run', () => {
    const reset = reduceSession(finished(), command('RESET_PPTX_SLIDE', 2), 3);
    expect(reset.documents.A!.pptxPlayback).toEqual({ run: null, checkpoints: {} });
    expect(() => reduceSession(reset, complete(3), 4)).toThrow('INVALID_TARGET');
  });
  it('replaces an abandoned run without changing completed groups', () => {
    const first = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1), next = reduceSession(first, command('BEGIN_PPTX_GROUP', 1), 2);
    expect(() => reduceSession(next, complete(2), 3)).toThrow('INVALID_TARGET');
  });
  it('invalidates a run on page change and current close', () => {
    const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1);
    for (const c of [ { type: 'GOTO_SLIDE', slideId: 'A-1' }, { type: 'CLOSE_DOCUMENT', slideId: null } ] as const) {
      const next = reduceSession(started, { ...c, documentId: 'A', sessionId: 'original', revision: 1, commandId: c.type }, 2);
      expect(next.documents.A!.pptxPlayback!.run).toBeNull();
    }
  });
  it.each(['fingerprint', 'renderer', 'count', 'session', 'slide', 'revision', 'css', 'epoch'] as const)('rejects invalid completion %s atomically', field => {
    const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1), c = complete();
    if (field === 'fingerprint') c.checkpoint.fingerprint = 'b'.repeat(64);
    if (field === 'renderer') c.checkpoint.renderer = 'unknown' as PptxCompletedCheckpoint['renderer'];
    if (field === 'count') c.checkpoint.completedGroups = 2;
    if (field === 'session') c.checkpoint.pose.scope.sessionId = 'other';
    if (field === 'slide') c.checkpoint.pose.scope.slideId = 'A-1';
    if (field === 'revision') c.checkpoint.pose.scope.revision = 0;
    if (field === 'css') c.checkpoint.pose.entries[0]!.transform = 'url(https://example.invalid)';
    if (field === 'epoch') c.epoch = 'old';
    expect(() => reduceSession(started, c, 2)).toThrow('INVALID_TARGET'); expect(started.documents.A!.pptxPlayback!.checkpoints).toEqual({});
  });
  it('rejects wrong source and stale global revision', () => {
    const s = fixture(); s.documents.A!.source.type = 'pdf';
    expect(() => reduceSession(s, command('BEGIN_PPTX_GROUP'), 1)).toThrow('INVALID_TARGET');
    expect(() => reduceSession(finished(), complete(), 3)).toThrow('STALE_REVISION');
  });
  it('exposes only selected checkpoint without teacher content or mutable references', () => {
    const s = finished(), snapshot = toPlayerSnapshot(s);
    expect(snapshot.pptx?.checkpoint?.completedGroups).toBe(1);
    expect(JSON.stringify(snapshot)).not.toContain('Synthetic teacher note');
    snapshot.pptx!.checkpoint!.pose.entries[0]!.opacity = 0;
    expect(s.documents.A!.pptxPlayback!.checkpoints['A-2']!.pose.entries[0]!.opacity).toBe(1);
  });
  it('checks exact message fields and restricts writer/reset roles', () => {
    const request = { type: 'SESSION_COMMAND', command: complete() } as const;
    expect(isSessionRequest(request)).toBe(true); expect(isSessionRequest({ ...request, command: { ...request.command, bytes: [] } })).toBe(false);
    expect(canRequest('player', request)).toBe(true);
    for (const role of ['editor', 'remote', 'launcher'] as const) expect(canRequest(role, request)).toBe(false);
    expect(canRequest('remote', { type: 'SESSION_COMMAND', command: command('RESET_PPTX_SLIDE') })).toBe(true);
  });
  it('rejects stored cross-source and cross-scope checkpoints', () => {
    for (const field of ['fingerprint', 'session', 'future', 'unknown'] as const) {
      const s = finished(), checkpoint = s.documents.A!.pptxPlayback!.checkpoints['A-2']!;
      if (field === 'fingerprint') checkpoint.fingerprint = 'b'.repeat(64);
      if (field === 'session') checkpoint.pose.scope.sessionId = 'other';
      if (field === 'future') checkpoint.pose.scope.revision = 100;
      if (field === 'unknown') Object.assign(checkpoint, { bytes: [] });
      expect(() => assertSessionRecord({ session: s, receipts: [] })).toThrow('INVALID_RECORD');
    }
  });
  it('persists after repository reconnect and deduplicates before publishing', async () => {
    const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory });
    const repo = await open(); await repo.create(fixture()); repo.close(); const publish = vi.fn(), hub = new SessionHub(open, publish);
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: command('BEGIN_PPTX_GROUP') })).toMatchObject({ ok: true });
    const request = { type: 'SESSION_COMMAND', command: complete() };
    const result = await hub.handle('player', request); expect(result).toMatchObject({ ok: true });
    expect(await hub.handle('player', request)).toEqual(result); expect(publish).toHaveBeenCalledTimes(2);
    const restored = await open(); expect((await restored.read('original'))!.session.documents.A!.pptxPlayback).toEqual(finished().documents.A!.pptxPlayback); restored.close();
  });
  it('keeps prior completed state and does not publish after commit failure', async () => {
    const factory = new IDBFactory(), open = () => IndexedDbSessionRepository.open({ factory }); const repo = await open();
    const started = reduceSession(fixture(), command('BEGIN_PPTX_GROUP'), 1); await repo.create(fixture()); repo.close();
    expect(await new SessionHub(open, () => {}).handle('player', { type: 'SESSION_COMMAND', command: command('BEGIN_PPTX_GROUP') })).toMatchObject({ ok: true });
    const publish = vi.fn(), hub = new SessionHub(async () => { const db = await open(); vi.spyOn(db, 'commit').mockRejectedValue(Error('Synthetic failure')); return db; }, publish);
    expect(await hub.handle('player', { type: 'SESSION_COMMAND', command: complete() })).toMatchObject({ ok: false }); expect(publish).not.toHaveBeenCalled();
    const restored = await open(); expect((await restored.read('original'))!.session.documents.A!.pptxPlayback).toEqual(started.documents.A!.pptxPlayback); expect((await restored.read('original'))!.session.revision).toBe(1); restored.close();
  });
});
