import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PPTX_LIMITS, pptxPartByteLimit, readPptxPackage } from '../../src/adapters/pptx/packageGuard';
import { inspectPptxWorkerEnvelope } from '../../src/adapters/pptx/workerEnvelope';
const mocks = vi.hoisted(() => ({ entries: [] as { name: string; originalSize: number; size: number; compression: number }[], allocations: 0 }));
vi.mock('fflate', () => ({ unzipSync(_bytes: Uint8Array, options?: { filter: (entry: unknown) => boolean }) {
  if (options) { for (const entry of mocks.entries) options.filter(entry); return {}; }
  mocks.allocations++; return {};
} }));
beforeEach(() => { mocks.entries = []; mocks.allocations = 0; });
describe('PPTX large audio/video bounds', () => {
  it.each(['mp3', 'wav', 'mp4', 'webm'])('allows 64MiB only for a local ppt/media %s part', ext => {
    expect(pptxPartByteLimit(`ppt/media/local.${ext}`)).toBe(64 * 1024 * 1024);
  });
  it.each(['ppt/media/large.png', 'ppt/media/large.svg', 'ppt/fonts/font.ttf', 'outside.mp3', 'ppt/embeddings/large.mp4', 'ppt/media/sub/large.mp3'])('retains the ordinary limit for %s', name => {
    expect(pptxPartByteLimit(name)).toBe(PPTX_LIMITS.entry);
  });
  it.each(['ppt/slides/slide1.xml', 'ppt/slides/_rels/slide1.xml.rels'])('retains XML bounds for %s', name => {
    expect(pptxPartByteLimit(name)).toBe(PPTX_LIMITS.xml);
  });
  it.each([['ppt/media/large.mp3', PPTX_LIMITS.mediaEntry + 1], ['ppt/media/large.png', PPTX_LIMITS.entry + 1], ['ppt/slides/slide1.xml', PPTX_LIMITS.xml + 1]])('rejects over-limit %s before output allocation', (name, originalSize) => {
    mocks.entries = [{ name: String(name), originalSize: Number(originalSize), size: Number(originalSize), compression: 0 }];
    expect(() => readPptxPackage(new Uint8Array([1]))).toThrow('PPTX_ENTRY_LIMIT'); expect(mocks.allocations).toBe(0);
  });
  it('does not relax the compression ratio for a large audio entry', () => {
    mocks.entries = [{ name: 'ppt/media/large.mp3', originalSize: PPTX_LIMITS.mediaEntry, size: 1, compression: 8 }];
    expect(() => readPptxPackage(new Uint8Array([1]))).toThrow('PPTX_ENTRY_LIMIT'); expect(mocks.allocations).toBe(0);
  });
  const envelope = (mime: string, data: ArrayBuffer, count = 1) => ({ id: 1, ok: true, presentation: { width: 960, height: 540, slides: [{ elements: [] }] }, assets: Array.from({ length: count }, () => ({ mime, data })) });
  it.each(['audio/mpeg', 'audio/wav', 'video/mp4', 'video/webm'])('accepts a 64MiB %s asset at the model boundary', mime => {
    expect(inspectPptxWorkerEnvelope(envelope(mime, new ArrayBuffer(PPTX_LIMITS.mediaEntry))).assetBytes).toBe(PPTX_LIMITS.mediaEntry);
  });
  it('rejects an oversized audio asset and preserves the aggregate limit', () => {
    expect(() => inspectPptxWorkerEnvelope(envelope('audio/mpeg', new ArrayBuffer(PPTX_LIMITS.mediaEntry + 1)))).toThrow('PPTX_INVALID_PARSER_RESULT');
    expect(() => inspectPptxWorkerEnvelope(envelope('audio/mpeg', new ArrayBuffer(PPTX_LIMITS.mediaEntry), 5))).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
  it.each(['image/png', 'font/ttf', 'audio/unknown'])('does not grant the media budget to %s', mime => {
    expect(() => inspectPptxWorkerEnvelope(envelope(mime, new ArrayBuffer(PPTX_LIMITS.entry + 1)))).toThrow('PPTX_INVALID_PARSER_RESULT');
  });
});
