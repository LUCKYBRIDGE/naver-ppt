import assert from 'node:assert/strict';

// Actual product Remote UI; never injects a commit or renderer.
export async function presentPptx(remote, documentId, slideId = null) {
  await remote.locator('#remote-document').selectOption(documentId);
  if (slideId) await remote.locator('#remote-slide').selectOption(slideId);
  const button = slideId ? remote.getByRole('button', { name: '선택 페이지 발표', exact: true })
    : remote.getByRole('button', { name: /^(자료 발표|다시 발표)$/ });
  await button.click();
  const sessionId = new URL(remote.url()).searchParams.get('sessionId'), started = Date.now();
  while (Date.now() - started < 40000) {
    const response = await remote.evaluate(sessionId => (window.whale ?? chrome).runtime.sendMessage({ type: 'GET_SESSION', sessionId }), sessionId);
    assert(response.ok && response.kind === 'teacher');
    const session = response.session, target = slideId ?? session.documents[documentId].lastSlideId ?? session.documents[documentId].slideIds[0];
    if (!await button.isDisabled() && !session.presentationTransition && session.presentedSelection?.documentId === documentId && session.presentedSelection.slideId === target) return session;
    const statuses = await remote.getByRole('status').allTextContents();
    if (!session.presentationTransition && statuses.some(text => text.includes('전환이 적용되지 않았습니다.') || text.includes('발표 창을 먼저 열고'))) throw Error('PRODUCT_PRESENTATION_REJECTED');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error('PRODUCT_PRESENTATION_TIMEOUT');
}
