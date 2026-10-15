import type { ImageElement, Slide, SlideElement } from '@web-ppt/core';
import { safeSvgStyle } from './svgBoundary';
const ns = 'http://www.w3.org/2000/svg';
export function pptxMediaCrop(element: Pick<ImageElement, 'crop' | 'clipPath'>) {
  const crop = element.crop ?? { l: 0, t: 0, r: 0, b: 0 };
  if (Object.keys(crop).length !== 4 || ['l', 't', 'r', 'b'].some(key => !Object.hasOwn(crop, key))
    || Object.values(crop).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)
    || 1 - crop.l - crop.r < .01 || 1 - crop.t - crop.b < .01) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  const path = element.clipPath;
  if (path !== undefined && path !== null && (typeof path !== 'string' || !path || path.length > 65536 || !/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/.test(path)
    || (path.match(/[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi) ?? []).some(value => !Number.isFinite(Number(value)) || Math.abs(Number(value)) > 1000000))) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  return { width: 100 / (1 - crop.l - crop.r), height: 100 / (1 - crop.t - crop.b), left: -100 * crop.l / (1 - crop.l - crop.r), top: -100 * crop.t / (1 - crop.t - crop.b) };
}
export function pptxMediaElement(slide: Pick<Slide, 'elements'>, path: readonly number[]) {
  let elements: SlideElement[] = slide.elements, found: SlideElement | undefined;
  if (!path.length || path.length > 33) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  for (let i = 0; i < path.length; i++) {
    const index = path[i]!; if (!Number.isSafeInteger(index) || index < 0) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
    found = elements[index];
    if (i < path.length - 1) {
      if (found?.kind !== 'group' || [found.x, found.y, found.w, found.h, found.rot, found.childX, found.childY, found.scaleX, found.scaleY].some(value => !Number.isFinite(value) || Math.abs(value) > 1000000)
        || found.w <= 0 || found.h <= 0 || !found.scaleX || !found.scaleY || found.effects?.reflection) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
      elements = found.children;
    }
  }
  if (found?.kind !== 'image' || !found.media || !Number.isSafeInteger(found.id) || found.id! <= 0 || found.id! > 4294967295
    || [found.x, found.y, found.w, found.h, found.rot].some(value => !Number.isFinite(value) || Math.abs(value) > 1000000) || found.w <= 0 || found.h <= 0
    || found.effects?.reflection
    || found.filter && !safeSvgStyle(found.filter) || found.alpha !== undefined && (!Number.isFinite(found.alpha) || found.alpha < 0 || found.alpha > 1)) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
  pptxMediaCrop(found); return found;
}
type Slot = { target: HTMLElement; element: ImageElement };
export class PptxMediaSlots {
  private slots = new Map<string, Slot>();
  constructor(private readonly root: HTMLElement) {}
  add(id: string, element: ImageElement) {
    const previous = this.slots.get(id); if (previous) return previous.target;
    if (typeof Element.prototype.moveBefore !== 'function') throw Error('PPTX_MEDIA_STATEFUL_MOVE_UNAVAILABLE');
    const target = document.createElement('div'); target.dataset.pptxMediaSlot = id;
    target.style.cssText = 'width:100%;height:100%;pointer-events:none;';
    // ShadowRoot does not inherit the app stylesheet.
    const crop = pptxMediaCrop(element);
    const style = document.createElement('style'); style.textContent = `.local-video{width:100%;height:100%;position:relative;overflow:hidden}.local-video video{position:absolute;display:block;object-fit:fill;background:#000;width:${crop.width}%;height:${crop.height}%;left:${crop.left}%;top:${crop.top}%}.local-audio{display:none}`; target.append(style);
    const slot = { target, element }, svg = this.root.querySelector('svg');
    if (!svg) throw Error('PPTX_MEDIA_TARGET_MISSING');
    this.place(svg, slot); this.slots.set(id, slot); return target;
  }
  private container(svg: Element, slot: Slot) {
    const candidates = svg.querySelectorAll(`[data-el="${slot.element.id}"]`);
    if (candidates.length !== 1) throw Error('PPTX_MEDIA_TARGET_MISSING');
    const target = candidates[0]!, container = [...target.children].find(child => child.localName === 'g' && child.hasAttribute('transform'));
    if (!container || slot.element.effects?.reflection) throw Error('PPTX_MEDIA_PLACEMENT_UNVERIFIED');
    return container;
  }
  private place(svg: Element, slot: Slot) {
    const container = this.container(svg, slot);
    const object = document.createElementNS(ns, 'foreignObject');
    object.setAttribute('width', String(slot.element.w)); object.setAttribute('height', String(slot.element.h));
    object.dataset.pptxMediaObject = slot.target.dataset.pptxMediaSlot;
    if (slot.element.clipPath) {
      const defs = svg.querySelector('defs') ?? document.createElementNS(ns, 'defs'); if (!defs.parentNode) svg.prepend(defs);
      const clip = document.createElementNS(ns, 'clipPath'), path = document.createElementNS(ns, 'path');
      clip.id = 'pptx-media-' + crypto.randomUUID(); clip.setAttribute('clipPathUnits', 'userSpaceOnUse'); path.setAttribute('d', slot.element.clipPath);
      clip.append(path); defs.append(clip); object.setAttribute('clip-path', `url(#${clip.id})`);
    }
    if (slot.element.media?.kind === 'audio') object.style.display = 'none';
    if (slot.element.flipH || slot.element.flipV) object.setAttribute('transform', `translate(${slot.element.w / 2} ${slot.element.h / 2}) scale(${slot.element.flipH ? -1 : 1} ${slot.element.flipV ? -1 : 1}) translate(${-slot.element.w / 2} ${-slot.element.h / 2})`);
    if (slot.element.alpha !== undefined) object.setAttribute('opacity', String(slot.element.alpha));
    if (slot.element.filter) object.style.filter = slot.element.filter;
    if (slot.element.media?.kind === 'video') {
      // The poster/badge must not show through a translucent live video.
      // Preserve the source outline and geometry for animation measurement.
      for (const child of container.children) if (child.localName !== 'path') (child as SVGElement).style.visibility = 'hidden';
    }
    container.insertBefore(object, [...container.children].find(child => child.localName === 'path') ?? null);
    if (slot.target.isConnected && object.isConnected) object.moveBefore(slot.target, null);
    else object.append(slot.target);
  }
  paint(svg: SVGElement) {
    // Check every target before moving any live media out of the previous SVG.
    // A missing later target must not detach an earlier playing video.
    for (const slot of this.slots.values()) this.container(svg, slot);
    const previous = [...this.root.children]; this.root.append(svg);
    try { for (const slot of this.slots.values()) this.place(svg, slot); }
    catch (error) { svg.remove(); throw error; }
    for (const child of previous) child.remove();
  }
  dispose() { this.slots.clear(); }
}
