// Isolated verifier instrumentation: numbers only, no file names/URLs/body bytes.
export function observeMediaMemory() {
  const stats = { reads: {}, parsers: {}, native: [], assetBytes: 0, assetCount: 0 }, owned = new Map();
  const identities = new WeakMap(); let nextId = 0;
  const id = object => { if (!identities.has(object)) identities.set(object, ++nextId); return identities.get(object); };
  const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = blob => { const url = create(blob); owned.set(url, blob.size); return url; };
  URL.revokeObjectURL = url => { owned.delete(url); revoke(url); };
  window.__assetBytes = () => [...owned.values()].reduce((sum, bytes) => sum + bytes, 0);
  const read = Blob.prototype.arrayBuffer;
  Blob.prototype.arrayBuffer = async function (...args) {
    const key = `${this.size}/${this.type}`, entry = stats.reads[key] ??= { calls: 0, completed: 0, distinct: [] };
    entry.calls++; const identity = id(this); if (!entry.distinct.includes(identity)) entry.distinct.push(identity);
    const bytes = await read.apply(this, args); entry.completed++; return bytes;
  };
  const NativeWorker = window.Worker;
  window.Worker = class extends NativeWorker {
    postMessage(value, transfer) {
      if (value?.mode === 'presentation' || value?.mode === 'summary') stats.parsers[value.mode] = (stats.parsers[value.mode] ?? 0) + 1;
      return super.postMessage(value, transfer);
    }
  };
  const capture = (media, event) => {
    const buffered = [];
    for (let index = 0; index < Math.min(media.buffered.length, 8); index++) buffered.push([media.buffered.start(index), media.buffered.end(index)]);
    if (stats.native.length < 2000) stats.native.push({ id: id(media), event, at: Date.now(), kind: media.tagName,
      preload: media.preload, readyState: media.readyState, networkState: media.networkState,
      time: media.currentTime, duration: Number.isFinite(media.duration) ? media.duration : null, paused: media.paused, buffered });
  };
  const element = Document.prototype.createElement;
  Document.prototype.createElement = function (...args) {
    const result = element.apply(this, args);
    if (result instanceof HTMLMediaElement) for (const event of ['loadedmetadata', 'loadeddata', 'progress', 'canplay', 'suspend', 'emptied', 'play', 'pause']) result.addEventListener(event, () => capture(result, event));
    return result;
  };
  window.__mediaMemory = () => ({ ...stats, assetCount: owned.size, assetBytes: window.__assetBytes() });
}
