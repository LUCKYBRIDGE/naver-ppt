import { describe, expect, it, vi } from 'vitest';
import { createPptxPlayerTransport } from '../../src/player/pptxTransport';
import { fixtureSession } from '../fixtures/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import type { SessionCommand } from '../../src/core/commands';
import type { SessionResponse } from '../../src/shared/sessionMessages';
const command: SessionCommand = { type: 'BEGIN_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 4, commandId: 'begin' };
function fixture() {
  let snapshot = toPlayerSnapshot(fixtureSession());
  const response: SessionResponse = { ok: true, kind: 'player', snapshot: { ...structuredClone(snapshot), revision: 5 } };
  const request = vi.fn(async (): Promise<SessionResponse> => response), receiveSnapshot = vi.fn(value => { snapshot = value; });
  const transport = createPptxPlayerTransport({ sessionId: 'original', readSnapshot: () => snapshot, receiveSnapshot, request, newId: () => 'synthetic-id' });
  return { transport, request, receiveSnapshot, response, setSnapshot: (value: typeof snapshot) => { snapshot = value; } };
}
describe('PPTX product Player runtime transport', () => {
  it('passes cancellation checkpoints with exact Player fields and exposes explicit stale revision only', async () => {
    const f = fixture(), checkpoint: SessionCommand = { ...command, type: 'CHECKPOINT_MEDIA', mediaId: 'clip', epoch: 'native', timeSec: .5, paused: true, ended: false };
    expect(await f.transport.send(checkpoint)).toMatchObject({ ok: true });
    f.request.mockResolvedValue({ ok: false, code: 'STALE_REVISION', error: 'Synthetic' });
    expect(await f.transport.send(checkpoint)).toEqual({ ok: false, code: 'STALE_REVISION' });
  });
  it('allows a source native result through the same public ACK transport', async () => {
    const f = fixture(); const media: SessionCommand = { ...command, type: 'CHECKPOINT_PPTX_MEDIA', mediaId: 'clip', epoch: 'run', expectedMediaEpoch: null,
      playback: { startSec: 0, endSec: 4, volume: .25, muted: true }, timeSec: .5, paused: false, ended: false };
    expect(await f.transport.send(media)).toMatchObject({ ok: true }); expect(f.request).toHaveBeenCalledWith({ type: 'SESSION_COMMAND', command: media });
  });
  it('sends exact session command and updates only public Player ACK', async () => {
    const f = fixture(); expect(await f.transport.send(command)).toMatchObject({ ok: true, snapshot: { revision: 5 } });
    expect(f.request).toHaveBeenCalledWith({ type: 'SESSION_COMMAND', command }); expect(f.receiveSnapshot).toHaveBeenCalledOnce(); expect(f.transport.newId()).toBe('synthetic-id');
  });
  it('does not roll back a newer subscription revision with a late ACK', async () => {
    const f = fixture(); f.setSnapshot({ ...toPlayerSnapshot(fixtureSession()), revision: 8 });
    expect(await f.transport.send(command)).toMatchObject({ ok: true }); expect(f.receiveSnapshot).not.toHaveBeenCalled(); expect(f.transport.snapshot().revision).toBe(8);
  });
  it('clones runtime responses and reads to prevent client mutation', async () => {
    const f = fixture(), result = await f.transport.send(command); if (!result.ok) throw Error('Expected ACK'); result.snapshot.revision = 90;
    const snapshot = f.transport.snapshot(); snapshot.revision = 91; expect(f.transport.snapshot().revision).toBe(5);
  });
  it('rejects a cross-session command without requesting runtime', async () => {
    const f = fixture(); expect(await f.transport.send({ ...command, sessionId: 'other' })).toEqual({ ok: false }); expect(f.request).not.toHaveBeenCalled();
  });
  it('does not provide teacher/reset commands through playback transport', async () => {
    const f = fixture(); expect(await f.transport.send({ ...command, type: 'RESET_PPTX_SLIDE' })).toEqual({ ok: false }); expect(f.request).not.toHaveBeenCalled();
  });
  it.each([4, -1, NaN, 1.5])('rejects invalid/noncommitted ACK revision %s', revision => {
    const f = fixture(); if (f.response.ok && f.response.kind === 'player') f.response.snapshot.revision = revision;
    return expect(f.transport.send(command)).resolves.toEqual({ ok: false });
  });
  it('rejects cross-session ACK without publishing', async () => {
    const f = fixture(); if (f.response.ok && f.response.kind === 'player') f.response.snapshot.sessionId = 'other';
    expect(await f.transport.send(command)).toEqual({ ok: false }); expect(f.receiveSnapshot).not.toHaveBeenCalled();
  });
  it('rejects a teacher ACK rather than copying teacher data', async () => {
    const f = fixture(); f.request.mockResolvedValue({ ok: true, kind: 'teacher', session: fixtureSession() });
    expect(await f.transport.send(command)).toEqual({ ok: false }); expect(f.receiveSnapshot).not.toHaveBeenCalled();
  });
  it('retains snapshot on permission/storage failures and unavailable runtime', async () => {
    const f = fixture(); f.request.mockResolvedValue({ ok: false, code: 'NOT_PLAYER_OWNER', error: 'Synthetic' });
    expect(await f.transport.send(command)).toEqual({ ok: false }); expect(f.receiveSnapshot).not.toHaveBeenCalled();
    f.request.mockRejectedValue(Error('Synthetic connection')); await expect(f.transport.send(command)).rejects.toThrow('Synthetic connection'); expect(f.receiveSnapshot).not.toHaveBeenCalled();
  });
  it('rejects an old transport after the connected session changes', async () => {
    const f = fixture(); f.setSnapshot({ ...toPlayerSnapshot(fixtureSession()), sessionId: 'other' });
    expect(() => f.transport.snapshot()).toThrow('PPTX_TRANSPORT_UNAVAILABLE'); expect(await f.transport.send(command)).toEqual({ ok: false }); expect(f.receiveSnapshot).not.toHaveBeenCalled(); expect(f.request).not.toHaveBeenCalled();
  });
  it('does not write without a connected snapshot', async () => {
    const request = vi.fn(), transport = createPptxPlayerTransport({ sessionId: 'original', readSnapshot: () => null, receiveSnapshot: vi.fn(), request });
    expect(() => transport.snapshot()).toThrow('PPTX_TRANSPORT_UNAVAILABLE'); expect(await transport.send(command)).toEqual({ ok: false }); expect(request).not.toHaveBeenCalled();
  });
});
