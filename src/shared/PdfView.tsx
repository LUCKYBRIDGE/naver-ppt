import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { OverlayData } from '../overlays/types';
import { OverlayLayer } from '../overlays/OverlayLayer';
import { sourceKey, sourceVault } from '../storage/sourceVault';
import type { PdfRenderer } from '../adapters/pdf/pdf';

export function PdfView({ sessionId, documentId, slideId, pageNumber, fingerprint, audience = false, overlays, children, onReady }:
  { sessionId: string; documentId: string; slideId: string; pageNumber: number; fingerprint: string | null; audience?: boolean;
    overlays?: OverlayData[]; children?: (canvas: HTMLCanvasElement) => ReactNode; onReady?: (key: string) => void }) {
  const container = useRef<HTMLDivElement>(null); const canvas = useRef<HTMLCanvasElement>(null);
  const [renderer, setRenderer] = useState<PdfRenderer | null>(null);
  const [size, setSize] = useState({ width: 1, height: 1 }); const [error, setError] = useState(''); const [sourceRevision, setSourceRevision] = useState(0);
  const [frame, setFrame] = useState({ width: 0, height: 0, key: '', slideId: '' });
  const key = sourceKey(sessionId, documentId);
  useEffect(() => sourceVault().subscribe(available => {
    if (available === key && !renderer) setSourceRevision(value => value + 1);
  }), [key, renderer]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setSize({ width: Math.max(1, Math.floor(rect.width)), height: Math.max(1, Math.floor(rect.height)) });
    });
    observer.observe(container.current); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false; let instance: PdfRenderer | undefined;
    const abort = new AbortController();
    setRenderer(null); setError('');
    if (canvas.current) canvas.current.width = canvas.current.height = 0;
    void (async () => {
      try {
        if (!fingerprint) throw new Error('원본 식별 정보가 없습니다. PDF를 다시 등록하세요. 기존 편집은 유지했습니다.');
        const source = await sourceVault().get(key, fingerprint, abort.signal);
        if (disposed) return;
        const { PdfRenderer, openPdf } = await import('../adapters/pdf/pdf');
        const pdf = await openPdf(new Uint8Array(await source.file.arrayBuffer()), abort.signal); instance = new PdfRenderer(pdf);
        if (disposed) { await instance.destroy(); return; }
        setRenderer(instance);
      } catch (failure) { if (!disposed) setError(failure instanceof Error ? failure.message : 'PDF를 표시하지 못했습니다.'); }
    })();
    return () => { disposed = true; abort.abort(); void instance?.destroy(); };
  }, [key, fingerprint, sourceRevision]);
  useEffect(() => {
    if (!renderer || size.width < 2 || size.height < 2) return;
    const abort = new AbortController(); setError('');
    if (canvas.current) canvas.current.width = canvas.current.height = 0;
    void renderer.render(pageNumber, size.width, size.height, abort.signal).then(rendered => {
      if (abort.signal.aborted || !canvas.current) return;
      canvas.current.width = rendered.width; canvas.current.height = rendered.height;
      canvas.current.getContext('2d')?.drawImage(rendered, 0, 0);
      canvas.current.dataset.slideId = slideId;
      setFrame({ width: rendered.width, height: rendered.height, key, slideId });
      void renderer.prefetch(pageNumber, size.width, size.height, abort.signal);
    }).catch(failure => {
      if (!abort.signal.aborted) setError(failure instanceof Error ? failure.message : '페이지를 표시하지 못했습니다.');
    });
    return () => abort.abort();
  }, [renderer, pageNumber, slideId, size.width, size.height]);
  const ready = frame.key === key && frame.slideId === slideId && !!canvas.current?.width;
  useEffect(() => { onReady?.(ready && !error ? JSON.stringify([documentId, slideId]) : ''); }, [ready, error, documentId, slideId, onReady]);
  const scale = ready && frame.width && frame.height ? Math.min(size.width / frame.width, size.height / frame.height) : 0;
  return <div ref={container} className={audience ? 'pdf-stage audience-stage' : 'pdf-stage preview-stage'}>
    <div className="slide-surface" style={{ width: frame.width * scale, height: frame.height * scale }}>
      <canvas ref={canvas} aria-label={audience ? '발표 자료' : `${pageNumber}페이지 미리보기`} />
      {canvas.current && ready && (children ? children(canvas.current) : overlays && <OverlayLayer source={canvas.current} overlays={overlays} />)}
    </div>
    {!audience && error && <p className="pdf-error" role="status">{error}</p>}
  </div>;
}
