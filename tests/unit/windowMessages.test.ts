import { describe, expect, it } from 'vitest';
import { isOpenWindowRequest } from '../../src/shared/windowMessages';
import { windowOptions } from '../../src/background/windows';

describe('독립 확장 페이지 허용 목록', () => {
  it.each(['player', 'remote', 'editor'])('%s 대상 허용', (role) => {
    expect(isOpenWindowRequest({ type: 'OPEN_WINDOW', role })).toBe(true);
  });

  it.each([null, {}, 'player', { type: 'OPEN_WINDOW', role: '../../secret' },
    { type: 'OPEN_WINDOW', role: 'https://example.com' }, { type: 'CLOSE_ALL', role: 'player' }])
    ('잘못된 대상 거부: %j', (value) => {
      expect(isOpenWindowRequest(value)).toBe(false);
    });

  it('Player 생성 시 교사 앱의 포커스를 회수하지 않는다', () => {
    const options = windowOptions('player', (path) => `chrome-extension://test/${path}`);
    expect(options.url).toBe('chrome-extension://test/player/index.html');
    expect(options.focused).toBe(false);
    expect(options.type).toBe('popup');
  });

  it('리모컨은 action popup과 별도의 브라우저 창을 사용한다', () => {
    const options = windowOptions('remote', (path) => path);
    expect(options.type).toBe('popup');
    expect(options.url).toBe('remote/index.html');
  });
});
