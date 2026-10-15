import { createSession } from '../../src/core/session';
export function fixtureSession() {
  const session = createSession('original', 'Synthetic lesson', 1); session.revision = 4;
  session.documentOrder = ['A']; session.documents.A = {
    id: 'A', source: { type: 'pdf', name: 'Synthetic.pdf', size: 100, lastModified: 1, fingerprint: 'a'.repeat(64), fileHandleKey: 'native-reference' },
    knownSlideCount: 2, slideIds: ['A-1', 'A-2'], lastSlideId: 'A-2', dirty: true, mediaBookmarks: {},
    slideDeltas: { 'A-2': { overlays: [{ kind: 'mask', id: 'mask', rect: { x: .1, y: .2, width: .4, height: .5 }, color: '#000', zIndex: 1, visible: true }],
      presenterNote: 'Synthetic teacher note', classLog: 'Synthetic log' } },
  };
  session.presentedSelection = { documentId: 'A', slideId: 'A-2' }; session.editorSelection = { documentId: 'A', slideId: 'A-1' };
  return session;
}
