import type { OverlayData } from './types';
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const positive = (n: unknown): n is number => finite(n) && n > 0;
const text = (s: unknown, max = 200): s is string => typeof s === 'string' && s.length > 0 && s.length <= max;
const color = (s: unknown) => typeof s === 'string' && /^#(?:[a-f0-9]{3}|[a-f0-9]{6}|[a-f0-9]{8})$/i.test(s);
function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function shape(v: Record<string, unknown>, required: string[], optional: string[] = []) {
  return required.every(k => Object.hasOwn(v, k)) && Object.keys(v).every(k => required.includes(k) || optional.includes(k));
}
function point(v: unknown) { return object(v) && shape(v, ['x', 'y']) && finite(v.x) && v.x >= 0 && v.x <= 1 && finite(v.y) && v.y >= 0 && v.y <= 1; }
function rect(v: unknown) { return object(v) && shape(v, ['x', 'y', 'width', 'height']) && finite(v.x) && v.x >= 0 && finite(v.y) && v.y >= 0
  && positive(v.width) && positive(v.height) && v.x + v.width <= 1 + 1e-10 && v.y + v.height <= 1 + 1e-10; }
function overlay(v: unknown) {
  if (!object(v) || !text(v.id) || !finite(v.zIndex) || typeof v.visible !== 'boolean') return false;
  const base = ['id', 'kind', 'zIndex', 'visible'];
  if (v.kind === 'mask') return shape(v, [...base, 'rect', 'color']) && rect(v.rect) && color(v.color);
  if (v.kind === 'stroke') return shape(v, [...base, 'points', 'color', 'widthNormalized', 'tool']) && Array.isArray(v.points)
    && v.points.length > 0 && v.points.length <= 10000 && v.points.every(point) && color(v.color) && positive(v.widthNormalized)
    && v.widthNormalized <= 1 && ['pen', 'highlighter'].includes(String(v.tool));
  if (v.kind !== 'textbox' || !shape(v, [...base, 'rect', 'text', 'backgroundColor', 'color', 'fontFamily', 'minFontPx', 'maxFontPx',
    'fitMode', 'paddingPx', 'lineHeight', 'align', 'verticalAlign'], ['fontPx', 'referenceWidth', 'referenceHeight'])) return false;
  return rect(v.rect) && typeof v.text === 'string' && v.text.length <= 10000 && color(v.color) && color(v.backgroundColor) && text(v.fontFamily)
    && positive(v.minFontPx) && positive(v.maxFontPx) && v.minFontPx <= v.maxFontPx && v.maxFontPx <= 1024
    && finite(v.paddingPx) && v.paddingPx >= 0 && v.paddingPx <= 1024 && positive(v.lineHeight) && v.lineHeight <= 4
    && ['auto-max', 'manual'].includes(String(v.fitMode)) && ['left', 'center', 'right'].includes(String(v.align))
    && ['top', 'middle', 'bottom'].includes(String(v.verticalAlign))
    && ['fontPx', 'referenceWidth', 'referenceHeight'].every(k => !Object.hasOwn(v, k) || (positive(v[k]) && v[k] <= 20000));
}
export function isOverlayList(value: unknown): value is OverlayData[] {
  return Array.isArray(value) && value.length <= 256 && value.every(overlay) && new Set(value.map(v => v.id)).size === value.length
    && value.reduce((sum, v) => sum + (v.kind === 'stroke' ? v.points.length : 0), 0) <= 50000;
}
