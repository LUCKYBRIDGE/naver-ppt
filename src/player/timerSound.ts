export async function playTimerSound(signal: AbortSignal, create = () => new AudioContext()): Promise<void> {
  const context = create(); let timeout: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => { void context.close().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (signal.aborted) throw new Error('ALARM_CANCELLED');
    if (context.state !== 'running') await Promise.race([context.resume(), new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('ALARM_BLOCKED')), 1500); })]);
    clearTimeout(timeout);
    if (signal.aborted || context.state !== 'running') throw new Error('ALARM_BLOCKED');
    const start = context.currentTime + .02;
    for (const [offset, frequency] of [[0, 660], [.35, 880]]) {
      const oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.frequency.value = frequency!; gain.gain.setValueAtTime(0, start + offset!);
      gain.gain.linearRampToValueAtTime(.12, start + offset! + .02); gain.gain.linearRampToValueAtTime(0, start + offset! + .25);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(start + offset!); oscillator.stop(start + offset! + .28);
    }
    await new Promise<void>(resolve => { timeout = setTimeout(resolve, 700); });
  } finally { clearTimeout(timeout); signal.removeEventListener('abort', cancel); if (context.state !== 'closed') await context.close().catch(() => {}); }
}
