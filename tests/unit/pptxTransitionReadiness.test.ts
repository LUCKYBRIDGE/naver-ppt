import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { inspectPptxTransition } from '../../src/adapters/pptx/transitionReadiness';
import { openPptxRuntime } from '../../src/adapters/pptx/runtime';
vi.mock('../../src/adapters/pptx/runtime', () => ({ openPptxRuntime: vi.fn() }));
const root = { replaceChildren: vi.fn() }, dispose = vi.fn();
beforeEach(() => { root.replaceChildren.mockClear(); dispose.mockClear(); vi.stubGlobal('document', { createElement: () => root }); vi.mocked(openPptxRuntime).mockReset().mockResolvedValue({ sourceMediaUnavailable: false, dispose } as unknown as Awaited<ReturnType<typeof openPptxRuntime>>); });
afterEach(() => vi.unstubAllGlobals());
function input() { const session = fixtureSession(); session.documents.A!.source = { type: 'pptx', name: 'Synthetic.pptx', size: 100, lastModified: 1, fingerprint: 'a'.repeat(64) }; return session; }
describe('detached existing-runtime transition inspection', () => {
  it('projects the target privately and forbids writes/playback, then disposes it', async () => {
    const session = input(), before = structuredClone(session); session.documents.A!.closed = true; before.documents.A!.closed = true;
    await inspectPptxTransition(new File([], 'Synthetic.pptx'), session, session.documents.A!, 'A-1', new AbortController().signal);
    const options = vi.mocked(openPptxRuntime).mock.calls[0]![0];
    expect(options.document.closed).toBe(false); expect(options.transport.snapshot().selection).toEqual({ documentId: 'A', slideId: 'A-1' });
    await expect(options.transport.send({} as never)).rejects.toThrow('MUST_NOT_WRITE'); expect(() => options.startMedia?.('id', { type: 'play' })).toThrow('MUST_NOT_PLAY');
    expect(dispose).toHaveBeenCalledOnce(); expect(root.replaceChildren).toHaveBeenCalled(); expect(session).toEqual(before);
  });
  it('rejects unavailable media preparation and still releases the runtime', async () => {
    vi.mocked(openPptxRuntime).mockResolvedValue({ sourceMediaUnavailable: true, dispose } as unknown as Awaited<ReturnType<typeof openPptxRuntime>>);
    const session = input(); await expect(inspectPptxTransition(new File([], 'Synthetic.pptx'), session, session.documents.A!, 'A-1', new AbortController().signal)).rejects.toThrow('MEDIA_UNAVAILABLE'); expect(dispose).toHaveBeenCalledOnce();
  });
  it('releases a runtime that completed after cancellation', async () => {
    const controller = new AbortController(); vi.mocked(openPptxRuntime).mockImplementation(async () => { controller.abort(); return { sourceMediaUnavailable: false, dispose } as unknown as Awaited<ReturnType<typeof openPptxRuntime>>; });
    const session = input(); await expect(inspectPptxTransition(new File([], 'Synthetic.pptx'), session, session.documents.A!, 'A-1', controller.signal)).rejects.toMatchObject({ name: 'AbortError' }); expect(dispose).toHaveBeenCalledOnce();
  });
  it('cleans the surface if runtime initialization rejects', async () => {
    vi.mocked(openPptxRuntime).mockRejectedValue(Error('Synthetic unsupported'));
    const session = input(); await expect(inspectPptxTransition(new File([], 'Synthetic.pptx'), session, session.documents.A!, 'A-1', new AbortController().signal)).rejects.toThrow('unsupported'); expect(root.replaceChildren).toHaveBeenCalled();
  });
});
