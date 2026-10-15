import { useCallback, useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { MousePointer2, Type, PenLine, Square, Undo2, Redo2, Trash2, Eye, EyeOff } from 'lucide-react';
import type { OverlayData, NormalizedRect, Point } from '../overlays/types';
import { OverlayLayer } from '../overlays/OverlayLayer';
import { colorCandidates, paintOverlays } from '../overlays/canvasLayer';
import { PdfView } from '../shared/PdfView';

type Mode = 'select' | 'textbox' | 'stroke' | 'mask';
interface Gesture { start: Point; points: Point[]; initial: OverlayData[]; target?: string; resize?: boolean }
function bounds(item: OverlayData): NormalizedRect {
  if (item.kind !== 'stroke') return item.rect;
  const xs = item.points.map(p => p.x), ys = item.points.map(p => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}
function area(a: Point, b: Point): NormalizedRect {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), width: Math.max(.002, Math.abs(a.x - b.x)), height: Math.max(.002, Math.abs(a.y - b.y)) };
}
export function OverlayEditor({ sessionId, documentId, slideId, pageNumber, fingerprint, saved, disabled, onDirty, onCommit, sourceView }:
  { sessionId: string; documentId: string; slideId: string; pageNumber: number; fingerprint: string | null; saved: OverlayData[];
    disabled: boolean; onDirty: (value: boolean) => void; onCommit: (items: OverlayData[]) => Promise<boolean>;
    sourceView?: (children: (canvas: HTMLCanvasElement) => ReactNode) => ReactNode }) {
  const [items, setItems] = useState<OverlayData[]>(() => structuredClone(saved));
  const [past, setPast] = useState<OverlayData[][]>([]), [future, setFuture] = useState<OverlayData[][]>([]);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [mode, setMode] = useState<Mode>('select');
  const [selected, setSelected] = useState(''), [failures, setFailures] = useState<string[]>([]), [notice, setNotice] = useState('');
  const [colors, setColors] = useState(['#000000']), [ink, setInk] = useState('#000000');
  const [composing, setComposing] = useState(false), [compositionText, setCompositionText] = useState('');
  const gesture = useRef<Gesture | null>(null), source = useRef<HTMLCanvasElement | null>(null), textInput = useRef<HTMLTextAreaElement>(null);
  const base = useRef(JSON.stringify(saved)); const signature = JSON.stringify(saved);
  const selectedItem = items.find(item => item.id === selected);
  const setFailureIds = useCallback((ids: string[]) => setFailures(old => JSON.stringify(old) === JSON.stringify(ids) ? old : ids), []);
  useEffect(() => { if (!dirty) { setItems(structuredClone(saved)); base.current = signature; } }, [signature]);
  const dirtyCallback = useRef(onDirty); dirtyCallback.current = onDirty;
  useEffect(() => { dirtyCallback.current(dirty || composing); }, [dirty, composing]);
  useEffect(() => {
    if (!dirty && !composing) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, composing]);
  function change(next: OverlayData[], previous = items) {
    setPast(history => [...history.slice(-19), structuredClone(previous)]); setFuture([]); setItems(next); setDirty(true); setNotice('');
  }
  function patch(update: Partial<OverlayData>) { change(items.map(item => item.id === selected ? { ...item, ...update } as OverlayData : item)); }
  function point(event: PointerEvent<HTMLDivElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: Math.max(0, Math.min(.998, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(.998, (event.clientY - rect.top) / rect.height)) };
  }
  function down(event: PointerEvent<HTMLDivElement>, canvas: HTMLCanvasElement) {
    if (disabled || busy || composing || event.button !== 0 || !canvas.width) return;
    const start = point(event); source.current = canvas;
    const candidates = colorCandidates(canvas, start.x, start.y); setColors(candidates);
    let target: string | undefined, resize = false;
    if (mode === 'select') {
      const hit = [...items].sort((a, b) => b.zIndex - a.zIndex).find(item => {
        const r = bounds(item); return item.visible && start.x >= r.x - .015 && start.x <= r.x + r.width + .015 && start.y >= r.y - .015 && start.y <= r.y + r.height + .015;
      });
      setSelected(hit?.id ?? ''); if (!hit) return;
      const r = bounds(hit); target = hit.id;
      resize = hit.kind !== 'stroke' && Math.abs(start.x - r.x - r.width) < .025 && Math.abs(start.y - r.y - r.height) < .04;
      if (hit.kind === 'textbox' && !resize && start.x > r.x + .015 && start.x < r.x + r.width - .015 && start.y > r.y + .015 && start.y < r.y + r.height - .015) {
        requestAnimationFrame(() => textInput.current?.focus()); return;
      }
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    gesture.current = { start, points: [start], initial: structuredClone(items), ...(target ? { target, resize } : {}) };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current; if (!g || disabled || busy) return;
    const end = point(event);
    if (g.target) {
      setItems(g.initial.map(item => {
        if (item.id !== g.target) return item;
        const r = bounds(item);
        if (g.resize && item.kind !== 'stroke') return { ...item, rect: { ...r, width: Math.min(1 - r.x, Math.max(.01, end.x - r.x)), height: Math.min(1 - r.y, Math.max(.01, end.y - r.y)) } };
        const dx = Math.max(-r.x, Math.min(1 - r.x - r.width, end.x - g.start.x)), dy = Math.max(-r.y, Math.min(1 - r.y - r.height, end.y - g.start.y));
        return item.kind === 'stroke' ? { ...item, points: item.points.map(p => ({ x: p.x + dx, y: p.y + dy })) }
          : { ...item, rect: { ...r, x: r.x + dx, y: r.y + dy } };
      }));
    } else if (mode === 'stroke' && g.points.length < 10000) g.points.push(end);
  }
  function up(event: PointerEvent<HTMLDivElement>, canvas: HTMLCanvasElement) {
    const g = gesture.current; if (!g) return; gesture.current = null;
    if (g.target) { change(items, g.initial); return; }
    if (g.initial.length >= 256) { setNotice('한 슬라이드의 레이어 수 제한에 도달했습니다. 사용하지 않는 레이어를 삭제하세요.'); return; }
    const end = point(event), id = crypto.randomUUID(), common = { id, zIndex: Math.max(0, ...items.map(item => item.zIndex)) + 1, visible: true };
    const rect = area(g.start, end);
    const background = colors[0] ?? '#ffffff';
    const overlay: OverlayData = mode === 'stroke' ? { ...common, kind: 'stroke', points: [...g.points.slice(0, 9999), end], color: ink, widthNormalized: .004, tool: 'pen' }
      : mode === 'mask' ? { ...common, kind: 'mask', rect, color: ink }
        : { ...common, kind: 'textbox', rect, text: '', backgroundColor: background, color: background === '#000000' ? '#ffffff' : '#000000',
          fontFamily: 'Malgun Gothic', minFontPx: 12, maxFontPx: 96, fitMode: 'auto-max', paddingPx: 8, lineHeight: 1.25,
          align: 'left', verticalAlign: 'top', referenceWidth: 1280, referenceHeight: 1280 * canvas.height / canvas.width };
    change([...g.initial, overlay], g.initial); setSelected(id); setMode('select');
  }
  async function commit() {
    if (!source.current || composing) return;
    if (!source.current.width || !source.current.height || source.current.dataset.slideId !== slideId) {
      setNotice('페이지 표시가 끝난 뒤 다시 확정하세요. 초안은 유지했습니다.'); return;
    }
    setBusy(true); setNotice('');
    try {
      if (base.current !== signature) { setNotice('다른 창에서 레이어가 바뀌었습니다. 초안을 유지했습니다. 취소 후 최신 상태를 확인하세요.'); return; }
      const temporary = document.createElement('canvas'); temporary.width = source.current.width; temporary.height = source.current.height;
      const failed = await paintOverlays(temporary, items); temporary.width = temporary.height = 0; setFailures(failed);
      if (failed.length) { setNotice('최소 글씨 크기로도 상자에 맞지 않습니다. 내용을 줄이거나 상자 크기를 조정하세요.'); return; }
      if (await onCommit(items)) { setDirty(false); setPast([]); setFuture([]); base.current = JSON.stringify(items); setNotice('편집을 확정했습니다.'); }
    } catch { setNotice('글꼴 또는 편집을 확인하지 못했습니다. 초안은 유지했습니다.'); }
    finally { setBusy(false); }
  }
  const locked = disabled || busy || composing;
  const layers = (canvas: HTMLCanvasElement) => { source.current = canvas; return <>
    <OverlayLayer source={canvas} overlays={items} onFailures={setFailureIds} />
    <div className="overlay-interaction" onPointerDown={event => down(event, canvas)} onPointerMove={move} onPointerUp={event => up(event, canvas)}
      onPointerCancel={() => { if (gesture.current) setItems(gesture.current.initial); gesture.current = null; }}
      onContextMenu={event => { event.preventDefault(); if (!locked) { const p = point(event as unknown as PointerEvent<HTMLDivElement>); setColors(colorCandidates(canvas, p.x, p.y)); setMode('textbox'); } }}>
      {selectedItem && selectedItem.kind !== 'stroke' && <div className="overlay-selection" style={{ left: `${selectedItem.rect.x * 100}%`, top: `${selectedItem.rect.y * 100}%`, width: `${selectedItem.rect.width * 100}%`, height: `${selectedItem.rect.height * 100}%` }}><span /></div>}
    </div>
  </>; };
  return <section className="overlay-editor" aria-label="슬라이드 레이어 편집">
    <div className="overlay-toolbar" role="toolbar" aria-label="편집 도구">
      {([[ 'select', MousePointer2, '선택' ], ['textbox', Type, '글상자'], ['stroke', PenLine, '판서'], ['mask', Square, '가리개']] as const).map(([value, Icon, label]) =>
        <button key={value} title={label} aria-label={label} aria-pressed={mode === value} disabled={locked} onClick={() => setMode(value)}><Icon size={22} /></button>)}
      <button title="실행 취소" aria-label="실행 취소" disabled={locked || !past.length} onClick={() => {
        const prior = past.at(-1)!; setFuture([structuredClone(items), ...future]); setPast(past.slice(0, -1)); setItems(prior); setDirty(true);
      }}><Undo2 size={22} /></button>
      <button title="다시 실행" aria-label="다시 실행" disabled={locked || !future.length} onClick={() => {
        setPast([...past, structuredClone(items)]); setItems(future[0]!); setFuture(future.slice(1)); setDirty(true);
      }}><Redo2 size={22} /></button>
      <button title="레이어 삭제" aria-label="레이어 삭제" disabled={locked || !selectedItem} onClick={() => { change(items.filter(item => item.id !== selected)); setSelected(''); }}><Trash2 size={22} /></button>
      <label className="color-control">도구색<input type="color" value={ink} disabled={locked} onChange={e => setInk(e.target.value)} /></label>
    </div>
    {sourceView ? sourceView(layers) : <PdfView sessionId={sessionId} documentId={documentId} slideId={slideId} pageNumber={pageNumber} fingerprint={fingerprint}>{layers}</PdfView>}
    <label htmlFor="overlay-selection">레이어</label>
    <select id="overlay-selection" value={selected} disabled={locked} onChange={e => setSelected(e.target.value)}>
      <option value="">선택 없음</option>{items.map((item, index) => <option value={item.id} key={item.id}>{index + 1} · {item.kind === 'textbox' ? '글상자' : item.kind === 'mask' ? '가리개' : '판서'}</option>)}
    </select>
    {selectedItem && <div className="overlay-properties">
      <button title={selectedItem.visible ? '숨기기' : '표시하기'} aria-label={selectedItem.visible ? '숨기기' : '표시하기'} disabled={locked} onClick={() => patch({ visible: !selectedItem.visible })}>{selectedItem.visible ? <Eye size={22} /> : <EyeOff size={22} />}</button>
      <label>색<input type="color" value={selectedItem.color} disabled={locked} onChange={e => patch({ color: e.target.value })} /></label>
      {selectedItem.kind !== 'stroke' && (['x', 'y', 'width', 'height'] as const).map(field => <label key={field}>{({ x: '가로 위치', y: '세로 위치', width: '상자 너비', height: '상자 높이' })[field]}
        <input type="number" min={field === 'x' || field === 'y' ? 0 : 1} max={100} step={1} value={Math.round(selectedItem.rect[field] * 100)} disabled={locked} onChange={e => {
          const r = { ...selectedItem.rect, [field]: Math.max(field === 'x' || field === 'y' ? 0 : .01, Math.min(1, Number(e.target.value) / 100)) };
          r.x = Math.min(r.x, 1 - r.width); r.y = Math.min(r.y, 1 - r.height); patch({ rect: r } as Partial<OverlayData>);
        }} /></label>)}
    </div>}
    {selectedItem?.kind === 'textbox' && <>
      <label htmlFor="overlay-text">글상자 내용</label>
      <textarea ref={textInput} id="overlay-text" maxLength={10000} value={composing ? compositionText : selectedItem.text} disabled={disabled || busy}
        onCompositionStart={() => { setCompositionText(selectedItem.text); setComposing(true); }}
        onCompositionEnd={e => { setComposing(false); patch({ text: e.currentTarget.value } as Partial<OverlayData>); }}
        onChange={e => composing ? setCompositionText(e.target.value) : patch({ text: e.target.value } as Partial<OverlayData>)} />
      <div className="overlay-properties">
        <label>배경색<input type="color" value={selectedItem.backgroundColor} disabled={locked} onChange={e => patch({ backgroundColor: e.target.value } as Partial<OverlayData>)} /></label>
        {colors.map((color, index) => <button key={color} className="color-swatch" style={{ backgroundColor: color }} title={index === 0 ? '클릭한 원본 색' : '주변 원본 색'} aria-label={index === 0 ? '클릭한 원본 색' : '주변 원본 색'} disabled={locked} onClick={() => patch({ backgroundColor: color, color: color === '#000000' ? '#ffffff' : '#000000' } as Partial<OverlayData>)} />)}
        <label>글씨 크기<input type="number" min={12} max={96} value={selectedItem.fontPx ?? 32} disabled={locked} onChange={e => patch({ fontPx: Math.max(12, Math.min(96, Number(e.target.value))), fitMode: 'manual' } as Partial<OverlayData>)} /></label>
        <label><input type="checkbox" checked={selectedItem.fitMode === 'auto-max'} disabled={locked} onChange={e => patch({ fitMode: e.target.checked ? 'auto-max' : 'manual' } as Partial<OverlayData>)} />자동 맞춤</label>
      </div>
    </>}
    <div className="control-actions">
      <button disabled={locked || !dirty || failures.length > 0} onClick={() => void commit()}>편집 확정</button>
      <button disabled={locked || !dirty} onClick={() => { setItems(structuredClone(saved)); setDirty(false); setPast([]); setFuture([]); base.current = signature; setNotice(''); }}>편집 취소</button>
    </div>
    <p role="status">{notice || (composing ? '한글 입력 중' : failures.length ? '글상자에 내용이 맞지 않습니다. 내용이나 상자 크기를 조정하세요.' : dirty ? '확정하지 않은 편집이 있습니다.' : '')}</p>
  </section>;
}
