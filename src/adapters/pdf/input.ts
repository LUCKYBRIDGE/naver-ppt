export const PDF_MAX_BYTES = 128 * 1024 * 1024;
export const PDF_MAX_PAGES = 2000;

export async function readPdfInput(file: File): Promise<{ bytes: Uint8Array; fingerprint: string }> {
  if (!file.name.toLowerCase().endsWith('.pdf')) throw new Error('PDF 파일을 선택하세요. 다른 형식은 아직 검증 중입니다.');
  if (file.size === 0 || file.size > PDF_MAX_BYTES) throw new Error('빈 파일이거나 128MB를 초과합니다. 자료를 나누어 다시 선택하세요.');
  const header = new TextDecoder('ascii').decode(await file.slice(0, 1024).arrayBuffer());
  if (!header.includes('%PDF-')) throw new Error('PDF 내용이 확인되지 않습니다. 원본 프로그램에서 PDF로 다시 저장하세요.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const fingerprint = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  return { bytes, fingerprint };
}

export function renderDimensions(width: number, height: number, availableWidth: number, availableHeight: number, ratio: number) {
  if (![width, height, availableWidth, availableHeight, ratio].every(value => Number.isFinite(value) && value > 0)) throw new Error('Invalid render dimensions');
  const scale = Math.min(availableWidth / width, availableHeight / height) * Math.min(ratio, 2);
  const bounded = Math.min(scale, Math.sqrt(8_000_000 / (width * height)));
  return { scale: bounded, width: Math.max(1, Math.floor(width * bounded)), height: Math.max(1, Math.floor(height * bounded)) };
}
