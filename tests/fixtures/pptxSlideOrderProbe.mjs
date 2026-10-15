export function probePptxSlideOrder(files, readOrder) {
  const main='ppt/presentation.xml',rels='ppt/_rels/presentation.xml.rels',p='http://schemas.openxmlformats.org/presentationml/2006/main',r='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const text=key=>new TextDecoder().decode(files[key]),parse=key=>new DOMParser().parseFromString(text(key),'application/xml'),encode=xml=>new TextEncoder().encode(new XMLSerializer().serializeToString(xml));
  const original=readOrder(files),reordered=parse(main),list=reordered.getElementsByTagNameNS(p,'sldIdLst')[0];list.append(list.firstElementChild);
  const order=readOrder({...files,[main]:encode(reordered)});
  if(JSON.stringify(order)!==JSON.stringify([...original.slice(1),original[0]]))throw Error('PPTX_ORDER_NOT_FROM_MANIFEST');
  const cases=['duplicate-id','duplicate-link','missing-part','external','wrong-type','outside','empty','invalid-id','wrong-namespace'],rejected=[];
  for(const name of cases){
    const variants={...files},presentation=parse(main),relationships=parse(rels),slides=[...presentation.getElementsByTagNameNS(p,'sldId')],firstLink=slides[0].getAttributeNS(r,'id'),reference=[...relationships.documentElement.children].find(node=>node.getAttribute('Id')===firstLink);
    if(name==='duplicate-id')slides[1].setAttribute('id',slides[0].getAttribute('id'));
    if(name==='duplicate-link')slides[1].setAttributeNS(r,'r:id',firstLink);
    if(name==='missing-part')delete variants[original[0]];
    if(name==='external')reference.setAttribute('TargetMode','External');
    if(name==='wrong-type')reference.setAttribute('Type',r+'/notesSlide');
    if(name==='outside')reference.setAttribute('Target','../../../outside.xml');
    if(name==='empty')presentation.getElementsByTagNameNS(p,'sldIdLst')[0].replaceChildren();
    if(name==='invalid-id')slides[0].setAttribute('id','255');
    if(name==='wrong-namespace')variants[original[0]]=new TextEncoder().encode('<sld xmlns="urn:invalid"/>');
    variants[main]=encode(presentation);variants[rels]=encode(relationships);
    try{readOrder(variants);throw Error('PPTX_ORDER_ATTACK_ACCEPTED:'+name);}catch(error){if(error.message!=='PPTX_INVALID_SLIDE_ORDER')throw error;rejected.push(name);}
  }
  return {original,reordered:order,rejected};
}
