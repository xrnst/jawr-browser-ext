import type { StreamStatus } from '../types';

const RECONNECT_INITIAL_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 15_000;
const RECONNECT_MAX_ATTEMPTS = 10;
const DROP_EVENTS = ['error', 'ended'] as const;
const STALL_EVENTS = ['stalled', 'waiting'] as const;
const STALL_GRACE_MS = 5000;
const RELEASE_AFTER_PAUSE_MS = 60_000;

type Timer = ReturnType<typeof setTimeout>;

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function createStreamPlayer(
  audio: HTMLAudioElement,
  streamUrl: string,
  onStatus: (status: StreamStatus) => void,
) {
  let status: StreamStatus = { playing: false, reconnecting: false, streamError: false };
  let shouldPlay = false;
  let ignoreNextPause = false;
  let attempts = 0;
  let reconnectTimer: Timer | null = null;
  let stallTimer: Timer | null = null;
  let releaseTimer: Timer | null = null;

  function update(partial: Partial<StreamStatus>) {
    const next = { ...status, ...partial };
    if (next.playing === status.playing && next.reconnecting === status.reconnecting && next.streamError === status.streamError) return;
    status = next;
    onStatus(status);
  }

  function clearTimer(timer: Timer | null): null {
    if (timer) clearTimeout(timer);
    return null;
  }

  function releaseStreamLater() {
    releaseTimer = clearTimer(releaseTimer);
    releaseTimer = setTimeout(() => {
      releaseTimer = null;
      audio.removeAttribute('src');
      audio.load();
    }, RELEASE_AFTER_PAUSE_MS);
  }

  function giveUp() {
    shouldPlay = false;
    audio.pause();
    audio.src = '';
    update({ playing: false, reconnecting: false, streamError: true });
  }

  function scheduleReconnect() {
    stallTimer = clearTimer(stallTimer);
    if (!shouldPlay || reconnectTimer) return;
    if (attempts >= RECONNECT_MAX_ATTEMPTS) {
      giveUp();
      return;
    }
    const delay = Math.min(RECONNECT_INITIAL_DELAY_MS * 2 ** attempts, RECONNECT_MAX_DELAY_MS);
    attempts += 1;
    update({ reconnecting: true });
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!shouldPlay) return;
      // Firefox fires pause when the source of an unpaused element is swapped; Chromium does not.
      if (!audio.paused) ignoreNextPause = true;
      audio.src = streamUrl;
      audio.play().catch((error: unknown) => {
        if (!isAbort(error)) scheduleReconnect();
      });
    }, delay);
  }

  function handleDrop() {
    if (shouldPlay) scheduleReconnect();
  }

  function handleStall() {
    if (!shouldPlay || stallTimer || reconnectTimer) return;
    const stalledAt = audio.currentTime;
    stallTimer = setTimeout(() => {
      stallTimer = null;
      if (audio.currentTime > stalledAt) return;
      scheduleReconnect();
    }, STALL_GRACE_MS);
  }

  function handlePlaying() {
    ignoreNextPause = false;
    attempts = 0;
    reconnectTimer = clearTimer(reconnectTimer);
    stallTimer = clearTimer(stallTimer);
    update({ reconnecting: false });
  }

  function handlePause() {
    if (ignoreNextPause) {
      ignoreNextPause = false;
      return;
    }
    if (!shouldPlay || reconnectTimer || audio.ended || audio.error) return;
    shouldPlay = false;
    stallTimer = clearTimer(stallTimer);
    update({ playing: false, reconnecting: false });
    releaseStreamLater();
  }

  DROP_EVENTS.forEach((evt) => audio.addEventListener(evt, handleDrop));
  STALL_EVENTS.forEach((evt) => audio.addEventListener(evt, handleStall));
  audio.addEventListener('playing', handlePlaying);
  audio.addEventListener('pause', handlePause);

  function resetTimers() {
    attempts = 0;
    ignoreNextPause = false;
    reconnectTimer = clearTimer(reconnectTimer);
    stallTimer = clearTimer(stallTimer);
    releaseTimer = clearTimer(releaseTimer);
  }

  function play(): Promise<boolean> {
    resetTimers();
    shouldPlay = true;
    audio.src = streamUrl;
    update({ playing: true, reconnecting: false, streamError: false });
    return audio.play().then(
      () => true,
      (error: unknown) => {
        if (isAbort(error)) return false;
        shouldPlay = false;
        resetTimers();
        audio.src = '';
        update({ playing: false, reconnecting: false, streamError: true });
        return false;
      },
    );
  }

  function pause() {
    resetTimers();
    shouldPlay = false;
    audio.pause();
    releaseStreamLater();
    update({ playing: false, reconnecting: false });
  }

  return { play, pause };
}
