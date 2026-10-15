import { MEDIA_MAX_BYTES } from './validation';
import { consumePrivateBuffer } from '../shared/privateBuffer';
const formats = { wav: ['audio', 'audio/wav'], mp3: ['audio', 'audio/mpeg'], mp4: ['video', 'video/mp4'], webm: ['video', 'video/webm'] } as const;
type MediaIdentity = { fingerprint: string; kind: 'audio' | 'video'; mime: 'audio/wav' | 'audio/mpeg' | 'video/mp4' | 'video/webm' };
// Platform File bytes are immutable. Retain only a successful identity, never
// bytes or a name/fingerprint keyed cross-file result.
const identities = new WeakMap<File, { size: number; extension: string; identity: MediaIdentity }>();
export async function readMediaInput(file: File) {
  const ext = file.name.split('.').at(-1)?.toLowerCase(), format = ext && Object.hasOwn(formats, ext) ? formats[ext as keyof typeof formats] : undefined;
  if (!format || !file.size || file.size > MEDIA_MAX_BYTES) throw new Error('WAV·MP3·MP4·WebM 로컬 파일은 128MB까지 연결할 수 있습니다.');
  const cached = identities.get(file);
  if (cached?.size === file.size && cached.extension === ext) return { ...cached.identity };
  const bytes = new Uint8Array(await file.arrayBuffer()), ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  try {
    const valid = ext === 'wav' ? ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE'
      : ext === 'mp3' ? ascii(0, 3) === 'ID3' || bytes[0] === 255 && (bytes[1]! & 224) === 224
        : ext === 'mp4' ? ascii(4, 8) === 'ftyp' : bytes[0] === 26 && bytes[1] === 69 && bytes[2] === 223 && bytes[3] === 163;
    if (!valid) throw new Error('미디어 파일 내용과 형식이 일치하지 않습니다.');
    const fingerprint = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
    const identity = { fingerprint, kind: format[0], mime: format[1] };
    identities.set(file, { size: file.size, extension: ext!, identity });
    return { ...identity };
  } finally { consumePrivateBuffer(bytes.buffer); }
}
export async function probeMedia(file: File, signal?: AbortSignal) {
  const cancelled = () => { if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  cancelled(); const input = await readMediaInput(file); cancelled();
  const element = document.createElement(input.kind === 'video' ? 'video' : 'audio');
  const url = URL.createObjectURL(new Blob([file], { type: input.mime }));
  let timer: ReturnType<typeof setTimeout> | undefined, abort: (() => void) | undefined;
  try {
    const durationSec = await new Promise<number>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('미디어 확인 시간이 초과되었습니다.')), 15000);
      abort = () => reject(new DOMException('Cancelled', 'AbortError'));
      signal?.addEventListener('abort', abort, { once: true });
      if (signal?.aborted) { abort(); return; }
      element.onloadedmetadata = () => { clearTimeout(timer); resolve(element.duration); };
      element.onerror = () => { clearTimeout(timer); reject(new Error('웨일에서 이 미디어를 읽지 못했습니다. 다른 코덱 파일을 선택하세요.')); };
      element.preload = 'metadata'; element.src = url; element.load();
    });
    cancelled(); if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 86400) throw new Error('미디어 재생 길이를 확인하지 못했습니다.');
    return { ...input, durationSec };
  } finally { clearTimeout(timer); if (abort) signal?.removeEventListener('abort', abort); element.onloadedmetadata = null; element.onerror = null; element.pause(); element.removeAttribute('src'); element.load(); URL.revokeObjectURL(url); }
}
