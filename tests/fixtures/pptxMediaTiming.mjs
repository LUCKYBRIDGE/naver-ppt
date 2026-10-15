// Inspection fixture only. Transform a generated deck, never a teacher original.
export function addSyntheticMediaTiming(bytes, zip) {
  const files = zip.unzipSync(new Uint8Array(bytes)), decoder = new TextDecoder(), encoder = new TextEncoder();
  const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main', drawing = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const part = 'ppt/slides/slide3.xml', xml = new DOMParser().parseFromString(decoder.decode(files[part]), 'application/xml');
  const pics = [...xml.getElementsByTagNameNS(ns, 'pic')];
  const target = tag => pics.find(pic => pic.getElementsByTagNameNS(drawing, tag).length)?.getElementsByTagNameNS(ns, 'cNvPr')[0]?.getAttribute('id');
  const audio = target('audioFile'), video = target('videoFile');
  if (!/^\d+$/.test(audio ?? '') || !/^\d+$/.test(video ?? '')) throw Error('SYNTHETIC_MEDIA_TARGETS_REQUIRED');
  for (const old of [...xml.getElementsByTagNameNS(ns, 'timing')]) old.remove();
  const node = (tag, attrs = {}, parent) => {
    const value = xml.createElementNS(ns, 'p:' + tag);
    for (const [key, attribute] of Object.entries(attrs)) value.setAttribute(key, String(attribute));
    parent?.append(value); return value;
  };
  const timing = node('timing', {}, xml.documentElement), list = node('tnLst', {}, timing), par = node('par', {}, list);
  const root = node('cTn', { id: 1, dur: 'indefinite', nodeType: 'tmRoot', repeatCount: 2000, autoRev: 1 }, par), children = node('childTnLst', {}, root);
  const makeTarget = (parent, shape) => node('spTgt', { spid: shape }, node('tgtEl', {}, parent));
  for (const [tag, shape, id] of [['audio', audio, 2], ['video', video, 3]]) {
    const media = node('cMediaNode', { vol: 25000, mute: 1, numSld: 2, showWhenStopped: 1 }, node(tag, {}, children));
    const time = node('cTn', { id, dur: 'indefinite' }, media); makeTarget(media, shape);
    if (tag === 'video') node('tn', { val: 2 }, node('cond', { evt: 'onEnd', delay: 0 }, node('endCondLst', {}, time)));
  }
  const p14 = 'http://schemas.microsoft.com/office/powerpoint/2010/main';
  const videoPic = pics.find(pic => pic.getElementsByTagNameNS(drawing, 'videoFile').length);
  const extension = videoPic?.getElementsByTagNameNS(p14, 'media')[0];
  if (!extension) throw Error('SYNTHETIC_P14_MEDIA_REQUIRED');
  const trim = xml.createElementNS(p14, 'p14:trim'); trim.setAttribute('st', '100.25'); trim.setAttribute('end', '200.5'); extension.append(trim);
  const call = node('cmd', { type: 'call', cmd: 'playFrom(0.25)' }, children), common = node('cBhvr', {}, call);
  const time = node('cTn', { id: 4 }, common); node('cond', { evt: 'onClick', delay: 100 }, node('stCondLst', {}, time)); makeTarget(common, video);
  files[part] = encoder.encode(new XMLSerializer().serializeToString(xml));
  return zip.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') });
}

