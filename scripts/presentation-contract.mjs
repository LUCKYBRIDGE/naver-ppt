import assert from 'node:assert/strict';

// Metadata/ownership probes deliberately do not prove actual surface readiness.
export async function holdPreparationForContract(page) {
  await page.addInitScript(() => {
    const api = window.whale ?? chrome, original = api.runtime.sendMessage.bind(api.runtime);
    api.runtime.sendMessage = (...args) => args[0]?.type === 'GET_PRESENTATION_TARGET' ? new Promise(() => {}) : original(...args);
  });
}
export async function commitPresentationContract(remote, player, documentId, slideId = null) {
  const sessionId = new URL(remote.url()).searchParams.get('sessionId');
  const send = (page, value) => page.evaluate(value => (window.whale ?? chrome).runtime.sendMessage(value), value);
  const owner = await send(player, { type: 'CLAIM_PLAYER', sessionId }); assert(owner.ok && owner.owned);
  const read = async () => { const response = await send(remote, { type: 'GET_SESSION', sessionId }); assert(response.ok); return response.session; };
  let session = await read(); slideId ??= session.documents[documentId].lastSlideId ?? session.documents[documentId].slideIds[0];
  const requestId = crypto.randomUUID();
  assert((await send(remote, { type: 'SESSION_COMMAND', command: { type: 'REQUEST_PRESENTATION', sessionId, documentId, slideId,
    revision: session.revision, commandId: requestId, playerId: owner.playerId } })).ok);
  session = await read();
  assert((await send(player, { type: 'SESSION_COMMAND', command: { type: 'COMMIT_PRESENTATION', sessionId, documentId, slideId,
    revision: session.revision, commandId: crypto.randomUUID(), requestId, playerId: owner.playerId } })).ok);
  return read();
}
