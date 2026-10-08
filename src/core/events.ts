import type { PresenterCommand } from './commands';
import type { ClassSession } from './types';

export type SessionMessage =
  | { type: 'COMMAND'; command: PresenterCommand }
  | { type: 'STATE_UPDATE'; session: ClassSession }
  | { type: 'ACK'; sessionId: string; commandId: string; revision: number }
  | { type: 'ERROR'; sessionId: string; commandId: string; code: 'STALE_REVISION' | 'INVALID_TARGET' | 'PERSISTENCE_FAILED'; message: string }
  | { type: 'MEDIA_EVENT'; sessionId: string; documentId: string; slideId: string; mediaId: string; timeSec: number; state: 'playing' | 'paused' | 'ended' }
  | { type: 'SAVE_RESULT'; sessionId: string; exportId: string; state: 'complete' | 'failed' | 'cancelled' };
