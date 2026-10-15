import { afterEach, describe, expect, it, vi } from 'vitest';
import { preparationDeadline, sceneReadiness, waitForPreparedScene } from '../../src/player/preparedScene';
import { fixtureSession } from '../fixtures/session';
import { toPlayerSnapshot } from '../../src/core/playerSnapshot';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
const state = () => toPlayerSnapshot(fixtureSession());
function surface(status = 'ready', media: object[] = [], active = false) {
  const stage = { classList: { contains: (name: string) => name === (active ? 'pptx-audience-stage' : 'pptx-preparing-stage') }, dataset: { preparation: status },
    shadowRoot: { querySelector: () => ({}), querySelectorAll: () => media } };
  return { querySelectorAll: () => [stage] } as unknown as ParentNode;
}
describe('Player prepared surface readiness', () => {
  it('waits for the runtime and rejects its explicit preparation failure', () => {
    expect(sceneReadiness(surface('loading'), state())).toBe('waiting');
    expect(sceneReadiness(surface('failed'), state())).toBe('failed');
    expect(sceneReadiness(surface(), state())).toBe('ready');
  });
  it('requires every registered native media slot to have data and remain paused', () => {
    const snapshot = state(); snapshot.media = [{ ref: { id: 'media' }, bookmark: null }] as never;
    const media = { classList: { contains: () => false }, tagName: 'AUDIO', parentElement: { dataset: { mediaId: 'media' } }, readyState: 2, paused: true, seeking: false, error: null };
    expect(sceneReadiness(surface(), snapshot)).toBe('waiting');
    expect(sceneReadiness(surface('ready', [media]), snapshot)).toBe('ready');
    media.readyState = 1; expect(sceneReadiness(surface('ready', [media]), snapshot)).toBe('waiting');
    media.readyState = 2; media.seeking = true; expect(sceneReadiness(surface('ready', [media]), snapshot)).toBe('waiting');
    media.seeking = false; media.paused = false; expect(sceneReadiness(surface('ready', [media]), snapshot)).toBe('failed');
  });
  it('accepts settled effect status for the existing active scene without overriding it', () => {
    for (const status of ['completed', 'cancelled', 'exhausted', 'held']) expect(sceneReadiness(surface(status, [], true), state(), true)).toBe('ready');
    expect(sceneReadiness(surface('running', [], true), state(), true)).toBe('waiting');
    expect(sceneReadiness(surface('failed', [], true), state(), true)).toBe('failed');
    expect(sceneReadiness(surface('completed'), state())).toBe('waiting');
  });
  it('cancels a hung image/font promise immediately', async () => {
    const controller = new AbortController(), work = preparationDeadline(new Promise(() => {}), controller.signal, 30000);
    controller.abort(); await expect(work).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('bounds a hung preparation promise and consumes a late rejection', async () => {
    vi.useFakeTimers(); let reject!: (error: Error) => void;
    const work = preparationDeadline(new Promise((_, fail) => { reject = fail; }), new AbortController().signal, 20);
    const checked = expect(work).rejects.toThrow('PREPARATION_TIMEOUT'); await vi.advanceTimersByTimeAsync(20); await checked;
    reject(Error('late')); await Promise.resolve(); expect(vi.getTimerCount()).toBe(0);
  });
  it('does not mark a scene ready while fonts never settle', async () => {
    vi.stubGlobal('document', { fonts: { ready: new Promise(() => {}) } });
    const controller = new AbortController(), work = waitForPreparedScene(surface(), state(), controller.signal);
    controller.abort(); await expect(work).rejects.toMatchObject({ name: 'AbortError' });
  });
});
