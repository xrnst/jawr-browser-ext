import type { HistoryItem, Song } from '../types';

export type NowPlayingUpdate = {
  song: Song | null;
  nextSong: Song | null;
  history: HistoryItem[];
};

type AzuraCastNowPlaying = {
  now_playing?: { song?: Song } | null;
  playing_next?: { song?: Song } | null;
  song_history?: HistoryItem[] | null;
};

type Publication = { 'data'?: { np?: AzuraCastNowPlaying } };

type CentrifugoMessage = {
  connect?: { subs?: Record<string, { publications?: unknown }> };
  channel?: string;
  pub?: Publication;
};

export function toNowPlayingUpdate(np: AzuraCastNowPlaying): NowPlayingUpdate {
  return {
    song: np.now_playing?.song ?? null,
    nextSong: np.playing_next?.song ?? null,
    history: np.song_history ?? [],
  };
}

function parseLine(line: string): CentrifugoMessage {
  try {
    return JSON.parse(line) ?? {};
  } catch {
    return {};
  }
}

function toUpdates(pub: Publication | undefined): NowPlayingUpdate[] {
  const np = pub?.data?.np;
  return np ? [toNowPlayingUpdate(np)] : [];
}

export function readNowPlayingFrame(frame: string, channel: string): NowPlayingUpdate[] {
  const updates: NowPlayingUpdate[] = [];
  for (const line of frame.split('\n')) {
    if (!line.trim()) continue;
    const msg = parseLine(line);
    if (msg.connect) {
      const pubs = msg.connect.subs?.[channel]?.publications;
      if (Array.isArray(pubs)) updates.push(...(pubs as Publication[]).flatMap(toUpdates));
    } else if (msg.channel === channel) {
      updates.push(...toUpdates(msg.pub));
    }
  }
  return updates;
}
