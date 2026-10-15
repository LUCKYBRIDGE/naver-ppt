import { describe, expect, it, vi } from 'vitest';
import { playTimerSound } from '../../src/player/timerSound';
function context(state = 'running') {
  const oscillator = { frequency: { value: 0 }, connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
  const gain = { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn() };
  return { state, currentTime: 10, destination: {}, resume: vi.fn(async () => {}), close: vi.fn(async () => {}), createOscillator: vi.fn(() => oscillator), createGain: vi.fn(() => gain), oscillator, gain };
}
describe('local timer sound', () => {
  it('schedules two bounded tones in native timeline and closes context', async () => {
    vi.useFakeTimers(); try {
      const fake = context(), pending = playTimerSound(new AbortController().signal, () => fake as unknown as AudioContext);
      await vi.advanceTimersByTimeAsync(701); await pending;
      expect(fake.createOscillator).toHaveBeenCalledTimes(2); expect(fake.oscillator.start).toHaveBeenCalledWith(10.02);
      expect(fake.gain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(.12, 10.04); expect(fake.close).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
  it('never starts tones when policy rejects resume and cleans up', async () => {
    const fake = context('suspended'); fake.resume.mockRejectedValue(new Error('Synthetic blocked'));
    await expect(playTimerSound(new AbortController().signal, () => fake as unknown as AudioContext)).rejects.toThrow();
    expect(fake.oscillator.start).not.toHaveBeenCalled(); expect(fake.close).toHaveBeenCalledTimes(1);
  });
});
