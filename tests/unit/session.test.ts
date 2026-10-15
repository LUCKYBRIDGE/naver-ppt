import { describe, expect, it } from 'vitest';
import type { SessionCommand } from '../../src/core/commands';
import { CommandError, createSession, reduceSession } from '../../src/core/session';
import type { ClassSession, PresentationDocumentState } from '../../src/core/types';
import { SessionService, type SessionRecord, type SessionRepository } from '../../src/storage/sessionService';
import type { OverlayData } from '../../src/overlays/types';
import { isApprovedWebPresentationUrl } from '../../src/core/webLinks';

describe('W0 web link boundary', () => {
  it('allows only HTTPS links on the matching provider domain', () => {
    expect(isApprovedWebPresentationUrl('canva', 'https://www.canva.com/design/abc')).toBe(true);
    expect(isApprovedWebPresentationUrl('miricanvas', 'https://app.miricanvas.com/templates/abc')).toBe(true);
    for (const [type, url] of [['canva', 'http://canva.com/a'], ['canva', 'https://miricanvas.com/a'], ['canva', 'https://canva.com/a#private'], ['miricanvas', 'https://user:secret@miricanvas.com/a']] as const) expect(isApprovedWebPresentationUrl(type, url)).toBe(false);
  });

  it('keeps an approved W0 link as a location-only document without inventing a slide', () => {
    const initial = createSession('lesson', 'Synthetic lesson', 0);
    const link: PresentationDocumentState = { id: 'canva-link', source: { type: 'canva', url: 'https://www.canva.com/design/abc', title: '수업 자료' },
      lastSlideId: null, knownSlideCount: null, slideIds: [], slideDeltas: {}, mediaBookmarks: {}, dirty: false };
    const result = reduceSession(initial, { ...context(initial), type: 'REGISTER_DOCUMENT', documentId: link.id, slideId: null, document: link }, 10);
    expect(result.documents[link.id]).toEqual(link);
    expect(result.presentedSelection).toBeNull();
    expect(result.editorSelection).toBeNull();
  });
});

function document(id: string): PresentationDocumentState {
  return {
    id, source: { type: 'pdf', name: `${id}.pdf`, size: 100, lastModified: 0 },
    lastSlideId: null, knownSlideCount: 8, slideIds: Array.from({ length: 8 }, (_, i) => `${id}-${i + 1}`),
    slideDeltas: {}, mediaBookmarks: {}, dirty: false,
  };
}
function context(session: ClassSession, commandId = `command-${session.revision}`) {
  return { sessionId: session.id, commandId, revision: session.revision };
}
function seeded() {
  let state = createSession('lesson', 'Synthetic lesson', 0);
  for (const id of ['A', 'B']) state = reduceSession(state, {
    ...context(state), type: 'REGISTER_DOCUMENT', documentId: id, slideId: null, document: document(id),
  }, 1);
  return state;
}
function activate(state: ClassSession, id: string) {
  return reduceSession(state, { ...context(state), type: 'ACTIVATE_DOCUMENT', documentId: id, slideId: null }, 2);
}
function goto(state: ClassSession, id: string, slideId: string) {
  return reduceSession(state, { ...context(state), type: 'GOTO_SLIDE', documentId: id, slideId }, 3);
}

class TestRepository implements SessionRepository {
  record: SessionRecord = { session: activate(seeded(), 'A'), receipts: [] };
  fail = false;
  commits = 0;
  async read() { return structuredClone(this.record); }
  async commit(record: SessionRecord, expected: number) {
    if (this.fail) throw new Error('disk unavailable');
    if (this.record.session.revision !== expected) throw new CommandError('STALE_REVISION');
    this.record = structuredClone(record);
    this.commits++;
  }
}
function move(repository: TestRepository, id = 'move'): SessionCommand {
  return { ...context(repository.record.session, id), type: 'GOTO_SLIDE', documentId: 'A', slideId: 'A-5' };
}

