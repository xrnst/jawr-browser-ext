import type { Song } from '../types';

const SHARE_URL = 'https://jawr.org';

export function formatShareText(song: Pick<Song, 'artist' | 'title'>, nowPlayingLabel: string): string {
  return `📻 jawr · ${nowPlayingLabel}\n\n${song.artist} - ${song.title}\n\n@radiojawr\n${SHARE_URL}`;
}
