import { renderSlideToSvg } from '@web-ppt/core';
import type { AnimStep } from '@web-ppt/core';
import { PresentationState, playGroup } from '@web-ppt/viewer-core';
import type { PresentationDocumentState } from '../../core/types';
import { loadPptxSourceModel } from './sourceModel';
import { bindPptxSlideModel } from './modelBinding';
import { createPptxEngineDriver } from './engineDriver';
import { PptxDurablePlayback, type PptxCheckpointTransport } from './durablePlayback';
import { parseDisplaySvg } from './svgBoundary';
import { pptxModelPreflight } from './preflight';
import { preparePptxEmbeddedMedia, matchPptxEmbeddedMedia } from './embeddedMedia';
import { PptxMediaSlots, pptxMediaElement } from './mediaSlots';
import type { PlayerSnapshot } from '../../core/playerSnapshot';
import { inspectPptxSourceOrder } from './sourceOrder';
import { bindPptxSourceShapeGroups } from './sourceShapeGroups';
import { preparePptxSourceMediaCalls } from './sourceMediaCalls';
import { preparePptxSourceTimeline, sourceTimelineMediaBinding } from './sourceTimeline';
import { createPptxSourceGroupDriver } from './sourceGroupDriver';
import { startPptxDelayedMediaAction } from './mediaCallDelay';
import type { PptxAnimationPlayback } from './animationRun';
import type { PptxMediaAction } from '../../core/pptxMediaAction';
import { mediaPlayback } from '../../media/validation';
import { borrowedMediaKey, createBorrowedMediaUrl, type BorrowedMediaUrl } from '../../media/borrowedUrl';

