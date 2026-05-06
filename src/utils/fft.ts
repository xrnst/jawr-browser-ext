export const FFT_SIZE = 1024;
export const FFT_SMOOTHING = 0.75;
export const STREAM_INTERVAL_MS = 1000 / 60;

const MIN_HZ = 40;
const MAX_HZ = 16000;

export function computeFrequencyBands(
  analyser: AnalyserNode,
  buffer: Uint8Array<ArrayBuffer>,
  bars: number,
): number[] {
  analyser.getByteFrequencyData(buffer);
  const binHz = analyser.context.sampleRate / analyser.fftSize;
  const minBin = Math.max(1, Math.floor(MIN_HZ / binHz));
  const maxBin = Math.min(buffer.length - 1, Math.ceil(MAX_HZ / binHz));
  const logMin = Math.log(minBin);
  const logMax = Math.log(maxBin);
  const out: number[] = new Array(bars);
  for (let i = 0; i < bars; i++) {
    const startBin = Math.floor(Math.exp(logMin + (logMax - logMin) * (i / bars)));
    const endBin = Math.max(startBin + 1, Math.floor(Math.exp(logMin + (logMax - logMin) * ((i + 1) / bars))));
    let peak = 0;
    for (let j = startBin; j < endBin; j++) {
      const v = buffer[j] || 0;
      if (v > peak) peak = v;
    }
    out[i] = peak;
  }
  return out;
}
