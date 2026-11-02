import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatSongTitle } from '../src/utils/song.ts';

test('joins artist and title', () => {
  assert.equal(formatSongTitle({ artist: 'Boards of Canada', title: 'Roygbiv' }), 'Boards of Canada - Roygbiv');
});

test('omits the separator when one side is missing', () => {
  assert.equal(formatSongTitle({ title: 'Roygbiv' }), 'Roygbiv');
  assert.equal(formatSongTitle({ artist: 'Boards of Canada' }), 'Boards of Canada');
  assert.equal(formatSongTitle({ artist: '', title: 'Roygbiv' }), 'Roygbiv');
});

test('returns an empty string when both are missing', () => {
  assert.equal(formatSongTitle({}), '');
});
