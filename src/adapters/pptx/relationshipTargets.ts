export function relationshipSource(name: string): string | null {
  if (name === '_rels/.rels') return null;
  const match = /^(.*\/)?_rels\/([^/]+)\.rels$/.exec(name);
  if (!match) throw new Error('PPTX_INVALID_RELATIONSHIPS');
  return `${match[1] ?? ''}${match[2]}`;
}

export function resolveInternalTarget(source: string | null, target: string): string {
  if (!target || target.length > 2048 || /[\\\x00-\x20\x7f]/.test(target) || target.startsWith('//')) throw new Error('PPTX_UNSAFE_TARGET');
  const path = target.split('#', 1)[0];
  if (!path || path.includes('?') || path.includes(':')) throw new Error('PPTX_UNSAFE_TARGET');
  const parts = path.startsWith('/') ? [] : (source?.split('/').slice(0, -1) ?? []);
  for (const encoded of path.replace(/^\//, '').split('/')) {
    let part: string;
    try { part = decodeURIComponent(encoded); } catch { throw new Error('PPTX_UNSAFE_TARGET'); }
    // Encoded traversal/separators cannot acquire a second meaning in a renderer.
    if ((part !== encoded && (part === '.' || part === '..')) || /[\\/\x00-\x1f\x7f:%?#]/.test(part)) throw new Error('PPTX_UNSAFE_TARGET');
    if (part === '.') continue;
    if (part === '..') {
      if (!parts.length) throw new Error('PPTX_UNSAFE_TARGET');
      parts.pop();
    } else {
      if (!part) throw new Error('PPTX_UNSAFE_TARGET');
      parts.push(part);
    }
  }
  if (!parts.length) throw new Error('PPTX_UNSAFE_TARGET');
  return parts.join('/');
}

export function isUnsafeExternalTarget(target: string): boolean {
  if (!target || target.length > 2048 || /[\\\x00-\x20\x7f]/.test(target)) return true;
  try {
    const url = new URL(target);
    return !['http:', 'https:', 'mailto:'].includes(url.protocol) || Boolean(url.username || url.password);
  } catch {
    // Relative external references have no trusted base in the local-first adapter.
    return true;
  }
}
