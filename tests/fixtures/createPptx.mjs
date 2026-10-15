import { createRequire } from 'node:module';

// The generator is supplied from the bundled workspace runtime, not the product.
export async function createPptx(generatorPath, media) {
  const require = createRequire(import.meta.url);
  const PptxGenJS = require(generatorPath);
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Synthetic fixture';
  pptx.subject = 'No student data'; pptx.title = 'Synthetic PPTX comparison';
  const first = pptx.addSlide(); first.background = { color: 'FFFFFF' };
  first.addText('Synthetic lesson A', { x: 0.5, y: 0.4, w: 8, h: 0.7, fontFace: 'Arial', fontSize: 32, color: '18202A' });
  first.addText('한글 수업 자료', { x: 0.5, y: 1.3, w: 8, h: 0.7, fontFace: 'Malgun Gothic', fontSize: 24, color: '18202A' });
  first.addShape(pptx.ShapeType.rect, { x: 0.5, y: 2.5, w: 3, h: 2, fill: { color: '16A36A' }, line: { color: '16A36A' } });
  first.addImage({ data: 'image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', x: 4, y: 2.5, w: 2, h: 2 });
  first.addNotes('Synthetic private teacher note. Never student data.');
  const second = pptx.addSlide(); second.background = { color: 'FFFFFF' };
  second.addText('Synthetic lesson B', { x: 0.5, y: 0.4, w: 8, h: 0.7, fontFace: 'Arial', fontSize: 32, color: '18202A' });
  second.addTable([['Item', 'Value'], ['Sample', '42']], { x: 0.5, y: 2, w: 7, h: 2, fontFace: 'Arial', fontSize: 24, border: { type: 'solid', color: '333333', pt: 1 }, color: '18202A' });
  if (media) {
    const third = pptx.addSlide(); third.background = { color: 'FFFFFF' };
    third.addText('Synthetic media C', { x: 0.5, y: 0.4, w: 8, h: 0.7, fontFace: 'Arial', fontSize: 32 });
    third.addMedia({ type: 'audio', path: media.audio, x: 0.5, y: 2, w: 3, h: 2 });
    third.addMedia({ type: 'video', path: media.video, x: 4, y: 2, w: 4, h: 2.25 });
    third.addNotes('Synthetic media note, not audience content.');
  }
  return Buffer.from(await pptx.write({ outputType: 'nodebuffer' }));
}
