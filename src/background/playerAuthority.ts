import { getPageRole, validId } from '../shared/sessionMessages';
import type { PlayerOwner } from '../storage/playerOwner';
export interface OwnerStore { access(candidate: PlayerOwner, liveIds: ReadonlySet<string>, claim: boolean): Promise<boolean> }
export class PlayerAuthority {
  async currentTransitionOwner(sessionId: string): Promise<string | null> {
    if (!validId(sessionId)) return null;
    if (!this.locks) throw Error('PLAYER_LOCK_UNAVAILABLE');
    return this.locks.request(`naver-ppt-player:${sessionId}`, async () => {
      const contexts = await this.api.getContexts({});
      const ids = contexts.filter(context => validId(context.documentId) && context.documentUrl
        && getPageRole({ id: this.api.id, url: context.documentUrl }, this.api.id, path => this.api.getURL(path)) === 'player'
        && new URL(context.documentUrl).searchParams.get('sessionId') === sessionId).map(context => context.documentId!);
      const live = new Set(ids);
      for (const documentId of ids) if (await this.store.access({ sessionId, documentId }, live, false)) return documentId;
      return null;
    });
  }
  async withTransitionOwner<T>(sessionId: string, playerId: string, work: () => Promise<T>): Promise<T | false> {
    if (!validId(sessionId) || !validId(playerId)) return false;
    if (!this.locks) throw Error('PLAYER_LOCK_UNAVAILABLE');
    return this.locks.request(`naver-ppt-player:${sessionId}`, async () => {
      const contexts = await this.api.getContexts({});
      const live = new Set(contexts.filter(context => context.documentUrl && validId(context.documentId)
        && getPageRole({ id: this.api.id, url: context.documentUrl }, this.api.id, path => this.api.getURL(path)) === 'player'
        && new URL(context.documentUrl).searchParams.get('sessionId') === sessionId).map(context => context.documentId!));
      if (!live.has(playerId) || !await this.store.access({ sessionId, documentId: playerId }, live, false)) return false;
      return work();
    });
  }
  async transitionAccess(sessionId: string, playerId: string) {
    if (!validId(sessionId) || !validId(playerId)) return false;
    const context = (await this.api.getContexts({})).find(context => context.documentId === playerId && context.documentUrl
      && getPageRole({ id: this.api.id, url: context.documentUrl }, this.api.id, path => this.api.getURL(path)) === 'player'
      && new URL(context.documentUrl).searchParams.get('sessionId') === sessionId);
    if (!context?.documentUrl) return false;
    return this.access({ id: this.api.id, url: context.documentUrl, documentId: playerId }, sessionId, false);
  }
  constructor(private readonly api: { id: string; getURL(path: string): string; getContexts(filter: chrome.runtime.ContextFilter): Promise<chrome.runtime.ExtensionContext[]> },
    private readonly store: OwnerStore, private readonly locks: Pick<LockManager, 'request'> | undefined) {}
  async access(sender: chrome.runtime.MessageSender, sessionId: string, claim: boolean) {
    if (!validId(sessionId) || !validId(sender.documentId) || getPageRole(sender, this.api.id, path => this.api.getURL(path)) !== 'player'
      || new URL(sender.url!).searchParams.get('sessionId') !== sessionId) return false;
    if (!this.locks) throw new Error('PLAYER_LOCK_UNAVAILABLE');
    return this.locks.request(`naver-ppt-player:${sessionId}`, async () => {
      const contexts = await this.api.getContexts({});
      const liveIds = new Set(contexts.filter(context => validId(context.documentId) && context.documentUrl
        && getPageRole({ id: this.api.id, url: context.documentUrl }, this.api.id, path => this.api.getURL(path)) === 'player'
        && new URL(context.documentUrl).searchParams.get('sessionId') === sessionId).map(context => context.documentId!));
      return this.store.access({ sessionId, documentId: sender.documentId! }, liveIds, claim);
    });
  }
}
