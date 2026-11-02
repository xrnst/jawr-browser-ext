import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeFrequencyBands, FFT_SIZE } from '../src/utils/fft.ts';

const SAMPLE_RATE = 48_000;
const BIN_HZ = SAMPLE_RATE / FFT_SIZE;

function analyserWith(spectrum: Record<number, number>) {
  const analyser = {
    fftSize: FFT_SIZE,
    context: { sampleRate: SAMPLE_RATE },
    getByteFrequencyData(target: Uint8Array) {
      target.fill(0);
      for (const [bin, value] of Object.entries(spectrum)) target[Number(bin)] = value;
    },
  };
  return analyser as unknown as AnalyserNode;
}

function bands(spectrum: Record<number, number>, bars = 5) {
  const buffer = new Uint8Array(FFT_SIZE / 2) as Uint8Array<ArrayBuffer>;
  return computeFrequencyBands(analyserWith(spectrum), buffer, bars);
}

const binFor = (hz: number) => Math.round(hz / BIN_HZ);

test('returns one value per bar', () => {
  assert.equal(bands({}, 5).length, 5);
  assert.equal(bands({}, 12).length, 12);
});

test('bass lands in the first bar and treble in the last', () => {
  assert.deepEqual(bands({ [binFor(90)]: 200 }), [200, 0, 0, 0, 0]);
  assert.deepEqual(bands({ [binFor(9000)]: 180 }), [0, 0, 0, 0, 180]);
});

test('each bar reports the peak of its bins, not the sum', () => {
  const [, , , , treble] = bands({ [binFor(6000)]: 90, [binFor(9000)]: 140, [binFor(12000)]: 60 });
  assert.equal(treble, 140);
});

test('ignores energy outside 40 Hz - 16 kHz', () => {
  assert.deepEqual(bands({ 0: 255, [binFor(20000)]: 255 }), [0, 0, 0, 0, 0]);
});
