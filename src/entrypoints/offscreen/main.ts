import type { ExtensionMessage, StreamStatus } from '../../types';
import { computeFrequencyBands, FFT_SIZE, FFT_SMOOTHING, STREAM_INTERVAL_MS } from '../../utils/fft';
import { registerMediaActions, setMediaMetadata, setMediaPlaybackState } from '../../utils/media-session';
import { createStreamPlayer } from '../../utils/stream-player';

const audio = new Audio();
audio.preload = 'none';
audio.crossOrigin = 'anonymous';

let player: ReturnType<typeof createStreamPlayer> | null = null;
let lastStatus: StreamStatus = { playing: false, reconnecting: false, streamError: false };

function ensurePlayer(src: string) {
  if (player) return player;
  player = createStreamPlayer(audio, src, (status) => {
    lastStatus = status;
    setMediaPlaybackState(status.playing ? 'playing' : 'paused');
    if (!status.playing) stopStream();
    chrome.runtime
      .sendMessage({ target: 'background', type: 'OFFSCREEN_STATUS', payload: status } satisfies ExtensionMessage)
      .catch(() => {});
  });
  return player;
}

function notifyBackground(type: 'OFFSCREEN_MEDIA_PLAY' | 'OFFSCREEN_MEDIA_PAUSE') {
  chrome.runtime
    .sendMessage({ target: 'background', type } satisfies ExtensionMessage)
    .catch(() => {});
}

registerMediaActions({
  onPlay: () => notifyBackground('OFFSCREEN_MEDIA_PLAY'),
  onPause: () => notifyBackground('OFFSCREEN_MEDIA_PAUSE'),
});

let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let fftBuffer: Uint8Array<ArrayBuffer> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;
let bandsCount = 5;
let pendingStart = false;

function ensureAnalyser() {
  if (analyser) return;
  audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audio);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  analyser.smoothingTimeConstant = FFT_SMOOTHING;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  fftBuffer = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
}

function streamTick() {
  if (!analyser || !fftBuffer) return;
  const bands = computeFrequencyBands(analyser, fftBuffer, bandsCount);
  chrome.runtime
    .sendMessage({ target: 'popup', type: 'FFT_DATA', payload: bands } satisfies ExtensionMessage)
    .catch(() => {});
}

function startStreamLoop() {
  ensureAnalyser();
  if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  if (intervalId !== null) return;
  intervalId = setInterval(streamTick, STREAM_INTERVAL_MS);
}

function startStream(bars: number) {
  bandsCount = Math.max(1, Math.floor(bars));
  if (!audio.src || audio.paused) {
    pendingStart = true;
    return;
  }
  startStreamLoop();
}

function stopStream() {
  pendingStart = false;
  if (intervalId !== null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

audio.addEventListener('playing', () => {
  if (!pendingStart) return;
  pendingStart = false;
  startStreamLoop();
});

function play(src: string) {
  ensurePlayer(src)
    .play()
    .then((started) => started && ensureAnalyser());
}

function pause() {
  stopStream();
  player?.pause();
}

chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return false;
  switch (message.type) {
    case 'OFFSCREEN_GET_STATUS':
      sendResponse(lastStatus);
      break;
    case 'OFFSCREEN_PLAY':
      play(message.payload);
      break;
    case 'OFFSCREEN_PAUSE':
      pause();
      break;
    case 'OFFSCREEN_METADATA':
      setMediaMetadata(message.payload);
      break;
    case 'OFFSCREEN_SET_VOLUME':
      audio.volume = message.payload;
      break;
    case 'OFFSCREEN_SET_MUTED':
      audio.muted = message.payload;
      break;
    case 'OFFSCREEN_FFT_START':
      startStream(message.payload);
      break;
    case 'OFFSCREEN_FFT_STOP':
      stopStream();
      break;
  }
  return false;
});
