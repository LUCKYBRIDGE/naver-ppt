import { IndexedDbSourceHandles, SourceVault } from '../../storage/sourceVault';
import { readPptxInput } from './input';
import { withPptxPreparation } from './preparationAdmission';
import { consumePrivateBuffer } from '../../shared/privateBuffer';

export function readPptxSourceIdentity(file: File, signal?: AbortSignal) {
  return withPptxPreparation(signal, async () => {
    const input = await readPptxInput(file, signal);
    try { return { fingerprint: input.fingerprint }; }
    finally { consumePrivateBuffer(input.bytes.buffer as ArrayBuffer); }
  });
}

let singleton: SourceVault | undefined;
export function pptxSourceVault() {
  return singleton ??= new SourceVault(new IndexedDbSourceHandles(), new BroadcastChannel('naver-ppt-pptx-source-v1'), readPptxSourceIdentity);
}
