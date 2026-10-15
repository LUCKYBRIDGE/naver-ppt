import { describe, expect, it } from 'vitest';
import { createSession } from '../../src/core/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';
describe('PPTX Player identity projection', () => {
  it('copies only the presented document IDs and keeps source name and private deltas out', () => {
    const session = createSession('lesson', 'Synthetic lesson', 0);
    session.documents.A = { id: 'A', source: { type: 'pptx', name: 'Synthetic private filename.pptx', fingerprint: 'a'.repeat(64), size: 4, lastModified: 0 }, knownSlideCount: 2, slideIds: ['a1','a2'], lastSlideId: null, slideDeltas: { a1: { overlays: [], presenterNote: 'Synthetic private note', classLog: 'Synthetic private log' } }, mediaBookmarks: {}, dirty: false };
    session.documents.B = { ...structuredClone(session.documents.A), id: 'B', slideIds: ['b1','b2'] };
    session.documentOrder = ['A','B']; session.presentedSelection = { documentId: 'A', slideId: 'a1' };
    const snapshot = toPlayerSnapshot(session);
    expect(snapshot.pptx?.slideIds).toEqual(['a1','a2']); expect(JSON.stringify(snapshot)).not.toContain('private'); expect(JSON.stringify(snapshot)).not.toContain('b1');
    snapshot.pptx!.slideIds!.push('changed'); expect(session.documents.A.slideIds).toEqual(['a1','a2']);
  });
  it('does not project PPTX metadata for PDF or standby', () => {
    const session = createSession('lesson', 'Synthetic lesson', 0); expect(toPlayerSnapshot(session).pptx).toBeUndefined();
    session.documents.A = { id: 'A', source: { type: 'pdf', name: 'Synthetic.pdf', size: 4, lastModified: 0 }, knownSlideCount: 1, slideIds: ['a1'], lastSlideId: null, slideDeltas: {}, mediaBookmarks: {}, dirty: false };
    session.documentOrder = ['A']; session.presentedSelection = { documentId: 'A', slideId: 'a1' }; expect(toPlayerSnapshot(session).pptx).toBeUndefined();
  });
});
