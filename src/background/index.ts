import { isOpenWindowRequest, type OpenWindowResult } from '../shared/windowMessages';
import { WindowManager } from './windowManager';
import { IndexedDbSessionRepository } from '../storage/indexedDbSessionRepository';
import { getPageRole, isSessionRequest, validId, type PageRole } from '../shared/sessionMessages';
import { SessionHub, snapshotFor } from './sessionHub';
import { extensionApi } from '../shared/extensionApi';
import { verifySavedBackup } from '../storage/backupVerification';
import { IndexedDbSaveJournal } from '../storage/saveJournal';
import { IndexedDbPlayerOwner } from '../storage/playerOwner';
import { PlayerAuthority } from './playerAuthority';

const api = extensionApi();
if (!api) throw new Error('Extension runtime unavailable');

const subscribers = new Map<chrome.runtime.Port, { role: PageRole; sessionId: string }>();
const hub = new SessionHub(() => IndexedDbSessionRepository.open(), session => {
  for (const [port, subscription] of subscribers) {
    if (subscription.sessionId !== session.id) continue;
    try { port.postMessage(snapshotFor(subscription.role, session)); }
    catch { subscribers.delete(port); }
  }
}, undefined, undefined, (request, session) => verifySavedBackup(request, session, {
  extensionRoot: api.runtime.getURL(''), fetch: (...args) => fetch(...args),
  findComplete: (sessionId, revision, hash) => new IndexedDbSaveJournal().findComplete(sessionId, revision, hash),
}));
const manager = new WindowManager(api.windows, path => api.runtime.getURL(path), filter => api.runtime.getContexts(filter));
const authority = new PlayerAuthority({ id: api.runtime.id, getURL: path => api.runtime.getURL(path), getContexts: filter => api.runtime.getContexts(filter) }, new IndexedDbPlayerOwner(), globalThis.navigator?.locks);

