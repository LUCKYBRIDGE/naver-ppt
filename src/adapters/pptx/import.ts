import type { ClassSession, PresentationDocumentState } from '../../core/types';
import { registrationPreflight } from '../../preflight/registration';
import { sourceKey, type SourceVault } from '../../storage/sourceVault';
import { readPptxInput } from './input';
import { readPptxPackageIsolated } from './isolatedPackage';
import { inspectPptxXml } from './packageGuard';
import { readPptxSlideOrder } from './slideOrder';
import { inspectPptxTransformReadiness } from './behaviorPreflight';
import { pptxFontPreflight } from './fontMetadata';
import { createPptxLocalFontCheck, localPptxFontPreflight } from './localFonts';
import { withPptxPreparation } from './preparationAdmission';

export async function preparePptxImport(file: File, session: ClassSession, vault: SourceVault,
  handle?: FileSystemFileHandle, reconnectDocumentId?: string, signal?: AbortSignal) {
  return withPptxPreparation(signal, () => preparePptxImportAdmitted(file, session, vault, handle, reconnectDocumentId, signal));
}
async function preparePptxImportAdmitted(file: File, session: ClassSession, vault: SourceVault,
  handle?: FileSystemFileHandle, reconnectDocumentId?: string, signal?: AbortSignal) {
  const input = await readPptxInput(file, signal);
  const expected = reconnectDocumentId ? session.documents[reconnectDocumentId] : session.documentOrder.map(id => session.documents[id]!).find(doc => doc.source.type === 'pptx' && doc.source.fingerprint === input.fingerprint);
  if (reconnectDocumentId && (!expected || expected.source.type !== 'pptx' || expected.source.fingerprint !== input.fingerprint)) {
    throw new Error('등록된 원본과 내용이 다릅니다. 기존 편집은 유지했습니다. 같은 원본 PPTX를 선택하세요.');
  }
  if (expected) {
    const preflight = registrationPreflight(expected, null, Date.now());
    preflight.items.push({ id: 'pptx-local-fonts', category: 'visual', status: 'unknown', message: '동일 원본의 빠른 재연결에서는 로컬 글꼴 검사를 다시 실행하지 않았습니다. 글꼴 환경이 바뀌었거나 이전 경고를 다시 확인하려면 PPTX 원본 점검을 실행하세요. 설치·실제 적용·원본 화면 일치는 미확인입니다.' });
    await vault.remember(sourceKey(session.id, expected.id), file, input.fingerprint, handle);
    return { document: expected, reused: true, preflight };
  }
  const checked = await readPptxPackageIsolated(input.bytes, signal ? { signal } : {});
  const localFonts = createPptxLocalFontCheck();
  const inspection = inspectPptxXml(checked.files, signal, localFonts.observe);
  const parts = readPptxSlideOrder(checked.files), id = crypto.randomUUID();
  if (parts.length > 1000) throw new Error('PPTX 자료는 1000쪽까지 등록할 수 있습니다.');
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  const document: PresentationDocumentState = { id,
    source: { type: 'pptx', name: file.name, size: file.size, lastModified: file.lastModified, fingerprint: input.fingerprint,
      ...(handle ? { fileHandleKey: sourceKey(session.id, id) } : {}) },
    lastSlideId: null, knownSlideCount: parts.length, slideIds: parts.map(() => crypto.randomUUID()),
    slideDeltas: {}, mediaBookmarks: {}, dirty: false };
  const preflight = registrationPreflight(document, parts.length, Date.now());
  preflight.items.push(...pptxFontPreflight(inspection?.fontMetadata));
  preflight.items.push(...localPptxFontPreflight(await localFonts.check(signal)));
  preflight.items.push(...await inspectPptxTransformReadiness(input.bytes, checked.files, parts, signal));
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  await vault.remember(sourceKey(session.id, id), file, input.fingerprint, handle);
  return { document, reused: false, preflight };
}
