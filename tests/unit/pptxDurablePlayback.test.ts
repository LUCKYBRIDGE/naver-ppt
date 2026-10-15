import { afterEach, describe, expect, it, vi } from 'vitest';
import { PptxDurablePlayback, validatePptxCheckpointModel } from '../../src/adapters/pptx/durablePlayback';
import { reduceSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { fixtureSession } from '../fixtures/session';
import type { SessionCommand } from '../../src/core/commands';
import type { PlayerSnapshot } from '../../src/core/playerSnapshot';

afterEach(() => vi.unstubAllGlobals());
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(yes => { resolve = yes; }); return { promise, resolve }; }
function fixture() {
  let session = fixtureSession(); session.revision = 0; session.documents.A!.source.type = 'pptx';
  let id = 0; const animations: Animation[] = [], element = { style: { opacity: '1', transform: 'none', clipPath: 'none', visibility: 'visible' } };
  const root = { querySelector: vi.fn(() => element as unknown as Element), getAnimations: () => [...animations] };
  vi.stubGlobal('getComputedStyle', () => ({ ...element.style }));
  const driver = { totalGroups: 2, targets: [3], restore: vi.fn(() => { Object.assign(element.style, { transform: 'none', opacity: '1' }); }),
    next: vi.fn(() => ({ start: () => { animations.push({ cancel: vi.fn() } as unknown as Animation); return { finished: Promise.resolve(), cancel: vi.fn() }; }, complete: () => { element.style.transform = 'matrix(0,1,-1,0,0,0)'; } })) };
  const transport = { snapshot: () => toPlayerSnapshot(session), newId: () => `command-${++id}`, send: vi.fn(async (command: SessionCommand): Promise<{ ok: true; snapshot: PlayerSnapshot } | { ok: false }> => {
    session = reduceSession(session, command, id + 1); return { ok: true, snapshot: toPlayerSnapshot(session) };
  }) };
  const bridge = new PptxDurablePlayback(root, driver, transport, { sessionId: session.id, documentId: 'A', slideId: 'A-2', fingerprint: 'a'.repeat(64) });
  return { bridge, driver, transport, root, element, animations, getSession: () => session, setSession: (next: typeof session) => { session = next; } };
}
describe('PPTX native playback to durable checkpoint bridge', () => {
  it('retains cancellation when invalidation occurs synchronously inside native start', async () => {
    const f = fixture(), stop = vi.fn();
    f.driver.next.mockReturnValue({ start: () => { f.bridge.invalidate(); return { finished: new Promise<void>(() => {}), cancel: stop }; }, complete: () => {} });
    expect(await f.bridge.play()).toBe('superseded'); expect(stop).toHaveBeenCalledOnce();
    expect(f.transport.send.mock.calls.map(([command]) => command.type)).toEqual(['BEGIN_PPTX_GROUP']);
  });
  it('cancels accepted native playback once while the durable ACK is still pending', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(), original = f.transport.send.getMockImplementation()!, stop = vi.fn();
    f.driver.next.mockReturnValue({ start: () => ({ finished: Promise.resolve(), cancel: stop }), complete: () => {} });
    f.transport.send.mockImplementation(async command => { const result = await original(command); return command.type === 'CHECKPOINT_PPTX_GROUP' ? ack.promise : result; });
    const playing = f.bridge.play(); await vi.waitFor(() => expect(f.transport.send).toHaveBeenCalledTimes(2));
    expect(stop).not.toHaveBeenCalled(); f.bridge.invalidate(); f.bridge.invalidate(); expect(await playing).toBe('superseded');
    expect(stop).toHaveBeenCalledOnce(); ack.resolve({ ok: true, snapshot: f.transport.snapshot() }); await Promise.resolve();
    f.bridge.restore(); expect(f.driver.restore).toHaveBeenLastCalledWith(1); expect(stop).toHaveBeenCalledOnce();
  });
  it('stops accepted native playback on a failed durable ACK, but leaves successful playback running', async () => {
    for (const failed of [false, true]) {
      const f = fixture(), stop = vi.fn(), original = f.transport.send.getMockImplementation()!;
      f.driver.next.mockReturnValue({ start: () => ({ finished: Promise.resolve(), cancel: stop }), complete: () => {} });
      if (failed) f.transport.send.mockImplementation(command => command.type === 'CHECKPOINT_PPTX_GROUP' ? Promise.resolve({ ok: false }) : original(command));
      if (failed) await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); else expect(await f.bridge.play()).toBe('completed');
      expect(stop).toHaveBeenCalledTimes(failed ? 1 : 0);
    }
  });
  it('persists the source cursor contract and refuses shape-only restoration of that history', async () => {
    const f = fixture(); Object.assign(f.driver, { renderer: 'web-ppt-0.4.5/source-v1' });
    expect(await f.bridge.play()).toBe('completed');
    expect(f.getSession().documents.A!.pptxPlayback!.checkpoints['A-2']!.renderer).toBe('web-ppt-0.4.5/source-v1');
    Object.assign(f.driver, { renderer: undefined }); f.driver.restore.mockClear();
    expect(() => f.bridge.restore()).toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.driver.restore).not.toHaveBeenCalled();
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.transport.send).toHaveBeenCalledTimes(2);
  });
  it('refuses upgrading existing shape-only history to a different source cursor implicitly', async () => {
    const f = fixture(); await f.bridge.play(); Object.assign(f.driver, { renderer: 'web-ppt-0.4.5/source-v1' });
    expect(() => f.bridge.restore()).toThrow('PPTX_CHECKPOINT_FAILED');
  });
  function request(f: ReturnType<typeof fixture>) {
    f.setSession(reduceSession(f.getSession(), { type: 'REQUEST_PPTX_GROUP', commandId: 'remote-intent', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 0 }, 1));
  }
  it('consumes Remote intent before native playback and commits the completed pose', async () => {
    const f = fixture(); request(f);
    expect(await f.bridge.play('remote-intent')).toBe('completed');
    expect(f.transport.send.mock.calls[0]![0]).toMatchObject({ type: 'BEGIN_REQUESTED_PPTX_GROUP', requestId: 'remote-intent' });
    expect(f.getSession().documents.A!.pptxPlayback).toMatchObject({ request: null, run: null });
    expect(f.driver.restore).toHaveBeenLastCalledWith(1);
  });
  it('rejects an absent or wrong request before transport or animation', async () => {
    const f = fixture();
    await expect(f.bridge.play('remote-intent')).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    request(f); await expect(f.bridge.play('wrong')).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    expect(f.transport.send).not.toHaveBeenCalled(); expect(f.driver.next).not.toHaveBeenCalled();
  });
  it('does not animate a request cancelled before its consumption commit', async () => {
    const f = fixture(); request(f); const original = f.transport.send.getMockImplementation()!;
    f.transport.send.mockImplementation(async c => {
      f.setSession(reduceSession(f.getSession(), { type: 'CANCEL_PPTX_GROUP', commandId: 'cancel', sessionId: 'original', documentId: 'A', slideId: 'A-2', revision: 1 }, 2));
      return original(c);
    });
    await expect(f.bridge.play('remote-intent')).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    expect(f.driver.next).not.toHaveBeenCalled(); expect(f.getSession().documents.A!.pptxPlayback!.request).toBeNull();
  });
  it('begins before native playback and captures completed pose before durable commit', async () => {
    const f = fixture(); expect(await f.bridge.play()).toBe('completed');
    const calls = f.transport.send.mock.calls.map(([c]) => c.type); expect(calls).toEqual(['BEGIN_PPTX_GROUP', 'CHECKPOINT_PPTX_GROUP']);
    expect(f.getSession().documents.A!.pptxPlayback!.checkpoints['A-2']!.pose.entries[0]!.transform).toBe('matrix(0,1,-1,0,0,0)');
    expect(f.driver.restore).toHaveBeenLastCalledWith(1); expect(f.bridge.isBusy).toBe(false);
  });
  it('remains busy until delayed checkpoint ACK and never starts a second effect', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(), send = f.transport.send.getMockImplementation()!;
    f.transport.send.mockImplementation(async c => { const result = await send(c); return c.type === 'CHECKPOINT_PPTX_GROUP' ? ack.promise : result; });
    const first = f.bridge.play(); await vi.waitFor(() => expect(f.transport.send).toHaveBeenCalledTimes(2));
    expect(f.bridge.isBusy).toBe(true); expect(await f.bridge.play()).toBe('busy'); expect(f.driver.next).toHaveBeenCalledOnce();
    ack.resolve({ ok: true, snapshot: f.transport.snapshot() }); expect(await first).toBe('completed');
  });
  it('rolls back speculative engine cursor and pose after commit failure', async () => {
    const f = fixture(), send = f.transport.send.getMockImplementation()!;
    f.transport.send.mockImplementation(c => c.type === 'CHECKPOINT_PPTX_GROUP' ? Promise.resolve({ ok: false }) : send(c));
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    expect(f.driver.restore).toHaveBeenLastCalledWith(0); expect(f.element.style.transform).toBe('none'); expect(f.getSession().documents.A!.pptxPlayback!.checkpoints).toEqual({});
  });
  it('uses already published durable state after a lost response without replaying the confirmed effect', async () => {
    const f = fixture(), send = f.transport.send.getMockImplementation()!;
    f.transport.send.mockImplementation(async c => { const result = await send(c); if (c.type === 'CHECKPOINT_PPTX_GROUP') throw Error('lost response'); return result; });
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED');
    expect(f.driver.restore).toHaveBeenLastCalledWith(1); expect(f.element.style.transform).toBe('matrix(0,1,-1,0,0,0)');
  });
  it('does not start native playback before a failed BEGIN', async () => {
    const f = fixture(); f.transport.send.mockResolvedValue({ ok: false });
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.driver.next).not.toHaveBeenCalled();
  });
  it('cancels unresolved BEGIN and ignores its late ACK', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(); f.transport.send.mockReturnValue(ack.promise);
    const first = f.bridge.play(); f.bridge.invalidate(); expect(await first).toBe('superseded');
    ack.resolve({ ok: true, snapshot: f.transport.snapshot() }); await Promise.resolve(); expect(f.driver.next).not.toHaveBeenCalled();
  });
  it('does not start an old BEGIN over a newer standby selection', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(), send = f.transport.send.getMockImplementation()!; let saved!: PlayerSnapshot;
    f.transport.send.mockImplementation(async c => { const result = await send(c); if (result.ok) saved = result.snapshot; return ack.promise; });
    const first = f.bridge.play(); await vi.waitFor(() => expect(f.transport.send).toHaveBeenCalledOnce());
    const newer = f.getSession(); newer.presentedSelection = null; newer.revision++;
    ack.resolve({ ok: true, snapshot: saved }); await expect(first).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.driver.next).not.toHaveBeenCalled();
  });
  it('cancels unresolved checkpoint ACK without repainting a replacement', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(), send = f.transport.send.getMockImplementation()!;
    f.transport.send.mockImplementation(c => c.type === 'CHECKPOINT_PPTX_GROUP' ? ack.promise : send(c));
    const first = f.bridge.play(); await vi.waitFor(() => expect(f.transport.send).toHaveBeenCalledTimes(2)); f.bridge.invalidate();
    f.driver.restore.mockClear(); expect(await first).toBe('superseded'); ack.resolve({ ok: true, snapshot: f.transport.snapshot() }); await Promise.resolve();
    expect(f.driver.restore).not.toHaveBeenCalled(); expect(f.animations[0]!.cancel).toHaveBeenCalled();
  });
  it('does not reapply an old ACK over a newer standby selection even without client invalidation', async () => {
    const f = fixture(), ack = deferred<{ ok: true; snapshot: PlayerSnapshot }>(), send = f.transport.send.getMockImplementation()!; let saved!: PlayerSnapshot;
    f.transport.send.mockImplementation(async c => { const result = await send(c); if (c.type !== 'CHECKPOINT_PPTX_GROUP') return result;
      if (result.ok) saved = result.snapshot; return ack.promise; });
    const first = f.bridge.play(); await vi.waitFor(() => expect(f.transport.send).toHaveBeenCalledTimes(2));
    const newer = f.getSession(); newer.presentedSelection = null; newer.revision++; f.driver.restore.mockClear();
    ack.resolve({ ok: true, snapshot: saved }); await expect(first).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.driver.restore).not.toHaveBeenCalled();
  });
  it('rejects an invalid snapshot revision before repaint or BEGIN', async () => {
    const f = fixture(); f.getSession().revision = NaN;
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.transport.send).not.toHaveBeenCalled(); expect(f.driver.restore).not.toHaveBeenCalled();
  });
  it('does not checkpoint a native run invalidated before completion', async () => {
    const f = fixture(), native = deferred<void>();
    f.driver.next.mockReturnValue({ start: () => ({ finished: native.promise, cancel: vi.fn() }), complete: vi.fn() });
    const first = f.bridge.play(); await vi.waitFor(() => expect(f.driver.next).toHaveBeenCalled()); f.bridge.invalidate();
    expect(await first).toBe('superseded'); native.resolve(); expect(f.transport.send).toHaveBeenCalledTimes(1);
  });
  it('rejects wrong document/source before transport or restore mutation', async () => {
    const f = fixture(), s = f.getSession(); s.presentedSelection!.documentId = 'B';
    await expect(f.bridge.play()).rejects.toThrow('PPTX_CHECKPOINT_FAILED'); expect(f.transport.send).not.toHaveBeenCalled(); expect(f.driver.restore).not.toHaveBeenCalled();
  });
  it('restores confirmed pose at later global revision and stops at model exhaustion', async () => {
    const f = fixture(); expect(await f.bridge.play()).toBe('completed'); expect(await f.bridge.play()).toBe('completed');
    expect(await f.bridge.play()).toBe('exhausted'); expect(f.driver.next).toHaveBeenCalledTimes(2);
    f.bridge.restore(); expect(f.driver.restore).toHaveBeenLastCalledWith(2);
  });
  it('rejects a saved pose targeting another parsed model before repaint', async () => {
    const f = fixture(); await f.bridge.play(); f.driver.targets = [4];
    expect(() => f.bridge.restore()).toThrow('PPTX_CHECKPOINT_FAILED');
  });
  it.each([-1, NaN, 5001, 1.5])('rejects invalid model group count %s', count => {
    expect(() => validatePptxCheckpointModel(null, count, [3])).toThrow('PPTX_CHECKPOINT_FAILED');
  });
  it.each([0, -1, NaN, 4294967296])('rejects invalid parsed target %s', id => {
    expect(() => validatePptxCheckpointModel(null, 1, [id])).toThrow('PPTX_CHECKPOINT_FAILED');
  });
});
