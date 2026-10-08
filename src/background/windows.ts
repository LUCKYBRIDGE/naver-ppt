import type { WindowRole } from '../shared/windowMessages';

export function windowOptions(
  role: WindowRole,
  getURL: (path: string) => string,
): chrome.windows.CreateData {
  return {
    url: getURL(`${role}/index.html`),
    type: 'popup',
    width: role === 'remote' ? 420 : 1100,
    height: role === 'remote' ? 640 : 760,
    // Player 창 생성 시 교사의 포커스를 강제로 회수하지 않는다.
    focused: role !== 'player',
  };
}
