import type { SessionCommand } from '../core/commands';
import type { ClassSession } from '../core/types';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import { createSession } from '../core/session';
import { assertSessionRecord } from '../storage/validateSessionRecord';
import { isOverlayList } from '../overlays/validation';
import { assertSessionBundle } from '../storage/sessionBundle';
import type { SessionBundle } from '../storage/types';
import type { BackupVerification } from '../storage/backupVerification';
import { isSupportedAutoplayRule } from '../media/autoplay';
import { isLocalMediaRef, isMediaPlayback } from '../media/validation';
import { isTimerPosition } from '../media/timer';
import { isPptxCompletedCheckpoint } from '../core/pptxPlayback';

export type PageRole = 'launcher' | 'remote' | 'editor' | 'player';
export interface SessionSummary { id: string; title: string; revision: number; updatedAt: number; documentCount: number }
export interface CloseChoice { documentId: string; decision: 'saved' | 'without-backup' | 'unchanged' }
export interface CloseOutcome { documentId: string; state: 'closed' | 'kept'; error: string | null }
export type SessionRequest =
  | { type: 'LIST_SESSIONS' }
  | { type: 'CREATE_SESSION'; title: string }
  | { type: 'IMPORT_SESSION'; bundle: SessionBundle }
  | { type: 'GET_SESSION'; sessionId: string }
  | { type: 'GET_PRESENTATION_TARGET'; sessionId: string; requestId: string; playerId: string }
  | { type: 'GET_PRESENTATION_OWNER'; sessionId: string }
  | { type: 'OPEN_CURRENT_EDITOR'; command: Extract<SessionCommand, { type: 'GOTO_SLIDE' | 'SELECT_EDITOR_SLIDE' }> & { type: 'SELECT_EDITOR_SLIDE' } }
  | { type: 'VERIFY_SAVED_BACKUP'; sessionId: string; revision: number; blobUrl: string }
  | { type: 'CLOSE_CURRENT_DOCUMENT'; command: Extract<SessionCommand, { type: 'CLOSE_DOCUMENT' | 'REOPEN_DOCUMENT' }>;
      decision: 'saved' | 'without-backup' | 'unchanged'; blobUrl: string | null }
  | { type: 'CLOSE_ALL_DOCUMENTS'; sessionId: string; revision: number; commandId: string; choices: CloseChoice[]; blobUrl: string | null }
  | { type: 'SESSION_COMMAND'; command: SessionCommand };
export type SessionResponse =
  | { ok: true; kind: 'list'; sessions: SessionSummary[] }
  | { ok: true; kind: 'teacher'; session: ClassSession }
  | { ok: true; kind: 'player'; snapshot: PlayerSnapshot }
  | { ok: true; kind: 'transition-target'; requestId: string; target: PlayerSnapshot }
  | { ok: true; kind: 'presentation-owner'; playerId: string | null }
  | { ok: true; kind: 'backup-verification'; verification: BackupVerification }
  | { ok: true; kind: 'close-all'; revision: number; results: CloseOutcome[] }
  | { ok: true; kind: 'editor-open'; windowId: number }
  | { ok: false; error: string; code: string };

