import assert from 'node:assert/strict';
import { commitPresentationContract, holdPreparationForContract } from './presentation-contract.mjs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';
import { pptxBackgroundPatch } from './pptx-background-patch.ts';
import { waitForBrowserState } from './async-browser-state.mjs';
const [playwrightPath,executablePath,teacherPath]=process.argv.slice(2);
if(!playwrightPath||!executablePath)throw Error('Usage: node scripts/verify-whale-pptx-owner.mjs <playwright> <Whale>');
const {chromium}=await import(pathToFileURL(resolve(playwrightPath)).href);
const teacherBytes=teacherPath?await readFile(teacherPath):null,teacherHash=teacherBytes?createHash('sha256').update(teacherBytes).digest('hex'):null;
const output=resolve('node_modules/.cache/whale-pptx-owner',String(Date.now())),profile=resolve(output,'profile'),extension=resolve(output,'extension');
await mkdir(output,{recursive:true});await cp(resolve('dist'),extension,{recursive:true});
const entry=resolve(output,'entry.ts');
await writeFile(entry,`export {createPptxPlayerTransport} from ${JSON.stringify(resolve('src/player/pptxTransport.ts').replaceAll('\\','/'))};export {createPptxEngineDriver} from ${JSON.stringify(resolve('src/adapters/pptx/engineDriver.ts').replaceAll('\\','/'))};export {PptxDurablePlayback} from ${JSON.stringify(resolve('src/adapters/pptx/durablePlayback.ts').replaceAll('\\','/'))};export {mountPptxRuntimeRenderer,rememberPptxRuntimeSource} from ${JSON.stringify(resolve('tests/fixtures/pptxRuntimeRenderer.mjs').replaceAll('\\','/'))};export {readPptxInput} from ${JSON.stringify(resolve('src/adapters/pptx/input.ts').replaceAll('\\','/'))};export {pptxSourceVault} from ${JSON.stringify(resolve('src/adapters/pptx/source.ts').replaceAll('\\','/'))};export {sourceKey} from ${JSON.stringify(resolve('src/storage/sourceVault.ts').replaceAll('\\','/'))};`);
await writeFile(entry,`export {preparePptxImport} from ${JSON.stringify(resolve('src/adapters/pptx/import.ts').replaceAll('\\','/'))};export {readPptxSlideOrder} from ${JSON.stringify(resolve('src/adapters/pptx/slideOrder.ts').replaceAll('\\','/'))};export {probePptxSlideOrder} from ${JSON.stringify(resolve('tests/fixtures/pptxSlideOrderProbe.mjs').replaceAll('\\','/'))};`,{flag:'a'});
await writeFile(entry,`export {bindPptxSlideModel} from ${JSON.stringify(resolve('src/adapters/pptx/modelBinding.ts').replaceAll('\\','/'))};`,{flag:'a'});
await writeFile(entry,`export {probePptxModelOrder} from ${JSON.stringify(resolve('tests/fixtures/pptxModelOrderProbe.mjs').replaceAll('\\','/'))};export {parsePptxFixture} from ${JSON.stringify(resolve('tests/fixtures/pptxFixtureParser.mjs').replaceAll('\\','/'))};`,{flag:'a'});
await writeFile(entry,`export {pptxModelPreflight} from ${JSON.stringify(resolve('src/adapters/pptx/preflight.ts').replaceAll('\\','/'))};export {inspectPptxModel} from ${JSON.stringify(resolve('src/adapters/pptx/modelInspection.ts').replaceAll('\\','/'))};`,{flag:'a'});
await build({configFile:false,logLevel:'error',plugins:[pptxBackgroundPatch()],worker:{format:'es',plugins:()=>[pptxBackgroundPatch(),{name:'preserve-parser',transform(code,id){if(id.replaceAll('\\','/').endsWith('/@web-ppt/core/dist/worker.js'))return {code,map:null,moduleSideEffects:true};}}]},define:{'process.env.NODE_ENV':JSON.stringify('production')},build:{outDir:extension,emptyOutDir:false,lib:{entry,formats:['es'],fileName:()=> 'pptx-test.js'}}});
for(const file of ['webppt.js','candidate-worker.js'])await cp(resolve('node_modules/.cache/webppt-spike/effects/extension',file),resolve(extension,file));
await cp(resolve('node_modules/.cache/webppt-spike/effects/extension/assets'),resolve(extension,'assets'),{recursive:true});
await cp(resolve('node_modules/.cache/webppt-spike/effects/synthetic.pptx'),resolve(extension,'synthetic-seed.pptx'));
const options={executablePath,headless:true,ignoreDefaultArgs:true,args:[`--user-data-dir=${profile}`,'--remote-debugging-pipe','--headless=new','--no-first-run','--no-default-browser-check','--disable-gpu','--no-sandbox',`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]};
let context;const report={profile,productRuntime:true,renderedPptx:false};
try{
  context=await chromium.launchPersistentContext(profile,options);let worker;
  for(let attempt=0;attempt<80&&!worker;attempt++){for(const candidate of context.serviceWorkers())if(await candidate.evaluate(()=>chrome.runtime.getManifest().name).catch(()=> '')==='Whale Class Presenter')worker=candidate;if(!worker)await new Promise(resolve=>setTimeout(resolve,250));}
  assert(worker);const origin='chrome-extension://'+new URL(worker.url()).hostname;
  const page=async(role,sessionId)=>{const p=await context.newPage();if(role==='player')await holdPreparationForContract(p);await p.goto(origin+'/'+role+'/index.html'+(sessionId?'?sessionId='+sessionId:''));return p;};
  const send=(p,request)=>p.evaluate(value=>(window.whale??chrome).runtime.sendMessage(value),request);
  const launcher=await page('launcher'),created=await send(launcher,{type:'CREATE_SESSION',title:'Synthetic PPTX owner'});assert(created.ok);
  const sessionId=created.session.id,editor=await page('editor',sessionId),remote=await page('remote',sessionId),player=await page('player',sessionId);
  const doc=id=>({id,source:{type:'pptx',name:'Synthetic.pptx',size:1,lastModified:0,fingerprint:'a'.repeat(64)},lastSlideId:'slide-1',knownSlideCount:2,slideIds:['slide-1','slide-2'],slideDeltas:{'slide-2':{overlays:[],presenterNote:'Synthetic private note',classLog:''}},mediaBookmarks:{},dirty:false});
  const teacher=async()=>{const response=await send(editor,{type:'GET_SESSION',sessionId});assert(response.ok);return response.session;};
  let id=0;
  const command=async(type,extra={})=>({type,sessionId,documentId:'A',slideId:'slide-1',revision:(await teacher()).revision,commandId:'native-'+(++id),...extra});
  for(const documentId of ['A','B'])assert((await send(editor,{type:'SESSION_COMMAND',command:await command('REGISTER_DOCUMENT',{documentId,slideId:null,document:doc(documentId)})})).ok);
  await commitPresentationContract(remote,player,'A'); report.manualTransitionContractOnly=true;
  const claim=await send(player,{type:'CLAIM_PLAYER',sessionId});assert.equal(claim.owned,true);
  await player.evaluate(async sessionId=>{
    const api=window.whale??chrome,{createPptxPlayerTransport}=await import(api.runtime.getURL('pptx-test.js'));let current=(await api.runtime.sendMessage({type:'GET_SESSION',sessionId})).snapshot;
    window.pptxTransport=createPptxPlayerTransport({sessionId,readSnapshot:()=>current,receiveSnapshot:value=>{current=value;}});
    window.refreshPptx=async()=>{current=(await api.runtime.sendMessage({type:'GET_SESSION',sessionId})).snapshot;return current;};
  },sessionId);
  const begin=await command('BEGIN_PPTX_GROUP'),begun=await player.evaluate(c=>window.pptxTransport.send(c),begin);assert(begun.ok);assert.equal(begun.snapshot.pptx.run.epoch,begin.commandId);
  const duplicate=await page('player',sessionId),other=await page('player','synthetic-other');
  assert.equal((await send(duplicate,{type:'CLAIM_PLAYER',sessionId})).owned,false);
  report.denied={};
  for(const [name,p,expected]of[['duplicate',duplicate,'NOT_PLAYER_OWNER'],['editor',editor,'FORBIDDEN'],['remote',remote,'FORBIDDEN'],['other-session',other,'FORBIDDEN']]){
    const before=await teacher(),result=await send(p,{type:'SESSION_COMMAND',command:await command('BEGIN_PPTX_GROUP')});assert.equal(result.code,expected);assert.deepEqual(await teacher(),before);report.denied[name]=result.code;
  }
  const checkpoint=await command('CHECKPOINT_PPTX_GROUP',{epoch:begin.commandId,checkpoint:{renderer:'web-ppt-0.4.5/transform-v1',fingerprint:'a'.repeat(64),completedGroups:1,pose:{version:1,scope:{sessionId,documentId:'A',slideId:'slide-1',revision:(await teacher()).revision},entries:[{target:3,opacity:1,transform:'matrix(0,1,-1,0,0,0)',clipPath:'none',visible:true}]}}});
  const committed=await player.evaluate(c=>window.pptxTransport.send(c),checkpoint);assert(committed.ok);assert.equal(committed.snapshot.pptx.checkpoint.completedGroups,1);assert(!JSON.stringify(committed.snapshot).includes('Synthetic private note'));
  const replay=await player.evaluate(c=>window.pptxTransport.send(c),checkpoint);assert.deepEqual(replay,committed);
  for(const [name,p,expected]of[['editor',editor,'FORBIDDEN'],['remote',remote,'FORBIDDEN'],['other-session',other,'FORBIDDEN']]){
    const before=await teacher(),result=await send(p,{type:'SESSION_COMMAND',command:{...checkpoint,commandId:'forbidden-finish-'+name}});assert.equal(result.code,expected);assert.deepEqual(await teacher(),before);report.denied[name+'Complete']=result.code;
  }
  const blocked=await send(duplicate,{type:'SESSION_COMMAND',command:await command('CHECKPOINT_PPTX_GROUP',{...checkpoint,revision:(await teacher()).revision,commandId:'duplicate-finish'})});assert.equal(blocked.code,'NOT_PLAYER_OWNER');report.denied.duplicateComplete=blocked.code;
  const beforeRestart=await teacher(),cdp=await context.newCDPSession(launcher);let versions=[];const transitions=[];
  cdp.on('ServiceWorker.workerVersionUpdated',event=>{versions=event.versions;transitions.push(...event.versions.filter(version=>version.scriptURL===origin+'/background.js').map(version=>version.runningStatus));});await cdp.send('ServiceWorker.enable');
  const deadline=Date.now()+5000;while(!versions.some(version=>version.scriptURL===origin+'/background.js'&&version.runningStatus==='running')&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,50));
  const own=versions.find(version=>version.scriptURL===origin+'/background.js'&&version.runningStatus==='running');assert(own);transitions.length=0;await cdp.send('ServiceWorker.stopWorker',{versionId:own.versionId});
  const restartedDeadline=Date.now()+15000;let retained;
  while(Date.now()<restartedDeadline){retained=await send(player,{type:'CLAIM_PLAYER',sessionId}).catch(()=>null);if(retained?.owned&&transitions.includes('stopped')&&transitions.at(-1)==='running')break;await new Promise(resolve=>setTimeout(resolve,250));}
  assert(retained?.owned);assert(transitions.includes('stopped')&&transitions.at(-1)==='running');assert.deepEqual(await teacher(),beforeRestart);
  assert.equal((await send(duplicate,{type:'SESSION_COMMAND',command:await command('BEGIN_PPTX_GROUP')})).code,'NOT_PLAYER_OWNER');
  assert.deepEqual(await player.evaluate(c=>window.pptxTransport.send(c),checkpoint),committed);report.workerRestart={transitions,ownerRetained:true,checkpointRetained:true,duplicateDenied:true};await cdp.detach();
  const nextBegin=await command('BEGIN_PPTX_GROUP');assert((await player.evaluate(c=>window.pptxTransport.send(c),nextBegin)).ok);
  for(const documentId of ['B','A'])await commitPresentationContract(remote,player,documentId);
  await player.evaluate(()=>window.refreshPptx());const late=structuredClone(checkpoint);late.revision=(await teacher()).revision;late.commandId='late';late.epoch=nextBegin.commandId;late.checkpoint.completedGroups=2;late.checkpoint.pose.scope.revision=late.revision;
  const stale=await send(player,{type:'SESSION_COMMAND',command:late});assert.equal(stale.code,'INVALID_TARGET');report.late=stale.code;
  const reset=await command('RESET_PPTX_SLIDE');assert.equal((await send(player,{type:'SESSION_COMMAND',command:reset})).code,'FORBIDDEN');assert((await send(remote,{type:'SESSION_COMMAND',command:reset})).ok);
  assert.deepEqual((await teacher()).documents.A.pptxPlayback,{checkpoints:{},run:null});
  await player.close();await waitForBrowserState(duplicate,async id=>{const result=await(window.whale??chrome).runtime.sendMessage({type:'CLAIM_PLAYER',sessionId:id});return result.owned===true;},sessionId);
  const takeover=await command('BEGIN_PPTX_GROUP');assert((await send(duplicate,{type:'SESSION_COMMAND',command:takeover})).ok);report.takeover=true;
  report.revision=(await teacher()).revision;report.userAgent=await duplicate.evaluate(()=>navigator.userAgent);report.transportAck=true;report.duplicateReceipt=true;report.reset=true;
  const realCreated=await send(launcher,{type:'CREATE_SESSION',title:'Synthetic actual runtime effects'});assert(realCreated.ok);const realId=realCreated.session.id;
  const realEditor=await page('editor',realId),realRemote=await page('remote',realId),realPlayer=await page('player',realId);await realPlayer.setViewportSize({width:1000,height:600});
  const original=await realEditor.evaluate(async id=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('webppt.js')),product=await import(runtime.runtime.getURL('pptx-test.js'));return product.rememberPptxRuntimeSource(id,{...api,...product});},realId);
  const mount=async p=>p.evaluate(async({id,documentState})=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('webppt.js')),product=await import(runtime.runtime.getURL('pptx-test.js'));window.runtimeRenderer=await product.mountPptxRuntimeRenderer(id,{...api,...product},documentState);return window.runtimeRenderer.metadata;},{id:realId,documentState:original.prepared.document});
  const metadata=await mount(realPlayer);assert.equal(metadata.count,2);assert.equal((await send(realPlayer,{type:'CLAIM_PLAYER',sessionId:realId})).owned,true);
  report.modelPreflight=await realPlayer.evaluate(()=>window.runtimeRenderer.inspection);assert.deepEqual(report.modelPreflight.items.filter(item=>item.status==='pass').map(item=>item.id),['pptx-model']);assert.equal(report.modelPreflight.items.find(item=>item.id==='pptx-animation').status,'warning');
  const realTeacher=async()=>{const result=await send(realEditor,{type:'GET_SESSION',sessionId:realId});assert(result.ok);return result.session;};
  const realCommand=async(type,extra={})=>({type,sessionId:realId,documentId:prepared.document.id,slideId:prepared.document.slideIds[0],revision:(await realTeacher()).revision,commandId:'real-'+(++id),...extra});
  const prepared=original.prepared;assert.equal(prepared.reused,false);assert.equal(prepared.document.knownSlideCount,2);assert.equal(new Set(prepared.document.slideIds).size,2);
  assert((await send(realEditor,{type:'SESSION_COMMAND',command:await realCommand('REGISTER_DOCUMENT',{documentId:prepared.document.id,slideId:null,document:prepared.document})})).ok);
  assert.deepEqual((await realTeacher()).documents[prepared.document.id],prepared.document);
  const orderEvidence=await realEditor.evaluate(async()=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('webppt.js')),product=await import(runtime.runtime.getURL('pptx-test.js')),seed=new Uint8Array(await(await fetch(runtime.runtime.getURL('synthetic-seed.pptx'))).arrayBuffer()),checked=await api.readPptxPackageIsolated(seed);return product.probePptxSlideOrder(checked.files,product.readPptxSlideOrder);});
  assert.equal(orderEvidence.rejected.length,9);assert.deepEqual(orderEvidence.original,['ppt/slides/slide1.xml','ppt/slides/slide2.xml']);
  const modelOrder=await realEditor.evaluate(async session=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('webppt.js')),product=await import(runtime.runtime.getURL('pptx-test.js'));return product.probePptxModelOrder({...api,...product},session);},await realTeacher());
  assert.deepEqual(modelOrder[0].slides.map(slide=>[slide.title,slide.table,slide.groups]),[['A',false,5],['B',true,0]]);
  assert.deepEqual(modelOrder[1].slides.map(slide=>[slide.title,slide.table,slide.groups]),[['B',true,0],['A',false,5]]);
  assert.deepEqual(modelOrder[1].slides.map(slide=>slide.sourcePart),[...modelOrder[0].slides.map(slide=>slide.sourcePart)].reverse());
  for(const documentId of ['B']){const document=doc(documentId);document.source.fingerprint=metadata.fingerprint;document.source.size=metadata.size;
    assert((await send(realEditor,{type:'SESSION_COMMAND',command:await realCommand('REGISTER_DOCUMENT',{documentId,slideId:null,document})})).ok);}
  await commitPresentationContract(realRemote,realPlayer,prepared.document.id);
  await realPlayer.evaluate(()=>window.runtimeRenderer.restore());const results=[];for(let i=0;i<3;i++)results.push(await realPlayer.evaluate(()=>window.runtimeRenderer.play()));
  assert(results.every(result=>result.outcome==='completed'));assert.equal(results[2].checkpoint,3);assert.equal(results[2].rotation.b,1);
  await realPlayer.evaluate(()=>window.runtimeRenderer.invalidate());for(const documentId of ['B',prepared.document.id])await commitPresentationContract(realRemote,realPlayer,documentId);
  const returned=await realPlayer.evaluate(()=>window.runtimeRenderer.restore());assert.deepEqual(returned.rotation,results[2].rotation);assert.equal(returned.checkpoint,3);
  for(let i=0;i<2;i++)results.push(await realPlayer.evaluate(()=>window.runtimeRenderer.play()));const completed=results[4];assert.equal(completed.checkpoint,5);assert.equal(completed.motion.e,320);assert.equal(completed.scale.a,1.5);assert.equal(completed.scale.d,.5);assert(completed.hidden);
  const stored=(await realTeacher()).documents[prepared.document.id].pptxPlayback.checkpoints[prepared.document.slideIds[0]];assert.equal(stored.completedGroups,5);assert.equal(stored.fingerprint,metadata.fingerprint);
  await realPlayer.screenshot({path:resolve(output,'runtime-effects-completed.png')});await realPlayer.evaluate(()=>window.runtimeRenderer.dispose());await realPlayer.close();
  const reloaded=await page('player',realId);await reloaded.setViewportSize({width:1000,height:600});assert.equal((await send(reloaded,{type:'CLAIM_PLAYER',sessionId:realId})).owned,true);assert.deepEqual(await mount(reloaded),metadata);
  const restored=await reloaded.evaluate(()=>window.runtimeRenderer.restore());for(const key of ['checkpoint','rotation','motion','scale','hidden'])assert.deepEqual(restored[key],completed[key]);
  await reloaded.screenshot({path:resolve(output,'runtime-effects-reloaded.png')});await reloaded.evaluate(()=>window.runtimeRenderer.dispose());
  await reloaded.evaluate(async()=>{const api=await import((window.whale??chrome).runtime.getURL('pptx-test.js'));api.pptxSourceVault().close();});
  const beforeSpoof=await realTeacher();
  await realEditor.evaluate(async({id,documentId,fingerprint})=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('pptx-test.js'));const file=new File([new Uint8Array([0x50,0x4b,3,4]),'Synthetic changed source'],'Synthetic.pptx');await api.pptxSourceVault().remember(api.sourceKey(id,documentId),file,fingerprint);},{id:realId,documentId:prepared.document.id,fingerprint:original.fingerprint});
  const sourceProbe=await page('player',realId);
  const changed=await sourceProbe.evaluate(async({id,documentId,fingerprint})=>{const api=await import((window.whale??chrome).runtime.getURL('pptx-test.js'));try{await api.pptxSourceVault().get(api.sourceKey(id,documentId),fingerprint);return false;}catch(error){return error.message.includes('바뀌었습니다');}},{id:realId,documentId:prepared.document.id,fingerprint:original.fingerprint});
  assert(changed);assert.deepEqual(await realTeacher(),beforeSpoof);await sourceProbe.close();
  const originalAgain=await realEditor.evaluate(async id=>{const runtime=window.whale??chrome,api=await import(runtime.runtime.getURL('webppt.js')),product=await import(runtime.runtime.getURL('pptx-test.js'));return product.rememberPptxRuntimeSource(id,{...api,...product});},realId);assert.equal(originalAgain.fingerprint,original.fingerprint);assert.equal(originalAgain.size,original.size);assert.equal(originalAgain.prepared.reused,true);assert.equal(originalAgain.prepared.document.id,prepared.document.id);
  assert.equal(metadata.fingerprint,original.fingerprint);assert.equal(metadata.size,original.size);
  report.registration={preparedRegistered:true,slideCount:prepared.document.knownSlideCount,preflight:prepared.preflight,reconnectedSameId:true,orderEvidence,modelOrder};
  if(teacherBytes){
    await realEditor.evaluate(()=>{const input=document.createElement('input');input.type='file';input.id='local-teacher-fixture';input.hidden=true;document.body.append(input);});
    await realEditor.locator('#local-teacher-fixture').setInputFiles(teacherPath);
    const beforeTeacher=await realTeacher();
    report.teacherRegistration=await realEditor.evaluate(async id=>{
      const runtime=window.whale??chrome,product=await import(runtime.runtime.getURL('pptx-test.js')),candidate=await import(runtime.runtime.getURL('webppt.js')),api={...candidate,...product},input=document.querySelector('#local-teacher-fixture'),file=input.files[0],session=(await runtime.runtime.sendMessage({type:'GET_SESSION',sessionId:id})).session,result=await api.preparePptxImport(file,session,api.pptxSourceVault()),source=await api.readPptxInput(file),checked=await api.readPptxPackageIsolated(source.bytes),model=await api.parsePptxFixture(api,source.bytes);
      try{const parts=api.readPptxSlideOrder(checked.files),binding=api.bindPptxSlideModel(result.document,source.fingerprint,parts,model),safety=api.inspectPptxXml(checked.files);return {slideCount:result.document.knownSlideCount,uniqueIds:new Set(result.document.slideIds).size,fingerprint:result.document.source.fingerprint,preflightItems:result.preflight.items,workerModelCount:model.slides.length,boundCount:binding.count,firstIndex:binding.get(result.document.slideIds[0]).index,lastIndex:binding.get(result.document.slideIds.at(-1)).index,modelSummary:api.inspectPptxModel(model),modelPreflight:api.pptxModelPreflight(result.document,source.fingerprint,parts,model,safety,Date.now())};}finally{model.dispose?.();input.remove();}
    },realId);
    assert.equal(report.teacherRegistration.fingerprint,teacherHash);assert.equal(report.teacherRegistration.slideCount,23);assert.equal(report.teacherRegistration.uniqueIds,23);assert.deepEqual(await realTeacher(),beforeTeacher);
    assert.equal(report.teacherRegistration.workerModelCount,23);assert.equal(report.teacherRegistration.boundCount,23);assert.equal(report.teacherRegistration.firstIndex,0);assert.equal(report.teacherRegistration.lastIndex,22);
    assert.equal(report.teacherRegistration.modelSummary.animationSlides,4);assert.equal(report.teacherRegistration.modelSummary.animationSteps,12);assert.deepEqual(report.teacherRegistration.modelPreflight.items.filter(item=>item.status==='pass').map(item=>item.id),['pptx-model']);
    assert.equal(createHash('sha256').update(await readFile(teacherPath)).digest('hex'),teacherHash);report.teacherRegistration.originalUnchanged=true;
  }
  report.actualRenderer={metadata,totalGroups:completed.groups,results,returned,storedGroups:stored.completedGroups,registeredUuidBinding:true,newPlayerParsedAgain:true,editorSourceChannel:true,sourceRehashed:true,changedChannelSourceRejected:true,sessionUnchangedAfterSourceFailure:true,restored};report.renderedPptx=true;
  await writeFile(resolve(output,'result.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await context?.close();}
