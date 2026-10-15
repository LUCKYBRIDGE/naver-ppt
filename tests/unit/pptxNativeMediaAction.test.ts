import { describe, expect, it, vi } from 'vitest';
import { parsePptxMediaAction, isPptxMediaAction } from '../../src/core/pptxMediaAction';
import { PptxNativeMediaActions } from '../../src/adapters/pptx/nativeMediaAction';
function fixture() {
  const media = { currentTime: 2, duration: 8, readyState: 1, paused: true, ended: false,
    play: vi.fn(async () => { media.paused = false; }), pause: vi.fn(() => { media.paused = true; }) };
  let current = true;
  const driver = new PptxNativeMediaActions(media, { startSec: 1, endSec: 7 }, () => current);
  return { media, driver, loseOwnership() { current = false; } };
}
describe('bounded OOXML media call vocabulary', () => {
  it.each(['play', 'pause', 'resume', 'stop', 'togglePause'])('normalizes %s and the documented omitted call type', command => {
    expect(parsePptxMediaAction('call', command)).toEqual({ type: command }); expect(parsePptxMediaAction(null, command)).toEqual({ type: command });
  });
  it('keeps playFrom in seconds, not milliseconds', () => {
    expect(parsePptxMediaAction('call', 'playFrom(1.25)')).toEqual({ type: 'playFrom', timeSec: 1.25 });
  });
  it.each(['playFrom(-1)', 'playFrom(86400.1)', 'playFrom(Infinity)', 'playFrom(1e2)', 'play();fetch()', ' PLAY', 'playFrom(.2)'])('does not execute unsupported source command %s', command => {
    expect(parsePptxMediaAction('call', command)).toBeNull();
  });
  it('rejects explicit other command types and extra/inherited action fields', () => {
    expect(parsePptxMediaAction('evt', 'play')).toBeNull(); expect(parsePptxMediaAction('verb', 'play')).toBeNull();
    expect(isPptxMediaAction({ type: 'play', raw: 'ignored' })).toBe(false); expect(isPptxMediaAction(Object.assign(Object.create({ type: 'play' }), { extra: 1 }))).toBe(false);
  });
});
describe('runtime-owned native media command execution', () => {
  it('accepts play without waiting for media natural ending', async () => {
    const f = fixture(); await f.driver.start({ type: 'play' }).finished;
    expect(f.media.currentTime).toBe(1); expect(f.media.paused).toBe(false); expect(f.media.ended).toBe(false);
  });
  it('pauses and resumes at the retained native position', async () => {
    const f = fixture(); await f.driver.start({ type: 'play' }).finished; f.media.currentTime = 3;
    await f.driver.start({ type: 'pause' }).finished; expect(f.media.paused).toBe(true);
    await f.driver.start({ type: 'resume' }).finished; expect(f.media.currentTime).toBe(3); expect(f.media.paused).toBe(false);
  });
  it('toggles active playback and restarts inactive media from the clip beginning', async () => {
    const f = fixture(); await f.driver.start({ type: 'togglePause' }).finished; expect(f.media.currentTime).toBe(1);
    f.media.currentTime = 4; await f.driver.start({ type: 'togglePause' }).finished; expect(f.media.paused).toBe(true);
    await f.driver.start({ type: 'togglePause' }).finished; expect(f.media.currentTime).toBe(4);
    await f.driver.start({ type: 'stop' }).finished; expect(f.media.paused).toBe(true);
    await f.driver.start({ type: 'togglePause' }).finished; expect(f.media.currentTime).toBe(1);
  });
  it('plays from an absolute bounded position and keeps paused position for a later resume', async () => {
    const f = fixture(); await f.driver.start({ type: 'playFrom', timeSec: 5.25 }).finished;
    expect(f.media.currentTime).toBe(5.25); await f.driver.start({ type: 'pause' }).finished;
    await f.driver.start({ type: 'resume' }).finished; expect(f.media.currentTime).toBe(5.25);
  });
  it.each([0, 7, 8, NaN])('rejects out-of-clip seek %s before mutating native playback', timeSec => {
    const f = fixture(); expect(() => f.driver.start({ type: 'playFrom', timeSec })).toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED');
    expect(f.media.play).not.toHaveBeenCalled(); expect(f.media.pause).not.toHaveBeenCalled(); expect(f.media.currentTime).toBe(2);
  });
  it('rejects missing metadata and ownership before touching media', () => {
    const f = fixture(); f.media.readyState = 0; expect(() => f.driver.start({ type: 'play' })).toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED');
    f.media.readyState = 1; f.loseOwnership(); expect(() => f.driver.start({ type: 'pause' })).toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED'); expect(f.media.pause).not.toHaveBeenCalled();
  });
  it('pauses a late successful play after cancellation and rejects completion', async () => {
    const f = fixture(); let finish!: () => void;
    f.media.play.mockImplementation(() => new Promise<void>(resolve => { finish = () => { f.media.paused = false; resolve(); }; }));
    const run = f.driver.start({ type: 'play' }); run.cancel(); finish();
    await expect(run.finished).rejects.toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED'); expect(f.media.paused).toBe(true);
  });
  it('pauses a late play after ownership loss without acknowledging success', async () => {
    const f = fixture(); let finish!: () => void; f.media.play.mockImplementation(() => new Promise<void>(resolve => { finish = resolve; }));
    const run = f.driver.start({ type: 'play' }); f.loseOwnership(); finish(); await expect(run.finished).rejects.toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED'); expect(f.media.paused).toBe(true);
  });
  it('does not let a previous cancelled run pause a newer accepted play', async () => {
    const f = fixture(); let finish!: () => void;
    f.media.play.mockImplementationOnce(() => new Promise<void>(resolve => { finish = resolve; }));
    const old = f.driver.start({ type: 'play' }); const latest = f.driver.start({ type: 'resume' }); await latest.finished; finish();
    await expect(old.finished).rejects.toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED'); old.cancel(); expect(f.media.paused).toBe(false);
  });
  it('toggles already playing native media without restarting even before the first source command', async () => {
    const f = fixture(); f.media.paused = false; f.media.currentTime = 4;
    await f.driver.start({ type: 'togglePause' }).finished;
    expect(f.media.paused).toBe(true); expect(f.media.currentTime).toBe(4); expect(f.media.play).not.toHaveBeenCalled();
  });
  it('does not turn toggle-pause into play while cancelling an older pending play', async () => {
    const f = fixture(); let finish!: () => void;
    f.media.play.mockImplementationOnce(() => { f.media.paused = false; return new Promise<void>(resolve => { finish = resolve; }); });
    const old = f.driver.start({ type: 'play' }); await f.driver.start({ type: 'togglePause' }).finished;
    finish(); await expect(old.finished).rejects.toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED');
    expect(f.media.paused).toBe(true); expect(f.media.play).toHaveBeenCalledOnce();
  });
  it('keeps cancellation effective after command acceptance and cleans up autoplay failures', async () => {
    const f = fixture(), run = f.driver.start({ type: 'play' }); await run.finished; run.cancel(); expect(f.media.paused).toBe(true);
    f.media.play.mockRejectedValueOnce(Error('NotAllowedError')); await expect(f.driver.start({ type: 'resume' }).finished).rejects.toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED'); expect(f.media.paused).toBe(true);
  });
  it('disposes owned playback and prevents subsequent commands', async () => {
    const f = fixture(); await f.driver.start({ type: 'play' }).finished; f.driver.dispose(); f.driver.dispose(); expect(f.media.paused).toBe(true);
    expect(() => f.driver.start({ type: 'play' })).toThrow('PPTX_NATIVE_MEDIA_ACTION_FAILED');
  });
});
