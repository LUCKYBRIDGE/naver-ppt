import assert from 'node:assert/strict';
import { cp, mkdir, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { createPptx } from '../tests/fixtures/createPptx.mjs';

const [playwrightPath, executablePath, generatorPath] = process.argv.slice(2);
assert(generatorPath, 'Pass Playwright, Whale and bundled PptxGenJS paths.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const output = resolve('node_modules/.cache/whale-pptx-background', String(Date.now())), extension = resolve(output, 'extension'), profile = resolve(output, 'profile');
await mkdir(extension, { recursive: true }); await cp('dist', extension, { recursive: true });
const modelWorker = (await readdir(resolve(extension, 'assets'))).find(name => /^modelWorker-[\w-]+\.js$/.test(name)); assert(modelWorker);
await writeFile(resolve(extension, 'background.html'), '<!doctype html><meta charset="utf-8"><title>Synthetic background verification</title>');
const seed = unzipSync(await createPptx(generatorPath)), themePart = 'ppt/theme/theme1.xml';
const solid = color => `<a:solidFill><a:srgbClr val="${color}"/></a:solidFill>`;
let theme = strFromU8(seed[themePart]);
for (const [tag, body] of [['fillStyleLst', solid('112233') + solid('445566')], ['bgFillStyleLst', solid('AABBCC') + solid('010203') + '<a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="FF0000"/></a:gs><a:gs pos="100000"><a:srgbClr val="00FF00"/></a:gs></a:gsLst><a:lin ang="5400000" scaled="0"/></a:gradFill>']]) {
  const regex = new RegExp(`<a:${tag}>[\\s\\S]*?<\\/a:${tag}>`); assert(regex.test(theme)); theme = theme.replace(regex, `<a:${tag}>${body}</a:${tag}>`);
}
seed[themePart] = strToU8(theme);
const cases = [[0, 'none'], [1000, 'none'], [1, 'solid', '#112233'], [2, 'solid', '#445566'], [1001, 'solid', '#AABBCC'], [1002, 'solid', '#010203'], [1003, 'gradient'], [3, 'error'], [999, 'error'], [1004, 'error']];
let context; const report = { productDistWorker: true, rows: [], externalRequests: 0, pageErrors: [] };
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  await context.route(/^https?:/, route => { report.externalRequests++; return route.abort(); });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) { for (const w of context.serviceWorkers()) if (await w.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'Whale Class Presenter') worker = w; if (!worker) await new Promise(r => setTimeout(r, 250)); }
  assert(worker); const page = await context.newPage(); page.on('pageerror', e => report.pageErrors.push(e.message));
  await page.goto(`chrome-extension://${new URL(worker.url()).hostname}/background.html`);
  for (const [index, expectedType, expectedColor] of cases) {
    const files = { ...seed }, original = strFromU8(files['ppt/slides/slide1.xml']);
    const regex = /<p:bg>[\s\S]*?<\/p:bg>/; assert(regex.test(original));
    files['ppt/slides/slide1.xml'] = strToU8(original.replace(regex, `<p:bg><p:bgRef idx="${index}"><a:srgbClr val="FFFFFF"/></p:bgRef></p:bg>`));
    const bytes = zipSync(files); await writeFile(resolve(output, `synthetic-${index}.pptx`), bytes);
    const result = await page.evaluate(({ bytes, modelWorker }) => new Promise((resolve, reject) => {
      const parser = new Worker(`./assets/${modelWorker}`, { type: 'module' });
      const finish = callback => value => { clearTimeout(timer); parser.terminate(); callback(value); };
      const timer = setTimeout(finish(reject), 15000, Error('MODEL_TIMEOUT'));
      parser.onerror = finish(reject);
      let sent = false;
      parser.onmessage = event => {
        const value = event.data;
        if (value.ready === true && !sent) { sent = true; const input = new Uint8Array(bytes).buffer; parser.postMessage({ id: 1, bytes: input, mode: 'presentation' }, [input]); return; }
        if (sent && value.id === 1) finish(resolve)(value.ok ? { ok: true, background: value.presentation.slides[0].background } : { ok: false, code: value.code });
      };
    }), { bytes: [...bytes], modelWorker });
    report.rows.push({ index, expectedType, ...result });
    if (expectedType === 'error') assert.equal(result.ok, false); else {
      assert.equal(result.ok, true); assert.equal(result.background?.type, expectedType);
      if (expectedColor) {
        const channels = result.background.color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i); assert(channels);
        assert.deepEqual(channels.slice(1).map(Number), expectedColor.slice(1).match(/../g).map(channel => parseInt(channel, 16)));
      }
    }
  }
  assert.equal(report.externalRequests, 0); assert.deepEqual(report.pageErrors, []); report.passed = true; report.environment = await page.evaluate(() => navigator.userAgent);
} catch (error) { report.failure = error.stack; throw error; }
finally { await writeFile(resolve(output, 'result.json'), JSON.stringify(report, null, 2)); await context?.close(); console.log(JSON.stringify({ output, ...report })); }
