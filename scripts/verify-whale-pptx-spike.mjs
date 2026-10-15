import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { createPptx } from '../tests/fixtures/createPptx.mjs';
import { build } from 'vite';

const [playwrightPath, executablePath, generatorPath, suppliedFixture] = process.argv.slice(2);
const canonicalMode = suppliedFixture === '--media-canonical';
const mediaMode = suppliedFixture === '--media' || canonicalMode, fixturePath = mediaMode ? undefined : suppliedFixture;
if (!generatorPath) throw new Error('Pass Playwright, installed Whale, and bundled pptxgenjs paths.');
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const output = resolve('node_modules/.cache/pptx-spike'), extension = resolve(output, 'extension');
await mkdir(extension, { recursive: true });
await copyFile('tests/fixtures/canonicalPptxAudio.mjs',resolve(extension,'canonicalPptxAudio.mjs'));
await copyFile('tests/fixtures/pptxCandidateWorker.mjs',resolve(extension,'candidateWorker.mjs'));
await copyFile(resolve(output,'fflate/package/esm/browser.js'),resolve(extension,'fflate.mjs'));
await build({configFile:false,logLevel:'warn',build:{outDir:extension,emptyOutDir:false,lib:{entry:resolve('src/adapters/pptx/packageGuard.ts'),formats:['es'],fileName:()=> 'packageGuard.js'}}});
await build({configFile:false,logLevel:'warn',build:{outDir:extension,emptyOutDir:false,lib:{entry:resolve('src/adapters/pptx/isolatedPackage.ts'),formats:['es'],fileName:()=> 'isolatedPackage.js'}}});
await writeFile(resolve(extension,'stallWorker.js'),'self.postMessage({ready:true});self.onmessage=()=>{while(true){}};');
const candidates = [
  { id: 'aiden', version: '1.3.0', license: 'Apache-2.0 + bundled MPL-2.0 notice', archive: 'aiden0z-pptx-renderer-1.3.0.tgz', integrity: 'VEXSn2vmdgTwWaw96bhsEyZiSxlrhF5O5dONI+dSBXmg1WH2XM9O1eyY2LFQ68J1SY+iZnE5BVgFGGX6iox9Og==', file: 'aiden0z-pptx-renderer.browser.es.js' },
  { id: 'preview', version: '1.0.7', license: 'ISC registry declaration; license file absent', archive: 'pptx-preview-1.0.7.tgz', integrity: 'YByocJuyxAR4YB4Q3+VAxdLfEvA5LojG1gAJsx2Mw0QU5FJPps/2fkJOupJ6oBbA+KdWRpuAk6G6T34rKCHVxw==', file: 'pptx-preview.umd.js' },
  { id: 'office', version: '0.15.0', license: 'MIT core/preview; browser-only entry', archive: 'office-kit-pptx-preview-0.15.0.tgz', integrity: 'UkL9tW7AKM2G5HtDwglUjee9amu1laHHUohVXF8Fz7KrLpL65kcEfjSiqdNbHdqrRPQjGurkjWOZVmTsYzEdbw==', file: 'office.js' },
];
const coreArchive = await readFile(resolve(output, 'office-kit-pptx-0.24.0.tgz'));
assert.equal(createHash('sha512').update(coreArchive).digest('base64'), 'S3afT2NhbFG/FPaxZ6JaTN9Es1S/T9Vi4o1sb0FJH1D60aFa7bTzJPjVHegtsDzl/OiOcHShsaIOTLSxgcyvhQ==');
assert.equal(createHash('sha512').update(await readFile(resolve(output, 'fflate-0.8.3.tgz'))).digest('base64'), 'tbZNuJrLwGUp3zshBtdy4W+ORxZuIh8a5ilyIEQDC5rY1f3U20JMry0Ll3WBzU58EZKsEuJFXhb5gwv8CsPvgA==');
await writeFile(resolve(output, 'office-entry.js'), `export {loadPresentation,getSlides,getSlideText,getSlideNotes,findShapesWithMedia,getShapeMedia,getSlideAnimations} from '@office-kit/pptx';export {renderSlideToSvg} from '@office-kit/pptx-preview';`);
await build({ configFile: false, logLevel: 'warn', resolve: { alias: {
  '@office-kit/pptx-preview': resolve(output, 'office-preview/package/dist/index.js'),
  '@office-kit/pptx': resolve(output, 'office-core-024/package/dist/index.js'),
  'fflate': resolve(output, 'fflate/package/esm/browser.js'),
} }, build: { outDir: extension, emptyOutDir: false, minify: true, lib: { entry: resolve(output, 'office-entry.js'), formats: ['es'], fileName: () => 'office.js' } } });
for (const candidate of candidates) {
  const archive = await readFile(resolve(output, candidate.archive));
  assert.equal(createHash('sha512').update(archive).digest('base64'), candidate.integrity);
  if (candidate.id !== 'office') await copyFile(resolve(output, candidate.id, 'package/dist', candidate.file), resolve(extension, candidate.file));
  candidate.bundleBytes = (await stat(resolve(extension, candidate.file))).size;
}
if (fixturePath && (await stat(fixturePath)).size > 128 * 1024 * 1024) throw new Error('INPUT_TOO_LARGE');
let media;
const expectedMedia = {};
if(mediaMode) {
  const wav=Buffer.alloc(44+8000*4*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);
  wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);
  for(let i=0;i<8000*4;i++)wav.writeInt16LE(Math.round(1000*Math.sin(2*Math.PI*440*i/8000)),44+i*2);
  media={audio:resolve(output,'synthetic.wav'),video:resolve('node_modules/.cache/whale-video-spike/synthetic.mp4')};
  await writeFile(media.audio,wav);
  for(const kind of ['audio','video'])expectedMedia[kind]=createHash('sha256').update(await readFile(media[kind])).digest('hex');
}
const input = fixturePath ? await readFile(fixturePath) : await createPptx(generatorPath,media);
const evidence = fixturePath ? resolve(output, 'teacher-01') : canonicalMode ? resolve(output,'media-canonical') : mediaMode ? resolve(output,'media') : output;
await mkdir(evidence, { recursive: true });
if (!fixturePath) {
  await writeFile(resolve(output, 'synthetic.pptx'), input);
  await writeFile(resolve(extension, 'synthetic.pptx'), input);
}
const manifest = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
await writeFile(resolve(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'PPTX isolated spike', version: '0.0.1', background: { service_worker: 'background.js' }, content_security_policy: manifest.content_security_policy }));
await writeFile(resolve(extension, 'background.js'), 'chrome.runtime.onInstalled.addListener(() => {});');
await writeFile(resolve(extension, 'index.html'), '<!doctype html><meta charset="UTF-8"><link rel="stylesheet" href="style.css"><div id="slide"></div><script type="module" src="runner.js"></script>');
await writeFile(resolve(extension, 'style.css'), 'body{margin:0;background:#fff}#slide{width:960px;height:540px;overflow:hidden}');
await writeFile(resolve(extension, 'runner.js'), `
const id = new URL(location.href).searchParams.get('candidate');
window.run = async () => {
  let bytes = await (await fetch('synthetic.pptx')).arrayBuffer();
  if(new URL(location.href).searchParams.get('canonical')==='true') {
    const {canonicalPptxAudio}=await import('./canonicalPptxAudio.mjs'), zip=await import('./fflate.mjs');
    const result=canonicalPptxAudio(bytes,zip);bytes=result.bytes;window.canonicalEdits=result.edits;
    window.canonicalHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  const {inspectPptxXml}=await import('./packageGuard.js');
  const {readPptxPackageIsolated}=await import('./isolatedPackage.js');
  const checked=await readPptxPackageIsolated(new Uint8Array(bytes));
  window.packageSafety={entryCount:checked.entryCount,expandedBytes:checked.expandedBytes,...inspectPptxXml(checked.files)};
  window.sourceEffectCounts=Object.entries(checked.files).filter(([name])=>/^ppt\\/slides\\/slide\\d+\\.xml$/.test(name)).sort(([a],[b])=>Number(a.match(/slide(\\d+)\\.xml$/)[1])-Number(b.match(/slide(\\d+)\\.xml$/)[1])).map(([,content])=>{
    const xml=new DOMParser().parseFromString(new TextDecoder().decode(content),'application/xml');
    return [...xml.getElementsByTagNameNS('*','cTn')].filter(node=>['entr','emph','exit'].includes(node.getAttribute('presetClass'))).length;
  });
  if(id==='aiden'||id==='office') {
    window.candidateWorker=await new Promise(resolve=>{
      const worker=new Worker(new URL('./candidateWorker.mjs',location.href),{type:'module'});
      let settled=false;
      const finish=value=>{if(settled)return;settled=true;clearTimeout(timer);worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();resolve(value);};
      const timer=setTimeout(()=>finish({ok:false,code:'CANDIDATE_WORKER_TIMEOUT'}),15000);
      worker.onmessage=event=>finish(event.data);worker.onerror=()=>finish({ok:false,code:'CANDIDATE_WORKER_ERROR'});worker.onmessageerror=()=>finish({ok:false,code:'CANDIDATE_WORKER_MESSAGE_ERROR'});
      try {const copy=bytes instanceof ArrayBuffer?bytes.slice(0):bytes.slice().buffer;worker.postMessage({candidate:id,bytes:copy},[copy]);}catch{finish({ok:false,code:'CANDIDATE_WORKER_SEND_ERROR'});}
    });
    if(window.candidateWorker.ok) {
      const frames=window.candidateWorker.frames;
      window.workerSvgFrames=frames.filter(frame=>frame.svg);
      window.candidateWorker.frames=frames.map(({svg,...metadata})=>metadata);
    }
  }
  const target = document.getElementById('slide');
  if (id === 'aiden') {
    const {PptxViewer, parseZip, buildPresentation, RECOMMENDED_ZIP_LIMITS} = await import('./aiden0z-pptx-renderer.browser.es.js');
    const model = buildPresentation(await parseZip(bytes,RECOMMENDED_ZIP_LIMITS));
    window.mainModelSummary={slideCount:model.slides.length,nodeCounts:model.slides.map(slide=>slide.nodes.length),mediaCount:model.media.size,effectModel:'unverified'};
    window.mediaModel = model.slides.flatMap(slide=>slide.nodes.filter(node=>node.isAudio||node.isVideo).map(node=>({audio:!!node.isAudio,video:!!node.isVideo,reference:!!node.mediaRId})));
    window.slideCount = model.slides.length; window.renderIssues=[];
    window.viewer = new PptxViewer(target,{width:960,pdfjs:false,onNodeError:()=>window.renderIssues.push('node'),onSlideError:()=>window.renderIssues.push('slide')});
    viewer.load(model); await viewer.renderSlide(0);
    window.show = index => viewer.renderSlide(index); window.next = () => window.show(1);
  } else if (id === 'office') {
    const {loadPresentation,getSlides,getSlideText,getSlideNotes,findShapesWithMedia,getShapeMedia,getSlideAnimations,renderSlideToSvg} = await import('./office.js');
    const pres = await loadPresentation(new Uint8Array(bytes)), slides = getSlides(pres);
    window.mainModelSummary={slideCount:slides.length,animations:slides.map(slide=>getSlideAnimations(slide).map(step=>({effect:step.effect,start:step.start,durationMs:step.durationMs,delayMs:step.delayMs,playable:step.playable,sequence:step.sequence,targetCount:step.targetShapeIds.length}))),effectPlayback:'unverified'};
    window.slideCount = slides.length;
    window.notesEvidence = getSlideNotes(slides[0]);
    window.extractedMedia = slides.flatMap(slide=>findShapesWithMedia(slide).map(getShapeMedia));
    window.workerSvgDecode=[];window.svgHashMatches=[];
    for(const frame of window.workerSvgFrames) {
      const frameUrl=URL.createObjectURL(new Blob([frame.svg],{type:'image/svg+xml'})),image=new Image();
      try {image.src=frameUrl;await image.decode();window.workerSvgDecode.push({page:frame.page,width:image.naturalWidth,height:image.naturalHeight});}
      finally {image.removeAttribute('src');URL.revokeObjectURL(frameUrl);}
    }
    window.workerSvgFrames=null;
    let url;
    const show = async index => {
      window.textEvidence = getSlideText(slides[index]);
      const svg = renderSlideToSvg(pres, slides[index]);
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(svg)))].map(value=>value.toString(16).padStart(2,'0')).join('');
      window.svgHashMatches.push({page:index+1,match:window.candidateWorker.frames[index].hash===hash});
      window.svgTextEvidence = new DOMParser().parseFromString(svg, 'image/svg+xml').documentElement.textContent;
      if(url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
      const image = new Image(); image.width=960; image.height=540; image.src=url;
      await image.decode(); target.replaceChildren(image);
    };
    await show(0); window.show=show; window.next = () => show(1);
    window.viewer = {destroy(){if(url)URL.revokeObjectURL(url);target.replaceChildren();}};
  } else {
    await new Promise((done, reject) => {const script=document.createElement('script');script.src='pptx-preview.umd.js';script.onload=done;script.onerror=reject;document.head.append(script);});
    window.viewer = pptxPreview.init(target, {width:960,height:540,mode:'slide'});
    await viewer.preview(bytes); window.next = () => viewer.renderSingleSlide(1);
  }
};`);
const profile = resolve(output, `profile-${Date.now()}`);
let context;
const report = { fixture: fixturePath ? 'teacher-01: user-provided real teaching deck' : mediaMode ? 'synthetic 3 slides including WAV/MP4' : 'synthetic 2 slides, text/Korean/rectangle/PNG/table/notes', fixtureSha256: createHash('sha256').update(input).digest('hex'), profile, productIntegration: false, results: [] };
async function verifyWorkerSvg(page,result) {
  if(result.id!=='office')return;
  result.workerSvg=await page.evaluate(()=>({decoded:window.workerSvgDecode,matches:window.svgHashMatches}));
  assert.equal(result.candidateWorker.frames.length,result.mainModelSummary.slideCount);
  assert.equal(result.workerSvg.decoded.length,fixturePath?4:mediaMode?3:2);
  assert(result.workerSvg.decoded.every(image=>image.width>0&&image.height>0));
  assert(result.workerSvg.matches.every(frame=>frame.match));
  assert.equal(new Set(result.workerSvg.matches.map(frame=>frame.page)).size,result.mainModelSummary.slideCount);
}
try {
  context = await chromium.launchPersistentContext(profile, { executablePath, headless: true, ignoreDefaultArgs: true, timeout: 15000,
    args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] });
  let worker;
  for (let i = 0; i < 80 && !worker; i++) {
    for (const current of context.serviceWorkers()) {
      try { if (await current.evaluate(() => chrome.runtime.getManifest().name) === 'PPTX isolated spike') worker = current; } catch { /* Ignore built-in workers. */ }
    }
    if (!worker) await new Promise(done => setTimeout(done, 250));
  }
  assert(worker, 'Spike extension not loaded');
  const base = `chrome-extension://${new URL(worker.url()).hostname}`;
  for (const candidate of candidates) {
    if (fixturePath && candidate.id === 'preview') continue;
    const page = await context.newPage(); await page.setViewportSize({ width: 1000, height: 600 });
    const external = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', route => {
      if (route.request().url() === base + '/synthetic.pptx') return route.fulfill({status:200,contentType:'application/vnd.openxmlformats-officedocument.presentationml.presentation',body:input});
      if (route.request().url().startsWith(base + '/')) return route.continue();
      external.push(route.request().url()); return route.abort();
    });
    const result = { ...candidate, external, errors, render: 'failed', media: 'unverified', behavior: 'unverified', originalFidelity: 'unverified' };
    try {
      await page.goto(`${base}/index.html?candidate=${candidate.id}&canonical=${canonicalMode}`);
      report.environment = await page.evaluate(() => ({ userAgent: navigator.userAgent, platform: navigator.platform }));
      await page.waitForFunction(() => typeof window.run === 'function');
      if(!report.guardRegression) {
        report.guardRegression=await page.evaluate(async()=>{
          const {inspectPptxXml}=await import('./packageGuard.js');const encoder=new TextEncoder(),blocked=[];
          for(const [id,text] of [['dtd','<!DOCTYPE x [<!ENTITY e SYSTEM "https://example.invalid/private">]><x>&e;</x>'],['script','<x><script>neverRun()</script></x>'],['malformed','<x>']]) {
            try{inspectPptxXml({'x.xml':encoder.encode(text)});}catch{blocked.push(id);}
          }
          const ns='http://schemas.openxmlformats.org/package/2006/relationships';
          const rels=body=>encoder.encode('<Relationships xmlns="'+ns+'">'+body+'</Relationships>');
          const rel=(id,target,extra='')=>'<Relationship Id="'+id+'" Type="https://example.invalid/type" Target="'+target+'" '+extra+'/>';
          const external=inspectPptxXml({'_rels/.rels':rels(rel('r1','https://example.invalid/private','TargetMode="External"')+rel('r2','javascript:neverRun()','TargetMode="External"'))});
          const valid={'ppt/slides/slide1.xml':encoder.encode('<slide/>'),'ppt/media/image.png':new Uint8Array([1]),'ppt/slides/_rels/slide1.xml.rels':rels(rel('r1','../media/image.png'))};
          const internal=inspectPptxXml(valid);
          const relationshipBlocked=[];
          for(const [id,body,code] of [['escape',rel('r1','../../../outside.xml'),'PPTX_UNSAFE_TARGET'],['missing',rel('r1','../media/missing.png'),'PPTX_TARGET_MISSING_OR_FORBIDDEN'],['duplicate',rel('r1','../media/image.png')+rel('r1','../media/image.png'),'PPTX_INVALID_RELATIONSHIPS'],['mode',rel('r1','../media/image.png','TargetMode="Other"'),'PPTX_INVALID_RELATIONSHIPS']]) {
            try{inspectPptxXml({...valid,'ppt/slides/_rels/slide1.xml.rels':rels(body)});}catch(error){if(error.message===code)relationshipBlocked.push(id);}
          }
          try{inspectPptxXml({'_rels/.rels':encoder.encode('<Relationships/>')});}catch(error){if(error.message==='PPTX_INVALID_RELATIONSHIPS')relationshipBlocked.push('namespace');}
          try{inspectPptxXml({...valid,'ppt/slides/_rels/slide1.xml.rels':rels('<Relationship Id="r1" Type="https://example.invalid/type" Target="../media/image.png">'+rel('r2','../../../outside.xml')+'</Relationship>')});}catch(error){if(error.message==='PPTX_INVALID_RELATIONSHIPS')relationshipBlocked.push('nested');}
          const contentNamespace='http://schemas.openxmlformats.org/package/2006/content-types';
          const mainType='application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml';
          const types=body=>encoder.encode('<Types xmlns="'+contentNamespace+'">'+body+'</Types>');
          const declarations='<Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="'+mainType+'"/>';
          const typed={'[Content_Types].xml':types(declarations),'ppt/presentation.xml':encoder.encode('<presentation/>'),'ppt/media/image.png':new Uint8Array([137,80,78,71,13,10,26,10])};
          const typeSummary=inspectPptxXml(typed).typeSummary,contentBlocked=[];
          for(const [id,input,code] of [
            ['duplicate',{...typed,'[Content_Types].xml':types(declarations+'<Default Extension="PNG" ContentType="image/png"/>')},'PPTX_INVALID_CONTENT_TYPES'],
            ['missing',{...typed,'ppt/data.bin':new Uint8Array([1])},'PPTX_CONTENT_TYPE_MISSING'],
            ['header',{...typed,'ppt/media/image.png':new Uint8Array([1])},'PPTX_MEDIA_HEADER_MISMATCH'],
            ['macro',{...typed,'[Content_Types].xml':types(declarations+'<Default Extension="bin" ContentType="application/vnd.ms-office.vbaProject"/>')},'PPTX_ACTIVE_CONTENT'],
            ['namespace',{...typed,'[Content_Types].xml':encoder.encode('<Types/>')},'PPTX_INVALID_CONTENT_TYPES'],
          ]) {try{inspectPptxXml(input);}catch(error){if(error.message===code)contentBlocked.push(id);}}
          return {blocked,externalCount:external.externalRelationships,unsafeExternalCount:external.unsafeExternalRelationships,internalCount:internal.internalRelationships,relationshipBlocked,typeSummary,contentBlocked};
        });
        assert.deepEqual(report.guardRegression.blocked,['dtd','script','malformed']);assert.equal(report.guardRegression.externalCount,2);
        assert.equal(report.guardRegression.unsafeExternalCount,1);assert.equal(report.guardRegression.internalCount,1);
        assert.deepEqual(report.guardRegression.relationshipBlocked,['escape','missing','duplicate','mode','namespace','nested']);
        assert.deepEqual(report.guardRegression.typeSummary,{typedParts:2,checkedMediaHeaders:1,uncheckedMediaParts:0,orphanOverrides:0});
        assert.deepEqual(report.guardRegression.contentBlocked,['duplicate','missing','header','macro','namespace']);
      }
      if(!report.workerRegression) {
        report.workerRegression=await page.evaluate(async()=>{
          const {readPptxPackageIsolated}=await import('./isolatedPackage.js');
          async function stallWorker(){
            const worker=new Worker(new URL('./stallWorker.js',location.href),{type:'module'});
            await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(new Error('STALL_WORKER_START_TIMEOUT'));},5000);worker.onmessage=()=>{clearTimeout(timer);resolve();};worker.onerror=()=>{clearTimeout(timer);worker.terminate();reject(new Error('STALL_WORKER_START_ERROR'));};});
            return worker;
          }
          let ticks=0;const interval=setInterval(()=>ticks++,10),outcomes=[];
          try {
            const timeoutWorker=await stallWorker();
            try{await readPptxPackageIsolated(new Uint8Array([1]),{timeoutMs:100,workerFactory:()=>timeoutWorker});}catch(error){outcomes.push(error.message);}
            const cancelWorker=await stallWorker(),controller=new AbortController();
            const job=readPptxPackageIsolated(new Uint8Array([1]),{signal:controller.signal,workerFactory:()=>cancelWorker});
            setTimeout(()=>controller.abort(),50);
            try{await job;}catch(error){outcomes.push(error.name);}
            const bytes=new Uint8Array(await(await fetch('synthetic.pptx')).arrayBuffer()),before=await crypto.subtle.digest('SHA-256',bytes);
            const normal=await readPptxPackageIsolated(bytes),after=await crypto.subtle.digest('SHA-256',bytes);
            try{await readPptxPackageIsolated(new TextEncoder().encode('invalid zip'));}catch(error){outcomes.push(error.message);}
            return {outcomes,ticks,entryCount:normal.entryCount,originalIntact:bytes.byteLength>0&&[...new Uint8Array(before)].every((value,index)=>value===new Uint8Array(after)[index]),timeoutClean:timeoutWorker.onmessage===null&&timeoutWorker.onerror===null,cancelClean:cancelWorker.onmessage===null&&cancelWorker.onerror===null};
          } finally {clearInterval(interval);}
        });
        assert.deepEqual(report.workerRegression.outcomes,['PPTX_ZIP_TIMEOUT','AbortError','PPTX_INVALID_PACKAGE']);
        assert(report.workerRegression.ticks>=5);assert(report.workerRegression.originalIntact);assert(report.workerRegression.timeoutClean);assert(report.workerRegression.cancelClean);
      }
      const started = Date.now(); await page.evaluate(() => window.run());
      result.packageSafety=await page.evaluate(()=>window.packageSafety);
      if(candidate.id==='aiden'||candidate.id==='office') {
        result.candidateWorker=await page.evaluate(()=>window.candidateWorker);
        result.mainModelSummary=await page.evaluate(()=>window.mainModelSummary);
        if(candidate.id==='office') assert.equal(result.candidateWorker.ok,true);
        if(candidate.id==='office') {
          result.sourceEffectCounts=await page.evaluate(()=>window.sourceEffectCounts);
          assert.deepEqual(result.mainModelSummary.animations.map(steps=>steps.length),result.sourceEffectCounts);
          if(fixturePath)assert.deepEqual(result.sourceEffectCounts.map((count,index)=>({page:index+1,count})).filter(item=>item.count),[{page:3,count:6},{page:9,count:1},{page:12,count:2},{page:19,count:3}]);
        }
        if(result.candidateWorker.ok) {
          assert.equal(result.candidateWorker.domAvailable,false);assert.equal(result.candidateWorker.domParserAvailable,false);
          assert.deepEqual(result.candidateWorker.summary,result.mainModelSummary);
          result.workerModelMatch=true;
        } else result.workerModelMatch=false;
      }
      if(canonicalMode) {
        result.canonicalEdits=await page.evaluate(()=>window.canonicalEdits);
        result.canonicalHash=await page.evaluate(()=>window.canonicalHash);
        assert.equal(result.canonicalEdits,1);
      }
      if (fixturePath) {
        result.slideCount=await page.evaluate(() => window.slideCount);
        assert.equal(result.slideCount,23);
        result.pages=[];
        for(let index=0;index<result.slideCount;index++) {
          await page.evaluate(index => window.show(index),index);
          await page.evaluate(() => Promise.all([...document.querySelectorAll('#slide img')].map(image => image.decode())));
          result.pages.push(await page.evaluate(() => ({images:document.querySelectorAll('#slide img').length,visibleNodes:document.querySelectorAll('#slide *').length})));
          await page.screenshot({path:resolve(evidence,`${candidate.id}-${index+1}.png`)});
        }
        result.elapsedMs=Date.now()-started;
        result.renderIssues=await page.evaluate(() => window.renderIssues ?? []);
        result.render='pass: 23 page render calls/image decode, screenshots; original fidelity unverified';
        await verifyWorkerSvg(page,result);
        await page.evaluate(() => window.viewer.destroy());
        await page.close(); report.results.push(result); continue;
      }
      if (candidate.id === 'office') {
        assert.equal(await page.evaluate(() => window.slideCount), mediaMode ? 3 : 2);
        const text = await page.evaluate(() => window.textEvidence);
        assert(text.includes('Synthetic lesson A') && text.includes('한글 수업 자료'));
      } else {
        await page.getByText('Synthetic lesson A', { exact: true }).waitFor({ timeout: 15000 });
        assert((await page.locator('#slide').textContent()).includes('한글 수업 자료'));
      }
      result.firstRenderMs = Date.now() - started;
      await page.waitForFunction(() => [...document.querySelectorAll('#slide img')].some(image => image.complete && image.naturalWidth > 0));
      result.images = await page.evaluate(() => [...document.querySelectorAll('#slide img')].map(image => ({ width:image.naturalWidth, height:image.naturalHeight })));
      if (candidate.id === 'office') {
        result.notesExtracted = (await page.evaluate(() => window.notesEvidence))?.includes('Synthetic private teacher note.');
        assert(result.notesExtracted);
        try {
          result.pixels = await page.evaluate(() => {
            const canvas = document.createElement('canvas'); canvas.width=960; canvas.height=540;
            const ctx=canvas.getContext('2d'); ctx.drawImage(document.querySelector('#slide img'),0,0,960,540);
            return { green:[...ctx.getImageData(100,230,1,1).data], red:[...ctx.getImageData(350,230,1,1).data] };
          });
          assert(result.pixels.green[1] > 100 && result.pixels.green[0] < 50);
          assert(result.pixels.red[0] > 200 && result.pixels.red[1] < 30);
        } catch (error) {
          if (!String(error).includes('SecurityError')) throw error;
          result.pixelReadback = 'blocked: SVG foreignObject taints Canvas; screenshot inspection remains separate';
        }
      }
      await page.screenshot({ path: resolve(output, `${candidate.id}-slide1.png`) });
      await page.evaluate(() => window.next());
      if (candidate.id !== 'office') await page.getByText('Synthetic lesson B', { exact: true }).waitFor();
      const text = candidate.id === 'office' ? await page.evaluate(() => window.svgTextEvidence) : await page.locator('#slide').textContent();
      result.secondSlideText = text;
      await page.screenshot({ path: resolve(output, `${candidate.id}-slide2.png`) });
      assert(text.includes('Synthetic lesson B') && text.includes('Sample') && text.includes('42'));
      if(mediaMode) {
        await page.evaluate(()=>window.show(2));
        result.rendererMediaElements=await page.locator('#slide audio,#slide video').count();
        result.mediaModel=await page.evaluate(()=>window.mediaModel ?? []);
        if(canonicalMode && candidate.id==='aiden') {
          assert.equal(result.mediaModel.filter(ref=>ref.audio).length,1);
          assert.equal(result.mediaModel.filter(ref=>ref.video).length,1);
        }
        if(candidate.id==='aiden') {
          result.rendererPlayback=await page.evaluate(async()=>{
            const elements=[...document.querySelectorAll('#slide audio,#slide video')],results=[];
            for(const element of elements) {
              element.muted=true;
              try{await element.play();await new Promise(done=>setTimeout(done,650));results.push({tag:element.tagName,duration:element.duration,time:element.currentTime,width:element.videoWidth??null,height:element.videoHeight??null});}
              catch{results.push({tag:element.tagName,error:'native play failed'});}
              finally{element.pause();}
            }
            return results;
          });
          assert.equal(result.rendererPlayback.length,2);
          for(const playback of result.rendererPlayback)assert(playback.time>.3 && playback.duration>1);
          result.media=canonicalMode ? 'partial experimental: canonical audio/video native muted playback' : 'partial experimental: native muted playback; WAV classified as video';
        }
        await page.screenshot({path:resolve(evidence,`${candidate.id}-media.png`)});
        if(candidate.id==='office') {
          result.extracted=await page.evaluate(async()=>Promise.all(window.extractedMedia.map(async ref=>({kind:ref.kind,contentType:ref.contentType,bytes:ref.bytes?.length,hash:ref.bytes ? [...new Uint8Array(await crypto.subtle.digest('SHA-256',ref.bytes))].map(n=>n.toString(16).padStart(2,'0')).join('') : null}))));
          assert.equal(result.extracted.length,2);
          for(const ref of result.extracted) {
            const expectedKind=ref.contentType.startsWith('audio/')?'audio':'video';
            assert.equal(ref.hash,expectedMedia[expectedKind]);
            ref.kindMismatch=expectedKind!==ref.kind;
            if(canonicalMode)assert.equal(ref.kindMismatch,false);
          }
          result.hostPlayback=await page.evaluate(async()=>{
            const evidence=[];
            for(const ref of window.extractedMedia) {
              const kind=ref.contentType.startsWith('audio/')?'audio':'video';
              const element=document.createElement(kind),url=URL.createObjectURL(new Blob([ref.bytes],{type:ref.contentType}));
              element.muted=true;element.src=url;document.body.append(element);
              try {
                await element.play();await new Promise(done=>setTimeout(done,650));
                evidence.push({kind,duration:element.duration,time:element.currentTime,paused:element.paused,width:element.videoWidth??null,height:element.videoHeight??null});
              } finally {element.pause();element.removeAttribute('src');element.load();element.remove();URL.revokeObjectURL(url);}
            }
            return evidence;
          });
          for(const playback of result.hostPlayback)assert(playback.time>.3 && !playback.paused && playback.duration>1);
          result.media='partial experimental: exact extraction + independent muted host playback; renderer playback separate';
        }
      }
      await verifyWorkerSvg(page,result);
      await page.evaluate(() => window.viewer.destroy());
      result.render = 'pass: synthetic text/Korean/image/table and page navigation';
    } catch (error) { result.failure = String(error); }
    await page.close(); report.results.push(result);
  }
  if(canonicalMode) {
    const hashes=report.results.filter(result=>result.canonicalHash).map(result=>result.canonicalHash);
    assert.equal(hashes.length,2); assert.equal(new Set(hashes).size,1);
  }
} finally {
  if (context) await context.close();
  if(fixturePath) report.originalUnchanged=createHash('sha256').update(await readFile(fixturePath)).digest('hex') === report.fixtureSha256;
  await writeFile(resolve(evidence, 'result.json'), JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report));
