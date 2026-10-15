import type { ImageElement, GroupElement } from '@web-ppt/core';
import { describe, expect, it } from 'vitest';
import { pptxMediaElement, pptxMediaCrop } from '../../src/adapters/pptx/mediaSlots';
const image = (): ImageElement => ({ kind: 'image', id: 3, x: 12, y: 18, w: 320, h: 180, rot: 30, flipH: true, flipV: false,
  src: '', crop: null, media: { kind: 'video', mime: 'video/mp4', src: 'blob:owned' } });
const group = (child: ImageElement): GroupElement => ({ kind: 'group', id: 2, x: 100, y: 200, w: 400, h: 300, rot: 20, flipH: false, flipV: true,
  childX: 0, childY: 0, scaleX: .5, scaleY: .75, children: [child] });
describe('PPTX source media placement boundary', () => {
  it('resolves exact nested element path and retains source geometry/flips rather than flattening to a global video', () => {
    const media = image(); expect(pptxMediaElement({ elements: [group(media)] }, [0, 0])).toBe(media);
    expect(media.rot).toBe(30); expect(media.flipH).toBe(true);
  });
  it.each([[], [-1], [0.5], [1], [0, 0], Array(34).fill(0)].map(path => ({ path })))('rejects missing or malformed source path $path', ({ path }) => {
    expect(() => pptxMediaElement({ elements: [image()] }, path)).toThrow('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  });
  it.each([
    { id: undefined }, { id: 0 }, { w: 0 }, { h: Infinity }, { x: NaN }, { rot: Infinity },
    { clipPath: 'url(https://example.invalid)' }, { crop: { l: .9, t: 0, r: .2, b: 0 } }, { effects: { reflection: { alpha: 1, size: .5, distance: 10 } } },
    { filter: 'url(https://example.invalid)' }, { alpha: -1 },
  ])('rejects unsupported or unsafe geometry %j instead of fabricating source fidelity', change => {
    expect(() => pptxMediaElement({ elements: [{ ...image(), ...change } as unknown as ImageElement] }, [0])).toThrow('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  });
  it('rejects unsafe group coordinate systems before resolving a child', () => {
    const parent = group(image()); parent.scaleX = 0;
    expect(() => pptxMediaElement({ elements: [parent] }, [0, 0])).toThrow();
    parent.scaleX = .5; parent.childX = Infinity; expect(() => pptxMediaElement({ elements: [parent] }, [0, 0])).toThrow();
  });
  it('maps source crop fractions to scaled native content inside the original viewport', () => {
    const media = image(); media.crop = { l: .25, r: .25, t: .1, b: .1 }; media.clipPath = 'M0 0 H320 V180 H0 Z';
    expect(pptxMediaElement({ elements: [media] }, [0])).toBe(media);
    expect(pptxMediaCrop(media)).toEqual({ width: 200, height: 125, left: -50, top: -12.5 });
  });
  it.each([{ l: -1, t: 0, r: 0, b: 0 }, { l: NaN, t: 0, r: 0, b: 0 }, { l: 0, t: 0, r: 1, b: 0 }, { l: 0, t: 0 }, { l: 0, t: 0, r: 0, b: 0, bytes: 1 }])('rejects invalid crop %j', crop => {
    expect(() => pptxMediaCrop({ crop, clipPath: null } as unknown as ImageElement)).toThrow('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  });
  it.each(['', 'M1e999 0', 'M1000001 0', '<script/>', 'M0 0 ' + 'L1 1 '.repeat(15000)])('rejects unsafe or excessive clip path', clipPath => {
    expect(() => pptxMediaCrop({ crop: null, clipPath })).toThrow('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  });
});
