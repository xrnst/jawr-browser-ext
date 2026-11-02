import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseVolume } from '../src/utils/storage.ts';

test('keeps a valid saved volume', () => {
  assert.deepEqual(parseVolume({ value: 0.3, isMuted: true }), { value: 0.3, isMuted: true });
});

test('clamps an out-of-range volume', () => {
  assert.deepEqual(parseVolume({ value: 4, isMuted: false }), { value: 1, isMuted: false });
  assert.deepEqual(parseVolume({ value: -1, isMuted: false }), { value: 0, isMuted: false });
});

test('falls back to the default on a malformed value', () => {
  assert.deepEqual(parseVolume({ value: Number.NaN, isMuted: 'yes' }), { value: 0.5, isMuted: true });
  assert.deepEqual(parseVolume('0.4'), { value: 0.5, isMuted: false });
  assert.deepEqual(parseVolume(null), { value: 0.5, isMuted: false });
});
