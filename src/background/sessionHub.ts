import { createSession } from '../core/session';
import { toPlayerSnapshot } from '../core/playerSnapshot';
import { currentPresentationTransition } from '../core/presentationTransition';
import type { ClassSession } from '../core/types';
import { SessionService, type SessionRepository } from '../storage/sessionService';
import { canRequest, isSessionRequest, type CloseOutcome, type PageRole, type SessionResponse, type SessionSummary } from '../shared/sessionMessages';
import { restoreSessionBundle } from '../storage/sessionBundle';
import { BackupVerificationError, type BackupVerification, type BackupVerificationRequest } from '../storage/backupVerification';

export interface SessionStore extends SessionRepository {
  create(session: ClassSession): Promise<void>;
  list(): Promise<SessionSummary[]>;
  close(): void;
}
export function snapshotFor(role: PageRole, session: ClassSession): SessionResponse {
  return role === 'player' ? { ok: true, kind: 'player', snapshot: toPlayerSnapshot(session) }
    : { ok: true, kind: 'teacher', session: structuredClone(session) };
}

export class SessionHub {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly open: () => Promise<SessionStore>,
    private readonly publish: (session: ClassSession) => void,
    private readonly newId: () => string = () => crypto.randomUUID(), private readonly now = Date.now,
    private readonly verifyBackup?: (request: BackupVerificationRequest, session: ClassSession) => Promise<BackupVerification>) {}

  handle(role: PageRole, value: unknown): Promise<SessionResponse> {
    if (!isSessionRequest(value)) return Promise.resolve({ ok: false, code: 'INVALID_REQUEST', error: '요청 형식을 확인하지 못했습니다.' });
    if (!canRequest(role, value)) return Promise.resolve({ ok: false, code: 'FORBIDDEN', error: '이 창에서는 해당 작업을 할 수 없습니다.' });
    const request = structuredClone(value);
    const response = this.queue.then(async (): Promise<SessionResponse> => {
      let store: SessionStore | undefined;
      try {
        store = await this.open();
        if (request.type === 'LIST_SESSIONS') return { ok: true, kind: 'list', sessions: await store.list() };
        if (request.type === 'CREATE_SESSION') {
          const session = createSession(this.newId(), request.title.trim(), this.now());
          await store.create(session);
          return snapshotFor(role, session);
        }
        if (request.type === 'IMPORT_SESSION') {
          const session = restoreSessionBundle(request.bundle, this.newId(), this.now());
          await store.create(session); return snapshotFor(role, session);
        }
        if (request.type === 'GET_SESSION') {
          const record = await store.read(request.sessionId);
          return record ? snapshotFor(role, record.session)
            : { ok: false, code: 'NOT_FOUND', error: '수업을 찾지 못했습니다. 수업 목록에서 다시 선택하세요.' };
        }
        if (request.type === 'GET_PRESENTATION_OWNER') return { ok: false, code: 'PLAYER_OWNER_FAILED', error: '발표 창을 확인하지 못했습니다.' };
        if (request.type === 'GET_PRESENTATION_TARGET') {
          const record = await store.read(request.sessionId), pending = record?.session.presentationTransition;
          if (!record || !pending || pending.requestId !== request.requestId || pending.playerId !== request.playerId || !currentPresentationTransition(record.session, pending)) return { ok: false, code: 'INVALID_TARGET', error: '전환 요청이 달라졌습니다. 다시 요청하세요.' };
          const targetDocument = record.session.documents[pending.documentId]!;
          const projected = { ...record.session, presentationTransition: null, documents: { ...record.session.documents, [pending.documentId]: { ...targetDocument, closed: false } }, presentedSelection: { documentId: pending.documentId, slideId: pending.slideId } };
          const target = toPlayerSnapshot(projected);
          if (target.pptx) target.pptx = { ...target.pptx, run: null, request: null };
          target.autoplay = null; target.timers = [];
          target.media = target.media.map(entry => ({ ...entry, bookmark: entry.bookmark ? { ...entry.bookmark, paused: true } : null }));
          return { ok: true, kind: 'transition-target', requestId: pending.requestId, target };
        }
        if (request.type === 'VERIFY_SAVED_BACKUP') {
          const record = await store.read(request.sessionId);
          if (!record || !this.verifyBackup) throw new BackupVerificationError('FILE_UNAVAILABLE');
          const verification = await this.verifyBackup(request, record.session);
          const latest = await store.read(request.sessionId);
          if (!latest || latest.session.revision !== request.revision) throw new BackupVerificationError('STALE_REVISION');
          return { ok: true, kind: 'backup-verification', verification };
        }
        if (request.type === 'OPEN_CURRENT_EDITOR') {
          const record = await store.read(request.command.sessionId);
          if (!record) throw new BackupVerificationError('INVALID_TARGET');
          if (record.receipts.some(receipt => receipt.commandId === request.command.commandId)) return snapshotFor('player', record.session);
          if (record.session.revision !== request.command.revision) throw new BackupVerificationError('STALE_REVISION');
          const selected = record.session.presentedSelection;
          if (!selected || selected.documentId !== request.command.documentId || selected.slideId !== request.command.slideId
            || record.session.documents[selected.documentId]?.closed) throw new BackupVerificationError('INVALID_TARGET');
          const result = await new SessionService(store, this.now).execute(request.command);
          if (!result.ok) return { ok: false, code: result.code, error: '편집창을 준비하지 못했습니다.' };
          if (!result.duplicate) this.publish(result.session);
          return snapshotFor('player', result.session);
        }
        if (request.type === 'CLOSE_ALL_DOCUMENTS') {
          const record = await store.read(request.sessionId);
          if (!record) throw new BackupVerificationError('INVALID_TARGET');
          if (record.receipts.some(receipt => receipt.commandId === request.commandId)) return { ok: true, kind: 'close-all', revision: record.session.revision,
            results: request.choices.map(choice => ({ documentId: choice.documentId, state: record.session.documents[choice.documentId]?.closed ? 'closed' : 'kept', error: null })) };
          if (record.session.revision !== request.revision) throw new BackupVerificationError('STALE_REVISION');
          const opened = record.session.documentOrder.filter(id => !record.session.documents[id]?.closed);
          if (opened.length !== request.choices.length || request.choices.some(choice => !opened.includes(choice.documentId))) throw new BackupVerificationError('INVALID_TARGET');
          let saved = false;
          if (request.choices.some(choice => choice.decision === 'saved') && this.verifyBackup && request.blobUrl) {
            try { await this.verifyBackup({ sessionId: request.sessionId, revision: request.revision, blobUrl: request.blobUrl }, record.session); saved = true; }
            catch { /* Failed saved targets stay open; explicit other choices are independent. */ }
          }
          const results: CloseOutcome[] = request.choices.map(choice => {
            const allowed = choice.decision === 'without-backup' || choice.decision === 'saved' && saved
              || choice.decision === 'unchanged' && !record.session.documents[choice.documentId]!.dirty;
            return { documentId: choice.documentId, state: allowed ? 'closed' : 'kept', error: allowed ? null : '저장 확인에 실패해 유지했습니다.' };
          });
          const documentIds = results.filter(item => item.state === 'closed').map(item => item.documentId);
          if (!documentIds.length) {
            const latest = await store.read(request.sessionId);
            if (!latest || latest.session.revision !== request.revision) throw new BackupVerificationError('STALE_REVISION');
            return { ok: true, kind: 'close-all', revision: request.revision, results };
          }
          const result = await new SessionService(store, this.now).execute({ type: 'CLOSE_DOCUMENTS', sessionId: request.sessionId, revision: request.revision,
            commandId: request.commandId, documentId: null, slideId: null, documentIds });
          if (!result.ok) return { ok: false, code: result.code, error: '전체 종료를 확정하지 못했습니다. 자료 상태는 변경하지 않았습니다.' };
          if (!result.duplicate) this.publish(result.session);
          return { ok: true, kind: 'close-all', revision: result.session.revision, results };
        }
        if (request.type === 'CLOSE_CURRENT_DOCUMENT') {
          const record = await store.read(request.command.sessionId);
          if (record?.receipts.some(receipt => receipt.commandId === request.command.commandId)) {
            return snapshotFor(role, record.session);
          }
          if (!record || record.session.revision !== request.command.revision) throw new BackupVerificationError('STALE_REVISION');
          const document = record.session.documents[request.command.documentId];
          if (!document || document.closed || record.session.presentedSelection?.documentId !== document.id) throw new BackupVerificationError('INVALID_TARGET');
          if (request.decision === 'unchanged' && document.dirty) throw new BackupVerificationError('SAVE_REQUIRED');
          if (request.decision === 'saved') {
            if (!this.verifyBackup || !request.blobUrl) throw new BackupVerificationError('SAVE_REQUIRED');
            await this.verifyBackup({ sessionId: record.session.id, revision: record.session.revision, blobUrl: request.blobUrl }, record.session);
          }
          const result = await new SessionService(store, this.now).execute(request.command);
          if (!result.ok) return { ok: false, code: result.code, error: '종료를 확정하지 못했습니다. 현재 발표와 편집정보를 유지했습니다.' };
          if (!result.duplicate) this.publish(result.session);
          return snapshotFor(role, result.session);
        }
        const command = request.command;
        if (command.type === 'ACTIVATE_DOCUMENT' || command.type === 'GOTO_SLIDE' || command.type === 'REOPEN_DOCUMENT' || command.type === 'ADVANCE_AUTOPLAY') {
          const record = await store.read(command.sessionId);
          const documentId = command.type === 'ADVANCE_AUTOPLAY' ? record?.session.presentedSelection?.documentId : command.documentId;
          if (documentId && record?.session.documents[documentId]?.source.type === 'pptx') return {
            ok: false, code: 'PRESENTATION_PREPARATION_REQUIRED', error: 'PPTX는 발표 창의 준비 확인 후 전환해야 합니다. 리모컨에서 다시 요청하세요.',
          };
        }
        const result = await new SessionService(store, this.now).execute(command);
        if (!result.ok) return { ok: false, code: result.code, error: result.code === 'STALE_REVISION'
          ? '다른 창에서 상태가 바뀌었습니다. 최신 상태를 확인한 뒤 다시 시도하세요.'
          : '변경을 저장하지 못했습니다. 현재 자료를 유지한 채 다시 시도하세요.' };
        if (!result.duplicate) this.publish(result.session);
        return snapshotFor(role, result.session);
      } catch (error) {
        if (error instanceof BackupVerificationError) return { ok: false, code: error.code, error: error.code === 'STALE_REVISION'
          ? '확인 중 수업 상태가 바뀌었습니다. 현재 편집정보를 다시 저장하세요.'
          : '완료 기록과 현재 편집정보가 일치하는 파일을 확인하지 못했습니다. 기존 편집정보는 유지했습니다.' };
        return { ok: false, code: 'PERSISTENCE_FAILED', error: '수업 저장소를 열거나 복구하지 못했습니다. 기존 데이터는 지우지 않았습니다.' };
      } finally { store?.close(); }
    });
    this.queue = response.catch(() => undefined);
    return response;
  }
}