describe('PRD v5 Stage A: independent session state', () => {
  it('registers a new document without exposing it to the audience', () => {
    const original = goto(activate(seeded(), 'A'), 'A', 'A-5');
    const next = reduceSession(original, {
      ...context(original), type: 'REGISTER_DOCUMENT', documentId: 'C', slideId: null, document: document('C'),
    }, 4);
    expect(next.presentedSelection).toEqual({ documentId: 'A', slideId: 'A-5' });
    expect(original.documentOrder).toEqual(['A', 'B']);
    expect(next.documentOrder).toEqual(['A', 'B', 'C']);
  });
  it('restores A5 after A5 -> B2 -> A', () => {
    let state = goto(activate(seeded(), 'A'), 'A', 'A-5');
    state = goto(activate(state, 'B'), 'B', 'B-2');
    state = activate(state, 'A');
    expect(state.presentedSelection).toEqual({ documentId: 'A', slideId: 'A-5' });
    expect(state.documents.B?.lastSlideId).toBe('B-2');
  });
  it('keeps A5 visible while selecting B8 and saving its private note', () => {
    const original = goto(activate(seeded(), 'A'), 'A', 'A-5');
    let state = reduceSession(original, {
      ...context(original), type: 'SELECT_EDITOR_SLIDE', documentId: 'B', slideId: 'B-8',
    }, 4);
    state = reduceSession(state, {
      ...context(state), type: 'SET_PRESENTER_NOTE', documentId: 'B', slideId: 'B-8', note: 'Private teacher note',
    }, 5);
    expect(state.presentedSelection).toEqual(original.presentedSelection);
    expect(state.editorSelection).toEqual({ documentId: 'B', slideId: 'B-8' });
    expect(state.documents.B?.lastSlideId).toBeNull();
    expect(state.documents.B?.slideDeltas['B-8']?.presenterNote).toBe('Private teacher note');
    expect(original.documents.B?.dirty).toBe(false);
  });
  it('rejects stale revisions and wrong sessions without changing input', () => {
    const state = activate(seeded(), 'A');
    const command: SessionCommand = { ...context(state), type: 'GOTO_SLIDE', documentId: 'A', slideId: 'A-2' };
    expect(() => reduceSession(state, { ...command, revision: 0 }, 5)).toThrow('STALE_REVISION');
    expect(() => reduceSession(state, { ...command, sessionId: 'other' }, 5)).toThrow('INVALID_CONTEXT');
    expect(state.presentedSelection?.slideId).toBe('A-1');
  });
  it('commits overlays without changing either selection or private notes', () => {
    let state = goto(activate(seeded(), 'A'), 'A', 'A-5');
    state = reduceSession(state, { ...context(state), type: 'SELECT_EDITOR_SLIDE', documentId: 'B', slideId: 'B-8' }, 4);
    state = reduceSession(state, { ...context(state), type: 'SET_PRESENTER_NOTE', documentId: 'B', slideId: 'B-8', note: 'Private' }, 5);
    const overlays: OverlayData[] = [{ id: 'mask', kind: 'mask', zIndex: 1, visible: true, color: '#000', rect: { x: 0, y: 0, width: .5, height: .5 } }];
    const command: SessionCommand = { ...context(state), type: 'SET_SLIDE_OVERLAYS', documentId: 'B', slideId: 'B-8', overlays };
    const next = reduceSession(state, command, 6);
    expect(next.presentedSelection).toEqual(state.presentedSelection); expect(next.editorSelection).toEqual(state.editorSelection);
    expect(next.documents.B?.slideDeltas['B-8']?.presenterNote).toBe('Private');
    expect(next.documents.B?.slideDeltas['B-8']?.overlays).toEqual(overlays);
    overlays[0]!.visible = false; expect(next.documents.B?.slideDeltas['B-8']?.overlays[0]?.visible).toBe(true);
    expect(() => reduceSession(next, command, 7)).toThrow('STALE_REVISION');
    expect(() => reduceSession(state, { ...command, overlays: [{ ...overlays[0]!, color: 'url(external)' }] }, 7)).toThrow('INVALID_TARGET');
  });
  it('rejects missing pages and navigation on an inactive document', () => {
    const state = activate(seeded(), 'A');
    expect(() => goto(state, 'A', 'missing')).toThrow('INVALID_TARGET');
    expect(() => goto(state, 'B', 'B-2')).toThrow('INVALID_TARGET');
    expect(() => activate(state, 'missing')).toThrow('INVALID_TARGET');
  });
  it('rejects duplicate document registration and invalid slide contracts', () => {
    const state = seeded();
    const command: SessionCommand = {
      ...context(state), type: 'REGISTER_DOCUMENT', documentId: 'A', slideId: null, document: document('A'),
    };
    expect(() => reduceSession(state, command, 5)).toThrow('INVALID_TARGET');
    const bad = document('C'); bad.slideIds[1] = bad.slideIds[0]!;
    expect(() => reduceSession(state, { ...command, documentId: 'C', document: bad }, 5)).toThrow('INVALID_TARGET');
  });
  it('does not resolve inherited object properties as documents', () => {
    expect(() => activate(seeded(), 'toString')).toThrow('INVALID_TARGET');
  });
});

