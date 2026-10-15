import { useEffect, useState, type ReactNode } from 'react';
import { sendSessionRequest, useSessionState } from '../shared/sessionClient';
import type { SessionCommand } from '../core/commands';
import { DocumentImportControls } from './DocumentImportControls';
import { WebLinkControls } from './WebLinkControls';
import { OverlayEditor } from './OverlayEditor';
import type { Selection } from '../core/types';
import { SessionSaveControls } from './SessionSaveControls';
import { PdfExportControls } from './PdfExportControls';
import { LocalMediaControls } from './LocalMediaControls';
import { PreflightControls } from './PreflightControls';
import { PptxInspectionControls } from './PptxInspectionControls';
import { PptxPrivatePreviewControls } from './PptxPrivatePreviewControls';
import { RegisteredPptxPreview } from './RegisteredPptxPreview';
import { PptxMediaControls } from './PptxMediaControls';
import { usePptxDocumentSource } from './usePptxDocumentSource';

export function Editor() {
  const { snapshot, connected, error, setError } = useSessionState('teacher');
  const session = snapshot?.kind === 'teacher' ? snapshot.session : null;
  const [heldSelection, setHeldSelection] = useState<Selection | null>(null);
  const [overlayDirty, setOverlayDirty] = useState(false);
  const [dirty, setDirty] = useState(false);
  const selected = dirty || overlayDirty ? heldSelection ?? session?.editorSelection : session?.editorSelection;
  const document = selected && session ? session.documents[selected.documentId] : undefined;
  const pptxSource = usePptxDocumentSource(session?.id, document);
  const storedNote = selected?.slideId ? document?.slideDeltas[selected.slideId]?.presenterNote ?? '' : '';
  const [note, setNote] = useState('');
  const [commandBusy, setBusy] = useState(false), [exportBusy, setExportBusy] = useState(false), [mediaBusy, setMediaBusy] = useState(false);
  const busy = commandBusy || exportBusy || mediaBusy;
  const [notice, setNotice] = useState('');
  useEffect(() => { if (!dirty) setNote(storedNote); }, [selected?.documentId, selected?.slideId, storedNote, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function execute(command: SessionCommand) {
    setBusy(true); setNotice('');
    try {
      const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command });
      if (result.ok && command.type === 'SET_PRESENTER_NOTE') setDirty(false);
      setError(result.ok ? '' : result.error);
      return result.ok;
    } catch (failure) { setError(failure instanceof Error ? failure.message : '편집 내용을 저장하지 못했습니다.'); return false; }
    finally { setBusy(false); }
  }
  function select(documentId: string, slideId: string) {
    if (!session || !slideId) return;
    void execute({ sessionId: session.id, revision: session.revision, commandId: crypto.randomUUID(),
      type: 'SELECT_EDITOR_SLIDE', documentId, slideId });
  }
  return (
    <main data-session-revision={session?.revision}>
      <p className="eyebrow">비공개 편집</p>
      <h1>{session?.title ?? '수업'}</h1>
      {document?.closed && <p role="status">발표를 종료한 자료입니다. 편집 내용은 유지됩니다.</p>}
      {session && <DocumentImportControls session={session} disabled={!connected || busy || dirty || overlayDirty} onStatus={setNotice} />}
      {session && <WebLinkControls session={session} disabled={!connected || busy || dirty || overlayDirty} onStatus={setNotice} />}
      {session && <PptxInspectionControls sessionId={session.id} disabled={!connected || busy || dirty || overlayDirty} />}
      {session && <PptxPrivatePreviewControls sessionId={session.id} disabled={!connected || busy || dirty || overlayDirty} />}
      <label htmlFor="editor-document">자료</label>
      <select id="editor-document" value={selected?.documentId ?? ''} disabled={!connected || busy || dirty || overlayDirty} onChange={event => {
        const doc = session?.documents[event.target.value]; if (doc?.slideIds[0]) select(doc.id, doc.slideIds[0]);
      }}>
        <option value="">자료 선택</option>
        {session?.documentOrder.map(id => { const source = session.documents[id]?.source; const label = source && 'name' in source ? source.name : source && 'title' in source ? source.title : id; return <option key={id} value={id}>{label}</option>; })}
      </select>
      {document && (document.source.type === 'canva' || document.source.type === 'miricanvas') && <p>
        <a href={document.source.url} target="_blank" rel="noreferrer" aria-label={`${document.source.title} 외부 자료 열기`}>외부 자료 열기</a>
      </p>}
      <label htmlFor="editor-slide">페이지</label>
      <select id="editor-slide" value={selected?.slideId ?? ''} disabled={!connected || busy || dirty || overlayDirty || !document} onChange={event => { if (document) select(document.id, event.target.value); }}>
        <option value="">페이지 선택</option>
        {document?.slideIds.map((id, i) => <option key={id} value={id}>{i + 1}페이지</option>)}
      </select>
      {document?.source.type === 'pptx' && !pptxSource.ready && <p role="status">{pptxSource.failed ? 'PPTX 미리보기를 준비하지 못했습니다. 같은 원본을 다시 연결하세요.' : 'PPTX 자료를 준비하고 있습니다.'}</p>}
      {session && document && (document.source.type === 'pdf' || document.source.type === 'pptx' && pptxSource.ready) && selected?.slideId && <OverlayEditor key={`${document.id}:${selected.slideId}`} sessionId={session.id} documentId={document.id}
        slideId={selected.slideId} pageNumber={document.slideIds.indexOf(selected.slideId) + 1}
        fingerprint={document.source.type === 'pdf' || document.source.type === 'pptx' ? document.source.fingerprint ?? null : null}
        {...(document.source.type === 'pptx' ? { sourceView: (children: (canvas: HTMLCanvasElement) => ReactNode) => <RegisteredPptxPreview sessionId={session.id} document={document} slideId={selected.slideId!} {...(pptxSource.file ? { file: pptxSource.file } : {})}>{children}</RegisteredPptxPreview> } : {})}
        saved={document.slideDeltas[selected.slideId]?.overlays ?? []} disabled={!connected || busy || dirty}
        onDirty={value => { if (value) setHeldSelection(selected); setOverlayDirty(value); }}
        onCommit={overlays => execute({ type: 'SET_SLIDE_OVERLAYS', sessionId: session.id, documentId: document.id,
          slideId: selected.slideId!, revision: session.revision, commandId: crypto.randomUUID(), overlays })} />}
      {session && selected?.slideId && <LocalMediaControls session={session} selected={selected} disabled={!connected || busy || dirty || overlayDirty} onStatus={setNotice} />}
      {session && selected?.slideId && document?.source.type === 'pptx' && <PptxMediaControls key={`${session.id}:${document.id}:${selected.slideId}`} session={session} selected={selected}
        disabled={!connected || busy || dirty || overlayDirty || !pptxSource.ready} onStatus={setNotice} onWorking={setMediaBusy} />}
      {session && document && selected?.slideId && <PreflightControls sessionId={session.id} document={document} page={document.slideIds.indexOf(selected.slideId) + 1} disabled={!connected || busy} />}
      <label htmlFor="presenter-note">발표자 노트</label>
      <textarea id="presenter-note" value={note} maxLength={100000} disabled={!connected || busy || overlayDirty || !selected?.slideId}
        onChange={event => { setHeldSelection(selected ?? null); setNote(event.target.value); setDirty(true); }} />
      <div className="control-actions">
        <button disabled={!connected || busy || !dirty || !selected?.slideId} onClick={() => {
          if (session && selected?.slideId) void execute({ sessionId: session.id, revision: session.revision, commandId: crypto.randomUUID(),
            type: 'SET_PRESENTER_NOTE', documentId: selected.documentId, slideId: selected.slideId, note });
        }}>노트 저장</button>
        <button disabled={busy || !dirty} onClick={() => { setNote(storedNote); setDirty(false); }}>변경 취소</button>
      </div>
      <p role="status" aria-live="polite">{error || (dirty ? '저장하지 않은 노트가 있습니다.' : notice || (connected ? '수업 연결됨' : '연결 확인 중'))}</p>
      {session && <SessionSaveControls session={session} disabled={!connected || busy || dirty || overlayDirty} />}
      {session && document?.source.type === 'pdf' && <PdfExportControls session={session} documentId={document.id}
        disabled={!connected || busy || dirty || overlayDirty} onWorking={setExportBusy} />}
    </main>
  );
}
