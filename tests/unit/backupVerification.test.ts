import { describe, expect, it, vi } from 'vitest';
import { verifySavedBackup } from '../../src/storage/backupVerification';
import { encodeSessionBundle, MAX_BUNDLE_BYTES } from '../../src/storage/sessionBundle';
import { fixtureSession } from '../fixtures/session';
import type { SaveJournalRecord } from '../../src/storage/saveJournal';

const url = 'blob:chrome-extension://synthetic/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
async function fixture() {
  const session = fixtureSession(), bytes = new Uint8Array(encodeSessionBundle(session, 10));
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
  const receipt: SaveJournalRecord = { schemaVersion: 1, exportId: 'export-1', sessionId: session.id, revision: 4,
    bytes: bytes.length, sha256: hash, createdAt: 10, state: 'complete', completedAt: 11, transport: 'filesystem' };
  const request = { sessionId: session.id, revision: 4, blobUrl: url };
  const dependencies = { extensionRoot: 'chrome-extension://synthetic/', fetch: vi.fn(async () => new Response(bytes)),
    findComplete: vi.fn(async (): Promise<SaveJournalRecord | null> => receipt), now: () => 20 };
  return { session, bytes, receipt, request, dependencies };
}
describe('FR-013/014 independent saved-file verification', () => {
  it('matches actual bytes, full committed state and completed evidence without exposing content or mutating state', async () => {
    const f = await fixture(), before = structuredClone(f.session);
    expect(await verifySavedBackup(f.request, f.session, f.dependencies)).toEqual({ exportId: 'export-1', sessionId: 'original', revision: 4, sha256: f.receipt.sha256, verifiedAt: 20 });
    expect(f.dependencies.findComplete).toHaveBeenCalledWith('original', 4, f.receipt.sha256); expect(f.session).toEqual(before);
  });
  it.each(['https://example.com/private', 'file:///C:/private.json', 'blob:chrome-extension://other/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', `${url}/extra`, 'blob:chrome-extension://synthetic/'])('rejects arbitrary fetch URL %s before fetching', async blobUrl => {
    const f = await fixture(); await expect(verifySavedBackup({ ...f.request, blobUrl }, f.session, f.dependencies)).rejects.toThrow('INVALID_LOCAL_URL');
    expect(f.dependencies.fetch).not.toHaveBeenCalled();
  });
  it('rejects stale request, another lesson and same-revision altered content', async () => {
    const f = await fixture(); await expect(verifySavedBackup({ ...f.request, revision: 3 }, f.session, f.dependencies)).rejects.toThrow('STALE_REVISION');
    for (const change of ['id', 'content']) {
      const altered = structuredClone(f.session); if (change === 'id') altered.id = 'other'; else altered.documents.A!.slideDeltas['A-2']!.presenterNote = 'Other synthetic note';
      f.dependencies.fetch.mockImplementation(async () => new Response(new Uint8Array(encodeSessionBundle(altered, 10))));
      await expect(verifySavedBackup(f.request, f.session, f.dependencies)).rejects.toThrow('BACKUP_MISMATCH');
    }
  });
  it.each(['missing', 'prepared', 'failed', 'size', 'hash', 'session', 'revision'] as const)('does not accept %s evidence', async reason => {
    const f = await fixture(); const receipt = structuredClone(f.receipt) as unknown as Record<string, unknown>;
    if (reason === 'prepared' || reason === 'failed') receipt.state = reason;
    if (reason === 'size') receipt.bytes = 1; if (reason === 'hash') receipt.sha256 = 'b'.repeat(64);
    if (reason === 'session') receipt.sessionId = 'other'; if (reason === 'revision') receipt.revision = 3;
    f.dependencies.findComplete.mockResolvedValue(reason === 'missing' ? null : receipt as unknown as SaveJournalRecord);
    await expect(verifySavedBackup(f.request, f.session, f.dependencies)).rejects.toThrow('SAVE_NOT_CONFIRMED');
  });
  it('bounds actual streaming body, rejects empty/bad input and cancels its reader', async () => {
    const f = await fixture(), cancel = vi.fn();
    f.dependencies.fetch.mockImplementation(async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(MAX_BUNDLE_BYTES + 1)); }, cancel })));
    await expect(verifySavedBackup(f.request, f.session, f.dependencies)).rejects.toThrow('FILE_TOO_LARGE'); expect(cancel).toHaveBeenCalled();
    f.dependencies.fetch.mockImplementation(async () => new Response('bad'));
    await expect(verifySavedBackup(f.request, f.session, f.dependencies)).rejects.toThrow('INVALID_BACKUP');
    f.dependencies.fetch.mockImplementation(async () => new Response(''));
    await expect(verifySavedBackup(f.request, f.session, f.dependencies)).rejects.toThrow('INVALID_BACKUP');
  });
});
