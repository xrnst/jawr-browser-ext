import {
  DownloadSimpleIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from '@phosphor-icons/react';
import type { ExtensionState } from '../types';
import { timeAgo } from '../utils/date';

type Props = {
  state: ExtensionState;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
};

export function RadioPlayer({ state, onPlay, onPause, onToggleMute, onSetVolume }: Props) {
  const { playing, song, history, volume } = state;

  return (
    <div className="flex flex-col gap-6 p-4 w-80 min-h-[480px] bg-white dark:bg-[#111] text-gray-900 dark:text-[#f0f0f0]">
      {/* Live indicator */}
      <p className="flex items-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full bg-red-700"
          style={{ animation: 'pulse 2s ease-in-out infinite' }}
        />
        <span className="text-xs font-bold text-red-700 tracking-widest uppercase">ao vivo</span>
      </p>

      {/* Album art */}
      {song?.art ? (
        <img
          src={song.art}
          alt="album art"
          className="w-full aspect-square object-cover border border-gray-200 dark:border-[#2a2a2a]"
        />
      ) : (
        <div className="w-full aspect-square border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-900" />
      )}

      {/* Player bar */}
      <div className="flex items-center h-11 border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-900">
        {/* Play/Pause */}
        <button
          onClick={playing ? onPause : onPlay}
          className="flex items-center justify-center w-11 h-full border-r border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#b0b0b0] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0"
          aria-label={playing ? 'pause' : 'play'}
        >
          {playing ? <PauseIcon /> : <PlayIcon weight="fill" />}
        </button>

        {/* Label + EQ */}
        <span className="flex-1 px-3 flex justify-between items-center gap-2 text-xs text-gray-500 dark:text-gray-100">
          <span>jawr.mp3</span>
          {playing && (
            <span className="inline-flex gap-0.5 items-end shrink-0">
              {(
                [
                  ['eq-a', '0.65s', '0s'],
                  ['eq-c', '0.9s', '0.1s'],
                  ['eq-b', '0.5s', '0.3s'],
                  ['eq-a', '0.75s', '0.05s'],
                  ['eq-c', '0.8s', '0.2s'],
                ] as const
              ).map(([kf, dur, delay], i) => (
                <span
                  key={i}
                  className="w-1 h-3.5 bg-gray-500 dark:bg-[#6e6e6e]"
                  style={{
                    animation: `${kf} ${dur} ease-in-out infinite ${delay}`,
                    transformOrigin: 'bottom',
                  }}
                />
              ))}
            </span>
          )}
        </span>

        {/* Mute */}
        <button
          onClick={onToggleMute}
          className="flex items-center justify-center w-10 h-full border-l border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0"
          aria-label={volume.isMuted ? 'unmute' : 'mute'}
        >
          {volume.isMuted ? (
            <SpeakerSlashIcon weight="fill" />
          ) : (
            <SpeakerHighIcon weight="fill" />
          )}
        </button>

        {/* Volume slider */}
        <div className="flex items-center gap-2 px-3 border-l border-gray-200 dark:border-[#2a2a2a] shrink-0">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume.value}
            onChange={(e) => onSetVolume(Number(e.target.value))}
            className="w-16 accent-gray-600 cursor-pointer"
            aria-label="volume"
          />
          <span className="text-xs text-gray-400 dark:text-[#6e6e6e] w-7 text-right tabular-nums">
            {Math.round(volume.value * 100)}%
          </span>
        </div>

        {/* Download M3U */}
        <a
          href="https://api.jawr.org/listen/jawr/radio.mp3.m3u"
          download
          className="flex items-center justify-center w-10 h-full border-l border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors shrink-0"
          aria-label="download m3u"
        >
          <DownloadSimpleIcon weight="fill" />
        </a>
      </div>

      {/* Now playing */}
      <div className="flex flex-col gap-3 text-sm">
        <p className="text-gray-600 dark:text-[#6e6e6e] font-bold">agora</p>
        <p className="text-gray-900 dark:text-[#f0f0f0]">
          {song ? `${song.artist} - ${song.title}` : '—'}
        </p>
        {song?.artist && (
          <p className="text-xs text-gray-400 dark:text-[#6e6e6e] flex gap-2">
            <a
              href={`https://www.last.fm/music/${encodeURIComponent(song.artist)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors"
            >
              [last.fm]
            </a>
            <a
              href={`https://www.discogs.com/search/?q=${encodeURIComponent(song.artist)}&type=artist`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors"
            >
              [discogs]
            </a>
          </p>
        )}
      </div>

      {/* History */}
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-600 dark:text-[#6e6e6e] font-bold">recentes</p>
        <ul className="flex flex-col text-xs text-gray-600 dark:text-[#b0b0b0]">
          {history.length === 0 && <li className="text-gray-300 dark:text-[#3a3a3a]">—</li>}
          {history.map(({ song: s, played_at }, i) => {
            if (!s) return null;
            const text = s.artist ? `${s.artist} - ${s.title}` : (s.title ?? '-');
            const ago = played_at ? timeAgo(played_at) : '';
            return (
              <li
                key={i}
                className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-[#2a2a2a] overflow-hidden"
              >
                <span className="flex-1 truncate">{text}</span>
                {ago && <span className="text-gray-300 dark:text-[#3a3a3a] shrink-0">{ago}</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
