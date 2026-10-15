import { beforeEach, describe, expect, it, vi } from 'vitest';
import { inspectPptxTransformReadiness } from '../../src/adapters/pptx/behaviorPreflight';
import { runPptxParserJob } from '../../src/adapters/pptx/isolatedModel';
import { bindPptxRotations } from '../../src/adapters/pptx/rotationBehavior';
import { bindPptxScales } from '../../src/adapters/pptx/scaleBehavior';
vi.mock('../../src/adapters/pptx/isolatedModel', () => ({ runPptxParserJob: vi.fn() }));
vi.mock('../../src/adapters/pptx/rotationBehavior', () => ({ bindPptxRotations: vi.fn(() => new Map()) }));
vi.mock('../../src/adapters/pptx/scaleBehavior', () => ({ bindPptxScales: vi.fn(() => new Map()) }));
const dispose = vi.fn(), bytes = new Uint8Array([1]);
const parts = ['ppt/slides/slide2.xml', 'ppt/slides/slide1.xml'];
const files = { [parts[0]!]: new TextEncoder().encode('<p:sld><p:animRot/></p:sld>'), [parts[1]!]: new TextEncoder().encode('<x:sld><x:animScale/></x:sld>') };
beforeEach(() => {
  vi.clearAllMocks(); vi.mocked(bindPptxRotations).mockReset().mockReturnValue(new Map()); vi.mocked(bindPptxScales).mockReset().mockReturnValue(new Map());
  vi.mocked(runPptxParserJob).mockReset().mockResolvedValue({ model: { slides: [{ animations: [] }, { animations: [] }] }, dispose });
});
describe('PPTX transform readiness (parser and binders mocked)', () => {
  it('does not load the model for slides without transform effects', async () => {
    expect(await inspectPptxTransformReadiness(bytes, {}, parts)).toEqual([]); expect(runPptxParserJob).not.toHaveBeenCalled();
  });
  it('reports source-order pages and alternatives without playing or hiding failures', async () => {
    vi.mocked(bindPptxRotations).mockImplementationOnce(() => { throw Error('PPTX_ROTATION_UNVERIFIED'); });
    const result = await inspectPptxTransformReadiness(bytes, files, parts);
    expect(result[0]?.status).toBe('warning'); expect(result[0]?.message).toContain('1개: 1');
    expect(result[0]?.message).toContain('PDF'); expect(result[0]?.message).toContain('자동 전환하지 않습니다'); expect(dispose).toHaveBeenCalledOnce();
  });
  it('keeps successful bindings distinct from actual playback/fidelity acceptance', async () => {
    const result = await inspectPptxTransformReadiness(bytes, files, parts);
    expect(result[0]?.status).toBe('unknown'); expect(result[0]?.message).toContain('보장하지 않습니다'); expect(dispose).toHaveBeenCalledOnce();
    expect(bindPptxRotations).toHaveBeenCalledTimes(2); expect(bindPptxScales).toHaveBeenCalledTimes(2);
  });
  it('releases assets on cancellation after parsing', async () => {
    const controller = new AbortController(); controller.abort();
    await expect(inspectPptxTransformReadiness(bytes, files, parts, controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(dispose).toHaveBeenCalledOnce();
  });
  it('does not report readiness for an inconsistent model count', async () => {
    vi.mocked(runPptxParserJob).mockResolvedValue({ model: { slides: [] }, dispose });
    await expect(inspectPptxTransformReadiness(bytes, files, parts)).rejects.toThrow('PPTX_MODEL_ORDER_COUNT_MISMATCH'); expect(dispose).toHaveBeenCalledOnce();
  });
  it('propagates parser failure rather than claiming a supported fallback', async () => {
    vi.mocked(runPptxParserJob).mockRejectedValue(Error('PPTX_MODEL_TIMEOUT'));
    await expect(inspectPptxTransformReadiness(bytes, files, parts)).rejects.toThrow('PPTX_MODEL_TIMEOUT'); expect(dispose).not.toHaveBeenCalled();
  });
  it('bounds the list while preserving the number of affected pages', async () => {
    const many = Array.from({ length: 25 }, (_, i) => `slide${i}.xml`), manyFiles = Object.fromEntries(many.map(part => [part, files[parts[0]!]!]));
    vi.mocked(runPptxParserJob).mockResolvedValue({ model: { slides: many.map(() => ({})) }, dispose });
    vi.mocked(bindPptxRotations).mockImplementation(() => { throw Error('PPTX_ROTATION_UNVERIFIED'); });
    const result = await inspectPptxTransformReadiness(bytes, manyFiles, many);
    expect(result[0]?.message).toContain('25개:'); expect(result[0]?.message).toContain('20 외'); expect(result[0]?.message).not.toContain(', 21');
  });
});
