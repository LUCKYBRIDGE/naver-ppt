// Synthetic OOXML vocabulary probe, not a repair of any teacher original.
export function addSyntheticPptxEffects(bytes, zip) {
  const files=zip.unzipSync(new Uint8Array(bytes)),decoder=new TextDecoder(),encoder=new TextEncoder();
  const p='http://schemas.openxmlformats.org/presentationml/2006/main';
  const slide=new DOMParser().parseFromString(decoder.decode(files['ppt/slides/slide1.xml']),'application/xml');
  if(slide.getElementsByTagName('parsererror').length)throw Error('INVALID_SYNTHETIC_XML');
  const shapes=[...slide.getElementsByTagNameNS(p,'sp')],ids=shapes.slice(0,3).map(shape=>shape.getElementsByTagNameNS(p,'cNvPr')[0]?.getAttribute('id'));
  if(ids.length!==3||ids.some(id=>!/^\d+$/.test(id??'')))throw Error('EXPECTED_THREE_SYNTHETIC_SHAPES');
  const imageId=slide.getElementsByTagNameNS(p,'pic')[0]?.getElementsByTagNameNS(p,'cNvPr')[0]?.getAttribute('id');
  if(!/^\d+$/.test(imageId??''))throw Error('EXPECTED_SYNTHETIC_IMAGE');
  // Keep this synthetic rotation target inside the slide at both 0 and 90 degrees.
  const a='http://schemas.openxmlformats.org/drawingml/2006/main',frame=shapes[1].getElementsByTagNameNS(a,'xfrm')[0],offset=frame?.getElementsByTagNameNS(a,'off')[0],extent=frame?.getElementsByTagNameNS(a,'ext')[0];
  if(!offset||!extent)throw Error('EXPECTED_SYNTHETIC_TRANSFORM');
  offset.setAttribute('x','7315200');offset.setAttribute('y','2286000');extent.setAttribute('cx','2743200');extent.setAttribute('cy','640080');
  for(const node of [...slide.getElementsByTagNameNS(p,'timing')])node.remove();
  const node=(name,attributes={},parent)=>{const element=slide.createElementNS(p,'p:'+name);for(const [key,value]of Object.entries(attributes))element.setAttribute(key,String(value));parent?.append(element);return element;};
  const timing=node('timing',{},slide.documentElement),list=node('tnLst',{},timing),par=node('par',{},list),root=node('cTn',{id:1,dur:'indefinite',nodeType:'tmRoot'},par),children=node('childTnLst',{},root);
  const sequence=node('seq',{concurrent:1,nextAc:'seek'},children),main=node('cTn',{id:2,dur:'indefinite',nodeType:'mainSeq'},sequence),steps=node('childTnLst',{},main);
  const specs=[
    {kind:'entr',preset:10,target:ids[0],tag:'animEffect',attributes:{transition:'in',filter:'fade'},duration:200},
    {kind:'exit',preset:10,target:ids[0],tag:'animEffect',attributes:{transition:'out',filter:'fade'},duration:200},
    {kind:'emph',preset:24,target:ids[1],tag:'animRot',attributes:{by:5400000},duration:200},
    {kind:'path',preset:0,target:ids[2],tag:'animMotion',attributes:{origin:'layout',path:'M 0 0 L 0.25 0 E',pathEditMode:'relative'},duration:300},
    {kind:'emph',preset:6,target:imageId,tag:'animScale',attributes:{},duration:200},
  ];
  specs.forEach((spec,index)=>{const container=node('par',{},steps),time=node('cTn',{id:10+index*2,presetClass:spec.kind,presetID:spec.preset,nodeType:'clickEffect',fill:'hold'},container);
    node('cond',{delay:0},node('stCondLst',{},time));const behavior=node(spec.tag,spec.attributes,node('childTnLst',{},time)),common=node('cBhvr',{},behavior);
    node('cTn',{id:11+index*2,dur:spec.duration,fill:'hold'},common);node('spTgt',{spid:spec.target},node('tgtEl',{},common));
    if(spec.tag==='animRot')node('attrName',{},node('attrNameLst',{},common)).textContent='r';
    if(spec.tag==='animScale'){const names=node('attrNameLst',{},common);node('attrName',{},names).textContent='ScaleX';node('attrName',{},names).textContent='ScaleY';node('by',{x:150000,y:50000},behavior);}
    if(spec.tag==='animMotion'){const names=node('attrNameLst',{},common);node('attrName',{},names).textContent='ppt_x';node('attrName',{},names).textContent='ppt_y';}
  });
  files['ppt/slides/slide1.xml']=encoder.encode(new XMLSerializer().serializeToString(slide));
  return {bytes:zip.zipSync(files,{mtime:new Date('2000-01-01T00:00:00Z')}),targets:[...ids,imageId].map(Number),source:{rotationDegrees:90,motionFractionX:0.25,scale:{x:1.5,y:0.5},durations:[200,200,200,300,200]}};
}
