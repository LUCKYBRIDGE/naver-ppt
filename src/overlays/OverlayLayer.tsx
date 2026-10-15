import { useEffect, useRef } from 'react';
import type { OverlayData } from './types';
import { paintOverlays } from './canvasLayer';

export function OverlayLayer({ source, overlays, onFailures }:
  { source: HTMLCanvasElement; overlays: OverlayData[]; onFailures?: (ids: string[]) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const target = ref.current; if (!target) return;
    let stopped = false;
    const temporary = document.createElement('canvas'); temporary.width = source.width; temporary.height = source.height;
    void paintOverlays(temporary, overlays).then(failures => {
      if (stopped) return;
      target.width = temporary.width; target.height = temporary.height;
      target.getContext('2d')?.drawImage(temporary, 0, 0); onFailures?.(failures);
    }).catch(() => { if (!stopped) onFailures?.(['font-load']); });
    return () => { stopped = true; };
  }, [source, source.width, source.height, overlays, onFailures]);
  return <canvas ref={ref} className="overlay-canvas" aria-hidden="true" />;
}
