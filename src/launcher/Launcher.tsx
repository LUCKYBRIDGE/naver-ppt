import { useState } from 'react';
import { windowRoles, type WindowRole, type OpenWindowResult } from '../shared/windowMessages';

const labels: Record<WindowRole, string> = {
  player: '발표 창 열기',
  remote: '독립 리모컨 열기',
  editor: '비공개 편집창 열기',
};

export function Launcher() {
  const [status, setStatus] = useState('창 구조를 확인할 수 있습니다.');
  const [busy, setBusy] = useState(false);

  async function openWindow(role: WindowRole) {
    setBusy(true);
    try {
      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        setStatus('독립 창은 빌드한 확장 프로그램에서 열 수 있습니다.');
        return;
      }
      const result: OpenWindowResult | undefined = await chrome.runtime.sendMessage({
        type: 'OPEN_WINDOW', role,
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
      <p className="eyebrow">개발 기반 · 0.0.0</p>
      <h1>웨일 클래스 프레젠터</h1>
      <p>자료 재생·편집·저장은 다음 개발 단계에서 추가됩니다.</p>
      <div className="actions">
        {windowRoles.map((role) => (
          <button key={role} disabled={busy} onClick={() => void openWindow(role)}>
            {labels[role]}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite">{status}</p>
    </main>
  );
}
