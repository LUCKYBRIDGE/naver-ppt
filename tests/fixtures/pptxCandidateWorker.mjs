self.onmessage = async ({ data }) => {
  let phase = 'input';
  try {
    if (!(data?.bytes instanceof ArrayBuffer) || !['aiden', 'office'].includes(data.candidate)) throw new Error();
    phase = 'import';
    let summary, frames = [];
    if (data.candidate === 'aiden') {
      const { parseZip, buildPresentation, RECOMMENDED_ZIP_LIMITS } = await import('./aiden0z-pptx-renderer.browser.es.js');
      phase = 'parse';
      const files = await parseZip(data.bytes, RECOMMENDED_ZIP_LIMITS);
      phase = 'model';
      const model = buildPresentation(files);
      summary = { slideCount: model.slides.length, nodeCounts: model.slides.map(slide => slide.nodes.length), mediaCount: model.media.size, effectModel: 'unverified' };
    } else {
      const { loadPresentation, getSlides, getSlideAnimations, renderSlideToSvg } = await import('./office.js');
      phase = 'parse';
      const model = await loadPresentation(new Uint8Array(data.bytes));
      phase = 'model';
      const slides = getSlides(model);
      summary = { slideCount: slides.length, animations: slides.map(slide => getSlideAnimations(slide).map(step => ({ effect: step.effect, start: step.start, durationMs: step.durationMs, delayMs: step.delayMs, playable: step.playable, sequence: step.sequence, targetCount: step.targetShapeIds.length }))), effectPlayback: 'unverified' };
      phase = 'render';
      let totalBytes = 0;
      for (let index = 0; index < slides.length; index++) {
        const svg = renderSlideToSvg(model, slides[index]), bytes = new TextEncoder().encode(svg);
        totalBytes += bytes.length;
        if (bytes.length > 32 * 1024 * 1024 || totalBytes > 256 * 1024 * 1024) throw new RangeError();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(value => value.toString(16).padStart(2, '0')).join('');
        const selected = slides.length === 23 ? [0, 2, 14, 22].includes(index) : index < 3;
        frames.push({ page: index + 1, bytes: bytes.length, hash, ...(selected ? { svg } : {}) });
      }
    }
    self.postMessage({ ok: true, summary, frames, domAvailable: typeof document !== 'undefined', domParserAvailable: typeof DOMParser !== 'undefined' });
  } catch (error) {
    // Candidate exceptions may contain file content; report only a fixed phase code.
    const errorName = ['ReferenceError', 'TypeError', 'RangeError', 'SyntaxError'].includes(error?.name) ? error.name : 'Error';
    const missingGlobal = /^(DOMParser|document|window) is not defined$/.exec(error?.message ?? '')?.[1] ?? null;
    self.postMessage({ ok: false, code: 'CANDIDATE_WORKER_FAILED', phase, errorName, missingGlobal, domAvailable: typeof document !== 'undefined', domParserAvailable: typeof DOMParser !== 'undefined' });
  }
};
