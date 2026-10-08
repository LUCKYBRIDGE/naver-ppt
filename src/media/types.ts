export interface AutoplayRule {
  mode: 'manual' | 'seconds' | 'media-end' | 'later-of-time-and-media';
  seconds?: number;
  loop: 'none' | 'slide' | 'range' | 'document';
  range?: { startSlideId: string; endSlideId: string };
  pauseWhileEditing: boolean;
}

export interface MediaBookmark {
  mediaId: string;
  slideId: string;
  timeSec: number;
  paused: boolean;
  replayPolicy: 'ask' | 'resume' | 'restart';
}

export interface TimerState {
  scope: 'session' | 'document';
  documentId: string | null;
  durationSec: number;
  startedAt: number | null;
  elapsedBeforeStartMs: number;
  paused: boolean;
}
