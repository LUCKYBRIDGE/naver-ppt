import type { SessionCommand } from './commands';
import type { ClassSession } from './types';
import { currentPresentationTransition, transitionCheckpoint } from './presentationTransition';
import { isPptxCompletedCheckpoint } from './pptxPlayback';
import { isOverlayList } from '../overlays/validation';
import { pauseAutoplay, resolveAutoplay, isSupportedAutoplayRule, isMediaAutoplay, mediaEndedForAutoplay, elapsedAutoplay, autoplayDue, autoplayNextSlide } from '../media/autoplay';
import { isLocalMediaRef, isMediaPlayback, mediaPlayback, mediaMatchesDocument, embeddedMediaKey } from '../media/validation';
import { pauseTimer, scopedTimer, timerComplete, isTimerPosition } from '../media/timer';

function stopDocument(session: ClassSession, documentId: string, now: number, stopTimer = true) {
  const document = session.documents[documentId]; if (!document) return;
  if (document.pptxPlayback) {
    document.pptxPlayback.run = null;
    if (Object.hasOwn(document.pptxPlayback, 'request')) document.pptxPlayback.request = null;
  }
  for (const bookmark of Object.values(document.mediaBookmarks)) bookmark.paused = true;
  if (document.autoplayCheckpoint) document.autoplayCheckpoint = pauseAutoplay(document.autoplayCheckpoint, now);
  if (stopTimer && document.timer) document.timer = pauseTimer(document.timer, now);
  const timer = session.globalTimer;
  if (stopTimer && timer?.scope === 'document' && timer.documentId === documentId) {
    if (!timer.paused && timer.startedAt !== null) timer.elapsedBeforeStartMs += Math.max(0, now - timer.startedAt);
    timer.paused = true; timer.startedAt = null;
  }
}

export type CommandErrorCode = 'INVALID_CONTEXT' | 'STALE_REVISION' | 'INVALID_TARGET' | 'PERSISTENCE_FAILED';
export class CommandError extends Error {
  constructor(public readonly code: CommandErrorCode) { super(code); }
}
function startAutoplayMedia(session: ClassSession, documentId: string, slideId: string, epoch: string) {
  const document = session.documents[documentId]!;
  for (const ref of Object.values(document.localMedia ?? {}).filter(ref => ref.slideId === slideId)) {
    const previous = Object.hasOwn(document.mediaBookmarks, ref.id) ? document.mediaBookmarks[ref.id] : undefined;
    Object.defineProperty(document.mediaBookmarks, ref.id, { value: { mediaId: ref.id, slideId, timeSec: previous?.ended ? mediaPlayback(ref).startSec : previous?.timeSec ?? mediaPlayback(ref).startSec,
      paused: false, replayPolicy: 'resume', epoch, autoplayEpoch: epoch, ended: false }, enumerable: true, writable: true, configurable: true });
  }
}

export function createSession(id: string, title: string, now: number): ClassSession {
  if (!id.trim() || !Number.isFinite(now)) throw new CommandError('INVALID_CONTEXT');
  return {
    id, title, revision: 0, documentOrder: [], documents: {},
    presentedSelection: null, editorSelection: null, history: [],
    defaultAutoplay: { mode: 'manual', loop: 'none', pauseWhileEditing: false },
    globalTimer: null, updatedAt: now,
  };
}

