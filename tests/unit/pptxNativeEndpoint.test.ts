import { describe, expect, it, vi } from 'vitest';
import { PptxNativeEndpoint } from '../../src/player/pptxNativeEndpoint';
import type { PptxCheckpointTransport } from '../../src/adapters/pptx/durablePlayback';
import { fixtureSession } from '../fixtures/session';
import { reduceSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { isSessionRequest } from '../../src/shared/sessionMessages';
import type { SessionCommand } from '../../src/core/commands';

function fixture() {
  let session = fixtureSession(); session.revision = 0; session.documents.A!.source.type = 'pptx';
  session.documents.A!.localMedia = { clip: { id: 'clip', slideId: 'A-2', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: 100,
    lastModified: 0, fingerprint: 'b'.repeat(64), durationSec: 4, playback: { startSec: .2, endSec: 3.8, volume: .25, muted: true },
    embeddedSource: { type: 'pptx', sourceFingerprint: 'a'.repeat(64), sourcePart: 'ppt/slides/slide2.xml', elementPath: [1] } } };
  session = reduceSession(session, { type: 'BEGIN_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 0, commandId: 'run' }, 2);
  let sequence = 0;
  const commit = (command: SessionCommand) => {
    expect(isSessionRequest({ type: 'SESSION_COMMAND', command })).toBe(true);
    session = reduceSession(session, command, 3);
    return { ok: true as const, snapshot: toPlayerSnapshot(session) };
  };
  const send = vi.fn<PptxCheckpointTransport['send']>(async command => commit(command));
  const transport: PptxCheckpointTransport = { snapshot: () => toPlayerSnapshot(session), send, newId: () => `native-${++sequence}` };
  const media = { readyState: 1, duration: 4, currentTime: .2, paused: true, ended: false,
    play: vi.fn(async () => { media.paused = false; }), pause: vi.fn(() => { media.paused = true; }) };
  const endpoint = new PptxNativeEndpoint(media as unknown as HTMLMediaElement, transport,
    { sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', fingerprint: 'b'.repeat(64) });
  const teacher = (type: 'PLAY_MEDIA' | 'PAUSE_MEDIA') => commit({ type, sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip',
    revision: session.revision, commandId: `teacher-${++sequence}` });
  return { endpoint, transport, media, send, commit, teacher, bookmark: () => transport.snapshot().media[0]!.bookmark,
    change: (edit: (value: typeof session) => void) => edit(session) };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Player native source action and durable bookmark boundary', () => {
  it('rejects a source occurrence replacement even when the asset fingerprint is unchanged', () => {
    const f = fixture(); f.change(value => { value.documents.A!.localMedia!.clip!.embeddedSource!.elementPath = [2]; });
    expect(() => f.endpoint.start({ type: 'play' })).toThrow(); expect(f.media.play).not.toHaveBeenCalled();
  });
  it('commits accepted native playback once and suppresses its own public ACK', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'playFrom', timeSec: 1.25 }).finished;
    expect(f.media.currentTime).toBe(1.25); expect(f.media.play).toHaveBeenCalledOnce();
    expect(f.bookmark()).toMatchObject({ timeSec: 1.25, paused: false, epoch: 'native-1', sourceRunEpoch: 'run' });
    expect(f.endpoint.suppressApply(f.bookmark())).toBe(true); expect(f.send).toHaveBeenCalledOnce();
  });
  it('retains stopped versus paused state over successive source calls', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'play' }).finished; f.media.currentTime = 2;
    await f.endpoint.start({ type: 'pause' }).finished; await f.endpoint.start({ type: 'resume' }).finished;
    expect(f.media.currentTime).toBe(2);
    await f.endpoint.start({ type: 'stop' }).finished; await f.endpoint.start({ type: 'togglePause' }).finished;
    expect(f.media.currentTime).toBe(.2); expect(f.media.paused).toBe(false);
  });
  it('holds a historical source bookmark in a fresh Player until a teacher requests playback', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'playFrom', timeSec: 1.25 }).finished;
    const fresh = new PptxNativeEndpoint(f.media as unknown as HTMLMediaElement, f.transport,
      { sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', fingerprint: 'b'.repeat(64) });
    expect(fresh.suppressApply(f.bookmark())).toBe(true); expect(f.media.paused).toBe(true); expect(f.media.play).toHaveBeenCalledOnce();
    await tick(); expect(f.bookmark()).toMatchObject({ paused: true, timeSec: 1.25 });
    f.teacher('PLAY_MEDIA'); expect(fresh.suppressApply(f.bookmark())).toBe(false);
  });
  it('preserves stopped state across a volume-only change', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'play' }).finished; f.media.currentTime = 2;
    await f.endpoint.start({ type: 'stop' }).finished;
    f.change(value => { value.documents.A!.localMedia!.clip!.playback!.volume = .6; });
    await f.endpoint.start({ type: 'togglePause' }).finished; expect(f.media.currentTime).toBe(.2);
  });
  it('reports failed historical pause persistence while keeping native playback stopped', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'play' }).finished; const report = vi.fn();
    f.send.mockResolvedValue({ ok: false, code: 'PERSISTENCE_FAILED' });
    const fresh = new PptxNativeEndpoint(f.media as unknown as HTMLMediaElement, f.transport,
      { sessionId: 'original', documentId: 'A', slideId: 'A-2', mediaId: 'clip', fingerprint: 'b'.repeat(64) }, report);
    fresh.suppressApply(f.bookmark()); await tick(); expect(report).toHaveBeenCalledOnce(); expect(f.media.paused).toBe(true);
  });
  it('retries only explicit stale revision with the same result command ID', async () => {
    const f = fixture(); f.send.mockImplementationOnce(async () => { f.change(value => { value.revision++; }); return { ok: false, code: 'STALE_REVISION' }; });
    await f.endpoint.start({ type: 'play' }).finished;
    expect(f.send).toHaveBeenCalledTimes(2); expect(f.send.mock.calls.map(([command]) => command.commandId)).toEqual(['native-1', 'native-1']);
    expect(f.send.mock.calls[1]![0].revision).toBe(2);
  });
  it('pauses on persistence failure without retry or fabricated completion', async () => {
    const f = fixture(); f.send.mockResolvedValue({ ok: false, code: 'PERSISTENCE_FAILED' });
    await expect(f.endpoint.start({ type: 'play' }).finished).rejects.toThrow();
    expect(f.send).toHaveBeenCalledOnce(); expect(f.media.paused).toBe(true); expect(f.bookmark()).toBeNull();
  });
  it('cancels immediately while native play remains pending and rejects late acceptance', async () => {
    const f = fixture(); let accept!: () => void;
    f.media.play.mockImplementation(() => new Promise<void>(resolve => { accept = resolve; }));
    const run = f.endpoint.start({ type: 'play' }), rejected = expect(run.finished).rejects.toThrow('CANCELLED'); run.cancel(); await rejected;
    accept(); await tick(); expect(f.media.paused).toBe(true); expect(f.send).not.toHaveBeenCalled();
  });
  it('compensates a result committed after cancellation without replaying its ACK', async () => {
    const f = fixture(); let acknowledge!: () => void;
    f.send.mockImplementationOnce(command => new Promise(resolve => { acknowledge = () => resolve(f.commit(command)); }));
    const run = f.endpoint.start({ type: 'play' }); await tick();
    const rejected = expect(run.finished).rejects.toThrow('CANCELLED'); run.cancel(); await rejected; acknowledge(); await tick();
    expect(f.send.mock.calls.map(([command]) => command.type)).toEqual(['CHECKPOINT_PPTX_MEDIA', 'CHECKPOINT_MEDIA']);
    expect(f.media.paused).toBe(true); expect(f.bookmark()?.paused).toBe(true); expect(f.endpoint.suppressApply(f.bookmark())).toBe(true);
  });
  it('cancels pending work on dispose and still pauses a late durable commit', async () => {
    const f = fixture(); let acknowledge!: () => void;
    f.send.mockImplementationOnce(command => new Promise(resolve => { acknowledge = () => resolve(f.commit(command)); }));
    const run = f.endpoint.start({ type: 'play' }); await tick();
    const rejected = expect(run.finished).rejects.toThrow('CANCELLED'); f.endpoint.dispose(); await rejected; acknowledge(); await tick();
    expect(f.bookmark()?.paused).toBe(true); expect(f.media.paused).toBe(true);
    expect(() => f.endpoint.start({ type: 'play' })).toThrow();
  });
  it('lets a teacher epoch supersede old cancellation without pausing teacher playback', async () => {
    const f = fixture(), run = f.endpoint.start({ type: 'play' }); await run.finished;
    f.teacher('PAUSE_MEDIA'); f.teacher('PLAY_MEDIA'); f.media.paused = false;
    expect(f.endpoint.suppressApply(f.bookmark())).toBe(false); run.cancel(); f.endpoint.dispose(); await tick();
    expect(f.media.paused).toBe(false); expect(f.bookmark()?.paused).toBe(false);
  });
  it('relinquishes a pending promise before applying teacher playback', async () => {
    const f = fixture(); let accept!: () => void;
    f.media.play.mockImplementationOnce(() => new Promise<void>(resolve => { accept = resolve; }));
    const run = f.endpoint.start({ type: 'play' }), rejected = expect(run.finished).rejects.toThrow('CANCELLED');
    f.teacher('PLAY_MEDIA'); f.endpoint.reconcile(); await rejected; f.media.paused = false; accept(); await tick();
    expect(f.media.paused).toBe(false); expect(f.send).not.toHaveBeenCalled();
  });
  it('does not suppress a run cancellation bookmark that must stop native playback', async () => {
    const f = fixture(); await f.endpoint.start({ type: 'play' }).finished;
    f.commit({ type: 'CANCEL_PPTX_GROUP', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: f.transport.snapshot().revision, commandId: 'cancel' });
    expect(f.endpoint.suppressApply(f.bookmark())).toBe(false); expect(f.bookmark()?.paused).toBe(true);
  });
  it('rejects changed scope and settings before saving a native result', async () => {
    const f = fixture(); f.change(value => { value.documents.A!.localMedia!.clip!.embeddedSource!.sourceFingerprint = 'c'.repeat(64); });
    expect(() => f.endpoint.start({ type: 'play' })).toThrow(); expect(f.media.play).not.toHaveBeenCalled();
    const other = fixture(); let accept!: () => void; other.media.play.mockImplementation(() => new Promise<void>(resolve => { accept = resolve; }));
    const run = other.endpoint.start({ type: 'play' }); other.change(value => { value.documents.A!.localMedia!.clip!.playback!.volume = .6; }); accept();
    await expect(run.finished).rejects.toThrow(); expect(other.send).not.toHaveBeenCalled(); expect(other.media.paused).toBe(true);
  });
});
