// Browser-only transformation of the synthetic fixture, never a user original.
export function canonicalPptxAudio(bytes, zip) {
  const files = zip.unzipSync(new Uint8Array(bytes));
  const decoder = new TextDecoder(), encoder = new TextEncoder();
  const drawing = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const relationships = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const name = 'ppt/slides/slide3.xml', relName = 'ppt/slides/_rels/slide3.xml.rels';
  if (!files[name] || !files[relName]) throw new Error('SYNTHETIC_MEDIA_FIXTURE_REQUIRED');
  const parser = new DOMParser();
  const slide = parser.parseFromString(decoder.decode(files[name]), 'application/xml');
  const rels = parser.parseFromString(decoder.decode(files[relName]), 'application/xml');
  if (slide.querySelector('parsererror') || rels.querySelector('parsererror')) throw new Error('INVALID_FIXTURE_XML');
  const audio = new Set([...rels.getElementsByTagNameNS('*', 'Relationship')]
    .filter(node => node.getAttribute('Type') === `${relationships}/audio`)
    .map(node => node.getAttribute('Id')));
  let edits = 0;
  for (const node of [...slide.getElementsByTagNameNS(drawing, 'videoFile')]) {
    const id = node.getAttributeNS(relationships, 'link');
    if (!audio.has(id)) continue;
    const replacement = slide.createElementNS(drawing, 'a:audioFile');
    for (const attribute of [...node.attributes]) replacement.setAttributeNS(attribute.namespaceURI, attribute.name, attribute.value);
    node.replaceWith(replacement); edits++;
  }
  if (edits !== 1) throw new Error('EXPECTED_ONE_SYNTHETIC_AUDIO_REPLACEMENT');
  files[name] = encoder.encode(new XMLSerializer().serializeToString(slide));
  return { bytes: zip.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') }), edits };
}
