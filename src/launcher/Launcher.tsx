import { useEffect, useState } from 'react';
import { windowRoles, type WindowRole, type OpenWindowResult } from '../shared/windowMessages';
import { sendSessionRequest } from '../shared/sessionClient';
import { extensionApi } from '../shared/extensionApi';
import type { SessionSummary } from '../shared/sessionMessages';
import { decodeSessionBundle, MAX_BUNDLE_BYTES } from '../storage/sessionBundle';

const labels: Record<WindowRole, string> = {
  player: '발표 창 열기',
  remote: '독립 리모컨 열기',
  editor: '비공개 편집창 열기',
};

export function Launcher() {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selected, setSelected] = useState('');

  async function refresh() {
    try {
      const result = await sendSessionRequest({ type: 'LIST_SESSIONS' });
      if (result.ok && result.kind === 'list') setSessions(result.sessions);
      else if (!result.ok) setStatus(result.error);
    } catch (error) { setStatus(error instanceof Error ? error.message : '수업 목록을 읽지 못했습니다.'); }
  }
  useEffect(() => { void refresh(); }, []);
  async function create() {
    setBusy(true);
    try {
      const result = await sendSessionRequest({ type: 'CREATE_SESSION', title: title.trim() });
      if (result.ok && result.kind === 'teacher') {
        setSelected(result.session.id); setTitle(''); setStatus('수업을 저장했습니다.'); await refresh();
      } else if (!result.ok) setStatus(result.error);
    } catch (error) { setStatus(error instanceof Error ? error.message : '수업을 만들지 못했습니다.'); }
    finally { setBusy(false); }
  }

  async function restore(file: File) {
    setBusy(true);
    try {
      if (!file.size || file.size > MAX_BUNDLE_BYTES) throw new Error('편집정보 파일은 16MB까지 불러올 수 있습니다.');
      const bundle = decodeSessionBundle(new Uint8Array(await file.arrayBuffer()));
      const result = await sendSessionRequest({ type: 'IMPORT_SESSION', bundle });
      if (result.ok && result.kind === 'teacher') {
        setSelected(result.session.id); setStatus('새 복구 수업을 만들었습니다. 편집창에서 같은 원본을 다시 연결하세요.'); await refresh();
      } else if (!result.ok) setStatus(result.error);
    } catch (failure) { setStatus(failure instanceof Error ? failure.message : '편집정보를 복구하지 못했습니다. 기존 수업은 유지했습니다.'); }
    finally { setBusy(false); }
  }

  async function openWindow(role: WindowRole) {
    setBusy(true);
    try {
      const api = extensionApi();
      if (!api) {
        setStatus('수업에 연결할 수 없습니다. 웨일에서 다시 열어주세요.');
        return;
      }
      const result: OpenWindowResult | undefined = await api.runtime.sendMessage({
        type: 'OPEN_WINDOW', role, sessionId: selected,
      });
      setStatus(result?.ok ? `${labels[role]} 완료` : (result?.error ?? '응답이 없습니다.'));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '창을 열지 못했습니다.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="launcher">
      <p className="eyebrow">수업</p>
      <h1>naver-ppt</h1>
      <form onSubmit={event => { event.preventDefault(); void create(); }}>
        <label htmlFor="lesson-title">새 수업 이름</label>
        <input id="lesson-title" value={title} maxLength={200} onChange={event => setTitle(event.target.value)} disabled={busy} />
        <button disabled={busy || !title.trim()} type="submit">수업 만들기</button>
      </form>
      <label htmlFor="lesson-select">최근 수업</label>
      <select id="lesson-select" value={selected} disabled={busy} onChange={event => setSelected(event.target.value)}>
        <option value="">수업 선택</option>
        {sessions.map(session => <option key={session.id} value={session.id}>{session.title}</option>)}
      </select>
      <label htmlFor="session-import">편집정보 불러오기</label>
      <input id="session-import" type="file" accept=".wcp.json,application/json" disabled={busy} onChange={event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (file) void restore(file);
      }} />
      <div className="actions">
        {windowRoles.map((role) => (
          <button key={role} disabled={busy || !selected} onClick={() => void openWindow(role)}>
            {labels[role]}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