export function getPageRole(sender: { id?: string; url?: string }, extensionId: string, getURL: (path: string) => string): PageRole | null {
  if (sender.id !== extensionId || !sender.url) return null;
  try {
    const url = new URL(sender.url);
    for (const role of ['launcher', 'remote', 'editor', 'player'] as const) {
      const allowed = new URL(getURL(`${role}/index.html`));
      if (url.protocol === allowed.protocol && url.host === allowed.host && url.pathname === allowed.pathname) return role;
    }
  } catch { /* Invalid sender URLs are rejected. */ }
  return null;
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).length === allowed.length && allowed.every(key => Object.hasOwn(value, key));
}
export function validId(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
}
export function isSessionRequest(value: unknown): value is SessionRequest {
  if (!object(value)) return false;
  if (value.type === 'OPEN_CURRENT_EDITOR') return keys(value, ['type', 'command']) && object(value.command)
    && value.command.type === 'SELECT_EDITOR_SLIDE' && isSessionRequest({ type: 'SESSION_COMMAND', command: value.command });
  if (value.type === 'LIST_SESSIONS') return keys(value, ['type']);
  if (value.type === 'CREATE_SESSION') return keys(value, ['type', 'title']) && validId(value.title);
  if (value.type === 'GET_SESSION') return keys(value, ['type', 'sessionId']) && validId(value.sessionId);
  if (value.type === 'GET_PRESENTATION_OWNER') return keys(value, ['type', 'sessionId']) && validId(value.sessionId);
  if (value.type === 'GET_PRESENTATION_TARGET') return keys(value, ['type', 'sessionId', 'requestId', 'playerId']) && validId(value.sessionId) && validId(value.requestId) && validId(value.playerId);
  if (value.type === 'VERIFY_SAVED_BACKUP') return keys(value, ['type', 'sessionId', 'revision', 'blobUrl'])
    && validId(value.sessionId) && Number.isSafeInteger(value.revision) && (value.revision as number) >= 0
    && typeof value.blobUrl === 'string' && value.blobUrl.length <= 400 && value.blobUrl.startsWith('blob:chrome-extension://');
  if (value.type === 'IMPORT_SESSION') {
    if (!keys(value, ['type', 'bundle'])) return false;
    try { assertSessionBundle(value.bundle); return true; } catch { return false; }
  }
  if (value.type === 'CLOSE_CURRENT_DOCUMENT') {
    if (!keys(value, ['type', 'command', 'decision', 'blobUrl']) || !object(value.command)) return false;
    const c = value.command;
    return keys(c, ['type', 'commandId', 'sessionId', 'documentId', 'slideId', 'revision']) && c.type === 'CLOSE_DOCUMENT'
      && validId(c.commandId) && validId(c.sessionId) && validId(c.documentId) && c.slideId === null
      && Number.isSafeInteger(c.revision) && (c.revision as number) >= 0
      && (value.decision === 'saved' ? typeof value.blobUrl === 'string' && value.blobUrl.length <= 400 && value.blobUrl.startsWith('blob:chrome-extension://')
        : (value.decision === 'without-backup' || value.decision === 'unchanged') && value.blobUrl === null);
  }
  if (value.type === 'CLOSE_ALL_DOCUMENTS') {
    if (!keys(value, ['type', 'sessionId', 'revision', 'commandId', 'choices', 'blobUrl']) || !validId(value.sessionId) || !validId(value.commandId)
      || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0 || !Array.isArray(value.choices)
      || !value.choices.length || value.choices.length > 16) return false;
    if (!value.choices.every(c => object(c) && keys(c, ['documentId', 'decision']) && validId(c.documentId)
      && ['saved', 'without-backup', 'unchanged'].includes(c.decision as string)) || new Set(value.choices.map(c => c.documentId)).size !== value.choices.length) return false;
    return value.choices.some(c => c.decision === 'saved') ? typeof value.blobUrl === 'string' && value.blobUrl.length <= 400 && value.blobUrl.startsWith('blob:chrome-extension://') : value.blobUrl === null;
  }
  if (value.type !== 'SESSION_COMMAND' || !keys(value, ['type', 'command']) || !object(value.command)) return false;
  const command = value.command;
  const base = ['type', 'commandId', 'sessionId', 'documentId', 'slideId', 'revision'];
  if (!validId(command.commandId) || !validId(command.sessionId)
    || !Number.isSafeInteger(command.revision) || (command.revision as number) < 0) return false;
  if (['SET_TIMER', 'PLAY_TIMER', 'PAUSE_TIMER', 'RESET_TIMER', 'FINISH_TIMER', 'SET_TIMER_POSITION', 'SET_TIMER_SOUND', 'CLAIM_TIMER_ALARM'].includes(command.type as string)) {
    if (command.slideId !== null || command.documentId !== null && !validId(command.documentId)) return false;
    if (command.type === 'SET_TIMER') return keys(command, [...base, 'mode', 'durationSec', 'visible']) && typeof command.visible === 'boolean'
      && typeof command.durationSec === 'number' && Number.isFinite(command.durationSec)
      && (command.mode === 'stopwatch' ? command.durationSec === 0 : command.mode === 'countdown' && command.durationSec >= 1 && command.durationSec <= 86400);
    if (command.type === 'SET_TIMER_POSITION') return keys(command, [...base, 'position']) && isTimerPosition(command.position);
    if (command.type === 'SET_TIMER_SOUND') return keys(command, [...base, 'sound']) && typeof command.sound === 'boolean';
    return command.type === 'FINISH_TIMER' || command.type === 'CLAIM_TIMER_ALARM' ? keys(command, [...base, 'epoch']) && validId(command.epoch) : keys(command, base);
  }
  if (!validId(command.documentId)) return false;
  if (command.type === 'REGISTER_DOCUMENT') {
    if (!keys(command, [...base, 'document']) || command.slideId !== null || !object(command.document)
      || command.document.id !== command.documentId) return false;
    try {
      const session = createSession('validation', 'validation', 0);
      Object.defineProperty(session.documents, command.documentId, { value: command.document, enumerable: true });
      session.documentOrder = [command.documentId];
      assertSessionRecord({ session, receipts: [] });
      return true;
    } catch { return false; }
  }
  if (command.type === 'ACTIVATE_DOCUMENT') return keys(command, base) && (command.slideId === null || validId(command.slideId));
  if (command.type === 'REQUEST_PRESENTATION') return keys(command, [...base, 'playerId']) && validId(command.documentId) && validId(command.slideId) && validId(command.playerId);
  if (command.type === 'COMMIT_PRESENTATION' || command.type === 'REJECT_PRESENTATION') return keys(command, [...base, 'playerId', 'requestId']) && validId(command.documentId) && validId(command.slideId) && validId(command.playerId) && validId(command.requestId);
  if (command.type === 'CANCEL_PRESENTATION') return keys(command, [...base, 'requestId']) && validId(command.documentId) && validId(command.slideId) && validId(command.requestId);
  if (command.type === 'REOPEN_DOCUMENT') return keys(command, base) && command.slideId === null;
  if (!validId(command.slideId)) return false;
  if (command.type === 'BEGIN_PPTX_GROUP' || command.type === 'RESET_PPTX_SLIDE' || command.type === 'REQUEST_PPTX_GROUP' || command.type === 'CANCEL_PPTX_GROUP') return keys(command, base);
  if (command.type === 'BEGIN_REQUESTED_PPTX_GROUP') return keys(command, [...base, 'requestId']) && validId(command.requestId) && command.requestId !== command.commandId;
  if (command.type === 'CHECKPOINT_PPTX_GROUP') return keys(command, [...base, 'epoch', 'checkpoint']) && validId(command.epoch) && isPptxCompletedCheckpoint(command.checkpoint);
  if (command.type === 'ADD_LOCAL_MEDIA') return keys(command, [...base, 'media']) && isLocalMediaRef(command.media) && command.media.slideId === command.slideId;
  if (command.type === 'CHECKPOINT_PPTX_MEDIA') return keys(command, [...base, 'mediaId', 'epoch', 'expectedMediaEpoch', 'playback', 'timeSec', 'paused', 'ended'])
    && validId(command.mediaId) && validId(command.epoch) && (command.expectedMediaEpoch === null || validId(command.expectedMediaEpoch))
    && isMediaPlayback(command.playback) && typeof command.timeSec === 'number' && Number.isFinite(command.timeSec) && command.timeSec >= 0 && command.timeSec <= 86400
    && typeof command.paused === 'boolean' && typeof command.ended === 'boolean';
  if (command.type === 'PLAY_MEDIA' || command.type === 'PAUSE_MEDIA') return keys(command, [...base, 'mediaId']) && validId(command.mediaId);
  if (command.type === 'SET_MEDIA_PLAYBACK') return keys(command, [...base, 'mediaId', 'playback']) && validId(command.mediaId) && isMediaPlayback(command.playback);
  if (command.type === 'SEEK_MEDIA') return keys(command, [...base, 'mediaId', 'timeSec']) && validId(command.mediaId)
    && typeof command.timeSec === 'number' && Number.isFinite(command.timeSec) && command.timeSec >= 0 && command.timeSec < 86400;
  if (command.type === 'CHECKPOINT_MEDIA') return keys(command, [...base, 'mediaId', 'epoch', 'timeSec', 'paused', 'ended']) && validId(command.mediaId) && validId(command.epoch)
    && typeof command.timeSec === 'number' && Number.isFinite(command.timeSec) && command.timeSec >= 0 && typeof command.paused === 'boolean' && typeof command.ended === 'boolean';
  if (command.type === 'SET_AUTOPLAY') return keys(command, [...base, 'scope', 'rule'])
    && ['session', 'document', 'slide'].includes(command.scope as string)
    && (command.rule === null ? command.scope !== 'session' : isSupportedAutoplayRule(command.rule));
  if (command.type === 'PLAY_AUTOPLAY' || command.type === 'PAUSE_AUTOPLAY') return keys(command, base);
  if (command.type === 'ADVANCE_AUTOPLAY') return keys(command, [...base, 'epoch']) && validId(command.epoch);
  if (command.type === 'GOTO_SLIDE' || command.type === 'SELECT_EDITOR_SLIDE') return keys(command, base);
  if (command.type === 'SET_SLIDE_OVERLAYS') return keys(command, [...base, 'overlays']) && isOverlayList(command.overlays);
  return command.type === 'SET_PRESENTER_NOTE' && keys(command, [...base, 'note'])
    && typeof command.note === 'string' && command.note.length <= 100_000;
}

