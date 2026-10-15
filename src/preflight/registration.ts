import type { PresentationDocumentState } from '../core/types';
import type { PreflightReport } from './check';
export function registrationPreflight(document: PresentationDocumentState, parsedPageCount: number | null, now: number): PreflightReport {
  if (!['pdf', 'pptx'].includes(document.source.type) || !('fingerprint' in document.source) || !document.source.fingerprint || !/^[a-f0-9]{64}$/.test(document.source.fingerprint)
    || parsedPageCount !== null && (parsedPageCount !== document.knownSlideCount || !Number.isInteger(parsedPageCount) || parsedPageCount < 1 || parsedPageCount > 2000)) throw new Error('INVALID_REGISTRATION_CHECK');
  const pptx = document.source.type === 'pptx';
  return { documentId: document.id, fingerprint: document.source.fingerprint, checkedAt: now, environment: pptx ? 'local-pptx-import-header-sha256-package-xml-order' : 'local-pdf-import-header-sha256-parser', scope: 'registration', items: [
    { id: 'registration-source', category: 'offline', status: 'pass', message: `${pptx ? 'PPTX 패키지 헤더' : 'PDF 헤더'}와 원본 SHA-256을 확인했습니다. 원본은 덮어쓰지 않았습니다.` },
    { id: 'registration-pages', category: 'visual', status: parsedPageCount === null ? 'unknown' : 'pass', message: parsedPageCount === null ? '동일 원본을 다시 연결했습니다. 이번에는 페이지 파서를 다시 실행하지 않았습니다.' : `${pptx ? 'PPTX 원본 XML 순서에서' : 'PDF 파서에서'} ${parsedPageCount}쪽을 확인했습니다. 원본 화면과의 일치 검사는 아닙니다.` },
    { id: 'registration-media', category: 'media', status: 'unknown', message: '내장·연결 미디어의 실제 재생은 확인하지 않았습니다.' },
    { id: 'registration-behavior', category: 'behavior', status: 'unknown', message: '원본의 효과·클릭 순서·폼·스크립트 동작은 확인하지 않았습니다.' },
    { id: 'registration-offline', category: 'offline', status: 'unknown', message: '전체 자료의 오프라인 사용과 재시작 후 파일 권한은 확인하지 않았습니다.' },
  ] };
}
