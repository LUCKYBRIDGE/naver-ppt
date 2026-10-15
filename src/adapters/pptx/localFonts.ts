import type { PreflightReport } from '../../preflight/check';

type Load = (name: string) => Promise<boolean>;
export interface LocalFontCheck { candidates: number; resolved: number; unresolved: number; pending: number; available: boolean; truncated: boolean }
export function createPptxLocalFontCheck() {
  const names = new Set<string>(); let truncated = false;
  return {
    observe(name: string) {
      name = name.trim();
      if (!name || name.startsWith('+') || name.length > 200 || /[\u0000-\u001f\u007f\uFFFD]/u.test(name)) return;
      if (names.size >= 64 && !names.has(name)) { truncated = true; return; }
      names.add(name);
    },
    async check(signal?: AbortSignal, load?: Load): Promise<LocalFontCheck> {
      if (signal?.aborted) { names.clear(); throw new DOMException('Cancelled', 'AbortError'); }
      const result: LocalFontCheck = { candidates: names.size, resolved: 0, unresolved: 0, pending: names.size, available: !!load || typeof FontFace === 'function', truncated };
      if (!result.available || !names.size) { names.clear(); return result; }
      const resolveLocal: Load = load ?? (async name => {
        // A CSS string inside local(), never a URL, and never added to document.fonts.
        await new FontFace('pptx-local-preflight', `local(${JSON.stringify(name)})`).load(); return true;
      });
      let closed = false, timer: ReturnType<typeof setTimeout> | undefined;
      let onAbort: (() => void) | undefined;
      try {
        const jobs = [...names].map(async name => {
          let resolved = false;
          try { resolved = await resolveLocal(name); } catch { /* local lookup failure is an advisory, not a missing-install claim. */ }
          if (!closed) { result.pending--; if (resolved) result.resolved++; else result.unresolved++; }
        });
        await Promise.race([
          Promise.all(jobs),
          new Promise<void>(resolve => { timer = setTimeout(resolve, 1500); }),
          new Promise<never>((_, reject) => {
            onAbort = () => reject(new DOMException('Cancelled', 'AbortError'));
            signal?.addEventListener('abort', onAbort, { once: true });
            if (signal?.aborted) onAbort();
          }),
        ]);
        if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
        return { ...result };
      } finally { closed = true; names.clear(); clearTimeout(timer); if (onAbort) signal?.removeEventListener('abort', onAbort); }
    },
  };
}
export function localPptxFontPreflight(result: LocalFontCheck): PreflightReport['items'] {
  if (!result.candidates) return [];
  const detail = `슬라이드에 명시된 글꼴 이름 ${result.candidates}종 중 로컬 참조 확인 ${result.resolved}종, 확인 실패 ${result.unresolved}종, 미확인 ${result.pending}종입니다.`;
  return [{ id: 'pptx-local-fonts', category: 'visual', status: result.unresolved ? 'warning' : 'unknown',
    message: `${detail}${!result.available ? ' 이 환경에서는 로컬 글꼴 검사를 사용할 수 없습니다.' : ''}${result.truncated ? ' 검사 한도(64종)를 넘어 나머지는 확인하지 않았습니다.' : ''} ${result.unresolved ? '글꼴이 대체되어 줄바꿈이나 글자 배치가 달라질 수 있습니다. 기준 PDF 또는 원본 앱 화면과 비교하세요. ' : ''}참조 확인은 설치·실제 적용·모든 글자 지원·라이선스·원본 화면 일치의 보증이 아닙니다. 상속·테마·내장 글꼴 적용은 별도 확인이 필요합니다.` }];
}