api.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  const role = getPageRole(sender, api.runtime.id, path => api.runtime.getURL(path));
  if (!role) return false;
  if (isSessionRequest(message) && message.type === 'GET_PRESENTATION_OWNER') {
    if (role !== 'remote' || new URL(sender.url!).searchParams.get('sessionId') !== message.sessionId) { sendResponse({ ok: false, code: 'FORBIDDEN', error: '이 수업의 리모컨에서만 발표 창을 확인할 수 있습니다.' }); return false; }
    void authority.currentTransitionOwner(message.sessionId).then(playerId => sendResponse({ ok: true, kind: 'presentation-owner', playerId })).catch(() => sendResponse({ ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' })); return true;
  }
  if (isSessionRequest(message) && message.type === 'GET_PRESENTATION_TARGET') {
    if (role !== 'player' || sender.documentId !== message.playerId || new URL(sender.url!).searchParams.get('sessionId') !== message.sessionId) { sendResponse({ ok: false, code: 'FORBIDDEN', error: '요청에 지정된 발표 창에서만 목표를 확인할 수 있습니다.' }); return false; }
    void authority.withTransitionOwner(message.sessionId, message.playerId, () => hub.handle(role, message)).then(result => sendResponse(result || { ok: false, code: 'NOT_PLAYER_OWNER', error: '발표 창의 소유권을 확인하지 못했습니다.' })).catch(() => sendResponse({ ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' }));
    return true;
  }
  if (isSessionRequest(message) && message.type === 'SESSION_COMMAND' && (message.command.type === 'REQUEST_PRESENTATION' || message.command.type === 'COMMIT_PRESENTATION' || message.command.type === 'REJECT_PRESENTATION' || message.command.type === 'CANCEL_PRESENTATION')) {
    const command = message.command, ownSession = new URL(sender.url!).searchParams.get('sessionId');
    if (command.type === 'CANCEL_PRESENTATION') {
      if (role !== 'remote' || ownSession !== command.sessionId) { sendResponse({ ok: false, code: 'FORBIDDEN', error: '이 수업의 리모컨에서만 전환을 취소할 수 있습니다.' }); return false; }
      void hub.handle(role, message).then(sendResponse); return true;
    }
    const requesting = command.type === 'REQUEST_PRESENTATION';
    if (ownSession !== command.sessionId || (requesting ? role !== 'remote' : role !== 'player' || sender.documentId !== command.playerId)) {
      sendResponse({ ok: false, code: 'FORBIDDEN', error: '이 창에서는 전환을 확정할 수 없습니다.' }); return false;
    }
    void authority.withTransitionOwner(command.sessionId, command.playerId, () => hub.handle(role, message)).then(result => {
      sendResponse(result || { ok: false, code: 'NOT_PLAYER_OWNER', error: '요청에 지정된 발표 창이 현재 실행 주체가 아닙니다. 다시 전환을 요청하세요.' });
    }).catch(() => sendResponse({ ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' }));
    return true;
  }
  if (message && typeof message === 'object' && 'type' in message && message.type === 'CLAIM_PLAYER') {
    if (Object.keys(message).length !== 2 || !('sessionId' in message) || !validId(message.sessionId) || role !== 'player') {
      sendResponse({ ok: false, code: 'FORBIDDEN', error: '발표 창을 확인할 수 없습니다.' }); return false;
    }
    const sessionId = message.sessionId;
    void hub.handle(role, { type: 'GET_SESSION', sessionId }).then(async result => {
      if (!result.ok) { sendResponse(result); return; }
      sendResponse({ ok: true, kind: 'player-owner', owned: await authority.access(sender, sessionId, true), playerId: sender.documentId ?? null });
    }).catch(() => sendResponse({ ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' }));
    return true;
  }
  if (isSessionRequest(message) && message.type === 'SESSION_COMMAND' && (message.command.type === 'ADVANCE_AUTOPLAY'
    || message.command.type === 'FINISH_TIMER' || message.command.type === 'CLAIM_TIMER_ALARM' || message.command.type === 'BEGIN_PPTX_GROUP' || message.command.type === 'BEGIN_REQUESTED_PPTX_GROUP' || message.command.type === 'CHECKPOINT_PPTX_GROUP' || message.command.type === 'CHECKPOINT_PPTX_MEDIA' || role === 'player' && (message.command.type === 'PLAY_MEDIA' || message.command.type === 'CHECKPOINT_MEDIA'))) {
    if (role !== 'player' || new URL(sender.url!).searchParams.get('sessionId') !== message.command.sessionId) {
      sendResponse({ ok: false, code: 'FORBIDDEN', error: '자동 넘김을 적용할 수 없습니다.' }); return false;
    }
    void authority.access(sender, message.command.sessionId, false).then(async owned => {
      sendResponse(owned ? await hub.handle(role, message) : { ok: false, code: 'NOT_PLAYER_OWNER', error: '실행 중인 발표 창에서만 적용할 수 있습니다.' });
    }).catch(() => sendResponse({ ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' }));
    return true;
  }
  if (isSessionRequest(message) && message.type === 'OPEN_CURRENT_EDITOR') {
    const ownSession = new URL(sender.url!).searchParams.get('sessionId');
    if (role !== 'player' || ownSession !== message.command.sessionId) {
      sendResponse({ ok: false, code: 'FORBIDDEN', error: '편집창을 열 수 없습니다.' }); return false;
    }
    void hub.handle(role, message).then(async result => {
      if (!result.ok) { sendResponse({ ok: false, code: result.code, error: '편집창을 열지 못했습니다. 다시 시도하세요.' }); return; }
      const opened = await manager.open('editor', message.command.sessionId);
      sendResponse(opened.ok ? { ok: true, kind: 'editor-open', windowId: opened.windowId }
        : { ok: false, code: 'WINDOW_FAILED', error: '편집창을 열지 못했습니다. 다시 시도하세요.' });
    });
    return true;
  }
  if (isOpenWindowRequest(message)) {
    if (role !== 'launcher') {
      const result: OpenWindowResult = { ok: false, error: '창 열기는 수업 목록에서 실행하세요.' };
      sendResponse(result); return false;
    }
    void manager.open(message.role, message.sessionId).then(sendResponse);
  } else {
    void hub.handle(role, message).then(sendResponse);
  }
  return true;
});

api.runtime.onConnect.addListener(port => {
  const role = port.sender && getPageRole(port.sender, api.runtime.id, path => api.runtime.getURL(path));
  let sessionId: string | null = null;
  try { sessionId = new URL(port.sender?.url ?? '').searchParams.get('sessionId'); } catch { /* Reject invalid URLs. */ }
  if (port.name !== 'naver-ppt-session' || !role || role === 'launcher' || !validId(sessionId)) {
    port.disconnect(); return;
  }
  subscribers.set(port, { role, sessionId });
  port.onDisconnect.addListener(() => subscribers.delete(port));
  void hub.handle(role, { type: 'GET_SESSION', sessionId }).then(response => {
    if (!subscribers.has(port)) return;
    try { port.postMessage(response); } catch { subscribers.delete(port); }
  });
});
