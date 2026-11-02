import type { Song } from '../types';

const ARTWORK_SIZES = ['96x96', '192x192', '512x512'] as const;
const ALBUM_NAME = 'jawr.';

type MediaActionHandlers = {
  onPlay: () => void;
  onPause: () => void;
};

function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function setMediaMetadata(song: Song | null): void {
  if (!hasMediaSession() || !song) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title ?? '',
    artist: song.artist ?? '',
    album: ALBUM_NAME,
    artwork: song.art ? ARTWORK_SIZES.map((sizes) => ({ src: song.art as string, sizes, type: 'image/jpeg' })) : [],
  });
}

export function setMediaPlaybackState(state: MediaSessionPlaybackState): void {
  if (!hasMediaSession()) return;
  navigator.mediaSession.playbackState = state;
}

export function registerMediaActions({ onPlay, onPause }: MediaActionHandlers): void {
  if (!hasMediaSession()) return;
  navigator.mediaSession.setActionHandler('play', onPlay);
  navigator.mediaSession.setActionHandler('pause', onPause);
  navigator.mediaSession.setActionHandler('stop', onPause);
}
