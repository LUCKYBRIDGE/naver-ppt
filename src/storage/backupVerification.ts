import type { ClassSession } from '../core/types';
import { createSessionBundle, decodeSessionBundle, MAX_BUNDLE_BYTES } from './sessionBundle';
import type { SaveJournalRecord } from './saveJournal';

export interface BackupVerification { exportId: string; sessionId: string; revision: number; sha256: string; verifiedAt: number }
export interface BackupVerificationRequest { sessionId: string; revision: number; blobUrl: string }
export class BackupVerificationError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'BackupVerificationError'; }
}
function fail(code: string): never { throw new BackupVerificationError(code); }
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function verifySavedBackup(request: BackupVerificationRequest, session: ClassSession, dependencies: {
  extensionRoot: string; fetch: typeof fetch;
  findComplete: (sessionId: string, revision: number, hash: string) => Promise<SaveJournalRecord | null>;
  now?: () => number;
}): Promise<BackupVerification> {
  const prefix = `blob:${dependencies.extensionRoot}`;
  if (!request.blobUrl.startsWith(prefix) || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(request.blobUrl.slice(prefix.length))) fail('INVALID_LOCAL_URL');
  if (request.sessionId !== session.id || request.revision !== session.revision) fail('STALE_REVISION');
  const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 30000);
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    const response = await dependencies.fetch(request.blobUrl, { signal: controller.signal, redirect: 'error' });
    if (!response.ok || !response.body) fail('FILE_UNAVAILABLE');
    const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_BUNDLE_BYTES) fail('FILE_TOO_LARGE');
        chunks.push(chunk.value);
      }
    } finally { await reader.cancel().catch(() => undefined); reader.releaseLock(); }
    if (!size) fail('INVALID_BACKUP');
    bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  } catch (error) {
    if (error instanceof BackupVerificationError) throw error;
    fail('FILE_UNAVAILABLE');
  } finally { clearTimeout(timeout); }
  let bundle;
  try { bundle = decodeSessionBundle(bytes); } catch { fail('INVALID_BACKUP'); }
  if (bundle.session.id !== session.id || bundle.session.revision !== session.revision) fail('BACKUP_MISMATCH');
  if (canonical(bundle.session) !== canonical(createSessionBundle(session, bundle.exportedAt).session)) fail('BACKUP_MISMATCH');
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  const sha256 = Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('');
  const receipt = await dependencies.findComplete(session.id, session.revision, sha256);
  if (!receipt || receipt.state !== 'complete' || receipt.bytes !== bytes.length || receipt.sessionId !== session.id
    || receipt.revision !== session.revision || receipt.sha256 !== sha256) fail('SAVE_NOT_CONFIRMED');
  return { exportId: receipt.exportId, sessionId: session.id, revision: session.revision, sha256, verifiedAt: (dependencies.now ?? Date.now)() };
}
