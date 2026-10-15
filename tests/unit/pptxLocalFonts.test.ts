import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPptxLocalFontCheck, localPptxFontPreflight } from '../../src/adapters/pptx/localFonts';
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
describe('bounded local-only font reference check', () => {
  it('deduplicates trimmed explicit names and excludes theme, broken and oversized values', async () => {
    const check = createPptxLocalFontCheck();
    for (const name of [' Synthetic ', 'Synthetic', '+mn-ea', '', 'a\uFFFD', 'a\u0001', 'x'.repeat(201)]) check.observe(name);
    const load = vi.fn(async () => true), result = await check.check(undefined, load);
    expect(result).toEqual({ candidates: 1, resolved: 1, unresolved: 0, pending: 0, available: true, truncated: false });
    expect(load).toHaveBeenCalledExactlyOnceWith('Synthetic');
    const report = localPptxFontPreflight(result); expect(report[0]?.status).toBe('unknown'); expect(JSON.stringify(report)).not.toContain('Synthetic');
  });
  it('caps unique lookups at 64 and warns that the remainder was not inspected', async () => {
    const check = createPptxLocalFontCheck(); for (let i = 0; i < 100; i++) check.observe(`Synthetic${i}`);
    const load = vi.fn(async () => true), result = await check.check(undefined, load);
    expect(load).toHaveBeenCalledTimes(64); expect(result.truncated).toBe(true);
    expect(localPptxFontPreflight(result)[0]?.message).toContain('64종');
  });
  it('treats rejected or false local lookups as an advisory without claiming missing installation', async () => {
    const check = createPptxLocalFontCheck(); check.observe('First'); check.observe('Second');
    const result = await check.check(undefined, async name => { if (name === 'First') throw Error('Synthetic'); return false; });
    expect(result.unresolved).toBe(2); const item = localPptxFontPreflight(result)[0]!;
    expect(item.status).toBe('warning'); expect(item.message).toContain('기준 PDF'); expect(item.message).toContain('보증이 아닙니다');
  });
  it('keeps unavailable API and absent explicit candidates unverified', async () => {
    vi.stubGlobal('FontFace', undefined);
    const check = createPptxLocalFontCheck(); check.observe('Synthetic');
    const result = await check.check(); expect(result).toMatchObject({ available: false, pending: 1 });
    expect(localPptxFontPreflight(result)[0]?.status).toBe('unknown'); expect(localPptxFontPreflight(await createPptxLocalFontCheck().check())).toEqual([]);
  });
  it('returns within the total deadline and ignores late results', async () => {
    vi.useFakeTimers(); let finish!: (value: boolean) => void;
    const check = createPptxLocalFontCheck(); check.observe('Synthetic');
    const pending = check.check(undefined, () => new Promise(resolve => { finish = resolve; }));
    await vi.advanceTimersByTimeAsync(1500); const result = await pending;
    expect(result.pending).toBe(1); expect(vi.getTimerCount()).toBe(0);
    finish(true); await Promise.resolve(); expect(result.resolved).toBe(0); expect(result.pending).toBe(1);
  });
  it('propagates cancellation immediately and removes listener/timer without accepting late completion', async () => {
    vi.useFakeTimers(); const controller = new AbortController(), remove = vi.spyOn(controller.signal, 'removeEventListener');
    let finish!: (value: boolean) => void;
    const check = createPptxLocalFontCheck(); check.observe('Synthetic');
    const pending = check.check(controller.signal, () => new Promise(resolve => { finish = resolve; }));
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' }); controller.abort(); await rejected;
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function)); expect(vi.getTimerCount()).toBe(0);
    finish(false); await Promise.resolve();
  });
  it('does not start lookups for an already cancelled check', async () => {
    const controller = new AbortController(); controller.abort(); const load = vi.fn(async () => true);
    const check = createPptxLocalFontCheck(); check.observe('Synthetic');
    await expect(check.check(controller.signal, load)).rejects.toMatchObject({ name: 'AbortError' }); expect(load).not.toHaveBeenCalled();
  });
  it('uses only an escaped local CSS string and never adds the FontFace to the document', async () => {
    const sources: string[] = [], faces: string[] = [];
    vi.stubGlobal('FontFace', class { constructor(family: string, source: string) { faces.push(family); sources.push(source); } async load() { return this; } });
    const check = createPptxLocalFontCheck(), name = 'Synthetic"),url(https://invalid.example/font'; check.observe(name);
    expect((await check.check()).resolved).toBe(1); expect(sources).toEqual([`local(${JSON.stringify(name)})`]); expect(faces).toEqual(['pptx-local-preflight']);
  });
});
