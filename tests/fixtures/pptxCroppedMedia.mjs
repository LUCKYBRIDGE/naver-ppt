// Only call with the generated synthetic media fixture, never a user's original.
export function cropSyntheticPptxMedia(bytes, zip) {
  const files = zip.unzipSync(new Uint8Array(bytes)), decoder = new TextDecoder(), encoder = new TextEncoder();
  const p = 'http://schemas.openxmlformats.org/presentationml/2006/main', a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const part = 'ppt/slides/slide3.xml', xml = new DOMParser().parseFromString(decoder.decode(files[part]), 'application/xml');
  const pic = [...xml.getElementsByTagNameNS(p, 'pic')].find(node => node.getElementsByTagNameNS(a, 'videoFile').length);
  if (!pic || xml.getElementsByTagName('parsererror').length) throw Error('SYNTHETIC_VIDEO_REQUIRED');
  const fill = pic.getElementsByTagNameNS(p, 'blipFill')[0], shape = pic.getElementsByTagNameNS(p, 'spPr')[0];
  if (!fill || !shape) throw Error('SYNTHETIC_VIDEO_GEOMETRY_REQUIRED');
  const rect = xml.createElementNS(a, 'a:srcRect');
  for (const [key, value] of Object.entries({ l: 25000, r: 25000, t: 0, b: 0 })) rect.setAttribute(key, String(value));
  for (const old of [...fill.getElementsByTagNameNS(a, 'srcRect')]) old.remove();
  fill.insertBefore(rect, fill.getElementsByTagNameNS(a, 'stretch')[0] ?? null);
  for (const old of [...shape.getElementsByTagNameNS(a, 'prstGeom'), ...shape.getElementsByTagNameNS(a, 'custGeom')]) old.remove();
  const geometry = xml.createElementNS(a, 'a:prstGeom'); geometry.setAttribute('prst', 'ellipse'); geometry.append(xml.createElementNS(a, 'a:avLst')); shape.append(geometry);
  // One explicit click rotation of the video shape, independent of media playback.
  // This fixture does not claim to preserve any source media trigger semantics.
  const targetId = pic.getElementsByTagNameNS(p, 'cNvPr')[0]?.getAttribute('id');
  if (!/^\d+$/.test(targetId ?? '')) throw Error('SYNTHETIC_VIDEO_ID_REQUIRED');
  for (const old of [...xml.getElementsByTagNameNS(p, 'timing')]) old.remove();
  const node = (name, attrs = {}, parent) => {
    const element = xml.createElementNS(p, 'p:' + name);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value));
    parent?.append(element); return element;
  };
  const timing = node('timing', {}, xml.documentElement), list = node('tnLst', {}, timing), par = node('par', {}, list);
  const root = node('cTn', { id: 1, dur: 'indefinite', nodeType: 'tmRoot' }, par);
  const seq = node('seq', { concurrent: 1, nextAc: 'seek' }, node('childTnLst', {}, root));
  const main = node('cTn', { id: 2, dur: 'indefinite', nodeType: 'mainSeq' }, seq);
  const step = node('par', {}, node('childTnLst', {}, main));
  const click = node('cTn', { id: 10, presetClass: 'emph', presetID: 24, nodeType: 'clickEffect', fill: 'hold' }, step);
  node('cond', { delay: 0 }, node('stCondLst', {}, click));
  const rotation = node('animRot', { by: 5400000 }, node('childTnLst', {}, click)), common = node('cBhvr', {}, rotation);
  node('cTn', { id: 11, dur: 200, fill: 'hold' }, common); node('spTgt', { spid: targetId }, node('tgtEl', {}, common));
  node('attrName', {}, node('attrNameLst', {}, common)).textContent = 'r';
  files[part] = encoder.encode(new XMLSerializer().serializeToString(xml));
  return zip.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') });
}
