const hosts: Record<'canva' | 'miricanvas', readonly string[]> = { canva: ['canva.com'], miricanvas: ['miricanvas.com'] };

export function isApprovedWebPresentationUrl(type: unknown, value: unknown): value is string {
  if ((type !== 'canva' && type !== 'miricanvas') || typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const url = new URL(value), host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port || url.hash) return false;
    return hosts[type].some(root => host === root || host.endsWith(`.${root}`));
  } catch { return false; }
}
