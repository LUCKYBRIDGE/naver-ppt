import { describe, expect, it, vi } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { pptxTransitionTarget, preparePresentationCommand } from '../../src/remote/prepareTransition';
import type { SessionCommand } from '../../src/core/commands';
import type { ClassSession } from '../../src/core/types';
import { reduceSession } from '../../src/core/session';
import { isSessionRequest } from '../../src/shared/sessionMessages';
function setup() {
  const session = fixtureSession();
  session.documents.B = { id: 'B', source: { type: 'pptx', fingerprint: 'b'.repeat(64), name: 'Synthetic.pptx', size: 100, lastModified: 1 }, slideIds: ['B-1', 'B-2'], knownSlideCount: 2, lastSlideId: 'B-2', slideDeltas: {}, mediaBookmarks: {}, dirty: false };
  session.documentOrder.push('B');
  const command: SessionCommand = { type: 'ACTIVATE_DOCUMENT', sessionId: session.id, documentId: 'B', slideId: null, revision: session.revision, commandId: 'switch' };
  return { session, command, signal: new AbortController().signal };
}
describe('PPTX Remote preparation without committing audience state', () => {
  it('atomically activates the explicitly inspected page without exposing its first page', () => {
    const { session, command } = setup(), before = structuredClone(session);
    const explicit = { ...command, slideId: 'B-1' };
    expect(isSessionRequest({ type: 'SESSION_COMMAND', command: explicit })).toBe(true);
    expect(pptxTransitionTarget(session, explicit)?.slideId).toBe('B-1');
    const next = reduceSession(session, explicit, 100);
    expect(next.presentedSelection).toEqual({ documentId: 'B', slideId: 'B-1' }); expect(next.documents.B?.lastSlideId).toBe('B-1'); expect(next.editorSelection).toEqual(before.editorSelection); expect(session).toEqual(before);
  });
  it('rejects missing explicit pages and closed-document activation without changing state', () => {
    const { session, command } = setup(), before = structuredClone(session);
    expect(() => reduceSession(session, { ...command, slideId: 'missing' }, 100)).toThrow(); expect(session).toEqual(before);
    session.documents.B!.closed = true; expect(() => reduceSession(session, { ...command, slideId: 'B-1' }, 100)).toThrow();
  });
  it('uses the same remembered target as core activation/reopen and explicit goto', () => {
    const { session, command } = setup(); expect(pptxTransitionTarget(session, command)?.slideId).toBe('B-2');
    expect(pptxTransitionTarget(session, { ...command, type: 'REOPEN_DOCUMENT', slideId: null })?.slideId).toBe('B-2');
    expect(pptxTransitionTarget(session, { ...command, type: 'GOTO_SLIDE', documentId: 'B', slideId: 'B-1' })?.slideId).toBe('B-1');
    session.documents.B!.lastSlideId = null; expect(pptxTransitionTarget(session, command)?.slideId).toBe('B-1');
  });
  it('does not inspect PDF or non-transition commands', async () => {
    const { session, command, signal } = setup(), inspect = vi.fn(async () => {}), read = vi.fn(async () => session);
    const pdf = { ...command, documentId: 'A' }; expect(await preparePresentationCommand(session, pdf, signal, { inspect, read })).toBe(pdf);
    expect(pptxTransitionTarget(session, { ...command, type: 'PAUSE_TIMER', slideId: null })).toBeNull(); expect(inspect).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
  });
  it('allows unrelated revision changes only after successful preparation and preserves the original state', async () => {
    const { session, command, signal } = setup(), before = structuredClone(session), latest = structuredClone(session); latest.revision += 5;
    latest.editorSelection = { documentId: 'B', slideId: 'B-1' };
    const inspect = vi.fn(async () => {}), result = await preparePresentationCommand(session, command, signal, { inspect, read: async () => latest });
    expect(result).toEqual({ ...command, revision: latest.revision }); expect(inspect).toHaveBeenCalledWith(session.documents.B, 'B-2', signal); expect(session).toEqual(before);
  });
  it('does not read or return a command after preparation failure', async () => {
    const { session, command, signal } = setup(), before = structuredClone(session), read = vi.fn(async () => session);
    await expect(preparePresentationCommand(session, command, signal, { inspect: async () => { throw Error('Unsupported'); }, read })).rejects.toThrow('Unsupported');
    expect(read).not.toHaveBeenCalled(); expect(session).toEqual(before);
  });
  it.each(['audience', 'document', 'fingerprint', 'closed', 'remembered', 'order', 'session'] as const)('rejects a changed %s after preparation', async change => {
    const { session, command, signal } = setup(), latest = structuredClone(session); latest.revision++;
    if (change === 'audience') latest.presentedSelection = { documentId: 'A', slideId: 'A-1' };
    if (change === 'document') delete latest.documents.B;
    if (change === 'fingerprint') latest.documents.B!.source = { ...latest.documents.B!.source, type: 'pptx', name: 'Synthetic.pptx', size: 100, lastModified: 1, fingerprint: 'c'.repeat(64) };
    if (change === 'closed') latest.documents.B!.closed = true;
    if (change === 'remembered') latest.documents.B!.lastSlideId = 'B-1';
    if (change === 'order') latest.documents.B!.slideIds.reverse();
    if (change === 'session') latest.id = 'other';
    await expect(preparePresentationCommand(session, command, signal, { inspect: async () => {}, read: async () => latest })).rejects.toThrow('TARGET_CHANGED');
  });
  it.each(['before', 'during', 'read'] as const)('cancels %s preparation without releasing a command', async phase => {
    const { session, command } = setup(), controller = new AbortController();
    if (phase === 'before') controller.abort();
    const inspect = vi.fn(async () => { if (phase === 'during') controller.abort(); });
    const read = vi.fn(async (): Promise<ClassSession> => { controller.abort(); return session; });
    await expect(preparePresentationCommand(session, command, controller.signal, { inspect, read })).rejects.toMatchObject({ name: 'AbortError' });
    if (phase === 'before') expect(inspect).not.toHaveBeenCalled(); if (phase !== 'read') expect(read).not.toHaveBeenCalled();
  });
});