export function reduceSession(session: ClassSession, command: SessionCommand, now: number): ClassSession {
  if (command.sessionId !== session.id || typeof command.commandId !== 'string' || !command.commandId.trim()
    || !Number.isSafeInteger(command.revision) || command.revision < 0 || !Number.isFinite(now)) {
    throw new CommandError('INVALID_CONTEXT');
  }
  if (command.revision !== session.revision) throw new CommandError('STALE_REVISION');
  const next = structuredClone(session);
  if (command.type === 'REQUEST_PRESENTATION' || command.type === 'COMMIT_PRESENTATION' || command.type === 'REJECT_PRESENTATION' || command.type === 'CANCEL_PRESENTATION') {
    const target = next.documents[command.documentId];
    if (!target || target.source.type !== 'pptx' || !target.slideIds.includes(command.slideId) || !/^[a-f0-9]{64}$/.test(target.source.fingerprint ?? '')) throw new CommandError('INVALID_TARGET');
    if (command.type === 'REQUEST_PRESENTATION') {
      if (next.presentationTransition || typeof command.playerId !== 'string' || !command.playerId.trim() || command.playerId.length > 200) throw new CommandError('INVALID_TARGET');
      next.presentationTransition = { requestId: command.commandId, playerId: command.playerId, documentId: target.id, slideId: command.slideId,
        fingerprint: target.source.fingerprint!, from: structuredClone(next.presentedSelection), closed: !!target.closed, checkpoint: transitionCheckpoint(next, target.id, command.slideId) };
    } else {
      const pending = next.presentationTransition;
      if (!pending || pending.requestId !== command.requestId || pending.documentId !== command.documentId || pending.slideId !== command.slideId
        || command.commandId === pending.requestId || !currentPresentationTransition(next, pending)
        || command.type !== 'CANCEL_PRESENTATION' && command.playerId !== pending.playerId) throw new CommandError('INVALID_TARGET');
      next.presentationTransition = null;
      if (command.type === 'COMMIT_PRESENTATION') {
        target.closed = false;
        return reduceSession(next, { type: 'ACTIVATE_DOCUMENT', commandId: command.commandId, sessionId: command.sessionId, documentId: target.id, slideId: command.slideId, revision: command.revision }, now);
      }
    }
    next.revision++; next.updatedAt = now; return next;
  }
  if (command.type === 'SET_TIMER' || command.type === 'PLAY_TIMER' || command.type === 'PAUSE_TIMER' || command.type === 'RESET_TIMER' || command.type === 'FINISH_TIMER' || command.type === 'SET_TIMER_POSITION' || command.type === 'SET_TIMER_SOUND' || command.type === 'CLAIM_TIMER_ALARM') {
    const doc = command.documentId === null ? undefined : next.documents[command.documentId];
    if (command.slideId !== null || command.documentId !== null && (!Object.hasOwn(next.documents, command.documentId) || !doc || doc.closed || next.presentedSelection?.documentId !== doc.id)) throw new CommandError('INVALID_TARGET');
    let timer = scopedTimer(next, command.documentId);
    if (command.type === 'SET_TIMER') {
      if (!['countdown', 'stopwatch'].includes(command.mode) || !Number.isFinite(command.durationSec) || typeof command.visible !== 'boolean'
        || (command.mode === 'stopwatch' ? command.durationSec !== 0 : command.durationSec < 1 || command.durationSec > 86400)) throw new CommandError('INVALID_TARGET');
      timer = { scope: doc ? 'document' : 'session', documentId: doc?.id ?? null, durationSec: command.durationSec, mode: command.mode, visible: command.visible,
        epoch: command.commandId, startedAt: null, elapsedBeforeStartMs: 0, paused: true, ...(timer?.position ? { position: { ...timer.position } } : {}), ...(timer?.sound !== undefined ? { sound: timer.sound } : {}) };
    } else {
      if (!timer) throw new CommandError('INVALID_TARGET');
      if (command.type === 'SET_TIMER_SOUND') {
        if (typeof command.sound !== 'boolean') throw new CommandError('INVALID_TARGET');
        timer = { ...timer, sound: command.sound };
      } else if (command.type === 'CLAIM_TIMER_ALARM') {
        if (!timer.sound || !timer.paused || timer.epoch !== command.epoch || timer.completedEpoch !== command.epoch || timer.alarmClaimedEpoch === command.epoch || !timerComplete(timer, now)) throw new CommandError('INVALID_TARGET');
        timer = { ...timer, alarmClaimedEpoch: command.epoch };
      } else if (command.type === 'SET_TIMER_POSITION') {
        if (!isTimerPosition(command.position)) throw new CommandError('INVALID_TARGET');
        timer = { ...timer, position: { ...command.position } };
      } else if (command.type === 'FINISH_TIMER') {
        if (timer.paused || timer.epoch !== command.epoch || !timerComplete(timer, now)) throw new CommandError('INVALID_TARGET');
        timer = { ...pauseTimer(timer, now), elapsedBeforeStartMs: timer.durationSec * 1000, completedEpoch: command.epoch };
      } else if (command.type === 'PLAY_TIMER') {
        if (!timer.paused || timerComplete(timer, now)) throw new CommandError('INVALID_TARGET');
        timer = { ...timer, epoch: command.commandId, paused: false, startedAt: now };
      } else if (command.type === 'PAUSE_TIMER') timer = { ...pauseTimer(timer, now), epoch: command.commandId };
      else timer = { ...timer, epoch: command.commandId, startedAt: null, elapsedBeforeStartMs: 0, paused: true };
    }
    const legacy = next.globalTimer;
    if (legacy?.scope === 'document' && legacy.documentId && (!doc || legacy.documentId === doc.id)) {
      const legacyDoc = next.documents[legacy.documentId]; if (legacyDoc && !legacyDoc.timer) legacyDoc.timer = structuredClone(legacy);
      next.globalTimer = null;
    }
    if (doc) { doc.timer = timer; doc.dirty = true; } else next.globalTimer = timer;
  } else if (command.type === 'REGISTER_DOCUMENT') {
    const document = command.document;
    const externalLink = document.source.type === 'canva' || document.source.type === 'miricanvas';
    if (!command.documentId || document.id !== command.documentId || command.slideId !== null
      || Object.hasOwn(session.documents, document.id)
      || (!externalLink && !document.slideIds.length) || document.slideIds.some(id => typeof id !== 'string' || !id.trim())
      || new Set(document.slideIds).size !== document.slideIds.length
      || (externalLink ? (document.knownSlideCount !== null || document.slideIds.length !== 0) : document.knownSlideCount !== document.slideIds.length)
      || (document.lastSlideId !== null && !document.slideIds.includes(document.lastSlideId))) {
      throw new CommandError('INVALID_TARGET');
    }
    // defineProperty also treats untrusted IDs such as __proto__ as ordinary keys.
    Object.defineProperty(next.documents, document.id, {
      value: structuredClone(document), enumerable: true, writable: true, configurable: true,
    });
    next.documentOrder.push(document.id);
  } else if (command.type === 'CLOSE_DOCUMENTS') {
    if (command.documentId !== null || command.slideId !== null || !Array.isArray(command.documentIds) || !command.documentIds.length
      || new Set(command.documentIds).size !== command.documentIds.length
      || command.documentIds.some(id => !Object.hasOwn(next.documents, id) || next.documents[id]?.closed)) throw new CommandError('INVALID_TARGET');
    for (const id of command.documentIds) {
      const document = next.documents[id]!; document.closed = true;
      stopDocument(next, id, now);
    }
    if (next.presentedSelection && command.documentIds.includes(next.presentedSelection.documentId)) next.presentedSelection = null;
    const timer = next.globalTimer;
    if (timer && (timer.scope === 'document' && timer.documentId !== null && command.documentIds.includes(timer.documentId)
      || timer.scope === 'session' && next.documentOrder.every(id => next.documents[id]?.closed))) {
      if (!timer.paused && timer.startedAt !== null) timer.elapsedBeforeStartMs += Math.max(0, now - timer.startedAt);
      timer.paused = true; timer.startedAt = null;
    }
  } else {
    if (command.documentId === null) throw new CommandError('INVALID_TARGET');
    const document = Object.hasOwn(next.documents, command.documentId) ? next.documents[command.documentId] : undefined;
    if (!document) throw new CommandError('INVALID_TARGET');
    if (command.type === 'CLOSE_DOCUMENT') {
      if (command.slideId !== null || document.closed || session.presentedSelection?.documentId !== document.id) throw new CommandError('INVALID_TARGET');
      document.closed = true;
      stopDocument(next, document.id, now);
      next.presentedSelection = null;
    } else if (command.type === 'ACTIVATE_DOCUMENT' || command.type === 'REOPEN_DOCUMENT') {
      if (command.type === 'REOPEN_DOCUMENT' && command.slideId !== null || command.slideId !== null && !document.slideIds.includes(command.slideId)) throw new CommandError('INVALID_TARGET');
      if (command.type === 'ACTIVATE_DOCUMENT' && document.closed || command.type === 'REOPEN_DOCUMENT' && !document.closed) throw new CommandError('INVALID_TARGET');
      if (command.type === 'REOPEN_DOCUMENT') document.closed = false;
      const slideId = command.slideId ?? document.lastSlideId ?? document.slideIds[0] ?? null;
      if (!slideId) throw new CommandError('INVALID_TARGET');
      const previousId = session.presentedSelection?.documentId;
      if (previousId !== document.id) {
        if (previousId) stopDocument(next, previousId, now);
        stopDocument(next, document.id, now);
      } else if (session.presentedSelection?.slideId !== slideId) {
        stopDocument(next, document.id, now, false);
        if (document.autoplayCheckpoint) document.autoplayCheckpoint = { slideId, epoch: command.commandId, elapsedMs: 0, startedAt: null, paused: true };
      }
      next.presentedSelection = { documentId: document.id, slideId };
      document.lastSlideId = slideId;
    } else {
      if (!command.slideId || !document.slideIds.includes(command.slideId)) throw new CommandError('INVALID_TARGET');
      if (command.type === 'BEGIN_PPTX_GROUP' || command.type === 'CHECKPOINT_PPTX_GROUP' || command.type === 'RESET_PPTX_SLIDE'
        || command.type === 'REQUEST_PPTX_GROUP' || command.type === 'CANCEL_PPTX_GROUP' || command.type === 'BEGIN_REQUESTED_PPTX_GROUP') {
        if (document.source.type !== 'pptx' || !/^[a-f0-9]{64}$/.test(document.source.fingerprint ?? '') || document.closed
          || next.presentedSelection?.documentId !== document.id || next.presentedSelection.slideId !== command.slideId) throw new CommandError('INVALID_TARGET');
        const playback = document.pptxPlayback ?? { checkpoints: {}, run: null };
        if (command.type === 'REQUEST_PPTX_GROUP') {
          if (playback.request || playback.run) throw new CommandError('INVALID_TARGET');
          playback.request = { commandId: command.commandId, slideId: command.slideId };
        } else if (command.type === 'BEGIN_REQUESTED_PPTX_GROUP') {
          if (!playback.request || playback.request.commandId !== command.requestId || playback.request.slideId !== command.slideId
            || playback.run || command.commandId === command.requestId) throw new CommandError('INVALID_TARGET');
          playback.request = null;
          playback.run = { epoch: command.commandId, slideId: command.slideId };
        } else if (command.type === 'BEGIN_PPTX_GROUP') {
          if (playback.request) throw new CommandError('INVALID_TARGET');
          for (const bookmark of Object.values(document.mediaBookmarks)) if (playback.run && bookmark.sourceRunEpoch === playback.run.epoch) bookmark.paused = true;
          playback.run = { epoch: command.commandId, slideId: command.slideId };
        } else if (command.type === 'RESET_PPTX_SLIDE' || command.type === 'CANCEL_PPTX_GROUP') {
          for (const bookmark of Object.values(document.mediaBookmarks)) if (bookmark.slideId === command.slideId && bookmark.sourceRunEpoch
            && (command.type === 'RESET_PPTX_SLIDE' || bookmark.sourceRunEpoch === playback.run?.epoch)) bookmark.paused = true;
          if (command.type === 'RESET_PPTX_SLIDE') delete playback.checkpoints[command.slideId];
          playback.run = null;
          if (Object.hasOwn(playback, 'request')) playback.request = null;
        }
        else if (command.type === 'CHECKPOINT_PPTX_GROUP') {
          const checkpoint = command.checkpoint, scope = checkpoint?.pose?.scope;
          const previous = Object.hasOwn(playback.checkpoints, command.slideId) ? playback.checkpoints[command.slideId] : undefined;
          if (!isPptxCompletedCheckpoint(checkpoint) || checkpoint.fingerprint !== document.source.fingerprint
            || playback.run?.epoch !== command.epoch || playback.run?.slideId !== command.slideId
            || checkpoint.completedGroups !== (previous?.completedGroups ?? 0) + 1
            || previous && checkpoint.renderer !== previous.renderer
            || scope.sessionId !== session.id || scope.documentId !== document.id || scope.slideId !== command.slideId || scope.revision !== command.revision) throw new CommandError('INVALID_TARGET');
          Object.defineProperty(playback.checkpoints, command.slideId, { value: structuredClone(checkpoint), enumerable: true, writable: true, configurable: true });
          playback.run = null;
        }
        document.pptxPlayback = playback; document.dirty = true;
      } else if (command.type === 'ADD_LOCAL_MEDIA') {
        if (!isLocalMediaRef(command.media) || command.media.slideId !== command.slideId
          || !mediaMatchesDocument(command.media, document.source)
          || command.media.embeddedSource && Object.values(document.localMedia ?? {}).some(ref => ref.embeddedSource && embeddedMediaKey(ref.embeddedSource) === embeddedMediaKey(command.media.embeddedSource!))
          || Object.keys(document.localMedia ?? {}).length >= 16 || Object.hasOwn(document.localMedia ?? {}, command.media.id)) throw new CommandError('INVALID_TARGET');
        document.localMedia ??= {};
        Object.defineProperty(document.localMedia, command.media.id, { value: structuredClone(command.media), enumerable: true, writable: true, configurable: true }); document.dirty = true;
      } else if (command.type === 'PLAY_MEDIA' || command.type === 'PAUSE_MEDIA' || command.type === 'CHECKPOINT_MEDIA' || command.type === 'CHECKPOINT_PPTX_MEDIA' || command.type === 'SET_MEDIA_PLAYBACK' || command.type === 'SEEK_MEDIA') {
        const ref = Object.hasOwn(document.localMedia ?? {}, command.mediaId) ? document.localMedia?.[command.mediaId] : undefined;
        const bookmark = Object.hasOwn(document.mediaBookmarks, command.mediaId) ? document.mediaBookmarks[command.mediaId] : undefined;
        const active = !document.closed && next.presentedSelection?.documentId === document.id && next.presentedSelection?.slideId === command.slideId;
        if (!ref || ref.slideId !== command.slideId) throw new CommandError('INVALID_TARGET');
        const settings = mediaPlayback(ref);
        if (command.type === 'CHECKPOINT_PPTX_MEDIA') {
          if (!active || document.source.type !== 'pptx' || !ref.embeddedSource || !mediaMatchesDocument(ref, document.source)
            || document.pptxPlayback?.run?.epoch !== command.epoch || document.pptxPlayback.run.slideId !== command.slideId
            || (bookmark?.epoch ?? null) !== command.expectedMediaEpoch || !isMediaPlayback(command.playback, ref.durationSec)
            || (['startSec', 'endSec', 'volume', 'muted'] as const).some(key => settings[key] !== command.playback[key])
            || !Number.isFinite(command.timeSec) || command.timeSec < settings.startSec || command.timeSec > settings.endSec
            || typeof command.paused !== 'boolean' || typeof command.ended !== 'boolean' || command.ended && (!command.paused || command.timeSec < settings.endSec - .25)) throw new CommandError('INVALID_TARGET');
          Object.defineProperty(document.mediaBookmarks, ref.id, { value: { mediaId: ref.id, slideId: ref.slideId, timeSec: command.timeSec,
            paused: command.paused, ended: command.ended, replayPolicy: 'resume', epoch: command.commandId, positionEpoch: command.commandId, sourceRunEpoch: command.epoch }, enumerable: true, writable: true, configurable: true });
        } else if (command.type === 'CHECKPOINT_MEDIA') {
          if (!bookmark?.epoch || bookmark.epoch !== command.epoch || !Number.isFinite(command.timeSec) || command.timeSec < settings.startSec || command.timeSec > settings.endSec + .25
            || typeof command.paused !== 'boolean' || typeof command.ended !== 'boolean' || !active && !command.paused
            || bookmark.paused && !command.paused || command.ended && (!command.paused || command.timeSec < settings.endSec - .25)) throw new CommandError('INVALID_TARGET');
          Object.defineProperty(document.mediaBookmarks, ref.id, { value: { ...bookmark, timeSec: Math.min(settings.endSec, command.timeSec), paused: command.paused, ended: command.ended }, enumerable: true, writable: true, configurable: true });
        } else if (command.type === 'SET_MEDIA_PLAYBACK') {
          if (!active || !isMediaPlayback(command.playback, ref.durationSec)) throw new CommandError('INVALID_TARGET');
          ref.playback = structuredClone(command.playback); document.dirty = true;
          if (settings.startSec !== command.playback.startSec || settings.endSec !== command.playback.endSec) {
            if (document.autoplayCheckpoint) document.autoplayCheckpoint = pauseAutoplay(document.autoplayCheckpoint, now);
            Object.defineProperty(document.mediaBookmarks, ref.id, { value: { mediaId: ref.id, slideId: ref.slideId, timeSec: command.playback.startSec,
              paused: true, replayPolicy: 'resume', epoch: command.commandId, positionEpoch: command.commandId, ended: false }, enumerable: true, writable: true, configurable: true });
          }
        } else if (command.type === 'SEEK_MEDIA') {
          if (!active || !Number.isFinite(command.timeSec) || command.timeSec < settings.startSec || command.timeSec >= settings.endSec) throw new CommandError('INVALID_TARGET');
          Object.defineProperty(document.mediaBookmarks, ref.id, { value: { ...bookmark, mediaId: ref.id, slideId: ref.slideId, timeSec: command.timeSec,
            paused: bookmark?.paused !== false, replayPolicy: 'resume', epoch: command.commandId, positionEpoch: command.commandId, ended: false }, enumerable: true, writable: true, configurable: true });
          delete document.mediaBookmarks[ref.id]!.sourceRunEpoch;
        } else {
          if (!active || command.type === 'PLAY_MEDIA' && bookmark?.paused === false) throw new CommandError('INVALID_TARGET');
          const cycle = document.autoplayCheckpoint;
          const autoplayEpoch = cycle?.paused === false && cycle.slideId === ref.slideId && isMediaAutoplay(resolveAutoplay(next, document, ref.slideId)) ? cycle.epoch : undefined;
          Object.defineProperty(document.mediaBookmarks, ref.id, { value: { mediaId: ref.id, slideId: ref.slideId, timeSec: command.type === 'PLAY_MEDIA' && bookmark?.ended ? settings.startSec : bookmark?.timeSec ?? settings.startSec,
            paused: command.type === 'PAUSE_MEDIA', replayPolicy: 'resume', epoch: command.commandId, ...(bookmark?.positionEpoch ? { positionEpoch: bookmark.positionEpoch } : {}), ...(autoplayEpoch ? { autoplayEpoch } : {}), ended: command.type === 'PAUSE_MEDIA' && bookmark?.ended === true }, enumerable: true, writable: true, configurable: true });
        }
      } else if (command.type === 'SET_AUTOPLAY' || command.type === 'PLAY_AUTOPLAY' || command.type === 'PAUSE_AUTOPLAY' || command.type === 'ADVANCE_AUTOPLAY') {
        if (document.closed || !next.presentedSelection || next.presentedSelection.documentId !== document.id || next.presentedSelection.slideId !== command.slideId) throw new CommandError('INVALID_TARGET');
        const checkpoint = document.autoplayCheckpoint;
        if (command.type === 'SET_AUTOPLAY') {
          if (!['session', 'document', 'slide'].includes(command.scope) || (command.rule === null ? command.scope === 'session' : !isSupportedAutoplayRule(command.rule))) throw new CommandError('INVALID_TARGET');
          if (command.rule?.loop === 'range') {
            const start = document.slideIds.indexOf(command.rule.range!.startSlideId), end = document.slideIds.indexOf(command.rule.range!.endSlideId);
            if (command.scope === 'session' || start < 0 || end < start) throw new CommandError('INVALID_TARGET');
          }
          stopDocument(next, document.id, now, false);
          if (command.scope === 'session') next.defaultAutoplay = structuredClone(command.rule!);
          else if (command.scope === 'document') {
            if (command.rule === null) delete document.autoplay; else document.autoplay = structuredClone(command.rule);
          } else {
            const delta = Object.hasOwn(document.slideDeltas, command.slideId) ? document.slideDeltas[command.slideId]! : { overlays: [], presenterNote: '', classLog: '' };
            if (command.rule === null) delete delta.autoplay; else delta.autoplay = structuredClone(command.rule);
            Object.defineProperty(document.slideDeltas, command.slideId, { value: delta, enumerable: true, writable: true, configurable: true });
          }
          document.autoplayCheckpoint = { slideId: command.slideId, epoch: command.commandId, elapsedMs: 0, startedAt: null, paused: true }; document.dirty = true;
        } else if (command.type === 'PAUSE_AUTOPLAY') {
          stopDocument(next, document.id, now, false);
        } else {
          const rule = resolveAutoplay(next, document, command.slideId);
          if (!isSupportedAutoplayRule(rule) || rule.mode === 'manual') throw new CommandError('INVALID_TARGET');
          if (command.type === 'PLAY_AUTOPLAY') {
            if (checkpoint && !checkpoint.paused) throw new CommandError('INVALID_TARGET');
            if (rule.loop === 'range' && autoplayNextSlide(document, command.slideId, rule) === null) throw new CommandError('INVALID_TARGET');
            if (isMediaAutoplay(rule) && mediaEndedForAutoplay(document, command.slideId, command.commandId) === null) throw new CommandError('INVALID_TARGET');
            const completedCycle = isMediaAutoplay(rule) && checkpoint && mediaEndedForAutoplay(document, command.slideId, checkpoint.epoch) === true;
            document.autoplayCheckpoint = { slideId: command.slideId, epoch: command.commandId, elapsedMs: checkpoint?.slideId === command.slideId && !completedCycle ? checkpoint.elapsedMs : 0, startedAt: now, paused: false };
            if (isMediaAutoplay(rule)) startAutoplayMedia(next, document.id, command.slideId, command.commandId);
          } else {
            if (!checkpoint || checkpoint.paused || checkpoint.slideId !== command.slideId || checkpoint.epoch !== command.epoch
              || !autoplayDue(rule, elapsedAutoplay(checkpoint, now), mediaEndedForAutoplay(document, command.slideId, checkpoint.epoch))) throw new CommandError('INVALID_TARGET');
            const target = autoplayNextSlide(document, command.slideId, rule);
            stopDocument(next, document.id, now, false);
            if (target === null) document.autoplayCheckpoint = pauseAutoplay(checkpoint, now);
            else {
              next.presentedSelection = { documentId: document.id, slideId: target }; document.lastSlideId = target;
              const targetRule = resolveAutoplay(next, document, target), running = isSupportedAutoplayRule(targetRule) && targetRule.mode !== 'manual'
                && (!isMediaAutoplay(targetRule) || mediaEndedForAutoplay(document, target, command.commandId) !== null);
              document.autoplayCheckpoint = { slideId: target, epoch: command.commandId, elapsedMs: 0, startedAt: running ? now : null, paused: !running };
              if (running && isMediaAutoplay(targetRule)) startAutoplayMedia(next, document.id, target, command.commandId);
            }
          }
        }
      } else if (command.type === 'GOTO_SLIDE') {
        if (document.closed || !session.presentedSelection || session.presentedSelection.documentId !== document.id) throw new CommandError('INVALID_TARGET');
        if (session.presentedSelection.slideId !== command.slideId) {
          stopDocument(next, document.id, now, false);
          if (document.autoplayCheckpoint) document.autoplayCheckpoint = { slideId: command.slideId, epoch: command.commandId, elapsedMs: 0, startedAt: null, paused: true };
        }
        next.presentedSelection = { documentId: document.id, slideId: command.slideId };
        document.lastSlideId = command.slideId;
      } else if (command.type === 'SELECT_EDITOR_SLIDE') {
        next.editorSelection = { documentId: document.id, slideId: command.slideId };
      } else if (command.type === 'SET_PRESENTER_NOTE' || command.type === 'SET_SLIDE_OVERLAYS') {
        if (command.type === 'SET_PRESENTER_NOTE' && (typeof command.note !== 'string' || command.note.length > 100_000)) throw new CommandError('INVALID_TARGET');
        if (command.type === 'SET_SLIDE_OVERLAYS' && !isOverlayList(command.overlays)) throw new CommandError('INVALID_TARGET');
        const delta = (Object.hasOwn(document.slideDeltas, command.slideId) ? document.slideDeltas[command.slideId] : undefined)
          ?? { overlays: [], presenterNote: '', classLog: '' };
        Object.defineProperty(document.slideDeltas, command.slideId, {
          value: command.type === 'SET_PRESENTER_NOTE' ? { ...delta, presenterNote: command.note }
            : { ...delta, overlays: structuredClone(command.overlays) }, enumerable: true, writable: true, configurable: true,
        });
        document.dirty = true;
      } else {
        throw new CommandError('INVALID_TARGET');
      }
    }
  }
  if (next.presentationTransition && (!currentPresentationTransition(next, next.presentationTransition)
    || ['SET_MEDIA_PLAYBACK', 'ADD_LOCAL_MEDIA', 'SET_SLIDE_OVERLAYS'].includes(command.type) && command.documentId === next.presentationTransition.documentId)) next.presentationTransition = null;
  next.revision++;
  next.updatedAt = now;
  return next;
}
