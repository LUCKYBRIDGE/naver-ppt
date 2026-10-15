import { expect, it, vi } from 'vitest';
import { fixtureSession } from '../fixtures/session';
const mocks = vi.hoisted(() => ({ destroy: vi.fn(async () => {}), cleanup: vi.fn(), get: vi.fn().mockResolvedValue({ file: {} }), open: vi.fn(), render: vi.fn().mockResolvedValue({ width: 1024, height: 768 }) }));
vi.mock('../../src/storage/sourceVault', () => ({ sourceKey: () => 'synthetic-key', sourceVault: () => ({ get: mocks.get }) }));
vi.mock('../../src/adapters/pdf/input', () => ({ readPdfInput: async () => ({ fingerprint: 'a'.repeat(64), bytes: new Uint8Array([1]) }) }));
vi.mock('../../src/adapters/pdf/pdf', () => ({ pdfRendererVersion: 'synthetic-version', PdfRenderer: class { render = mocks.render; destroy = mocks.destroy; }, openPdf: mocks.open.mockImplementation(async () => ({ numPages: 2, loadingTask: { destroy: mocks.destroy },
  getJSActions: async () => new Map([['Synthetic', ['var synthetic = 1;']]]), getPage: async () => ({ getOperatorList: async () => ({}),
    getAnnotations: async () => [{ subtype: 'Link', url: 'https://example.invalid/synthetic' }], cleanup: mocks.cleanup }) })) }));
import { browserInspector } from '../../src/preflight/browser';
it('reads the installed PDF.js Map action contract and cleans up inspected pages/document', async () => {
  const result = await browserInspector('synthetic', undefined, true).pdf(fixtureSession().documents.A!, [1], new AbortController().signal);
  expect(result).toEqual({ pageCount: 2, inspectedPages: [1], scripts: true, externalLinks: 1, annotationKinds: ['Link'], renderedPages: 1 });
  expect(mocks.cleanup).toHaveBeenCalledTimes(1); expect(mocks.destroy).toHaveBeenCalledTimes(1);
});
it('does not cache failed render evidence and cleans up before retry', async () => {
  mocks.destroy.mockClear(); mocks.render.mockRejectedValueOnce(new Error('Synthetic image decode failure'));
  const document = fixtureSession().documents.A!, signal = new AbortController().signal;
  await expect(browserInspector('synthetic', undefined, true).pdf(document, [1, 2], signal)).rejects.toThrow('decode failure');
  expect(mocks.destroy).toHaveBeenCalledTimes(1);
  const result = await browserInspector('synthetic').pdf(document, [1, 2], signal); expect(result.renderedPages).toBe(2); expect(result.cached).toBeUndefined();
});
it('rechecks source access before cache hit and supports forced parser inspection', async () => {
  mocks.open.mockClear(); mocks.get.mockClear(); const document = fixtureSession().documents.A!, signal = new AbortController().signal;
  await browserInspector('synthetic', undefined, true).pdf(document, [2], signal);
  expect((await browserInspector('synthetic').pdf(document, [2], signal)).cached).toBe(true);
  expect(mocks.open).toHaveBeenCalledTimes(1); expect(mocks.get).toHaveBeenCalledTimes(2);
  mocks.get.mockRejectedValueOnce(new Error('Synthetic permission lost')); await expect(browserInspector('synthetic').pdf(document, [2], signal)).rejects.toThrow('permission lost');
  await browserInspector('synthetic', undefined, true).pdf(document, [2], signal); expect(mocks.open).toHaveBeenCalledTimes(2);
});
