import { useCallback, useEffect, useRef } from 'react';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import { PdfView } from '../shared/PdfView';
import { PptxView } from './PptxView';
import { LocalMediaPlayer } from './LocalMediaPlayer';
import { sceneKey, waitForPreparedScene } from './preparedScene';

export function PlayerScene(props: { state: PlayerSnapshot; active: boolean; preparing: boolean; effectRequest: number;
  onStatus: (status: string) => void; onMediaError: (id: string, message: string, retry?: () => void) => void;
  onReady: (key: string) => void; onPrepared: (key: string, error?: unknown) => void }) {
  const latest = useRef(props); latest.current = props;
  const root = useRef<HTMLDivElement>(null);
  // These callbacks keep their identity when the prepared scene becomes active.
  const status = useCallback((value: string) => { if (latest.current.active) latest.current.onStatus(value); }, []);
  const mediaError = useCallback((id: string, message: string, retry?: () => void) => {
    const current = latest.current;
    if (current.active) current.onMediaError(id, message, retry);
    else if (message) current.onPrepared(sceneKey(current.state), Error('PREPARATION_MEDIA_FAILED'));
  }, []);
  const pdfReady = useCallback((key: string) => { if (latest.current.active) latest.current.onReady(key); }, []);
  const { state, active } = props, key = sceneKey(state);
  useEffect(() => {
    if (!props.preparing || !root.current) return;
    const controller = new AbortController();
    void waitForPreparedScene(root.current, state, controller.signal, active).then(() => {
      if (!controller.signal.aborted) latest.current.onPrepared(key);
    }, error => { if (!controller.signal.aborted) latest.current.onPrepared(key, error); });
    return () => controller.abort();
  }, [key, active, props.preparing]);
  if (!state.selection?.slideId || !state.pageNumber) return null;
  return <div ref={root} className="player-scene" data-active={active} aria-hidden={!active}>
    {state.pptx ? <PptxView state={state} active={active} effectRequest={props.effectRequest} onStatus={status} onMediaError={mediaError} />
      : <PdfView sessionId={state.sessionId} documentId={state.selection.documentId} slideId={state.selection.slideId}
        pageNumber={state.pageNumber} fingerprint={state.sourceFingerprint} overlays={state.overlays} onReady={pdfReady} audience />}
    <div className="player-media">{state.media.filter(entry => !state.pptx || !entry.ref.embeddedSource).map(entry =>
      <LocalMediaPlayer key={entry.ref.id} sessionId={state.sessionId} documentId={state.selection!.documentId} entry={entry} passive={!active} onError={mediaError} />)}</div>
  </div>;
}
