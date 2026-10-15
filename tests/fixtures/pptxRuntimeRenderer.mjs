// Mounted only by the isolated native verifier, on the real product Player URL.
import { parsePptxFixture } from './pptxFixtureParser.mjs';
export async function rememberPptxRuntimeSource(sessionId, api) {
  const runtime=window.whale??chrome,seed=new Uint8Array(await(await fetch(runtime.runtime.getURL('synthetic-seed.pptx'))).arrayBuffer());
  const bytes=api.addSyntheticPptxEffects(seed,{unzipSync:api.unzipSync,zipSync:api.zipSync}).bytes;
  const file=new File([bytes],'Synthetic.pptx',{lastModified:0}),input=await api.readPptxInput(file);
  const session=(await runtime.runtime.sendMessage({type:'GET_SESSION',sessionId})).session;
  const prepared=await api.preparePptxImport(file,session,api.pptxSourceVault());
  return {fingerprint:input.fingerprint,size:file.size,prepared};
}
export async function mountPptxRuntimeRenderer(sessionId, api, documentState) {
  const expectedFingerprint=documentState.source.fingerprint,slideId=documentState.slideIds[0];
  const runtime=window.whale??chrome,source=await api.pptxSourceVault().get(api.sourceKey(sessionId,documentState.id),expectedFingerprint);
  const {bytes,fingerprint}=await api.readPptxInput(source.file);
  if(fingerprint!==expectedFingerprint)throw Error('PPTX_RUNTIME_SOURCE_MISMATCH');
  const checked=await api.readPptxPackageIsolated(bytes),safety=api.inspectPptxXml(checked.files);
  const ownedUrls=new Set(),previousCreate=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{const url=previousCreate(blob);ownedUrls.add(url);return url;};
  let model;
  try{model=await parsePptxFixture(api,bytes);}finally{URL.createObjectURL=previousCreate;}
  const root=document.createElement('div');root.id='runtime-renderer';root.style.cssText='position:fixed;top:0;left:0;width:960px;height:540px;background:white;z-index:1000';document.body.append(root);
  const selected=api.bindPptxSlideModel(documentState,fingerprint,api.readPptxSlideOrder(checked.files),model).get(slideId);
  const inspection=api.pptxModelPreflight(documentState,fingerprint,api.readPptxSlideOrder(checked.files),model,safety,Date.now());
  const xml=new TextDecoder().decode(checked.files[selected.sourcePart]);let snapshot=null;
  const visible=state=>{for(const node of root.querySelectorAll('[data-el]'))node.style.visibility=state.hiddenElementIds.has(Number(node.getAttribute('data-el')))?'hidden':'';};
  const engine=api.createPptxEngineDriver({root,sourceXml:xml,createState:()=>new api.PresentationState(model,{index:selected.index,skipHidden:false,animate:true,autoAdvance:false}),
    paint(state){const svg=api.parseDisplaySvg(api.renderSlideToSvg(model,state.slide,{textMode:'html',media:'badge',includeNotes:false}),ownedUrls);svg.style.width='100%';svg.style.height='100%';root.replaceChildren(svg);visible(state);},visible,playGroup:group=>api.playGroup(root,group)});
  const refresh=async()=>{const result=await runtime.runtime.sendMessage({type:'GET_SESSION',sessionId});if(!result.ok||result.kind!=='player')throw Error('PPTX_RUNTIME_SNAPSHOT');snapshot=result.snapshot;return snapshot;};
  const transport=api.createPptxPlayerTransport({sessionId,readSnapshot:()=>snapshot,receiveSnapshot:value=>{snapshot=value;}});
  const bridge=new api.PptxDurablePlayback(root,engine.driver,transport,{sessionId,documentId:documentState.id,slideId,fingerprint});
  const matrix=id=>{const m=new DOMMatrix(getComputedStyle(root.querySelector('[data-el="'+id+'"]')).transform);return {a:m.a,b:m.b,d:m.d,e:m.e};};
  const status=()=>({fingerprint,groups:engine.driver.totalGroups,checkpoint:snapshot?.pptx?.checkpoint?.completedGroups??0,busy:bridge.isBusy,
    rotation:matrix(3),motion:matrix(4),scale:matrix(5),hidden:getComputedStyle(root.querySelector('[data-el="2"]')).visibility==='hidden'});
  return {metadata:{fingerprint,size:bytes.length,count:model.slides.length},inspection,async restore(){await refresh();bridge.restore();return status();},
    async play(){await refresh();return {outcome:await bridge.play(),...status()};},invalidate(){bridge.invalidate();},status,
    dispose(){bridge.invalidate();engine.dispose();model.dispose?.();root.remove();for(const url of ownedUrls)URL.revokeObjectURL(url);}};
}
