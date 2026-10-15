import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { PresentationDocumentState } from '../core/types';
import type { loadPptxPrivatePreview } from '../adapters/pptx/privatePreview';
import { pptxSourceVault } from '../adapters/pptx/source';
import { sourceKey } from '../storage/sourceVault';
import { createPptxLayer } from '../overlays/pptxLayer';

type Preview = Awaited<ReturnType<typeof loadPptxPrivatePreview>>;
type PreviewState = 'preparing' | 'ready' | 'unavailable' | 'unavailable-slide' | 'idle';
export function RegisteredPptxPreview({ sessionId, document: registered, slideId, children, file }: { sessionId: string; document: PresentationDocumentState; slideId: string; file?: File; children?: (canvas: HTMLCanvasElement) => ReactNode }) {
  const host = useRef<HTMLDivElement>(null), preview = useRef<Preview | null>(null), currentSlide = useRef(slideId);
  currentSlide.current = slideId;
  const [status, setStatus] = useState(''), [previewState, setPreviewState] = useState<PreviewState>('idle'), [sourceRevision, setSourceRevision] = useState(0), [retryNonce, setRetryNonce] = useState(0);
  const [layer, setLayer] = useState<ReturnType<typeof createPptxLayer> | null>(null);
  const fingerprint = registered.source.type === 'pptx' ? registered.source.fingerprint : undefined;
  const key = sourceKey(sessionId, registered.id), ids = JSON.stringify(registered.slideIds);
  const render = useRef<(() => void) | null>(null);
  useEffect(() => pptxSourceVault().subscribe(available => { if (available === key && !preview.current) setSourceRevision(value => value + 1); }), [key]);
  useEffect(() => {
    const controller = new AbortController(), container = host.current!, shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
    let instance: Preview | undefined, observer: ResizeObserver | undefined;
    setLayer(null); shadow.replaceChildren(); setPreviewState('preparing'); container.dataset.previewState = 'preparing'; setStatus('PPTX 비공개 미리보기 준비 중');
    void (async () => {
      let timedOut = false;
      try {
        if (!fingerprint) throw Error('PPTX_SOURCE_UNAVAILABLE');
        const source = file ? { file } : await pptxSourceVault().get(key, fingerprint, controller.signal);
        if (controller.signal.aborted) return;
        const { loadPptxPrivatePreview } = await import('../adapters/pptx/privatePreview');
        // Closed documents remain available for private inspection; this clone never activates them.
        let timeout: ReturnType<typeof setTimeout> | undefined;
        try {
          instance = await Promise.race([
            loadPptxPrivatePreview(source.file, controller.signal, { ...registered, closed: false }),
            new Promise<never>((_, reject) => { timeout = setTimeout(() => { timedOut = true; controller.abort(); reject(Error('PPTX_PREVIEW_TIMEOUT')); }, 30000); }),
          ]);
        } finally { if (timeout) clearTimeout(timeout); }
        if (controller.signal.aborted) { instance.dispose(); return; }
        preview.current = instance;
        const paint = () => {
          if (!instance) return;
          const frame = instance.render(currentSlide.current), scale = Math.min(container.clientWidth / frame.width, container.clientHeight / frame.height);
          const surface = document.createElement('div'); surface.dataset.slideId = currentSlide.current;
          surface.style.cssText = `position:absolute;left:${(container.clientWidth-frame.width*scale)/2}px;top:${(container.clientHeight-frame.height*scale)/2}px;width:${frame.width}px;height:${frame.height}px;transform-origin:top left;transform:scale(${scale});`;
          const layer = createPptxLayer(frame.width, frame.height, currentSlide.current);
          surface.append(frame.svg, layer.root); shadow.replaceChildren(surface); setLayer(layer);
        };
        render.current = paint; paint(); setPreviewState('ready'); container.dataset.previewState = 'ready'; observer = new ResizeObserver(paint); observer.observe(container);
        setStatus('실험적 PPTX 비공개 미리보기입니다. 효과·내장 미디어는 재생하지 않습니다. 원본 픽셀 색 추출은 미확인으로 색을 직접 선택하세요. 발표 화면은 편집 확정 전까지 유지됩니다.');
      } catch { if (!controller.signal.aborted || timedOut) { shadow.replaceChildren(); setPreviewState('unavailable'); container.dataset.previewState = 'unavailable'; setStatus('PPTX 미리보기를 표시하지 못했습니다. 같은 원본으로 다시 준비할 수 있습니다.'); } }
    })();
    return () => { controller.abort(); observer?.disconnect(); instance?.dispose(); preview.current = null; render.current = null; setPreviewState('idle'); container.dataset.previewState = 'idle'; shadow.replaceChildren(); };
  }, [key, fingerprint, ids, sourceRevision, retryNonce, file]);
  useEffect(() => { try { render.current?.(); } catch { setPreviewState('unavailable-slide'); if (host.current) host.current.dataset.previewState = 'unavailable-slide'; setStatus('선택 페이지를 표시하지 못했습니다. 같은 원본으로 다시 준비할 수 있습니다.'); } }, [slideId]);
  return <section aria-label="등록 PPTX 비공개 미리보기"><div ref={host} className="pdf-stage preview-stage" />{layer?.slideId === slideId && children && createPortal(children(layer.source), layer.root)}<p role="status">{status}</p>{(previewState === 'unavailable' || previewState === 'unavailable-slide') && <button type="button" onClick={() => setRetryNonce(value => value + 1)}>같은 원본으로 미리보기 다시 준비</button>}</section>;
}
