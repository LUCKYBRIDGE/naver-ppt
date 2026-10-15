export interface AutoplayRule {
  mode: 'manual' | 'seconds' | 'media-end' | 'later-of-time-and-media';
  seconds?: number;
  loop: 'none' | 'slide' | 'range' | 'document';
  range?: { startSlideId: string; endSlideId: string };
  pauseWhileEditing: boolean;
}

export interface AutoplayCheckpoint {
  slideId: string;
  epoch: string;
  startedAt: number | null;
  elapsedMs: number;
  paused: boolean;
}

export interface MediaBookmark {
  mediaId: string;
  slideId: string;
  timeSec: number;
  paused: boolean;
  replayPolicy: 'ask' | 'resume' | 'restart';
  epoch?: string;
  autoplayEpoch?: string;
  positionEpoch?: string;
  ended?: boolean;
  sourceRunEpoch?: string;
}

export interface LocalMediaRef {
  id: string;
  slideId: string;
  kind: 'audio' | 'video';
  name: string;
  mime: 'audio/wav' | 'audio/mpeg' | 'video/mp4' | 'video/webm';
  size: number;
  lastModified: number;
  fingerprint: string;
  durationSec: number;
  playback?: MediaPlayback;
  embeddedSource?: PptxEmbeddedMediaSource;
}

export interface PptxEmbeddedMediaSource {
  type: 'pptx';
  sourceFingerprint: string;
  sourcePart: string;
  elementPath: number[];
}

export interface MediaPlayback { startSec: number; endSec: number; volume: number; muted: boolean }

export interface TimerState {
  scope: 'session' | 'document';
  documentId: string | null;
  durationSec: number;
  startedAt: number | null;
  elapsedBeforeStartMs: number;
  paused: boolean;
  mode?: 'countdown' | 'stopwatch';
  visible?: boolean;
  epoch?: string;
  position?: { x: number; y: number };
  sound?: boolean;
  completedEpoch?: string;
  alarmClaimedEpoch?: string;
}
