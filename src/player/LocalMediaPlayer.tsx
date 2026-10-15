import { useEffect, useRef, useState } from 'react';
import type { PlayerSnapshot } from '../core/playerSnapshot';
import { mediaKey, mediaVault } from '../media/source';
import { sendSessionRequest } from '../shared/sessionClient';
import { mediaPlayback } from '../media/validation';
import type { PptxNativeEndpoint } from './pptxNativeEndpoint';
import type { BorrowedMediaUrl } from '../media/borrowedUrl';
type MediaEntry = PlayerSnapshot['media'][number];
export function LocalMediaPlayer({ sessionId, documentId, entry, onError, file, asset, onNative, passive = false }: { sessionId: string; documentId: string; entry: MediaEntry; onError: (id: string, message: string, retry?: () => void) => void; file?: File; asset?: BorrowedMediaUrl; passive?: boolean;
  onNative?: (id: string, media: HTMLMediaElement) => Pick<PptxNativeEndpoint, 'suppressApply' | 'dispose'> }) {
  const element = useRef<HTMLMediaElement | null>(null), latest = useRef(entry); latest.current = entry;
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  const queue = useRef(Promise.resolve()), lastWrite = useRef(0);
  const initialized = useRef(false);
  const appliedEpoch = useRef<string | undefined>(undefined);
  const appliedPosition = useRef<string | undefined>(undefined);
  const native = useRef<Pick<PptxNativeEndpoint, 'suppressApply' | 'dispose'> | null>(null);
  const passiveRef = useRef(passive); passiveRef.current = passive;
  function checkpoint(paused: boolean, ended = false) {
    if (passiveRef.current) return;
    const bookmark = latest.current.bookmark, timeSec = element.current?.currentTime;
    if (!bookmark?.epoch || appliedEpoch.current !== bookmark.epoch || timeSec === undefined || !Number.isFinite(timeSec)) return;
    if (bookmark.paused === paused && (bookmark.ended ?? false) === ended && Math.abs(bookmark.timeSec - timeSec) < .01) return;
    const settings = mediaPlayback(latest.current.ref);
    const captured = { mediaId: entry.ref.id, slideId: entry.ref.slideId, epoch: bookmark.epoch, timeSec: Math.max(settings.startSec, Math.min(timeSec, settings.endSec)), paused, ended };
    queue.current = queue.current.then(async () => {
      for (let attempt = 0; attempt < 2; attempt++) {
        const state = await sendSessionRequest({ type: 'GET_SESSION', sessionId });
        if (!state.ok || state.kind !== 'player') return;
        const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'CHECKPOINT_MEDIA', sessionId, documentId, ...captured, revision: state.snapshot.revision, commandId: crypto.randomUUID() } });
        if (!result.ok && result.code === 'PERSISTENCE_FAILED') { setError('재생 위치를 저장하지 못했습니다.'); return; }
        if (result.ok || result.code !== 'STALE_REVISION') return;
      }
    }).catch(() => { setError('재생 위치를 저장하지 못했습니다.'); });
  }
  useEffect(() => {
    let disposed = false, objectUrl = ''; const vault = mediaVault(), controller = new AbortController();
    let borrowed: ReturnType<BorrowedMediaUrl['acquire']> | undefined;
    async function load() {
      try {
        if (asset) {
          borrowed = asset.acquire(entry.ref); objectUrl = borrowed.url; initialized.current = false; setUrl(objectUrl); setError(''); return;
        }
        const source = file ? { file } : await vault.get(mediaKey(sessionId, documentId, entry.ref.id), entry.ref.fingerprint, controller.signal);
        if (disposed) return;
        objectUrl = URL.createObjectURL(new Blob([source.file], { type: entry.ref.mime })); initialized.current = false; setUrl(objectUrl); setError('');
      } catch { if (!disposed) setError('원본 미디어를 다시 연결하세요.'); }
    }
    const unsubscribe = vault.subscribe(key => { if (key === mediaKey(sessionId, documentId, entry.ref.id) && !objectUrl) void load(); });
    void load();
    return () => { disposed = true; controller.abort(); unsubscribe(); checkpoint(true, latest.current.bookmark?.ended === true); element.current?.pause(); element.current?.removeAttribute('src'); element.current?.load(); element.current = null; if (borrowed) borrowed.dispose(); else if (objectUrl) URL.revokeObjectURL(objectUrl); onError(entry.ref.id, ''); };
  }, [sessionId, documentId, entry.ref.id, entry.ref.fingerprint, file, asset]);
  const settings = mediaPlayback(entry.ref);
  useEffect(() => {
    if (!url || !element.current || !onNative) return;
    const endpoint = onNative(entry.ref.id, element.current); native.current = endpoint;
    return () => { endpoint.dispose(); if (native.current === endpoint) native.current = null; };
  }, [url, onNative, entry.ref.id]);
  useEffect(() => {
    const media = element.current; if (!media) return;
    media.volume = settings.volume; media.muted = settings.muted;
  }, [url, settings.volume, settings.muted]);
  useEffect(() => {
    const media = element.current;
    if (!media || !url) return;
    let disposed = false, deadline: ReturnType<typeof setTimeout> | undefined;
    function clearDeadline() { if (deadline !== undefined) clearTimeout(deadline); deadline = undefined; }
    function checkEnd() {
      clearDeadline(); if (disposed || !media || media.paused) return;
      const end = mediaPlayback(latest.current.ref).endSec;
      if (media.currentTime >= end) { media.pause(); media.currentTime = end; checkpoint(true, true); }
      else deadline = setTimeout(checkEnd, Math.max(20, Math.min(1000, (end - media.currentTime) * 1000 / media.playbackRate)));
    }
    function apply() {
      if (disposed || !media) return;
      const bookmark = latest.current.bookmark;
      appliedEpoch.current = bookmark?.epoch;
      if (!passiveRef.current && native.current?.suppressApply(bookmark)) {
        appliedPosition.current = bookmark?.positionEpoch; initialized.current = true; checkEnd(); return;
      }
      if (!initialized.current || bookmark?.paused === false || bookmark?.positionEpoch !== appliedPosition.current) {
        media.currentTime = Math.max(settings.startSec, Math.min(bookmark?.timeSec ?? settings.startSec, settings.endSec)); initialized.current = true;
      }
      appliedPosition.current = bookmark?.positionEpoch;
      if (passiveRef.current || bookmark?.paused !== false) { media.pause(); checkpoint(true, bookmark?.ended === true); return; }
      void media.play().then(() => { if (!disposed) setError(''); }).catch(() => {
        if (!disposed) { setError('Player에서 재생을 허용하세요.'); checkpoint(true); }
      });
    }
    media.onloadedmetadata = apply; media.onended = () => checkpoint(true, true);
    media.ontimeupdate = () => { checkEnd(); if (!media.paused && Date.now() - lastWrite.current >= 5000) { lastWrite.current = Date.now(); checkpoint(false); } };
    media.onplaying = checkEnd; media.onseeked = checkEnd; media.onratechange = checkEnd;
    media.onerror = () => { setError('미디어를 재생하지 못했습니다.'); checkpoint(true); };
    if (media.readyState >= 1) apply();
    return () => { disposed = true; clearDeadline(); media.onloadedmetadata = null; media.onended = null; media.ontimeupdate = null; media.onerror = null; media.onplaying = null; media.onseeked = null; media.onratechange = null; };
  }, [url, entry.bookmark?.epoch, entry.bookmark?.paused, settings.startSec, settings.endSec, passive]);
  async function allow() {
    if (passiveRef.current) return;
    const media = element.current; if (!media) return;
    try {
      const playing = media.play(); await playing;
      const state = await sendSessionRequest({ type: 'GET_SESSION', sessionId });
      if (!state.ok || state.kind !== 'player') throw new Error();
      const result = await sendSessionRequest({ type: 'SESSION_COMMAND', command: { type: 'PLAY_MEDIA', sessionId, documentId, slideId: entry.ref.slideId, mediaId: entry.ref.id, revision: state.snapshot.revision, commandId: crypto.randomUUID() } });
      if (!result.ok) throw new Error(); setError('');
    } catch { media.pause(); setError('재생을 시작하지 못했습니다.'); }
  }
  useEffect(() => { onError(entry.ref.id, error, url && entry.bookmark?.paused !== false ? () => void allow() : undefined); }, [error, url, onError, entry.ref.id, entry.bookmark?.paused]);
  return <div className={entry.ref.kind === 'video' ? 'local-video' : 'local-audio'} data-media-id={entry.ref.id}>
    {entry.ref.kind === 'video' ? <video ref={node => { if (node) element.current = node; }} src={url || undefined} preload={passive ? 'auto' : 'metadata'} playsInline /> : <audio ref={node => { if (node) element.current = node; }} src={url || undefined} preload={passive ? 'auto' : 'metadata'} />}
  </div>;
}
