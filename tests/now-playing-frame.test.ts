import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readNowPlayingFrame } from '../src/utils/now-playing.ts';

const CHANNEL = 'station:jawr';
const current = { artist: 'Leila', title: 'Underwaters' };
const next = { artist: 'The Doors', title: 'Soul Kitchen' };
const np = { now_playing: { song: current }, playing_next: { song: next }, song_history: [] };
const update = { song: current, nextSong: next, history: [] };

const connectWithRecovery = JSON.stringify({
  connect: {
    client: 'c1',
    time: 1_792_792_452_048,
    subs: { [CHANNEL]: { recoverable: true, recovered: true, publications: [{ data: { np, current_time: 1 }, offset: 7 }] } },
  },
});
const connectWithoutRecovery = JSON.stringify({ connect: { subs: { [CHANNEL]: { recoverable: true, offset: 7 } } } });
const push = JSON.stringify({ channel: CHANNEL, pub: { data: { np }, offset: 8 } });

test('reads the recovered state that arrives with the connect reply', () => {
  assert.deepEqual(readNowPlayingFrame(connectWithRecovery, CHANNEL), [update]);
});

test('reads nothing from a connect reply without publications', () => {
  assert.deepEqual(readNowPlayingFrame(connectWithoutRecovery, CHANNEL), []);
});

test('reads a live publication on the station channel only', () => {
  assert.deepEqual(readNowPlayingFrame(push, CHANNEL), [update]);
  assert.deepEqual(readNowPlayingFrame(push, 'station:other'), []);
});

test('reads every message of a newline-batched frame', () => {
  assert.deepEqual(readNowPlayingFrame(`${connectWithRecovery}\n${push}`, CHANNEL), [update, update]);
});

test('ignores publications that are not a list, pings and malformed lines', () => {
  const odd = JSON.stringify({ connect: { subs: { [CHANNEL]: { publications: { np } } } } });
  assert.deepEqual(readNowPlayingFrame(odd, CHANNEL), []);
  assert.deepEqual(readNowPlayingFrame('{}', CHANNEL), []);
  assert.deepEqual(readNowPlayingFrame('{"connect":', CHANNEL), []);
  assert.deepEqual(readNowPlayingFrame('null', CHANNEL), []);
});
