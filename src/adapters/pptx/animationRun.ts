export interface PptxAnimationPlayback {
  finished: Promise<void>;
  cancel(): void;
}

export type PptxAnimationOutcome = 'completed' | 'superseded' | 'busy';

interface Run {
  playback?: PptxAnimationPlayback;
  supersede(): void;
}

export class PptxAnimationRuns {
  private active: Run | null = null;
  private owned = new Set<Animation>();

  constructor(private readonly root: Pick<HTMLElement, 'getAnimations'>) {}

  get isPlaying() { return this.active !== null; }

  invalidate() {
    const previous = this.active;
    this.active = null;
    previous?.supersede();
    // Some engines finish on cancel; cancel the owned native effects as well.
    try { previous?.playback?.cancel(); } catch { /* Native cleanup still runs. */ }
    for (const animation of this.owned) {
      try { animation.cancel(); } catch { /* A detached target may already be gone. */ }
    }
    this.owned.clear();
  }

  async play(start: () => PptxAnimationPlayback, commit: () => void): Promise<PptxAnimationOutcome> {
    if (this.active) return 'busy';
    const existing = new Set(this.root.getAnimations({ subtree: true }));
    let supersede!: () => void;
    const cancelled = new Promise<'superseded'>(resolve => { supersede = () => resolve('superseded'); });
    const run: Run = { supersede };
    this.active = run;
    const created = new Set<Animation>();
    let captured = false;
    const capture = () => {
      for (const animation of this.root.getAnimations({ subtree: true })) {
        if (!existing.has(animation) && !this.owned.has(animation)) { this.owned.add(animation); created.add(animation); }
      }
      captured = true;
    };
    try {
      run.playback = start();
      capture();
      if (this.active !== run) {
        void run.playback.finished.catch(() => {});
        try { run.playback.cancel(); } catch { /* Release native effects below. */ }
        for (const animation of created) { try { animation.cancel(); } catch { /* Detached. */ } this.owned.delete(animation); }
        return 'superseded';
      }
      const outcome = await Promise.race([
        run.playback.finished.then(() => 'completed' as const, () => 'failed' as const),
        cancelled,
      ]);
      if (this.active !== run || outcome === 'superseded') return 'superseded';
      if (outcome === 'failed') throw new Error('PPTX_ANIMATION_FAILED');
      this.active = null;
      commit();
      return 'completed';
    } catch {
      if (!captured) capture();
      if (this.active === run) this.active = null;
      run.supersede();
      try { run.playback?.cancel(); } catch { /* Native cleanup still runs. */ }
      for (const animation of created) {
        try { animation.cancel(); } catch { /* Already detached. */ }
        this.owned.delete(animation);
      }
      throw new Error('PPTX_ANIMATION_FAILED');
    }
  }
}
