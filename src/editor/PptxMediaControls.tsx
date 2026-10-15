import { useEffect, useRef, useState } from 'react';
import type { ClassSession, Selection } from '../core/types';
import { probeMedia } from '../media/input';
import { mediaKey, mediaVault } from '../media/source';
import { sourceKey } from '../storage/sourceVault';
import { sendSessionRequest } from '../shared/sessionClient';
import { connectPreparedPptxMedia, PptxMediaConnectionError } from '../adapters/pptx/connectMedia';
import { preparePptxEmbeddedMedia } from '../adapters/pptx/embeddedMedia';
import { preparePptxSourceMediaSettings, sourceMediaPlayback } from '../adapters/pptx/sourceMediaSettings';

export function PptxMediaControls({ session, selected, disabled, onStatus, onWorking }: {
  session: ClassSession; selected: Selection; disabled: boolean; onStatus: (text: string) => void; onWorking: (value: boolean) => void;
}) {
  const [working, setWorking] = useState(false), active = useRef<AbortController | null>(null), live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; active.current?.abort(); onWorking(false); }; }, [onWorking]);
  async function attach() {
    if (active.current || !selected.slideId) return;
    const slideId = selected.slideId;
    const controller = new AbortController(), signal = controller.signal; active.current = controller; setWorking(true); onWorking(true);
    let source: Awaited<ReturnType<typeof import('../adapters/pptx/sourceModel').loadPptxSourceModel>> | undefined;
    try {
      const document = session.documents[selected.documentId]; if (!document || document.source.type !== 'pptx') throw Error('PPTX 자료를 선택하세요.');
      const [{ pptxSourceVault }, { loadPptxSourceModel }] = await Promise.all([
        import('../adapters/pptx/source'), import('../adapters/pptx/sourceModel'),
      ]);
      const file = await pptxSourceVault().get(sourceKey(session.id, document.id), document.source.fingerprint, signal);
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      source = await loadPptxSourceModel(file.file, signal);
      const prepared = await preparePptxEmbeddedMedia({ ...document, closed: false }, source, signal, slideId);
      const sourceSettings = await preparePptxSourceMediaSettings({ ...document, closed: false }, source, slideId, signal);
      const limitations = new Set<string>(sourceSettings.flatMap(item => item.settings.limitations));
      const counts = await connectPreparedPptxMedia(document.id, slideId, prepared, signal, {
        readSession: async () => { const response = await sendSessionRequest({ type: 'GET_SESSION', sessionId: session.id });
          if (!response.ok || response.kind !== 'teacher') throw Error(response.ok ? '편집 수업을 확인하지 못했습니다.' : response.error); return response.session; },
        inspect: probeMedia, newId: () => crypto.randomUUID(),
        initialPlayback: (media, duration) => {
          const found = sourceSettings.filter(item => item.target.sourcePart === media.sourcePart
            && item.target.mediaFingerprint === media.input.fingerprint && JSON.stringify(item.target.elementPath) === JSON.stringify(media.elementPath));
          if (found.length > 1) throw Error('내장 미디어의 원본 설정이 중복되었습니다.');
          if (!found.length) { limitations.add('unverified'); return undefined; }
          found[0]!.settings.limitations.forEach(value => limitations.add(value));
          return sourceMediaPlayback(found[0]!.settings, duration);
        },
        add: async (latest, media) => { const response = await sendSessionRequest({ type: 'SESSION_COMMAND', command: {
          type: 'ADD_LOCAL_MEDIA', sessionId: session.id, documentId: document.id, slideId,
          revision: latest.revision, commandId: crypto.randomUUID(), media } }); if (!response.ok) throw Error(response.error); },
        remember: (ref, media) => mediaVault().remember(mediaKey(session.id, document.id, ref.id), media, ref.fingerprint),
      });
      if (live.current) onStatus(prepared.length ? `내장 미디어 ${counts.registered}개 등록·${counts.reconnected}개 재연결했습니다. 새 등록에는 확인된 원본 구간·음량·음소거를 적용하고, 재연결 시 기존 설정과 재생 위치를 유지합니다. 자동으로 재생하지 않습니다.${limitations.size ? ' 일부 원본 설정은 미확인입니다. 여러 쪽 재생·정지 시 숨김은 지원하지 않으며, 원본 기본 음량·음소거가 미확인일 때는 수동 재생 기본값을 사용합니다.' : ''}` : '선택한 쪽에 연결 가능한 내장 미디어가 없습니다.');
    } catch (error) {
      if (live.current) onStatus(error instanceof PptxMediaConnectionError ? `${error.message} 저장된 등록 ${error.registered}개·재연결 ${error.reconnected}개는 유지했습니다. 다시 연결할 수 있습니다.`
        : error instanceof Error && error.name === 'AbortError' ? '내장 미디어 연결을 취소했습니다.' : error instanceof Error ? error.message : '내장 미디어를 연결하지 못했습니다.');
    } finally { source?.dispose(); active.current = null; if (live.current) { setWorking(false); onWorking(false); } }
  }
  return <section aria-label="PPTX 내장 미디어 연결">
    <button disabled={disabled || working} onClick={() => void attach()}>이 쪽의 내장 미디어 연결·재연결</button>
    <p>실험 기능입니다. 원본 영상 위치·효과 트리거는 아직 미확인입니다. 재생은 Player가 담당합니다.</p>
    {working && <><p role="status">내장 미디어 확인 중</p><button onClick={() => active.current?.abort()}>내장 미디어 연결 취소</button></>}
  </section>;
}
