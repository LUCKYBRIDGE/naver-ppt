import type { OverlayData } from '../overlays/types';

// 모든 명령에 식별자와 기대 revision을 포함한다. 대상 없음은 명시적 null.
export interface CommandContext {
  commandId: string;
  sessionId: string;
  documentId: string | null;
  slideId: string | null;
  revision: number;
}

export type PresenterCommand = CommandContext & (
  | { type: 'ACTIVATE_DOCUMENT'; documentId: string }
  | { type: 'GOTO_SLIDE' | 'SELECT_EDITOR_SLIDE'; documentId: string; slideId: string }
  | { type: 'UPSERT_OVERLAY'; documentId: string; slideId: string; overlay: OverlayData }
  | { type: 'PAUSE' | 'RESUME'; documentId: string }
  | { type: 'REQUEST_CLOSE_DOCUMENT'; documentId: string }
  | { type: 'REQUEST_CLOSE_ALL'; documentId: null; slideId: null }
);

// REQUEST_CLOSE_*는 저장 의사 확인과 성공 판정 전에 데이터를 삭제하지 않는다.
// reducer/영속 commit은 후속 구현. UI의 OPEN_WINDOW는 별도 메시지 계약이다.
