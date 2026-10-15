import type { PresentationDocumentState } from '../core/types';
export type PreflightCategory = 'visual' | 'media' | 'behavior' | 'offline';
export interface PreflightItem { id: string; category: PreflightCategory; status: 'pass' | 'warning' | 'unknown' | 'error'; message: string }
export interface PreflightReport { documentId: string; fingerprint: string | null; checkedAt: number; environment: string; scope: 'registration' | 'sample' | 'document'; items: PreflightItem[] }
export interface PdfInspection { pageCount: number; inspectedPages: number[]; externalLinks: number; scripts: boolean; annotationKinds: string[]; cached?: boolean; renderedPages?: number }
export interface PreflightInspector {
  pdf(document: PresentationDocumentState, pages: number[], signal: AbortSignal): Promise<PdfInspection>;
  media(document: PresentationDocumentState, mediaId: string, signal: AbortSignal): Promise<{ durationSec: number }>;
}
export async function checkPreflight(document: PresentationDocumentState, currentPage: number, inspector: PreflightInspector, signal: AbortSignal, environment: string, now: number, mode: 'sample' | 'document' = 'sample'): Promise<PreflightReport> {
  if (!['sample', 'document'].includes(mode)) throw new Error('INVALID_PREFLIGHT_MODE');
  const report: PreflightReport = { documentId: document.id, fingerprint: document.source.type === 'pdf' ? document.source.fingerprint ?? null : null, checkedAt: now, environment, scope: mode, items: [] };
  const add = (id: string, category: PreflightCategory, status: PreflightItem['status'], message: string) => report.items.push({ id, category, status, message });
  const abort = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); }; abort();
  if (document.source.type !== 'pdf') {
    for (const category of ['visual', 'media', 'behavior', 'offline'] as const) add(`unsupported-${category}`, category, 'unknown', '이 형식의 사전 점검은 아직 검증하지 않았습니다.');
    return report;
  }
  const count = document.knownSlideCount;
  if (!Number.isInteger(count) || !count || count < 1 || count > 2000 || !Number.isInteger(currentPage) || currentPage < 1 || currentPage > count) throw new Error('INVALID_PREFLIGHT_TARGET');
  const pages = mode === 'document' ? Array.from({ length: count }, (_, index) => index + 1) : [...new Set([1, currentPage, count])].sort((a, b) => a - b);
  try {
    const pdf = await inspector.pdf(document, pages, signal); abort();
    if (pdf.pageCount !== count || JSON.stringify(pdf.inspectedPages) !== JSON.stringify(pages)) throw new Error('PDF_STRUCTURE_CHANGED');
    add('pdf-read', 'visual', 'pass', `${pages.length}/${count}쪽 읽기를 확인했습니다.`);
    add('pdf-render', 'visual', pdf.renderedPages === pages.length ? 'pass' : 'unknown', pdf.renderedPages === pages.length ? `${pages.length}/${count}쪽의 실제 Canvas 렌더를 확인했습니다. 원본 화면 일치 검사는 아닙니다.` : '실제 페이지 렌더를 확인하지 않았습니다.');
    if (pdf.cached) add('pdf-cache', 'visual', 'pass', '페이지 읽기 결과: 동일 원본·범위·환경의 캐시 사용');
    add('pdf-fidelity', 'visual', 'unknown', '전체 페이지의 글꼴·이미지·줄바꿈과 원본 화면 일치는 확인하지 않았습니다.');
    add('pdf-actions', 'behavior', pdf.scripts || pdf.annotationKinds.some(kind => ['RichMedia', 'Movie', 'Sound', 'Screen', 'Widget'].includes(kind)) ? 'warning' : 'unknown', pdf.scripts ? '문서 스크립트가 있습니다. 자체 Player에서 원본 동작을 보장하지 않습니다.' : '원본의 클릭 순서·효과·폼·내장 미디어 동작은 보장하지 않습니다.');
    add('pdf-links', 'offline', pdf.externalLinks ? 'warning' : 'unknown', pdf.externalLinks ? `검사한 페이지에 외부 링크 ${pdf.externalLinks}개가 있습니다.` : mode === 'document' ? '전체 페이지 annotation에서 외부 링크를 발견하지 못했습니다. 모든 온라인 의존성 검사는 아닙니다.' : '검사한 페이지에 외부 링크를 발견하지 못했습니다. 전체 문서 검사는 아닙니다.');
    add('pdf-source', 'offline', 'pass', '현재 창에서 로컬 PDF 원본을 읽을 수 있습니다.');
  } catch (error) { abort(); add('pdf-source', 'offline', 'error', 'PDF 원본을 읽지 못했거나 등록 내용과 다릅니다. 같은 원본을 다시 연결하세요.'); add('pdf-read', 'visual', 'unknown', '페이지 읽기와 화면 점검을 완료하지 못했습니다.'); add('pdf-actions', 'behavior', 'unknown', '원본 발표 동작을 확인하지 못했습니다.'); }
  const media = Object.values(document.localMedia ?? {}); let available = 0;
  for (const ref of media) {
    abort();
    try { const result = await inspector.media(document, ref.id, signal); abort(); if (!Number.isFinite(result.durationSec) || Math.abs(result.durationSec - ref.durationSec) > .1) throw new Error('MEDIA_CHANGED'); available++; }
    catch { abort(); add(`media-${ref.id}`, 'media', 'error', `${ref.name}: 로컬 원본 또는 재생 길이를 확인하지 못했습니다.`); }
  }
  add('media-metadata', 'media', media.length ? available === media.length ? 'pass' : 'warning' : 'unknown', media.length ? `연결 미디어 ${available}/${media.length}개의 원본과 재생 길이를 확인했습니다. 실제 소리·영상 재생 검사는 아닙니다.` : '별도 연결 미디어가 없습니다. PDF 내장 미디어 유무는 확정하지 않았습니다.');
  add('offline-restart', 'offline', 'unknown', '브라우저 재시작 후 파일 권한과 완전 오프라인 사용은 별도 확인이 필요합니다.');
  return report;
}
