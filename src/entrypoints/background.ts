import type { ExtensionMessage, ExtensionState, Song, VolumeState } from '../types';
import { fetchNowPlaying } from '../utils/api';
import { computeFrequencyBands, FFT_SIZE, FFT_SMOOTHING, STREAM_INTERVAL_MS } from '../utils/fft';
import { registerMediaActions, setMediaMetadata, setMediaPlaybackState } from '../utils/media-session';
import type { NowPlayingUpdate } from '../utils/now-playing';
import { formatSongTitle } from '../utils/song';
import { clampVolume, DEFAULT_VOLUME, loadNotifications, loadVolume, saveVolume } from '../utils/storage';
import { createStreamPlayer } from '../utils/stream-player';
import { createWebSocketManager } from '../utils/websocket';

const STREAM_URL = `${import.meta.env.VITE_AZURACAST_URL}/listen/jawr/radio.mp3`;
const WS_URL = `${import.meta.env.VITE_AZURACAST_URL_WS}/api/live/nowplaying/websocket`;

let state: ExtensionState = {
  playing: false,
  reconnecting: false,
  streamError: false,
  song: null,
  nextSong: null,
  history: [],
  volume: DEFAULT_VOLUME,
};

function broadcastToPopup(msg: ExtensionMessage) {
  browser.runtime.sendMessage(msg).catch(() => {});
}

function setState(partial: Partial<ExtensionState>) {
  const songChanged = 'song' in partial && partial.song !== state.song;
  state = { ...state, ...partial };
  broadcastToPopup({ target: 'popup', type: 'STATE_UPDATE', payload: state });
  if (songChanged) propagateMetadata(state.song);
}

function propagateMetadata(song: Song | null) {
  if (isFirefox()) setMediaMetadata(song);
  else chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_METADATA', payload: song });
}

// --- Firefox: direct audio ---
let firefoxAudio: HTMLAudioElement | null = null;
let firefoxAudioCtx: AudioContext | null = null;
let firefoxAnalyser: AnalyserNode | null = null;
let firefoxFftBuffer: Uint8Array<ArrayBuffer> | null = null;
let firefoxFftInterval: ReturnType<typeof setInterval> | null = null;
let firefoxFftBars = 5;

const IS_FIREFOX = import.meta.env.BROWSER === 'firefox';

function isFirefox(): boolean {
  return IS_FIREFOX;
}

