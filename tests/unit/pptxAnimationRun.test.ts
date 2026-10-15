import { describe, expect, it, vi } from 'vitest';
import { PptxAnimationRuns } from '../../src/adapters/pptx/animationRun';

function setup() {
  const animations: Animation[] = [];
  const runs = new PptxAnimationRuns({ getAnimations: () => animations });
  const animation = () => { const item = { cancel: vi.fn() } as unknown as Animation; animations.push(item); return item; };
  return { runs, animation };
}
function deferred() {
  let resolve!: () => void, reject!: (error: Error) => void;
  const finished = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { finished, resolve, reject, cancel: vi.fn() };
}

describe('PPTX animation run ownership', () => {
  it('cleans a run invalidated inside start without taking ownership of a nested replacement', async () => {
    const { runs, animation } = setup(), old = deferred(), replacement = deferred(), commit = vi.fn();
    let owned!: Animation, next!: Animation, pending!: ReturnType<typeof runs.play>;
    const first = runs.play(() => {
      owned = animation(); runs.invalidate();
      pending = runs.play(() => { next = animation(); return replacement; }, commit);
      return old;
    }, vi.fn());
    expect(await first).toBe('superseded'); expect(old.cancel).toHaveBeenCalledOnce(); expect(owned.cancel).toHaveBeenCalledOnce(); expect(next.cancel).not.toHaveBeenCalled();
    old.reject(Error('cancelled after synchronous invalidation')); await Promise.resolve();
    replacement.resolve(); expect(await pending).toBe('completed'); runs.invalidate(); expect(next.cancel).toHaveBeenCalledOnce();
  });
  it('commits only after playback completes', async () => {
    const { runs } = setup(), playback = deferred(), commit = vi.fn();
    const outcome = runs.play(() => playback, commit);
    expect(runs.isPlaying).toBe(true); expect(commit).not.toHaveBeenCalled();
    playback.resolve(); expect(await outcome).toBe('completed');
    expect(commit).toHaveBeenCalledOnce(); expect(runs.isPlaying).toBe(false);
  });
  it('does not call a second start while busy', async () => {
    const { runs } = setup(), playback = deferred(), start = vi.fn(), commit = vi.fn();
    const first = runs.play(() => playback, commit);
    expect(await runs.play(start, commit)).toBe('busy'); expect(start).not.toHaveBeenCalled();
    runs.invalidate(); expect(await first).toBe('superseded');
  });
  it('resolves cancellation even if the engine never settles', async () => {
    const { runs } = setup(), playback = deferred(), commit = vi.fn();
    const outcome = runs.play(() => playback, commit);
    runs.invalidate(); expect(await outcome).toBe('superseded');
    expect(playback.cancel).toHaveBeenCalledOnce(); expect(commit).not.toHaveBeenCalled();
  });
  it('ignores a previous completion after a replacement starts', async () => {
    const { runs } = setup(), old = deferred(), next = deferred(), stale = vi.fn(), current = vi.fn();
    const first = runs.play(() => old, stale); runs.invalidate();
    const second = runs.play(() => next, current); old.resolve();
    expect(await first).toBe('superseded'); expect(stale).not.toHaveBeenCalled(); expect(runs.isPlaying).toBe(true);
    next.resolve(); expect(await second).toBe('completed'); expect(current).toHaveBeenCalledOnce();
  });
  it('cancels owned effects, not pre-existing animations', async () => {
    const { runs, animation } = setup(), unrelated = animation(), playback = deferred();
    let owned!: Animation;
    const outcome = runs.play(() => { owned = animation(); return playback; }, vi.fn());
    runs.invalidate(); expect(await outcome).toBe('superseded');
    expect(owned.cancel).toHaveBeenCalledOnce(); expect(unrelated.cancel).not.toHaveBeenCalled();
  });
  it('clears finished fill effects on navigation', async () => {
    const { runs, animation } = setup(), playback = deferred(); let owned!: Animation;
    const outcome = runs.play(() => { owned = animation(); return playback; }, vi.fn());
    playback.resolve(); await outcome; expect(owned.cancel).not.toHaveBeenCalled();
    runs.invalidate(); runs.invalidate(); expect(owned.cancel).toHaveBeenCalledOnce();
  });
  it('cleans native effects even when engine cancellation throws', async () => {
    const { runs, animation } = setup(), playback = deferred(); let owned!: Animation;
    playback.cancel.mockImplementation(() => { throw Error('engine'); });
    const outcome = runs.play(() => { owned = animation(); return playback; }, vi.fn());
    runs.invalidate(); expect(await outcome).toBe('superseded'); expect(owned.cancel).toHaveBeenCalledOnce();
  });
  it('cleans up a synchronous engine failure without leaking its details', async () => {
    const { runs, animation } = setup(); let owned!: Animation;
    await expect(runs.play(() => { owned = animation(); throw Error('private content'); }, vi.fn())).rejects.toThrow('PPTX_ANIMATION_FAILED');
    expect(owned.cancel).toHaveBeenCalledOnce(); expect(runs.isPlaying).toBe(false);
  });
  it('rejects asynchronous failures without applying final visibility', async () => {
    const { runs, animation } = setup(), playback = deferred(), commit = vi.fn(); let owned!: Animation;
    const outcome = runs.play(() => { owned = animation(); return playback; }, commit);
    playback.reject(Error('private content'));
    await expect(outcome).rejects.toThrow('PPTX_ANIMATION_FAILED');
    expect(commit).not.toHaveBeenCalled(); expect(owned.cancel).toHaveBeenCalledOnce();
  });
  it('cleans up if final projection fails without cancelling a replacement', async () => {
    const { runs, animation } = setup(), playback = deferred(), replacement = deferred();
    let owned!: Animation, next!: Animation, pending!: ReturnType<typeof runs.play>;
    const outcome = runs.play(() => { owned = animation(); return playback; }, () => {
      pending = runs.play(() => { next = animation(); return replacement; }, vi.fn());
      throw Error('projection failed');
    });
    playback.resolve(); await expect(outcome).rejects.toThrow('PPTX_ANIMATION_FAILED');
    expect(owned.cancel).toHaveBeenCalledOnce(); expect(next.cancel).not.toHaveBeenCalled(); expect(runs.isPlaying).toBe(true);
    replacement.resolve(); expect(await pending).toBe('completed'); runs.invalidate();
  });
});
