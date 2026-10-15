import { describe, expect, it } from 'vitest';
import { readPptxSourceMediaSettings, sourceMediaPlayback } from '../../src/adapters/pptx/sourceMediaSettings';
import type { BoundPptxMediaTimingTarget } from '../../src/adapters/pptx/mediaTimingBinding';
const p = 'http://schemas.openxmlformats.org/presentationml/2006/main', p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
function node(name: string, attrs: Record<string, string> = {}, children: Element[] = [], namespaceURI = p): Element {
  const value = { localName: name, namespaceURI, children, parentElement: null,
    get attributes() { return Object.keys(attrs).map(name => ({ name, namespaceURI: null })); },
    getAttribute: (key: string) => attrs[key] ?? null, hasAttribute: (key: string) => Object.hasOwn(attrs, key),
    setAttribute: (key: string, value: string) => { attrs[key] = value; },
    removeAttribute: (key: string) => { delete attrs[key]; },
    getElementsByTagNameNS: (space: string, tag: string): Element[] => children.flatMap(child => [
      ...(child.namespaceURI === space && child.localName === tag ? [child] : []), ...child.getElementsByTagNameNS(space, tag)]) } as unknown as Element;
  children.forEach(child => Object.assign(child, { parentElement: value })); return value;
}
function fixture() {
  const common = node('cMediaNode', { vol: '25000', mute: '1', numSld: '1', showWhenStopped: '1' }, [node('cTn', { id: '2' }), node('tgtEl', {}, [node('spTgt', { spid: '7' })])]);
  const trim = node('trim', { st: '100.25', end: '200.5' }, [], p14);
  const pic = node('pic', {}, [node('nvPicPr', {}, [node('cNvPr', { id: '7' }), node('nvPr', {}, [node('media', {}, [trim], p14)])])]);
  const xml = { documentElement: node('sld', {}, [pic, node('timing', {}, [node('video', {}, [common])])]) } as Document;
  const target: BoundPptxMediaTimingTarget = { node: 'video', shapeId: 7, timingId: 2, slideId: 'slide', sourcePart: 'ppt/slides/slide1.xml',
    sourceFingerprint: 'a'.repeat(64), mediaFingerprint: 'b'.repeat(64), kind: 'video', elementPath: [1] };
  return { xml, target, common, trim, pic };
}
describe('explicit original media playback settings', () => {
  it('converts percentage and millisecond trim amounts using native duration', () => {
    const f = fixture(), settings = readPptxSourceMediaSettings(f.xml, f.target);
    expect(settings).toEqual({ volume: .25, muted: true, trimStartSec: .10025, trimEndSec: .2005, limitations: [] });
    expect(sourceMediaPlayback(settings, 4)).toEqual({ startSec: .10025, endSec: 3.7995, volume: .25, muted: true });
  });
  it.each(['volume', 'muted', 'trim', 'target', 'duplicate', 'wrongParent'])('refuses malformed %s instead of clamping or applying another shape', boundary => {
    const f = fixture();
    if (boundary === 'volume') f.common.setAttribute('vol', '100001');
    if (boundary === 'muted') f.common.setAttribute('mute', 'yes');
    if (boundary === 'trim') f.trim.setAttribute('st', '-1');
    if (boundary === 'target') f.target.shapeId = 8;
    if (boundary === 'duplicate') (f.pic.children as unknown as Element[]).push(node('media', {}, [node('trim', {}, [], p14)], p14));
    if (boundary === 'wrongParent') Object.assign(f.trim.parentElement!, { localName: 'other' });
    expect(() => readPptxSourceMediaSettings(f.xml, f.target)).toThrow('PPTX_SOURCE_MEDIA_SETTINGS_UNVERIFIED');
  });
  it('keeps unsupported settings visible without claiming timeline execution', () => {
    const f = fixture(); f.common.setAttribute('numSld', '2'); f.common.setAttribute('showWhenStopped', 'false'); f.common.setAttribute('unknown', 'value');
    expect(readPptxSourceMediaSettings(f.xml, f.target).limitations).toEqual(['unknown-media-setting', 'cross-slide-media', 'hide-when-stopped']);
  });
  it('distinguishes absent source volume/mute from explicit zero and false', () => {
    const f = fixture(); f.common.removeAttribute('vol'); f.common.removeAttribute('mute');
    const settings = readPptxSourceMediaSettings(f.xml, f.target);
    expect(settings).toMatchObject({ volume: null, muted: null, limitations: ['source-defaults-unverified'] });
    expect(sourceMediaPlayback(settings, 4)).toMatchObject({ volume: 1, muted: false });
    f.common.setAttribute('vol', '0'); f.common.setAttribute('mute', 'false');
    expect(readPptxSourceMediaSettings(f.xml, f.target)).toMatchObject({ volume: 0, muted: false, limitations: [] });
  });
  it.each([.1, NaN, Infinity, 86401])('rejects unusable duration %s before any registration', duration => {
    const f = fixture(); expect(() => sourceMediaPlayback(readPptxSourceMediaSettings(f.xml, f.target), duration)).toThrow('PPTX_SOURCE_MEDIA_SETTINGS_UNVERIFIED');
  });
});
