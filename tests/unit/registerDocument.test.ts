import { describe, expect, it, vi } from 'vitest';
import { registerPreparedDocument } from '../../src/editor/registerDocument';
import type { SessionRequest, SessionResponse } from '../../src/shared/sessionMessages';
import { fixtureSession } from '../fixtures/session';

describe('document registration during playback revisions', () => {
  const setup = () => {
    const session = fixtureSession(); session.revision = 12;
    const document = { ...structuredClone(session.documents.A!), id: 'new-document' };
    const teacher = (): SessionResponse => ({ ok: true, kind: 'teacher', session });
    return { session, document, teacher, signal: new AbortController().signal };
  };
  it('reads the latest revision after parsing and returns the acknowledged session', async () => {
    const state = setup(), send = vi.fn<(request: SessionRequest) => Promise<SessionResponse>>().mockImplementation(async request => {
      if (request.type === 'SESSION_COMMAND') { expect(request.command.revision).toBe(12); state.session.revision++; }
      return state.teacher();
    });
    expect(await registerPreparedDocument(state.session.id, state.document, state.signal, send)).toBe(state.session);
    expect(send.mock.calls[0]![0].type).toBe('GET_SESSION'); expect(send).toHaveBeenCalledTimes(2);
  });
  it('retries only a rejected stale revision with the same command identity', async () => {
    const state = setup(), revisions: number[] = [], ids: string[] = [];
    const send = vi.fn(async (request: SessionRequest): Promise<SessionResponse> => {
      if (request.type === 'SESSION_COMMAND') {
        revisions.push(request.command.revision); ids.push(request.command.commandId);
        if (revisions.length === 1) { state.session.revision++; return { ok: false, code: 'STALE_REVISION', error: 'stale' }; }
      }
      return state.teacher();
    });
    await registerPreparedDocument(state.session.id, state.document, state.signal, send);
    expect(revisions).toEqual([12, 13]); expect(new Set(ids).size).toBe(1);
  });
  it('bounds stale retries rather than spinning while Player checkpoints', async () => {
    const state = setup(), send = vi.fn(async (request: SessionRequest): Promise<SessionResponse> => request.type === 'GET_SESSION'
      ? state.teacher() : { ok: false, code: 'STALE_REVISION', error: 'stale' });
    await expect(registerPreparedDocument(state.session.id, state.document, state.signal, send)).rejects.toThrow('stale');
    expect(send).toHaveBeenCalledTimes(6);
  });
  it.each(['INVALID_TARGET', 'PERSISTENCE_FAILED'])('does not retry %s', async code => {
    const state = setup(), send = vi.fn(async (request: SessionRequest): Promise<SessionResponse> => request.type === 'GET_SESSION'
      ? state.teacher() : { ok: false, code, error: 'rejected' });
    await expect(registerPreparedDocument(state.session.id, state.document, state.signal, send)).rejects.toThrow('rejected'); expect(send).toHaveBeenCalledTimes(2);
  });
  it('does not retry an unknown transport outcome', async () => {
    const state = setup(), send = vi.fn(async (request: SessionRequest): Promise<SessionResponse> => {
      if (request.type === 'SESSION_COMMAND') throw Error('transport'); return state.teacher();
    });
    await expect(registerPreparedDocument(state.session.id, state.document, state.signal, send)).rejects.toThrow('transport'); expect(send).toHaveBeenCalledTimes(2);
  });
  it('checks cancellation after the latest read before issuing a mutation', async () => {
    const state = setup(), controller = new AbortController(), send = vi.fn(async (): Promise<SessionResponse> => { controller.abort(); return state.teacher(); });
    await expect(registerPreparedDocument(state.session.id, state.document, controller.signal, send)).rejects.toMatchObject({ name: 'AbortError' }); expect(send).toHaveBeenCalledTimes(1);
  });
  it('rejects a different session response before registering', async () => {
    const state = setup(), send = vi.fn(async (): Promise<SessionResponse> => ({ ok: true, kind: 'teacher', session: { ...state.session, id: 'other-session' } }));
    await expect(registerPreparedDocument(state.session.id, state.document, state.signal, send)).rejects.toThrow('수업'); expect(send).toHaveBeenCalledTimes(1);
  });
});
