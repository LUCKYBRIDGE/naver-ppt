import { resolveInternalTarget } from './relationshipTargets';

export type ContentTypeDeclaration = { kind: 'Default' | 'Override'; key: string; mime: string };
export const PRESENTATION_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml';
const mediaFormats = {
  png: ['image/png'], wav: ['audio/wav', 'audio/x-wav'], mp3: ['audio/mpeg'],
  mp4: ['video/mp4', 'audio/mp4'], webm: ['video/webm', 'audio/webm'],
} as const;

export function matchesPptxMediaHeader(format: keyof typeof mediaFormats, bytes: Uint8Array) {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  switch (format) {
    case 'png': return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
    case 'wav': return bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE';
    case 'mp3': return bytes.length >= 3 && (ascii(0, 3) === 'ID3' || bytes[0] === 255 && (bytes[1]! & 224) === 224);
    case 'mp4': return bytes.length >= 12 && ascii(4, 8) === 'ftyp';
    case 'webm': return bytes.length >= 4 && [26, 69, 223, 163].every((value, index) => bytes[index] === value);
  }
}

export function inspectContentTypes(files: Record<string, Uint8Array>, declarations: ContentTypeDeclaration[]) {
  const defaults = new Map<string, string>(), overrides = new Map<string, string>();
  let orphanOverrides = 0;
  for (const declaration of declarations) {
    const mime = declaration.mime.toLowerCase();
    if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mime)) throw new Error('PPTX_INVALID_CONTENT_TYPES');
    if (/macroenabled|vbaproject|activex|javascript|text\/html|x-msdownload/.test(mime)) throw new Error('PPTX_ACTIVE_CONTENT');
    if (declaration.kind === 'Default') {
      const extension = declaration.key.toLowerCase();
      if (!/^[a-z0-9]+$/.test(extension) || defaults.has(extension)) throw new Error('PPTX_INVALID_CONTENT_TYPES');
      defaults.set(extension, mime);
    } else {
      if (!declaration.key.startsWith('/') || /[?#]/.test(declaration.key)) throw new Error('PPTX_INVALID_CONTENT_TYPES');
      const name = resolveInternalTarget(null, declaration.key);
      if (name === '[Content_Types].xml' || name.endsWith('/') || overrides.has(name)) throw new Error('PPTX_INVALID_CONTENT_TYPES');
      // A stale declaration cannot supply bytes; report it without dropping real slides.
      if (!Object.hasOwn(files, name)) orphanOverrides++;
      overrides.set(name, mime);
    }
  }
  let typedParts = 0, checkedMediaHeaders = 0, uncheckedMediaParts = 0;
  for (const [name, bytes] of Object.entries(files)) {
    if (name === '[Content_Types].xml' || name.endsWith('/')) continue;
    const extension = name.split('.').at(-1)?.toLowerCase() ?? '';
    const mime = overrides.get(name) ?? defaults.get(extension);
    if (!mime) throw new Error('PPTX_CONTENT_TYPE_MISSING');
    if (name === 'ppt/presentation.xml' && mime !== PRESENTATION_MIME) throw new Error('PPTX_PRESENTATION_TYPE_MISMATCH');
    if (/\.rels$/i.test(name) && mime !== 'application/vnd.openxmlformats-package.relationships+xml') throw new Error('PPTX_RELATIONSHIP_TYPE_MISMATCH');
    typedParts++;
    const formats = Object.entries(mediaFormats) as [keyof typeof mediaFormats, readonly string[]][];
    const byExtension = formats.find(([format]) => format === extension);
    const byMime = formats.find(([, mimes]) => mimes.includes(mime));
    const selected = byExtension ?? byMime;
    if (selected) {
      if (!selected[1].includes(mime) || !matchesPptxMediaHeader(selected[0], bytes)) throw new Error('PPTX_MEDIA_HEADER_MISMATCH');
      checkedMediaHeaders++;
    } else if (/^(image|audio|video)\//.test(mime) || name.startsWith('ppt/media/')) {
      uncheckedMediaParts++;
    }
  }
  return { typedParts, checkedMediaHeaders, uncheckedMediaParts, orphanOverrides };
}
