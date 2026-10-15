import type { LocalMediaRef, MediaPlayback, PptxEmbeddedMediaSource } from './types';
export const MEDIA_MAX_BYTES = 128 * 1024 * 1024;
export function isPptxEmbeddedMediaSource(value: unknown): value is PptxEmbeddedMediaSource {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const source = value as Record<string, unknown>;
  return Object.keys(source).length === 4 && ['type', 'sourceFingerprint', 'sourcePart', 'elementPath'].every(key => Object.hasOwn(source, key))
    && source.type === 'pptx' && typeof source.sourceFingerprint === 'string' && /^[a-f0-9]{64}$/.test(source.sourceFingerprint)
    && typeof source.sourcePart === 'string' && source.sourcePart.length <= 1000 && /^ppt\/slides\/[^/]+\.xml$/.test(source.sourcePart)
    && !/[\\\x00-\x1f:%?#]/.test(source.sourcePart)
    && Array.isArray(source.elementPath) && source.elementPath.length >= 1 && source.elementPath.length <= 33
    && Array.from(source.elementPath).every(index => Number.isSafeInteger(index) && index >= 0 && index < 100000);
}
export function embeddedMediaKey(source: PptxEmbeddedMediaSource) { return JSON.stringify([source.sourceFingerprint, source.sourcePart, source.elementPath]); }
export function mediaMatchesDocument(ref: LocalMediaRef, source: { type?: unknown; fingerprint?: unknown }) {
  return !ref.embeddedSource || source.type === 'pptx' && ref.embeddedSource.sourceFingerprint === source.fingerprint;
}
export function isMediaPlayback(value: unknown, durationSec = 86400): value is MediaPlayback {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const settings = value as Record<string, unknown>, keys = ['startSec', 'endSec', 'volume', 'muted'];
  return Object.keys(settings).length === 4 && keys.every(key => Object.hasOwn(settings, key))
    && typeof settings.startSec === 'number' && Number.isFinite(settings.startSec) && settings.startSec >= 0
    && typeof settings.endSec === 'number' && Number.isFinite(settings.endSec) && settings.endSec > settings.startSec && settings.endSec <= durationSec
    && typeof settings.volume === 'number' && Number.isFinite(settings.volume) && settings.volume >= 0 && settings.volume <= 1 && typeof settings.muted === 'boolean';
}
export function mediaPlayback(ref: Pick<LocalMediaRef, 'durationSec' | 'playback'>): MediaPlayback {
  return ref.playback ?? { startSec: 0, endSec: ref.durationSec, volume: 1, muted: false };
}
export function isLocalMediaRef(value: unknown): value is LocalMediaRef {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const ref = value as Record<string, unknown>, keys = ['id', 'slideId', 'kind', 'name', 'mime', 'size', 'lastModified', 'fingerprint', 'durationSec'];
  const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  return Object.keys(ref).every(key => keys.includes(key) || key === 'playback' || key === 'embeddedSource') && keys.every(key => Object.hasOwn(ref, key))
    && (!Object.hasOwn(ref, 'embeddedSource') || isPptxEmbeddedMediaSource(ref.embeddedSource))
    && (!Object.hasOwn(ref, 'playback') || isMediaPlayback(ref.playback, ref.durationSec as number))
    && ['id', 'slideId'].every(key => typeof ref[key] === 'string' && !!ref[key].trim() && ref[key].length <= 200)
    && typeof ref.name === 'string' && !!ref.name && ref.name.length <= 1000 && typeof ref.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(ref.fingerprint)
    && finite(ref.size) && Number.isSafeInteger(ref.size) && ref.size > 0 && ref.size <= MEDIA_MAX_BYTES && finite(ref.lastModified)
    && finite(ref.durationSec) && ref.durationSec > 0 && ref.durationSec <= 86400
    && (ref.kind === 'audio' && ['audio/wav', 'audio/mpeg'].includes(ref.mime as string) || ref.kind === 'video' && ['video/mp4', 'video/webm'].includes(ref.mime as string));
}