export function canRequest(role: PageRole, request: SessionRequest): boolean {
  if (request.type === 'OPEN_CURRENT_EDITOR') return role === 'player';
  if (request.type === 'GET_SESSION') return true;
  if (request.type === 'GET_PRESENTATION_OWNER') return role === 'remote';
  if (request.type === 'GET_PRESENTATION_TARGET') return role === 'player';
  if (request.type === 'VERIFY_SAVED_BACKUP') return role === 'editor' || role === 'remote';
  if (request.type === 'CLOSE_CURRENT_DOCUMENT') return role === 'remote';
  if (request.type === 'CLOSE_ALL_DOCUMENTS') return role === 'remote';
  if (request.type === 'LIST_SESSIONS' || request.type === 'CREATE_SESSION' || request.type === 'IMPORT_SESSION') return role === 'launcher';
  const type = request.command.type;
  if (type === 'REQUEST_PRESENTATION' || type === 'CANCEL_PRESENTATION') return role === 'remote';
  if (type === 'COMMIT_PRESENTATION' || type === 'REJECT_PRESENTATION') return role === 'player';
  if (role === 'launcher') return type === 'REGISTER_DOCUMENT';
  if (type === 'RESET_PPTX_SLIDE' || type === 'REQUEST_PPTX_GROUP' || type === 'CANCEL_PPTX_GROUP') return role === 'remote';
  if (type === 'BEGIN_PPTX_GROUP' || type === 'CHECKPOINT_PPTX_GROUP' || type === 'BEGIN_REQUESTED_PPTX_GROUP' || type === 'CHECKPOINT_PPTX_MEDIA') return role === 'player';
  if (role === 'remote') return type === 'ACTIVATE_DOCUMENT' || type === 'GOTO_SLIDE' || type === 'REOPEN_DOCUMENT'
    || type === 'SET_AUTOPLAY' || type === 'PLAY_AUTOPLAY' || type === 'PAUSE_AUTOPLAY' || type === 'PLAY_MEDIA' || type === 'PAUSE_MEDIA' || type === 'SET_MEDIA_PLAYBACK' || type === 'SEEK_MEDIA'
    || type === 'SET_TIMER' || type === 'PLAY_TIMER' || type === 'PAUSE_TIMER' || type === 'RESET_TIMER' || type === 'SET_TIMER_POSITION' || type === 'SET_TIMER_SOUND';
  if (role === 'player') return type === 'ADVANCE_AUTOPLAY' || type === 'PLAY_MEDIA' || type === 'CHECKPOINT_MEDIA' || type === 'FINISH_TIMER' || type === 'CLAIM_TIMER_ALARM';
  if (role === 'editor') return type === 'REGISTER_DOCUMENT' || type === 'SELECT_EDITOR_SLIDE' || type === 'SET_PRESENTER_NOTE' || type === 'SET_SLIDE_OVERLAYS' || type === 'ADD_LOCAL_MEDIA';
  return false;
}
