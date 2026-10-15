const formats = {
  'audio/wav': { kind: 'audio', extension: 'wav' },
  'audio/mpeg': { kind: 'audio', extension: 'mp3' },
  'video/mp4': { kind: 'video', extension: 'mp4' },
  'video/webm': { kind: 'video', extension: 'webm' },
} as const;

export function validatePptxMediaReference(value: unknown, ownedUrls: ReadonlySet<string>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('PPTX_INVALID_MEDIA_REFERENCE');
  const ref = value as Record<string, unknown>;
  if (ref.external !== undefined && ref.external !== false) throw new Error('PPTX_EXTERNAL_MEDIA');
  if (typeof ref.src !== 'string' || !ref.src.startsWith('blob:') || !ownedUrls.has(ref.src)) throw new Error('PPTX_UNOWNED_MEDIA');
  const format = typeof ref.mime === 'string' && Object.hasOwn(formats, ref.mime) ? formats[ref.mime as keyof typeof formats] : undefined;
  if (!format || ref.kind !== format.kind) throw new Error('PPTX_MEDIA_KIND_MISMATCH');
  return { ...format, mime: ref.mime as keyof typeof formats, src: ref.src };
}
