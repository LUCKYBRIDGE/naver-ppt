import type { ClassSession } from '../../core/types';
import type { LocalMediaRef, MediaPlayback } from '../../media/types';
import { embeddedMediaKey, isMediaPlayback } from '../../media/validation';
import { matchPptxEmbeddedMedia, pptxEmbeddedSource, type PreparedPptxMedia } from './embeddedMedia';

type CheckedMedia = PreparedPptxMedia['input'] & { durationSec: number };
export interface PptxMediaConnectionActions {
  readSession: () => Promise<ClassSession>;
  inspect: (file: File, signal: AbortSignal) => Promise<CheckedMedia>;
  add: (session: ClassSession, ref: LocalMediaRef) => Promise<void>;
  remember: (ref: LocalMediaRef, file: File) => Promise<void>;
  newId: () => string;
  initialPlayback?: (media: PreparedPptxMedia, durationSec: number) => MediaPlayback | undefined;
}
export class PptxMediaConnectionError extends Error {
  constructor(message: string, public readonly registered: number, public readonly reconnected: number) { super(message); }
}
export async function connectPreparedPptxMedia(documentId: string, slideId: string, prepared: readonly PreparedPptxMedia[], signal: AbortSignal, actions: PptxMediaConnectionActions) {
  let registered = 0, reconnected = 0;
  const cancelled = () => { if (signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
  const current = async () => {
    cancelled(); const session = await actions.readSession(); cancelled();
    const document = session.documents[documentId];
    if (!document || !document.slideIds.includes(slideId) || document.source.type !== 'pptx') throw Error('원본 또는 편집 대상이 바뀌었습니다. 다시 연결하세요.');
    const source = document.source;
    if (prepared.some(media => media.slideId !== slideId || media.sourceFingerprint !== source.fingerprint)) throw Error('원본 또는 편집 대상이 바뀌었습니다. 다시 연결하세요.');
    return { session, document };
  };
  const existingFor = (session: ClassSession, media: PreparedPptxMedia) => Object.values(session.documents[documentId]!.localMedia ?? {})
    .find(ref => ref.embeddedSource && embeddedMediaKey(ref.embeddedSource) === embeddedMediaKey(pptxEmbeddedSource(media)));
  try {
    const initial = await current(), keys = prepared.map(media => embeddedMediaKey(pptxEmbeddedSource(media)));
    if (new Set(keys).size !== keys.length) throw Error('중복된 내장 미디어 출처입니다.');
    const additions = prepared.filter(media => !existingFor(initial.session, media)).length;
    if (Object.keys(initial.document.localMedia ?? {}).length + additions > 16) throw Error('자료마다 미디어는 16개까지 연결할 수 있습니다.');
    // Read all native metadata before issuing any registration command.
    const checked = new Map<File, CheckedMedia>();
    const initialPlayback = new Map<PreparedPptxMedia, MediaPlayback>();
    for (const media of prepared) {
      cancelled(); if (!checked.has(media.file)) checked.set(media.file, await actions.inspect(media.file, signal)); cancelled();
      const input = checked.get(media.file)!;
      if (input.fingerprint !== media.input.fingerprint || input.kind !== media.input.kind || input.mime !== media.input.mime
        || !Number.isFinite(input.durationSec) || input.durationSec <= 0 || input.durationSec > 86400) throw Error('내장 미디어 검증 결과가 일치하지 않습니다.');
      if (!existingFor(initial.session, media)) {
        const playback = actions.initialPlayback?.(media, input.durationSec);
        if (playback !== undefined) {
          if (!isMediaPlayback(playback, input.durationSec)) throw Error('내장 미디어 원본 재생 설정을 확인하지 못했습니다.');
          initialPlayback.set(media, { ...playback });
        }
      }
    }
    for (const media of prepared) {
      const latest = await current(), existing = existingFor(latest.session, media);
      let ref: LocalMediaRef;
      if (existing) {
        matchPptxEmbeddedMedia(existing, [media]);
        if (Math.abs(existing.durationSec - checked.get(media.file)!.durationSec) > .1) throw Error('내장 미디어 재생 길이가 달라 재연결하지 못했습니다.');
        ref = existing;
      }
      else {
        ref = { id: actions.newId(), slideId, name: media.file.name, size: media.file.size, lastModified: media.file.lastModified,
          ...checked.get(media.file)!, embeddedSource: pptxEmbeddedSource(media),
          ...(initialPlayback.has(media) ? { playback: initialPlayback.get(media)! } : {}) };
        await actions.add(latest.session, ref); registered++;
      }
      // A cancellation cannot undo an acknowledged strict commit. Keep metadata
      // and report the acknowledged count; a later explicit retry reconnects it.
      cancelled(); await actions.remember(ref, media.file); cancelled();
      if (existing) reconnected++;
    }
    return { registered, reconnected };
  } catch (error) {
    const text = error instanceof Error && error.name === 'AbortError' ? '내장 미디어 연결을 취소했습니다.'
      : error instanceof Error ? error.message : '내장 미디어를 연결하지 못했습니다.';
    throw new PptxMediaConnectionError(text, registered, reconnected);
  }
}
