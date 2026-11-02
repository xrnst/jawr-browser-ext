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

export type StreamStatus = {
  playing: boolean;
  reconnecting: boolean;
  streamError: boolean;
};

export type ExtensionState = StreamStatus & {
  song: Song | null;
  nextSong: Song | null;
  history: HistoryItem[];
  volume: VolumeState;
};

export type ExtensionMessage =
  | { target: 'background'; type: 'PLAY' }
  | { target: 'background'; type: 'PAUSE' }
  | { target: 'background'; type: 'TOGGLE_MUTE' }
  | { target: 'background'; type: 'SET_VOLUME'; payload: number }
  | { target: 'background'; type: 'GET_STATE' }
  | { target: 'background'; type: 'OFFSCREEN_STATUS'; payload: StreamStatus }
  | { target: 'popup'; type: 'STATE_UPDATE'; payload: ExtensionState }
  | { target: 'offscreen'; type: 'OFFSCREEN_PLAY'; payload: string }
  | { target: 'offscreen'; type: 'OFFSCREEN_PAUSE' }
  | { target: 'offscreen'; type: 'OFFSCREEN_SET_VOLUME'; payload: number }
  | { target: 'offscreen'; type: 'OFFSCREEN_SET_MUTED'; payload: boolean }
  | { target: 'offscreen'; type: 'OFFSCREEN_FFT_START'; payload: number }
  | { target: 'offscreen'; type: 'OFFSCREEN_FFT_STOP' }
  | { target: 'offscreen'; type: 'OFFSCREEN_METADATA'; payload: Song | null }
  | { target: 'offscreen'; type: 'OFFSCREEN_GET_STATUS' }
  | { target: 'background'; type: 'OFFSCREEN_MEDIA_PLAY' }
  | { target: 'background'; type: 'OFFSCREEN_MEDIA_PAUSE' }
  | { target: 'popup'; type: 'FFT_DATA'; payload: number[] }
  | { target: 'background'; type: 'FFT_START'; payload: number }
  | { target: 'background'; type: 'FFT_STOP' };
