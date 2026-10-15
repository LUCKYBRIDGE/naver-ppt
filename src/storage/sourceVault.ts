import { PDF_MAX_BYTES, readPdfInput } from '../adapters/pdf/input';

export interface SourceHandleRecord { key: string; fingerprint: string; handle: FileSystemFileHandle }
export interface SourceHandleStore {
  read(key: string): Promise<SourceHandleRecord | undefined>;
  write(record: SourceHandleRecord): Promise<void>;
}
export function sourceKey(sessionId: string, documentId: string) { return JSON.stringify([sessionId, documentId]); }

function assertHandleRecord(value: unknown): asserts value is SourceHandleRecord {
  if (typeof value !== 'object' || !value || Object.keys(value).length !== 3
    || !('key' in value) || typeof value.key !== 'string' || !value.key || value.key.length > 1000
    || !('fingerprint' in value) || typeof value.fingerprint !== 'string' || !/^[a-f0-9]{64}$/.test(value.fingerprint)
    || !('handle' in value) || !value.handle || typeof value.handle !== 'object'
    || !('kind' in value.handle) || value.handle.kind !== 'file'
    || !('getFile' in value.handle) || typeof value.handle.getFile !== 'function') {
    throw new Error('원본 참조를 확인하지 못했습니다. 원본을 다시 연결하세요.');
  }
}

export class IndexedDbSourceHandles implements SourceHandleStore {
  constructor(private readonly factory: IDBFactory = indexedDB) {}
  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.factory.open('naver-ppt-source-handles', 1);
      let abandoned = false;
      request.onupgradeneeded = () => request.result.createObjectStore('handles', { keyPath: 'key' });
      request.onblocked = () => { abandoned = true; reject(new Error('원본 참조 저장소가 사용 중입니다. 다른 편집창을 확인하세요.')); };
      request.onerror = () => reject(new Error('원본 참조 저장소를 열지 못했습니다.'));
      request.onsuccess = () => {
        if (abandoned) { request.result.close(); return; }
        request.result.onversionchange = () => request.result.close(); resolve(request.result);
      };
    });
  }
  async read(key: string): Promise<SourceHandleRecord | undefined> {
    const db = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('handles', 'readonly'); const request = transaction.objectStore('handles').get(key);
        transaction.onabort = () => reject(new Error('원본 참조를 읽지 못했습니다.'));
        transaction.oncomplete = () => {
          const value: unknown = request.result;
          if (value === undefined) { resolve(undefined); return; }
          try { assertHandleRecord(value); if (value.key !== key) throw new Error('원본 참조가 일치하지 않습니다.'); resolve(value); }
          catch (error) { reject(error); }
        };
      });
    } finally { db.close(); }
  }
  async write(record: SourceHandleRecord) {
    assertHandleRecord(record);
    const db = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction('handles', 'readwrite', { durability: 'strict' });
        transaction.oncomplete = () => resolve(); transaction.onabort = () => reject(new Error('원본 참조를 저장하지 못했습니다. 다시 선택하세요.'));
        if (transaction.durability !== 'strict') { transaction.abort(); return; }
        transaction.objectStore('handles').put(record);
      });
    } finally { db.close(); }
  }
}

