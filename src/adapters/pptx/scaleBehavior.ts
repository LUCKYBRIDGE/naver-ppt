import { bindPptxTransforms, playPptxTransforms, pptxBaseline, pptxTimingNamespace, readPptxTransformContext, type PptxAnimationRoot, type PptxPlayback, type PptxTransformSource, type PptxTransformStep } from './transformBehavior';
const code = 'PPTX_SCALE_UNVERIFIED';
const fail = () => { throw new Error(code); };
export interface PptxScalePoint { x: number; y: number }
export interface PptxScaleValues { by: PptxScalePoint | null; from: PptxScalePoint | null; to: PptxScalePoint | null }
export interface PptxScaleSource extends PptxTransformSource { values: PptxScaleValues }
export function parsePptxScale(value: string | null): number {
  if (value === null) return fail();
  let factor: number;
  if (/^[+]?\d+(?:\.\d+)?%$/.test(value)) factor = Number(value.slice(0, -1)) / 100;
  else if (/^[+]?\d+$/.test(value)) {
    const units = Number(value);
    if (!Number.isSafeInteger(units) || units > 2147483647) return fail();
    factor = units / 100000;
  } else return fail();
  return Number.isFinite(factor) && factor >= 0 && factor <= 1000 ? factor : fail();
}
function point(value: PptxScalePoint | null) {
  return value === null || !!value && Object.keys(value).length === 2 && ['x', 'y'].every(key => Object.hasOwn(value, key)) && [value.x, value.y].every(factor => typeof factor === 'number' && Number.isFinite(factor) && factor >= 0 && factor <= 1000);
}
export function pptxScaleFrames(values: PptxScaleValues, baseline: string): Keyframe[] {
  if (!values || Object.keys(values).length !== 3 || !['by', 'from', 'to'].every(key => Object.hasOwn(values, key)) || ![values.by, values.from, values.to].every(point)) return fail();
  if (values.to === null && (values.by === null || values.from !== null)) return fail();
  const { identity } = pptxBaseline(baseline, code);
  if (!identity) return fail();
  const from = values.from ?? (values.to !== null ? { x: 0, y: 0 } : { x: 1, y: 1 }), to = values.to ?? values.by!;
  return [{ transform: `scale(${from.x}, ${from.y})` }, { transform: `scale(${to.x}, ${to.y})` }];
}
export function readPptxScaleSource(effect: Element): PptxScaleSource {
  const { behavior, ...context } = readPptxTransformContext(effect, { tag: 'animScale', preset: '6', attributes: [], vocabulary: ['by', 'from', 'to'], names: ['ScaleX', 'ScaleY'] }, code);
  const readPoint = (name: string): PptxScalePoint | null => {
    const nodes = [...behavior.children].filter(node => node.localName === name);
    if (!nodes.length) return null;
    if (nodes.length !== 1) return fail();
    const node = nodes[0]!;
    if (node.namespaceURI !== pptxTimingNamespace || node.children.length || node.attributes.length !== 2 || [...node.attributes].some(attribute => attribute.namespaceURI || !['x', 'y'].includes(attribute.name))) return fail();
    return { x: parsePptxScale(node.getAttribute('x')), y: parsePptxScale(node.getAttribute('y')) };
  };
  if ([...behavior.children].some(node => !['cBhvr', 'by', 'from', 'to'].includes(node.localName))) return fail();
  const values = { by: readPoint('by'), from: readPoint('from'), to: readPoint('to') };
  pptxScaleFrames(values, 'none');
  return { ...context, values };
}
export function bindPptxScales(slideXml: string, steps: readonly PptxTransformStep[]) {
  return bindPptxTransforms(slideXml, steps, 'animScale', 'zoom', readPptxScaleSource, code);
}
export function playPptxScaleGroup<T extends PptxPlayback>(root: PptxAnimationRoot, steps: readonly PptxTransformStep[], sources: ReadonlyMap<PptxTransformStep, PptxScaleSource>, start: () => T): T {
  return playPptxTransforms(root, steps, sources, 'zoom', (source, baseline) => pptxScaleFrames(source.values, baseline), start, code);
}
