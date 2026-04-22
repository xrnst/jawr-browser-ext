import type { LastfmSession } from '../utils/lastfm';

export type Song = {
  artist?: string;
  title?: string;
  art?: string;
};

export type HistoryItem = {
  song?: { artist?: string; title?: string };
  played_at?: number;
};

export type VolumeState = {
  value: number;
  isMuted: boolean;
};

export type ExtensionState = {
  playing: boolean;
  song: Song | null;
  history: HistoryItem[];
  volume: VolumeState;
  lastfmSession: LastfmSession | null;
};

export type MessageTarget = 'background' | 'popup' | 'offscreen';

export type ExtensionMessage =
  | { target: 'background'; type: 'PLAY' }
  | { target: 'background'; type: 'PAUSE' }
  | { target: 'background'; type: 'TOGGLE_MUTE' }
  | { target: 'background'; type: 'SET_VOLUME'; payload: number }
  | { target: 'background'; type: 'GET_STATE' }
  | { target: 'background'; type: 'OFFSCREEN_ERROR' }
  | { target: 'popup'; type: 'STATE_UPDATE'; payload: ExtensionState }
  | { target: 'offscreen'; type: 'OFFSCREEN_PLAY'; payload: string }
  | { target: 'offscreen'; type: 'OFFSCREEN_PAUSE' }
  | { target: 'offscreen'; type: 'OFFSCREEN_SET_VOLUME'; payload: number }
  | { target: 'offscreen'; type: 'OFFSCREEN_SET_MUTED'; payload: boolean }
  | { target: 'background'; type: 'LASTFM_CONNECT' }
  | { target: 'background'; type: 'LASTFM_CONFIRM' }
  | { target: 'background'; type: 'LASTFM_DISCONNECT' };
