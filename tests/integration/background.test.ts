import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import type { SessionResponse } from '../../src/shared/sessionMessages';

type Listener = (message: unknown, sender: { id: string; url?: string }, respond: (result: unknown) => void) => boolean;
const ownSender = { id: 'our-extension', url: 'whale-extension://our-extension/launcher/index.html' };

async function loadBackground(create = vi.fn().mockResolvedValue({ id: 12 })) {
  vi.resetModules();
  let listener: Listener | undefined;
  let connect: ((port: chrome.runtime.Port) => void) | undefined;
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'our-extension',
      getURL: (path: string) => `whale-extension://our-extension/${path}`,
      getContexts: vi.fn().mockResolvedValue([]),
      onMessage: { addListener: (value: Listener) => { listener = value; } },
      onConnect: { addListener: (value: typeof connect) => { connect = value; } },
    },
    windows: { create, getAll: vi.fn().mockResolvedValue([]), update: vi.fn() },
  });
  await import('../../src/background/index');
  if (!listener) throw new Error('listener 미등록');
  return { listener, create, connect: connect! };
}

afterEach(() => vi.unstubAllGlobals());

describe('background 창 생성 경로 (Chromium API mock)', () => {
  it('rejects Player quick-editor requests for another lesson before opening any window', async () => {
    const { listener, create } = await loadBackground(), respond = vi.fn();
    expect(listener({ type: 'OPEN_CURRENT_EDITOR', command: { type: 'SELECT_EDITOR_SLIDE', sessionId: 'other', documentId: 'A', slideId: 'A-1',
      revision: 0, commandId: 'quick' } }, { id: ownSender.id, url: 'whale-extension://our-extension/player/index.html?sessionId=original' }, respond)).toBe(false);
    expect(respond).toHaveBeenCalledWith(expect.objectContaining({ ok: false, code: 'FORBIDDEN' })); expect(create).not.toHaveBeenCalled();
  });
  it('자확장 요청을 허용하고 생성 성공을 응답한다', async () => {
    const { listener, create } = await loadBackground();
    const respond = vi.fn();
    expect(listener({ type: 'OPEN_WINDOW', role: 'remote' }, ownSender, respond)).toBe(true);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true, windowId: 12 }));
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('다른 발신자의 창 생성 요청을 거부한다', async () => {
    const { listener, create } = await loadBackground();
    expect(listener({ type: 'OPEN_WINDOW', role: 'player' }, { id: 'other-extension' }, vi.fn())).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it('브라우저 API 실패를 완료로 표시하지 않는다', async () => {
    const { listener } = await loadBackground(vi.fn().mockRejectedValue(new Error('window unavailable')));
    const respond = vi.fn();
    listener({ type: 'OPEN_WINDOW', role: 'editor' }, ownSender, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: false, error: '창을 열지 못했습니다. 잠시 후 다시 시도하세요.' }));
  });

  it('생성 결과가 없을 때 성공을 응답하지 않는다', async () => {
    const { listener } = await loadBackground(vi.fn().mockResolvedValue(undefined));
    const respond = vi.fn();
    listener({ type: 'OPEN_WINDOW', role: 'player' }, ownSender, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({
      ok: false, error: '생성한 창의 식별자를 확인하지 못했습니다.',
    }));
  });
});

describe('background port privacy and recovery (browser API mock)', () => {
  function port(role: string, sessionId: string) {
    let disconnected: (() => void) | undefined;
    return {
      name: 'naver-ppt-session',
      sender: { id: 'our-extension', url: `whale-extension://our-extension/${role}/index.html?sessionId=${sessionId}` },
      postMessage: vi.fn(), disconnect: vi.fn(),
      onDisconnect: { addListener: (fn: () => void) => { disconnected = fn; } },
      close: () => disconnected?.(),
    };
  }
  async function request(listener: Listener, message: unknown, role = 'launcher'): Promise<SessionResponse> {
    return new Promise(resolve => listener(message, { id: 'our-extension', url: `whale-extension://our-extension/${role}/index.html` }, value => resolve(value as SessionResponse)));
  }
  it('keeps Player subscribed after Remote closes and restores from a fresh worker', async () => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    const first = await loadBackground();
    const created = await request(first.listener, { type: 'CREATE_SESSION', title: 'Private synthetic lesson' });
    if (!created.ok || created.kind !== 'teacher') throw new Error('session creation failed');
    const id = created.session.id;
    const command = { type: 'REGISTER_DOCUMENT', sessionId: id, documentId: 'A', slideId: null, revision: 0, commandId: 'register',
      document: { id: 'A', source: { type: 'pdf', name: 'Synthetic.pdf', size: 100, lastModified: 0 }, lastSlideId: null,
        knownSlideCount: 1, slideIds: ['A-1'], slideDeltas: {}, mediaBookmarks: {}, dirty: false } };
    expect(await request(first.listener, { type: 'SESSION_COMMAND', command })).toMatchObject({ ok: true });
    const remote = port('remote', id); const player = port('player', id); const other = port('player', 'other');
    first.connect(remote as unknown as chrome.runtime.Port);
    first.connect(player as unknown as chrome.runtime.Port);
    first.connect(other as unknown as chrome.runtime.Port);
    await vi.waitFor(() => expect(player.postMessage).toHaveBeenCalledWith(expect.objectContaining({ kind: 'player' })));
    await vi.waitFor(() => expect(other.postMessage).toHaveBeenCalledTimes(1));
    remote.close(); player.postMessage.mockClear(); other.postMessage.mockClear();
    expect(await request(first.listener, { type: 'SESSION_COMMAND', command: {
      type: 'SET_PRESENTER_NOTE', sessionId: id, documentId: 'A', slideId: 'A-1', revision: 1, commandId: 'note', note: 'Private note',
    } }, 'editor')).toMatchObject({ ok: true });
    expect(player.postMessage).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(player.postMessage.mock.calls)).not.toContain('Private');
    expect(other.postMessage).not.toHaveBeenCalled();
    const restarted = await loadBackground(); const recovered = port('player', id);
    restarted.connect(recovered as unknown as chrome.runtime.Port);
    await vi.waitFor(() => expect(recovered.postMessage).toHaveBeenCalledWith({ ok: true, kind: 'player', snapshot: {
      sessionId: id, revision: 2, selection: null, pageNumber: null, sourceFingerprint: null, overlays: [], autoplay: null, media: [], timers: [],
    } }));
  });
  it('disconnects unknown page subscribers and denies Player window commands', async () => {
    const { listener, connect, create } = await loadBackground();
    const unknown = port('unknown', 'lesson'); connect(unknown as unknown as chrome.runtime.Port);
    expect(unknown.disconnect).toHaveBeenCalledTimes(1);
    const response = vi.fn();
    listener({ type: 'OPEN_WINDOW', role: 'remote' }, { ...ownSender, url: ownSender.url.replace('launcher', 'player') }, response);
    expect(response).toHaveBeenCalledWith({ ok: false, error: '창 열기는 수업 목록에서 실행하세요.' });
    expect(create).not.toHaveBeenCalled();
  });
});
