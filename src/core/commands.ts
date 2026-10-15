import type { OverlayData } from '../overlays/types';
import type { PptxCompletedCheckpoint } from './pptxPlayback';
import type { PresentationDocumentState } from './types';
import type { AutoplayRule } from '../media/types';
import type { LocalMediaRef, MediaPlayback } from '../media/types';

// 모든 명령에 식별자와 기대 revision을 포함한다. 대상 없음은 명시적 null.
export interface CommandContext {
  commandId: string;
  sessionId: string;
  documentId: string | null;
  slideId: string | null;
  revision: number;
}

export type PresenterCommand = CommandContext & (
  | { type: 'REQUEST_PRESENTATION'; documentId: string; slideId: string; playerId: string }
  | { type: 'COMMIT_PRESENTATION' | 'REJECT_PRESENTATION'; documentId: string; slideId: string; playerId: string; requestId: string }
  | { type: 'CANCEL_PRESENTATION'; documentId: string; slideId: string; requestId: string }
  | { type: 'BEGIN_PPTX_GROUP' | 'RESET_PPTX_SLIDE' | 'REQUEST_PPTX_GROUP' | 'CANCEL_PPTX_GROUP'; documentId: string; slideId: string }
  | { type: 'BEGIN_REQUESTED_PPTX_GROUP'; documentId: string; slideId: string; requestId: string }
  | { type: 'CHECKPOINT_PPTX_GROUP'; documentId: string; slideId: string; epoch: string; checkpoint: PptxCompletedCheckpoint }
  | { type: 'REGISTER_DOCUMENT'; documentId: string; slideId: null; document: PresentationDocumentState }
  | { type: 'ACTIVATE_DOCUMENT'; documentId: string }
  | { type: 'CLOSE_DOCUMENT' | 'REOPEN_DOCUMENT'; documentId: string; slideId: null }
  | { type: 'CLOSE_DOCUMENTS'; documentId: null; slideId: null; documentIds: string[] }
  | { type: 'GOTO_SLIDE' | 'SELECT_EDITOR_SLIDE'; documentId: string; slideId: string }
  | { type: 'SET_AUTOPLAY'; documentId: string; slideId: string; scope: 'session' | 'document' | 'slide'; rule: AutoplayRule | null }
  | { type: 'PLAY_AUTOPLAY'; documentId: string; slideId: string }
  | { type: 'PAUSE_AUTOPLAY'; documentId: string; slideId: string }
  | { type: 'ADVANCE_AUTOPLAY'; documentId: string; slideId: string; epoch: string }
  | { type: 'ADD_LOCAL_MEDIA'; documentId: string; slideId: string; media: LocalMediaRef }
  | { type: 'PLAY_MEDIA' | 'PAUSE_MEDIA'; documentId: string; slideId: string; mediaId: string }
  | { type: 'SET_MEDIA_PLAYBACK'; documentId: string; slideId: string; mediaId: string; playback: MediaPlayback }
  | { type: 'SEEK_MEDIA'; documentId: string; slideId: string; mediaId: string; timeSec: number }
  | { type: 'CHECKPOINT_MEDIA'; documentId: string; slideId: string; mediaId: string; epoch: string; timeSec: number; paused: boolean; ended: boolean }
  | { type: 'CHECKPOINT_PPTX_MEDIA'; documentId: string; slideId: string; mediaId: string; epoch: string; expectedMediaEpoch: string | null;
      playback: MediaPlayback; timeSec: number; paused: boolean; ended: boolean }
  | { type: 'SET_TIMER'; slideId: null; mode: 'countdown' | 'stopwatch'; durationSec: number; visible: boolean }
  | { type: 'PLAY_TIMER' | 'PAUSE_TIMER' | 'RESET_TIMER'; slideId: null }
  | { type: 'FINISH_TIMER'; slideId: null; epoch: string }
  | { type: 'SET_TIMER_POSITION'; slideId: null; position: { x: number; y: number } }
  | { type: 'SET_TIMER_SOUND'; slideId: null; sound: boolean }
  | { type: 'CLAIM_TIMER_ALARM'; slideId: null; epoch: string }
  | { type: 'UPSERT_OVERLAY'; documentId: string; slideId: string; overlay: OverlayData }
  | { type: 'SET_SLIDE_OVERLAYS'; documentId: string; slideId: string; overlays: OverlayData[] }
  | { type: 'SET_PRESENTER_NOTE'; documentId: string; slideId: string; note: string }
  | { type: 'PAUSE' | 'RESUME'; documentId: string }
  | { type: 'REQUEST_CLOSE_DOCUMENT'; documentId: string }
  | { type: 'REQUEST_CLOSE_ALL'; documentId: null; slideId: null }
);

// REQUEST_CLOSE_*는 저장 의사 확인과 성공 판정 전에 데이터를 삭제하지 않는다.
// UI의 OPEN_WINDOW는 별도 메시지 계약이다.
export type SessionCommand = Extract<PresenterCommand, {
  type: 'REQUEST_PRESENTATION' | 'COMMIT_PRESENTATION' | 'REJECT_PRESENTATION' | 'CANCEL_PRESENTATION' |
  'BEGIN_PPTX_GROUP' | 'RESET_PPTX_SLIDE' | 'CHECKPOINT_PPTX_GROUP' | 'REQUEST_PPTX_GROUP' | 'CANCEL_PPTX_GROUP' | 'BEGIN_REQUESTED_PPTX_GROUP' |
  'REGISTER_DOCUMENT' | 'ACTIVATE_DOCUMENT' | 'GOTO_SLIDE' | 'SELECT_EDITOR_SLIDE' | 'SET_PRESENTER_NOTE' | 'SET_SLIDE_OVERLAYS' | 'CLOSE_DOCUMENT' | 'REOPEN_DOCUMENT' | 'CLOSE_DOCUMENTS' | 'SET_AUTOPLAY' | 'PLAY_AUTOPLAY' | 'PAUSE_AUTOPLAY' | 'ADVANCE_AUTOPLAY' | 'ADD_LOCAL_MEDIA' | 'PLAY_MEDIA' | 'PAUSE_MEDIA' | 'CHECKPOINT_MEDIA' | 'CHECKPOINT_PPTX_MEDIA' | 'SET_MEDIA_PLAYBACK' | 'SEEK_MEDIA' | 'SET_TIMER' | 'PLAY_TIMER' | 'PAUSE_TIMER' | 'RESET_TIMER' | 'FINISH_TIMER' | 'SET_TIMER_POSITION' | 'SET_TIMER_SOUND' | 'CLAIM_TIMER_ALARM';
}>;
