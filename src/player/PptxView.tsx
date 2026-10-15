import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import type { openPptxRuntime } from '../adapters/pptx/runtime';
import { pptxSourceVault } from '../adapters/pptx/source';
import { sourceKey } from '../storage/sourceVault';
import { createPptxPlayerTransport } from './pptxTransport';
import { PptxRequests } from './pptxRequests';
import { effectChannel, effectMessages } from '../shared/pptxEffectStatus';
import { createPptxLayer } from '../overlays/pptxLayer';
import { OverlayLayer } from '../overlays/OverlayLayer';
import { LocalMediaPlayer } from './LocalMediaPlayer';
import { PptxNativeEndpoint } from './pptxNativeEndpoint';
import type { PptxCheckpointTransport } from '../adapters/pptx/durablePlayback';
import { sendSessionRequest } from '../shared/sessionClient';
import type { BorrowedMediaUrl } from '../media/borrowedUrl';

type Runtime = Awaited<ReturnType<typeof openPptxRuntime>>;
export function PptxView({ state, effectRequest, onStatus, onMediaError, active = true }: { state: PlayerSnapshot; effectRequest: number; onStatus: (status: string) => void; onMediaError: (id: string, message: string, retry?: () => void) => void; active?: boolean }) {
  const host = useRef<HTMLDivElement>(null), current = useRef(state), runtime = useRef<Runtime | null>(null);
  const requests = useRef<PptxRequests | null>(null);
  const reportPreparation = useRef<((status: 'loading' | 'ready' | 'failed') => void) | null>(null);
  const announceStatus = useRef<(() => void) | null>(null);
  const mediaTransport = useRef<PptxCheckpointTransport | null>(null);
  const nativeEndpoints = useRef(new Map<string, PptxNativeEndpoint>());
  const [sourceRevision, setSourceRevision] = useState(0);
  const [layer, setLayer] = useState<ReturnType<typeof createPptxLayer> | null>(null);
  const [mediaSlots, setMediaSlots] = useState<{ id: string; file: File; asset: BorrowedMediaUrl; target: HTMLElement; scope: string; runtime: Runtime }[]>([]);
  const restored = useRef('');
  const activeRef = useRef(active); activeRef.current = active;
  if (state.sessionId !== current.current.sessionId || state.revision >= current.current.revision) current.current = state;
  const documentId = state.selection!.documentId, slideId = state.selection!.slideId!, key = sourceKey(state.sessionId, documentId);
  const fingerprint = state.sourceFingerprint, sessionId = state.sessionId, slideIds = state.pptx?.slideIds;
  const mediaScope = JSON.stringify([sessionId, documentId, slideId]);
  const idsKey = JSON.stringify(slideIds);
  const registerNative = useCallback((id: string, media: HTMLMediaElement) => {
    const transport = mediaTransport.current, entry = current.current.media.find(value => value.ref.id === id);
    if (!transport || !entry) throw Error('PPTX_NATIVE_ENDPOINT_UNAVAILABLE');
    const endpoint = new PptxNativeEndpoint(media, transport, { sessionId, documentId, slideId, mediaId: id, fingerprint: entry.ref.fingerprint },
      () => onMediaError(id, '재생은 정지했지만 위치를 저장하지 못했습니다. 리모컨에서 정지를 다시 요청하세요.'));
    nativeEndpoints.current.get(id)?.dispose(); nativeEndpoints.current.set(id, endpoint);
    return { suppressApply: (bookmark: typeof entry.bookmark) => endpoint.suppressApply(bookmark), dispose: () => {
      endpoint.dispose(); if (nativeEndpoints.current.get(id) === endpoint) nativeEndpoints.current.delete(id);
    } };
  }, [sessionId, documentId, slideId, onMediaError]);
  useEffect(() => pptxSourceVault().subscribe(available => { if (available === key && !runtime.current) setSourceRevision(value => value + 1); }), [key]);
  useEffect(() => {
    const controller = new AbortController(); let instance: Runtime | undefined, observer: ResizeObserver | undefined;
    const channel = effectChannel(sessionId, documentId, slideId);
    let status: keyof typeof effectMessages = 'loading';
    const publish = () => { if (activeRef.current) channel.postMessage({ status, revision: current.current.revision }); };
    const report = (value: typeof status) => {
      status = value; publish();
      if (host.current) host.current.dataset.preparation = value;
      const order = instance?.sourceOrder;
      const grouping = instance ? instance.sourceShapeGroups ? '도형 그룹 대응 확인.' : '도형 그룹 대응 미확인.' : '';
      onStatus(`실험적 PPTX · 효과 ${instance?.groups ?? 0}그룹. ${effectMessages[value]} ${instance ? order ? `원본 구조 ${order.groups.length}개·미디어 전용 ${order.mediaOnlyGroups}개.` : '원본 순서 대응 미확인.' : ''} ${grouping} ${instance?.sourceMediaExecution ? '검사한 미디어 클릭 그룹 실행. 복합 조건·원본 충실도 전체는 미확인입니다.' : '원본 충실도·미디어 트리거 실행은 미확인입니다.'}`);
    };
    reportPreparation.current = report;
    announceStatus.current = () => report(status);
    channel.onmessage = event => { if (event.data === 'query') publish(); };
    const consumer = new PptxRequests(current.current, report); requests.current = consumer;
    const container = host.current!, shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' }), surface = document.createElement('div');
    setLayer(null); shadow.replaceChildren(surface); onStatus('');
    void (async () => {
      try {
        if (!fingerprint || !slideIds?.length || !slideIds.includes(slideId)) throw Error('PPTX_TARGET_UNAVAILABLE');
        const source = await pptxSourceVault().get(key, fingerprint, controller.signal);
        if (controller.signal.aborted) return;
        const { openPptxRuntime } = await import('../adapters/pptx/runtime');
        const transport = createPptxPlayerTransport({ sessionId, readSnapshot: () => current.current,
          request: request => activeRef.current ? sendSessionRequest(request) : Promise.resolve({ ok: false, code: 'PREPARATION_READ_ONLY', error: '준비 중에는 상태를 변경하지 않습니다.' }),
          receiveSnapshot: value => { if (value.revision >= current.current.revision) { current.current = value; if (activeRef.current) consumer.update(value, runtime.current); publish(); } } });
        mediaTransport.current = transport;
        instance = await openPptxRuntime({ file: source.file, signal: controller.signal, root: surface, sessionId, slideId, transport,
          startMedia(mediaId, action) {
            if (!activeRef.current) throw Error('PPTX_PREPARATION_MUST_NOT_PLAY');
            const endpoint = nativeEndpoints.current.get(mediaId);
            if (controller.signal.aborted || !endpoint) throw Error('PPTX_NATIVE_ENDPOINT_UNAVAILABLE');
            return endpoint.start(action);
          },
          document: { id: documentId, source: { type: 'pptx', name: '', size: source.file.size, lastModified: source.file.lastModified, fingerprint }, knownSlideCount: slideIds.length, slideIds,
            lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false } });
        if (controller.signal.aborted) { instance.dispose(); return; }
        runtime.current = instance;
        restored.current = JSON.stringify(current.current.pptx?.checkpoint ?? null);
        const overlay = createPptxLayer(instance.width, instance.height, slideId); shadow.append(overlay.root);
        const fit = () => {
          if (!instance) return;
          const scale = Math.min(container.clientWidth / instance.width, container.clientHeight / instance.height);
          surface.style.cssText = `position:absolute;left:${(container.clientWidth - instance.width * scale) / 2}px;top:${(container.clientHeight - instance.height * scale) / 2}px;width:${instance.width}px;height:${instance.height}px;transform-origin:top left;transform:scale(${scale});`;
          overlay.root.style.cssText = surface.style.cssText + 'pointer-events:none;';
        }; fit(); observer = new ResizeObserver(fit); observer.observe(container);
        surface.dataset.slideId = slideId;
        setLayer(overlay);
        report(instance.sourceMediaUnavailable ? 'failed' : 'ready'); if (activeRef.current) consumer.update(current.current, instance);
      } catch { if (!controller.signal.aborted) { surface.replaceChildren(); report('failed'); } }
    })();
    return () => { consumer.dispose(); requests.current = null; reportPreparation.current = null; announceStatus.current = null; channel.close(); controller.abort(); observer?.disconnect();
      for (const endpoint of nativeEndpoints.current.values()) endpoint.dispose(); nativeEndpoints.current.clear(); mediaTransport.current = null;
      instance?.dispose(); runtime.current = null; shadow.replaceChildren(); };
  }, [sessionId, documentId, slideId, fingerprint, idsKey, key, sourceRevision, onStatus]);
  useEffect(() => {
    const instance = runtime.current;
    if (active) requests.current?.update(current.current, instance);
    const signature = JSON.stringify(current.current.pptx?.checkpoint ?? null);
    if (instance && !instance.busy && restored.current !== signature) { try { instance.restore(); restored.current = signature; } catch { onStatus('PPTX 재생 위치를 복원하지 못했습니다.'); } }
  }, [state.revision, onStatus, active]);
  useEffect(() => { if (active) announceStatus.current?.(); }, [active]);
  const mediaKey = JSON.stringify(state.media.filter(entry => entry.ref.embeddedSource).map(entry => [entry.ref.id, entry.ref.fingerprint, entry.ref.embeddedSource]));
  useEffect(() => {
    const instance = runtime.current; if (!instance || !layer || layer.slideId !== slideId) return;
    let disposed = false; const entries = current.current.media.filter(entry => entry.ref.embeddedSource);
    void Promise.all(entries.map(async entry => {
      try { const value = await instance.resolveMedia(entry.ref); if (!disposed) onMediaError(entry.ref.id, ''); return { id: entry.ref.id, scope: mediaScope, runtime: instance, ...value }; }
      catch { if (!disposed) onMediaError(entry.ref.id, 'PPTX 원본 미디어의 위치·형식을 확인하지 못했습니다. 원본을 다시 연결하거나 원본 앱에서 발표하세요.'); return null; }
    })).then(values => { if (!disposed) setMediaSlots(values.filter(value => value !== null)); });
    return () => { disposed = true; for (const entry of entries) onMediaError(entry.ref.id, ''); };
  }, [layer, mediaKey, slideId, mediaScope, onMediaError]);
  useEffect(() => {
    const instance = runtime.current;
    if (!instance || !layer || instance.busy && !instance.preparingMedia || current.current.pptx?.run || current.current.pptx?.request) return;
    let disposed = false;
    const preparing = instance.refreshMediaTimeline();
    const startedPreparation = instance.preparingMedia;
    if (startedPreparation) reportPreparation.current?.('loading');
    void preparing.then(result => {
      if (disposed || instance !== runtime.current) return;
      if (result === 'updated') reportPreparation.current?.('ready');
      else if (result === 'unavailable') reportPreparation.current?.('failed');
      else if (result === 'unchanged' && startedPreparation) reportPreparation.current?.('ready');
    }).catch(() => { if (!disposed && instance === runtime.current) reportPreparation.current?.('failed'); });
    return () => { disposed = true; };
  }, [layer, mediaKey, state.revision]);
  const lastEffect = useRef(effectRequest);
  useEffect(() => {
    if (lastEffect.current === effectRequest) return;
    lastEffect.current = effectRequest;
    const instance = runtime.current;
    if (activeRef.current) requests.current?.local(current.current, instance);
  }, [effectRequest, onStatus]);
  return <><div className={active ? 'pptx-audience-stage' : 'pptx-preparing-stage'} ref={host} />{layer?.slideId === slideId && createPortal(<OverlayLayer source={layer.source} overlays={state.overlays} />, layer.root)}
    {mediaSlots.map(slot => { const entry = state.media.find(entry => entry.ref.id === slot.id); return entry && slot.scope === mediaScope && slot.runtime === runtime.current && createPortal(<LocalMediaPlayer sessionId={sessionId} documentId={documentId} entry={entry} file={slot.file} asset={slot.asset} onError={onMediaError} onNative={registerNative} passive={!active} />, slot.target, slot.id); })}</>;
}