describe('Stage A: persistence coordination (repository test double)', () => {
  it('waits for the repository commit before returning success', async () => {
    const repository = new TestRepository();
    const commit = repository.commit.bind(repository);
    let release: (() => void) | undefined;
    repository.commit = async (record, revision) => {
      await new Promise<void>(resolve => { release = resolve; });
      await commit(record, revision);
    };
    let settled = false;
    const pending = new SessionService(repository).execute(move(repository)).then(result => { settled = true; return result; });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(settled).toBe(false);
    release!();
    expect((await pending).ok).toBe(true);
  });
  it('retains state on save failure and allows retrying the same command', async () => {
    const repository = new TestRepository();
    const service = new SessionService(repository);
    const before = structuredClone(repository.record);
    const command = move(repository);
    repository.fail = true;
    expect(await service.execute(command)).toEqual({ ok: false, code: 'PERSISTENCE_FAILED' });
    expect(repository.record).toEqual(before);
    repository.fail = false;
    expect(await service.execute(command)).toMatchObject({ ok: true, duplicate: false });
  });
  it('recognizes a duplicate after recreating the service', async () => {
    const repository = new TestRepository();
    const command = move(repository);
    const first = await new SessionService(repository).execute(command);
    const duplicate = await new SessionService(repository).execute(command);
    expect(duplicate).toMatchObject({ ok: true, duplicate: true, revision: first.ok ? first.revision : -1 });
    expect(repository.commits).toBe(1);
  });
  it('serializes simultaneous commands and rejects the second stale revision', async () => {
    const repository = new TestRepository();
    const service = new SessionService(repository);
    const results = await Promise.all([service.execute(move(repository, 'first')), service.execute(move(repository, 'second'))]);
    expect(results[0]).toMatchObject({ ok: true });
    expect(results[1]).toEqual({ ok: false, code: 'STALE_REVISION' });
    expect(repository.commits).toBe(1);
  });
  it('bounds receipts and protects saved state from response mutation', async () => {
    const repository = new TestRepository();
    repository.record.receipts = Array.from({ length: 256 }, (_, i) => ({ commandId: `old-${i}`, revision: 0 }));
    const result = await new SessionService(repository).execute(move(repository));
    expect(repository.record.receipts).toHaveLength(256);
    expect(repository.record.receipts[0]?.commandId).toBe('old-1');
    if (result.ok) result.session.documents.A!.lastSlideId = 'tampered';
    expect(repository.record.session.documents.A?.lastSlideId).toBe('A-5');
  });
});
