import { parsePptxFixture } from './pptxFixtureParser.mjs';
export async function probePptxModelOrder(api, session) {
  const seed=new Uint8Array(await(await fetch((window.whale??chrome).runtime.getURL('synthetic-seed.pptx'))).arrayBuffer()),bytes=api.addSyntheticPptxEffects(seed,{unzipSync:api.unzipSync,zipSync:api.zipSync}).bytes;
  const files=api.unzipSync(bytes),key='ppt/presentation.xml',xml=new DOMParser().parseFromString(new TextDecoder().decode(files[key]),'application/xml'),list=xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/presentationml/2006/main','sldIdLst')[0];
  list.append(list.firstElementChild);const reordered=api.zipSync({...files,[key]:new TextEncoder().encode(new XMLSerializer().serializeToString(xml))});
  const results=[];
  for(const[source,label]of[[bytes,'original'],[reordered,'reordered']]){
    const file=new File([source],'Synthetic-order.pptx'),input=await api.readPptxInput(file),checked=await api.readPptxPackageIsolated(input.bytes);api.inspectPptxXml(checked.files);
    const prepared=await api.preparePptxImport(file,session,api.pptxSourceVault()),model=await parsePptxFixture(api,input.bytes);
    try{
      const binding=api.bindPptxSlideModel(prepared.document,input.fingerprint,api.readPptxSlideOrder(checked.files),model),slides=[];
      for(const id of prepared.document.slideIds){const selected=binding.get(id),svg=api.renderSlideToSvg(model,selected.slide,{includeNotes:false,textMode:'html',media:'badge'}),text=new DOMParser().parseFromString(svg,'image/svg+xml').documentElement.textContent??'',state=new api.PresentationState(model,{index:selected.index,animate:true,autoAdvance:false});
        try{slides.push({sourcePart:selected.sourcePart,title:text.includes('Synthetic lesson A')?'A':text.includes('Synthetic lesson B')?'B':'unknown',table:selected.slide.elements.some(element=>element.kind==='table'),groups:state.animationTotal});}finally{state.destroy();}}
      results.push({label,slides});
    }finally{model.dispose?.();}
  }
  return results;
}
