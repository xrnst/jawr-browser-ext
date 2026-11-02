import { useFrequencyBands } from '../utils/frequency-bands';

const BARS = 5;

export function EqualizerBars() {
  const bands = useFrequencyBands(BARS);
  return (
    <span className="inline-flex gap-0.5 items-end shrink-0 h-3.5">
      {bands.map((v, i) => (
        <span
          key={i}
          className="w-1 h-full origin-bottom bg-gray-500 dark:bg-[#6e6e6e]"
          style={{ transform: `scaleY(${Math.max(0.08, v / 255)})` }}
        />
      ))}
    </span>
  );
}
