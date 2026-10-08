import type { ClassSession } from '../core/types';

/** JSON 파일 계약. File/Blob/FileSystemHandle·원본 바이트를 포함하지 않는다. */
export interface SessionBundle {
  format: 'whale-class-presenter';
  schemaVersion: 1;
  exportedAt: number;
  session: ClassSession;
}

export interface DeltaRepository {
  read(sessionId: string): Promise<ClassSession | null>;
  // 영속 commit의 원자성·CAS·중복 commandId는 구현 시 세부 사양을 확정한다.
  commit(session: ClassSession, expectedRevision: number, commandId: string): Promise<void>;
}
