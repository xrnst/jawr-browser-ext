import assert from 'node:assert/strict';
import { afterEach, beforeEach, mock, test } from 'node:test';
import { timeAgo } from '../src/utils/date.ts';

const NOW_SECONDS = 1_800_000_000;

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: NOW_SECONDS * 1000 });
});

afterEach(() => {
  mock.timers.reset();
});

test('seconds below one minute', () => {
  assert.equal(timeAgo(NOW_SECONDS), '0s');
  assert.equal(timeAgo(NOW_SECONDS - 59), '59s');
});

test('whole minutes below one hour', () => {
  assert.equal(timeAgo(NOW_SECONDS - 60), '1min');
  assert.equal(timeAgo(NOW_SECONDS - 3599), '59min');
});

test('whole hours from one hour up', () => {
  assert.equal(timeAgo(NOW_SECONDS - 3600), '1h');
  assert.equal(timeAgo(NOW_SECONDS - 7199), '1h');
  assert.equal(timeAgo(NOW_SECONDS - 86400), '24h');
});
