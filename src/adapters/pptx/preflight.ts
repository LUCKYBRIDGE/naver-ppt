import type { PresentationDocumentState } from '../../core/types';
import type { PreflightReport } from '../../preflight/check';
import { bindPptxSlideModel } from './modelBinding';
import { inspectPptxModel } from './modelInspection';
import { pptxMediaTimingMessage, type PptxMediaTimingSummary } from './mediaTiming';
import { pptxFontPreflight, type PptxFontMetadata } from './fontMetadata';

export function pptxModelPreflight(document: PresentationDocumentState, fingerprint: string, parts: readonly string[], model: { source: string; slides: readonly unknown[] },
  source: { timingSlides: number; transitionSlides: number; externalRelationships: number; unsafeExternalRelationships: number; mediaTiming?: PptxMediaTimingSummary; fontMetadata?: PptxFontMetadata }, now: number): PreflightReport {
  bindPptxSlideModel(document, fingerprint, parts, model);
  if (!Number.isSafeInteger(now) || now < 0 || ![source.timingSlides, source.transitionSlides].every(count => Number.isSafeInteger(count) && count >= 0 && count <= parts.length)
    || ![source.externalRelationships, source.unsafeExternalRelationships].every(count => Number.isSafeInteger(count) && count >= 0 && count <= 100000)
    || source.unsafeExternalRelationships > source.externalRelationships) throw new Error('PPTX_INVALID_INSPECTION_SOURCE');
  const summary = inspectPptxModel(model);
  const mediaTiming = pptxMediaTimingMessage(source.mediaTiming);
  return { documentId: document.id, fingerprint, checkedAt: now, scope: 'document', environment: 'web-ppt-0.4.5/Worker/local-pptx-model-summary', items: [
    { id: 'pptx-model', category: 'visual', status: 'pass', message: `원본 순서의 ${summary.slides}쪽과 등록 ID·모델 개수를 확인했습니다. 원본 화면 일치 검사는 아닙니다.` },
    { id: 'pptx-fallback', category: 'visual', status: summary.unsupported || summary.unknownKinds ? 'warning' : 'unknown', message: summary.unsupported || summary.unknownKinds ? `모델에 대체 요소 ${summary.unsupported}개와 미확인 종류 ${summary.unknownKinds}개가 있습니다. 일부 내용 또는 쪽이 손실되었을 수 있습니다.` : '모델에서 대체 요소를 발견하지 못했습니다. 누락된 원본 요소까지 확인한 것은 아닙니다.' },
    { id: 'pptx-fidelity', category: 'visual', status: 'unknown', message: '원본의 글꼴·줄바꿈·이미지·표·도형 재현과 PowerPoint 화면 일치는 확인하지 않았습니다.' },
    { id: 'pptx-animation', category: 'behavior', status: source.timingSlides || summary.animationSteps ? 'warning' : 'unknown', message: `원본 타이밍 ${source.timingSlides}쪽, 모델 효과 ${summary.animationSlides}쪽(${summary.animationSteps}개)입니다. 원본 조건·클릭 순서·재생은 별도 확인이 필요합니다.` },
    { id: 'pptx-transition', category: 'behavior', status: source.transitionSlides || summary.transitions ? 'warning' : 'unknown', message: `원본 전환 ${source.transitionSlides}쪽, 모델 전환 ${summary.transitions}쪽입니다. 원본 전환과 자동 넘김은 보장하지 않습니다.` },
    { id: 'pptx-hidden', category: 'behavior', status: summary.hiddenSlides ? 'warning' : 'unknown', message: summary.hiddenSlides ? `모델에 숨김 슬라이드 ${summary.hiddenSlides}쪽이 있습니다. 선택한 쪽과 원본 발표 순서를 확인하세요.` : '모델에서 숨김 슬라이드를 발견하지 못했습니다. 원본 발표 순서의 완전한 검사는 아닙니다.' },
    { id: 'pptx-media', category: 'media', status: summary.media ? 'warning' : 'unknown', message: summary.media ? `모델 미디어 ${summary.media}개를 발견했습니다. 원본 트리거·영상·소리 재생과 복원은 별도 확인이 필요합니다.` : '모델에서 미디어를 발견하지 못했습니다. 원본에 미디어가 없다는 뜻은 아닙니다.' },
    { id: 'pptx-source-media-timing', category: 'media', status: source.mediaTiming && (source.mediaTiming.audioNodes || source.mediaTiming.videoNodes || source.mediaTiming.commands || source.mediaTiming.invalidNodes || source.mediaTiming.trimNodes || source.mediaTiming.unverifiedTimingNodes) ? 'warning' : 'unknown', message: mediaTiming },
    { id: 'pptx-links', category: 'offline', status: source.externalRelationships ? 'warning' : 'unknown', message: `원본 외부 참조 ${source.externalRelationships}개(위험한 참조 ${source.unsafeExternalRelationships}개)는 실행하지 않습니다. 모델과 무관한 온라인 의존성도 확인해야 합니다.` },
    { id: 'pptx-restart', category: 'offline', status: 'unknown', message: '현재 로컬 검사 결과이며 브라우저 재시작 후 원본 권한과 완전 오프라인 사용은 확인하지 않았습니다.' },
    ...pptxFontPreflight(source.fontMetadata),
  ] };
}
