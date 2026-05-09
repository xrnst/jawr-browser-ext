import type { VolumeState } from '../types';

const VOLUME_KEY = 'jawr_volume';
const THEME_KEY = 'jawr_theme';

const DEFAULT_VOLUME: VolumeState = { value: 0.5, isMuted: false };

export async function loadVolume(): Promise<VolumeState> {
  try {
    const result = await browser.storage.local.get(VOLUME_KEY);
    const raw = result[VOLUME_KEY];
    if (raw && typeof raw === 'object') return raw as VolumeState;
  } catch {}
  return DEFAULT_VOLUME;
}

export async function saveVolume(state: VolumeState): Promise<void> {
  try {
    await browser.storage.local.set({ [VOLUME_KEY]: state });
  } catch {}
}

export type Theme =
  | 'light'
  | 'dark'
  | 'amoled'
  | 'nord'
  | 'city-lights'
  | 'dracula'
  | 'catppuccin'
  | 'gruvbox'
  | 'everforest';

export const THEMES: Theme[] = [
  'light',
  'dark',
  'amoled',
  'nord',
  'city-lights',
  'dracula',
  'catppuccin',
  'gruvbox',
  'everforest',
];

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(THEME_KEY) as Theme | null;
    if (raw && THEMES.includes(raw)) return raw;
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

