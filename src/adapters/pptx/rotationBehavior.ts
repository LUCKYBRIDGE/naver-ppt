import { bindPptxTransforms, playPptxTransforms, pptxBaseline, readPptxTransformContext, type PptxAnimationRoot, type PptxPlayback, type PptxTransformSource, type PptxTransformStep } from './transformBehavior';
const code = 'PPTX_ROTATION_UNVERIFIED';
const fail = () => { throw new Error(code); };
export interface PptxRotationValues { by: number | null; from: number | null; to: number | null }
export interface PptxRotationStep extends PptxTransformStep {}
export interface PptxRotationSource extends PptxTransformSource { values: PptxRotationValues }
export function parsePptxAngle(value: string | null): number | null {
  if (value === null) return null;
  if (!/^[+-]?\d+$/.test(value)) return fail();
  const units = Number(value);
  if (!Number.isSafeInteger(units) || units < -2147483648 || units > 2147483647) return fail();
  return units / 60000;
}
function validValues(values: PptxRotationValues) {
  if (!values || Object.keys(values).length !== 3 || !['by', 'from', 'to'].every(key => Object.hasOwn(values, key))) return false;
  if (![values.by, values.from, values.to].every(value => value === null || typeof value === 'number' && Number.isFinite(value) && value >= -2147483648 / 60000 && value <= 2147483647 / 60000)) return false;
  return !(values.by !== null && values.to !== null) && (values.by !== null || values.to !== null);
}
export function pptxRotationFrames(values: PptxRotationValues, baseline: string): Keyframe[] {
  if (!validValues(values)) return fail();
  const { identity } = pptxBaseline(baseline, code);
  if ((values.from !== null || values.to !== null) && !identity) return fail();
  const from = values.from ?? 0, to = values.to ?? from + values.by!;
  const prefix = identity ? '' : baseline + ' ';
  return [{ transform: `${prefix}rotate(${from}deg)` }, { transform: `${prefix}rotate(${to}deg)` }];
}
export function readPptxRotationSource(effect: Element): PptxRotationSource {
  const { behavior, ...context } = readPptxTransformContext(effect, { tag: 'animRot', preset: '24', attributes: ['by', 'from', 'to'], vocabulary: [], names: ['r'] }, code);
  const values = { by: parsePptxAngle(behavior.getAttribute('by')), from: parsePptxAngle(behavior.getAttribute('from')), to: parsePptxAngle(behavior.getAttribute('to')) };
  if (!validValues(values)) return fail();
  return { ...context, values };
}
export function bindPptxRotations(slideXml: string, steps: readonly PptxRotationStep[]) {
  return bindPptxTransforms(slideXml, steps, 'animRot', 'spin', readPptxRotationSource, code);
}
export function playPptxRotationGroup<T extends PptxPlayback>(root: PptxAnimationRoot, steps: readonly PptxRotationStep[], sources: ReadonlyMap<PptxRotationStep, PptxRotationSource>, start: () => T): T {
  return playPptxTransforms(root, steps, sources, 'spin', (source, baseline) => pptxRotationFrames(source.values, baseline), start, code);
}
