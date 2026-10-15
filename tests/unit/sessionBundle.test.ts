import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { createSessionBundle, encodeSessionBundle, decodeSessionBundle, restoreSessionBundle, MAX_BUNDLE_BYTES } from '../../src/storage/sessionBundle';
import { isSessionRequest, canRequest } from '../../src/shared/sessionMessages';
import { assertSessionRecord } from '../../src/storage/validateSessionRecord';
import { restoredPptxCheckpointPose } from '../../src/core/pptxPlayback';

function pptxSession() {
  const session = fixtureSession(), doc = session.documents.A!;
  doc.source.type = 'pptx';
  doc.pptxPlayback = { run: null, request: null, checkpoints: { 'A-2': {
    renderer: 'web-ppt-0.4.5/transform-v1', fingerprint: 'a'.repeat(64), completedGroups: 1,
    pose: { version: 1, scope: { sessionId: session.id, documentId: 'A', slideId: 'A-2', revision: 3 },
      entries: [{ target: 3, opacity: 1, transform: 'matrix(0,1,-1,0,20,0)', clipPath: 'none', visible: false }] },
  } } };
  return session;
}

describe('PPTX local metadata backup and explicit safe resume', () => {
  it('round trips complete pose, private deltas and stable IDs with no source handles/bytes', () => {
    const source = pptxSession(), before = structuredClone(source);
    const bundle = decodeSessionBundle(encodeSessionBundle(source, 100));
    expect(bundle.session.documents.A!.pptxPlayback).toEqual(source.documents.A!.pptxPlayback);
    expect(bundle.session.documents.A!.slideDeltas).toEqual(source.documents.A!.slideDeltas);
    expect(JSON.stringify(bundle)).not.toContain('fileHandleKey'); expect(source).toEqual(before);
  });
  it.each(['run', 'request'] as const)('drops historical %s only during restore and rebases complete pose to new session/revision', kind => {
    const source = pptxSession(), playback = source.documents.A!.pptxPlayback!;
    if (kind === 'run') playback.run = { epoch: 'running', slideId: 'A-2' };
    else playback.request = { commandId: 'waiting', slideId: 'A-2' };
    const bundle = createSessionBundle(source, 100), before = structuredClone(bundle);
    const restored = restoreSessionBundle(bundle, 'new-lesson', 200);
    expect(bundle).toEqual(before); expect(restored.presentedSelection).toBeNull();
    expect(restored.documents.A!.pptxPlayback).toMatchObject({ run: null, request: null });
    const checkpoint = restored.documents.A!.pptxPlayback!.checkpoints['A-2']!;
    const scope = { sessionId: 'new-lesson', documentId: 'A', slideId: 'A-2', revision: 0 };
    expect(checkpoint.pose.scope).toEqual(scope);
    expect(restoredPptxCheckpointPose(checkpoint, 'a'.repeat(64), scope).entries).toEqual(playback.checkpoints['A-2']!.pose.entries);
    expect(() => assertSessionRecord({ session: restored, receipts: [] })).not.toThrow();
  });
  it('accepts PPTX without checkpoint state and legacy optional request field', () => {
    const source = pptxSession(); delete source.documents.A!.pptxPlayback!.request;
    expect(restoreSessionBundle(createSessionBundle(source, 100), 'copy', 200).documents.A!.pptxPlayback).not.toHaveProperty('request');
    delete source.documents.A!.pptxPlayback;
    expect(restoreSessionBundle(createSessionBundle(source, 100), 'copy', 200).documents.A!).not.toHaveProperty('pptxPlayback');
  });
  it.each(['fingerprint', 'session', 'slide', 'revision', 'css', 'bytes'] as const)('rejects tampered %s before rebasing could hide it', boundary => {
    const bundle = createSessionBundle(pptxSession(), 100), cp = bundle.session.documents.A!.pptxPlayback!.checkpoints['A-2']!;
    if (boundary === 'fingerprint') cp.fingerprint = 'b'.repeat(64);
    if (boundary === 'session') cp.pose.scope.sessionId = 'other';
    if (boundary === 'slide') cp.pose.scope.slideId = 'A-1';
    if (boundary === 'revision') cp.pose.scope.revision = 5;
    if (boundary === 'css') cp.pose.entries[0]!.transform = 'url(https://example.invalid/private)';
    if (boundary === 'bytes') Object.assign(bundle.session.documents.A!.source, { bytes: [1,2,3] });
    expect(() => restoreSessionBundle(bundle, 'copy', 200)).toThrow();
  });
  it('bounds PPTX to the runtime 1000-page limit without changing the PDF 2000-page limit', () => {
    const source = fixtureSession(), doc = source.documents.A!;
    doc.slideIds = Array.from({ length: 1001 }, (_, i) => `slide-${i}`); doc.knownSlideCount = 1001;
    doc.lastSlideId = null; doc.slideDeltas = {}; source.presentedSelection = source.editorSelection = null;
    expect(() => createSessionBundle(source, 100)).not.toThrow();
    doc.source.type = 'pptx'; expect(() => createSessionBundle(source, 100)).toThrow('1000쪽');
  });
});

