import type { ClassSession, Selection } from './types';
export interface PresentationTransition {
  requestId: string; playerId: string; documentId: string; slideId: string; fingerprint: string;
  from: Selection | null; closed: boolean; checkpoint: [string, number, number] | null;
}
export function transitionCheckpoint(session: ClassSession, documentId: string, slideId: string): PresentationTransition['checkpoint'] {
  const value = session.documents[documentId]?.pptxPlayback?.checkpoints[slideId];
  return value ? [value.renderer, value.completedGroups, value.pose.scope.revision] : null;
}
export function isPresentationTransition(value: unknown): value is PresentationTransition {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  const v = value as Record<string, unknown>, fields = ['requestId', 'playerId', 'documentId', 'slideId', 'fingerprint', 'from', 'closed', 'checkpoint'];
  const id = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
  if (Object.keys(v).length !== fields.length || !fields.every(key => Object.hasOwn(v, key)) || ![v.requestId, v.playerId, v.documentId, v.slideId].every(id)
    || typeof v.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(v.fingerprint) || typeof v.closed !== 'boolean') return false;
  if (v.from !== null) {
    if (!v.from || typeof v.from !== 'object' || Array.isArray(v.from) || ![Object.prototype, null].includes(Object.getPrototypeOf(v.from))) return false;
    const from = v.from as Record<string, unknown>;
    if (Object.keys(from).length !== 2 || !Object.hasOwn(from, 'documentId') || !Object.hasOwn(from, 'slideId') || !id(from.documentId) || from.slideId !== null && !id(from.slideId)) return false;
  }
  return v.checkpoint === null || Array.isArray(v.checkpoint) && v.checkpoint.length === 3
    && ['web-ppt-0.4.5/transform-v1', 'web-ppt-0.4.5/source-v1'].includes(v.checkpoint[0])
    && Number.isSafeInteger(v.checkpoint[1]) && v.checkpoint[1] >= 1 && v.checkpoint[1] <= 5000 && Number.isSafeInteger(v.checkpoint[2]) && v.checkpoint[2] >= 0;
}
export function currentPresentationTransition(session: ClassSession, value: PresentationTransition): boolean {
  const doc = session.documents[value.documentId], from = session.presentedSelection;
  return isPresentationTransition(value) && !!doc && doc.source.type === 'pptx' && doc.source.fingerprint === value.fingerprint
    && doc.slideIds.includes(value.slideId) && !!doc.closed === value.closed
    && from?.documentId === value.from?.documentId && from?.slideId === value.from?.slideId
    && JSON.stringify(transitionCheckpoint(session, value.documentId, value.slideId)) === JSON.stringify(value.checkpoint);
}
