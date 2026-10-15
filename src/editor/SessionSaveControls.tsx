import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { ClassSession } from '../core/types';
import { encodeSessionBundle } from '../storage/sessionBundle';
import { backupFilename, savePicker, saveSessionFile } from '../export/localFile';
import { extensionApi } from '../shared/extensionApi';
import { IndexedDbSaveJournal } from '../storage/saveJournal';
import { sendSessionRequest } from '../shared/sessionClient';
import { MAX_BUNDLE_BYTES } from '../storage/sessionBundle';

export function SessionSaveControls({ session, disabled, onWorking }: { session: ClassSession; disabled: boolean; onWorking?: (working: boolean) => void }) {
  const [working, setWorking] = useState(false), [status, setStatus] = useState('');
  const latestRevision = useRef(session.revision); latestRevision.current = session.revision;
  useEffect(() => { onWorking?.(working); return () => onWorking?.(false); }, [working, onWorking]);
  useEffect(() => {
    if (!working) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [working]);
  async function save() {
    setWorking(true); setStatus('파일 저장 확인 중');
    const revision = session.revision;
    try {
      const bytes = encodeSessionBundle(session), api = extensionApi();
      const result = await saveSessionFile(bytes, backupFilename(session.title, revision), {
        picker: savePicker(), downloads: api?.downloads, extensionId: api?.runtime.id,
        audit: { sessionId: session.id, revision, journal: new IndexedDbSaveJournal() },
      });
      setStatus(result.state === 'complete' ? `편집정보 r${revision} 저장 완료${result.journal === 'unrecorded' ? ' · 복구용 저장 기록은 남기지 못했습니다. 편집정보는 유지했습니다.' : ''}${latestRevision.current !== revision ? ' · 이후 변경은 추가 저장이 필요합니다.' : ''}`
        : result.state === 'cancelled' ? '저장을 취소했습니다. 편집정보는 유지했습니다.' : result.error);
    } catch (failure) { setStatus(failure instanceof Error ? failure.message : '편집정보 저장을 확인하지 못했습니다.'); }
    finally { setWorking(false); }
  }
  async function verify(file: File) {
    if (!file.size || file.size > MAX_BUNDLE_BYTES) { setStatus('편집정보 파일은 16MB까지 확인할 수 있습니다.'); return; }
    setWorking(true); setStatus('저장 파일 확인 중'); const url = URL.createObjectURL(file), revision = session.revision;
    try {
      const result = await sendSessionRequest({ type: 'VERIFY_SAVED_BACKUP', sessionId: session.id, revision, blobUrl: url });
      setStatus(result.ok && result.kind === 'backup-verification'
        ? `확정된 편집정보 r${result.verification.revision} 파일을 확인했습니다.${latestRevision.current !== revision ? ' 이후 변경은 추가 저장이 필요합니다.' : ''}`
        : !result.ok ? result.error : '파일 확인 결과를 받지 못했습니다.');
    } catch { setStatus('저장 파일을 확인하지 못했습니다. 기존 편집정보는 유지했습니다.'); }
    finally { URL.revokeObjectURL(url); setWorking(false); }
  }
  return <section className="session-save" aria-label="편집정보 로컬 저장">
    <div className="control-actions"><button disabled={disabled || working} onClick={() => void save()}><Download size={20} aria-hidden="true" /> 편집정보 저장</button></div>
    <label htmlFor="session-verify-file">저장 파일 확인</label>
    <input id="session-verify-file" type="file" accept=".wcp.json,application/json" disabled={disabled || working} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (file) void verify(file);
    }} />
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
