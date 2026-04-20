import type { HistoryItem, Song } from '../types';

export async function fetchNowPlaying(): Promise<{
  song: Song | null;
  history: HistoryItem[];
}> {
  const base = import.meta.env.VITE_AZURACAST_URL as string;
  const res = await fetch(`${base}/api/nowplaying/jawr`);
  if (!res.ok) return { song: null, history: [] };
  const data = await res.json();
  return {
    song: data.now_playing?.song ?? null,
    history: (data.song_history as HistoryItem[]) ?? [],
  };
}
