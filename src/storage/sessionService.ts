import type { SessionCommand } from '../core/commands';
import { CommandError, reduceSession, type CommandErrorCode } from '../core/session';
import type { ClassSession } from '../core/types';

export interface SessionRecord {
  session: ClassSession;
  receipts: { commandId: string; revision: number }[];
}

// Implementations must save state and receipts together with an atomic revision check.
export interface SessionRepository {
  read(sessionId: string): Promise<SessionRecord | null>;
  commit(record: SessionRecord, expectedRevision: number): Promise<void>;
}

export type CommandResult =
  | { ok: true; duplicate: boolean; revision: number; session: ClassSession }
  | { ok: false; code: CommandErrorCode };

export class SessionService {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private readonly repository: SessionRepository, private readonly now = Date.now) {}

  execute(command: SessionCommand): Promise<CommandResult> {
    const request = structuredClone(command);
    const result = this.queue.then(() => this.apply(request));
    this.queue = result.catch(() => undefined);
    return result;
  }

  private async apply(command: SessionCommand): Promise<CommandResult> {
    try {
      const record = await this.repository.read(command.sessionId);
      if (!record || record.session.id !== command.sessionId) throw new CommandError('INVALID_CONTEXT');
      const receipt = record.receipts.find(item => item.commandId === command.commandId);
      if (receipt) return { ok: true, duplicate: true, revision: receipt.revision, session: structuredClone(record.session) };
      const session = reduceSession(record.session, command, this.now());
      const receipts = [...record.receipts, { commandId: command.commandId, revision: session.revision }].slice(-256);
      await this.repository.commit({ session, receipts }, record.session.revision);
      return { ok: true, duplicate: false, revision: session.revision, session: structuredClone(session) };
    } catch (error) {
      return { ok: false, code: error instanceof CommandError ? error.code : 'PERSISTENCE_FAILED' };
    }
  }
}
