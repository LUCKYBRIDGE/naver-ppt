export function inspectPptxModel(value: unknown) {
  const fail = (): never => { throw new Error('PPTX_INVALID_INSPECTION_MODEL'); };
  if (!value || typeof value !== 'object') return fail();
  const model = value as Record<string, unknown>;
  if (model.source !== 'pptx' || !Array.isArray(model.slides) || !model.slides.length || model.slides.length > 1000) return fail();
  const summary = { slides: model.slides.length, elements: 0, unsupported: 0, unknownKinds: 0, media: 0, animationSlides: 0, animationSteps: 0, transitions: 0, hiddenSlides: 0 };
  const active = new Set<object>();
  const visit = (value: unknown, depth: number) => {
    if (depth > 32 || !value || typeof value !== 'object' || Array.isArray(value) || active.has(value) || ++summary.elements > 100000) return fail();
    const element = value as Record<string, unknown>;
    if (typeof element.kind !== 'string' || !element.kind || element.kind.length > 200) return fail();
    active.add(value);
    try {
      if (element.kind === 'unsupported') summary.unsupported++;
      else if (!['shape', 'image', 'group', 'table'].includes(element.kind)) summary.unknownKinds++;
      if (element.media !== undefined && element.media !== null) summary.media++;
      if (element.kind === 'group') {
        if (!Array.isArray(element.children)) return fail();
        for (const child of element.children) visit(child, depth + 1);
      }
    } finally { active.delete(value); }
  };
  for (const value of model.slides) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail();
    const slide = value as Record<string, unknown>;
    if (!Array.isArray(slide.elements)) return fail();
    for (const element of slide.elements) visit(element, 0);
    if (slide.animations !== undefined) {
      if (!Array.isArray(slide.animations) || slide.animations.length > 5000 || [...slide.animations].some(step => !step || typeof step !== 'object' || Array.isArray(step))) return fail();
      if (slide.animations.length) summary.animationSlides++;
      summary.animationSteps += slide.animations.length;
      if (summary.animationSteps > 100000) return fail();
    }
    if (slide.transition != null) summary.transitions++;
    if (slide.hidden === true) summary.hiddenSlides++;
  }
  return summary;
}
