import type { PlayerSnapshot } from '../core/playerSnapshot';
import type { SessionCommand } from '../core/commands';
import type { PptxCheckpointTransport } from '../adapters/pptx/durablePlayback';
import { sendSessionRequest } from '../shared/sessionClient';
import type { SessionRequest, SessionResponse } from '../shared/sessionMessages';

export function createPptxPlayerTransport(options: {
  sessionId: string;
  readSnapshot(): PlayerSnapshot | null;
  receiveSnapshot(snapshot: PlayerSnapshot): void;
  request?: (request: SessionRequest) => Promise<SessionResponse>;
  newId?: () => string;
}): PptxCheckpointTransport {
  return {
    newId: options.newId ?? (() => crypto.randomUUID()),
    snapshot() {
      const snapshot = options.readSnapshot();
      if (!snapshot || snapshot.sessionId !== options.sessionId) throw Error('PPTX_TRANSPORT_UNAVAILABLE');
      return structuredClone(snapshot);
    },
    async send(command: SessionCommand) {
      if (command.sessionId !== options.sessionId || !['BEGIN_PPTX_GROUP', 'BEGIN_REQUESTED_PPTX_GROUP', 'CHECKPOINT_PPTX_GROUP', 'CHECKPOINT_PPTX_MEDIA', 'CHECKPOINT_MEDIA'].includes(command.type)) return { ok: false };
      const before = options.readSnapshot();
      if (!before || before.sessionId !== options.sessionId) return { ok: false };
      const response = await (options.request ?? sendSessionRequest)({ type: 'SESSION_COMMAND', command });
      if (!response?.ok) return response && 'code' in response && response.code === 'STALE_REVISION' ? { ok: false, code: response.code } : { ok: false };
      if (response.kind !== 'player' || !response.snapshot || response.snapshot.sessionId !== options.sessionId
        || !Number.isSafeInteger(response.snapshot.revision) || response.snapshot.revision <= command.revision) return { ok: false };
      const latest = options.readSnapshot();
      if (latest && latest.sessionId !== options.sessionId) return { ok: false };
      // Runtime ACKs and subscription updates can arrive in either order.
      if (!latest || response.snapshot.revision >= latest.revision) options.receiveSnapshot(structuredClone(response.snapshot));
      return { ok: true, snapshot: structuredClone(response.snapshot) };
    },
  };
}
