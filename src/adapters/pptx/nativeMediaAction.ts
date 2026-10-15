import { isPptxMediaAction, type PptxMediaAction } from '../../core/pptxMediaAction';
import type { PptxAnimationPlayback } from './animationRun';

type NativeMedia = Pick<HTMLMediaElement, 'readyState' | 'duration' | 'currentTime' | 'paused' | 'ended' | 'play' | 'pause'>;

// Runtime-owned native command executor. The caller supplies strict current
// request/run ownership and handles durable bookmark writes. No timers or replay.
export class PptxNativeMediaActions {
  private active = false;
  private disposed = false;
  private generation = 0;
  private pending: (() => void) | null = null;
  constructor(private readonly media: NativeMedia, private readonly range: { startSec: number; endSec: number }, private readonly isCurrent: () => boolean, initiallyActive = false) {
    this.range = { ...range };
    this.active = initiallyActive;
  }
  start(action: PptxMediaAction): PptxAnimationPlayback {
    const fail = (): never => { throw Error('PPTX_NATIVE_MEDIA_ACTION_FAILED'); };
    const { media, range } = this;
    if (this.disposed || !this.isCurrent() || !isPptxMediaAction(action) || media.readyState < 1 || !Number.isFinite(media.duration) || media.duration <= 0 || media.duration > 86400
      || !Number.isFinite(range.startSec) || !Number.isFinite(range.endSec) || range.startSec < 0 || range.endSec <= range.startSec || range.endSec > media.duration
      || !Number.isFinite(media.currentTime) || media.currentTime < 0 || media.currentTime > media.duration
      || action.type === 'playFrom' && (action.timeSec < range.startSec || action.timeSec >= range.endSec)) return fail();
    // Observe actual playing state before cancelling an older pending command;
    // that cancellation itself pauses native playback and must not flip toggle.
    if (!media.paused && !media.ended) this.active = true;
    const shouldPlay = action.type === 'play' || action.type === 'playFrom' || action.type === 'resume'
      || action.type === 'togglePause' && (!this.active || media.paused || media.ended);
    this.pending?.();
    const generation = ++this.generation;
    let cancelled = false, settled = false;
    const cancel = () => {
      if (cancelled || generation !== this.generation) return;
      cancelled = true;
      media.pause();
      if (this.pending === cancel) this.pending = null;
    };
    this.pending = cancel;
    const current = () => !this.disposed && !cancelled && generation === this.generation && this.isCurrent();
    try {
      if (!shouldPlay) {
        media.pause();
        if (action.type === 'stop') this.active = false;
      } else {
        if (action.type === 'playFrom') media.currentTime = action.timeSec;
        else if (!this.active || media.ended || media.currentTime >= range.endSec || media.currentTime < range.startSec) media.currentTime = range.startSec;
        this.active = true;
      }
      const accepted = shouldPlay ? media.play() : Promise.resolve();
      const finished = accepted.then(() => {
        if (!current()) { if (generation === this.generation) media.pause(); return fail(); }
        settled = true;
        if (this.pending === cancel) this.pending = null;
      }, () => {
        if (generation === this.generation) media.pause();
        return fail();
      });
      // Cancellation can arrive after command acceptance while the sound is
      // still playing. Keep the returned cancel handle effective for that run.
      return { finished, cancel() { if (!settled || shouldPlay) cancel(); } };
    } catch (error) { cancel(); throw error; }
  }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.pending?.(); this.media.pause(); this.generation++;
  }
  // A newer teacher epoch now owns the same native element. Invalidate old
  // promises/handles without pausing the newer playback.
  relinquish() { this.generation++; this.pending = null; this.active = true; }
}
