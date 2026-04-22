import { useEffect, useRef, useState } from 'react';
import { RadioPlayer } from '../../components/RadioPlayer';
import type { ExtensionMessage, ExtensionState } from '../../types';
import { loadTheme, saveTheme, loadNotifications, saveNotifications, loadArtistLinks, saveArtistLinks, loadCompactMode, saveCompactMode, type Theme } from '../../utils/storage';
import { loadLocale, saveLocale, getTranslations, type Locale } from '../../i18n';

const DEFAULT_STATE: ExtensionState = {
  playing: false,
  song: null,
  history: [],
  volume: { value: 0.5, isMuted: false },
  lastfmSession: null,
  lastfmPending: false,
};

type PopupOut =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: number }
  | { type: 'LASTFM_CONNECT' }
  | { type: 'LASTFM_CONFIRM' }
  | { type: 'LASTFM_DISCONNECT' };

function toBg(msg: PopupOut) {
  browser.runtime.sendMessage({ target: 'background', ...msg } satisfies ExtensionMessage).catch(() => {});
}

export default function App() {
  const [state, setState] = useState<ExtensionState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [notifications, setNotifications] = useState(true);
  const [artistLinks, setArtistLinks] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const isMounted = useRef(false);

  useEffect(() => {
    loadNotifications().then(setNotifications);
    loadArtistLinks().then(setArtistLinks);
    loadCompactMode().then(setCompactMode);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    if (isMounted.current) saveTheme(theme);
    else isMounted.current = true;
  }, [theme]);

  useEffect(() => {
    browser.runtime
      .sendMessage({ target: 'background', type: 'GET_STATE' } satisfies ExtensionMessage)
      .then((response: ExtensionState) => {
        if (response) setState(response);
      })
      .catch(() => {});

    const listener = (message: ExtensionMessage) => {
      if (message.target !== 'popup') return false;
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      }
      return false;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  function handleToggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    saveNotifications(next);
  }

  function handleToggleArtistLinks() {
    const next = !artistLinks;
    setArtistLinks(next);
    saveArtistLinks(next);
  }

  function handleToggleCompactMode() {
    const next = !compactMode;
    setCompactMode(next);
    saveCompactMode(next);
  }

  function handleSetLocale(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  function handleLastfmConnect() {
    toBg({ type: 'LASTFM_CONNECT' });
  }

  function handleLastfmConfirm() {
    toBg({ type: 'LASTFM_CONFIRM' });
  }

  function handleLastfmDisconnect() {
    toBg({ type: 'LASTFM_DISCONNECT' });
  }

  return (
    <RadioPlayer
      state={state}
      theme={theme}
      notifications={notifications}
      locale={locale}
      t={getTranslations(locale)}
      onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      artistLinks={artistLinks}
      compactMode={compactMode}
      onToggleNotifications={handleToggleNotifications}
      onToggleArtistLinks={handleToggleArtistLinks}
      onToggleCompactMode={handleToggleCompactMode}
      onSetLocale={handleSetLocale}
      onPlay={() => toBg({ type: 'PLAY' })}
      onPause={() => toBg({ type: 'PAUSE' })}
      onToggleMute={() => toBg({ type: 'TOGGLE_MUTE' })}
      onSetVolume={(v) => toBg({ type: 'SET_VOLUME', payload: v })}
      lastfmSession={state.lastfmSession}
      lastfmPending={state.lastfmPending}
      onLastfmConnect={handleLastfmConnect}
      onLastfmConfirm={handleLastfmConfirm}
      onLastfmDisconnect={handleLastfmDisconnect}
    />
  );
}
