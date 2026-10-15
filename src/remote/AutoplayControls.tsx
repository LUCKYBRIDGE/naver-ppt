import { useEffect, useState } from 'react';
import { Pause, Play, Save, RotateCcw } from 'lucide-react';
import type { ClassSession } from '../core/types';
import type { SessionCommand } from '../core/commands';
import type { AutoplayRule } from '../media/types';
import { isSupportedAutoplayRule, isMediaAutoplay, resolveAutoplay } from '../media/autoplay';

export function AutoplayControls({ session, disabled, execute }: { session: ClassSession; disabled: boolean; execute: (command: SessionCommand) => Promise<void> }) {
  const selected = session.presentedSelection, document = selected ? session.documents[selected.documentId] : undefined;
  const [scope, setScope] = useState<'session' | 'document' | 'slide'>('document');
  const [mode, setMode] = useState<AutoplayRule['mode']>('seconds'), [seconds, setSeconds] = useState(5);
  const [loop, setLoop] = useState<AutoplayRule['loop']>('none'), [start, setStart] = useState(''), [end, setEnd] = useState('');
  const savedRule = selected && document ? scope === 'session' ? session.defaultAutoplay : scope === 'document' ? document.autoplay : document.slideDeltas[selected.slideId!]?.autoplay : undefined;
  const encodedRule = JSON.stringify(savedRule);
  useEffect(() => {
    setMode(savedRule?.mode ?? 'seconds'); setSeconds(savedRule?.seconds ?? 5); setLoop(savedRule?.loop ?? 'none');
    setStart(savedRule?.range?.startSlideId ?? document?.slideIds[0] ?? ''); setEnd(savedRule?.range?.endSlideId ?? document?.slideIds.at(-1) ?? '');
  }, [scope, selected?.documentId, selected?.slideId, encodedRule]);
  if (!selected?.slideId || !document) return null;
  const resolved = resolveAutoplay(session, document, selected.slideId), checkpoint = document.autoplayCheckpoint;
  const context = { sessionId: session.id, documentId: document.id, slideId: selected.slideId, revision: session.revision };
  const hasMedia = Object.values(document.localMedia ?? {}).some(ref => ref.slideId === selected.slideId);
  const timed = mode === 'seconds' || mode === 'later-of-time-and-media';
  const valid = !timed || Number.isFinite(seconds) && seconds >= 1 && seconds <= 86400;
  const rangeValid = loop !== 'range' || scope !== 'session' && document.slideIds.indexOf(start) >= 0 && document.slideIds.indexOf(end) >= document.slideIds.indexOf(start);
  function configure(rule: AutoplayRule | null) { void execute({ ...context, commandId: crypto.randomUUID(), type: 'SET_AUTOPLAY', scope, rule }); }
  return <section className="autoplay-controls" aria-label="자동 넘김">
    <h2>자동 넘김</h2>
    <label htmlFor="autoplay-scope">적용 범위</label>
    <select id="autoplay-scope" value={scope} disabled={disabled} onChange={event => setScope(event.target.value as typeof scope)}>
      <option value="session">수업 기본값</option><option value="document">현재 자료</option><option value="slide">현재 페이지</option>
    </select>
    <label htmlFor="autoplay-mode">진행 방식</label>
    <select id="autoplay-mode" value={mode} disabled={disabled} onChange={event => setMode(event.target.value as typeof mode)}>
      <option value="manual">수동</option><option value="seconds">시간 간격</option>
      <option value="media-end" disabled={!hasMedia}>미디어 종료 후</option><option value="later-of-time-and-media" disabled={!hasMedia}>시간·미디어 종료 후</option>
    </select>
    {timed && <><label htmlFor="autoplay-seconds">간격 (초)</label><input id="autoplay-seconds" type="number" min={1} max={86400} step={1} value={seconds} disabled={disabled} onChange={event => setSeconds(event.target.valueAsNumber)} /></>}
    <label htmlFor="autoplay-loop">반복</label>
    <select id="autoplay-loop" value={loop} disabled={disabled} onChange={event => setLoop(event.target.value as typeof loop)}>
      <option value="none">반복 안 함</option><option value="slide">현재 페이지</option><option value="document">현재 자료</option><option value="range" disabled={scope === 'session'}>페이지 범위</option>
    </select>
    {loop === 'range' && <div className="autoplay-range"><div><label htmlFor="autoplay-start">시작 페이지</label><select id="autoplay-start" value={start} disabled={disabled} onChange={event => setStart(event.target.value)}>{document.slideIds.map((id, index) => <option key={id} value={id}>{index + 1}</option>)}</select></div>
      <div><label htmlFor="autoplay-end">끝 페이지</label><select id="autoplay-end" value={end} disabled={disabled} onChange={event => setEnd(event.target.value)}>{document.slideIds.map((id, index) => <option key={id} value={id}>{index + 1}</option>)}</select></div></div>}
    <div className="control-actions">
      <button title="자동 넘김 설정 적용" aria-label="자동 넘김 설정 적용" disabled={disabled || !valid || !rangeValid} onClick={() => configure({ mode, ...(timed ? { seconds } : {}), loop, ...(loop === 'range' ? { range: { startSlideId: start, endSlideId: end } } : {}), pauseWhileEditing: false })}><Save size={20} aria-hidden="true" /></button>
      <button title="상위 설정 사용" aria-label="상위 설정 사용" disabled={disabled || scope === 'session' || !savedRule} onClick={() => configure(null)}><RotateCcw size={20} aria-hidden="true" /></button>
      <button title="자동 넘김 재개" aria-label="자동 넘김 재개" disabled={disabled || checkpoint?.paused === false || !isSupportedAutoplayRule(resolved) || resolved.mode === 'manual' || isMediaAutoplay(resolved) && !hasMedia} onClick={() => void execute({ ...context, commandId: crypto.randomUUID(), type: 'PLAY_AUTOPLAY' })}><Play size={20} aria-hidden="true" /></button>
      <button title="자동 넘김 정지" aria-label="자동 넘김 정지" disabled={disabled || !checkpoint || checkpoint.paused} onClick={() => void execute({ ...context, commandId: crypto.randomUUID(), type: 'PAUSE_AUTOPLAY' })}><Pause size={20} aria-hidden="true" /></button>
    </div>
    <p role="status">{checkpoint?.paused === false ? '자동 넘김 진행 중' : '자동 넘김 정지'} · {resolved.mode === 'manual' ? '수동' : resolved.mode === 'seconds' ? `${resolved.seconds}초` : resolved.mode === 'media-end' ? '미디어 종료 후' : `${resolved.seconds}초·미디어 종료 후`}</p>
  </section>;
}
