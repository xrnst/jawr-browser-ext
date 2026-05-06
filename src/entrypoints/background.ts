import type { ExtensionMessage, ExtensionState, Song, VolumeState } from '../types';
import { fetchNowPlaying } from '../utils/api';
import { computeFrequencyBands, FFT_SIZE, FFT_SMOOTHING, STREAM_INTERVAL_MS } from '../utils/fft';
import { getToken, buildAuthUrl, getSession, scrobble, updateNowPlaying } from '../utils/lastfm';
import { registerMediaActions, setMediaMetadata, setMediaPlaybackState } from '../utils/media-session';
import { createReconnector } from '../utils/reconnect';
import { loadLastfmSession, loadPendingLastfmToken, loadNotifications, loadVolume, saveLastfmSession, savePendingLastfmToken, saveVolume } from '../utils/storage';
import { createWebSocketManager } from '../utils/websocket';

const STREAM_URL = `${import.meta.env.VITE_AZURACAST_URL}/listen/jawr/radio.mp3`;
const WS_URL = `${import.meta.env.VITE_AZURACAST_URL_WS}/api/live/nowplaying/websocket`;

let state: ExtensionState = {
  playing: false,
  song: null,
  history: [],
  volume: loadVolume(),
  lastfmSession: null,
  lastfmPending: false,
};

let pendingLastfmToken: string | null = null;
let scrobbleTimer: ReturnType<typeof setTimeout> | null = null;
let trackStartTimestamp = 0;

Promise.all([loadLastfmSession(), loadPendingLastfmToken()]).then(([session, token]) => {
  pendingLastfmToken = token;
  state = { ...state, lastfmSession: session, lastfmPending: token !== null };
});

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

function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');
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

const firefoxReconnector = createReconnector(() => {
  if (!firefoxAudio) return Promise.reject();
  firefoxAudio.src = STREAM_URL;
  return firefoxAudio.play();
});

function firefoxEnsureAudioElement(): HTMLAudioElement {
  if (firefoxAudio) return firefoxAudio;
  const el = new Audio();
  el.preload = 'none';
  el.crossOrigin = 'anonymous';
  el.addEventListener('error', firefoxReconnector.schedule);
  el.addEventListener('stalled', firefoxReconnector.schedule);
  el.addEventListener('ended', firefoxReconnector.schedule);
  registerMediaActions({ onPlay: () => play(), onPause: () => pause() });
  firefoxAudio = el;
  return el;
}

function firefoxPlay() {
  firefoxReconnector.arm();
  const el = firefoxEnsureAudioElement();
  el.volume = state.volume.value;
  el.muted = state.volume.isMuted;
  el.src = STREAM_URL;
  el.play()
    .then(() => firefoxEnsureAnalyser())
    .catch(() => setState({ playing: false }));
  setMediaPlaybackState('playing');
  setMediaMetadata(state.song);
  setState({ playing: true });
}

function firefoxPause() {
  firefoxReconnector.cancel();
  firefoxStopFft();
  firefoxAudio?.pause();
  if (firefoxAudio) firefoxAudio.src = '';
  setMediaPlaybackState('paused');
  setState({ playing: false });
}

function firefoxApplyVolume(volume: VolumeState) {
  if (!firefoxAudio) return;
  firefoxAudio.volume = volume.value;
  firefoxAudio.muted = volume.isMuted;
}

// --- Chrome: offscreen audio ---

const OFFSCREEN_URL = 'offscreen.html';

async function hasOffscreenDocument(): Promise<boolean> {
  const url = chrome.runtime.getURL(OFFSCREEN_URL);
  const contexts = (await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    documentUrls: [url],
  })) as chrome.runtime.ExtensionContext[];
  return contexts.length > 0;
}

async function chromeEnsureOffscreen() {
  if (await hasOffscreenDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: 'Radio audio playback',
  });
}

async function chromeSendToOffscreen(msg: ExtensionMessage) {
  if (!(await hasOffscreenDocument())) return;
  chrome.runtime.sendMessage(msg).catch(() => {});
}

async function chromePlay() {
  await chromeEnsureOffscreen();
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_PLAY', payload: STREAM_URL });
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_METADATA', payload: state.song });
  setState({ playing: true });
}

async function chromePause() {
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_PAUSE' });
  setState({ playing: false });
}

async function chromeSendVolume(volume: VolumeState) {
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_SET_VOLUME', payload: volume.value });
  await chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_SET_MUTED', payload: volume.isMuted });
}

// --- Unified API ---

async function play() {
  if (isFirefox()) firefoxPlay();
  else await chromePlay();
  if (state.song) {
    if (state.lastfmSession && state.song.artist && state.song.title) {
      updateNowPlaying(state.lastfmSession.key, state.song.artist, state.song.title).catch(() => {});
    }
    resetScrobbleTimer(state.song);
  }
}

function pause() {
  if (scrobbleTimer) {
    clearTimeout(scrobbleTimer);
    scrobbleTimer = null;
  }
  if (isFirefox()) firefoxPause();
  else chromePause();
}

function applyVolume(volume: VolumeState) {
  if (isFirefox()) firefoxApplyVolume(volume);
  else chromeSendVolume(volume);
}

// --- WebSocket ---

