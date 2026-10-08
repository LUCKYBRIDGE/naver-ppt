import { afterEach, describe, expect, it, vi } from 'vitest';

type Listener = (message: unknown, sender: { id: string }, respond: (result: unknown) => void) => boolean;

async function loadBackground(create = vi.fn().mockResolvedValue({ id: 12 })) {
  vi.resetModules();
  let listener: Listener | undefined;
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'our-extension',
      getURL: (path: string) => `chrome-extension://our-extension/${path}`,
      onMessage: { addListener: (value: Listener) => { listener = value; } },
    },
    windows: { create },
  });
  await import('../../src/background/index');
  if (!listener) throw new Error('listener 미등록');
  return { listener, create };
}

afterEach(() => vi.unstubAllGlobals());

describe('background 창 생성 경로 (Chromium API mock)', () => {
  it('자확장 요청을 허용하고 생성 성공을 응답한다', async () => {
    const { listener, create } = await loadBackground();
    const respond = vi.fn();
    expect(listener({ type: 'OPEN_WINDOW', role: 'remote' }, { id: 'our-extension' }, respond)).toBe(true);
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
    listener({ type: 'OPEN_WINDOW', role: 'editor' }, { id: 'our-extension' }, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: false, error: 'window unavailable' }));
  });

  it('생성 결과가 없을 때 성공을 응답하지 않는다', async () => {
    const { listener } = await loadBackground(vi.fn().mockResolvedValue(undefined));
    const respond = vi.fn();
    listener({ type: 'OPEN_WINDOW', role: 'player' }, { id: 'our-extension' }, respond);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({
      ok: false, error: '생성한 창의 식별자를 확인하지 못했습니다.',
    }));
  });
});
