import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPptxLayer } from '../../src/overlays/pptxLayer';
import { colorCandidates } from '../../src/overlays/canvasLayer';
afterEach(() => vi.unstubAllGlobals());
describe('PPTX overlay sizing is never original pixels', () => {
  it.each([[1600,900,720],[1024,768,960],[900,1600,2276]])('keeps normalized sizing for %s x %s without pretending to sample SVG pixels', (width,height,expected) => {
    const createElement = vi.fn(() => ({ dataset: {}, style: {}, append: vi.fn(), getContext: vi.fn() }));
    vi.stubGlobal('document', { createElement });
    const frame = createPptxLayer(width, height, 'slide');
    expect(frame.source.width).toBe(1280); expect(frame.source.height).toBe(expected);
    expect(frame.source.dataset.slideId).toBe('slide');
    expect(colorCandidates(frame.source,.5,.5)).toEqual([]);
    expect(frame.source.getContext).not.toHaveBeenCalled();
  });
  it.each([[0,720],[-1,720],[NaN,720],[1280,Infinity],[1,1e10],[1e20,1]])('rejects unsafe sizes before any canvas allocation (%s,%s)', (width,height) => {
    const createElement = vi.fn(); vi.stubGlobal('document', { createElement });
    expect(() => createPptxLayer(width,height,'slide')).toThrow(); expect(createElement).not.toHaveBeenCalled();
  });
});
