import type { VolumeState } from '../types';

const VOLUME_KEY = 'jawr_volume';

const DEFAULT_VOLUME: VolumeState = { value: 0.5, isMuted: false };

export function loadVolume(): VolumeState {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (!raw) return DEFAULT_VOLUME;
    return JSON.parse(raw) as VolumeState;
  } catch {
    return DEFAULT_VOLUME;
  }
}

export function saveVolume(state: VolumeState): void {
  try {
    localStorage.setItem(VOLUME_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — ignore
  }
}
