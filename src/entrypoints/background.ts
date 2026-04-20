import type { ExtensionMessage, ExtensionState, VolumeState } from '../types';
import { fetchNowPlaying } from '../utils/api';
import { loadVolume, saveVolume } from '../utils/storage';
import { createWebSocketManager } from '../utils/websocket';

const STREAM_URL = `${import.meta.env.VITE_AZURACAST_URL}/listen/jawr/radio.mp3`;
const WS_URL = `${import.meta.env.VITE_AZURACAST_URL_WS}/api/live/nowplaying/websocket`;

let state: ExtensionState = {
  playing: false,
  song: null,
  history: [],
  volume: loadVolume(),
};

function broadcast(msg: ExtensionMessage) {
  browser.runtime.sendMessage(msg).catch(() => {});
}

function setState(partial: Partial<ExtensionState>) {
  state = { ...state, ...partial };
  broadcast({ type: 'STATE_UPDATE', payload: state });
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

async function chromeEnsureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (!existing) {
    await chrome.offscreen.createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Radio audio playback',
    });
  }
}

async function chromePlay() {
  await chromeEnsureOffscreen();
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_PLAY', payload: STREAM_URL } satisfies ExtensionMessage);
  setState({ playing: true });
}

function chromePause() {
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE' } satisfies ExtensionMessage);
  setState({ playing: false });
}

function chromeSendVolume(volume: VolumeState) {
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_SET_VOLUME', payload: volume.value } satisfies ExtensionMessage);
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_SET_MUTED', payload: volume.isMuted } satisfies ExtensionMessage);
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

// --- WebSocket ---

createWebSocketManager(WS_URL, ({ song, history }) => {
  setState({ song, history });
});

// --- Initial fetch ---

fetchNowPlaying().then(({ song, history }) => {
  setState({ song, history });
});

// --- Entry ---

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'GET_STATE':
        sendResponse(state);
        break;
      case 'PLAY':
        play();
        break;
      case 'PAUSE':
        pause();
        break;
      case 'TOGGLE_MUTE': {
        const volume = { ...state.volume, isMuted: !state.volume.isMuted };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        break;
      }
      case 'SET_VOLUME': {
        const volume = { ...state.volume, value: message.payload };
        saveVolume(volume);
        applyVolume(volume);
        setState({ volume });
        break;
      }
      case 'OFFSCREEN_ERROR':
        setState({ playing: false });
        break;
    }
    return true;
  });

  applyVolume(state.volume);
});
