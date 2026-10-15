// Uses guarded synthetic source bytes, the real Worker model, engine and strict DB.
export async function probePptxDurable(bytes, api, host, restoreSessionId) {
  const fingerprint=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  const model=await api.parseWorker(bytes),root=document.createElement('div');root.style.cssText='width:960px;height:540px;position:relative';host.append(root);
  const sessionId=restoreSessionId??'durable-'+crypto.randomUUID(),session=api.createSession(sessionId,'Synthetic durable effects',1),slideIds=model.slides.map((_,i)=>'slide-'+(i+1));
  for(const id of ['A','B'])session.documents[id]={id,source:{type:'pptx',name:'Synthetic.pptx',size:bytes.byteLength,lastModified:0,fingerprint},lastSlideId:slideIds[0],knownSlideCount:slideIds.length,slideIds,slideDeltas:{},mediaBookmarks:{},dirty:false};
  session.documentOrder=['A','B'];session.presentedSelection={documentId:'A',slideId:slideIds[0]};
  const open=()=>api.IndexedDbSessionRepository.open(),repo=await open();if(!restoreSessionId)await repo.create(session);const initial=(await repo.read(sessionId)).session;repo.close();
  const hub=new api.SessionHub(open,()=>{}),xml=new TextDecoder().decode(api.unzipSync(bytes)['ppt/slides/slide1.xml']);
  let snapshot=api.toPlayerSnapshot(initial),state,failNext=false,holdNext=false,release,ready,id=0;
  const paint=()=>{const svg=api.parseDisplaySvg(api.renderSlideToSvg(model,state.slide,{textMode:'html',media:'badge'}),api.ownedUrls);svg.style.width='100%';svg.style.height='100%';root.replaceChildren(svg);visible();};
  const visible=()=>{for(const node of root.querySelectorAll('[data-el]'))node.style.visibility=state.hiddenElementIds.has(Number(node.getAttribute('data-el')))?'hidden':'';};
  const identity={sessionId,documentId:'A',slideId:'slide-1',fingerprint},targets=model.slides[0].animations.map(step=>step.target);
  state=new api.PresentationState(model,{animate:true,autoAdvance:false});const totalGroups=state.animationTotal;
  const driver={totalGroups,targets,restore(done){state.destroy();state=new api.PresentationState(model,{animate:true,autoAdvance:false});for(let i=0;i<done;i++)if(!state.playNextAnimation())throw Error('PPTX_DURABLE_CURSOR');paint();},next(){
    const group=state.playNextAnimation();if(!group)throw Error('PPTX_DURABLE_GROUP');
    return {start(){const rotations=api.bindPptxRotations(xml,state.slide.animations),scales=api.bindPptxScales(xml,state.slide.animations),sources=new Map([...rotations,...scales]);return api.playPptxRepeatedGroup(root,group,sources,projected=>api.playPptxRotationGroup(root,group,rotations,()=>api.playPptxScaleGroup(root,group,scales,()=>api.playGroup(root,projected))));},complete:visible};
  }};
  const transport={snapshot:()=>snapshot,newId:()=> 'durable-command-'+(++id),async send(command){
    if(failNext&&command.type==='CHECKPOINT_PPTX_GROUP'){failNext=false;return {ok:false};}
    const response=await hub.handle('player',{type:'SESSION_COMMAND',command});if(!response.ok||response.kind!=='player')return {ok:false};snapshot=response.snapshot;
    if(holdNext&&command.type==='CHECKPOINT_PPTX_GROUP'){holdNext=false;ready?.();await new Promise(resolve=>{release=resolve;});}
    return {ok:true,snapshot:response.snapshot};
  }};
  const bridge=new api.PptxDurablePlayback(root,driver,transport,identity),matrix=target=>{const m=new DOMMatrix(getComputedStyle(root.querySelector('[data-el="'+target+'"]')).transform);return {a:m.a,b:m.b,d:m.d,e:m.e};};
  const remote=async command=>{const result=await hub.handle('remote',{type:'SESSION_COMMAND',command:{sessionId,documentId:'A',slideId:null,revision:snapshot.revision,commandId:'remote-'+(++id),...command}});if(!result.ok)throw Error('PPTX_DURABLE_REMOTE');snapshot=api.toPlayerSnapshot(result.session);};
  try{
    if(restoreSessionId){bridge.restore();return {fingerprint,totalGroups,completedGroups:snapshot.pptx.checkpoint.completedGroups,restored:{rotation:matrix(3),motion:matrix(4),scale:matrix(5),hidden:getComputedStyle(root.querySelector('[data-el="2"]')).visibility==='hidden'},isBusy:bridge.isBusy};}
    bridge.restore();const outcomes=[];
    for(let i=0;i<3;i++)outcomes.push(await bridge.play());const rotation=matrix(3),completedBefore=snapshot.pptx.checkpoint.completedGroups;
    bridge.invalidate();await remote({type:'ACTIVATE_DOCUMENT',documentId:'B'});await remote({type:'ACTIVATE_DOCUMENT',documentId:'A'});bridge.restore();const returned=matrix(3);
    failNext=true;let failure;try{await bridge.play();}catch(error){failure=error.message;}const rollback={done:state.animationDone,saved:snapshot.pptx.checkpoint.completedGroups,motion:matrix(4)};
    outcomes.push(await bridge.play());const motion=matrix(4);
    holdNext=true;const pendingReady=new Promise(resolve=>{ready=resolve;}),pending=bridge.play();await pendingReady;const busy=await bridge.play();release();outcomes.push(await pending);
    const scale=matrix(5),exhausted=await bridge.play(),completed=snapshot.pptx.checkpoint;
    bridge.invalidate();const reconnect=await open();const record=await reconnect.read(sessionId);reconnect.close();snapshot=api.toPlayerSnapshot(record.session);bridge.restore();
    const restored={rotation:matrix(3),motion:matrix(4),scale:matrix(5),hidden:getComputedStyle(root.querySelector('[data-el="2"]')).visibility==='hidden'};
    return {sessionId,fingerprint,totalGroups,targetIds:[...new Set(targets)],outcomes,completedBefore,rotation,returned,failure,rollback,motion,busy,scale,exhausted,completedGroups:completed.completedGroups,dbGroups:record.session.documents.A.pptxPlayback.checkpoints['slide-1'].completedGroups,restored,revision:record.session.revision,receipts:record.receipts.length};
  }finally{bridge.invalidate();state.destroy();model.dispose?.();root.remove();}
}
