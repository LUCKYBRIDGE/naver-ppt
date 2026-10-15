import type { PdfInspection } from './check';
export function inspectionKey(fingerprint: string, count: number, pages: number[], environment: string) {
  if (!/^[a-f0-9]{64}$/.test(fingerprint) || !Number.isInteger(count) || count < 1 || count > 2000 || !pages.length || pages.length > count
    || pages.some((page, index) => !Number.isInteger(page) || page < 1 || page > count || index > 0 && page <= pages[index - 1]!)
    || !environment || environment.length > 4096) throw new Error('INVALID_PREFLIGHT_CACHE_KEY');
  return JSON.stringify(['pdf-inspection-v3', fingerprint, count, pages, environment]);
}
export class InspectionCache {
  private entries = new Map<string, { at: number; value: PdfInspection }>();
  get(key: string, now: number): PdfInspection | undefined {
    const entry = this.entries.get(key); if (!entry) return;
    if (!Number.isFinite(now) || now < entry.at || now - entry.at >= 300000) { this.entries.delete(key); return; }
    this.entries.delete(key); this.entries.set(key, entry); return structuredClone(entry.value);
  }
  set(key: string, value: PdfInspection, now: number) {
    if (!Number.isFinite(now) || now < 0 || !Number.isInteger(value.pageCount) || value.pageCount < 1 || value.pageCount > 2000
      || !value.inspectedPages.length || value.inspectedPages.length > 2000 || value.inspectedPages.some((page, index) => !Number.isInteger(page) || page < 1 || page > value.pageCount || index > 0 && page <= value.inspectedPages[index - 1]!)
      || value.annotationKinds.length > 256 || value.annotationKinds.some(kind => typeof kind !== 'string' || kind.length > 80)
      || !Number.isSafeInteger(value.externalLinks) || value.externalLinks < 0 || typeof value.scripts !== 'boolean'
      || value.renderedPages !== undefined && (!Number.isInteger(value.renderedPages) || value.renderedPages !== value.inspectedPages.length)) throw new Error('INVALID_PREFLIGHT_CACHE_VALUE');
    this.entries.delete(key); this.entries.set(key, { at: now, value: { pageCount: value.pageCount, inspectedPages: [...value.inspectedPages], externalLinks: value.externalLinks, scripts: value.scripts, annotationKinds: [...value.annotationKinds], ...(value.renderedPages !== undefined ? { renderedPages: value.renderedPages } : {}) } });
    while (this.entries.size > 32) this.entries.delete(this.entries.keys().next().value!);
  }
}
