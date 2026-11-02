import { useEffect, useRef, useState } from 'react';
import { RadioPlayer } from '../../components/RadioPlayer';
import type { ExtensionMessage, ExtensionState } from '../../types';
import { DEFAULT_VOLUME, loadTheme, saveTheme, loadNotifications, saveNotifications, loadCompactMode, saveCompactMode, THEMES, type Theme } from '../../utils/storage';
import { loadLocale, saveLocale, getTranslations, type Locale } from '../../i18n';

const DEFAULT_STATE: ExtensionState = {
  playing: false,
  reconnecting: false,
  streamError: false,
  song: null,
  nextSong: null,
  history: [],
  volume: DEFAULT_VOLUME,
};

type PopupOut =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: number };

function toBg(msg: PopupOut) {
  browser.runtime.sendMessage({ target: 'background', ...msg } satisfies ExtensionMessage).catch(() => {});
}

export default function App() {
  const [state, setState] = useState<ExtensionState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const isMounted = useRef(false);

  useEffect(() => {
    loadNotifications().then(setNotifications);
    loadCompactMode().then(setCompactMode);
    const port = browser.runtime.connect({ name: 'popup' });
    return () => port.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(t));
    root.classList.add(theme);
    if (isMounted.current) saveTheme(theme);
    else isMounted.current = true;
  }, [theme]);

  useEffect(() => {
    browser.runtime
      .sendMessage({ target: 'background', type: 'GET_STATE' } satisfies ExtensionMessage)
      .then((response) => {
        if (response) setState(response as ExtensionState);
      })
      .catch(() => {});

    const listener = (rawMessage: unknown) => {
      const message = rawMessage as ExtensionMessage;
      if (message.target === 'popup' && message.type === 'STATE_UPDATE') setState(message.payload);
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  function handleToggleNotifications() {
    const next = !notifications;
    setNotifications(next);
    saveNotifications(next);
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

  return (
    <RadioPlayer
      state={state}
      theme={theme}
      notifications={notifications}
      locale={locale}
      t={getTranslations(locale)}
      onSetTheme={setTheme}
      compactMode={compactMode}
      onToggleNotifications={handleToggleNotifications}
      onToggleCompactMode={handleToggleCompactMode}
      onSetLocale={handleSetLocale}
      onPlay={() => toBg({ type: 'PLAY' })}
      onPause={() => toBg({ type: 'PAUSE' })}
      onToggleMute={() => toBg({ type: 'TOGGLE_MUTE' })}
      onSetVolume={(v) => toBg({ type: 'SET_VOLUME', payload: v })}
    />
  );
}
