import type { OverlayData } from '../overlays/types';
import type { AutoplayRule, MediaBookmark, TimerState } from '../media/types';

export const sourceTypes = ['pdf', 'pptx', 'ppt', 'show', 'canva', 'miricanvas'] as const;
export type SourceType = (typeof sourceTypes)[number];

export type SourceRef =
  | { type: 'pdf' | 'pptx' | 'ppt' | 'show'; name: string; size: number; lastModified: number; fingerprint?: string; fileHandleKey?: string }
  | { type: 'canva' | 'miricanvas'; url: string; title: string };

export interface Selection { documentId: string; slideId: string | null }

export interface SlideDelta {
  overlays: OverlayData[];
  presenterNote: string;
  classLog: string;
  autoplay?: AutoplayRule;
}

export interface PresentationDocumentState {
  id: string;
  source: SourceRef;
  lastSlideId: string | null;
  // 외부 W0 자료의 불명확한 위치를 1페이지로 만들어 넣지 않는다.
  knownSlideCount: number | null;
  slideDeltas: Record<string, SlideDelta>;
  autoplay?: AutoplayRule;
  mediaBookmarks: Record<string, MediaBookmark>;
  dirty: boolean;
}

export interface ClassSession {
  id: string;
  title: string;
  revision: number;
  documentOrder: string[];
  documents: Record<string, PresentationDocumentState>;
  presentedSelection: Selection | null;
  editorSelection: Selection | null;
  history: Selection[];
  defaultAutoplay: AutoplayRule;
  globalTimer: TimerState | null;
  updatedAt: number;
}
