export interface PptxAnimationScope { sessionId: string; documentId: string; slideId: string; revision: number }
export interface PptxAnimationPose {
  version: 1;
  scope: PptxAnimationScope;
  entries: { target: number; opacity: number; transform: string; clipPath: string; visible: boolean }[];
}
const numberToken = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
function safeTransform(value: unknown): value is string {
  if (value === 'none') return true;
  if (typeof value !== 'string' || value.length > 512) return false;
  const matrix = /^matrix(3d)?\(([^)]+)\)$/.exec(value);
  if (!matrix) return false;
  const numbers = matrix[2]!.split(',').map(token => token.trim());
  return numbers.length === (matrix[1] ? 16 : 6) && numbers.every(token => numberToken.test(token) && Number.isFinite(Number(token)) && Math.abs(Number(token)) <= 1000000);
}
function safeClip(value: unknown): value is string {
  if (value === 'none') return true;
  if (typeof value !== 'string' || value.length > 200) return false;
  const inset = /^inset\(([^)]+)\)$/.exec(value);
  if (!inset) return false;
  const tokens = inset[1]!.trim().split(/\s+/);
  return tokens.length >= 1 && tokens.length <= 4 && tokens.every(token => /^(?:\d+\.?\d*|\.\d+)(?:px|%)$/.test(token) && parseFloat(token) <= 1000000);
}
export function validPptxAnimationScope(value: unknown): value is PptxAnimationScope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const scope = value as Record<string, unknown>;
  return Object.keys(scope).length === 4 && ['sessionId', 'documentId', 'slideId', 'revision'].every(key => Object.hasOwn(scope, key)) && ['sessionId', 'documentId', 'slideId'].every(key => typeof scope[key] === 'string' && !!scope[key].trim() && scope[key].length <= 200)
    && Number.isSafeInteger(scope.revision) && (scope.revision as number) >= 0;
}
export function isPptxAnimationPose(value: unknown): value is PptxAnimationPose {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const pose = value as PptxAnimationPose;
  if (Object.keys(pose).length !== 3 || !['version', 'scope', 'entries'].every(key => Object.hasOwn(pose, key)) || pose.version !== 1 || !validPptxAnimationScope(pose.scope) || !Array.isArray(pose.entries) || pose.entries.length > 5000) return false;
  const targets = new Set<number>();
  for (const entry of pose.entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || Object.keys(entry).length !== 5 || !['target', 'opacity', 'transform', 'clipPath', 'visible'].every(key => Object.hasOwn(entry, key)) || !Number.isSafeInteger(entry.target) || entry.target <= 0 || entry.target > 4294967295 || targets.has(entry.target)
      || !Number.isFinite(entry.opacity) || typeof entry.opacity !== 'number' || entry.opacity < 0 || entry.opacity > 1 || typeof entry.visible !== 'boolean' || !safeTransform(entry.transform) || !safeClip(entry.clipPath)) return false;
    targets.add(entry.target);
  }
  return true;
}
