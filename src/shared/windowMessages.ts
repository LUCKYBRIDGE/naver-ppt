export const windowRoles = ['player', 'remote', 'editor'] as const;
export type WindowRole = (typeof windowRoles)[number];

export interface OpenWindowRequest {
  type: 'OPEN_WINDOW';
  role: WindowRole;
}

export type OpenWindowResult =
  | { ok: true; windowId: number }
  | { ok: false; error: string };

export function isOpenWindowRequest(value: unknown): value is OpenWindowRequest {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    candidate.type === 'OPEN_WINDOW' &&
    typeof candidate.role === 'string' &&
    windowRoles.some((role) => role === candidate.role)
  );
}
