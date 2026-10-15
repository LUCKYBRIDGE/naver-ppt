import { describe, expect, it } from 'vitest';
import { safeSvgAttribute, safeSvgStyle } from '../../src/adapters/pptx/svgBoundary';
describe('PPTX generated SVG attribute boundary', () => {
  it.each(['onclick', 'onload', 'srcdoc', 'src', 'action', 'formaction', 'background'])('rejects active attribute %s', name => {
    expect(safeSvgAttribute(name, 'anything')).toBe(false);
  });
  it.each(['https://example.invalid', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'file:///private', 'blob:unknown'])('rejects unowned URI %s', uri => {
    expect(safeSvgAttribute('href', uri)).toBe(false);
  });
  it('allows embedded bitmap and local paint references', () => {
    expect(safeSvgAttribute('href', 'data:image/png;base64,AAAA')).toBe(true);
    expect(safeSvgAttribute('xlink:href', '#paint-1')).toBe(true);
    expect(safeSvgAttribute('fill', 'url(#paint-1)')).toBe(true);
    expect(safeSvgAttribute('style', 'font-family:Calibri;color:red')).toBe(true);
    expect(safeSvgAttribute('href', 'blob:owned', new Set(['blob:owned']))).toBe(true);
  });
  it.each(['background:url(https://example.invalid)', 'fill:url(#safe);background:url(file:///private)', '@import "remote.css"', 'expression(alert(1))', '@font-face{src:url(a)}', String.raw`fill:\75rl(https://example.invalid)`, 'fill:/*x*/url(#safe)'])('rejects external CSS %s', style => {
    expect(safeSvgStyle(style)).toBe(false);
  });
});
