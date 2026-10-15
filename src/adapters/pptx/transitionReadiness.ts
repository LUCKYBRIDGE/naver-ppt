import type { ClassSession, PresentationDocumentState } from '../../core/types';
import { toPlayerSnapshot } from '../../core/playerSnapshot';
import { openPptxRuntime } from './runtime';

// A detached validation surface only; it never plays effects/media or writes state.
export async function inspectPptxTransition(file: File, session: ClassSession, registered: PresentationDocumentState, slideId: string, signal: AbortSignal) {
  const documentState = { ...registered, closed: false };
  const snapshot = toPlayerSnapshot({ ...session, documents: { ...session.documents, [registered.id]: documentState }, presentedSelection: { documentId: registered.id, slideId } });
  if (snapshot.pptx) snapshot.pptx = { ...snapshot.pptx, run: null, request: null };
  let runtime: Awaited<ReturnType<typeof openPptxRuntime>> | undefined;
  const root = document.createElement('div');
  try {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    runtime = await openPptxRuntime({ file, document: documentState, sessionId: session.id, slideId, signal, root,
      transport: { snapshot: () => snapshot, async send() { throw Error('PPTX_TRANSITION_MUST_NOT_WRITE'); }, newId: () => crypto.randomUUID() },
      startMedia() { throw Error('PPTX_TRANSITION_MUST_NOT_PLAY'); },
    });
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (runtime.sourceMediaUnavailable) throw Error('PPTX_TRANSITION_MEDIA_UNAVAILABLE');
  } finally { runtime?.dispose(); root.replaceChildren(); }
}
