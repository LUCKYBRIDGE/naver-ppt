export type PptxMediaAction = { type: 'play' | 'pause' | 'resume' | 'stop' | 'togglePause' } | { type: 'playFrom'; timeSec: number };

// Source commands are vocabulary, never executable code. PowerPoint defaults
// an omitted cmd type to call; an explicit unknown/evt/verb type stays unsupported.
export function parsePptxMediaAction(type: string | null, command: string | null): PptxMediaAction | null {
  if (type !== null && type !== 'call' || command === null || command.length > 64) return null;
  if (command === 'play' || command === 'pause' || command === 'resume' || command === 'stop' || command === 'togglePause') return { type: command };
  const match = /^playFrom\((\d+(?:\.\d+)?)\)$/.exec(command);
  return match && Number.isFinite(Number(match[1])) && Number(match[1]) <= 86400 ? { type: 'playFrom', timeSec: Number(match[1]) } : null;
}

export function isPptxMediaAction(value: unknown): value is PptxMediaAction {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const action = value as Record<string, unknown>;
  if (!Object.hasOwn(action, 'type')) return false;
  if (action.type === 'playFrom') return Object.keys(action).length === 2 && Object.hasOwn(action, 'timeSec') && typeof action.timeSec === 'number'
    && Number.isFinite(action.timeSec) && action.timeSec >= 0 && action.timeSec <= 86400;
  return Object.keys(action).length === 1 && ['play', 'pause', 'resume', 'stop', 'togglePause'].includes(action.type as string);
}
