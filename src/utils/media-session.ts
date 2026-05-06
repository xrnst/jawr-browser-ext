import type { Song } from '../types';

type MediaActionHandlers = {
  onPlay: () => void;
  onPause: () => void;
};

function hasMediaSession(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

export function setMediaMetadata(song: Song | null): void {
  if (!hasMediaSession()) return;
  if (!song) {
    navigator.mediaSession.metadata = null;
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title ?? '',
    artist: song.artist ?? '',
    artwork: song.art ? [{ src: song.art, sizes: '512x512', type: 'image/jpeg' }] : [],
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
