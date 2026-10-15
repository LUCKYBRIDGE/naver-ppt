import { describe, expect, it, vi } from 'vitest';
import { createPptxSourceGroupDriver } from '../../src/adapters/pptx/sourceGroupDriver';
function fixture() {
  const visual = { start: vi.fn(() => ({ finished: Promise.resolve(), cancel: vi.fn() })), complete: vi.fn() };
  const shape = { totalGroups: 1, targets: [7], restore: vi.fn(), next: vi.fn(() => visual) };
  const media = { finished: Promise.resolve(), cancel: vi.fn() };
  const startMedia = vi.fn(() => media);
  const groups = [{ timingId: 20, shapeGroup: null, startMedia }, { timingId: 30, shapeGroup: 0, startMedia }, { timingId: 40, shapeGroup: null, startMedia }];
  const driver = createPptxSourceGroupDriver(shape, groups);
  return { shape, visual, media, startMedia, groups, driver };
}
describe('source group completion cursor', () => {
  it('counts media-only groups without inventing pose targets', () => {
    const f = fixture(); expect(f.driver.totalGroups).toBe(3); expect(f.driver.targets).toEqual([7]);
    expect(f.driver.renderer).toBe('web-ppt-0.4.5/source-v1');
  });
  it.each([[0, 0], [1, 0], [2, 1], [3, 1]])('restores source cursor %s to shape cursor %s without replaying media', (done, shapes) => {
    const f = fixture(); f.driver.restore(done);
    expect(f.shape.restore).toHaveBeenCalledWith(shapes); expect(f.startMedia).not.toHaveBeenCalled(); expect(f.shape.next).not.toHaveBeenCalled();
  });
  it('executes the next media-only group after restored history', async () => {
    const f = fixture(); f.driver.restore(2); const group = f.driver.next(); await group.start().finished; group.complete();
    expect(f.startMedia).toHaveBeenCalledOnce(); expect(f.shape.next).not.toHaveBeenCalled();
    expect(() => f.driver.next()).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED');
  });
  it('waits for both media and shape completion before durable caller can acknowledge', async () => {
    const f = fixture(); let finish!: () => void;
    f.media.finished = new Promise<void>(resolve => { finish = resolve; }); f.driver.restore(1);
    const group = f.driver.next(), completed = vi.fn(), playback = group.start(); void playback.finished.then(completed);
    await Promise.resolve(); expect(completed).not.toHaveBeenCalled(); finish(); await playback.finished; group.complete();
    expect(f.visual.complete).toHaveBeenCalledOnce();
  });
  it('cancels all started actions once and prevents completion', () => {
    const f = fixture(); f.driver.restore(1); const group = f.driver.next(), playback = group.start(); playback.cancel(); playback.cancel();
    expect(f.media.cancel).toHaveBeenCalledOnce(); expect(f.visual.start.mock.results[0]!.value.cancel).toHaveBeenCalledOnce();
    expect(() => group.complete()).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED');
  });
  it('cancels started shape playback when media start throws', () => {
    const f = fixture(); f.startMedia.mockImplementation(() => { throw Error('native media failure'); }); f.driver.restore(1);
    expect(() => f.driver.next().start()).toThrow('native media failure'); expect(f.visual.start.mock.results[0]!.value.cancel).toHaveBeenCalledOnce();
  });
  it('cancels sibling playback when media completion fails', async () => {
    const f = fixture(); f.media.finished = Promise.reject(Error('native failed')); f.driver.restore(1);
    await expect(f.driver.next().start().finished).rejects.toThrow('native failed');
    expect(f.visual.start.mock.results[0]!.value.cancel).toHaveBeenCalledOnce(); expect(f.media.cancel).toHaveBeenCalledOnce();
  });
  it('invalidates deferred actions on restore and prevents duplicate start', () => {
    const f = fixture(), old = f.driver.next(); f.driver.restore(0);
    expect(() => old.start()).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED'); const group = f.driver.next(); group.start();
    expect(() => group.start()).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED'); expect(f.startMedia).toHaveBeenCalledOnce();
  });
  it('rejects lost, duplicated, reordered or empty source groups before touching the engine', () => {
    const f = fixture();
    for (const groups of [[], [{ timingId: 1, shapeGroup: null }], [{ timingId: 1, shapeGroup: 1 }],
      [{ timingId: 1, shapeGroup: 0 }, { timingId: 1, shapeGroup: null, startMedia: f.startMedia }],
      [{ timingId: 1, shapeGroup: 0 }, { timingId: 2, shapeGroup: 0 }]]) {
      expect(() => createPptxSourceGroupDriver(f.shape, groups)).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED');
    }
    expect(f.shape.restore).not.toHaveBeenCalled(); expect(f.shape.next).not.toHaveBeenCalled();
  });
  it.each([-1, 4, NaN, 0.1])('rejects invalid source restore %s', done => {
    const f = fixture(); expect(() => f.driver.restore(done)).toThrow('PPTX_SOURCE_GROUP_UNVERIFIED'); expect(f.shape.restore).not.toHaveBeenCalled();
  });
});
