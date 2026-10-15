import { isPptxAnimationPose, validPptxAnimationScope, type PptxAnimationPose, type PptxAnimationScope } from './animationPose';
export type PptxCheckpointRenderer = 'web-ppt-0.4.5/transform-v1' | 'web-ppt-0.4.5/source-v1';
export interface PptxCompletedCheckpoint { renderer: PptxCheckpointRenderer; fingerprint: string; completedGroups: number; pose: PptxAnimationPose }
export interface PptxPlaybackState {
  checkpoints: Record<string, PptxCompletedCheckpoint>;
  run: { epoch: string; slideId: string } | null;
  request?: { commandId: string; slideId: string } | null;
}
export function isPptxCompletedCheckpoint(value: unknown): value is PptxCompletedCheckpoint {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const v = value as PptxCompletedCheckpoint;
  return Object.keys(v).length === 4 && ['renderer', 'fingerprint', 'completedGroups', 'pose'].every(key => Object.hasOwn(v, key)) && (v.renderer === 'web-ppt-0.4.5/transform-v1' || v.renderer === 'web-ppt-0.4.5/source-v1')
    && typeof v.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(v.fingerprint)
    && Number.isSafeInteger(v.completedGroups) && v.completedGroups >= 1 && v.completedGroups <= 5000 && isPptxAnimationPose(v.pose);
}
export function restoredPptxCheckpointPose(value: unknown, fingerprint: string, scope: PptxAnimationScope): PptxAnimationPose {
  if (!isPptxCompletedCheckpoint(value) || !validPptxAnimationScope(scope) || value.fingerprint !== fingerprint
    || value.pose.scope.sessionId !== scope.sessionId || value.pose.scope.documentId !== scope.documentId || value.pose.scope.slideId !== scope.slideId
    || value.pose.scope.revision > scope.revision) throw Error('PPTX_CHECKPOINT_MISMATCH');
  const pose = structuredClone(value.pose); pose.scope = { ...scope }; return pose;
}