describe('FR-013/014/020 versioned local editing information', () => {
  it('round trips stable IDs, notes, overlays and positions without native handles', () => {
    const source = fixtureSession(), before = structuredClone(source);
    const bundle = decodeSessionBundle(encodeSessionBundle(source, 100));
    expect(bundle).toEqual(createSessionBundle(source, 100)); expect(source).toEqual(before);
    expect(JSON.stringify(bundle)).not.toContain('fileHandleKey');
    expect(bundle.session.documents.A?.slideDeltas['A-2']?.presenterNote).toBe('Synthetic teacher note');
  });
  it('restores as revision zero, preserves last page and does not start the audience or media', () => {
    const source = fixtureSession(); source.globalTimer = { scope: 'session', documentId: null, durationSec: 60, startedAt: 10, elapsedBeforeStartMs: 2, paused: false };
    const restored = restoreSessionBundle(createSessionBundle(source, 100), 'copy', 200);
    expect(restored.id).toBe('copy'); expect(restored.revision).toBe(0); expect(restored.presentedSelection).toBeNull();
    expect(restored.documents.A?.lastSlideId).toBe('A-2'); expect(restored.editorSelection).toEqual(source.editorSelection);
    expect(restored.globalTimer).toMatchObject({ paused: true, startedAt: null }); expect(source.globalTimer.paused).toBe(false);
  });
  it('rejects unknown schema, unexpected fields and original bytes', () => {
    const bundle = createSessionBundle(fixtureSession(), 100);
    const decode = (value: unknown) => decodeSessionBundle(new TextEncoder().encode(JSON.stringify(value)));
    expect(() => decode({ ...bundle, schemaVersion: 2 })).toThrow('버전');
    expect(() => decode({ ...bundle, bytes: [1, 2] })).toThrow();
    Object.assign(bundle.session.documents.A!.source, { bytes: [1] });
    expect(() => decode(bundle)).toThrow();
  });
  it('rejects invalid encoding, oversized files, deep objects and unsupported formats', () => {
    expect(() => decodeSessionBundle(new Uint8Array([0xff]))).toThrow('UTF-8');
    expect(() => decodeSessionBundle(new Uint8Array(MAX_BUNDLE_BYTES + 1))).toThrow('16MB');
    let nested: unknown = {}; for (let i = 0; i < 35; i++) nested = { child: nested };
    expect(() => decodeSessionBundle(new TextEncoder().encode(JSON.stringify(nested)))).toThrow('구조');
    const session = fixtureSession(); session.documents.A!.source.type = 'ppt';
    expect(() => createSessionBundle(session, 100)).toThrow('PDF 또는 PPTX');
  });
  it('requires a trustworthy fingerprint and bounds document/page count', () => {
    const session = fixtureSession(); const source = session.documents.A!.source;
    if (source.type !== 'pdf') throw new Error('fixture'); delete source.fingerprint;
    expect(() => createSessionBundle(session, 100)).toThrow();
    source.fingerprint = 'a'.repeat(64);
    session.documents.A!.slideIds = Array.from({ length: 2001 }, (_, i) => `page-${i}`); session.documents.A!.knownSlideCount = 2001;
    session.documents.A!.lastSlideId = null; session.documents.A!.slideDeltas = {}; session.presentedSelection = session.editorSelection = null;
    expect(() => createSessionBundle(session, 100)).toThrow();
  });
  it('bounds total JSON nodes and registered document count independently of reference validation', () => {
    expect(() => decodeSessionBundle(new TextEncoder().encode(JSON.stringify(Array(250001).fill(0))))).toThrow('구조 한도');
    const session = fixtureSession();
    for (let i = 0; i < 16; i++) { const doc = structuredClone(session.documents.A!); doc.id = `extra-${i}`; session.documents[doc.id] = doc; session.documentOrder.push(doc.id); }
    expect(() => createSessionBundle(session, 100)).toThrow();
  });
  it('allows only Launcher to import validated bundles', () => {
    const request = { type: 'IMPORT_SESSION', bundle: createSessionBundle(fixtureSession(), 100) };
    expect(isSessionRequest(request)).toBe(true); if (!isSessionRequest(request)) throw new Error('fixture');
    expect(canRequest('launcher', request)).toBe(true);
    for (const role of ['editor', 'remote', 'player'] as const) expect(canRequest(role, request)).toBe(false);
    expect(isSessionRequest({ ...request, bundle: { ...request.bundle, schemaVersion: 99 } })).toBe(false);
  });
});
