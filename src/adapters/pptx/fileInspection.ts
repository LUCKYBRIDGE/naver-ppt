import type { PreflightReport } from '../../preflight/check';
import { readPptxInput } from './input';
import { readPptxPackageIsolated } from './isolatedPackage';
import { inspectPptxXml } from './packageGuard';
import { readPptxSlideOrder } from './slideOrder';
import { pptxMediaTimingMessage } from './mediaTiming';
import { pptxFontPreflight } from './fontMetadata';
import { createPptxLocalFontCheck, localPptxFontPreflight } from './localFonts';
import { withPptxPreparation } from './preparationAdmission';

export async function inspectPptxFile(file: File, signal: AbortSignal, inspectModel = false): Promise<PreflightReport> {
  return withPptxPreparation(signal, () => inspectPptxFileAdmitted(file, signal, inspectModel));
}
async function inspectPptxFileAdmitted(file: File, signal: AbortSignal, inspectModel: boolean): Promise<PreflightReport> {
  const input = await readPptxInput(file, signal);
  const checked = await readPptxPackageIsolated(input.bytes, { signal });
  const localFonts = createPptxLocalFontCheck();
  const summary = inspectPptxXml(checked.files, signal, localFonts.observe), parts = readPptxSlideOrder(checked.files);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  const report: PreflightReport = { documentId: crypto.randomUUID(), fingerprint: input.fingerprint, checkedAt: Date.now(), scope: 'document', environment: 'local-pptx-file-header-sha256-package-xml-order', items: [
    { id: 'pptx-file-source', category: 'offline', status: 'pass', message: '현재 로컬 원본의 헤더와 SHA-256을 확인했습니다. 원본을 덮어쓰거나 복사본을 저장하지 않았습니다.' },
    { id: 'pptx-file-package', category: 'visual', status: 'pass', message: `ZIP ${checked.entryCount}개 항목과 XML ${summary.xmlCount}개 항목의 구조를 검사했습니다. 안전성과 원본 충실도를 모두 보장하는 검사는 아닙니다.` },
    { id: 'pptx-file-order', category: 'visual', status: 'pass', message: `원본 XML 순서에서 ${parts.length}쪽을 확인했습니다. 발표 자료로 등록하지 않았습니다.` },
    { id: 'pptx-file-fidelity', category: 'visual', status: 'unknown', message: '렌더러·글꼴·줄바꿈·이미지와 PowerPoint 원본 화면 일치는 확인하지 않았습니다.' },
    { id: 'pptx-file-animation', category: 'behavior', status: summary.timingSlides ? 'warning' : 'unknown', message: `원본 타이밍 ${summary.timingSlides}쪽입니다. 효과·클릭 순서·재생 조건은 별도 검증이 필요합니다.` },
    { id: 'pptx-file-transition', category: 'behavior', status: summary.transitionSlides ? 'warning' : 'unknown', message: `원본 전환 ${summary.transitionSlides}쪽입니다. 원본 발표 순서와 자동 넘김은 확인하지 않았습니다.` },
    { id: 'pptx-file-media', category: 'media', status: summary.mediaTiming.audioNodes || summary.mediaTiming.videoNodes || summary.mediaTiming.commands || summary.mediaTiming.invalidNodes || summary.mediaTiming.trimNodes || summary.mediaTiming.unverifiedTimingNodes ? 'warning' : 'unknown', message: pptxMediaTimingMessage(summary.mediaTiming) },
    { id: 'pptx-file-links', category: 'offline', status: summary.externalRelationships ? 'warning' : 'unknown', message: `외부 참조 ${summary.externalRelationships}개(위험한 참조 ${summary.unsafeExternalRelationships}개)는 실행하지 않습니다. 전체 오프라인 사용은 별도 확인이 필요합니다.` },
    { id: 'pptx-file-restart', category: 'offline', status: 'unknown', message: '브라우저 재시작 후 원본 권한과 파일 복구는 확인하지 않았습니다.' },
  ] };
  report.items.push(...pptxFontPreflight(summary.fontMetadata));
  report.items.push(...localPptxFontPreflight(await localFonts.check(signal)));
  if (inspectModel) {
    const { inspectPptxModelIsolated } = await import('./isolatedModel');
    const model = await inspectPptxModelIsolated(input.bytes, { signal });
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (model.slides !== parts.length) throw Error('PPTX_MODEL_ORDER_COUNT_MISMATCH');
    report.environment += '/web-ppt-0.4.5-Worker-summary';
    report.items.push(
      { id: 'pptx-file-model', category: 'visual', status: 'pass', message: `후보 모델 ${model.slides}쪽·요소 ${model.elements}개의 개수를 확인했습니다. 원본 순서·누락·화면 일치를 보장하지 않습니다.` },
      { id: 'pptx-file-model-loss', category: 'visual', status: model.unsupported || model.unknownKinds ? 'warning' : 'unknown', message: `대체 요소 ${model.unsupported}개·미확인 종류 ${model.unknownKinds}개입니다. 미발견도 원본의 완전한 재현을 뜻하지 않습니다.` },
      { id: 'pptx-file-model-effects', category: 'behavior', status: model.animationSteps || model.transitions || model.hiddenSlides ? 'warning' : 'unknown', message: `모델 효과 ${model.animationSlides}쪽·${model.animationSteps}개, 전환 ${model.transitions}쪽, 숨김 ${model.hiddenSlides}쪽입니다. 원본 재생 검사는 아닙니다.` },
      { id: 'pptx-file-model-media', category: 'media', status: model.media ? 'warning' : 'unknown', message: `모델 미디어 ${model.media}개입니다. 미발견도 원본 미디어 부재를 뜻하지 않으며 재생은 검사하지 않았습니다.` },
    );
  }
  return report;
}
