export const PPTX_MAX_BYTES = 128 * 1024 * 1024;
import { consumePrivateBuffer } from '../../shared/privateBuffer';

// This is the File boundary, not proof of a safe package or a faithful renderer.
export async function readPptxInput(file: File, signal?: AbortSignal): Promise<{ bytes: Uint8Array; fingerprint: string }> {
  const aborted = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  aborted();
  if (!file.name.toLowerCase().endsWith('.pptx')) throw new Error('PPTX 파일을 선택하세요. PPT와 SHOW는 별도 검증이 필요합니다.');
  if (!Number.isSafeInteger(file.size) || file.size < 4 || file.size > PPTX_MAX_BYTES) throw new Error('빈 파일이거나 128MB를 초과합니다. 원본 크기를 확인하세요.');
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  aborted();
  if (header.length !== 4 || header[0] !== 0x50 || header[1] !== 0x4b || header[2] !== 3 || header[3] !== 4) throw new Error('PPTX 패키지 내용이 확인되지 않습니다. 원본 파일을 다시 선택하세요.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
  aborted();
  if (bytes.length !== file.size) throw new Error('PPTX 원본을 끝까지 읽지 못했습니다. 다시 선택하세요.');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  aborted();
  const fingerprint = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  return { bytes, fingerprint };
  } catch (error) { consumePrivateBuffer(bytes.buffer); throw error; }
}
