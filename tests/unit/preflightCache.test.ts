import { describe, expect, it } from 'vitest';
import { InspectionCache, inspectionKey } from '../../src/preflight/cache';
const value = () => ({ pageCount: 3, inspectedPages: [1, 3], externalLinks: 1, scripts: false, annotationKinds: ['Link'] });
describe('bounded PDF inspection cache', () => {
  it('separates fingerprints, exact pages/count and environment', () => {
    const key = inspectionKey('a'.repeat(64), 3, [1, 3], 'Whale|PDF.js');
    for (const other of [inspectionKey('b'.repeat(64), 3, [1, 3], 'Whale|PDF.js'), inspectionKey('a'.repeat(64), 3, [1, 2, 3], 'Whale|PDF.js'), inspectionKey('a'.repeat(64), 4, [1, 3], 'Whale|PDF.js'), inspectionKey('a'.repeat(64), 3, [1, 3], 'updated environment')]) expect(other).not.toBe(key);
    expect(() => inspectionKey('a'.repeat(64), 3, [3, 1], 'env')).toThrow();
  });
  it('clones results and excludes accidental source/private fields', () => {
    const cache = new InspectionCache(), original = { ...value(), bytes: [1], note: 'Synthetic private' }; cache.set('key', original, 100);
    original.inspectedPages[0] = 2; const copy = cache.get('key', 200)!; copy.annotationKinds.push('Sound');
    expect(cache.get('key', 200)?.inspectedPages).toEqual([1, 3]); expect(cache.get('key', 200)?.annotationKinds).toEqual(['Link']); expect(JSON.stringify(copy)).not.toContain('Synthetic private'); expect(copy).not.toHaveProperty('bytes');
  });
  it('expires after five minutes or backward wall clock movement', () => {
    const cache = new InspectionCache(); cache.set('a', value(), 1000); expect(cache.get('a', 300999)).toBeDefined(); expect(cache.get('a', 301000)).toBeUndefined();
    cache.set('b', value(), 1000); expect(cache.get('b', 999)).toBeUndefined();
  });
  it('retains only 32 LRU entries and rejects invalid summary', () => {
    const cache = new InspectionCache(); for (let i = 0; i < 32; i++) cache.set(String(i), value(), 100);
    cache.get('0', 100); cache.set('new', value(), 100); expect(cache.get('0', 100)).toBeDefined(); expect(cache.get('1', 100)).toBeUndefined();
    expect(() => cache.set('bad', { ...value(), externalLinks: Infinity }, 100)).toThrow(); expect(() => cache.set('bad', { ...value(), inspectedPages: [0] }, 100)).toThrow();
  });
});
