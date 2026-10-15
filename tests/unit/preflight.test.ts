import { describe, expect, it, vi } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { checkPreflight, type PreflightInspector } from '../../src/preflight/check';
function inspector(): PreflightInspector { return { pdf: vi.fn(async (_, pages) => ({ pageCount: 2, inspectedPages: pages, externalLinks: 0, scripts: false, annotationKinds: [] })), media: vi.fn(async () => ({ durationSec: 12 })) }; }
describe('honest presentation preflight', () => {
  it('reports actual render evidence separately and still leaves original fidelity unknown', async () => {
    const api = inspector(); api.pdf = async (_, pages) => ({ pageCount: 2, inspectedPages: pages, externalLinks: 0, scripts: false, annotationKinds: [], renderedPages: pages.length });
    const report = await checkPreflight(fixtureSession().documents.A!, 1, api, new AbortController().signal, 'test', 0);
    expect(report.items.find(item => item.id === 'pdf-render')?.status).toBe('pass'); expect(report.items.find(item => item.id === 'pdf-fidelity')?.status).toBe('unknown');
  });
  it('checks every document page and does not call all-page reads full fidelity or complete offline', async () => {
    const document = fixtureSession().documents.A!; document.knownSlideCount = 5;
    const api = inspector(); api.pdf = vi.fn(async (_, pages) => ({ pageCount: 5, inspectedPages: pages, externalLinks: pages.includes(3) ? 1 : 0, scripts: false, annotationKinds: ['Link'] }));
    const sample = await checkPreflight(document, 2, api, new AbortController().signal, 'test', 0);
    expect(sample.scope).toBe('sample'); expect(sample.items.find(item => item.id === 'pdf-links')?.status).toBe('unknown');
    const full = await checkPreflight(document, 2, api, new AbortController().signal, 'test', 0, 'document');
    expect(api.pdf).toHaveBeenLastCalledWith(document, [1, 2, 3, 4, 5], expect.any(AbortSignal));
    expect(full.scope).toBe('document'); expect(full.items.find(item => item.id === 'pdf-links')?.status).toBe('warning');
    expect(full.items.find(item => item.id === 'pdf-fidelity')?.status).toBe('unknown'); expect(full.items.find(item => item.id === 'offline-restart')?.status).toBe('unknown');
  });
  it('does not report a truncated document inspection as successful', async () => {
    const api = inspector(); api.pdf = async () => ({ pageCount: 2, inspectedPages: [1], externalLinks: 0, scripts: false, annotationKinds: [] });
    const report = await checkPreflight(fixtureSession().documents.A!, 1, api, new AbortController().signal, 'test', 0, 'document');
    expect(report.items.find(item => item.id === 'pdf-read')?.status).toBe('unknown'); expect(report.items.find(item => item.id === 'pdf-source')?.status).toBe('error');
  });
  it('checks unique bounded pages, preserves input, and never declares complete fidelity/offline', async () => {
    const document = fixtureSession().documents.A!, original = structuredClone(document), api = inspector();
    const report = await checkPreflight(document, 2, api, new AbortController().signal, 'synthetic environment', 100);
    expect(api.pdf).toHaveBeenCalledWith(document, [1, 2], expect.any(AbortSignal)); expect(document).toEqual(original);
    expect(report.items.find(item => item.id === 'pdf-read')?.status).toBe('pass');
    for (const id of ['pdf-fidelity', 'pdf-actions', 'offline-restart', 'media-metadata']) expect(report.items.find(item => item.id === id)?.status).toBe('unknown');
    expect(report.items.map(item => item.category)).toEqual(expect.arrayContaining(['visual', 'media', 'behavior', 'offline']));
    expect(JSON.stringify(report)).not.toContain('Synthetic teacher note');
  });
  it('warns on discovered external links and document scripts without claiming remaining pages safe', async () => {
    const api = inspector(); api.pdf = async (_, pages) => ({ pageCount: 2, inspectedPages: pages, externalLinks: 3, scripts: true, annotationKinds: [] });
    const report = await checkPreflight(fixtureSession().documents.A!, 1, api, new AbortController().signal, 'test', 0);
    expect(report.items.find(item => item.id === 'pdf-links')).toMatchObject({ status: 'warning' }); expect(report.items.find(item => item.id === 'pdf-actions')).toMatchObject({ status: 'warning' });
  });
  it('reports missing/changed PDF as an error and does not turn failed probes into success', async () => {
    const api = inspector(); api.pdf = async () => { throw new Error('Synthetic personal path not exposed'); };
    const report = await checkPreflight(fixtureSession().documents.A!, 1, api, new AbortController().signal, 'test', 0);
    expect(report.items.find(item => item.id === 'pdf-source')?.status).toBe('error'); expect(JSON.stringify(report)).not.toContain('personal path');
  });
  it('detects a page count changed from registration', async () => {
    const api = inspector(); api.pdf = async (_, pages) => ({ pageCount: 3, inspectedPages: pages, externalLinks: 0, scripts: false, annotationKinds: [] });
    const report = await checkPreflight(fixtureSession().documents.A!, 1, api, new AbortController().signal, 'test', 0); expect(report.items.find(item => item.id === 'pdf-source')?.status).toBe('error');
  });
  it('checks connected media length and reports inaccessible sources separately', async () => {
    const document = fixtureSession().documents.A!; document.localMedia = { clip: { id: 'clip', slideId: 'A-2', kind: 'audio', name: 'Synthetic.wav', mime: 'audio/wav', size: 100, lastModified: 1, fingerprint: 'b'.repeat(64), durationSec: 12 } };
    const api = inspector(), report = await checkPreflight(document, 1, api, new AbortController().signal, 'test', 0);
    expect(report.items.find(item => item.id === 'media-metadata')?.status).toBe('pass');
    api.media = async () => ({ durationSec: 99 }); const changed = await checkPreflight(document, 1, api, new AbortController().signal, 'test', 0);
    expect(changed.items.find(item => item.id === 'media-clip')?.status).toBe('error');
  });
  it('cancels without publishing a misleading report and rejects invalid page targets', async () => {
    const controller = new AbortController(), api = inspector(); api.pdf = async (_, pages) => { controller.abort(); return { pageCount: 2, inspectedPages: pages, externalLinks: 0, scripts: false, annotationKinds: [] }; };
    await expect(checkPreflight(fixtureSession().documents.A!, 1, api, controller.signal, 'test', 0)).rejects.toMatchObject({ name: 'AbortError' });
    await expect(checkPreflight(fixtureSession().documents.A!, 0, inspector(), new AbortController().signal, 'test', 0)).rejects.toThrow('INVALID_PREFLIGHT_TARGET');
  });
});
