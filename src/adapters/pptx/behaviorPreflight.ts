import type { PreflightReport } from '../../preflight/check';
import { runPptxParserJob } from './isolatedModel';
import { hydratePptxAssets } from './assetModel';
import { bindPptxRotations } from './rotationBehavior';
import { bindPptxScales } from './scaleBehavior';

// Package/XML/order guards must run first. This inspection never plays effects.
export async function inspectPptxTransformReadiness(bytes: Uint8Array, files: Record<string, Uint8Array>, parts: readonly string[], signal?: AbortSignal): Promise<PreflightReport['items']> {
  const decoder = new TextDecoder();
  const candidates = parts.flatMap((part, index) => {
    const xml = files[part] ? decoder.decode(files[part]) : '';
    return /<(?:[\w.-]+:)?anim(?:Rot|Scale)\b/.test(xml) ? [{ index, xml }] : [];
  });
  if (!candidates.length) return [];
  const assets = await runPptxParserJob(bytes, signal ? { signal } : {}, 'presentation', hydratePptxAssets);
  try {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (assets.model.slides.length !== parts.length) throw Error('PPTX_MODEL_ORDER_COUNT_MISMATCH');
    const blocked: number[] = [];
    for (const { index, xml } of candidates) {
      if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
      const steps = assets.model.slides[index]!.animations ?? [];
      try { bindPptxRotations(xml, steps); bindPptxScales(xml, steps); }
      catch { blocked.push(index + 1); }
    }
    return [{ id: 'pptx-transform-readiness', category: 'behavior', status: blocked.length ? 'warning' : 'unknown',
      message: blocked.length
        ? `회전·확대 효과를 준비할 수 없는 쪽 ${blocked.length}개: ${blocked.slice(0, 20).join(', ')}${blocked.length > 20 ? ' 외' : ''}. 이 쪽은 발표 화면을 표시하지 못할 수 있습니다. 발표 전에 원본 앱에서 확인하거나 PDF로 내보낸 별도 자료를 추가하세요. 숨겨진 내용 보호를 위해 정적 화면으로 자동 전환하지 않습니다.`
        : `회전·확대 효과가 있는 ${candidates.length}쪽의 원본·모델 대응 검사를 통과했습니다. 실제 효과·클릭 순서·원본 화면 일치와 다른 효과의 지원을 보장하지 않습니다.` }];
  } finally { assets.dispose(); }
}
