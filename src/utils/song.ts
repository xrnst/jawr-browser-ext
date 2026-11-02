import type { Song } from '../types';

export function formatSongTitle(song: Pick<Song, 'artist' | 'title'>): string {
  return [song.artist, song.title].filter(Boolean).join(' - ');
}
