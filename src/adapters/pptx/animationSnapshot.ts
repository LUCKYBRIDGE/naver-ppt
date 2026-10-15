import { isPptxAnimationPose, validPptxAnimationScope as validScope, type PptxAnimationScope, type PptxAnimationPose } from '../../core/animationPose';
export { isPptxAnimationPose, type PptxAnimationScope, type PptxAnimationPose } from '../../core/animationPose';
type PoseRoot = Pick<HTMLElement, 'querySelector'>;
function findTarget(root: PoseRoot, id: number) {
  const element = root.querySelector(`[data-el="${id}"]`) as HTMLElement | SVGElement | null;
  if (!element) throw new Error('PPTX_POSE_TARGET_MISSING');
  return element;
}
export function capturePptxAnimationPose(root: PoseRoot, scope: PptxAnimationScope, targets: readonly number[]): PptxAnimationPose {
  if (!validScope(scope) || targets.length > 5000 || targets.some(id => !Number.isSafeInteger(id) || id <= 0 || id > 4294967295)) throw new Error('PPTX_INVALID_ANIMATION_POSE');
  const entries = [...new Set(targets)].map(target => {
    const style = getComputedStyle(findTarget(root, target));
    return { target, opacity: Number(style.opacity), transform: style.transform, clipPath: style.clipPath, visible: style.visibility === 'visible' };
  });
  const pose = { version: 1 as const, scope: { ...scope }, entries };
  if (!isPptxAnimationPose(pose)) throw new Error('PPTX_INVALID_ANIMATION_POSE');
  return pose;
}
export function applyPptxAnimationPose(root: PoseRoot, value: unknown, scope: PptxAnimationScope) {
  if (!isPptxAnimationPose(value) || !validScope(scope) || !(['sessionId', 'documentId', 'slideId', 'revision'] as const).every(key => value.scope[key] === scope[key])) throw new Error('PPTX_INVALID_ANIMATION_POSE');
  // Resolve every target before applying any style, so a missing target is atomic.
  const elements = value.entries.map(entry => findTarget(root, entry.target));
  value.entries.forEach((entry, index) => {
    const style = elements[index]!.style;
    style.opacity = String(entry.opacity); style.transform = entry.transform; style.clipPath = entry.clipPath; style.visibility = entry.visible ? 'visible' : 'hidden';
  });
}
