import { IndexedDbSourceHandles, SourceVault } from '../storage/sourceVault';
import { readMediaInput } from './input';
export function mediaKey(sessionId: string, documentId: string, mediaId: string) { return JSON.stringify([sessionId, documentId, mediaId]); }
let singleton: SourceVault | undefined;
export function mediaVault() { return singleton ??= new SourceVault(new IndexedDbSourceHandles(), new BroadcastChannel('naver-ppt-media-v1'), readMediaInput); }
