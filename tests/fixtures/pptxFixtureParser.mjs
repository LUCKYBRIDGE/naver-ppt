export async function parsePptxFixture(api, bytes) {
  const worker=new Worker((window.whale??chrome).runtime.getURL('candidate-worker.js'),{type:'module'}),listeners=new Map();let timer,abandoned=false;
  const port={postMessage:worker.postMessage.bind(worker),addEventListener(type,listener){listeners.set(listener,type);worker.addEventListener(type,listener);},removeEventListener(type,listener){listeners.delete(listener);worker.removeEventListener(type,listener);}};
  try{
    const failure=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('PPTX_PARSE_TIMEOUT')),15000);worker.onerror=()=>reject(Error('PPTX_PARSE_WORKER_ERROR'));worker.onmessageerror=()=>reject(Error('PPTX_PARSE_WORKER_MESSAGE_ERROR'));});
    const pending=api.parseInWorker(port,bytes);pending.then(model=>{if(abandoned)model.dispose?.();},()=>{});
    return await Promise.race([pending,failure]);
  }catch(error){abandoned=true;throw error;}
  finally{clearTimeout(timer);for(const[listener,type]of listeners)worker.removeEventListener(type,listener);listeners.clear();worker.onerror=null;worker.onmessageerror=null;worker.terminate();}
}
