import { createHash } from 'node:crypto';

export function selectPptxBackgroundStyle<T>(theme: { fillStyles: readonly T[]; bgFillStyles: readonly T[] }, index: number): T | null {
  if (!Number.isSafeInteger(index) || index < 0) throw Error('PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED');
  if (index === 0 || index === 1000) return null;
  const style = index < 1000 ? theme.fillStyles[index - 1] : theme.bgFillStyles[index - 1001];
  if (!style) throw Error('PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED');
  return style;
}
const parserHash = 'a1663b1c1b659564f25bdb9c1f0d5acdfa10139c48c7d6116ac4178fc0ac0b2f';
const selection = 'C.bgFillStyles[Math.min(Ct, C.bgFillStyles.length) - 1] ?? null';
const background = 'W = pt ? he(pt, qe(ht, mt)) : mt ? { type: "solid", color: mt } : null;';
const fallback = 'return C(w, F);';
export function patchPptxBackground(code: string, id: string): string | null {
  const path = id.replaceAll('\\', '/').split('?')[0] ?? '';
  if (!/\/@web-ppt\/core\/dist\/parser-[^/]+\.js$/.test(path)) return null;
  if (!path.endsWith('/parser-CJhMJQf-.js') || createHash('sha256').update(code).digest('hex') !== parserHash
    || code.split(selection).length !== 2 || code.split(background).length !== 2 || code.split(fallback).length !== 2) throw Error('PPTX_BACKGROUND_PATCH_SOURCE_CHANGED');
  const result = code.replace(selection, '__pptxBackgroundStyle(C, Ct)').replace(background,
    'W = Ct === 0 || Ct === 1000 ? { type: "none" } : pt ? he(pt, qe(ht, mt)) : mt ? { type: "solid", color: mt } : null;').replace(fallback,
    'if (F instanceof Error && F.message === "PPTX_BACKGROUND_STYLE_REFERENCE_UNRESOLVED") throw F; return C(w, F);');
  return `const __pptxBackgroundStyle = ${selectPptxBackgroundStyle.toString()};\n${result}`;
}
export function pptxBackgroundPatch() {
  return { name: 'verified-pptx-background-reference', enforce: 'pre' as const, transform(code: string, id: string) {
    const patched = patchPptxBackground(code, id); if (patched !== null) return { code: patched, map: null };
  } };
}
