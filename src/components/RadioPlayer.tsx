import {
  ArrowSquareOutIcon,
  GearIcon,
  MoonIcon,
  PauseIcon,
  PlayIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  SunIcon,
  XIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import type { Theme } from '../utils/storage';
import type { Locale, Translations } from '../i18n';
import type { ExtensionState } from '../types';
import { timeAgo } from '../utils/date';
import type { LastfmSession } from '../utils/lastfm';

type Props = {
  state: ExtensionState;
  theme: Theme;
  notifications: boolean;
  artistLinks: boolean;
  compactMode: boolean;
  locale: Locale;
  t: Translations;
  onToggleTheme: () => void;
  onToggleNotifications: () => void;
  onToggleArtistLinks: () => void;
  onToggleCompactMode: () => void;
  onSetLocale: (l: Locale) => void;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
  lastfmSession: LastfmSession | null;
  lastfmPending: boolean;
  onLastfmConnect: () => void;
  onLastfmConfirm: () => void;
  onLastfmDisconnect: () => void;
};

const THEME_OPTIONS: { value: Theme; Icon: typeof SunIcon; key: keyof Translations }[] = [
  { value: 'light', Icon: SunIcon, key: 'theme_light' },
  { value: 'dark', Icon: MoonIcon, key: 'theme_dark' },
];

const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'english' },
  { value: 'pt', label: 'português' },
];


