import type { PlayerSnapshot } from '../../core/playerSnapshot';
import type { SessionCommand } from '../../core/commands';
import { validPptxAnimationScope } from '../../core/animationPose';
import { isPptxCompletedCheckpoint, restoredPptxCheckpointPose, type PptxCompletedCheckpoint, type PptxCheckpointRenderer } from '../../core/pptxPlayback';
import { capturePptxAnimationPose, applyPptxAnimationPose } from './animationSnapshot';
import { PptxAnimationRuns, type PptxAnimationPlayback } from './animationRun';

export interface PptxCheckpointDriver {
  renderer?: PptxCheckpointRenderer;
  totalGroups: number;
  targets: readonly number[];
  restore(completedGroups: number): void;
  next(): { start(): PptxAnimationPlayback; complete(): void };
}
export interface PptxCheckpointTransport {
  snapshot(): PlayerSnapshot;
  send(command: SessionCommand): Promise<{ ok: true; snapshot: PlayerSnapshot } | { ok: false; code?: string }>;
  newId(): string;
}
type Root = Pick<HTMLElement, 'querySelector' | 'getAnimations'>;
const fail = (): never => { throw Error('PPTX_CHECKPOINT_FAILED'); };
export function validatePptxCheckpointModel(checkpoint: unknown, totalGroups: number, targets: readonly number[]): asserts checkpoint is PptxCompletedCheckpoint | null {
  const ids = [...new Set(targets)];
  if (!Number.isSafeInteger(totalGroups) || totalGroups < 0 || totalGroups > 5000 || ids.length > 5000
    || ids.some(id => !Number.isSafeInteger(id) || id <= 0 || id > 4294967295)) return fail();
  if (checkpoint === null) return;
  if (!isPptxCompletedCheckpoint(checkpoint) || checkpoint.completedGroups > totalGroups || checkpoint.pose.entries.length !== ids.length
    || checkpoint.pose.entries.some(entry => !ids.includes(entry.target))) return fail();
}
export class PptxDurablePlayback {
  private readonly runs: PptxAnimationRuns;
  private active: { cancelled: Promise<'superseded'>; cancel(): void } | null = null;
  constructor(private readonly root: Root, private readonly driver: PptxCheckpointDriver, private readonly transport: PptxCheckpointTransport,
    private readonly identity: { sessionId: string; documentId: string; slideId: string; fingerprint: string }) { this.runs = new PptxAnimationRuns(root); }
  get isBusy() { return this.active !== null; }
  invalidate() { const previous = this.active; this.active = null; previous?.cancel(); this.runs.invalidate(); }
  private checked(snapshot: PlayerSnapshot) {
    if (!/^[a-f0-9]{64}$/.test(this.identity.fingerprint) || !validPptxAnimationScope({ sessionId: snapshot.sessionId, documentId: this.identity.documentId, slideId: this.identity.slideId, revision: snapshot.revision })) return fail();
    if (snapshot.sessionId !== this.identity.sessionId || snapshot.selection?.documentId !== this.identity.documentId || snapshot.selection.slideId !== this.identity.slideId
      || snapshot.sourceFingerprint !== this.identity.fingerprint || !snapshot.pptx) return fail();
    const checkpoint = snapshot.pptx.checkpoint;
    validatePptxCheckpointModel(checkpoint, this.driver.totalGroups, this.driver.targets);
    if (checkpoint && checkpoint.renderer !== (this.driver.renderer ?? 'web-ppt-0.4.5/transform-v1')) return fail();
    const scope = { ...this.identity, revision: snapshot.revision };
    const pose = checkpoint ? restoredPptxCheckpointPose(checkpoint, this.identity.fingerprint, { sessionId: scope.sessionId, documentId: scope.documentId, slideId: scope.slideId, revision: scope.revision }) : null;
    return { checkpoint, pose, scope: { sessionId: scope.sessionId, documentId: scope.documentId, slideId: scope.slideId, revision: scope.revision } };
  }
  restore(snapshot = this.transport.snapshot()) {
    if (this.isBusy) return fail();
    const checked = this.checked(snapshot);
    this.runs.invalidate(); this.driver.restore(checked.checkpoint?.completedGroups ?? 0);
    if (checked.pose) applyPptxAnimationPose(this.root, checked.pose, checked.scope);
  }
  async play(requestId?: string): Promise<'completed' | 'superseded' | 'busy' | 'exhausted'> {
    if (this.active) return 'busy';
    const snapshot = this.transport.snapshot(), initial = this.checked(snapshot);
    if (requestId !== undefined ? !requestId || snapshot.pptx?.request?.commandId !== requestId || snapshot.pptx.request.slideId !== this.identity.slideId
      : snapshot.pptx?.request != null) return fail();
    if ((initial.checkpoint?.completedGroups ?? 0) >= this.driver.totalGroups) return 'exhausted';
    let cancel!: () => void, cancelNative = () => {};
    const token = { cancelled: new Promise<'superseded'>(resolve => { cancel = () => resolve('superseded'); }), cancel: () => { cancel(); cancelNative(); } };
    this.active = token;
    try {
      const epoch = this.transport.newId();
      const command: SessionCommand = requestId === undefined
        ? { type: 'BEGIN_PPTX_GROUP', ...initial.scope, commandId: epoch }
        : { type: 'BEGIN_REQUESTED_PPTX_GROUP', ...initial.scope, commandId: epoch, requestId };
      const begin = await Promise.race([this.transport.send(command), token.cancelled]);
      if (this.active !== token || begin === 'superseded') return 'superseded';
      if (!begin.ok) return fail();
      const observed = this.transport.snapshot(), beginSnapshot = observed.revision > begin.snapshot.revision ? observed : begin.snapshot;
      const started = this.checked(beginSnapshot);
      if (beginSnapshot.pptx?.run?.epoch !== epoch || beginSnapshot.pptx.run.slideId !== this.identity.slideId) return fail();
      this.runs.invalidate(); this.driver.restore(started.checkpoint?.completedGroups ?? 0);
      if (started.pose) applyPptxAnimationPose(this.root, started.pose, started.scope);
      if ((started.checkpoint?.completedGroups ?? 0) >= this.driver.totalGroups) return fail();
      const group = this.driver.next();
      const outcome = await this.runs.play(() => {
        const playback = group.start(); let cancelled = false;
        // A media call can finish accepting its command while sound continues.
        // Keep cancellation alive through the durable ACK, not only animation.
        cancelNative = () => { if (cancelled) return; cancelled = true; try { playback.cancel(); } catch { /* Owned WAAPI cleanup still runs. */ } };
        if (this.active !== token) cancelNative();
        return { finished: playback.finished, cancel: cancelNative };
      }, () => group.complete());
      if (this.active !== token || outcome !== 'completed') return 'superseded';
      const current = this.transport.snapshot(), checked = this.checked(current);
      if (current.pptx?.run?.epoch !== epoch || (checked.checkpoint?.completedGroups ?? 0) !== (started.checkpoint?.completedGroups ?? 0)) return fail();
      const checkpoint: PptxCompletedCheckpoint = { renderer: this.driver.renderer ?? 'web-ppt-0.4.5/transform-v1', fingerprint: this.identity.fingerprint,
        completedGroups: (started.checkpoint?.completedGroups ?? 0) + 1, pose: capturePptxAnimationPose(this.root, checked.scope, this.driver.targets) };
      const ack = await Promise.race([this.transport.send({ type: 'CHECKPOINT_PPTX_GROUP', ...checked.scope, commandId: this.transport.newId(), epoch, checkpoint }), token.cancelled]);
      if (this.active !== token || ack === 'superseded') return 'superseded';
      if (!ack.ok) return fail();
      const committed = this.checked(ack.snapshot);
      const saved = committed.checkpoint;
      if (ack.snapshot.pptx?.run !== null || !saved || saved.completedGroups !== checkpoint.completedGroups || saved.fingerprint !== checkpoint.fingerprint
        || saved.pose.scope.revision !== checkpoint.pose.scope.revision || saved.pose.entries.some(entry => {
          const expected = checkpoint.pose.entries.find(item => item.target === entry.target);
          return !expected || (['opacity', 'transform', 'clipPath', 'visible'] as const).some(key => entry[key] !== expected[key]);
        })) return fail();
      const latest = this.transport.snapshot(), finalSnapshot = latest.revision > ack.snapshot.revision ? latest : ack.snapshot;
      this.checked(finalSnapshot);
      this.active = null; this.restore(finalSnapshot); return 'completed';
    } catch {
      if (this.active !== token) return 'superseded';
      this.active = null; cancelNative(); this.runs.invalidate();
      // A lost response may already have published a durable checkpoint; prefer it.
      try { this.restore(); } catch { /* A new selection must not receive the old pose. */ }
      return fail();
    } finally { if (this.active === token) this.active = null; }
  }
}
