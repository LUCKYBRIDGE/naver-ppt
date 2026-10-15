import { PDFDocument, PDFName, PDFString } from 'pdf-lib';
import { createFixturePdf } from './createPdf.mjs';
export async function createPreflightPdf() {
  const pdf = await PDFDocument.load(createFixturePdf('A'));
  pdf.addJavaScript('SyntheticPreflightOnly', 'var syntheticPreflight = 1;');
  const link = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [20, 20, 100, 50],
    A: { S: 'URI', URI: PDFString.of('https://example.invalid/synthetic-preflight') } }));
  pdf.getPage(0).node.set(PDFName.of('Annots'), pdf.context.obj([link]));
  const middleLink = pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [20, 20, 100, 50],
    A: { S: 'URI', URI: PDFString.of('https://example.invalid/synthetic-middle-page') } }));
  pdf.getPage(3).node.set(PDFName.of('Annots'), pdf.context.obj([middleLink]));
  const bitmap = await pdf.embedPng(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64'));
  pdf.getPage(3).drawImage(bitmap, { x: 100, y: 100, width: 120, height: 120 });
  return Buffer.from(await pdf.save());
}