// A media-only group, a video+shape group, and a media command-only group.
// This is a structural alignment fixture, not an assertion of playback semantics.
export function addSyntheticMediaOrder(bytes, zip) {
  const files = zip.unzipSync(new Uint8Array(bytes)), part = 'ppt/slides/slide3.xml';
  const ns = 'http://schemas.openxmlformats.org/presentationml/2006/main';
  const xml = new DOMParser().parseFromString(new TextDecoder().decode(files[part]), 'application/xml');
  const root = [...xml.getElementsByTagNameNS(ns, 'cTn')].find(node => node.getAttribute('id') === '1');
  const list = [...root.children].find(node => node.localName === 'childTnLst');
  const [audio, video, command] = [...list.children];
  if (audio.localName !== 'audio' || video.localName !== 'video' || command.localName !== 'cmd') throw Error('SYNTHETIC_TIMING_REQUIRED');
  const node = (tag, attrs, parent) => {
    const value = xml.createElementNS(ns, 'p:' + tag); for (const [key, item] of Object.entries(attrs)) value.setAttribute(key, String(item));
    parent?.append(value); return value;
  };
  list.replaceChildren();
  const sequence = node('seq', { concurrent: 1, nextAc: 'seek', prevAc: 'skipTimed' }, list);
  const main = node('cTn', { id: 10, dur: 'indefinite', nodeType: 'mainSeq' }, sequence), groups = node('childTnLst', {}, main);
  let videoGroup;
  [audio, video, command].forEach((media, index) => {
    const time = node('cTn', { id: 20 + index * 10, nodeType: 'clickEffect', fill: 'hold' }, node('par', {}, groups));
    node('cond', { delay: 0 }, node('stCondLst', {}, time));
    const children = node('childTnLst', {}, time); children.append(media); if (index === 1) videoGroup = children;
  });
  const effect = node('cTn', { id: 31, presetClass: 'emph', presetID: 24, nodeType: 'withEffect', fill: 'hold' }, node('par', {}, videoGroup));
  node('cond', { delay: 0 }, node('stCondLst', {}, effect));
  const behavior = node('animRot', { by: 5400000 }, node('childTnLst', {}, effect)), common = node('cBhvr', {}, behavior);
  node('cTn', { id: 32, dur: 200, fill: 'hold' }, common);
  const videoShape = video.getElementsByTagNameNS(ns, 'spTgt')[0].getAttribute('spid');
  node('spTgt', { spid: videoShape }, node('tgtEl', {}, common)); node('attrName', {}, node('attrNameLst', {}, common)).textContent = 'r';
  for (const [tag, event] of [['prevCondLst', 'onPrev'], ['nextCondLst', 'onNext']]) node('sldTgt', {}, node('tgtEl', {}, node('cond', { evt: event, delay: 0 }, node(tag, {}, sequence))));
  files[part] = new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
  return zip.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') });
}

// Generated fixture for the verified sequential command path. This does not
// rewrite or repair a teacher original, and carries no shape animation steps.
export function addSyntheticExecutableMediaTimeline(bytes, zip) {
  const files = zip.unzipSync(new Uint8Array(bytes)), part = 'ppt/slides/slide3.xml';
  const p = 'http://schemas.openxmlformats.org/presentationml/2006/main', a = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const xml = new DOMParser().parseFromString(new TextDecoder().decode(files[part]), 'application/xml');
  const pic = [...xml.getElementsByTagNameNS(p, 'pic')].find(pic => pic.getElementsByTagNameNS(a, 'videoFile').length);
  const shape = pic?.getElementsByTagNameNS(p, 'cNvPr')[0]?.getAttribute('id');
  if (!shape) throw Error('SYNTHETIC_VIDEO_REQUIRED');
  for (const old of [...xml.getElementsByTagNameNS(p, 'timing')]) old.remove();
  const node = (tag, attrs, parent) => {
    const element = xml.createElementNS(p, 'p:' + tag);
    for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, String(value)); parent?.append(element); return element;
  };
  const start = (time, delay) => node('cond', { delay }, node('stCondLst', {}, time));
  const target = parent => node('spTgt', { spid: shape }, node('tgtEl', {}, parent));
  const root = node('cTn', { id: 1, nodeType: 'tmRoot', dur: 'indefinite', restart: 'never' }, node('par', {}, node('tnLst', {}, node('timing', {}, xml.documentElement))));
  start(root, 0); const children = node('childTnLst', {}, root);
  const common = node('cMediaNode', { vol: 25000, mute: 1 }, node('video', {}, children));
  start(node('cTn', { id: 2, dur: 'indefinite' }, common), 'indefinite'); target(common);
  const seq = node('seq', {}, children), main = node('cTn', { id: 10, nodeType: 'mainSeq', dur: 'indefinite' }, seq);
  start(main, 0); const groups = node('childTnLst', {}, main);
  ['play', 'pause', 'playFrom(0.5)', 'stop', 'togglePause'].forEach((command, index) => {
    const group = node('cTn', { id: 20 + index * 10, nodeType: 'clickEffect' }, node('par', {}, groups)); start(group, 0);
    const behavior = node('cBhvr', {}, node('cmd', { cmd: command }, node('childTnLst', {}, group)));
    start(node('cTn', { id: 100 + index }, behavior), index === 0 ? 750 : 0); target(behavior);
  });
  node('sldTgt', {}, node('tgtEl', {}, node('cond', { evt: 'onNext', delay: 0 }, node('nextCondLst', {}, seq))));
  files[part] = new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
  return zip.zipSync(files, { mtime: new Date('2000-01-01T00:00:00Z') });
}
