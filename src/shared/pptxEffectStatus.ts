import type { PptxEffectStatus } from '../player/pptxRequests';

export const effectMessages: Record<PptxEffectStatus, string> = {
  loading: 'PPTX 효과 준비 중입니다.', ready: '다음 효과를 요청할 수 있습니다.',
  held: '이전 요청을 보류했습니다. 취소한 뒤 다시 요청하세요.', running: '효과를 재생하고 있습니다.',
  completed: '효과를 확정했습니다.', cancelled: '효과를 취소하고 마지막 확정 화면을 복원했습니다.',
  failed: '효과를 확정하지 못했습니다. 취소 후 다시 요청하거나 원본을 다시 연결하세요.',
  exhausted: '현재 쪽의 효과를 모두 재생했습니다. 다음 페이지로 이동하세요.',
};
export interface EffectFeedback { status: PptxEffectStatus; revision: number }
export function readEffectFeedback(value: unknown): EffectFeedback | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as EffectFeedback;
  return Object.keys(v).length === 2 && Object.hasOwn(effectMessages, v.status)
    && Number.isSafeInteger(v.revision) && v.revision >= 0 ? { status: v.status, revision: v.revision } : null;
}
// Ephemeral UI feedback only. Commands and playback authority always use strict runtime/DB.
export function effectChannel(sessionId: string, documentId: string, slideId: string) {
  return new BroadcastChannel(`pptx-effect:${JSON.stringify([sessionId, documentId, slideId])}`);
}
