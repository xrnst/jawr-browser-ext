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
};

export type ExtensionMessage =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'GET_STATE' }
  | { type: 'STATE_UPDATE'; payload: ExtensionState }
  | { type: 'OFFSCREEN_PLAY'; payload: string }
  | { type: 'OFFSCREEN_PAUSE' }
  | { type: 'OFFSCREEN_SET_VOLUME'; payload: number }
  | { type: 'OFFSCREEN_SET_MUTED'; payload: boolean }
  | { type: 'OFFSCREEN_ERROR' };
