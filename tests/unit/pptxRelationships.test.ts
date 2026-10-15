import { describe, expect, it } from 'vitest';
import { isUnsafeExternalTarget, relationshipSource, resolveInternalTarget } from '../../src/adapters/pptx/relationshipTargets';

describe('PPTX relationship targets', () => {
  it('maps package and part relationship owners', () => {
    expect(relationshipSource('_rels/.rels')).toBeNull();
    expect(relationshipSource('ppt/slides/_rels/slide1.xml.rels')).toBe('ppt/slides/slide1.xml');
    expect(relationshipSource('_rels/item.xml.rels')).toBe('item.xml');
    expect(() => relationshipSource('ppt/bad.rels')).toThrow('PPTX_INVALID_RELATIONSHIPS');
  });
  it('resolves normal relative, root and fragment references', () => {
    expect(resolveInternalTarget('ppt/slides/slide1.xml', '../media/image1.png')).toBe('ppt/media/image1.png');
    expect(resolveInternalTarget('ppt/slides/slide1.xml', '/ppt/slides/slide2.xml')).toBe('ppt/slides/slide2.xml');
    expect(resolveInternalTarget(null, './ppt/presentation.xml')).toBe('ppt/presentation.xml');
    expect(resolveInternalTarget('ppt/presentation.xml', 'slides/slide2.xml#shape1')).toBe('ppt/slides/slide2.xml');
    expect(resolveInternalTarget('ppt/slides/slide1.xml', '../media/lesson%20image.png')).toBe('ppt/media/lesson image.png');
  });
  it.each(['../../../outside.xml', '//host/share', 'https://example.invalid/a', '../media/%2e%2e/a', '../media/%2fetc', '../media/%252e', '../media/a%00', '../media/a?b', '../media/a\\b', '../media/', '../media/%zz', ''])('rejects ambiguous or escaping target %s', target => {
    expect(() => resolveInternalTarget('ppt/slides/slide1.xml', target)).toThrow('PPTX_UNSAFE_TARGET');
  });
  it.each(['javascript:alert(1)', 'file:///private', 'data:text/html,x', '../relative', 'https://user:secret@example.invalid', '//example.invalid/a', ' https://example.invalid'])('classifies unsafe external target without fetching %s', target => {
    expect(isUnsafeExternalTarget(target)).toBe(true);
  });
  it.each(['https://example.invalid/a', 'http://example.invalid', 'mailto:fake@example.invalid'])('classifies conventional URI without granting execution %s', target => {
    expect(isUnsafeExternalTarget(target)).toBe(false);
  });
});
