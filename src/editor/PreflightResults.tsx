import type { PreflightReport } from '../preflight/check';
const labels = { visual: '화면', media: '미디어', behavior: '발표 동작', offline: '오프라인' };
const statuses = { pass: '확인', warning: '주의', unknown: '미확인', error: '문제' };
export function PreflightResults({ report }: { report: PreflightReport }) {
  return <><p className="preflight-scope">{report.scope === 'document' ? '전체 페이지 점검' : report.scope === 'sample' ? '일부 페이지 점검' : '등록 기본 점검'}</p><ul className="preflight-results">{report.items.map(item => <li key={item.id} data-result={item.status}><strong>{labels[item.category]} · {statuses[item.status]}</strong><span>{item.message}</span></li>)}</ul></>;
}
