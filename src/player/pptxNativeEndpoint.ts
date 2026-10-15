import type { PptxCheckpointTransport } from '../adapters/pptx/durablePlayback';
import { PptxNativeMediaActions } from '../adapters/pptx/nativeMediaAction';
import type { PptxAnimationPlayback } from '../adapters/pptx/animationRun';
import type { PptxMediaAction } from '../core/pptxMediaAction';
import type { MediaBookmark, PptxEmbeddedMediaSource } from '../media/types';
import { mediaPlayback } from '../media/validation';

const fail = (): never => { throw Error('PPTX_NATIVE_ENDPOINT_FAILED'); };
const occurrence = (source: PptxEmbeddedMediaSource | undefined) => JSON.stringify([source?.type, source?.sourceFingerprint, source?.sourcePart, source?.elementPath]);
export class PptxNativeEndpoint {
  private disposed = false;
  private generation = 0;
  private actions: PptxNativeMediaActions | null = null;
  private range = '';
  private cancelActive: (() => void) | null = null;
  private heldEpoch: string | null = null;
  private readonly sourceBinding: string;
  private active: { expected: string | null; id: string; epoch: string; cancelled: boolean; paused: boolean; ended: boolean } | null = null;
  constructor(private readonly media: HTMLMediaElement, private readonly transport: PptxCheckpointTransport,
    private readonly scope: { sessionId: string; documentId: string; slideId: string; mediaId: string; fingerprint: string },
    private readonly onPauseSaveFailure: () => void = () => {}) {
    this.sourceBinding = occurrence(transport.snapshot().media.find(entry => entry.ref.id === scope.mediaId)?.ref.embeddedSource);
  }
  private read(allowDisposed = false) {
    const snapshot = this.transport.snapshot(), entry = snapshot.media.find(entry => entry.ref.id === this.scope.mediaId);
    if (this.disposed && !allowDisposed || snapshot.sessionId !== this.scope.sessionId || snapshot.selection?.documentId !== this.scope.documentId
      || snapshot.selection.slideId !== this.scope.slideId || !entry || entry.ref.slideId !== this.scope.slideId
      || entry.ref.fingerprint !== this.scope.fingerprint || !entry.ref.embeddedSource || entry.ref.embeddedSource.sourceFingerprint !== snapshot.sourceFingerprint
      || occurrence(entry.ref.embeddedSource) !== this.sourceBinding) return fail();
    return { snapshot, entry };
  }
  private owns() {
    try {
      const { entry } = this.read(), active = this.active;
      return active !== null && [active.expected, active.id].includes(entry.bookmark?.epoch ?? null);
    } catch { return false; }
  }
  // Called before applying a public bookmark to the native element. A teacher
  // epoch supersedes source promises without stopping the teacher's playback.
  reconcile() {
    if (this.active && !this.owns()) { this.actions?.relinquish(); this.cancelActive?.(); this.active = null; this.generation++; }
  }
  private isCurrent() {
    try { return !!this.active && !this.active.cancelled && this.read().snapshot.pptx?.run?.epoch === this.active.epoch && this.owns(); }
    catch { return false; }
  }
  private async holdHistorical(bookmark: MediaBookmark) {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { snapshot, entry } = this.read();
        if (this.active || !entry.bookmark || !bookmark.epoch || entry.bookmark.epoch !== bookmark.epoch || entry.bookmark.paused) return;
        const result = await this.transport.send({ type: 'CHECKPOINT_MEDIA', sessionId: this.scope.sessionId, documentId: this.scope.documentId,
          slideId: this.scope.slideId, mediaId: this.scope.mediaId, revision: snapshot.revision, commandId: this.transport.newId(),
          epoch: bookmark.epoch, timeSec: entry.bookmark.timeSec, paused: true, ended: entry.bookmark.ended ?? false });
        if (result.ok) return;
        if (result.code !== 'STALE_REVISION') break;
      }
      if (!this.disposed) this.onPauseSaveFailure();
    } catch { if (!this.disposed) this.onPauseSaveFailure(); }
  }
  suppressApply(bookmark: MediaBookmark | null) {
    this.reconcile();
    const active = this.active;
    // A fresh Player may restore a saved source bookmark, but only a newly
    // requested source action or teacher epoch may start its native element.
    if (!active && bookmark?.sourceRunEpoch && !bookmark.paused) {
      this.media.pause();
      if (bookmark.epoch && this.heldEpoch !== bookmark.epoch) { this.heldEpoch = bookmark.epoch; void this.holdHistorical(bookmark); }
      return true;
    }
    return !!active && bookmark?.epoch === active.id && bookmark.sourceRunEpoch === active.epoch
      && (active.cancelled || bookmark.paused === active.paused && (bookmark.ended ?? false) === active.ended);
  }
  start(action: PptxMediaAction): PptxAnimationPlayback {
    const { snapshot, entry } = this.read(), epoch = snapshot.pptx?.run?.epoch;
    if (!epoch || snapshot.pptx?.run?.slideId !== this.scope.slideId) return fail();
    this.reconcile();
    const playback = mediaPlayback(entry.ref), signature = JSON.stringify(playback), range = JSON.stringify([playback.startSec, playback.endSec]), id = this.transport.newId();
    const generation = ++this.generation;
    const active = { expected: entry.bookmark?.epoch ?? null, id, epoch, cancelled: false, paused: false, ended: false };
    this.active = active;
    const current = () => {
      try { const { snapshot } = this.read(); return this.active === active && !active.cancelled && generation === this.generation
        && snapshot.pptx?.run?.epoch === epoch && this.owns(); } catch { return false; }
    };
    // Preserve stop/resume state across calls. The executor's own generation
    // invalidates old promises even though its ownership callback is shared.
    if (!this.actions || this.range !== range) {
      this.actions?.relinquish();
      this.actions = new PptxNativeMediaActions(this.media, playback, () => this.isCurrent(), entry.bookmark !== null && entry.bookmark.ended !== true);
      this.range = range;
    }
    const actions = this.actions;
    let native: PptxAnimationPlayback;
    try { native = actions.start(action); } catch { active.cancelled = true; throw Error('PPTX_NATIVE_ENDPOINT_FAILED'); }
    let rejectCancel!: (error: Error) => void;
    const cancelled = new Promise<never>((_, reject) => { rejectCancel = reject; });
    const pauseSaved = async () => {
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const { snapshot, entry } = this.read(true);
          if (entry.bookmark?.epoch !== id || entry.bookmark.sourceRunEpoch !== epoch || !this.media.paused) return;
          const result = await this.transport.send({ type: 'CHECKPOINT_MEDIA', sessionId: this.scope.sessionId, documentId: this.scope.documentId,
            slideId: this.scope.slideId, mediaId: this.scope.mediaId, revision: snapshot.revision, commandId: this.transport.newId(),
            epoch: id, timeSec: Math.max(playback.startSec, Math.min(this.media.currentTime, playback.endSec)), paused: true, ended: this.media.ended });
          if (result.ok) return;
          if (result.code !== 'STALE_REVISION') break;
        }
        if (!this.disposed) this.onPauseSaveFailure();
      } catch { if (!this.disposed) this.onPauseSaveFailure(); }
    };
    const cancel = () => {
      if (active.cancelled) return; active.cancelled = true;
      if (this.active === active && this.owns()) { native.cancel(); void pauseSaved(); }
      rejectCancel(Error('PPTX_NATIVE_ENDPOINT_CANCELLED'));
    };
    this.cancelActive = cancel;
    const work = (async () => {
      try {
        await native.finished;
        if (!current()) return fail();
        for (let attempt = 0; attempt < 3; attempt++) {
          const { snapshot, entry } = this.read();
          if (!current() || JSON.stringify(mediaPlayback(entry.ref)) !== signature) return fail();
          const timeSec = this.media.currentTime; active.paused = this.media.paused; active.ended = this.media.ended;
          const result = await this.transport.send({ type: 'CHECKPOINT_PPTX_MEDIA', sessionId: this.scope.sessionId, documentId: this.scope.documentId,
            slideId: this.scope.slideId, mediaId: this.scope.mediaId, revision: snapshot.revision, commandId: id, epoch, expectedMediaEpoch: active.expected,
            playback, timeSec, paused: active.paused, ended: active.ended });
          if (active.cancelled) { await pauseSaved(); throw Error('PPTX_NATIVE_ENDPOINT_CANCELLED'); }
          if (result.ok) {
            if (!current()) return fail();
            const saved = result.snapshot.media.find(entry => entry.ref.id === this.scope.mediaId)?.bookmark;
            if (saved?.epoch !== id || saved.sourceRunEpoch !== epoch) return fail();
            return;
          }
          if (result.code !== 'STALE_REVISION') return fail();
        }
        return fail();
      } catch { cancel(); throw Error('PPTX_NATIVE_ENDPOINT_FAILED'); }
    })();
    return { finished: Promise.race([work, cancelled]), cancel };
  }
  dispose() {
    if (this.disposed) return;
    this.cancelActive?.(); this.cancelActive = null;
    if (this.owns()) this.actions?.dispose();
    else this.actions?.relinquish();
    this.disposed = true; this.generation++;
  }
}
