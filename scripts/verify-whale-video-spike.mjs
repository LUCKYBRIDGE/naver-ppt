import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const { chromium } = await import(pathToFileURL(resolve(process.argv[2])).href);
const executablePath = process.argv[3], output = resolve('node_modules/.cache/whale-video-spike');
await mkdir(output, { recursive: true });
const profile = resolve(output, `profile-${Date.now()}`), extension = resolve('dist');
const context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true,
  args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
try {
  let worker; const deadline = Date.now() + 15000;
  while (!worker && Date.now() < deadline) {
    for (const candidate of context.serviceWorkers()) if (await candidate.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = candidate;
    if (!worker) await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(worker); const page = await context.newPage(); await page.goto(await worker.evaluate(() => chrome.runtime.getURL('launcher/index.html')));
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
    const ctx = canvas.getContext('2d'), stream = canvas.captureStream(20);
    const mime = ['video/mp4;codecs=avc1.42001E', 'video/webm;codecs=vp8'].find(type => MediaRecorder.isTypeSupported(type));
    if (!mime) throw new Error('No supported native recording codec');
    const recorder = new MediaRecorder(stream, { mimeType: mime }), chunks = [];
    const done = new Promise((resolve, reject) => { recorder.ondataavailable = event => chunks.push(event.data); recorder.onstop = resolve; recorder.onerror = reject; });
    let frame = 0;
    const draw = () => { ctx.fillStyle = frame++ % 2 ? '#e52535' : '#20b358'; ctx.fillRect(0, 0, 320, 180); ctx.fillStyle = '#fff'; ctx.fillRect(100, 50, 120, 80); };
    draw(); recorder.start(); const timer = setInterval(draw, 100);
    await new Promise(resolve => setTimeout(resolve, 2200)); clearInterval(timer); recorder.stop(); await done; stream.getTracks().forEach(track => track.stop());
    const blob = new Blob(chunks, { type: mime }), url = URL.createObjectURL(blob), video = document.createElement('video');
    video.muted = true; video.src = url;
    await new Promise((resolve, reject) => { video.onloadedmetadata = resolve; video.onerror = reject; video.load(); });
    const originalDuration = Number.isFinite(video.duration) ? video.duration : String(video.duration);
    if (!Number.isFinite(video.duration)) await new Promise((resolve, reject) => { const timeout = setTimeout(() => reject(new Error('Native duration discovery timeout')), 5000);
      video.onseeked = () => { clearTimeout(timeout); resolve(); }; video.currentTime = 86401; });
    const discoveredDuration = Number.isFinite(video.duration) ? video.duration : String(video.duration);
    video.onseeked = null; video.currentTime = 0; await video.play(); await new Promise(resolve => setTimeout(resolve, 300));
    ctx.drawImage(video, 0, 0); const center = [...ctx.getImageData(160, 90, 1, 1).data], corner = [...ctx.getImageData(10, 10, 1, 1).data];
    video.pause(); video.removeAttribute('src'); video.load(); URL.revokeObjectURL(url);
    return { mime, originalDuration, discoveredDuration, center, corner, bytes: [...new Uint8Array(await blob.arrayBuffer())], userAgent: navigator.userAgent };
  });
  const { bytes, ...metadata } = result; assert(bytes.length > 100); assert(result.center[0] > 220 && result.center[1] > 220 && result.center[2] > 220);
  const path = resolve(output, result.mime.startsWith('video/mp4') ? 'synthetic.mp4' : 'synthetic.webm'); await writeFile(path, new Uint8Array(bytes));
  await writeFile(resolve(output, 'metadata.json'), JSON.stringify(metadata, null, 2));
  console.log(JSON.stringify({ result: 'PASS', test: 'Actual Whale native Canvas/MediaRecorder video encode/decode/pixel and duration discovery', ...metadata, path, profile,
    limitation: 'Synthetic native fixture only; not product registration/Player/Remote/trim/focus acceptance.' }));
} finally { await context.close(); }
