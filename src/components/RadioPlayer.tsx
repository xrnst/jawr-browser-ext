import {
  AppleLogoIcon,
  ArrowSquareOutIcon,
  EqualizerIcon,
  GearIcon,
  LastfmLogoIcon,
  ParallelogramIcon,
  PauseIcon,
  PlayIcon,
  SoundcloudLogoIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
  SpotifyLogoIcon,
  VinylRecordIcon,
  XIcon,
  YoutubeLogoIcon,
} from '@phosphor-icons/react';
import { useState } from 'react';
import { THEMES, type Theme } from '../utils/storage';
import type { Locale, Translations } from '../i18n';
import type { ExtensionState } from '../types';
import { timeAgo } from '../utils/date';

type Props = {
  state: ExtensionState;
  theme: Theme;
  notifications: boolean;
  compactMode: boolean;
  locale: Locale;
  t: Translations;
  fft: number[];
  onSetTheme: (t: Theme) => void;
  onToggleNotifications: () => void;
  onToggleCompactMode: () => void;
  onSetLocale: (l: Locale) => void;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
};


const LOCALE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'english' },
  { value: 'pt', label: 'português' },
];


export function RadioPlayer({ state, theme, notifications, compactMode, locale, t, fft, onSetTheme, onToggleNotifications, onToggleCompactMode, onSetLocale, onPlay, onPause, onToggleMute, onSetVolume }: Props) {
  const { playing, song, history, volume } = state;
  const [showSettings, setShowSettings] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div className={`flex flex-col w-80 ${compactMode ? '' : 'min-h-[460px]'} bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 font-mono`}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <a
            href="https://jawr.org"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="jawr"
            className="hover:opacity-60 transition-opacity text-gray-900 dark:text-gray-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 555.62 193.26"
              aria-label="jawr"
              className="h-3 w-auto fill-current block"
            >
              <path d="M84.41,0h33.93v133c0,19-4.53,33.79-13.57,44.38-9.05,10.59-24.16,15.88-45.33,15.88s-36.83-5.29-45.87-15.88c-9.05-10.59-13.57-25.38-13.57-44.38v-48.86h48.86v52.39c0,4.16.77,7.29,2.31,9.36,1.54,2.08,4.21,3.12,8.01,3.12s6.51-.99,8.14-2.99c1.63-1.99,2.44-5.16,2.44-9.5V36.43H29.04V0h55.37Z"/>
              <path d="M223.93,0h-90.39v36.43h10.2l-20.51,153.57h49.67l4.27-69.43h16.53l4.17,69.43h50.49L223.93,0ZM179.41,84.14l2.93-47.71h6.31l2.87,47.71h-12.11Z"/>
              <polygon points="370.23 148.2 365.83 148.2 355.03 0 313.77 0 303.4 148.2 299.93 148.2 291.24 0 241.84 0 266.54 190 300.47 190 312.69 190 326.26 190 334.67 77.07 343.09 190 359.92 190 368.87 190 403.62 190 428.32 0 378.65 0 370.23 148.2"/>
              <path d="M547.47,113.59c-5.43-6.24-14.3-9.27-26.6-9.09v-4.34c11.04.18,19.31-3.16,24.84-10.04,5.52-6.87,8.28-15.47,8.28-25.79v-16.01c0-14.29-4.66-25.92-13.98-34.88-9.32-8.96-24.39-13.44-45.19-13.44h-58.36v190h49.13v-69.49h8.41c5.06,0,8.37.95,9.91,2.85,1.54,1.9,2.31,4.84,2.31,8.82v57.81h49.4v-53.47c0-9.05-2.71-16.69-8.14-22.94ZM504.86,72.47c0,4.34-.86,7.38-2.58,9.09-1.72,1.72-4.93,2.58-9.64,2.58h-7.06v-39.9h9.23c3.62,0,6.2.91,7.74,2.71,1.53,1.81,2.31,4.25,2.31,7.33v18.19Z"/>
            </svg>
          </a>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full bg-red-700 shrink-0"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            />
            <span className="text-xs font-bold tracking-widest uppercase text-red-700">{t.live_indicator}</span>
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
            <div className="grid grid-cols-3 gap-1.5">
              {THEMES.map((value) => (
                <button
                  key={value}
                  onClick={() => theme !== value && onSetTheme(value)}
                  className={`px-1 py-1.5 text-[10px] border transition-all cursor-pointer flex justify-center whitespace-nowrap ${
                    theme === value
                      ? 'border-gray-900 dark:border-[#f0f0f0] text-gray-900 dark:text-[#f0f0f0]'
                      : 'border-gray-200 dark:border-[#2a2a2a] text-gray-400 dark:text-[#6e6e6e] hover:border-gray-400 dark:hover:border-[#6e6e6e]'
                  }`}
                >
                  {value}
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

          {typeof browser !== 'undefined' && !navigator.userAgent.includes('Firefox') && (
            <button
              className="self-start inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-[#6e6e6e] hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors cursor-pointer"
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
              {!playing && <span>jawr.org</span>}
              {playing && (
                <span className="inline-flex gap-0.5 items-end shrink-0 h-3.5">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const v = fft[i] ?? 0;
                    const pct = Math.max(8, (v / 255) * 100);
                    return (
                      <span
                        key={i}
                        className="w-1 bg-gray-500 dark:bg-[#6e6e6e]"
                        style={{ height: `${pct}%`, transition: 'height 60ms linear' }}
                      />
                    );
                  })}
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
                className="w-14 cursor-pointer"
                style={{ accentColor: 'var(--dk-accent)' }}
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
            {song?.artist && !compactMode && (
              <button
                type="button"
                onClick={() => setShowSupport(true)}
                className="text-xs text-gray-400 dark:text-[#6e6e6e] underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors text-left cursor-pointer w-fit"
              >
                {t.support_artist_button}
              </button>
            )}
          </div>

          {!compactMode && (
            <>
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
                <button
                  type="button"
                  onClick={() => setShowRequest(true)}
                  className="self-start text-xs text-gray-400 dark:text-[#6e6e6e] underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors cursor-pointer mt-2"
                >
                  {t.song_request_button}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {showSupport && song?.artist && (
        <SupportArtistModal
          artist={song.artist}
          title={t.support_artist_title}
          onClose={() => setShowSupport(false)}
        />
      )}

      {showRequest && (
        <SongRequestModal t={t} onClose={() => setShowRequest(false)} />
      )}
    </div>
  );
}

function SongRequestModal({
  t,
  onClose,
}: {
  t: Translations;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', song: '', message: '' });
  const [sending, setSending] = useState(false);

  async function handleSubmit() {
    setSending(true);
    try {
      await fetch('https://jawr.org/api/song-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } catch {}
    setSending(false);
    onClose();
  }

  const inputCls = 'border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-gray-800 dark:text-[#f0f0f0] outline-none focus:border-gray-400 dark:focus:border-[#6e6e6e] transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 flex flex-col gap-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#f0f0f0]">
            {t.song_request_title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">
              {t.song_request_name} <span className="text-gray-400 dark:text-[#6e6e6e]">*</span>
            </span>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">{t.song_request_email}</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">
              {t.song_request_song} <span className="text-gray-400 dark:text-[#6e6e6e]">*</span>
            </span>
            <input
              type="text"
              value={form.song}
              onChange={(e) => setForm({ ...form, song: e.target.value })}
              className={inputCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">{t.song_request_message}</span>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={3}
              className={`${inputCls} resize-none`}
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.song.trim() || sending}
            className="px-4 py-2 text-xs bg-gray-900 dark:bg-[#f0f0f0] text-white dark:text-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {sending ? t.song_request_sending : t.song_request_submit}
          </button>
        </div>
      </div>
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
  const artists = artist.split(';').map((a) => a.trim()).filter(Boolean);
  const [activeTab, setActiveTab] = useState(artists[0] ?? artist);
  const q = encodeURIComponent(activeTab);

  const links = [
    { label: 'bandcamp', href: `https://bandcamp.com/search?q=${q}&item_type=b`, icon: ParallelogramIcon },
    { label: 'soundcloud', href: `https://soundcloud.com/search/people?q=${q}`, icon: SoundcloudLogoIcon },
    { label: 'spotify', href: `https://open.spotify.com/search/${q}/artists`, icon: SpotifyLogoIcon },
    { label: 'apple music', href: `https://music.apple.com/search?term=${q}`, icon: AppleLogoIcon },
    { label: 'youtube music', href: `https://music.youtube.com/search?q=${q}`, icon: YoutubeLogoIcon },
    { label: 'deezer', href: `https://www.deezer.com/search/${q}/artist`, icon: EqualizerIcon },
    { label: 'discogs', href: `https://www.discogs.com/search/?q=${q}&type=artist`, icon: VinylRecordIcon },
    { label: 'last.fm', href: `https://www.last.fm/music/${q}`, icon: LastfmLogoIcon },
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
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer"
          >
            <XIcon />
          </button>
        </div>

        {artists.length > 1 && (
          <section className="flex gap-3 flex-wrap">
            {artists.map((a) => (
              <button
                key={a}
                onClick={() => setActiveTab(a)}
                className={`px-3 py-1 text-xs cursor-pointer transition-colors ${
                  activeTab === a
                    ? 'bg-gray-100 text-gray-700 ring ring-inset ring-gray-200 dark:bg-[#2a2a2a] dark:text-[#f0f0f0] dark:ring-[#3a3a3a]'
                    : 'bg-gray-200 text-gray-700 dark:bg-[#1a1a1a] dark:text-[#b0b0b0] dark:border dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'
                }`}
              >
                {a}
              </button>
            ))}
          </section>
        )}

        <ul className="grid grid-cols-2 gap-2">
          {links.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-2 w-full px-3 py-2 text-[11px] text-gray-800 dark:text-[#f0f0f0] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors whitespace-nowrap overflow-hidden"
              >
                <span className="truncate">{label}</span>
                <Icon size={14} className="text-gray-300 dark:text-[#6e6e6e] shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
