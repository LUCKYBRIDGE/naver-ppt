import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { build } from 'vite';
import { createPptx } from '../tests/fixtures/createPptx.mjs';

const [playwrightPath, executablePath, suppliedFixture, generatorPath] = process.argv.slice(2);
if (!suppliedFixture) throw new Error('Pass Playwright, Whale and a local teacher-01 PPTX or --media.');
const mediaMode=suppliedFixture==='--media';
const effectsMode=suppliedFixture==='--effects';
if(effectsMode&&!generatorPath)throw Error('Pass the bundled PptxGenJS path after --effects.');
const cache = resolve('node_modules/.cache/pptx-spike'), output = resolve('node_modules/.cache/webppt-spike',mediaMode?'media':effectsMode?'effects':'.'), extension = resolve(output, 'extension');
const fixturePath=mediaMode?resolve(cache,'synthetic.pptx'):effectsMode?resolve(output,'synthetic.pptx'):suppliedFixture;
const versions = [
  ['web-ppt-core-0.4.5.tgz', 'c5iDtEKJDoVjNegErQb7v6I8khCk98bmEGBbulvyERA5JsFIK0KTncrUzcrBitUq1zjacrgGZ5e0uIqcqZj5vA=='],
  ['web-ppt-viewer-core-0.4.5.tgz', 'NS7twtysrcKcCQYaDpMRbzwMxp6Y7HxXm7D2/bBBYb0mBHV0WeSHP6VHbZ3oUhtRrNenua4BqpaBxmwBgTU+3Q=='],
];
for (const [name, integrity] of versions) assert.equal(createHash('sha512').update(await readFile(resolve(cache, name))).digest('base64'), integrity);
await mkdir(extension, { recursive: true });
if(effectsMode)await writeFile(fixturePath,await createPptx(generatorPath));
await writeFile(resolve(output, 'entry.js'), `export {parse,parseInWorker,renderSlideToSvg} from '@web-ppt/core';export {PresentationState,playGroup} from '@web-ppt/viewer-core';export {inspectPptxXml} from '${resolve('src/adapters/pptx/packageGuard.ts').replaceAll('\\', '/')}';export {readPptxPackageIsolated} from '${resolve('src/adapters/pptx/isolatedPackage.ts').replaceAll('\\', '/')}';export {parseDisplaySvg} from '${resolve('src/adapters/pptx/svgBoundary.ts').replaceAll('\\', '/')}';export {PptxAnimationRuns} from '${resolve('src/adapters/pptx/animationRun.ts').replaceAll('\\', '/')}';export {validatePptxMediaReference} from '${resolve('src/adapters/pptx/mediaReference.ts').replaceAll('\\', '/')}';export {readMediaInput} from '${resolve('src/media/input.ts').replaceAll('\\', '/')}';export {canonicalPptxAudio} from '${resolve('tests/fixtures/canonicalPptxAudio.mjs').replaceAll('\\', '/')}';export {unzipSync,zipSync} from 'fflate';`);
await writeFile(resolve(output,'entry.js'),(await readFile(resolve(output,'entry.js'),'utf8'))+`export {capturePptxAnimationPose,applyPptxAnimationPose} from '${resolve('src/adapters/pptx/animationSnapshot.ts').replaceAll('\\','/')}';export {addSyntheticPptxEffects} from '${resolve('tests/fixtures/pptxEffects.mjs').replaceAll('\\','/')}';`);
await writeFile(resolve(output,'entry.js'),(await readFile(resolve(output,'entry.js'),'utf8'))+`export {bindPptxRotations,playPptxRotationGroup} from '${resolve('src/adapters/pptx/rotationBehavior.ts').replaceAll('\\','/')}';`);
await writeFile(resolve(output,'entry.js'),(await readFile(resolve(output,'entry.js'),'utf8'))+`export {bindPptxScales,playPptxScaleGroup} from '${resolve('src/adapters/pptx/scaleBehavior.ts').replaceAll('\\','/')}';`);
await writeFile(resolve(output,'entry.js'),(await readFile(resolve(output,'entry.js'),'utf8'))+`export {playPptxRepeatedGroup} from '${resolve('src/adapters/pptx/repeatTiming.ts').replaceAll('\\','/')}';export {probePptxRepeats} from '${resolve('tests/fixtures/pptxRepeatProbe.mjs').replaceAll('\\','/')}';`);
await writeFile(resolve(output,'entry.js'),(await readFile(resolve(output,'entry.js'),'utf8'))+`export {PptxDurablePlayback} from '${resolve('src/adapters/pptx/durablePlayback.ts').replaceAll('\\','/')}';export {probePptxDurable} from '${resolve('tests/fixtures/pptxDurableProbe.mjs').replaceAll('\\','/')}';export {IndexedDbSessionRepository} from '${resolve('src/storage/indexedDbSessionRepository.ts').replaceAll('\\','/')}';export {SessionHub} from '${resolve('src/background/sessionHub.ts').replaceAll('\\','/')}';export {createSession} from '${resolve('src/core/session.ts').replaceAll('\\','/')}';export {toPlayerSnapshot} from '${resolve('src/core/playerSnapshot.ts').replaceAll('\\','/')}';`);
await build({ configFile: false, base: './', logLevel: 'warn', resolve: { alias: {
  '@web-ppt/core': resolve(cache, 'webppt-core/package/dist/core.js'),
  '@web-ppt/viewer-core': resolve(cache, 'webppt-viewer/package/dist/viewer-core.js'),
  fflate: resolve(cache, 'fflate/package/esm/browser.js'),
} }, build: { outDir: extension, emptyOutDir: false, lib: { entry: resolve(output, 'entry.js'), formats: ['es'], fileName: () => 'webppt.js' } } });
await writeFile(resolve(output,'worker-entry.js'), `import '${resolve(cache,'webppt-core/package/dist/worker.js').replaceAll('\\','/')}';import {inspectPptxWorkerEnvelope} from '${resolve('src/adapters/pptx/workerEnvelope.ts').replaceAll('\\','/')}';
const send=self.postMessage.bind(self),parser=self.onmessage,environment={domAvailable:typeof document!=='undefined',domParserAvailable:typeof DOMParser!=='undefined'};
self.postMessage=(result,transfer)=>{try{if(result.ok===true){const summary=inspectPptxWorkerEnvelope(result);send({...result,workerBoundary:{...environment,...summary}},transfer);}else send({id:result.id,ok:false,error:'PPTX_CANDIDATE_FAILED',workerBoundary:environment});}catch{send({id:result?.id,ok:false,error:'PPTX_INVALID_PARSER_RESULT',workerBoundary:environment});}};
self.onmessage=event=>{const data=event.data;if(!Number.isSafeInteger(data?.id)||data.id<=0||!(data.bytes instanceof ArrayBuffer)||!data.bytes.byteLength||data.bytes.byteLength>128*1024*1024){send({id:data?.id,ok:false,error:'PPTX_INPUT_LIMIT',workerBoundary:environment});return;}try{parser(event);}catch{send({id:data.id,ok:false,error:'PPTX_CANDIDATE_FAILED',workerBoundary:environment});}};`);
await build({configFile:false,base:'./',logLevel:'warn',resolve:{alias:{fflate:resolve(cache,'fflate/package/esm/browser.js')}},build:{outDir:extension,emptyOutDir:false,rolldownOptions:{treeshake:false},lib:{entry:resolve(output,'worker-entry.js'),formats:['es'],fileName:()=> 'candidate-worker.js'}}});
assert.equal(((await readFile(resolve(extension,'candidate-worker.js'),'utf8')).match(/self\.onmessage\s*=/g)??[]).length,2);
await writeFile(resolve(extension,'stall-parser.js'), "self.onmessage=()=>{self.postMessage({stallReady:true});while(true){}};");
await writeFile(resolve(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'web-ppt isolated spike', version: '0.0.1', background: { service_worker: 'background.js', type: 'module' }, content_security_policy: { extension_pages: "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'self'" } }));
await writeFile(resolve(extension, 'background.js'), 'chrome.runtime.onInstalled.addListener(()=>{});');
await writeFile(resolve(extension, 'index.html'), '<!doctype html><html><head><meta charset="utf-8"><title>Local engine comparison</title></head><body style="margin:0"><div id="host"></div><script type="module" src="runner.js"></script></body></html>');
await writeFile(resolve(extension, 'runner.js'), `
import {parse,parseInWorker,renderSlideToSvg,PresentationState,playGroup,readPptxPackageIsolated,inspectPptxXml,parseDisplaySvg,PptxAnimationRuns,validatePptxMediaReference,readMediaInput,canonicalPptxAudio,unzipSync,zipSync} from './webppt.js';
import {capturePptxAnimationPose,applyPptxAnimationPose,addSyntheticPptxEffects} from './webppt.js';
import {bindPptxRotations,playPptxRotationGroup} from './webppt.js';
import {bindPptxScales,playPptxScaleGroup} from './webppt.js';
import {playPptxRepeatedGroup,probePptxRepeats} from './webppt.js';
import {PptxDurablePlayback,probePptxDurable,IndexedDbSessionRepository,SessionHub,createSession,toPlayerSnapshot} from './webppt.js';
const ownedUrls=new Set(),ownedBlobs=new Map(),mediaPlayers=new Set(),originalCreate=URL.createObjectURL.bind(URL);
URL.createObjectURL=blob=>{const url=originalCreate(blob);ownedUrls.add(url);ownedBlobs.set(url,blob);return url;};
const stopMedia=()=>{for(const player of mediaPlayers)player.pause();};
const shadow=document.getElementById('host').attachShadow({mode:'open'}),target=document.createElement('div');
target.style.cssText='width:960px;height:540px;overflow:hidden;position:relative';shadow.append(target);
let state,pres,phase='input',commits=0;
const runs=new PptxAnimationRuns(target);
window.workerEvidence=[];
const parseWorker=async(bytes,{url='candidate-worker.js',timeoutMs=15000,signal,onReady}={})=>{
  if(signal?.aborted)throw Error('PPTX_PARSE_CANCELLED');const worker=new Worker(url,{type:'module'});let timer,abort,abandoned=false;const listeners=new Map();
  const port={postMessage:worker.postMessage.bind(worker),addEventListener(type,listener){listeners.set(listener,type);worker.addEventListener(type,listener);},removeEventListener(type,listener){listeners.delete(listener);worker.removeEventListener(type,listener);}};
  const termination={reason:null,terminated:false};window.workerEvidence.push(termination);
  worker.onmessage=event=>{if(event.data.workerBoundary)termination.boundary=event.data.workerBoundary;if(event.data.ok===false&&/^PPTX_[A-Z_]+$/.test(event.data.error??''))termination.workerCode=event.data.error;if(event.data.stallReady)onReady?.();};
  try{const failure=new Promise((resolve,reject)=>{timer=setTimeout(()=>reject(Error('PPTX_PARSE_TIMEOUT')),timeoutMs);abort=()=>reject(Error('PPTX_PARSE_CANCELLED'));worker.onerror=()=>reject(Error('PPTX_PARSE_WORKER_ERROR'));worker.onmessageerror=()=>reject(Error('PPTX_PARSE_WORKER_MESSAGE_ERROR'));signal?.addEventListener('abort',abort,{once:true});});
    const pending=parseInWorker(port,bytes);pending.then(model=>{if(abandoned)model.dispose?.();},()=>{});
    const model=await Promise.race([pending,failure]);termination.reason='success';return model;
  }catch(error){abandoned=true;const code=['PPTX_PARSE_TIMEOUT','PPTX_PARSE_CANCELLED','PPTX_PARSE_WORKER_ERROR','PPTX_PARSE_WORKER_MESSAGE_ERROR'].includes(error.message)?error.message:'PPTX_PARSE_FAILED';termination.reason=code;throw Error(code);}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);termination.listenersRemoved=listeners.size;for(const [listener,type]of listeners)worker.removeEventListener(type,listener);listeners.clear();worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();termination.terminated=true;}
};
const visible=()=>{for(const node of target.querySelectorAll('[data-el]'))node.style.visibility=state.hiddenElementIds.has(Number(node.getAttribute('data-el')))?'hidden':'';};
const domHidden=()=>[...target.querySelectorAll('[data-el]')].filter(node=>getComputedStyle(node).visibility==='hidden').length;
const hiddenRoots=()=>[...state.hiddenElementIds].filter(id=>{const node=target.querySelector('[data-el="'+id+'"]');return node&&[node,...node.querySelectorAll('*')].every(child=>getComputedStyle(child).visibility==='hidden');}).length;
const paint=()=>{const svg=parseDisplaySvg(renderSlideToSvg(pres,state.slide,{includeNotes:false,showComments:false,textMode:'html',media:'badge'}),ownedUrls);svg.style.width='100%';svg.style.height='100%';target.replaceChildren(svg);visible();};
window.run=async()=>{
  let bytes=new Uint8Array(await(await fetch('input.pptx')).arrayBuffer());
  if(${mediaMode}){const canonical=canonicalPptxAudio(bytes,{unzipSync,zipSync});bytes=canonical.bytes;window.canonicalEdits=canonical.edits;window.canonicalHash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');}
  if(${effectsMode}){const fixture=addSyntheticPptxEffects(bytes,{unzipSync,zipSync});bytes=fixture.bytes;window.effectsSpec={targets:fixture.targets,source:fixture.source,variantSha256:[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('')};}
  phase='guard';const checked=await readPptxPackageIsolated(bytes);window.safety={entryCount:checked.entryCount,...inspectPptxXml(checked.files)};
  const summarize=model=>model.slides.map(slide=>({elements:slide.elements.length,animations:(slide.animations??[]).map(step=>({effect:step.effect,trigger:step.trigger,kind:step.kind,durationMs:step.durationMs,delayMs:step.delayMs}))}));
  const assetsSince=async before=>{const assets=[];for(const [url,blob]of ownedBlobs){if(before.has(url))continue;const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer()))].map(n=>n.toString(16).padStart(2,'0')).join('');assets.push({mime:blob.type,bytes:blob.size,hash});}return assets.sort((a,b)=>a.hash.localeCompare(b.hash));};
  phase='main-parse';const main=await parse(bytes),mainSummary=summarize(main),mainAssets=await assetsSince(new Set());main.dispose?.();
  const beforeWorker=new Set(ownedBlobs.keys());phase='worker-parse';pres=await parseWorker(bytes);const workerAssets=await assetsSince(beforeWorker);window.assetComparison={main:mainAssets,worker:workerAssets};
  const documents=new Map([['A',pres],['B',await parseWorker(bytes)]]);let documentId='A';state=new PresentationState(pres,{animate:true,autoAdvance:false});window.count=state.count;
  const rotationBindings=new Map(),scaleBindings=new Map();let sourceXml;
  if(${effectsMode}){sourceXml=new TextDecoder('utf-8',{fatal:true}).decode(checked.files['ppt/slides/slide1.xml']);for(const document of documents.values()){rotationBindings.set(document.slides[0],bindPptxRotations(sourceXml,document.slides[0].animations));scaleBindings.set(document.slides[0],bindPptxScales(sourceXml,document.slides[0].animations));}}
  window.useSourceTransforms=true;
  window.testRepeatSources=()=>probePptxRepeats(bytes,{unzipSync,zipSync,parseWorker,readPptxPackageIsolated,inspectPptxXml,PresentationState,renderSlideToSvg,parseDisplaySvg,ownedUrls,bindPptxRotations,bindPptxScales,playPptxRepeatedGroup,playPptxRotationGroup,playPptxScaleGroup,playGroup,capturePptxAnimationPose,applyPptxAnimationPose,PptxAnimationRuns},shadow);
  window.testDurableSource=()=>probePptxDurable(bytes,{unzipSync,parseWorker,PresentationState,renderSlideToSvg,parseDisplaySvg,ownedUrls,bindPptxRotations,bindPptxScales,playPptxRepeatedGroup,playPptxRotationGroup,playPptxScaleGroup,playGroup,PptxDurablePlayback,IndexedDbSessionRepository,SessionHub,createSession,toPlayerSnapshot},shadow);
  window.restoreDurableSource=id=>probePptxDurable(bytes,{unzipSync,parseWorker,PresentationState,renderSlideToSvg,parseDisplaySvg,ownedUrls,bindPptxRotations,bindPptxScales,playPptxRepeatedGroup,playPptxRotationGroup,playPptxScaleGroup,playGroup,PptxDurablePlayback,IndexedDbSessionRepository,SessionHub,createSession,toPlayerSnapshot},shadow,id);
  window.model=summarize(pres);window.mainModel=mainSummary;
  window.testParserLifetime=async()=>{let ticks=0,timeoutReady=false,cancelReady=false;const interval=setInterval(()=>ticks++,5);try{
    let timeoutCode;try{await parseWorker(bytes,{url:'stall-parser.js',timeoutMs:500,onReady:()=>{timeoutReady=true;}});}catch(error){timeoutCode=error.message;}
    const timeoutTicks=ticks,controller=new AbortController();let cancelCode;ticks=0;
    try{await parseWorker(bytes,{url:'stall-parser.js',timeoutMs:2000,signal:controller.signal,onReady:()=>{cancelReady=true;setTimeout(()=>controller.abort(),50);}});}catch(error){cancelCode=error.message;}
    let invalidCode;try{const invalid=new Uint8Array([80,75,0,0,0]);await parseWorker(invalid);}catch(error){invalidCode=error.message;}
    return {timeoutCode,cancelCode,invalidCode,timeoutReady,cancelReady,timeoutTicks,cancelTicks:ticks,originalBytes:bytes.byteLength};
  }finally{clearInterval(interval);}};
  window.show=index=>{stopMedia();runs.invalidate();state.goTo(index);paint();return {page:state.index+1,total:state.animationTotal,done:state.animationDone,hidden:state.hiddenElementIds.size,domHidden:domHidden(),hiddenRoots:hiddenRoots(),images:target.querySelectorAll('image').length};};
  window.restore=(index,done=0)=>{stopMedia();runs.invalidate();state.destroy();state=new PresentationState(pres,{index,animate:true,autoAdvance:false});for(let i=0;i<done;i++){if(!state.playNextAnimation())throw Error('INVALID_CURSOR');}paint();return {page:state.index+1,done:state.animationDone,hiddenRoots:hiddenRoots(),animations:target.getAnimations({subtree:true}).length};};
  window.switchDocument=(id,index,done=0)=>{if(!documents.has(id))throw Error('UNKNOWN_DOCUMENT');runs.invalidate();pres=documents.get(id);documentId=id;return window.restore(index,done);};
  window.readStatus=()=>({documentId,page:state.index+1,done:state.animationDone,hiddenRoots:hiddenRoots(),playing:runs.isPlaying,animations:target.getAnimations({subtree:true}).length,commits});
  const poseScope=()=>({sessionId:'spike-session',documentId,slideId:'slide-'+(state.index+1),revision:0});
  window.capturePose=()=>capturePptxAnimationPose(target,poseScope(),(state.slide.animations??[]).map(step=>step.target));
  window.applyPose=pose=>applyPptxAnimationPose(target,pose,poseScope());
  window.inspectImages=async()=>{let decoded=0;for(const node of target.querySelectorAll('image')){const image=new Image();image.src=node.getAttribute('href')??node.getAttributeNS('http://www.w3.org/1999/xlink','href');try{await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('EMPTY_IMAGE');decoded++;}finally{image.removeAttribute('src');}}return decoded;};
  window.step=async()=>{if(runs.isPlaying)return {outcome:'busy'};const before={page:state.index+1,done:state.animationDone,hidden:state.hiddenElementIds.size,domHidden:domHidden()},group=state.playNextAnimation();if(!group)return null;const targetsPresent=group.every(step=>target.querySelector('[data-el="'+step.target+'"]'));let nativeAnimations=0;const outcome=await runs.play(()=>{const rotations=rotationBindings.get(state.slide)??new Map(),scales=scaleBindings.get(state.slide)??new Map(),sources=new Map([...rotations,...scales]),start=projected=>playPptxRotationGroup(target,group,rotations,()=>playPptxScaleGroup(target,group,scales,()=>playGroup(target,projected))),playback=window.useSourceTransforms?playPptxRepeatedGroup(target,group,sources,start):playGroup(target,group);nativeAnimations=target.getAnimations({subtree:true}).length;return playback;},()=>{commits++;visible();});if(outcome!=='completed')return {outcome};const targetsVisible=group.every(step=>getComputedStyle(target.querySelector('[data-el="'+step.target+'"]')).visibility==='visible');return {outcome,before,page:state.index+1,done:state.animationDone,hidden:state.hiddenElementIds.size,domHidden:domHidden(),hiddenRoots:hiddenRoots(),targetsPresent,targetsVisible,nativeAnimations,group:group.length};};
  window.testRotationSources=async()=>{
    const p='http://schemas.openxmlformats.org/presentationml/2006/main',steps=documents.get('A').slides[0].animations,results=[],rejected=[];
    const variant=edit=>{const xml=new DOMParser().parseFromString(sourceXml,'application/xml');edit(xml,xml.getElementsByTagNameNS(p,'animRot')[0]);return new XMLSerializer().serializeToString(xml);};
    for(const [name,attributes,expected]of [['negative',{by:'-5400000'},-90],['from-to',{from:'2700000',to:'-2700000'},-45],['from-by',{from:'2700000',by:'5400000'},135],['multi-turn',{by:'43200000'},0]]){
      window.switchDocument('A',0);const bound=bindPptxRotations(variant((xml,rotation)=>{for(const key of ['by','from','to'])rotation.removeAttribute(key);for(const [key,value]of Object.entries(attributes))rotation.setAttribute(key,value);}),steps),step=[...bound.keys()][0];
      const playback=playPptxRotationGroup(target,[step],bound,()=>playGroup(target,[step]));const animation=target.getAnimations({subtree:true}).find(item=>item.effect.target===target.querySelector('[data-el="'+step.target+'"]'));
      const keyframes=animation.effect.getKeyframes().map(frame=>frame.transform);animation.pause();animation.currentTime=100;const progress=animation.effect.getComputedTiming().progress;
      const source=bound.get(step),from=source.values.from??0,to=source.values.to??from+source.values.by,angle=(from+(to-from)*progress)*Math.PI/180,midMatrix=new DOMMatrix(getComputedStyle(animation.effect.target).transform),midpointError=Math.max(Math.abs(midMatrix.a-Math.cos(angle)),Math.abs(midMatrix.b-Math.sin(angle)));
      animation.play();await playback.finished;const matrix=new DOMMatrix(getComputedStyle(animation.effect.target).transform),degrees=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
      results.push({name,expected,degrees,keyframes,progress,midpointError});animation.cancel();
    }
    window.switchDocument('A',0);const relativeBound=bindPptxRotations(sourceXml,steps),relativeStep=[...relativeBound.keys()][0],relativeTarget=target.querySelector('[data-el="'+relativeStep.target+'"]');relativeTarget.style.transform='matrix(0,1,-1,0,20,30)';
    const relativePlayback=playPptxRotationGroup(target,[relativeStep],relativeBound,()=>playGroup(target,[relativeStep]));await relativePlayback.finished;const relativeMatrix=new DOMMatrix(getComputedStyle(relativeTarget).transform),relativeBaseline={degrees:Math.atan2(relativeMatrix.b,relativeMatrix.a)*180/Math.PI,x:relativeMatrix.e,y:relativeMatrix.f};
    const edits=[['indefinite-repeat',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'cTn')[0].setAttribute('repeatCount','indefinite')],['bad-reverse',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'cTn')[0].setAttribute('autoRev','2')],['ancestor-repeat',xml=>xml.getElementsByTagNameNS(p,'cTn')[0].setAttribute('repeatCount','2000')],['malformed',(xml,rotation)=>rotation.setAttribute('by','Infinity')],['ambiguous',(xml,rotation)=>rotation.setAttribute('to','5400000')],['target',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'spTgt')[0].setAttribute('spid','999')],['duration',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'cTn')[0].setAttribute('dur','500')],['compound',(xml,rotation)=>rotation.parentElement.append(rotation.cloneNode(true))],['attribute',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'attrName')[0].textContent='ppt_x'],['repeat-conditions',(xml,rotation)=>rotation.getElementsByTagNameNS(p,'cTn')[0].append(xml.createElementNS(p,'p:stCondLst'))]];
    for(const [name,edit]of edits){try{bindPptxRotations(variant(edit),steps);}catch(error){if(error.message==='PPTX_ROTATION_UNVERIFIED')rejected.push(name);}}
    return {results,rejected,relativeBaseline};
  };
  window.testScaleSources=async()=>{
    const p='http://schemas.openxmlformats.org/presentationml/2006/main',steps=documents.get('A').slides[0].animations,results=[],rejected=[];
    const variant=edit=>{const xml=new DOMParser().parseFromString(sourceXml,'application/xml');edit(xml,xml.getElementsByTagNameNS(p,'animScale')[0]);return new XMLSerializer().serializeToString(xml);};
    const cases=[['uniform',{by:{x:'150000',y:'150000'}}],['shrink',{by:{x:'50%',y:'50%'}}],['from-to',{from:{x:'50000',y:'200000'},to:{x:'200000',y:'25000'}}],['to-only',{to:{x:'150000',y:'50000'}}],['by-ignored',{by:{x:'9900000',y:'9900000'},from:{x:'100000',y:'100000'},to:{x:'150000',y:'50000'}}]];
    for(const [name,points]of cases){window.switchDocument('A',0);const bound=bindPptxScales(variant((xml,scale)=>{for(const node of [...scale.children])if(node.localName!=='cBhvr')node.remove();for(const [key,attributes]of Object.entries(points)){const node=xml.createElementNS(p,'p:'+key);for(const [attribute,value]of Object.entries(attributes))node.setAttribute(attribute,value);scale.append(node);}}),steps),step=[...bound.keys()][0],source=bound.get(step),element=target.querySelector('[data-el="'+step.target+'"]');
      const playback=playPptxScaleGroup(target,[step],bound,()=>playGroup(target,[step])),animation=target.getAnimations({subtree:true}).find(item=>item.effect.target===element),keyframes=animation.effect.getKeyframes().map(frame=>frame.transform);
      animation.pause();animation.currentTime=100;const progress=animation.effect.getComputedTiming().progress,from=source.values.from??(source.values.to?{x:0,y:0}:{x:1,y:1}),to=source.values.to??source.values.by,mid=new DOMMatrix(getComputedStyle(element).transform),midpointError=Math.max(Math.abs(mid.a-(from.x+(to.x-from.x)*progress)),Math.abs(mid.d-(from.y+(to.y-from.y)*progress)));
      animation.play();await playback.finished;const end=new DOMMatrix(getComputedStyle(element).transform);results.push({name,keyframes,from,to,x:end.a,y:end.d,progress,midpointError});animation.cancel();
    }
    const edits=[['negative',(xml,scale)=>scale.getElementsByTagNameNS(p,'by')[0].setAttribute('x','-50000')],['duplicate',(xml,scale)=>scale.append(scale.getElementsByTagNameNS(p,'by')[0].cloneNode(true))],['missing-y',(xml,scale)=>scale.getElementsByTagNameNS(p,'by')[0].removeAttribute('y')],['wrong-attribute',(xml,scale)=>scale.getElementsByTagNameNS(p,'attrName')[0].textContent='ppt_w'],['indefinite-repeat',(xml,scale)=>scale.getElementsByTagNameNS(p,'cTn')[0].setAttribute('repeatCount','indefinite')],['bad-reverse',(xml,scale)=>scale.getElementsByTagNameNS(p,'cTn')[0].setAttribute('autoRev','2')],['zoom-contents',(xml,scale)=>scale.setAttribute('zoomContents','false')],['from-by',(xml,scale)=>{const node=xml.createElementNS(p,'p:from');node.setAttribute('x','50000');node.setAttribute('y','50000');scale.append(node);}]];
    for(const [name,edit]of edits){try{bindPptxScales(variant(edit),steps);}catch(error){if(error.message==='PPTX_SCALE_UNVERIFIED')rejected.push(name);}}
    return {results,rejected};
  };
  window.testMedia=async()=>{
    window.show(2);const models=[];const walk=elements=>{for(const element of elements){if(element.media)models.push(element.media);if(element.children)walk(element.children);}};walk(state.slide.elements);
    const references=[];for(const model of models){const ref=validatePptxMediaReference(model,ownedUrls),blob=ownedBlobs.get(ref.src);if(!blob||!blob.size||blob.size>32*1024*1024)throw Error('INVALID_MEDIA_BLOB');
      const file=new File([blob],'embedded.'+ref.extension,{type:ref.mime}),checked=await readMediaInput(file);
      const player=document.createElement(ref.kind);player.muted=true;player.controls=true;player.preload='metadata';player.style.cssText=ref.kind==='video'?'position:absolute;left:320px;top:180px;width:320px;height:180px':'position:absolute;left:40px;top:400px;width:250px';mediaPlayers.add(player);target.append(player);
      await new Promise((resolve,reject)=>{const finish=error=>{clearTimeout(timer);player.onloadedmetadata=null;player.onerror=null;error?reject(error):resolve();},timer=setTimeout(()=>finish(Error('MEDIA_METADATA_TIMEOUT')),10000);player.onloadedmetadata=()=>finish();player.onerror=()=>finish(Error('MEDIA_DECODE_FAILED'));player.src=ref.src;player.load();});
      if(!Number.isFinite(player.duration)||player.duration<=0)throw Error('INVALID_DURATION');
      const reference={kind:ref.kind,mime:ref.mime,bytes:blob.size,fingerprint:checked.fingerprint,duration:player.duration,width:player.videoWidth??null,height:player.videoHeight??null};references.push(reference);
    }
    for(const player of mediaPlayers)await player.play();await new Promise(resolve=>setTimeout(resolve,250));
    const progressed=[...mediaPlayers].map(player=>({kind:player.tagName.toLowerCase(),time:player.currentTime,paused:player.paused}));
    if(progressed.some(item=>item.paused||item.time<=0))throw Error('MEDIA_NOT_PROGRESSING');
    const video=[...mediaPlayers].find(player=>player.tagName==='VIDEO'),canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;const ctx=canvas.getContext('2d');ctx.drawImage(video,0,0,320,180);
    const edge=[...ctx.getImageData(20,20,1,1).data],center=[...ctx.getImageData(160,90,1,1).data];
    if(!((edge[0]>180&&edge[1]<90&&edge[2]<100)||(edge[1]>120&&edge[0]<90&&edge[2]<150))||center.slice(0,3).some(channel=>channel<220))throw Error('MEDIA_FRAME_PIXELS');
    window.switchDocument('B',0);const bookmarks=[...mediaPlayers].map(player=>player.currentTime);await new Promise(resolve=>setTimeout(resolve,250));
    const stopped=[...mediaPlayers].map((player,index)=>({paused:player.paused,time:player.currentTime,bookmark:bookmarks[index]}));
    if(stopped.some(item=>!item.paused||Math.abs(item.time-item.bookmark)>0.05))throw Error('MEDIA_NOT_STOPPED');
    window.switchDocument('A',2);for(const [index,player]of[...mediaPlayers].entries()){target.append(player);player.currentTime=bookmarks[index];}
    const restored=[...mediaPlayers].map((player,index)=>({paused:player.paused,time:player.currentTime,bookmark:bookmarks[index]}));
    if(restored.some(item=>!item.paused||Math.abs(item.time-item.bookmark)>0.05))throw Error('MEDIA_NOT_RESTORED');
    return {references,progressed,videoPixels:{edge,center},stopped,restored,canonicalEdits:window.canonicalEdits,canonicalHash:window.canonicalHash};
  };
  window.cleanup=()=>{stopMedia();for(const player of mediaPlayers){player.removeAttribute('src');player.load();player.remove();}mediaPlayers.clear();runs.invalidate();state.destroy();for(const document of documents.values())document.dispose?.();for(const url of ownedUrls)URL.revokeObjectURL(url);ownedUrls.clear();ownedBlobs.clear();target.replaceChildren();URL.createObjectURL=originalCreate;};
  phase='render';paint();window.ready=true;
};
window.run().catch(error=>{window.failure={phase,errorName:['TypeError','ReferenceError','RangeError'].includes(error?.name)?error.name:'Error',code:/^PPTX_[A-Z_]+$/.test(error?.message??'')?error.message:'ENGINE_FAILED'};});
`);
const bytes = await readFile(fixturePath);
assert(bytes.length <= 128 * 1024 * 1024);
const { chromium } = await import(pathToFileURL(resolve(playwrightPath)).href);
const profile = resolve(output, `profile-${Date.now()}`), report = { version: '0.4.5', profile, fixture: mediaMode?'synthetic-media-canonical':effectsMode?'synthetic-effects':'teacher-01', fixtureSha256: createHash('sha256').update(bytes).digest('hex'), productIntegration: false, externalCount: 0 };
let context;
const launchOptions={ executablePath, headless: true, ignoreDefaultArgs: true, args: [`--user-data-dir=${profile}`, '--remote-debugging-pipe', '--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--no-sandbox', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`] };
try {
  context = await chromium.launchPersistentContext(profile, launchOptions);
  let background;
  for (let attempt = 0; attempt < 80 && !background; attempt++) {
    for (const candidate of context.serviceWorkers()) if (await candidate.evaluate(() => chrome.runtime.getManifest().name).catch(() => '') === 'web-ppt isolated spike') background = candidate;
    if (!background) await new Promise(done => setTimeout(done, 250));
  }
  assert(background);
  const origin = `chrome-extension://${new URL(background.url()).hostname}`, page = await context.newPage();
  await page.setViewportSize({ width: 1000, height: 600 });
  await page.route('**/*', route => {
    if (route.request().url() === `${origin}/input.pptx`) return route.fulfill({ body: bytes, contentType: 'application/octet-stream' });
    if (route.request().url().startsWith(origin + '/')) return route.continue();
    report.externalCount++; return route.abort();
  });
  await page.goto(`${origin}/index.html`);
  await page.waitForFunction(() => window.ready || window.failure, undefined, { timeout: 30000 });
  report.failure = await page.evaluate(() => window.failure ?? null);
  report.workerEvidence=await page.evaluate(()=>window.workerEvidence);
  if (!report.failure) {
    report.svgRegression=await page.evaluate(async()=>{
      const {parseDisplaySvg}=await import('./webppt.js'),blocked=[];
      for(const [id,body]of[['script','<script>neverRun()</script>'],['event','<rect onclick="neverRun()"/>'],['uri','<image href="https://example.invalid/private"/>'],['namespace','<g xmlns:x="http://www.w3.org/1999/xlink"><image x:href="javascript:neverRun()"/></g>'],['css','<rect style="fill:url(https://example.invalid)"/>'],['frame','<foreignObject><iframe xmlns="http://www.w3.org/1999/xhtml"/></foreignObject>']]){try{parseDisplaySvg('<svg xmlns="http://www.w3.org/2000/svg">'+body+'</svg>');}catch(error){if(error.message==='PPTX_UNSAFE_SVG')blocked.push(id);}}
      return blocked;
    });
    assert.deepEqual(report.svgRegression,['script','event','uri','namespace','css','frame']);
    report.count = await page.evaluate(() => window.count);assert.equal(report.count,mediaMode?3:effectsMode?2:23);
    report.safety = await page.evaluate(() => window.safety);report.model = await page.evaluate(() => window.model);report.pages = [];
    assert.deepEqual(report.model,await page.evaluate(()=>window.mainModel));
    const assets=await page.evaluate(()=>window.assetComparison);assert.deepEqual(assets.worker,assets.main);report.assetComparison={count:assets.worker.length,bytes:assets.worker.reduce((sum,asset)=>sum+asset.bytes,0),allHashesEqual:true};
    for(const evidence of report.workerEvidence){assert.equal(evidence.reason,'success');assert(evidence.terminated);assert.equal(evidence.boundary.domAvailable,false);assert.equal(evidence.boundary.domParserAvailable,false);}
    for (let index = 0; index < report.count; index++) {
      const shown=await page.evaluate(index => window.show(index), index);
      shown.decoded=await page.evaluate(()=>window.inspectImages());assert.equal(shown.decoded,shown.images);report.pages.push(shown);
      if ([0,2,14,22].includes(index)) await page.screenshot({path:resolve(output,`webppt-${index+1}.png`)});
    }
    if(effectsMode){
      report.durableSource=await page.evaluate(()=>window.testDurableSource());
      const durable=report.durableSource;
      assert.deepEqual(durable.outcomes,Array(5).fill('completed'));assert.equal(durable.totalGroups,5);assert.equal(durable.completedBefore,3);assert.deepEqual(durable.targetIds,[2,3,4,5]);
      assert(Math.abs(durable.rotation.b-1)<0.001);assert.deepEqual(durable.rotation,durable.returned);assert.equal(durable.failure,'PPTX_CHECKPOINT_FAILED');assert.equal(durable.rollback.done,3);assert.equal(durable.rollback.saved,3);assert.equal(durable.rollback.motion.e,0);
      assert.equal(durable.motion.e,320);assert.equal(durable.busy,'busy');assert.equal(durable.exhausted,'exhausted');assert.equal(durable.completedGroups,5);assert.equal(durable.dbGroups,5);
      assert(Math.abs(durable.scale.a-1.5)<0.001);assert(Math.abs(durable.scale.d-0.5)<0.001);assert.deepEqual(durable.restored.rotation,durable.rotation);assert.deepEqual(durable.restored.motion,durable.motion);assert.deepEqual(durable.restored.scale,durable.scale);assert(durable.restored.hidden);
      report.repeatSource=await page.evaluate(()=>window.testRepeatSources());
      assert.equal(report.repeatSource.length,6);
      assert.equal(report.repeatSource.find(result=>result.name==='effect-repeat').timingRejected.length,9);
      for(const result of report.repeatSource){
        for(const sample of result.samples){
          const iteration=Math.floor(sample.local/200),fraction=(sample.local%200)/200,expected=result.expected.direction==='alternate'&&iteration%2?1-fraction:fraction;
          assert(Math.abs(sample.progress-expected)<0.000001,'source zero acceleration must have linear progress');
        }
        if(result.name==='rotation-fractional'){
          assert(Math.abs(result.end.progress-0.5)<0.000001);
          assert(Math.abs(result.end.a-Math.SQRT1_2)<0.001);assert(Math.abs(result.end.b-Math.SQRT1_2)<0.001);
        }
      }
      for(const result of report.repeatSource){const timed=result.timings.find(item=>item.iterations!==1),[rotation,motion,scale]=result.timings;assert.equal(timed.duration,200);assert.equal(timed.iterations,result.expected.iterations);assert.equal(timed.direction,result.expected.direction);assert.equal(timed.activeDuration,result.expected.active);assert(Math.abs(motion.delay-rotation.activeDuration-30)<0.001);assert(Math.abs(scale.delay-motion.endTime-50)<0.001);
        for(const sample of result.samples){assert.equal(sample.iteration,Math.floor(sample.local/200));if(result.tag==='animRot'){const radians=90*sample.progress*Math.PI/180;assert(Math.abs(sample.a-Math.cos(radians))<0.001);assert(Math.abs(sample.b-Math.sin(radians))<0.001);}else{assert(Math.abs(sample.a-(1+0.5*sample.progress))<0.001);assert(Math.abs(sample.d-(1-0.5*sample.progress))<0.001);}}
        if(result.expected.direction==='alternate'){assert.equal(result.end.progress,0);assert(Math.abs(result.end.a-1)<0.001);assert(Math.abs(result.end.b)<0.001);assert(Math.abs(result.end.d-1)<0.001);}else if(result.name!=='rotation-fractional'){assert.equal(result.end.progress,1);assert(Math.abs(result.end.b-1)<0.001);}
        for(const key of ['a','b','d'])assert(Math.abs(result.restored[key]-result.end[key])<0.001);assert.equal(result.cancel.outcome,'superseded');assert.equal(result.cancel.commits,0);assert(result.cancel.allIdle);
      }
      report.scaleSource=await page.evaluate(()=>window.testScaleSources());
      assert.deepEqual(report.scaleSource.rejected,['negative','duplicate','missing-y','wrong-attribute','indefinite-repeat','bad-reverse','zoom-contents','from-by']);
      for(const result of report.scaleSource.results){assert(Math.abs(result.x-result.to.x)<0.001);assert(Math.abs(result.y-result.to.y)<0.001);assert(result.midpointError<0.001);assert(result.progress>0&&result.progress<1);}
      report.rotationSource=await page.evaluate(()=>window.testRotationSources());
      assert.deepEqual(report.rotationSource.rejected,['indefinite-repeat','bad-reverse','ancestor-repeat','malformed','ambiguous','target','duration','compound','attribute','repeat-conditions']);
      for(const result of report.rotationSource.results){assert(Math.abs(result.degrees-result.expected)<1);assert(result.progress>0&&result.progress<1);assert(result.midpointError<0.001);}
      assert(Math.abs(Math.abs(report.rotationSource.relativeBaseline.degrees)-180)<1);assert.equal(report.rotationSource.relativeBaseline.x,20);assert.equal(report.rotationSource.relativeBaseline.y,30);
      assert.deepEqual(report.rotationSource.results.find(item=>item.name==='multi-turn').keyframes,['rotate(0deg)','rotate(720deg)']);
      report.effects=await page.evaluate(async()=>{
        const root=document.getElementById('host').shadowRoot.firstElementChild,spec=window.effectsSpec;
        const get=id=>root.querySelector('[data-el="'+id+'"]'),rect=()=>get(spec.targets[2]).getBoundingClientRect().left;
        window.useSourceTransforms=false;window.restore(0);for(let index=0;index<5;index++)await window.step();const candidateMatrix=new DOMMatrix(getComputedStyle(get(spec.targets[1])).transform),unadaptedDegrees=Math.atan2(candidateMatrix.b,candidateMatrix.a)*180/Math.PI;
        const candidateScaleStyle=getComputedStyle(get(spec.targets[3])),candidateScale=new DOMMatrix(candidateScaleStyle.transform),unadaptedScale={x:candidateScale.a,y:candidateScale.d,opacity:Number(candidateScaleStyle.opacity)};
        window.useSourceTransforms=true;window.restore(0);const initialLeft=rect(),initialHidden=getComputedStyle(get(spec.targets[0])).visibility==='hidden',initialScaleBox=get(spec.targets[3]).getBoundingClientRect().toJSON();
        const rotationTarget=get(spec.targets[1]),initialRotationBox=rotationTarget.getBoundingClientRect().toJSON(),rotationOrigin=getComputedStyle(rotationTarget).transformOrigin,rotationBox=getComputedStyle(rotationTarget).transformBox;
        const states=[];for(let index=0;index<5;index++){const played=await window.step();if(played.outcome!=='completed')throw Error('EFFECT_NOT_COMPLETED');states.push({kind:window.model[0].animations[index].kind,visible:getComputedStyle(get(spec.targets[0])).visibility==='visible'});}
        const completedLeft=rect(),rotationStyle=getComputedStyle(get(spec.targets[1])).transform,matrix=new DOMMatrix(rotationStyle),observedDegrees=Math.atan2(matrix.b,matrix.a)*180/Math.PI;
        const scaleMatrix=new DOMMatrix(getComputedStyle(get(spec.targets[3])).transform),completedScaleBox=get(spec.targets[3]).getBoundingClientRect().toJSON(),pose=window.capturePose();window.switchDocument('B',1);window.switchDocument('A',0,5);const cursorOnlyLeft=rect();
        window.applyPose(pose);const restoredLeft=rect(),restoredHidden=getComputedStyle(get(spec.targets[0])).visibility==='hidden';
        let staleRejected=false;try{window.applyPose({...pose,scope:{...pose.scope,revision:1}});}catch(error){staleRejected=error.message==='PPTX_INVALID_ANIMATION_POSE';}
        if(Math.abs(rect()-restoredLeft)>0.1)throw Error('STALE_POSE_CHANGED_DOM');
        const restoredMatrix=new DOMMatrix(getComputedStyle(get(spec.targets[1])).transform),restoredDegrees=Math.atan2(restoredMatrix.b,restoredMatrix.a)*180/Math.PI;
        const restoredScale=new DOMMatrix(getComputedStyle(get(spec.targets[3])).transform);
        return {spec,initialHidden,states,motion:{initialLeft,completedLeft,cursorOnlyLeft,restoredLeft,cursorOnlyRestores:Math.abs(cursorOnlyLeft-completedLeft)<0.1,poseRestores:Math.abs(restoredLeft-completedLeft)<0.1},rotation:{expectedDegrees:90,observedDegrees,unadaptedDegrees,restoredDegrees,initialRotationBox,completedRotationBox:get(spec.targets[1]).getBoundingClientRect().toJSON(),rotationOrigin,rotationBox,fidelity:Math.abs(observedDegrees-90)<1?'matched':'loss'},scale:{unadaptedScale,x:scaleMatrix.a,y:scaleMatrix.d,restoredX:restoredScale.a,restoredY:restoredScale.d,initialScaleBox,completedScaleBox,restoredOpacity:Number(getComputedStyle(get(spec.targets[3])).opacity)},restoredHidden,staleRejected,pose};
      });
      assert.deepEqual(report.model[0].animations.map(step=>step.kind),['entrance','exit','emphasis','motion','emphasis']);
      assert.deepEqual(report.model[0].animations.map(step=>step.durationMs),[200,200,200,300,200]);
      assert(report.effects.initialHidden);assert.equal(report.effects.states[0].visible,true);assert.equal(report.effects.states[1].visible,false);
      assert(Math.abs(report.effects.motion.completedLeft-report.effects.motion.initialLeft-240)<1);assert.equal(report.effects.motion.cursorOnlyRestores,false);assert(report.effects.motion.poseRestores);assert(report.effects.restoredHidden);assert(report.effects.staleRejected);
      assert.equal(report.effects.rotation.fidelity,'matched');assert(Math.abs(report.effects.rotation.unadaptedDegrees)<1);assert(Math.abs(report.effects.rotation.restoredDegrees-90)<1);
      const firstBox=report.effects.rotation.initialRotationBox,lastBox=report.effects.rotation.completedRotationBox;
      assert(Math.abs((firstBox.left+firstBox.right-lastBox.left-lastBox.right)/2)<1);assert(Math.abs((firstBox.top+firstBox.bottom-lastBox.top-lastBox.bottom)/2)<1);
      assert(lastBox.left>=0&&lastBox.right<=960&&lastBox.top>=0&&lastBox.bottom<=540);
      const scale=report.effects.scale;assert.equal(scale.x,1.5);assert.equal(scale.y,0.5);assert.equal(scale.restoredX,1.5);assert.equal(scale.restoredY,0.5);assert.equal(scale.restoredOpacity,1);
      assert.equal(scale.unadaptedScale.x,1);assert.equal(scale.unadaptedScale.y,1);assert(Math.abs(scale.unadaptedScale.opacity-0.35)<0.001);
      assert(Math.abs(scale.completedScaleBox.width/scale.initialScaleBox.width-1.5)<0.001);assert(Math.abs(scale.completedScaleBox.height/scale.initialScaleBox.height-0.5)<0.001);
      assert(Math.abs((scale.initialScaleBox.left+scale.initialScaleBox.right-scale.completedScaleBox.left-scale.completedScaleBox.right)/2)<1);assert(Math.abs((scale.initialScaleBox.top+scale.initialScaleBox.bottom-scale.completedScaleBox.top-scale.completedScaleBox.bottom)/2)<1);
      report.effectFidelity='tested synthetic source rotation and scale matched with adapters; unmodified candidate loses both meanings';
      await page.screenshot({path:resolve(output,'webppt-effects-restored.png')});
    }else if(mediaMode){
      report.media=await page.evaluate(()=>window.testMedia());assert.equal(report.media.canonicalEdits,1);assert.equal(report.media.references.length,2);
      for(const kind of ['audio','video']){const ref=report.media.references.find(item=>item.kind===kind);assert(ref);const source=await readFile(kind==='audio'?resolve(cache,'synthetic.wav'):resolve('node_modules/.cache/whale-video-spike/synthetic.mp4'));assert.equal(ref.fingerprint,createHash('sha256').update(source).digest('hex'));assert.equal(ref.bytes,source.length);if(kind==='video'){assert.equal(ref.width,320);assert.equal(ref.height,180);}}
      await page.screenshot({path:resolve(output,'webppt-media-restored.png')});
    }else{
    report.steps = [];
    for (const [index, expected] of [[2,6],[8,1],[11,2],[18,3]]) {
      const initial = await page.evaluate(index => window.show(index), index);assert.equal(initial.total,expected);assert.equal(initial.hiddenRoots,expected);
      if(index===2)await page.screenshot({path:resolve(output,'webppt-3-before.png')});
      for (let step = 0; step < expected; step++) {
        const evidence = await page.evaluate(() => window.step());assert(evidence);assert.equal(evidence.page,index+1);assert.equal(evidence.done,step+1);assert.equal(evidence.hiddenRoots,expected-step-1);assert(evidence.targetsPresent);assert(evidence.targetsVisible);assert(evidence.nativeAnimations>0);report.steps.push(evidence);
      }
      assert.equal(await page.evaluate(() => window.step()),null);
      if(index===2)await page.screenshot({path:resolve(output,'webppt-3-after.png')});
    }
    assert.equal(report.steps.length,12);
    report.lifetime=await page.evaluate(async()=>{
      const target=document.getElementById('host').shadowRoot.firstElementChild;
      const replay=window.restore(2);if(replay.done!==0||replay.hiddenRoots!==6)throw Error('REPLAY_NOT_RESET');
      await window.step();await window.step();const checkpoint=window.readStatus();
      window.show(0);const resumed=window.restore(2,checkpoint.done);if(resumed.done!==2||resumed.hiddenRoots!==4||resumed.animations!==0)throw Error('RESUME_FAILED');
      const before=window.readStatus(),pending=window.step(),busy=await window.step();
      if(busy.outcome!=='busy'||window.readStatus().done!==3)throw Error('BUSY_ADVANCED');
      const oldAnimations=target.getAnimations({subtree:true});if(!oldAnimations.some(animation=>animation.playState==='running'))throw Error('NOT_RUNNING');
      window.switchDocument('B',8);const switched=window.readStatus(),cancelled=await pending;
      if(cancelled.outcome!=='superseded'||oldAnimations.some(animation=>animation.playState!=='idle'))throw Error('NOT_CANCELLED');
      const replacement=await window.step();if(replacement.outcome!=='completed')throw Error('NEW_RUN_FAILED');
      await new Promise(resolve=>setTimeout(resolve,650));const settled=window.readStatus();
      if(settled.documentId!=='B'||settled.page!==9||settled.done!==1||settled.hiddenRoots!==0||settled.commits!==before.commits+1)throw Error('STALE_COMMIT');
      window.switchDocument('A',2,checkpoint.done);const returned=window.readStatus();if(returned.documentId!=='A'||returned.done!==2||returned.hiddenRoots!==4||returned.animations!==0)throw Error('RETURN_FAILED');
      window.restore(2);const restarted=window.readStatus();if(restarted.done!==0||restarted.hiddenRoots!==6)throw Error('RESTART_FAILED');
      return {twoIndependentParsesOfSameFixture:true,checkpoint,resumed,busy:busy.outcome,cancelled:cancelled.outcome,oldAnimations:oldAnimations.length,allOldIdle:true,switched,settled,returned,restarted};
    });
    await page.screenshot({path:resolve(output,'webppt-3-restarted.png')});
    await page.evaluate(()=>window.restore(2,2));
    await page.screenshot({path:resolve(output,'webppt-3-resumed.png')});
    }
    report.parserLifetime=await page.evaluate(()=>window.testParserLifetime());assert.equal(report.parserLifetime.timeoutCode,'PPTX_PARSE_TIMEOUT');assert.equal(report.parserLifetime.cancelCode,'PPTX_PARSE_CANCELLED');assert.equal(report.parserLifetime.invalidCode,'PPTX_PARSE_FAILED');assert(report.parserLifetime.timeoutReady);assert(report.parserLifetime.cancelReady);assert(report.parserLifetime.timeoutTicks>0);assert(report.parserLifetime.cancelTicks>0);
    report.workerEvidence=await page.evaluate(()=>window.workerEvidence);assert(report.workerEvidence.every(item=>item.terminated));assert(report.workerEvidence.filter(item=>['PPTX_PARSE_TIMEOUT','PPTX_PARSE_CANCELLED'].includes(item.reason)).every(item=>item.listenersRemoved===1));
    await page.evaluate(() => window.cleanup());report.render='pass';
    if(effectsMode){
      await context.close();context=await chromium.launchPersistentContext(profile,launchOptions);const restarted=await context.newPage();
      await restarted.route('**/*',route=>{if(route.request().url()===origin+'/input.pptx')return route.fulfill({body:bytes,contentType:'application/octet-stream'});if(route.request().url().startsWith(origin+'/'))return route.continue();report.externalCount++;return route.abort();});
      await restarted.goto(origin+'/index.html');await restarted.waitForFunction(()=>window.ready||window.failure,undefined,{timeout:30000});assert.equal(await restarted.evaluate(()=>window.failure??null),null);
      report.durableRestart=await restarted.evaluate(id=>window.restoreDurableSource(id),report.durableSource.sessionId);
      assert.equal(report.durableRestart.fingerprint,report.durableSource.fingerprint);assert.equal(report.durableRestart.completedGroups,5);assert.equal(report.durableRestart.isBusy,false);assert.deepEqual(report.durableRestart.restored,report.durableSource.restored);
      const evidence=await restarted.evaluate(()=>window.workerEvidence);assert(evidence.every(item=>item.terminated));report.restartWorkerEvidence=evidence;
      await restarted.evaluate(()=>window.cleanup());
    }
  }
} finally {
  if(context)await context.close();
  report.originalUnchanged=createHash('sha256').update(await readFile(fixturePath)).digest('hex')===report.fixtureSha256;
  await writeFile(resolve(output,'result.json'),JSON.stringify(report,null,2));
}
console.log(JSON.stringify(report));
assert.equal(report.failure,null);assert.equal(report.externalCount,0);assert(report.originalUnchanged);
