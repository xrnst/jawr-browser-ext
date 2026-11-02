import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toNowPlayingUpdate } from '../src/utils/now-playing.ts';
import { formatShareText } from '../src/utils/share.ts';

test('maps current, next and history songs', () => {
  const current = { artist: 'Boards of Canada', title: 'Roygbiv' };
  const next = { artist: 'Aphex Twin', title: 'Xtal' };
  const history = [{ song: { artist: 'Autechre', title: 'Bike' }, played_at: 1 }];
  assert.deepEqual(
    toNowPlayingUpdate({ now_playing: { song: current }, playing_next: { song: next }, song_history: history }),
    { song: current, nextSong: next, history },
  );
});

test('defaults missing fields to empty values', () => {
  assert.deepEqual(toNowPlayingUpdate({ playing_next: null }), { song: null, nextSong: null, history: [] });
});

test('share text carries label, song and link', () => {
  assert.equal(
    formatShareText({ artist: 'Aphex Twin', title: 'Xtal' }, 'tocando agora'),
    '📻 jawr · tocando agora\n\nAphex Twin - Xtal\n\n@radiojawr\nhttps://jawr.org',
  );
});
