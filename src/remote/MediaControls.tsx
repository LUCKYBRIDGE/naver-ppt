import { Play, Pause, Save, FastForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LocalMediaRef, MediaBookmark, MediaPlayback } from '../media/types';
import { isMediaPlayback, mediaPlayback } from '../media/validation';
import type { ClassSession } from '../core/types';
import type { SessionCommand } from '../core/commands';
export function MediaControls({ session, disabled, execute }: { session: ClassSession; disabled: boolean; execute: (command: SessionCommand) => Promise<void> }) {
  const selected = session.presentedSelection, document = selected ? session.documents[selected.documentId] : undefined;
  const refs = Object.values(document?.localMedia ?? {}).filter(ref => ref.slideId === selected?.slideId);
  if (!document || !selected?.slideId || !refs.length) return null;
  return <section className="media-controls" aria-label="미디어 재생"><h2>미디어</h2>{refs.map(ref => {
    const bookmark = Object.hasOwn(document.mediaBookmarks, ref.id) ? document.mediaBookmarks[ref.id] : undefined, playing = bookmark?.paused === false;
    return <div key={ref.id} className="media-control-item"><div className="media-control-row"><span>{ref.name}</span><span>{Math.floor(bookmark?.timeSec ?? mediaPlayback(ref).startSec)} / {Math.ceil(ref.durationSec)}초</span>
      <button title={playing ? '미디어 정지' : '미디어 재생'} aria-label={`${ref.name} ${playing ? '정지' : '재생'}`} disabled={disabled} onClick={() => void execute({ type: playing ? 'PAUSE_MEDIA' : 'PLAY_MEDIA', sessionId: session.id, documentId: document.id, slideId: selected.slideId!, revision: session.revision, commandId: crypto.randomUUID(), mediaId: ref.id })}>{playing ? <Pause size={20} aria-hidden="true" /> : <Play size={20} aria-hidden="true" />}</button>
    </div><MediaSettings refInfo={ref} bookmark={bookmark} disabled={disabled} command={payload => execute({ sessionId: session.id, documentId: document.id, slideId: selected.slideId!, revision: session.revision, commandId: crypto.randomUUID(), mediaId: ref.id, ...payload })} /></div>;
  })}</section>;
}

function MediaSettings({ refInfo, bookmark, disabled, command }: { refInfo: LocalMediaRef; bookmark: MediaBookmark | undefined; disabled: boolean;
  command: (payload: { type: 'SET_MEDIA_PLAYBACK'; playback: MediaPlayback } | { type: 'SEEK_MEDIA'; timeSec: number }) => Promise<void> }) {
  const saved = mediaPlayback(refInfo), [draft, setDraft] = useState(saved), [position, setPosition] = useState(bookmark?.timeSec ?? saved.startSec);
  const encoded = JSON.stringify(saved);
  useEffect(() => { setDraft(saved); }, [refInfo.id, encoded]);
  useEffect(() => { setPosition(bookmark?.timeSec ?? saved.startSec); }, [refInfo.id, bookmark?.timeSec, saved.startSec]);
  const valid = isMediaPlayback(draft, refInfo.durationSec), prefix = `media-${refInfo.id}`;
  return <div className="media-settings">
    <div className="media-range"><div><label htmlFor={`${prefix}-start`}>시작 (초)</label><input id={`${prefix}-start`} type="number" min={0} max={refInfo.durationSec} step="0.1" value={Number.isFinite(draft.startSec) ? draft.startSec : ''} disabled={disabled} onChange={event => setDraft({ ...draft, startSec: event.target.valueAsNumber })} /></div>
      <div><label htmlFor={`${prefix}-end`}>끝 (초)</label><input id={`${prefix}-end`} type="number" min={0} max={refInfo.durationSec} step="0.1" value={Number.isFinite(draft.endSec) ? draft.endSec : ''} disabled={disabled} onChange={event => setDraft({ ...draft, endSec: event.target.valueAsNumber })} /></div></div>
    <label htmlFor={`${prefix}-volume`}>음량 {Math.round(draft.volume * 100)}%</label><input id={`${prefix}-volume`} type="range" min={0} max={1} step="0.01" value={draft.volume} disabled={disabled} onChange={event => setDraft({ ...draft, volume: event.target.valueAsNumber })} />
    <div className="control-actions"><button title="미디어 설정 적용" aria-label={`${refInfo.name} 설정 적용`} disabled={disabled || !valid} onClick={() => void command({ type: 'SET_MEDIA_PLAYBACK', playback: draft })}><Save size={20} aria-hidden="true" /></button>
      <button title={saved.muted ? '음소거 해제' : '음소거'} aria-label={`${refInfo.name} ${saved.muted ? '음소거 해제' : '음소거'}`} aria-pressed={saved.muted} disabled={disabled} onClick={() => void command({ type: 'SET_MEDIA_PLAYBACK', playback: { ...saved, muted: !saved.muted } })}>{saved.muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}</button></div>
    <label htmlFor={`${prefix}-seek`}>재생 위치 {position.toFixed(1)}초</label><input id={`${prefix}-seek`} type="range" min={saved.startSec} max={Math.max(saved.startSec, saved.endSec - .001)} step="0.001" value={position} disabled={disabled} onChange={event => setPosition(event.target.valueAsNumber)} />
    <button title="선택 위치로 이동" aria-label={`${refInfo.name} 위치 이동`} disabled={disabled || position < saved.startSec || position >= saved.endSec} onClick={() => void command({ type: 'SEEK_MEDIA', timeSec: position })}><FastForward size={20} aria-hidden="true" /></button>
  </div>;
}