interface RuntimeSource { file: File; fingerprint: string }
// These limits apply to one SourceVault instance (normally one editor window).
// They bound retained original references, not the browser's total physical memory.
export const OPEN_SOURCE_MAX_COUNT = 16;
export const OPEN_SOURCE_MAX_BYTES = 512 * 1024 * 1024;
function sourceRead<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (failed: boolean, value: unknown) => {
      if (settled) return; settled = true; signal.removeEventListener('abort', abort);
      if (failed) reject(value); else resolve(value as T);
    };
    const abort = () => finish(true, new DOMException('Cancelled', 'AbortError'));
    pending.then(value => finish(false, value), error => finish(true, error));
    signal.addEventListener('abort', abort, { once: true }); if (signal.aborted) abort();
  });
}
export class SourceVault {
  private files = new Map<string, RuntimeSource>();
  private pending = new Map<string, { key: string; resolve: (value: RuntimeSource | undefined) => void; timer: ReturnType<typeof setTimeout> }>();
  private listeners = new Set<(key: string) => void>();
  private activeGets = new Set<AbortController>();
  constructor(private readonly handles: SourceHandleStore, private readonly channel?: BroadcastChannel,
    private readonly validateFile: (file: File, signal?: AbortSignal) => Promise<{ fingerprint: string }> = readPdfInput) {
    if (channel) channel.onmessage = event => {
      const value: unknown = event.data;
      if (!value || typeof value !== 'object' || !('key' in value) || typeof value.key !== 'string' || value.key.length > 1000 || !('type' in value)) return;
      if (value.type === 'available') { this.notify(value.key); return; }
      if (!('requestId' in value) || typeof value.requestId !== 'string') return;
      if (value.type === 'request') {
        const source = this.files.get(value.key);
        if (source) channel.postMessage({ type: 'reply', key: value.key, requestId: value.requestId, ...source });
      } else if (value.type === 'reply' && 'file' in value && value.file instanceof File && value.file.size <= PDF_MAX_BYTES
        && 'fingerprint' in value && typeof value.fingerprint === 'string' && /^[a-f0-9]{64}$/.test(value.fingerprint)) {
        const pending = this.pending.get(value.requestId);
        if (!pending || pending.key !== value.key) return;
        clearTimeout(pending.timer); this.pending.delete(value.requestId);
        pending.resolve({ file: value.file, fingerprint: value.fingerprint });
      }
    };
  }
  subscribe(listener: (key: string) => void) { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; }
  private notify(key: string) { for (const listener of this.listeners) listener(key); }
  async remember(key: string, file: File, fingerprint: string, handle?: FileSystemFileHandle, announce = true) {
    if (!/^[a-f0-9]{64}$/.test(fingerprint) || file.size > PDF_MAX_BYTES) throw new Error('원본을 확인하지 못했습니다.');
    const others = [...this.files.entries()].filter(([id]) => id !== key);
    const bytes = others.reduce((sum, [, value]) => sum + value.file.size, 0) + file.size;
    if (others.length >= OPEN_SOURCE_MAX_COUNT || bytes > OPEN_SOURCE_MAX_BYTES) throw new Error(`열린 원본의 한도(${OPEN_SOURCE_MAX_COUNT}개·${OPEN_SOURCE_MAX_BYTES / (1024 * 1024)}MiB)를 초과했습니다. 수업을 나누어 진행하세요.`);
    if (handle) await this.handles.write({ key, fingerprint, handle });
    this.files.set(key, { file, fingerprint });
    if (announce) { this.notify(key); this.channel?.postMessage({ type: 'available', key }); }
  }
  async get(key: string, expectedFingerprint?: string, signal?: AbortSignal): Promise<RuntimeSource> {
    const controller = new AbortController(), abort = () => controller.abort();
    const check = () => { if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError'); };
    signal?.addEventListener('abort', abort, { once: true }); if (signal?.aborted) abort();
    this.activeGets.add(controller);
    try {
    check();
    const cached = this.files.get(key);
    if (cached) {
      if (expectedFingerprint && cached.fingerprint !== expectedFingerprint) throw new Error('등록된 원본과 내용이 다릅니다. 편집창에서 원본을 다시 연결하세요.');
      return cached;
    }
    let source: RuntimeSource | undefined;
    try {
      const record = await sourceRead(this.handles.read(key), controller.signal); check();
      if (record) { const file = await sourceRead(record.handle.getFile(), controller.signal); check(); source = { file, fingerprint: record.fingerprint }; }
    } catch { check(); /* Missing permissions/reference still permits teacher re-selection. */ }
    if (!source && this.channel) {
      source = await new Promise((resolve, reject) => {
        const requestId = crypto.randomUUID();
        const finish = (value?: RuntimeSource, error?: unknown) => {
          clearTimeout(timer); this.pending.delete(requestId); controller.signal.removeEventListener('abort', cancelled);
          if (error) reject(error); else resolve(value);
        };
        const cancelled = () => finish(undefined, new DOMException('Cancelled', 'AbortError'));
        const timer = setTimeout(() => finish(), 1500);
        this.pending.set(requestId, { key, resolve: value => finish(value), timer });
        controller.signal.addEventListener('abort', cancelled, { once: true });
        if (controller.signal.aborted) { cancelled(); return; }
        try { this.channel!.postMessage({ type: 'request', key, requestId }); } catch (error) { finish(undefined, error); }
      });
    }
    check();
    if (!source) throw new Error('원본을 다시 연결해야 합니다. 편집창에서 같은 원본 파일을 선택하세요.');
    if (expectedFingerprint && source.fingerprint !== expectedFingerprint) throw new Error('등록된 원본과 참조가 다릅니다. 편집창에서 원본을 다시 연결하세요.');
    const checked = await sourceRead(this.validateFile(source.file, controller.signal), controller.signal); check();
    if (checked.fingerprint !== source.fingerprint) throw new Error('원본 내용이 바뀌었습니다. 편집을 유지한 채 기존 원본을 다시 연결하세요.');
    const connected = this.files.get(key);
    if (connected) {
      if (expectedFingerprint && connected.fingerprint !== expectedFingerprint) throw new Error('등록된 원본과 내용이 다릅니다. 편집창에서 원본을 다시 연결하세요.');
      return connected;
    }
    await this.remember(key, source.file, source.fingerprint, undefined, false); check(); return source;
    } finally { signal?.removeEventListener('abort', abort); this.activeGets.delete(controller); }
  }
  close() {
    for (const controller of this.activeGets) controller.abort();
    this.channel?.close(); this.files.clear();
    for (const pending of this.pending.values()) { clearTimeout(pending.timer); pending.resolve(undefined); }
    this.pending.clear(); this.listeners.clear();
  }
}

let singleton: SourceVault | undefined;
export function sourceVault() {
  return singleton ??= new SourceVault(new IndexedDbSourceHandles(), new BroadcastChannel('naver-ppt-source-v1'));
}
