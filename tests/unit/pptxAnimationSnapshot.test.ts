import { describe, expect, it } from 'vitest';
import { applyPptxAnimationPose, isPptxAnimationPose } from '../../src/adapters/pptx/animationSnapshot';

const scope = { sessionId: 's', documentId: 'd', slideId: 'a', revision: 3 };
const entry = { target: 4, opacity: 1, transform: 'matrix(1, 0, 0, 1, 240, 0)', clipPath: 'none', visible: true };
const pose = () => ({ version: 1, scope, entries: [{ ...entry }] });
describe('PPTX completed animation pose boundary', () => {
  it('accepts a serialized finite pose', () => { expect(isPptxAnimationPose(JSON.parse(JSON.stringify(pose())))).toBe(true); });
  it.each(['none', 'matrix(0, 1, -1, 0, 0, 0)', 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,2e2,0,0,1)'])('accepts computed %s', transform => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, transform }] })).toBe(true);
  });
  it.each(['url(https://example.invalid)', 'translate(20px)', 'matrix(1,0,0,1,Infinity,0)', 'matrix(1,0,0,1,1000001,0)', 'matrix(1,0,0,1,0)', 'matrix(1,0,0,1,0,0);color:red'])('rejects unsafe transforms', transform => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, transform }] })).toBe(false);
  });
  it.each(['inset(0px)', 'inset(0% 10px 20% 0px)'])('accepts computed %s', clipPath => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, clipPath }] })).toBe(true);
  });
  it.each(['url(#external)', 'inset(-1px)', 'inset(0px 0px 0px 0px 0px)', 'inset(1000001px)'])('rejects unverified clip values', clipPath => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, clipPath }] })).toBe(false);
  });
  it.each([NaN, -1, 1.1, '1'])('rejects non-normalized opacity', opacity => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, opacity }] })).toBe(false);
  });
  it('rejects duplicate/excessive targets and extra fields', () => {
    expect(isPptxAnimationPose({ ...pose(), entries: [entry, entry] })).toBe(false);
    expect(isPptxAnimationPose({ ...pose(), entries: Array(5001).fill(entry) })).toBe(false);
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, content: 'untrusted' }] })).toBe(false);
  });
  it.each(['sessionId', 'documentId', 'slideId', 'revision'] as const)('rejects stale %s before touching DOM', key => {
    const querySelector = () => { throw Error('must not read DOM'); };
    const changed = { ...scope, [key]: key === 'revision' ? 4 : 'other' };
    expect(() => applyPptxAnimationPose({ querySelector }, pose(), changed)).toThrow('PPTX_INVALID_ANIMATION_POSE');
  });
  it('does not partially apply a pose with a missing target', () => {
    const element = { style: {} }, root = { querySelector: (selector: string) => selector.includes('4') ? element as unknown as Element : null };
    expect(() => applyPptxAnimationPose(root, { ...pose(), entries: [entry, { ...entry, target: 5 }] }, scope)).toThrow('PPTX_POSE_TARGET_MISSING');
    expect(element.style).toEqual({});
  });
  it.each([-1, 0, 1.5, NaN, 4294967296, '4'])('rejects invalid targets', target => {
    expect(isPptxAnimationPose({ ...pose(), entries: [{ ...entry, target }] })).toBe(false);
  });
  it('requires own fields, not prototype substitutions', () => {
    const inherited = Object.assign(Object.create({ revision: 3 }), { sessionId: 's', documentId: 'd', slideId: 'a', extra: 1 });
    expect(isPptxAnimationPose({ ...pose(), scope: inherited })).toBe(false);
  });
  it('applies only validated computed fields', () => {
    const element = { style: {} }, root = { querySelector: () => element as unknown as Element };
    applyPptxAnimationPose(root, pose(), scope);
    expect(element.style).toEqual({ opacity: '1', transform: entry.transform, clipPath: 'none', visibility: 'visible' });
  });
});