export function RadioPlayer({ state, theme, notifications, artistLinks, compactMode, locale, t, onToggleTheme, onToggleNotifications, onToggleArtistLinks, onToggleCompactMode, onSetLocale, onPlay, onPause, onToggleMute, onSetVolume, lastfmSession, lastfmPending, onLastfmConnect, onLastfmConfirm, onLastfmDisconnect }: Props) {
  const { playing, song, history, volume } = state;
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  return (
    <div className="flex flex-col w-80 min-h-[460px] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 font-mono">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <a
            href="https://jawr.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold tracking-[0.2em] uppercase text-gray-900 dark:text-gray-50 hover:opacity-60 transition-opacity"
          >
            jawr.
          </a>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
            <span className="text-[10px] tracking-[0.15em] uppercase text-red-500">{t.live_indicator}</span>
          </span>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="text-gray-300 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-50 transition-colors cursor-pointer"
          aria-label="settings"
        >
          {showSettings ? <XIcon size={14} /> : <GearIcon size={14} />}
        </button>
      </div>

      <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

      {showSettings ? (
        <div className="flex flex-col gap-5 flex-1 px-5 py-5">
          {/* appearance */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_appearance}</p>
            <div className="flex gap-1.5">
              {THEME_OPTIONS.map(({ value, Icon, key }) => (
                <button
                  key={value}
                  onClick={() => theme !== value && onToggleTheme()}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all cursor-pointer flex-1 justify-center ${
                    theme === value
                      ? 'border-gray-900 dark:border-[#f0f0f0] text-gray-900 dark:text-[#f0f0f0]'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:border-gray-400 dark:hover:border-[#6e6e6e]'
                  }`}
                >
                  <Icon size={12} weight={theme === value ? 'fill' : 'regular'} />
                  {t[key]}
                </button>
              ))}
            </div>
          </div>

          {/* language */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_language}</p>
            <div className="flex gap-1.5">
              {LOCALE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => locale !== value && onSetLocale(value)}
                  className={`flex items-center px-3 py-1.5 text-xs border transition-all cursor-pointer flex-1 justify-center ${
                    locale === value
                      ? 'border-gray-900 dark:border-[#f0f0f0] text-gray-900 dark:text-[#f0f0f0]'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:border-gray-400 dark:hover:border-[#6e6e6e]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* notifications */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_notifications}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-[#b0b0b0]">{t.settings_notifications_song_change}</span>
              <button
                onClick={onToggleNotifications}
                className={`relative w-8 h-[18px] border transition-all cursor-pointer overflow-hidden ${
                  notifications
                    ? 'border-gray-900 dark:border-[#f0f0f0] bg-gray-900 dark:bg-[#f0f0f0]'
                    : 'border-gray-200 dark:border-[#2a2a2a] bg-transparent'
                }`}
                aria-label="toggle notifications"
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] transition-all ${
                    notifications
                      ? 'translate-x-[14px] bg-gray-50 dark:bg-gray-900'
                      : 'translate-x-0 bg-gray-200 dark:bg-[#2a2a2a]'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* display */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_display}</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-[#b0b0b0]">{t.settings_artist_links}</span>
                <button
                  onClick={onToggleArtistLinks}
                  className={`relative w-8 h-[18px] border transition-all cursor-pointer overflow-hidden ${
                    artistLinks
                      ? 'border-gray-900 dark:border-[#f0f0f0] bg-gray-900 dark:bg-[#f0f0f0]'
                      : 'border-gray-200 dark:border-[#2a2a2a] bg-transparent'
                  }`}
                  aria-label="toggle artist links"
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] transition-all ${
                      artistLinks
                        ? 'translate-x-[14px] bg-gray-50 dark:bg-gray-900'
                        : 'translate-x-0 bg-gray-200 dark:bg-[#2a2a2a]'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-[#b0b0b0]">{t.settings_compact_mode}</span>
                <button
                  onClick={onToggleCompactMode}
                  className={`relative w-8 h-[18px] border transition-all cursor-pointer overflow-hidden ${
                    compactMode
                      ? 'border-gray-900 dark:border-[#f0f0f0] bg-gray-900 dark:bg-[#f0f0f0]'
                      : 'border-gray-200 dark:border-[#2a2a2a] bg-transparent'
                  }`}
                  aria-label="toggle compact mode"
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[12px] h-[12px] transition-all ${
                      compactMode
                        ? 'translate-x-[14px] bg-gray-50 dark:bg-gray-900'
                        : 'translate-x-0 bg-gray-200 dark:bg-[#2a2a2a]'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* last.fm */}
          <div className="flex flex-col gap-2.5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.settings_lastfm}</p>
            <div className="flex items-center justify-between">
              {lastfmSession ? (
                <>
                  <span className="text-xs text-gray-600 dark:text-[#b0b0b0] flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                    {lastfmSession.name}
                  </span>
                  <button
                    onClick={onLastfmDisconnect}
                    className="text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer underline"
                  >
                    {t.lastfm_disconnect}
                  </button>
                </>
              ) : lastfmPending ? (
                <>
                  <span className="text-xs text-gray-400 dark:text-[#6e6e6e]">{t.lastfm_pending}</span>
                  <button
                    onClick={onLastfmConfirm}
                    className="text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer underline"
                  >
                    {t.lastfm_confirm}
                  </button>
                </>
              ) : (
                <button
                  onClick={onLastfmConnect}
                  className="text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-900 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer underline"
                >
                  {t.lastfm_connect}
                </button>
              )}
            </div>
          </div>

          {typeof browser !== 'undefined' && !navigator.userAgent.includes('Firefox') && (
            <button
              className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors cursor-pointer"
              onClick={() => browser.tabs.create({ url: 'chrome://extensions/shortcuts' })}
            >
              <ArrowSquareOutIcon size={12} />
              {t.settings_shortcuts}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Album art */}
          {!compactMode && (
            <div className="relative">
              {song?.art ? (
                <img
                  src={song.art}
                  alt={t.album_art_alt}
                  className="w-full aspect-square object-cover"
                />
              ) : (
                <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800" />
              )}
              {song?.art && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              )}
            </div>
          )}

          {/* Player controls */}
          <div className="flex items-center h-11 border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-gray-950">
            <button
              onClick={playing ? onPause : onPlay}
              className="flex items-center justify-center w-11 h-full border-r border-gray-200 dark:border-[#2a2a2a] text-gray-600 dark:text-[#b0b0b0] hover:text-gray-900 dark:hover:text-[#f0f0f0] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors cursor-pointer shrink-0"
              aria-label={playing ? t.player_pause : t.player_play}
            >
              {playing ? <PauseIcon size={15} /> : <PlayIcon size={15} weight="fill" />}
            </button>

            <span className="flex-1 px-3 flex justify-between items-center gap-2 text-xs text-gray-500 dark:text-gray-100">
              {!playing && <span>jawr.mp3</span>}
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
                      style={{ animation: `${kf} ${dur} ease-in-out infinite ${delay}`, transformOrigin: 'bottom' }}
                    />
                  ))}
                </span>
              )}
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
                className="w-14 accent-gray-600 cursor-pointer"
                aria-label={t.player_volume}
              />
              <span className="text-xs text-gray-400 dark:text-[#6e6e6e] w-7 text-right tabular-nums">
                {Math.round(volume.value * 100)}%
              </span>
            </div>
          </div>

          {/* Now playing */}
          <div className="flex flex-col gap-3 px-5 pt-5 pb-4 text-xs">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.now_label}</p>
            {song ? (
              <p className="text-sm text-gray-900 dark:text-[#f0f0f0]">
                {song.artist} - {song.title}
              </p>
            ) : (
              <p className="text-gray-300 dark:text-[#3a3a3a]">—</p>
            )}
            {song?.artist && !artistLinks && (
              <button
                type="button"
                onClick={() => setShowSupport(true)}
                className="text-xs text-gray-400 dark:text-[#6e6e6e] underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors text-left cursor-pointer w-fit"
              >
                {t.support_artist_button}
              </button>
            )}
          </div>

          <div className="h-px bg-gray-200 dark:bg-[#2a2a2a]" />

          {/* History */}
          <div className="flex flex-col gap-3 px-5 pt-4 pb-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 dark:text-[#6e6e6e]">{t.recently_label}</p>
            <ul className="flex flex-col text-[11px] text-gray-600 dark:text-[#b0b0b0]">
              {history.length === 0 && (
                <li className="text-gray-300 dark:text-[#3a3a3a]">—</li>
              )}
              {history.map(({ song: s, played_at }, i) => {
                if (!s) return null;
                const text = s.artist ? `${s.artist} - ${s.title}` : (s.title ?? '-');
                const ago = played_at ? timeAgo(played_at) : '';
                return (
                  <li
                    key={i}
                    className="flex items-center gap-2 py-1.5 border-b border-gray-100 dark:border-[#2a2a2a] last:border-0 overflow-hidden"
                  >
                    <span className="flex-1 truncate">{text}</span>
                    {ago && <span className="text-gray-300 dark:text-[#3a3a3a] shrink-0">{ago}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}

      {showSupport && song?.artist && (
        <SupportArtistModal
          artist={song.artist}
          title={t.support_artist_title}
          onClose={() => setShowSupport(false)}
        />
      )}
    </div>
  );
}

function SupportArtistModal({
  artist,
  title,
  onClose,
}: {
  artist: string;
  title: string;
  onClose: () => void;
}) {
  const q = encodeURIComponent(artist);
  const links = [
    { label: 'bandcamp', href: `https://bandcamp.com/search?q=${q}&item_type=b` },
    { label: 'soundcloud', href: `https://soundcloud.com/search/people?q=${q}` },
    { label: 'spotify', href: `https://open.spotify.com/search/${q}/artists` },
    { label: 'apple music', href: `https://music.apple.com/search?term=${q}` },
    { label: 'youtube music', href: `https://music.youtube.com/search?q=${q}` },
    { label: 'deezer', href: `https://www.deezer.com/search/${q}/artist` },
    { label: 'discogs', href: `https://www.discogs.com/search/?q=${q}&type=artist` },
    { label: 'last.fm', href: `https://www.last.fm/music/${q}` },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 flex flex-col gap-5 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#f0f0f0]">
            {title} {artist}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        <ul className="grid grid-cols-2 gap-2">
          {links.map(({ label, href }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-3 py-2 text-xs text-gray-800 dark:text-[#f0f0f0] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
