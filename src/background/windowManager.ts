import type { WindowRole, OpenWindowResult } from '../shared/windowMessages';
import { windowOptions } from './windows';

export class WindowManager {
  private pending = new Map<string, Promise<OpenWindowResult>>();
  constructor(private readonly windows: typeof chrome.windows, private readonly getURL: (path: string) => string,
    private readonly getContexts: (filter: chrome.runtime.ContextFilter) => Promise<chrome.runtime.ExtensionContext[]>) {}
  open(role: WindowRole, sessionId?: string): Promise<OpenWindowResult> {
    const options = windowOptions(role, this.getURL, sessionId);
    const key = String(options.url);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const operation = this.findOrCreate(role, options).finally(() => this.pending.delete(key));
    this.pending.set(key, operation);
    return operation;
  }
  private async findOrCreate(role: WindowRole, options: chrome.windows.CreateData): Promise<OpenWindowResult> {
    try {
      const contexts = await this.getContexts({ documentUrls: [String(options.url)] });
      const existing = contexts.find(context => context.documentUrl === options.url && context.windowId >= 0);
      if (existing) {
        if (role !== 'player') await this.windows.update(existing.windowId, { focused: true });
        return { ok: true, windowId: existing.windowId };
      }
      const window = await this.windows.create(options);
      return window?.id === undefined ? { ok: false, error: '생성한 창의 식별자를 확인하지 못했습니다.' }
        : { ok: true, windowId: window.id };
    } catch {
      return { ok: false, error: '창을 열지 못했습니다. 잠시 후 다시 시도하세요.' };
    }
  }
}