export async function openPptxRuntime(options: { file: File; signal: AbortSignal; document: PresentationDocumentState; slideId: string;
  sessionId: string; root: HTMLElement; transport: PptxCheckpointTransport;
  startMedia?: (mediaId: string, action: PptxMediaAction) => PptxAnimationPlayback }) {
  const source = await loadPptxSourceModel(options.file, options.signal);
  let engine: ReturnType<typeof createPptxEngineDriver> | undefined;
  const slots = new PptxMediaSlots(options.root);
  try {
    const selected = bindPptxSlideModel(options.document, source.fingerprint, source.parts, source.model).get(options.slideId);
    const inspection = pptxModelPreflight(options.document, source.fingerprint, source.parts, source.model, source.inspection, Date.now());
    const sourceXml = new TextDecoder().decode(source.files[selected.sourcePart]);
    let sourceOrder: ReturnType<typeof inspectPptxSourceOrder> | null = null;
    try { sourceOrder = inspectPptxSourceOrder(sourceXml, selected.slide.animations ?? [], options.signal); }
    catch { if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); }
    inspection.items.push({ id: 'pptx-source-order', category: 'behavior', status: sourceOrder ? 'warning' : 'unknown',
      message: sourceOrder ? `현재 쪽의 원본 순서 구조 ${sourceOrder.groups.length}개 중 미디어 전용 ${sourceOrder.mediaOnlyGroups}개, 독립 미디어 ${sourceOrder.independentMedia.length}개입니다. 모델 효과의 대상·종류·시작 관계만 대응했으며 원본 시간·미디어 실행은 미확인입니다.`
        : '원본 순서 구조와 모델 효과의 대응을 확인하지 못했습니다. 원본 클릭 순서와 미디어 실행은 미확인입니다.' });
    const visible = (state: PresentationState) => {
      for (const node of options.root.querySelectorAll<SVGElement>('[data-el]')) node.style.visibility = state.hiddenElementIds.has(Number(node.getAttribute('data-el'))) ? 'hidden' : '';
    };
    engine = createPptxEngineDriver<AnimStep, PresentationState>({ root: options.root, sourceXml,
      createState: () => new PresentationState(source.model, { index: selected.index, skipHidden: false, animate: true, autoAdvance: false }),
      paint(state) {
        const svg = parseDisplaySvg(renderSlideToSvg(source.model, state.slide, { textMode: 'html', media: 'badge', includeNotes: false }), source.ownedUrls);
        svg.style.width = '100%'; svg.style.height = '100%'; slots.paint(svg); visible(state);
      }, visible, playGroup: group => playGroup(options.root, [...group]),
    });
    let sourceShapeGroups: ReturnType<typeof bindPptxSourceShapeGroups> | null = null;
    try {
      if (sourceOrder) {
        const mapped = bindPptxSourceShapeGroups(sourceOrder.groups, selected.slide.animations ?? [], options.signal);
        if (mapped.filter(group => group.shapeGroup !== null).length === engine.driver.totalGroups) sourceShapeGroups = mapped;
      }
    } catch { if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); }
    inspection.items.push({ id: 'pptx-source-shape-groups', category: 'behavior', status: sourceShapeGroups ? 'warning' : 'unknown',
      message: sourceShapeGroups ? '원본 구조 그룹과 공식 엔진의 도형 그룹이 정확히 대응합니다. 원본 시간 조건과 미디어 실행은 아직 미확인입니다.'
        : '원본 구조 그룹과 공식 엔진의 도형 그룹 대응을 확인하지 못했습니다. 원본 그룹 기준 재생은 사용할 수 없습니다.' });
    const inputKey = (snapshot: PlayerSnapshot) => JSON.stringify([snapshot.sessionId, snapshot.selection, snapshot.sourceFingerprint,
      snapshot.media.filter(entry => entry.ref.embeddedSource).map(entry => [sourceTimelineMediaBinding(entry.ref), mediaPlayback(entry.ref)]).sort((a, b) => String(a[0]).localeCompare(String(b[0])))]);
    const initialSnapshot = options.startMedia ? options.transport.snapshot() : null;
    let sourceTimeline: Awaited<ReturnType<typeof preparePptxSourceTimeline>> | null = null;
    if (options.startMedia && sourceOrder?.groups.some(group => group.media.some(target => target.node === 'cmd'))) {
      try { sourceTimeline = await preparePptxSourceTimeline(options.document, source, options.slideId, initialSnapshot!, options.signal); }
      catch { if (options.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); }
    }
    let disposed = false, refreshGeneration = 0, sourceReady = sourceTimeline !== null;
    let preparedKey = initialSnapshot ? inputKey(initialSnapshot) : '';
    let pending: { key: string; result: Promise<'updated' | 'unchanged' | 'deferred' | 'unavailable'> } | null = null;
    const makeDriver = (timeline: NonNullable<typeof sourceTimeline>) => createPptxSourceGroupDriver(engine!.driver, timeline.groups.map(group => ({
      timingId: group.timingId, shapeGroup: group.shapeGroup, startMedia() {
        const epoch = options.transport.snapshot().pptx?.run?.epoch;
        const current = () => !options.signal.aborted && !!epoch && options.transport.snapshot().pptx?.run?.epoch === epoch;
        const owned: PptxAnimationPlayback[] = [];
        const cancel = () => { for (const playback of owned) playback.cancel(); };
        try {
          for (const call of group.actions) owned.push(startPptxDelayedMediaAction(call.delayMs, current, () => {
            const entry = options.transport.snapshot().media.find(entry => entry.ref.id === call.mediaId);
            if (!entry || sourceTimelineMediaBinding(entry.ref) !== call.binding) throw Error('PPTX_SOURCE_MEDIA_CHANGED');
            return options.startMedia!(call.mediaId, call.action);
          }));
          return { finished: Promise.all(owned.map(playback => playback.finished)).then(() => undefined, error => { cancel(); throw error; }), cancel };
        } catch (error) { cancel(); throw error; }
      },
    })));
    // A saved source cursor may outlive a currently invalid media setting.
    // Restore verified media-only structural positions without authorizing any
    // old native call; corrected metadata can prepare the same runtime later.
    const recoveringSource = !sourceTimeline && initialSnapshot?.pptx?.checkpoint?.renderer === 'web-ppt-0.4.5/source-v1'
      && engine.driver.totalGroups === 0 && !!sourceShapeGroups?.length && sourceShapeGroups.every(group => group.shapeGroup === null)
      && sourceOrder?.groups.every(group => group.media.length > 0 && group.media.every(target => target.node === 'cmd'));
    let sourceMode = sourceTimeline !== null || recoveringSource === true;
    let driver = sourceTimeline ? makeDriver(sourceTimeline) : recoveringSource ? createPptxSourceGroupDriver(engine.driver,
      sourceShapeGroups!.map(group => ({ timingId: group.timingId, shapeGroup: null, startMedia(): PptxAnimationPlayback { throw Error('PPTX_SOURCE_MEDIA_UNAVAILABLE'); } }))) : engine.driver;
    inspection.items.push({ id: 'pptx-source-media-execution', category: 'behavior', status: sourceTimeline ? 'warning' : 'unknown',
      message: sourceTimeline ? '검사한 순차 미디어 클릭 그룹을 Player에서 실행합니다. 복합 도형·동시/seek 조건과 원본 충실도 전체는 미확인입니다.'
        : '원본 미디어 클릭 타임라인의 조건·설정·등록 대응을 확인하지 못했습니다. 원본 트리거는 실행하지 않습니다.' });
    const identity = { sessionId: options.sessionId, documentId: options.document.id, slideId: options.slideId, fingerprint: source.fingerprint };
    let bridge = new PptxDurablePlayback(options.root, driver, options.transport, identity);
    bridge.restore();
    const refreshMediaTimeline = (): Promise<'updated' | 'unchanged' | 'deferred' | 'unavailable'> => {
      if (disposed || options.signal.aborted) return Promise.reject(Error('PPTX_RUNTIME_DISPOSED'));
      if (!options.startMedia || !sourceOrder?.groups.some(group => group.media.some(target => target.node === 'cmd'))) return Promise.resolve('unchanged');
      const snapshot = options.transport.snapshot(), key = inputKey(snapshot);
      if (bridge.isBusy || snapshot.pptx?.run || snapshot.pptx?.request) return Promise.resolve('deferred');
      if (key === preparedKey) return Promise.resolve('unchanged');
      if (pending?.key === key) return pending.result;
      const generation = ++refreshGeneration;
      const result = (async () => {
        try {
          const timeline = await preparePptxSourceTimeline(options.document, source, options.slideId, snapshot, options.signal);
          if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
          const latest = options.transport.snapshot();
          if (generation !== refreshGeneration || key !== inputKey(latest) || bridge.isBusy || latest.pptx?.run || latest.pptx?.request) return 'deferred';
          if (latest.pptx?.checkpoint && latest.pptx.checkpoint.renderer !== 'web-ppt-0.4.5/source-v1') { preparedKey = key; return 'unavailable'; }
          const nextDriver = makeDriver(timeline), nextBridge = new PptxDurablePlayback(options.root, nextDriver, options.transport, identity);
          nextBridge.restore();
          bridge.invalidate(); driver = nextDriver; bridge = nextBridge; sourceTimeline = timeline; sourceMode = true; sourceReady = true; preparedKey = key;
          const item = inspection.items.find(item => item.id === 'pptx-source-media-execution')!;
          item.status = 'warning'; item.message = '현재 연결한 미디어로 순차 원본 클릭 그룹을 다시 준비했습니다. 복합 조건·원본 충실도 전체는 미확인입니다.';
          return 'updated';
        } catch {
          if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
          const latest = options.transport.snapshot();
          if (generation !== refreshGeneration || key !== inputKey(latest) || bridge.isBusy || latest.pptx?.run || latest.pptx?.request) return 'deferred';
          preparedKey = key;
          if (sourceMode) {
            sourceReady = false;
            const item = inspection.items.find(item => item.id === 'pptx-source-media-execution')!;
            item.status = 'unknown'; item.message = '현재 미디어 연결·설정으로 원본 클릭 그룹을 준비하지 못했습니다. 완료 위치는 보존했습니다. 연결과 설정을 확인하세요.';
            return 'unavailable';
          }
          return 'unchanged';
        } finally { if (generation === refreshGeneration) pending = null; }
      })();
      pending = { key, result }; return result;
    };
    let media: ReturnType<typeof preparePptxEmbeddedMedia> | undefined;
    const borrowedMedia = new Map<string, BorrowedMediaUrl>();
    return { width: source.model.width, height: source.model.height, get groups() { return driver.totalGroups; }, inspection, sourceOrder, sourceShapeGroups,
      get sourceMediaExecution() { return sourceReady; }, get sourceMediaUnavailable() { return sourceMode && !sourceReady; },
      get preparingMedia() { return pending !== null; }, refreshMediaTimeline,
      restore() { if (disposed) throw Error('PPTX_RUNTIME_DISPOSED'); bridge.restore(); },
      play(requestId?: string) {
        if (disposed) return Promise.reject(Error('PPTX_RUNTIME_DISPOSED'));
        if (pending || sourceMode && !sourceReady) return Promise.reject(Error('PPTX_SOURCE_MEDIA_UNAVAILABLE'));
        return bridge.play(requestId);
      },
      cancel() { if (disposed) throw Error('PPTX_RUNTIME_DISPOSED'); bridge.invalidate(); bridge.restore(); },
      get busy() { return bridge.isBusy || pending !== null; },
      async resolveSourceMediaCalls() {
        if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
        const calls = await preparePptxSourceMediaCalls(options.document, source, options.slideId, options.signal);
        if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
        return calls;
      },
      async resolveMedia(ref: PlayerSnapshot['media'][number]['ref']) {
        if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
        media ??= preparePptxEmbeddedMedia(options.document, source, options.signal, options.slideId).catch(error => { media = undefined; throw error; });
        const prepared = await media;
        if (disposed || options.signal.aborted) throw Error('PPTX_RUNTIME_DISPOSED');
        const found = prepared.find(item => item.input.fingerprint === ref.fingerprint && item.slideId === ref.slideId && ref.embeddedSource?.sourcePart === item.sourcePart
          && JSON.stringify(ref.embeddedSource.elementPath) === JSON.stringify(item.elementPath));
        if (!found) throw Error('PPTX_MEDIA_RECONNECT_MISMATCH');
        const checked = matchPptxEmbeddedMedia({ ...ref, name: found.file.name, size: found.file.size, lastModified: 0 }, prepared);
        const element = pptxMediaElement(selected.slide, checked.elementPath), key = borrowedMediaKey(ref);
        let asset = borrowedMedia.get(key);
        if (!asset) {
          asset = createBorrowedMediaUrl(source, element.media!.src!, ref, () => !disposed && !options.signal.aborted);
          borrowedMedia.set(key, asset);
        }
        return { file: checked.file, asset, target: slots.add(ref.id, element) };
      },
      dispose() { if (disposed) return; disposed = true; refreshGeneration++; bridge.invalidate(); slots.dispose(); engine!.dispose(); borrowedMedia.clear(); media = undefined; source.dispose(); options.root.replaceChildren(); },
    };
  } catch (error) { engine?.dispose(); source.dispose(); options.root.replaceChildren(); throw error; }
}
