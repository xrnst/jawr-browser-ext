import { GearIcon, XIcon } from '@phosphor-icons/react';
import { useState } from 'react';
import type { Theme } from '../utils/storage';
import type { Locale, Translations } from '../i18n';
import type { ExtensionState } from '../types';
import { timeAgo } from '../utils/date';
import { formatSongTitle } from '../utils/song';
import { NowPlayingSection } from './NowPlayingSection';
import { PlayerControls } from './PlayerControls';
import { SettingsPanel } from './SettingsPanel';
import { requestSongRequestConsent, SongRequestModal } from './SongRequestModal';
import { SupportArtistModal } from './SupportArtistModal';

type Props = {
  state: ExtensionState;
  theme: Theme;
  notifications: boolean;
  compactMode: boolean;
  locale: Locale;
  t: Translations;
  onSetTheme: (t: Theme) => void;
  onToggleNotifications: () => void;
  onToggleCompactMode: () => void;
  onSetLocale: (l: Locale) => void;
  onPlay: () => void;
  onPause: () => void;
  onToggleMute: () => void;
  onSetVolume: (v: number) => void;
};


export function RadioPlayer({ state, theme, notifications, compactMode, locale, t, onSetTheme, onToggleNotifications, onToggleCompactMode, onSetLocale, onPlay, onPause, onToggleMute, onSetVolume }: Props) {
  const { playing, reconnecting, streamError, song, nextSong, history, volume } = state;
  const [showSettings, setShowSettings] = useState(false);
  const [supportArtist, setSupportArtist] = useState<string | null>(null);
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
            <span className="inline-block w-2 h-2 rounded-full bg-red-700 shrink-0" />
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
        <SettingsPanel
          t={t}
          theme={theme}
          locale={locale}
          notifications={notifications}
          compactMode={compactMode}
          onSetTheme={onSetTheme}
          onSetLocale={onSetLocale}
          onToggleNotifications={onToggleNotifications}
          onToggleCompactMode={onToggleCompactMode}
        />
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

          <PlayerControls
            t={t}
            playing={playing}
            reconnecting={reconnecting}
            streamError={streamError}
            volume={volume}
            onPlay={onPlay}
            onPause={onPause}
            onToggleMute={onToggleMute}
            onSetVolume={onSetVolume}
          />

          {/* Now playing */}
          <NowPlayingSection
            t={t}
            song={song}
            nextSong={nextSong}
            compactMode={compactMode}
            onSupportArtist={() => setSupportArtist(song?.artist ?? null)}
          />

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
                    const text = formatSongTitle(s) || '-';
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
                  onClick={() => requestSongRequestConsent().then((granted) => granted && setShowRequest(true))}
                  className="self-start text-xs text-gray-400 dark:text-[#6e6e6e] underline hover:text-gray-600 dark:hover:text-[#b0b0b0] transition-colors cursor-pointer mt-2"
                >
                  {t.song_request_button}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {supportArtist && (
        <SupportArtistModal
          artist={supportArtist}
          t={t}
          onClose={() => setSupportArtist(null)}
        />
      )}

      {showRequest && (
        <SongRequestModal t={t} onClose={() => setShowRequest(false)} />
      )}
    </div>
  );
}
