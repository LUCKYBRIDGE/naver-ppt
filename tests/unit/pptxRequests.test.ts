import { describe, expect, it, vi } from 'vitest';
import { PptxRequests } from '../../src/player/pptxRequests';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
import { fixtureSession } from '../fixtures/session';
import { readEffectFeedback } from '../../src/shared/pptxEffectStatus';

function fixture(initialRequest?: string) {
  const session = fixtureSession(); session.documents.A!.source.type = 'pptx';
  const snapshot = toPlayerSnapshot(session);
  snapshot.pptx!.request = initialRequest ? { commandId: initialRequest, slideId: 'A-2' } : null;
  const report = vi.fn(), runtime = { busy: false, play: vi.fn(async (_id?: string): Promise<'completed' | 'exhausted'> => 'completed'), cancel: vi.fn() };
  return { snapshot, report, runtime, consumer: new PptxRequests(snapshot, report) };
}
describe('owner view Remote request consumption', () => {
  it('holds historical intent on new Player and after renderer becomes ready', () => {
    const f = fixture('old'); f.consumer.update(f.snapshot, null); f.consumer.update(f.snapshot, f.runtime);
    f.consumer.local(f.snapshot, f.runtime);
    expect(f.runtime.play).not.toHaveBeenCalled(); expect(f.report).toHaveBeenLastCalledWith('held');
  });
  it('consumes a fresh intent arriving during loading once', async () => {
    const f = fixture(); f.snapshot.pptx!.request = { commandId: 'new', slideId: 'A-2' };
    f.consumer.update(f.snapshot, null); f.consumer.update(f.snapshot, f.runtime); f.consumer.update(f.snapshot, f.runtime);
    await Promise.resolve(); f.consumer.update(f.snapshot, f.runtime);
    expect(f.runtime.play).toHaveBeenCalledExactlyOnceWith('new'); expect(f.report).toHaveBeenLastCalledWith('completed');
  });
  it('requires explicit cancellation and fresh ID after a failure', async () => {
    const f = fixture(); f.runtime.play.mockRejectedValueOnce(Error('failed'));
    f.snapshot.pptx!.request = { commandId: 'one', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    await vi.waitFor(() => expect(f.report).toHaveBeenLastCalledWith('failed'));
    f.consumer.update(f.snapshot, f.runtime); expect(f.runtime.play).toHaveBeenCalledTimes(1);
    f.snapshot.pptx!.request = null; f.consumer.update(f.snapshot, f.runtime); expect(f.report).toHaveBeenLastCalledWith('cancelled');
    f.snapshot.pptx!.request = { commandId: 'two', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    expect(f.runtime.play).toHaveBeenLastCalledWith('two');
  });
  it('cancels native playback and ignores its late completion', async () => {
    const f = fixture(); let finish!: (value: 'completed') => void;
    f.runtime.play.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    f.snapshot.pptx!.request = { commandId: 'one', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    f.snapshot.pptx!.request = null; f.snapshot.pptx!.run = { epoch: 'run', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    expect(f.runtime.cancel).not.toHaveBeenCalled();
    f.snapshot.pptx!.run = null; f.consumer.update(f.snapshot, f.runtime);
    expect(f.runtime.cancel).toHaveBeenCalledOnce(); finish('completed'); await Promise.resolve();
    expect(f.report).toHaveBeenLastCalledWith('cancelled');
  });
  it('does not cancel a published completed checkpoint while its ACK is pending', () => {
    const f = fixture(); f.runtime.play.mockReturnValue(new Promise(() => {}));
    f.snapshot.pptx!.request = { commandId: 'one', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    f.snapshot.pptx!.request = null;
    f.snapshot.pptx!.checkpoint = { completedGroups: 1 } as NonNullable<typeof f.snapshot.pptx>['checkpoint'];
    f.consumer.update(f.snapshot, f.runtime); expect(f.runtime.cancel).not.toHaveBeenCalled();
  });
  it('reports exhaustion once without advancing the page', async () => {
    const f = fixture(); f.runtime.play.mockResolvedValue('exhausted');
    f.snapshot.pptx!.request = { commandId: 'one', slideId: 'A-2' }; f.consumer.update(f.snapshot, f.runtime);
    await Promise.resolve(); f.consumer.update(f.snapshot, f.runtime);
    expect(f.report).toHaveBeenLastCalledWith('exhausted'); expect(f.snapshot.selection?.slideId).toBe('A-2'); expect(f.runtime.play).toHaveBeenCalledOnce();
  });
  it('ignores async results after leaving the view', async () => {
    const f = fixture(); let finish!: (value: 'completed') => void;
    f.runtime.play.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    f.consumer.local(f.snapshot, f.runtime); f.consumer.dispose(); finish('completed'); await Promise.resolve();
    expect(f.report).toHaveBeenCalledExactlyOnceWith('running');
  });
  it('rejects malformed feedback and strips arbitrary data', () => {
    expect(readEffectFeedback({ status: 'ready', revision: 3 })).toEqual({ status: 'ready', revision: 3 });
    for (const value of [null, { status: '__proto__', revision: 1 }, { status: 'ready', revision: -1 }, { status: 'ready', revision: 1, filename: 'private' }]) expect(readEffectFeedback(value)).toBeNull();
  });
});
