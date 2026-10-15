import type { PreflightReport } from '../../preflight/check';
export interface PptxFontMetadata { references: number; uniqueNames: number; invalidReferences: number; invalidNames: number; embeddedParts: number; truncated: boolean }
export function createPptxFontMetadata(embeddedParts: number) {
  const names = new Set<string>(), invalid = new Set<string>();
  let references = 0, invalidReferences = 0, truncated = false;
  return {
    inspect(xml: Document, observe?: (name: string) => void) {
      for (const element of xml.getElementsByTagName('*')) {
        const name = element.getAttribute('typeface')?.trim(); if (!name) continue;
        references++;
        observe?.(name);
        const broken = /\uFFFD|[\u0000-\u001f\u007f]/u.test(name) || name.length > 200;
        if (broken) invalidReferences++;
        if (name.length > 200 || names.size >= 5000 && !names.has(name)) { truncated = true; continue; }
        names.add(name); if (broken) invalid.add(name);
      }
    },
    summary(): PptxFontMetadata { return { references, uniqueNames: names.size, invalidReferences, invalidNames: invalid.size, embeddedParts, truncated }; },
  };
}
export function pptxFontPreflight(metadata?: PptxFontMetadata): PreflightReport['items'] {
  if (!metadata) return [];
  const detail = `글꼴 이름 ${metadata.uniqueNames}종·참조 ${metadata.references}개, 내장 글꼴 파트 ${metadata.embeddedParts}개를 발견했습니다. 설치·실제 적용·라이선스·원본 화면 일치는 미확인입니다.`;
  return [{ id: 'pptx-font-metadata', category: 'visual', status: metadata.invalidReferences || metadata.truncated ? 'warning' : 'unknown',
    message: metadata.invalidReferences
      ? `원본 글꼴 이름에 깨진 문자 또는 확인할 수 없는 값이 있습니다(${metadata.truncated ? '이름 목록 일부 미확인' : `${metadata.invalidNames}종`}·참조 ${metadata.invalidReferences}개). 글꼴과 줄바꿈이 달라질 수 있으므로 발표 전에 기준 PDF나 원본 앱 화면과 비교하세요. ${detail}`
      : `${detail}${metadata.truncated ? ' 글꼴 목록 한도로 전체 이름을 확인하지 못했습니다.' : ''}` }];
}
