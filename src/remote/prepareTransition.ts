import type { SessionCommand } from '../core/commands';
import type { ClassSession, PresentationDocumentState } from '../core/types';

export function pptxTransitionTarget(session: ClassSession, command: SessionCommand) {
  if (!['ACTIVATE_DOCUMENT', 'REOPEN_DOCUMENT', 'GOTO_SLIDE'].includes(command.type)) return null;
  const document = command.documentId ? session.documents[command.documentId] : undefined;
  if (!document || document.source.type !== 'pptx' || command.sessionId !== session.id) return null;
  const slideId = command.slideId ?? document.lastSlideId ?? document.slideIds[0] ?? null;
  if (!slideId || !document.slideIds.includes(slideId)) throw Error('PPTX_TRANSITION_TARGET_CHANGED');
  return { document, slideId };
}
export async function preparePresentationCommand(session: ClassSession, command: SessionCommand, signal: AbortSignal, dependencies: {
  inspect(document: PresentationDocumentState, slideId: string, signal: AbortSignal): Promise<void>;
  read(): Promise<ClassSession>;
}): Promise<SessionCommand> {
  const abort = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  abort(); const target = pptxTransitionTarget(session, command); if (!target) return command;
  await dependencies.inspect(target.document, target.slideId, signal); abort();
  const latest = await dependencies.read(); abort();
  const next = pptxTransitionTarget(latest, command);
  const sameSelection = latest.presentedSelection?.documentId === session.presentedSelection?.documentId && latest.presentedSelection?.slideId === session.presentedSelection?.slideId;
  if (latest.id !== session.id || !sameSelection || !next || next.document.id !== target.document.id || next.slideId !== target.slideId
    || next.document.source.type !== 'pptx' || target.document.source.type !== 'pptx'
    || next.document.source.fingerprint !== target.document.source.fingerprint || next.document.closed !== target.document.closed
    || JSON.stringify(next.document.slideIds) !== JSON.stringify(target.document.slideIds)
    || JSON.stringify(next.document.pptxPlayback?.checkpoints[target.slideId] ?? null) !== JSON.stringify(target.document.pptxPlayback?.checkpoints[target.slideId] ?? null)) throw Error('PPTX_TRANSITION_TARGET_CHANGED');
  return { ...command, revision: latest.revision };
}
