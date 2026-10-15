import { describe, expect, it, vi, afterEach } from 'vitest';
import { getPageRole, isSessionRequest, canRequest } from '../../src/shared/sessionMessages';
import { createSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { extensionApi } from '../../src/shared/extensionApi';

const getURL = (path: string) => `whale-extension://ours/${path}`;
const move = { type: 'SESSION_COMMAND', command: { type: 'GOTO_SLIDE', commandId: 'one', sessionId: 'lesson', revision: 1, documentId: 'A', slideId: 'A-1' } };
afterEach(() => vi.unstubAllGlobals());

describe('Whale message trust boundary', () => {
  it.each(['launcher', 'remote', 'editor', 'player'] as const)('identifies %s from the exact extension page URL', role => {
    expect(getPageRole({ id: 'ours', url: getURL(`${role}/index.html`) + '?sessionId=lesson' }, 'ours', getURL)).toBe(role);
  });
  it.each([
    { id: 'other', url: getURL('remote/index.html') },
    { id: 'ours', url: 'https://example.com/remote/index.html' },
    { id: 'ours', url: 'whale-extension://other/remote/index.html' },
    { id: 'ours', url: getURL('remote/not-index.html') },
    { id: 'ours' },
  ])('rejects unknown senders: %j', sender => expect(getPageRole(sender, 'ours', getURL)).toBeNull());
  it('rejects extra fields, noninteger revisions and unimplemented commands', () => {
    expect(isSessionRequest(move)).toBe(true);
    expect(isSessionRequest({ ...move, role: 'remote' })).toBe(false);
    expect(isSessionRequest({ ...move, command: { ...move.command, revision: 1.5 } })).toBe(false);
    expect(isSessionRequest({ ...move, command: { ...move.command, type: 'PAUSE' } })).toBe(false);
    expect(isSessionRequest({ type: 'CREATE_SESSION', title: ' ' })).toBe(false);
    expect(isSessionRequest({ type: 'GET_SESSION', sessionId: [] })).toBe(false);
  });
  it('keeps Player read-only and restricts teacher commands to their role', () => {
    if (!isSessionRequest(move)) throw new Error('fixture');
    expect(canRequest('remote', move)).toBe(true);
    expect(canRequest('player', move)).toBe(false);
    expect(canRequest('editor', move)).toBe(false);
    expect(canRequest('player', { type: 'LIST_SESSIONS' })).toBe(false);
    expect(canRequest('editor', { type: 'CREATE_SESSION', title: 'lesson' })).toBe(false);
  });
  it('selects Whale APIs before the compatibility chrome alias', () => {
    const whale = { runtime: { id: 'whale' } }, chrome = { runtime: { id: 'alias' } };
    vi.stubGlobal('whale', whale); vi.stubGlobal('chrome', chrome);
    expect(extensionApi()).toBe(whale);
  });
  it('validates overlay payloads and limits editing to Editor', () => {
    const request = { type: 'SESSION_COMMAND', command: { ...move.command, type: 'SET_SLIDE_OVERLAYS', overlays: [
      { kind: 'mask', id: 'mask', visible: true, zIndex: 1, color: '#000', rect: { x: 0, y: 0, width: .5, height: .5 } },
    ] } };
    expect(isSessionRequest(request)).toBe(true);
    if (!isSessionRequest(request)) throw new Error('fixture');
    expect(canRequest('editor', request)).toBe(true); expect(canRequest('remote', request)).toBe(false); expect(canRequest('player', request)).toBe(false);
    expect(isSessionRequest({ ...request, command: { ...request.command, overlays: [{ ...request.command.overlays[0], bytes: [1] }] } })).toBe(false);
  });
  it('excludes all teacher state from an audience snapshot', () => {
    const session = createSession('lesson', 'Secret lesson title', 1);
    session.documents.A = { id: 'A', source: { type: 'pdf', name: 'Private filename', size: 1, lastModified: 0 },
      lastSlideId: 'A-1', knownSlideCount: 1, slideIds: ['A-1'], dirty: true, mediaBookmarks: {},
      slideDeltas: { 'A-1': { overlays: [{ kind: 'mask', id: 'mask', color: '#000', zIndex: 1, visible: true, rect: { x: 0, y: 0, width: 1, height: 1 } }], presenterNote: 'Private note', classLog: 'Private log' } } };
    session.presentedSelection = { documentId: 'A', slideId: 'A-1' };
    session.editorSelection = { documentId: 'A', slideId: 'A-1' };
    const snapshot = toPlayerSnapshot(session);
    expect(Object.keys(snapshot)).toEqual(['sessionId', 'revision', 'selection', 'pageNumber', 'sourceFingerprint', 'overlays', 'timers', 'autoplay', 'media']);
    expect(snapshot.pageNumber).toBe(1);
    expect(JSON.stringify(snapshot)).not.toMatch(/Private|Secret|editorSelection|presenterNote|classLog/);
    snapshot.overlays[0]!.visible = false;
    expect(session.documents.A.slideDeltas['A-1']?.overlays[0]?.visible).toBe(true);
  });
});
