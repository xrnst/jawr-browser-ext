import type { VolumeState } from '../types';

const VOLUME_KEY = 'jawr_volume';
const THEME_KEY = 'jawr_theme';

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

export type Theme = 'light' | 'dark';

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {}
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

export async function loadNotifications(): Promise<boolean> {
  try {
    const result = await browser.storage.local.get('jawr_notifications');
    if ('jawr_notifications' in result) return result.jawr_notifications as boolean;
  } catch {}
  return true;
}

export async function saveNotifications(enabled: boolean): Promise<void> {
  try {
    await browser.storage.local.set({ jawr_notifications: enabled });
  } catch {}
}

export async function loadArtistLinks(): Promise<boolean> {
  try {
    const result = await browser.storage.local.get('jawr_artist_links');
    if ('jawr_artist_links' in result) return result.jawr_artist_links as boolean;
  } catch {}
  return false;
}

export async function saveArtistLinks(enabled: boolean): Promise<void> {
  try {
    await browser.storage.local.set({ jawr_artist_links: enabled });
  } catch {}
}

export async function loadCompactMode(): Promise<boolean> {
  try {
    const result = await browser.storage.local.get('jawr_compact');
    if ('jawr_compact' in result) return result.jawr_compact as boolean;
  } catch {}
  return false;
}

export async function saveCompactMode(enabled: boolean): Promise<void> {
  try {
    await browser.storage.local.set({ jawr_compact: enabled });
  } catch {}
}
