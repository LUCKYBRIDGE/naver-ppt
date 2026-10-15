// The input is the generated synthetic-effects variant, never a teacher file.
export async function probePptxRepeats(bytes, api, host) {
  const p='http://schemas.openxmlformats.org/presentationml/2006/main',decoder=new TextDecoder(),encoder=new TextEncoder(),files=api.unzipSync(bytes);
  const cases=[
    {name:'rotation-repeat',tag:'animRot',count:'2000',reverse:'false',active:400,iterations:2,direction:'normal'},
    {name:'rotation-reverse',tag:'animRot',count:null,reverse:'true',active:400,iterations:2,direction:'alternate'},
    {name:'rotation-fractional',tag:'animRot',count:'2500',reverse:'0',active:500,iterations:2.5,direction:'normal'},
    {name:'rotation-repeat-reverse',tag:'animRot',count:'2000',reverse:'1',active:800,iterations:4,direction:'alternate'},
    {name:'effect-repeat',tag:'animRot',count:'2000',reverse:'false',owner:'effect',active:400,iterations:2,direction:'normal'},
    {name:'scale-repeat-reverse',tag:'animScale',count:'2000',reverse:'true',active:800,iterations:4,direction:'alternate'},
  ];
  const results=[];
  for(const spec of cases){
    const xml=new DOMParser().parseFromString(decoder.decode(files['ppt/slides/slide1.xml']),'application/xml'),behavior=xml.getElementsByTagNameNS(p,spec.tag)[0];
    const effect=behavior.parentElement.parentElement,owner=spec.owner==='effect'?effect:behavior.getElementsByTagNameNS(p,'cTn')[0];
    if(spec.count!==null)owner.setAttribute('repeatCount',spec.count);owner.setAttribute('autoRev',spec.reverse);
    if(spec.name==='effect-repeat'){owner.setAttribute('accel','0');owner.setAttribute('decel','0%');}
    for(const [tag,delay]of [['animMotion','30'],['animScale','50']]){const node=xml.getElementsByTagNameNS(p,tag)[0].parentElement.parentElement;node.setAttribute('nodeType','afterEffect');node.getElementsByTagNameNS(p,'cond')[0].setAttribute('delay',delay);}
    const sourceXml=new XMLSerializer().serializeToString(xml),variant=api.zipSync({...files,'ppt/slides/slide1.xml':encoder.encode(sourceXml)},{mtime:new Date('2000-01-01T00:00:00Z')});
    const checked=await api.readPptxPackageIsolated(variant);api.inspectPptxXml(checked.files);
    const model=await api.parseWorker(variant),state=new api.PresentationState(model,{animate:true,autoAdvance:false}),root=document.createElement('div');root.style.cssText='width:960px;height:540px;position:relative';host.append(root);
    let runs;
    try{
      state.playNextAnimation();state.playNextAnimation();const group=state.playNextAnimation();
      if(!group||group.length!==3)throw Error('PPTX_REPEAT_PROBE_GROUP');
      const paint=()=>{const svg=api.parseDisplaySvg(api.renderSlideToSvg(model,state.slide,{textMode:'html',media:'badge'}),api.ownedUrls);svg.style.width='100%';svg.style.height='100%';root.replaceChildren(svg);for(const node of root.querySelectorAll('[data-el]'))node.style.visibility=state.hiddenElementIds.has(Number(node.getAttribute('data-el')))?'hidden':'';};paint();
      const rotations=api.bindPptxRotations(sourceXml,state.slide.animations),scales=api.bindPptxScales(sourceXml,state.slide.animations),sources=new Map([...rotations,...scales]);
      const timingRejected=[];
      if(spec.name==='effect-repeat'){
        for(const [location,attribute,value] of [['behavior','accel','50000'],['effect','decel','50000'],['ancestor','accel','1'],['behavior','accel','NaN'],['behavior','decel','-1'],['effect','accel',''],['behavior','spd','100000'],['effect','tmFilter','0,0;1,1'],['ancestor','decel','1%']]){
          const changed=new DOMParser().parseFromString(sourceXml,'application/xml'),rotation=changed.getElementsByTagNameNS(p,'animRot')[0],node=location==='behavior'?rotation.getElementsByTagNameNS(p,'cTn')[0]:location==='effect'?rotation.parentElement.parentElement:changed.getElementsByTagNameNS(p,'cTn')[0];
          node.setAttribute(attribute,value);let rejected=false;
          try{api.bindPptxRotations(new XMLSerializer().serializeToString(changed),state.slide.animations);}catch(error){if(error.message!=='PPTX_ROTATION_UNVERIFIED')throw error;rejected=true;}
          if(!rejected)throw Error('PPTX_LINEAR_BOUNDARY_ACCEPTED');timingRejected.push(location+':'+attribute+':'+value);
        }
      }
      const start=()=>api.playPptxRepeatedGroup(root,group,sources,projected=>api.playPptxRotationGroup(root,group,rotations,()=>api.playPptxScaleGroup(root,group,scales,()=>api.playGroup(root,projected))));
      const playback=start(),animations=root.getAnimations({subtree:true}),selectedStep=group.find(step=>sources.get(step)?.repeat),selected=animations.find(item=>item.effect.target.getAttribute('data-el')===String(selectedStep.target));
      const timings=group.map(step=>{const animation=animations.find(item=>item.effect.target.getAttribute('data-el')===String(step.target)),timing=animation.effect.getTiming(),computed=animation.effect.getComputedTiming();return {target:step.target,duration:timing.duration,delay:timing.delay,iterations:timing.iterations,direction:timing.direction,activeDuration:computed.activeDuration,endTime:computed.endTime};});
      selected.pause();const samples=[];
      for(const local of [50,100,250,300]){selected.currentTime=selected.effect.getTiming().delay+local;const computed=selected.effect.getComputedTiming(),matrix=new DOMMatrix(getComputedStyle(selected.effect.target).transform);samples.push({local,iteration:computed.currentIteration,progress:computed.progress,a:matrix.a,b:matrix.b,d:matrix.d});}
      selected.play();await playback.finished;
      const finalProgress=selected.effect.getComputedTiming().progress,finalMatrix=new DOMMatrix(getComputedStyle(selected.effect.target).transform),end={progress:finalProgress,a:finalMatrix.a,b:finalMatrix.b,d:finalMatrix.d};
      const scope={sessionId:'repeat-probe',documentId:spec.name,slideId:'slide-1',revision:0},pose=api.capturePptxAnimationPose(root,scope,group.map(step=>step.target));paint();api.applyPptxAnimationPose(root,pose,scope);
      const restored=new DOMMatrix(getComputedStyle(root.querySelector('[data-el="'+selectedStep.target+'"]')).transform);
      let commits=0;runs=new api.PptxAnimationRuns(root);runs.invalidate();paint();const pending=runs.play(start,()=>commits++),owned=root.getAnimations({subtree:true});runs.invalidate();const outcome=await pending;
      results.push({name:spec.name,tag:spec.tag,expected:spec,timings,timingRejected,samples,end,restored:{a:restored.a,b:restored.b,d:restored.d},cancel:{outcome,commits,allIdle:owned.every(item=>item.playState==='idle')}});
    }finally{runs?.invalidate();for(const animation of root.getAnimations({subtree:true}))animation.cancel();state.destroy();model.dispose?.();root.remove();}
  }
  return results;
}
