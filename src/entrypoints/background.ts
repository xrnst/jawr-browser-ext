import type { ExtensionMessage, ExtensionState, Song, VolumeState } from '../types';
import { fetchNowPlaying } from '../utils/api';
import { getToken, buildAuthUrl, getSession, scrobble, updateNowPlaying } from '../utils/lastfm';
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
  state = { ...state, ...partial };
  broadcastToPopup({ target: 'popup', type: 'STATE_UPDATE', payload: state });
}

// --- Firefox: direct audio ---
let firefoxAudio: HTMLAudioElement | null = null;

function isFirefox(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');
}

function firefoxPlay() {
  if (!firefoxAudio) {
    firefoxAudio = new Audio();
    firefoxAudio.preload = 'none';
  }
  firefoxAudio.volume = state.volume.value;
  firefoxAudio.muted = state.volume.isMuted;
  firefoxAudio.src = STREAM_URL;
  firefoxAudio.play().catch(() => setState({ playing: false }));
  setState({ playing: true });
}

function firefoxPause() {
  firefoxAudio?.pause();
  if (firefoxAudio) firefoxAudio.src = '';
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
      title: 'jawr',
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
    title: 'jawr',
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
    if (message.target !== 'background') return true;
    switch (message.type) {
      case 'GET_STATE':
        sendResponse(state);
        return true;
      case 'PLAY':
        play();
        return true;
      case 'PAUSE':
        pause();
        return true;
      case 'TOGGLE_MUTE': {
        const volume = { ...state.volume, isMuted: !state.volume.isMuted };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        return true;
      }
      case 'SET_VOLUME': {
        const volume = { ...state.volume, value: message.payload };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        return true;
      }
      case 'OFFSCREEN_ERROR':
        setState({ playing: false });
        return true;
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
        return true;
      }
      case 'LASTFM_CONFIRM': {
        if (!pendingLastfmToken) return true;
        const token = pendingLastfmToken;
        pendingLastfmToken = null;
        savePendingLastfmToken(null);
        getSession(token)
          .then((session) => {
            saveLastfmSession(session);
            setState({ lastfmSession: session, lastfmPending: false });
          })
          .catch(() => {});
        return true;
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
        return true;
      }
    }
    return true;
  });

  applyVolume(state.volume);
});
