import type { MediaPlayback } from '../../media/types';
import { isMediaPlayback } from '../../media/validation';
import { bindPptxMediaTimingTargets, type BoundPptxMediaTimingTarget } from './mediaTimingBinding';
import { PPTX_LIMITS } from './packageGuard';

const p = 'http://schemas.openxmlformats.org/presentationml/2006/main';
const p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
const fail = (): never => { throw Error('PPTX_SOURCE_MEDIA_SETTINGS_UNVERIFIED'); };
export interface PptxSourceMediaSettings {
  volume: number | null; muted: boolean | null; trimStartSec: number; trimEndSec: number; limitations: string[];
}
// Explicit settings only: missing volume/mute are not evidence of source defaults.
// The bound target must already have passed original bytes/model/asset checks.
export function readPptxSourceMediaSettings(xml: Document, target: BoundPptxMediaTimingTarget): PptxSourceMediaSettings {
  if (target.node === 'cmd' || xml.documentElement.namespaceURI !== p || xml.documentElement.localName !== 'sld') return fail();
  const times = [...xml.documentElement.getElementsByTagNameNS(p, 'cTn')].filter(time => Number(time.getAttribute('id')) === target.timingId);
  const common = times[0]?.parentElement;
  if (times.length !== 1 || common?.namespaceURI !== p || common.localName !== 'cMediaNode'
    || common.parentElement?.localName !== target.node || common.parentElement.namespaceURI !== p) return fail();
  const shapes = common.getElementsByTagNameNS(p, 'spTgt');
  if (shapes.length !== 1 || Number(shapes[0]!.getAttribute('spid')) !== target.shapeId) return fail();
  const limitations: string[] = [];
  if ([...common.attributes].some(attr => attr.namespaceURI || !['vol', 'mute', 'numSld', 'showWhenStopped'].includes(attr.name))) limitations.push('unknown-media-setting');
  const bool = (value: string | null) => value === null ? null : ['1', 'true'].includes(value) ? true : ['0', 'false'].includes(value) ? false : fail();
  const rawVolume = common.getAttribute('vol');
  if (rawVolume !== null && (!/^\d+$/.test(rawVolume) || Number(rawVolume) > 100000)) return fail();
  const muted = bool(common.getAttribute('mute')), show = bool(common.getAttribute('showWhenStopped'));
  const count = common.getAttribute('numSld');
  if (count !== null && (!/^\d+$/.test(count) || Number(count) > 4294967295)) return fail();
  if (count !== null && Number(count) > 1) limitations.push('cross-slide-media');
  if (show === false) limitations.push('hide-when-stopped');
  if (rawVolume === null || muted === null) limitations.push('source-defaults-unverified');
  const pics = [...xml.documentElement.getElementsByTagNameNS(p, 'pic')].filter(pic =>
    [...pic.getElementsByTagNameNS(p, 'cNvPr')].some(value => Number(value.getAttribute('id')) === target.shapeId));
  if (pics.length !== 1) return fail();
  const trims = [...pics[0]!.getElementsByTagNameNS(p14, 'trim')];
  if (trims.length > 1) return fail();
  const trim = trims[0];
  if (trim && (trim.parentElement?.namespaceURI !== p14 || trim.parentElement.localName !== 'media' || trim.children.length
    || [...trim.attributes].some(attr => attr.namespaceURI || !['st', 'end'].includes(attr.name)))) return fail();
  const milliseconds = (raw: string | null) => {
    if (raw === null) return 0;
    if (!/^\d+(?:\.\d+)?$/.test(raw) || Number(raw) > 86400000) return fail();
    return Number(raw) / 1000;
  };
  return { volume: rawVolume === null ? null : Number(rawVolume) / 100000, muted,
    trimStartSec: milliseconds(trim?.getAttribute('st') ?? null), trimEndSec: milliseconds(trim?.getAttribute('end') ?? null), limitations };
}

export function sourceMediaPlayback(settings: PptxSourceMediaSettings, durationSec: number): MediaPlayback {
  const playback = { startSec: settings.trimStartSec, endSec: durationSec - settings.trimEndSec,
    volume: settings.volume ?? 1, muted: settings.muted ?? false };
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > 86400 || !isMediaPlayback(playback, durationSec)) return fail();
  return playback;
}

export async function preparePptxSourceMediaSettings(document: Parameters<typeof bindPptxMediaTimingTargets>[0], source: Parameters<typeof bindPptxMediaTimingTargets>[1], slideId: string, signal: AbortSignal) {
  const bound = await bindPptxMediaTimingTargets(document, source, slideId, signal);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  const declarations = bound.filter(target => target.node !== 'cmd');
  if (!declarations.length) return [];
  const bytes = source.files[declarations[0]!.sourcePart];
  if (!bytes?.length || bytes.length > PPTX_LIMITS.xml) return fail();
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); if (/<!\s*(DOCTYPE|ENTITY)/i.test(text)) return fail();
  const xml = new DOMParser().parseFromString(text, 'application/xml'); if (xml.getElementsByTagName('parsererror').length) return fail();
  return declarations.map(target => {
    if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
    return { target, settings: readPptxSourceMediaSettings(xml, target) };
  });
}
