import { toNowPlayingUpdate, type NowPlayingUpdate } from './now-playing';

const REQUEST_TIMEOUT_MS = 5000;

export async function fetchNowPlaying(): Promise<NowPlayingUpdate> {
  const base = import.meta.env.VITE_AZURACAST_URL as string;
  const res = await fetch(`${base}/api/nowplaying/jawr`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) return { song: null, nextSong: null, history: [] };
  return toNowPlayingUpdate(await res.json());
}
