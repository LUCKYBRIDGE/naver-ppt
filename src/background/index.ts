import { isOpenWindowRequest, type OpenWindowResult } from '../shared/windowMessages';
import { windowOptions } from './windows';

// 창 관리만 수행한다. 세션·미디어·자동 넘김은 후속 모듈의 책임이다.
chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isOpenWindowRequest(message)) return false;

  void chrome.windows.create(windowOptions(message.role, (path) => chrome.runtime.getURL(path)))
    .then((window) => {
      const windowId = window?.id;
      const result: OpenWindowResult = windowId === undefined
        ? { ok: false, error: '생성한 창의 식별자를 확인하지 못했습니다.' }
        : { ok: true, windowId };
      sendResponse(result);
    })
    .catch((error: unknown) => {
      const result: OpenWindowResult = {
        ok: false,
        error: error instanceof Error ? error.message : '창을 열지 못했습니다.',
      };
      sendResponse(result);
    });
  return true;
});
