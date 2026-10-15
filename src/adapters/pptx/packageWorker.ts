import { readPptxPackage } from './packageGuard';

globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  try {
    if (!(event.data instanceof Uint8Array)) throw new Error('PPTX_INVALID_PACKAGE');
    const result = readPptxPackage(event.data);
    const transfer = [...new Set(Object.values(result.files).map(bytes => bytes.buffer as ArrayBuffer))];
    globalThis.postMessage({ ok: true, result }, { transfer });
  } catch (error) {
    const code = error instanceof Error && /^PPTX_[A-Z_]+$/.test(error.message) ? error.message : 'PPTX_INVALID_PACKAGE';
    globalThis.postMessage({ ok: false, code });
  }
});
