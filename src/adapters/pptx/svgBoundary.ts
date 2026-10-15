const svgNamespace = 'http://www.w3.org/2000/svg', htmlNamespace = 'http://www.w3.org/1999/xhtml';
const svgTags = new Set('svg g defs rect circle ellipse line polyline polygon path text tspan image clippath mask pattern lineargradient radialgradient stop filter feblend fecolormatrix fecomponenttransfer fecomposite feconvolvematrix fediffuselighting fedisplacementmap fedistantlight fedropshadow feflood fefunca fefuncb fefuncg fefuncr fegaussianblur feimage femerge femergenode femorphology feoffset fepointlight fespecularlighting fespotlight fetile feturbulence foreignobject title desc'.split(' '));
const htmlTags = new Set('div span p br b strong i em u s sub sup table tbody thead tr td th'.split(' '));

export function safeSvgStyle(value: string) {
  if (/\\|\/\*|\*\/|@import|@font-face|expression\s*\(|javascript\s*:|behavior\s*:/i.test(value)) return false;
  return !/url\s*\(/i.test(value.replace(/url\(\s*(['"]?)#[a-z0-9_.-]+\1\s*\)/gi, ''));
}

export function safeSvgAttribute(name: string, value: string, ownedBlobUrls: ReadonlySet<string> = new Set()) {
  const key = name.toLowerCase();
  if (key.startsWith('on') || ['srcdoc', 'src', 'action', 'formaction', 'background'].includes(key)) return false;
  if (key === 'href' || key === 'xlink:href') return /^#[a-z0-9_.-]+$/i.test(value) || /^data:image\/(png|jpeg|jpg|gif|webp);base64,[a-z0-9+/=]+$/i.test(value) || ownedBlobUrls.has(value);
  if (['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'cursor', 'marker-start', 'marker-mid', 'marker-end'].includes(key) || /url\s*\(/i.test(value)) return safeSvgStyle(value);
  return true;
}

export function parseDisplaySvg(source: string, ownedBlobUrls: ReadonlySet<string> = new Set()): SVGElement {
  if (source.length > 8 * 1024 * 1024 || /<!\s*(DOCTYPE|ENTITY)/i.test(source)) throw new Error('PPTX_UNSAFE_SVG');
  const xml = new DOMParser().parseFromString(source, 'image/svg+xml'), root = xml.documentElement;
  if (xml.getElementsByTagName('parsererror').length || root.localName !== 'svg' || root.namespaceURI !== svgNamespace) throw new Error('PPTX_UNSAFE_SVG');
  const elements = [root, ...root.querySelectorAll('*')];
  if (elements.length > 100000) throw new Error('PPTX_SVG_NODE_LIMIT');
  for (const element of elements) {
    const allowed = element.namespaceURI === svgNamespace ? svgTags : element.namespaceURI === htmlNamespace ? htmlTags : null;
    if (!allowed?.has(element.localName.toLowerCase())) throw new Error('PPTX_UNSAFE_SVG');
    for (const attribute of element.attributes) if (!safeSvgAttribute(attribute.localName, attribute.value, ownedBlobUrls)) throw new Error('PPTX_UNSAFE_SVG');
  }
  return document.importNode(root, true) as unknown as SVGElement;
}