function firefoxEnsureAnalyser() {
  if (firefoxAnalyser || !firefoxAudio) return;
  firefoxAudioCtx = new AudioContext();
  const source = firefoxAudioCtx.createMediaElementSource(firefoxAudio);
  firefoxAnalyser = firefoxAudioCtx.createAnalyser();
  firefoxAnalyser.fftSize = FFT_SIZE;
  firefoxAnalyser.smoothingTimeConstant = FFT_SMOOTHING;
  source.connect(firefoxAnalyser);
  firefoxAnalyser.connect(firefoxAudioCtx.destination);
  firefoxFftBuffer = new Uint8Array(firefoxAnalyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
}

function firefoxFftTick() {
  if (!firefoxAnalyser || !firefoxFftBuffer) return;
  const bands = computeFrequencyBands(firefoxAnalyser, firefoxFftBuffer, firefoxFftBars);
  browser.runtime
    .sendMessage({ target: 'popup', type: 'FFT_DATA', payload: bands } satisfies ExtensionMessage)
    .catch(() => {});
}

function firefoxStartFft(bars: number) {
  firefoxFftBars = Math.max(1, Math.floor(bars));
  if (!firefoxAudio || firefoxAudio.paused) return;
  firefoxEnsureAnalyser();
  if (firefoxAudioCtx?.state === 'suspended') firefoxAudioCtx.resume().catch(() => {});
  if (firefoxFftInterval !== null) return;
  firefoxFftInterval = setInterval(firefoxFftTick, STREAM_INTERVAL_MS);
}

function firefoxStopFft() {
  if (firefoxFftInterval !== null) {
    clearInterval(firefoxFftInterval);
    firefoxFftInterval = null;
  }
}

let firefoxPlayer: ReturnType<typeof createStreamPlayer> | null = null;

function firefoxEnsurePlayer() {
  if (firefoxPlayer) return firefoxPlayer;
  const el = new Audio();
  el.preload = 'none';
  el.crossOrigin = 'anonymous';
  firefoxPlayer = createStreamPlayer(el, STREAM_URL, (status) => {
    setMediaPlaybackState(status.playing ? 'playing' : 'paused');
    if (!status.playing) firefoxStopFft();
    setState(status);
  });
  registerMediaActions({
    onPlay: () => {
      if (!state.playing) play();
    },
    onPause: () => {
      if (state.playing) pause();
    },
  });
  firefoxAudio = el;
  return firefoxPlayer;
}

function firefoxPlay() {
  const player = firefoxEnsurePlayer();
  firefoxApplyVolume(state.volume);
  setMediaMetadata(state.song);
  player.play().then((started) => started && firefoxEnsureAnalyser());
}

function firefoxPause() {
  firefoxStopFft();
  firefoxPlayer?.pause();
}

function firefoxApplyVolume(volume: VolumeState) {
  if (!firefoxAudio) return;
  firefoxAudio.volume = volume.value;
  firefoxAudio.muted = volume.isMuted;
}

// --- Chrome: offscreen audio ---

type ChromeOffscreen = typeof import('../utils/chrome-offscreen');
let chromeOffscreenMod: ChromeOffscreen | null = null;

async function getChromeOffscreen(): Promise<ChromeOffscreen> {
  if (chromeOffscreenMod) return chromeOffscreenMod;
  chromeOffscreenMod = await import('../utils/chrome-offscreen');
  return chromeOffscreenMod;
}

async function chromeSendToOffscreen(msg: ExtensionMessage) {
  const m = await getChromeOffscreen();
  await m.sendToOffscreen(msg);
}

async function chromePlay() {
  const m = await getChromeOffscreen();
  await m.ensureOffscreen();
  await chromeSendVolume(state.volume);
  await m.sendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_PLAY', payload: STREAM_URL });
  await m.sendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_METADATA', payload: state.song });
}

async function chromePause() {
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_PAUSE' });
  setState({ playing: false, reconnecting: false });
}

async function chromeSendVolume(volume: VolumeState) {
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_SET_VOLUME', payload: volume.value });
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_SET_MUTED', payload: volume.isMuted });
}

// --- Unified API ---

async function play() {
  if (isFirefox()) firefoxPlay();
  else await chromePlay();
}

function pause() {
  if (isFirefox()) firefoxPause();
  else chromePause();
}

function applyVolume(volume: VolumeState) {
  if (isFirefox()) firefoxApplyVolume(volume);
  else chromeSendVolume(volume);
}

function stopFft() {
  if (isFirefox()) firefoxStopFft();
  else chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_FFT_STOP' });
}

async function syncPlaying() {
  if (isFirefox()) return;
  const m = await getChromeOffscreen();
  const status = (await m.getOffscreenStatus()) ?? {
    playing: false,
    reconnecting: false,
    streamError: state.streamError || state.reconnecting,
  };
  if (status.playing !== state.playing || status.reconnecting !== state.reconnecting || status.streamError !== state.streamError) {
    setState(status);
  }
}

// --- WebSocket ---

function handleNowPlayingUpdate({ song, nextSong, history }: NowPlayingUpdate) {
  const prev = state.song;
  const changed = song && (song.title !== prev?.title || song.artist !== prev?.artist);
  setState({ song, nextSong, history });
  if (!prev || !changed || !state.playing) return;
  loadNotifications().then((enabled) => {
    if (enabled) showNowPlayingNotification();
  });
}

// --- Entry ---

const VOLUME_STEP = 0.05;
const VOLUME_SAVE_DELAY_MS = 500;
let volumeSaveTimer: ReturnType<typeof setTimeout> | null = null;
let volumeLoaded: Promise<void> = Promise.resolve();

function changeVolume(update: (current: VolumeState) => VolumeState) {
  volumeLoaded.then(() => {
    const volume = update(state.volume);
    const next = { value: clampVolume(volume.value), isMuted: volume.isMuted };
    applyVolume(next);
    setState({ volume: next });
    if (volumeSaveTimer) clearTimeout(volumeSaveTimer);
    volumeSaveTimer = setTimeout(() => saveVolume(next), VOLUME_SAVE_DELAY_MS);
  });
}

async function showNowPlayingNotification() {
  const song = state.song;
  if (!song) return;
  const open = await browser.notifications.getAll();
  await Promise.all(Object.keys(open).map((id) => browser.notifications.clear(id)));
  const options = {
    type: 'basic' as const,
    iconUrl: song.art || browser.runtime.getURL('/icons/128.png'),
    title: 'jawr',
    message: formatSongTitle(song),
    ...(isFirefox() ? {} : { silent: true }),
  };
  await browser.notifications.create(options);
}

export default defineBackground(() => {
  volumeLoaded = loadVolume().then((volume) => {
    state = { ...state, volume };
    applyVolume(volume);
  });

  syncPlaying();

  createWebSocketManager(WS_URL, handleNowPlayingUpdate);

  fetchNowPlaying()
    .then((nowPlaying) => {
      if (!state.song) setState(nowPlaying);
    })
    .catch(() => {});

  browser.notifications.onClicked.addListener((id) => {
    browser.tabs.create({ url: 'https://jawr.org' });
    browser.notifications.clear(id);
  });

  browser.runtime.onConnect.addListener((port) => {
    if (port.name === 'popup') port.onDisconnect.addListener(stopFft);
  });

  browser.commands.onCommand.addListener((command) => {
    switch (command) {
      case 'toggle-radio':
        syncPlaying().then(() => (state.playing ? pause() : play()));
        break;
      case 'display-now-playing':
        showNowPlayingNotification();
        break;
      case 'lower-volume':
        changeVolume((v) => ({ ...v, value: v.value - VOLUME_STEP }));
        break;
      case 'raise-volume':
        changeVolume((v) => ({ ...v, value: v.value + VOLUME_STEP }));
        break;
      case 'toggle-mute':
        changeVolume((v) => ({ ...v, isMuted: !v.isMuted }));
        break;
    }
  });

  browser.runtime.onMessage.addListener((rawMessage: unknown) => {
    const message = rawMessage as ExtensionMessage;
    if (message.target !== 'background') return;
    switch (message.type) {
      case 'GET_STATE':
        return syncPlaying().then(() => state);
      case 'PLAY':
        play();
        return;
      case 'PAUSE':
        pause();
        return;
      case 'TOGGLE_MUTE':
        changeVolume((v) => ({ ...v, isMuted: !v.isMuted }));
        return;
      case 'SET_VOLUME':
        changeVolume((v) => ({ ...v, value: message.payload }));
        return;
      case 'OFFSCREEN_STATUS':
        setState(message.payload);
        return;
      case 'OFFSCREEN_MEDIA_PLAY':
        syncPlaying().then(() => {
          if (!state.playing) play();
        });
        return;
      case 'OFFSCREEN_MEDIA_PAUSE':
        syncPlaying().then(() => {
          if (state.playing) pause();
        });
        return;
      case 'FFT_START':
        if (isFirefox()) firefoxStartFft(message.payload);
        else chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_FFT_START', payload: message.payload });
        return;
      case 'FFT_STOP':
        stopFft();
        return;
    }
  });
});
