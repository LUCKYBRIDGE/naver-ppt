import { describe, expect, it } from 'vitest';
import { fixtureSession } from '../fixtures/session';
import { registrationPreflight } from '../../src/preflight/registration';
describe('registration fast preflight', () => {
  it('reports PPTX XML count without claiming renderer fidelity or repeated parsing', () => {
    const document = fixtureSession().documents.A!; document.source = { ...document.source, type: 'pptx' } as typeof document.source;
    const report = registrationPreflight(document, 2, 100);
    expect(report.environment).toContain('pptx'); expect(report.items.find(item => item.id === 'registration-pages')?.message).toContain('원본 XML');
    expect(registrationPreflight(document, null, 101).items.find(item => item.id === 'registration-pages')?.status).toBe('unknown');
  });
  it('reports real parsed page count but leaves fidelity/media/behavior/offline unverified', () => {
    const document = fixtureSession().documents.A!, original = structuredClone(document), report = registrationPreflight(document, 2, 100);
    expect(document).toEqual(original); expect(report.items.find(item => item.id === 'registration-pages')).toMatchObject({ status: 'pass' });
    for (const id of ['registration-media', 'registration-behavior', 'registration-offline']) expect(report.items.find(item => item.id === id)?.status).toBe('unknown');
    expect(JSON.stringify(report)).not.toContain('Synthetic teacher note'); expect(report.fingerprint).toBe(document.source.type === 'pdf' && document.source.fingerprint);
  });
  it('does not reuse a historical parser result as a new reconnect check', () => {
    const report = registrationPreflight(fixtureSession().documents.A!, null, 200);
    expect(report.items.find(item => item.id === 'registration-pages')?.status).toBe('unknown'); expect(report.checkedAt).toBe(200);
  });
  it('rejects invalid fingerprints and mismatching parsed counts', () => {
    const document = fixtureSession().documents.A!;
    for (const count of [0, 3, Infinity, 2.1]) expect(() => registrationPreflight(document, count, 0)).toThrow();
    Object.assign(document.source, { fingerprint: 'invalid' }); expect(() => registrationPreflight(document, null, 0)).toThrow();
  });
});
