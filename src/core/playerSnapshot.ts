import type { ClassSession, Selection } from './types';
import type { OverlayData } from '../overlays/types';
import type { AutoplayCheckpoint, AutoplayRule, LocalMediaRef, MediaBookmark, TimerState } from '../media/types';
import { scopedTimer } from '../media/timer';
import { resolveAutoplay, mediaEndedForAutoplay } from '../media/autoplay';
import type { PptxCompletedCheckpoint } from './pptxPlayback';
import type { PresentationTransition } from './presentationTransition';

export interface PlayerSnapshot {
  presentationTransition?: PresentationTransition | null;
  sessionId: string;
  revision: number;
  selection: Selection | null;
  pageNumber: number | null;
  sourceFingerprint: string | null;
  pptx?: { checkpoint: PptxCompletedCheckpoint | null; run: { epoch: string; slideId: string } | null; slideIds?: string[];
    request?: { commandId: string; slideId: string } | null };
  overlays: OverlayData[];
  autoplay: { rule: AutoplayRule; checkpoint: AutoplayCheckpoint | null; mediaEnded: boolean | null } | null;
  media: { ref: Omit<LocalMediaRef, 'name' | 'size' | 'lastModified'>; bookmark: MediaBookmark | null }[];
  timers: TimerState[];
}

export function toPlayerSnapshot(session: ClassSession): PlayerSnapshot {
  const selection = session.presentedSelection;
  const document = selection && Object.hasOwn(session.documents, selection.documentId)
    ? session.documents[selection.documentId] : undefined;
  const delta = document && selection?.slideId && Object.hasOwn(document.slideDeltas, selection.slideId)
    ? document.slideDeltas[selection.slideId] : undefined;
  return { sessionId: session.id, revision: session.revision,
    ...(Object.hasOwn(session, 'presentationTransition') ? { presentationTransition: structuredClone(session.presentationTransition ?? null) } : {}),
    selection: selection ? { ...selection } : null,
    pageNumber: document && selection?.slideId && document.slideIds.includes(selection.slideId) ? document.slideIds.indexOf(selection.slideId) + 1 : null,
    sourceFingerprint: document?.source.type === 'pdf' || document?.source.type === 'pptx' ? document.source.fingerprint ?? null : null,
    ...(document?.source.type === 'pptx' && selection?.slideId ? { pptx: { checkpoint: structuredClone(Object.hasOwn(document.pptxPlayback?.checkpoints ?? {}, selection.slideId) ? document.pptxPlayback!.checkpoints[selection.slideId]! : null), run: structuredClone(document.pptxPlayback?.run ?? null), slideIds: [...document.slideIds],
      ...(Object.hasOwn(document.pptxPlayback ?? {}, 'request') ? { request: structuredClone(document.pptxPlayback!.request ?? null) } : {}) } } : {}),
    overlays: structuredClone(delta?.overlays ?? []),
    timers: structuredClone([scopedTimer(session, null), selection ? scopedTimer(session, selection.documentId) : null].filter((timer): timer is TimerState => timer !== null)),
    autoplay: document && selection?.slideId ? { rule: resolveAutoplay(session, document, selection.slideId), checkpoint: structuredClone(document.autoplayCheckpoint ?? null),
      mediaEnded: document.autoplayCheckpoint ? mediaEndedForAutoplay(document, selection.slideId, document.autoplayCheckpoint.epoch) : null } : null,
    media: document ? Object.values(document.localMedia ?? {}).filter(ref => ref.slideId === selection?.slideId).map(({ name: _name, size: _size, lastModified: _modified, ...ref }) => ({ ref: structuredClone(ref), bookmark: structuredClone(Object.hasOwn(document.mediaBookmarks, ref.id) ? document.mediaBookmarks[ref.id]! : null) })) : [] };
}
