import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { loadPptxPrivatePreview } from '../adapters/pptx/privatePreview';

type Preview = Awaited<ReturnType<typeof loadPptxPrivatePreview>>;
export function PptxPrivatePreviewControls({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [preview, setPreview] = useState<Preview | null>(null), [index, setIndex] = useState(0), [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(''), [name, setName] = useState('');
  const operation = useRef<AbortController | null>(null), owned = useRef<Preview | null>(null), stage = useRef<HTMLDivElement>(null);
  function clear() { owned.current?.dispose(); owned.current = null; setPreview(null); setIndex(0); stage.current?.shadowRoot?.replaceChildren(); }
  useEffect(() => {
    setPreview(null); setIndex(0); setBusy(false); setStatus(''); setName('');
    return () => { operation.current?.abort(); operation.current = null; owned.current?.dispose(); owned.current = null; };
  }, [sessionId]);
  useEffect(() => {
    if (!stage.current || !preview) return;
    const host = stage.current, shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    try {
      const frame = preview.render(preview.slideIds[index]!), surface = document.createElement('div');
      frame.svg.dataset.previewIndex = String(index);
      surface.style.cssText = `width:${frame.width}px;height:${frame.height}px;transform-origin:top left;`;
      surface.append(frame.svg); shadow.replaceChildren(surface); host.style.aspectRatio = `${frame.width} / ${frame.height}`;
      const fit = () => { surface.style.transform = `scale(${host.clientWidth / frame.width})`; }; fit();
      setStatus('비공개 미리보기를 준비했습니다.');
      const observer = new ResizeObserver(fit); observer.observe(host);
      return () => { observer.disconnect(); shadow.replaceChildren(); };
    } catch { shadow.replaceChildren(); setStatus('이 쪽을 표시하지 못했습니다. 원본 충실도를 확인할 수 없습니다. 발표 화면은 유지했습니다.'); }
  }, [preview, index]);
  async function open(file: File) {
    operation.current?.abort(); clear();
    const controller = new AbortController(); operation.current = controller;
    setBusy(true); setName(file.name); setStatus('PPTX 미리보기를 준비 중입니다.');
    let timeout: ReturnType<typeof setTimeout> | undefined, timedOut = false;
    try {
      const { loadPptxPrivatePreview } = await import('../adapters/pptx/privatePreview');
      if (controller.signal.aborted) return;
      const result = await Promise.race([
        loadPptxPrivatePreview(file, controller.signal),
        new Promise<never>((_, reject) => { timeout = setTimeout(() => { timedOut = true; controller.abort(); reject(Error('PPTX_PREVIEW_TIMEOUT')); }, 30000); }),
      ]);
      if (operation.current !== controller || controller.signal.aborted) { result.dispose(); return; }
      owned.current = result; setPreview(result); setStatus('비공개 미리보기를 준비했습니다.');
    } catch { if (operation.current === controller && (!controller.signal.aborted || timedOut)) setStatus('PPTX 미리보기를 준비하지 못했습니다. 원본 형식·크기·지원 범위를 확인하세요. 발표 화면은 유지했습니다.'); }
    finally { if (timeout) clearTimeout(timeout); if (operation.current === controller) { operation.current = null; setBusy(false); } }
  }
  return <section className="preflight-controls pptx-private-preview" aria-label="PPTX 비공개 미리보기">
    <h2>PPTX 비공개 미리보기</h2>
    <label htmlFor="pptx-preview-file">PPTX 파일</label>
    <input id="pptx-preview-file" type="file" accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation" disabled={disabled} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (file) void open(file);
    }} />
    {name && <p className="inspection-filename">{name}</p>}
    <p role="status" aria-live="polite">{status}</p>
    {(preview || busy) && <div className="control-actions"><button aria-label={busy ? '미리보기 준비 취소' : '미리보기 닫기'} title={busy ? '미리보기 준비 취소' : '미리보기 닫기'} onClick={() => {
      operation.current?.abort(); operation.current = null; clear(); setBusy(false); setStatus('미리보기를 닫았습니다. 발표 화면은 유지했습니다.');
    }}><X size={20} aria-hidden="true" /></button></div>}
    {preview && <>
      <p className="preview-warning">실험적 화면입니다. 원본 글꼴·줄바꿈·이미지·효과 재현은 미확인입니다. 효과의 최종 내용만 표시하며 미디어는 재생하지 않습니다.</p>
      <div className="pptx-preview-navigation">
        <button aria-label="이전 미리보기 쪽" title="이전 미리보기 쪽" disabled={index === 0} onClick={() => setIndex(value => value - 1)}><ChevronLeft size={20} aria-hidden="true" /></button>
        <label>쪽 이동<select value={index} onChange={event => setIndex(Number(event.target.value))}>{preview.slideIds.map((id, i) => <option key={id} value={i}>{i + 1} / {preview.slideIds.length}</option>)}</select></label>
        <button aria-label="다음 미리보기 쪽" title="다음 미리보기 쪽" disabled={index === preview.slideIds.length - 1} onClick={() => setIndex(value => value + 1)}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
    </>}
    <div className="pptx-preview-stage" role="img" aria-label={preview ? `PPTX 비공개 ${index + 1}쪽` : 'PPTX 미리보기 없음'} hidden={!preview} ref={stage} />
  </section>;
}
