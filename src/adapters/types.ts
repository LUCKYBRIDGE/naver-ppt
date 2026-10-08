import type { SourceType } from '../core/types';

export const adapterFeatures = [
  'open', 'page-count', 'current-page', 'goto-page', 'thumbnails',
  'embedded-media', 'effects', 'overlay', 'private-preview', 'export',
] as const;
export type AdapterFeature = (typeof adapterFeatures)[number];
export type SupportLevel = 'unverified' | 'experimental' | 'partial' | 'supported' | 'unsupported';

export interface FeatureSupport {
  level: SupportLevel;
  // supported/partial 판정에는 실행 환경과 시험 결과의 참조가 필요하다.
  evidence: string | null;
  limitation: string;
}

export interface AdapterDescriptor {
  sourceType: SourceType;
  features: Record<AdapterFeature, FeatureSupport>;
}

// renderer lifecycle/render/goto/export 실행 계약은 PDF 실험 결과로 확정한다.
