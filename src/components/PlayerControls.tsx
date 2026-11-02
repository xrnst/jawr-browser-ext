import { PauseIcon, PlayIcon, SpeakerHighIcon, SpeakerSlashIcon } from '@phosphor-icons/react';
import type { Translations } from '../i18n';
import type { VolumeState } from '../types';
import { EqualizerBars } from './EqualizerBars';

type Props = {
  t: Translations;
  playing: boolean;
  reconnecting: boolean;
  streamError: boolean;
  volume: VolumeState;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
};

export function PlayerControls({ t, playing, reconnecting, streamError, volume, onPlay, onPause, onToggleMute, onSetVolume }: Props) {
  return (
    <div className="relative flex items-center h-11 border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-950">
      <button
        onClick={playing ? onPause : onPlay}
        className="flex items-center justify-center w-11 h-full border-r border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#b0b0b0] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0"
        aria-label={playing ? t.player_pause : t.player_play}
      >
        {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} weight="fill" />}
      </button>

      <span className="flex-1 px-3 flex justify-between items-center gap-2 text-xs text-gray-500 dark:text-gray-100">
        {!playing && <span>jawr.org</span>}
        {playing && <EqualizerBars />}
      </span>

      <button
        onClick={onToggleMute}
        className="flex items-center justify-center w-10 h-full border-l border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0"
        aria-label={volume.isMuted ? t.player_unmute : t.player_mute}
      >
        {volume.isMuted ? <SpeakerSlashIcon size={13} weight="fill" /> : <SpeakerHighIcon size={13} weight="fill" />}
      </button>

      <div className="flex items-center gap-2 px-3 border-l border-gray-200 dark:border-[#2a2a2a] shrink-0">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume.value}
          onChange={(e) => onSetVolume(Number(e.target.value))}
          className="w-14 cursor-pointer"
          style={{ accentColor: 'var(--dk-accent)' }}
          aria-label={t.player_volume}
        />
        <span className="text-xs text-gray-400 dark:text-[#6e6e6e] w-7 text-right tabular-nums">
          {Math.round(volume.value * 100)}%
        </span>
      </div>

      <div className="absolute top-full left-5 mt-1 text-[11px]">
        <p role="status" className="text-gray-500 dark:text-[#b0b0b0]">
          {reconnecting && t.player_reconnecting}
        </p>
        <p role="alert" className="text-rose-600 dark:text-rose-400">
          {streamError && t.player_error}
        </p>
      </div>
    </div>
  );
}
