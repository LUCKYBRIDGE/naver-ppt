import { describe, expect, it } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { readPptxPackage, PPTX_LIMITS } from '../../src/adapters/pptx/packageGuard';
const base = { '[Content_Types].xml': strToU8('<Types/>'), 'ppt/presentation.xml': strToU8('<presentation/>') };
describe('PPTX package allocation boundary', () => {
  it('returns bounded local parts and counts without changing input', () => {
    const input=zipSync(base), before=input.slice();
    const result=readPptxPackage(input);
    expect(result.entryCount).toBe(2); expect(result.expandedBytes).toBe(23);
    expect(input).toEqual(before);
  });
  it.each(['../outside.xml','ppt/../outside.xml','/root.xml','ppt\\bad.xml','ppt//bad.xml','ppt/%2e%2e/bad.xml','ppt/a:bad.xml','constructor','prototype'])('rejects unsafe path %s', name => {
    expect(()=>readPptxPackage(zipSync({...base,[name]:strToU8('x')}))).toThrow('PPTX_UNSAFE_ENTRY');
  });
  it('rejects case-folded duplicate entry names', () => {
    expect(()=>readPptxPackage(zipSync({...base,'PPT/presentation.xml':strToU8('x')}))).toThrow('PPTX_UNSAFE_ENTRY');
  });
  it('rejects excessive XML allocation before decompressing', () => {
    expect(()=>readPptxPackage(zipSync({...base,'ppt/large.xml':new Uint8Array(PPTX_LIMITS.xml+1)},{level:0}))).toThrow('PPTX_ENTRY_LIMIT');
  });
  it('rejects high compression ratio', () => {
    expect(()=>readPptxPackage(zipSync({...base,'ppt/media/bomb.png':new Uint8Array(2*1024*1024)}))).toThrow('PPTX_ENTRY_LIMIT');
  });
  it('rejects active content and missing presentation', () => {
    expect(()=>readPptxPackage(zipSync({...base,'ppt/vbaProject.bin':strToU8('macro')}))).toThrow('PPTX_ACTIVE_CONTENT');
    expect(()=>readPptxPackage(zipSync({'[Content_Types].xml':strToU8('<Types/>')}))).toThrow('PPTX_REQUIRED_PART_MISSING');
  });
  it('rejects invalid, empty or cancelled input', () => {
    expect(()=>readPptxPackage(new Uint8Array())).toThrow('PPTX_INPUT_LIMIT');
    expect(()=>readPptxPackage(strToU8('not zip'))).toThrow();
    const controller=new AbortController();controller.abort();
    expect(()=>readPptxPackage(zipSync(base),controller.signal)).toThrow('Cancelled');
  });
});
