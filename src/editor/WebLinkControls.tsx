import { useEffect, useRef, useState } from 'react';
import type { ClassSession } from '../core/types';
import { isApprovedWebPresentationUrl } from '../core/webLinks';
import { sendSessionRequest } from '../shared/sessionClient';
import { registerPreparedDocument } from './registerDocument';

export function WebLinkControls({ session, disabled, onStatus }: { session: ClassSession; disabled: boolean; onStatus: (message: string) => void }) {
  const [type, setType] = useState<'canva' | 'miricanvas'>('canva');
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [working, setWorking] = useState(false);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    active.current?.abort();
    setUrl(''); setTitle(''); setType('canva'); setWorking(false);
  }, [session.id]);
  async function register() {
    if (!isApprovedWebPresentationUrl(type, url) || !title.trim() || title.length > 200) {
      onStatus('Canva 또는 미리캔버스의 HTTPS 링크와 자료 이름을 확인하세요.'); return;
    }
    setWorking(true);
    const controller = new AbortController(); active.current = controller;
    try {
      const id = crypto.randomUUID();
      await registerPreparedDocument(session.id, { id, source: { type, url, title: title.trim() }, lastSlideId: null,
        knownSlideCount: null, slideIds: [], slideDeltas: {}, mediaBookmarks: {}, dirty: false }, controller.signal, sendSessionRequest);
      setUrl(''); setTitle(''); onStatus('외부 자료 링크를 위치 정보로 저장했습니다. 외부 사이트를 열거나 학생 화면을 바꾸지 않았습니다.');
    } catch (error) { if (controller.signal.aborted) onStatus('링크 저장을 취소했습니다. 현재 발표 자료는 유지했습니다.'); else onStatus(error instanceof Error ? error.message : '외부 자료 링크를 저장하지 못했습니다.'); }
    finally { if (active.current === controller) active.current = null; setWorking(false); }
  }
  return <section className="import-controls" aria-label="외부 자료 링크 등록">
    <details>
      <summary>Canva / 미리캔버스 링크 저장</summary>
      <p>링크와 이름만 수업 세션에 보관합니다. 페이지 수를 임의로 만들지 않으며 외부 사이트는 자동으로 열지 않습니다.</p>
      <label htmlFor="web-source-type">서비스</label>
      <select id="web-source-type" value={type} disabled={disabled || working} onChange={event => setType(event.target.value as 'canva' | 'miricanvas')}>
        <option value="canva">Canva</option><option value="miricanvas">미리캔버스</option>
      </select>
      <label htmlFor="web-source-title">자료 이름</label>
      <input id="web-source-title" value={title} maxLength={200} disabled={disabled || working} onChange={event => setTitle(event.target.value)} />
      <label htmlFor="web-source-url">HTTPS 링크</label>
      <input id="web-source-url" type="url" value={url} maxLength={2048} disabled={disabled || working} onChange={event => setUrl(event.target.value)} />
      <button disabled={disabled || working || !url || !title.trim()} onClick={() => void register()}>{working ? '저장 중' : '링크 저장'}</button>
    </details>
  </section>;
}
