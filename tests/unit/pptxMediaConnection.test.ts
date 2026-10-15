import { describe, expect, it, vi } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { connectPreparedPptxMedia, type PptxMediaConnectionActions } from '../../src/adapters/pptx/connectMedia';
import type { PreparedPptxMedia } from '../../src/adapters/pptx/embeddedMedia';
import type { LocalMediaRef } from '../../src/media/types';

function fixture(count = 2) {
  let session = fixtureSession(); session.documents.A!.source.type = 'pptx';
  const signal = new AbortController().signal;
  const input = { kind: 'audio' as const, mime: 'audio/wav' as const, fingerprint: 'b'.repeat(64) };
  const prepared: PreparedPptxMedia[] = Array.from({ length: count }, (_, i) => ({ slideId: 'A-2', sourceFingerprint: 'a'.repeat(64), sourcePart: 'ppt/slides/slide2.xml', elementPath: [i], file: new File([new Uint8Array(44)], 'Synthetic.wav'), input }));
  let id = 0;
  const actions: PptxMediaConnectionActions = {
    readSession: vi.fn(async () => session), inspect: vi.fn(async () => ({ ...input, durationSec: 4 })),
    add: vi.fn(async (latest, media) => { session = reduceSession(latest, { type: 'ADD_LOCAL_MEDIA', sessionId: latest.id, documentId: 'A', slideId: 'A-2', revision: latest.revision, commandId: 'add-' + media.id, media }, 10); }),
    remember: vi.fn(async () => {}), newId: () => 'media-' + ++id,
  };
  return { signal, prepared, actions, get session() { return session; } };
}
describe('PPTX explicit embedded media connection', () => {
  it('applies checked source settings only on new registration and preserves user settings on reconnect', async () => {
    const f = fixture(1), initial = { startSec: .1, endSec: 3.8, volume: .25, muted: true };
    f.actions.initialPlayback = vi.fn(() => initial);
    await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions);
    const stored = f.session.documents.A!.localMedia!['media-1']!;
    expect(stored.playback).toEqual(initial); initial.volume = 0; expect(stored.playback!.volume).toBe(.25);
    stored.playback!.volume = .75;
    await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions);
    expect(f.actions.initialPlayback).toHaveBeenCalledOnce(); expect(stored.playback!.volume).toBe(.75);
  });
  it('rejects invalid source settings in a later item before the first durable registration', async () => {
    const f = fixture(); f.actions.initialPlayback = vi.fn().mockReturnValueOnce({ startSec: 0, endSec: 4, volume: 1, muted: false })
      .mockReturnValueOnce({ startSec: 0, endSec: 5, volume: 1, muted: false });
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toMatchObject({ registered: 0 });
    expect(f.actions.add).not.toHaveBeenCalled(); expect(f.actions.remember).not.toHaveBeenCalled();
  });
  it('checks all native metadata before registration and preserves audience selection and bookmarks', async () => {
    const f = fixture(), before = structuredClone(f.session);
    expect(await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).toEqual({ registered: 2, reconnected: 0 });
    expect(f.session.presentedSelection).toEqual(before.presentedSelection); expect(f.session.editorSelection).toEqual(before.editorSelection);
    expect(f.session.documents.A!.mediaBookmarks).toEqual(before.documents.A!.mediaBookmarks);
    expect(vi.mocked(f.actions.inspect).mock.invocationCallOrder.at(-1)).toBeLessThan(vi.mocked(f.actions.add).mock.invocationCallOrder[0]!);
    expect(f.actions.remember).toHaveBeenCalledTimes(2);
  });
  it('reconnects exact occurrences without duplicate registration or resetting playback settings', async () => {
    const f = fixture(); await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions);
    const old = f.session.documents.A!.localMedia!['media-1']!; old.playback = { startSec: 1, endSec: 3, volume: .5, muted: true };
    f.session.documents.A!.mediaBookmarks['media-1'] = { mediaId: 'media-1', slideId: 'A-2', timeSec: 2, paused: true, replayPolicy: 'ask' };
    expect(await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).toEqual({ registered: 0, reconnected: 2 });
    expect(f.actions.add).toHaveBeenCalledTimes(2); expect(old.playback.startSec).toBe(1); expect(f.session.documents.A!.mediaBookmarks['media-1']!.timeSec).toBe(2);
  });
  it('does not register anything when a later native metadata check fails', async () => {
    const f = fixture(); vi.mocked(f.actions.inspect).mockResolvedValueOnce({ ...f.prepared[0]!.input, durationSec: 4 }).mockRejectedValueOnce(Error('codec failure'));
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toMatchObject({ registered: 0, reconnected: 0 });
    expect(f.actions.add).not.toHaveBeenCalled(); expect(f.actions.remember).not.toHaveBeenCalled();
  });
  it('rejects wrong source/slide, duplicate occurrences and 17 registrations before probing', async () => {
    for (const kind of ['source', 'slide', 'duplicate', 'limit']) {
      const f = fixture(kind === 'limit' ? 17 : 2);
      if (kind === 'source') f.prepared[0]!.sourceFingerprint = 'c'.repeat(64);
      if (kind === 'slide') f.prepared[0]!.slideId = 'A-1';
      if (kind === 'duplicate') f.prepared[1]!.elementPath = [0];
      await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toMatchObject({ registered: 0 });
      expect(f.actions.inspect).not.toHaveBeenCalled(); expect(f.actions.add).not.toHaveBeenCalled();
    }
  });
  it('cancels during metadata check with no registrations', async () => {
    const f = fixture(), controller = new AbortController();
    vi.mocked(f.actions.inspect).mockImplementation(async () => { controller.abort(); return { ...f.prepared[0]!.input, durationSec: 4 }; });
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, controller.signal, f.actions)).rejects.toMatchObject({ registered: 0 });
    expect(f.actions.add).not.toHaveBeenCalled();
  });
  it('reports acknowledged partial registration after cancellation instead of undoing durable metadata', async () => {
    const f = fixture(), controller = new AbortController(), add = f.actions.add;
    f.actions.add = async (latest, ref) => { await add(latest, ref); controller.abort(); };
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, controller.signal, f.actions)).rejects.toMatchObject({ registered: 1, reconnected: 0 });
    expect(Object.keys(f.session.documents.A!.localMedia!)).toEqual(['media-1']); expect(f.actions.remember).not.toHaveBeenCalled();
  });
  it('keeps committed references when vault retention fails and retry reconnects them', async () => {
    const f = fixture(); vi.mocked(f.actions.remember).mockRejectedValueOnce(Error('vault limit'));
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toMatchObject({ registered: 1 });
    expect(await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).toEqual({ registered: 1, reconnected: 1 });
  });
  it('rejects a corrupt stored asset reference and changed native duration', async () => {
    const f = fixture(1); await connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions);
    const stored: LocalMediaRef = f.session.documents.A!.localMedia!['media-1']!;
    stored.fingerprint = 'c'.repeat(64);
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toThrow('PPTX_MEDIA_RECONNECT_MISMATCH');
    stored.fingerprint = 'b'.repeat(64); stored.durationSec = 20;
    await expect(connectPreparedPptxMedia('A', 'A-2', f.prepared, f.signal, f.actions)).rejects.toThrow('재생 길이');
  });
});
