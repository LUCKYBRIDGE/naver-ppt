import { useEffect, useRef, useState } from 'react';
import type { PresentationDocumentState } from '../core/types';
import type { loadPptxSourceModel } from '../adapters/pptx/sourceModel';
import { pptxSourceVault } from '../adapters/pptx/source';
import { sourceKey } from '../storage/sourceVault';

// One selected document lease survives the page-scoped overlay editor's remounts.
// No cache after document/window release, no fingerprint-only sharing.
export function usePptxDocumentSource(sessionId: string | undefined, document: PresentationDocumentState | undefined) {
  const fingerprint = document?.source.type === 'pptx' ? document.source.fingerprint : undefined;
  const documentId = document?.source.type === 'pptx' ? document.id : undefined;
  const scope = sessionId && documentId && fingerprint ? JSON.stringify([sessionId, documentId, fingerprint, document?.slideIds]) : '';
  const [readyScope, setReadyScope] = useState(''), [failedScope, setFailedScope] = useState(''), [sourceRevision, setSourceRevision] = useState(0);
  const heldScope = useRef('');
  const heldFile = useRef<File | undefined>(undefined);
  useEffect(() => {
    if (!scope || !sessionId || !documentId || !fingerprint) return;
    const controller = new AbortController(), key = sourceKey(sessionId, documentId);
    let lease: Awaited<ReturnType<typeof loadPptxSourceModel>> | undefined;
    setReadyScope(''); setFailedScope('');
    const unsubscribe = pptxSourceVault().subscribe(available => { if (available === key && !lease) setSourceRevision(value => value + 1); });
    void (async () => {
      try {
        const source = await pptxSourceVault().get(key, fingerprint, controller.signal);
        if (controller.signal.aborted) return;
        const { loadPptxSourceModel } = await import('../adapters/pptx/sourceModel');
        if (controller.signal.aborted) return;
        lease = await loadPptxSourceModel(source.file, controller.signal);
        if (controller.signal.aborted) { lease.dispose(); lease = undefined; return; }
        heldScope.current = scope; heldFile.current = source.file; setReadyScope(scope);
      } catch { if (!controller.signal.aborted) setFailedScope(scope); }
    })();
    return () => { unsubscribe(); controller.abort(); heldScope.current = ''; heldFile.current = undefined; lease?.dispose(); };
  }, [scope, sessionId, documentId, fingerprint, sourceRevision]);
  const ready = !!scope && readyScope === scope && heldScope.current === scope;
  return { ready, file: ready ? heldFile.current : undefined, failed: !!scope && failedScope === scope };
}
