import { useState } from 'react';
import type { ClassSession, Selection } from '../core/types';
import { probeMedia } from '../media/input';
import { mediaKey, mediaVault } from '../media/source';
import { sendSessionRequest } from '../shared/sessionClient';
export function LocalMediaControls({ session, selected, disabled, onStatus }: { session: ClassSession; selected: Selection; disabled: boolean; onStatus: (text: string) => void }) {
  const [working, setWorking] = useState(false);
  async function attach(file: File, handle?: FileSystemFileHandle) {
    setWorking(true);
    try {
      const checked = await probeMedia(file), document = session.documents[selected.documentId];
      if (!document || !selected.slideId) throw new Error('편집할 페이지를 선택하세요.');
      const existing = Object.values(document.localMedia ?? {}).find(ref => ref.slideId === selected.slideId && ref.fingerprint === checked.fingerprint);
      const id = existing?.id ?? crypto.randomUUID();
      await mediaVault().remember(mediaKey(session.id, document.id, id), file, checked.fingerprint, handle);
      if (!existing) {
        const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'ADD_LOCAL_MEDIA', sessionId: session.id, documentId: document.id, slideId: selected.slideId,
          revision: session.revision, commandId: crypto.randomUUID(), media: { id, slideId: selected.slideId, name: file.name, size: file.size, lastModified: file.lastModified, ...checked } } });
        if (!result.ok) throw new Error(result.error);
      }
      onStatus(existing ? '같은 미디어를 다시 연결했습니다.' : '로컬 미디어를 연결했습니다. 재생은 정지 상태입니다.');
    } catch (failure) { onStatus(failure instanceof Error ? failure.message : '미디어를 연결하지 못했습니다.'); }
    finally { setWorking(false); }
  }
  const picker = (window as unknown as { showOpenFilePicker?: (options: unknown) => Promise<FileSystemFileHandle[]> }).showOpenFilePicker?.bind(window);
  return <section aria-label="로컬 미디어 연결">
    {picker ? <button disabled={disabled || working} onClick={() => {
      const pending = picker({ multiple: false, types: [{ description: '로컬 영상·음원', accept: { 'audio/wav': ['.wav'], 'audio/mpeg': ['.mp3'], 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] } }], excludeAcceptAllOption: true });
      setWorking(true); void pending.then(async handles => { if (handles[0]) await attach(await handles[0].getFile(), handles[0]); }).catch(() => onStatus('미디어 선택을 취소했거나 파일을 열지 못했습니다.')).finally(() => setWorking(false));
    }}>로컬 미디어 연결</button> : <><label htmlFor="local-media-input">로컬 미디어 연결·같은 원본 재연결</label><input id="local-media-input" type="file" accept=".wav,.mp3,.mp4,.webm" disabled={disabled || working} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void attach(file); }} /></>}
    {working && <p role="status">미디어 확인 중</p>}
  </section>;
}
