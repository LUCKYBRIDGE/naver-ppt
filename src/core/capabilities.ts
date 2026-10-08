import { sourceTypes } from './types';
import { adapterFeatures, type AdapterDescriptor } from '../adapters/types';

// 도입 예정 형식 목록이다. 실행 가능한 renderer 등록 목록은 아니다.
export const adapterPlans: AdapterDescriptor[] = sourceTypes.map((sourceType) => ({
  sourceType,
  features: Object.fromEntries(adapterFeatures.map((feature) => [feature, {
    level: 'unverified',
    evidence: null,
    limitation: '개발 기반만 구축됨. 기능 구현과 실기기 검증이 필요합니다.',
  }])) as AdapterDescriptor['features'],
}));
