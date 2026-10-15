import type { PlayerSnapshot } from '../core/playerSnapshot';

export type PptxEffectStatus = 'loading' | 'ready' | 'held' | 'running' | 'completed' | 'cancelled' | 'failed' | 'exhausted';
type Runtime = { busy: boolean; play(id?: string): Promise<'completed' | 'superseded' | 'busy' | 'exhausted'>; cancel(): void };

// One owner/view lifetime. Requests present at creation are never replayed implicitly.
export class PptxRequests {
  private readonly blocked: string | undefined;
  private attempted: string | undefined;
  private active: { completed: number; runtime: Runtime } | null = null;
  private disposed = false;
  private unresolved = false;
  constructor(initial: PlayerSnapshot, private readonly report: (status: PptxEffectStatus) => void) {
    this.blocked = initial.pptx?.request?.commandId;
    this.unresolved = !!(initial.pptx?.request || initial.pptx?.run);
  }
  update(snapshot: PlayerSnapshot, runtime: Runtime | null) {
    if (this.disposed) return;
    const request = snapshot.pptx?.request?.commandId;
    const cleared = this.unresolved && !request && !snapshot.pptx?.run;
    this.unresolved = !!(request || snapshot.pptx?.run);
    if (this.active && !snapshot.pptx?.run && !request
      && (snapshot.pptx?.checkpoint?.completedGroups ?? 0) <= this.active.completed) {
      const active = this.active; this.active = null; active.runtime.cancel(); this.report('cancelled');
    }
    else if (cleared && !this.active) this.report('cancelled');
    if (!runtime || this.active || runtime.busy) return;
    if (request === this.blocked && request) { this.report('held'); return; }
    if (request && request !== this.attempted) {
      this.attempted = request;
      this.start(runtime, snapshot, request);
    }
  }
  local(snapshot: PlayerSnapshot, runtime: Runtime | null) {
    if (!runtime || this.active || runtime.busy || snapshot.pptx?.request || snapshot.pptx?.run || this.disposed) return;
    this.start(runtime, snapshot);
  }
  private start(runtime: Runtime, snapshot: PlayerSnapshot, id?: string) {
    const active = { completed: snapshot.pptx?.checkpoint?.completedGroups ?? 0, runtime };
    this.active = active; this.report('running');
    void runtime.play(id).then(result => {
      if (this.active !== active || this.disposed) return;
      this.active = null;
      this.report(result === 'superseded' ? 'cancelled' : result === 'busy' ? 'failed' : result);
    }).catch(() => {
      if (this.active !== active || this.disposed) return;
      this.active = null; this.report('failed');
    });
  }
  dispose() { this.disposed = true; this.active = null; }
}
