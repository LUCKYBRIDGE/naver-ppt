import { useCallback, useEffect, useRef, useState } from 'react';
import { PenSquare, Play, StepForward } from 'lucide-react';
import { sendSessionRequest, useSessionState } from '../shared/sessionClient';
import { useAutoplay } from './useAutoplay';
import { usePlayerOwnership } from './usePlayerOwnership';
import { TimerOverlay } from './TimerOverlay';
import { PlayerScene } from './PlayerScene';
import { sceneKey } from './preparedScene';
import { usePresentationStage } from './usePresentationStage';

export function Player() {
  const { snapshot, connected, receiveSnapshot } = useSessionState('player');
  const state = snapshot?.kind === 'player' ? snapshot.snapshot : null;
  const ownership = usePlayerOwnership(state?.sessionId);
  const preparation = usePresentationStage(state, ownership.owned, ownership.playerId, receiveSnapshot);
  const [readyKey, setReadyKey] = useState('');
  const [effectRequest, setEffectRequest] = useState(0), [pptxStatus, setPptxStatus] = useState('');
  const [mediaErrors, setMediaErrors] = useState<Record<string, { message: string; retry?: () => void }>>({});
  const reportMediaError = useCallback((id: string, message: string, retry?: () => void) => setMediaErrors(previous => {
    const next = { ...previous }; if (message) next[id] = { message, ...(retry ? { retry } : {}) }; else delete next[id]; return next;
  }), []);
  useAutoplay(ownership.owned && !state?.pptx ? state : null, readyKey);
  const [visible, setVisible] = useState(false), [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const gesture = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);
  function clearGesture() { if (gesture.current) clearTimeout(gesture.current.timer); gesture.current = null; }
  useEffect(() => { clearGesture(); setVisible(false); setFailed(false); return clearGesture; }, [state?.selection?.documentId, state?.selection?.slideId]);
  async function edit() {
    if (!connected || busy || !state?.selection?.slideId) return;
    setBusy(true); setFailed(false);
    try {
      const result = await sendSessionRequest({ type: 'OPEN_CURRENT_EDITOR', command: { type: 'SELECT_EDITOR_SLIDE', sessionId: state.sessionId,
        documentId: state.selection.documentId, slideId: state.selection.slideId, revision: state.revision, commandId: crypto.randomUUID() } });
      setFailed(!result.ok); if (result.ok) setVisible(false);
    } catch { setFailed(true); }
    finally { setBusy(false); }
  }
  const presenting = !!(ownership.owned && state?.selection?.slideId && state.pageNumber);
  const scenes = ownership.owned ? [ ...(presenting && state ? [state] : []),
    ...(preparation.target && (!presenting || !state || sceneKey(preparation.target) !== sceneKey(state)) ? [preparation.target] : []) ] : [];
  return <main className={presenting ? 'player-screen' : 'standby'} onContextMenu={event => { event.preventDefault(); setVisible(true); }}
    onKeyDown={event => { if (event.key === 'Escape') { clearGesture(); setVisible(false); setFailed(false); } }}
    onPointerDown={event => { if (event.pointerType !== 'touch' || event.target instanceof HTMLElement && event.target.closest('button')) return;
      clearGesture(); gesture.current = { x: event.clientX, y: event.clientY, timer: setTimeout(() => { gesture.current = null; setVisible(true); }, 600) }; }}
    onPointerMove={event => { const initial = gesture.current; if (initial && Math.hypot(event.clientX - initial.x, event.clientY - initial.y) > 8) clearGesture(); }}
    onPointerUp={clearGesture} onPointerCancel={clearGesture} onPointerLeave={clearGesture}>
    <div className="player-scenes">{scenes.map(scene => <PlayerScene key={sceneKey(scene)} state={scene}
      active={presenting && !!state && sceneKey(scene) === sceneKey(state)} preparing={!!preparation.target && sceneKey(scene) === sceneKey(preparation.target)}
      effectRequest={effectRequest} onStatus={setPptxStatus} onMediaError={reportMediaError} onReady={setReadyKey} onPrepared={preparation.onPrepared} />)}</div>
    {!presenting && <div><h1>발표 대기</h1>{state && !ownership.owned && <p role="status">{ownership.message}</p>}</div>}
    {state && ownership.owned && <TimerOverlay state={state} />}
    {presenting && state && <>
    {!!Object.keys(mediaErrors).length && <div className="media-player-errors">{Object.entries(mediaErrors).map(([id, failure]) => <div key={id} className="media-player-error"><p role="status">{failure.message}</p>{failure.retry && <button title="미디어 재생 허용" aria-label="미디어 재생 허용" onClick={failure.retry}><Play size={20} aria-hidden="true" /></button>}</div>)}</div>}
    <div className="player-tools" data-visible={visible || failed}>
      {state.pptx && <button title="다음 PPTX 효과" aria-label="다음 PPTX 효과" onClick={() => setEffectRequest(value => value + 1)}><StepForward size={22} aria-hidden="true" /></button>}
      {state.pptx && pptxStatus && <p role="status">{pptxStatus}</p>}
      <button title="현재 페이지 편집" aria-label="현재 페이지 편집" disabled={!connected || busy} onClick={() => void edit()}><PenSquare size={22} aria-hidden="true" /></button>
      {failed && <p role="status">편집창을 열지 못했습니다.</p>}
    </div>
    </>}
  </main>;
}
