import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { createStreamPlayer } from '../src/utils/stream-player.ts';
import type { StreamStatus } from '../src/types/index.ts';

const URL = 'https://radio.test/listen/jawr/radio.mp3';

class FakeAudio extends EventTarget {
  src = '';
  paused = true;
  currentTime = 0;
  ended = false;
  error: unknown = null;
  plays = 0;
  nextPlay: () => Promise<void> = () => Promise.resolve();

  play() {
    this.plays += 1;
    this.paused = false;
    return this.nextPlay();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    this.dispatchEvent(new Event('pause'));
  }

  load() {}

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  fire(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

function setup() {
  const audio = new FakeAudio();
  const statuses: StreamStatus[] = [];
  const player = createStreamPlayer(audio as unknown as HTMLAudioElement, URL, (s) => statuses.push(s));
  const last = () => statuses.at(-1);
  return { audio, player, last };
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await Promise.resolve();
};

const failing = () => Promise.reject(new Error('network'));

beforeEach(() => mock.timers.enable({ apis: ['setTimeout'] }));
afterEach(() => mock.timers.reset());

test('play loads the stream and reports playing', async () => {
  const { audio, player, last } = setup();
  assert.equal(await player.play(), true);
  assert.equal(audio.src, URL);
  assert.deepEqual(last(), { playing: true, reconnecting: false, streamError: false });
});

test('a refused play reports a stream error and drops the source', async () => {
  const { audio, player, last } = setup();
  audio.nextPlay = failing;
  assert.equal(await player.play(), false);
  assert.deepEqual(last(), { playing: false, reconnecting: false, streamError: true });
  assert.equal(audio.src, '');
});

test('an aborted play is not an error', async () => {
  const { audio, player, last } = setup();
  audio.nextPlay = () => Promise.reject(new DOMException('replaced', 'AbortError'));
  await player.play();
  assert.equal(last()?.streamError, false);
});

test('pause keeps the source for 60 seconds, then releases it', async () => {
  const { audio, player, last } = setup();
  await player.play();
  player.pause();
  assert.equal(last()?.playing, false);
  mock.timers.tick(59_999);
  assert.equal(audio.src, URL);
  mock.timers.tick(1);
  assert.equal(audio.src, '');
});

test('a stall that recovers within 5 seconds does not reconnect', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.fire('waiting');
  audio.currentTime = 1;
  mock.timers.tick(5000);
  mock.timers.tick(60_000);
  assert.equal(audio.plays, 1);
});

test('a stall that does not recover reconnects after the grace period', async () => {
  const { audio, player, last } = setup();
  await player.play();
  audio.fire('stalled');
  mock.timers.tick(5000);
  assert.equal(last()?.reconnecting, true);
  mock.timers.tick(1000);
  assert.equal(audio.plays, 2);
});

test('reconnects back off 1, 2, 4, 8, 15 seconds and give up after 10 attempts', async () => {
  const { audio, player, last } = setup();
  await player.play();
  audio.nextPlay = failing;
  audio.fire('error');
  for (const delay of [1000, 2000, 4000, 8000, 15_000, 15_000, 15_000, 15_000, 15_000, 15_000]) {
    const before = audio.plays;
    mock.timers.tick(delay - 1);
    assert.equal(audio.plays, before);
    mock.timers.tick(1);
    assert.equal(audio.plays, before + 1);
    await flush();
  }
  assert.deepEqual(last(), { playing: false, reconnecting: false, streamError: true });
});

test('playing again resets the backoff and clears reconnecting', async () => {
  const { audio, player, last } = setup();
  await player.play();
  audio.fire('ended');
  mock.timers.tick(1000);
  audio.fire('playing');
  assert.equal(last()?.reconnecting, false);
  audio.fire('ended');
  mock.timers.tick(1000);
  assert.equal(audio.plays, 3);
});

test('a pause from outside reports not playing', async () => {
  const { audio, player, last } = setup();
  await player.play();
  audio.pause();
  assert.equal(last()?.playing, false);
});

test('pausing during a reconnect wait cancels the reconnect', async () => {
  const { audio, player } = setup();
  await player.play();
  audio.fire('error');
  player.pause();
  mock.timers.tick(60_000);
  assert.equal(audio.plays, 1);
});