function resetScrobbleTimer(song: Song) {
  if (scrobbleTimer) clearTimeout(scrobbleTimer);
  scrobbleTimer = null;
  if (!state.lastfmSession || !song.artist || !song.title) return;
  trackStartTimestamp = Math.floor(Date.now() / 1000);
  scrobbleTimer = setTimeout(() => {
    if (!state.lastfmSession || !song.artist || !song.title) return;
    scrobble(state.lastfmSession.key, song.artist, song.title, trackStartTimestamp).catch(() => {});
    scrobbleTimer = null;
  }, 60_000);
}

function handleNowPlayingUpdate({ song, history }: { song: Song | null; history: ExtensionState['history'] }) {
  const prev = state.song;
  const changed = song && (song.title !== prev?.title || song.artist !== prev?.artist);
  setState({ song, history });
  if (!changed || !song || !state.playing) return;
  if (state.lastfmSession && song.artist && song.title) {
    updateNowPlaying(state.lastfmSession.key, song.artist, song.title).catch(() => {});
  }
  resetScrobbleTimer(song);
  loadNotifications().then((enabled) => {
    if (!enabled) return;
    const title = song.artist ? `${song.artist} - ${song.title}` : (song.title ?? '');
    browser.notifications.create({
      type: 'basic',
      iconUrl: song.art ?? '',
      title: 'jawr.org',
      message: title,
    });
  });
}

// --- Entry ---

const VOLUME_STEP = 0.1;

function showNowPlayingNotification() {
  const song = state.song;
  if (!song) return;
  const title = song.artist ? `${song.artist} - ${song.title}` : (song.title ?? '');
  browser.notifications.create({
    type: 'basic',
    iconUrl: song.art ?? '',
    title: 'jawr.org',
    message: title,
  });
}

export default defineBackground(() => {
  createWebSocketManager(WS_URL, handleNowPlayingUpdate);

  fetchNowPlaying().then(({ song, history }) => {
    setState({ song, history });
  });

  browser.commands.onCommand.addListener((command) => {
    switch (command) {
      case 'toggle-radio':
        if (state.playing) pause();
        else play();
        break;
      case 'display-now-playing':
        showNowPlayingNotification();
        break;
      case 'lower-volume': {
        const value = Math.max(0, Math.round((state.volume.value - VOLUME_STEP) * 100) / 100);
        const volume = { ...state.volume, value };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        break;
      }
      case 'raise-volume': {
        const value = Math.min(1, Math.round((state.volume.value + VOLUME_STEP) * 100) / 100);
        const volume = { ...state.volume, value };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        break;
      }
    }
  });

  browser.runtime.onMessage.addListener((rawMessage, _sender, sendResponse) => {
    const message = rawMessage as ExtensionMessage;
    if (message.target !== 'background') return false;
    switch (message.type) {
      case 'GET_STATE':
        sendResponse(state);
        return true;
      case 'PLAY':
        play();
        return false;
      case 'PAUSE':
        pause();
        return false;
      case 'TOGGLE_MUTE': {
        const volume = { ...state.volume, isMuted: !state.volume.isMuted };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        return false;
      }
      case 'SET_VOLUME': {
        const volume = { ...state.volume, value: message.payload };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        return false;
      }
      case 'OFFSCREEN_ERROR':
        setState({ playing: false });
        return false;
      case 'OFFSCREEN_MEDIA_PLAY':
        play();
        return false;
      case 'OFFSCREEN_MEDIA_PAUSE':
        pause();
        return false;
      case 'FFT_START':
        if (isFirefox()) firefoxStartFft(message.payload);
        else chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_FFT_START', payload: message.payload });
        return false;
      case 'FFT_STOP':
        if (isFirefox()) firefoxStopFft();
        else chromeSendToOffscreen({ target: 'offscreen', type: 'OFFSCREEN_FFT_STOP' });
        return false;
      case 'LASTFM_CONNECT': {
        getToken()
          .then((token) => {
            pendingLastfmToken = token;
            savePendingLastfmToken(token);
            setState({ lastfmPending: true });
            browser.tabs.create({ url: buildAuthUrl(token) });
            const poll = setInterval(() => {
              if (!pendingLastfmToken) {
                clearInterval(poll);
                return;
              }
              getSession(pendingLastfmToken)
                .then((session) => {
                  clearInterval(poll);
                  pendingLastfmToken = null;
                  savePendingLastfmToken(null);
                  saveLastfmSession(session);
                  setState({ lastfmSession: session, lastfmPending: false });
                })
                .catch(() => {});
            }, 3000);
          })
          .catch(() => {});
        return false;
      }
      case 'LASTFM_CONFIRM': {
        if (!pendingLastfmToken) return false;
        const token = pendingLastfmToken;
        pendingLastfmToken = null;
        savePendingLastfmToken(null);
        getSession(token)
          .then((session) => {
            saveLastfmSession(session);
            setState({ lastfmSession: session, lastfmPending: false });
          })
          .catch(() => {});
        return false;
      }
      case 'LASTFM_DISCONNECT': {
        pendingLastfmToken = null;
        savePendingLastfmToken(null);
        saveLastfmSession(null);
        setState({ lastfmSession: null, lastfmPending: false });
        if (scrobbleTimer) {
          clearTimeout(scrobbleTimer);
          scrobbleTimer = null;
        }
        return false;
      }
    }
    return false;
  });

  applyVolume(state.volume);
});
