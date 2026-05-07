import { useEffect, useRef, useState } from 'react';
import { RadioPlayer } from '../../components/RadioPlayer';
import type { ExtensionMessage, ExtensionState } from '../../types';
import { loadTheme, saveTheme, loadNotifications, saveNotifications, loadCompactMode, saveCompactMode, THEMES, type Theme } from '../../utils/storage';
import { loadLocale, saveLocale, getTranslations, type Locale } from '../../i18n';

const DEFAULT_STATE: ExtensionState = {
  playing: false,
  song: null,
  history: [],
  volume: { value: 0.5, isMuted: false },
};

type PopupOut =
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'SET_VOLUME'; payload: number };

function toBg(msg: PopupOut) {
  browser.runtime.sendMessage({ target: 'background', ...msg } satisfies ExtensionMessage).catch(() => {});
}

const FFT_BARS = 5;

export default function App() {
  const [state, setState] = useState<ExtensionState>(DEFAULT_STATE);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const [fft, setFft] = useState<number[]>(() => new Array(FFT_BARS).fill(0));
  const isMounted = useRef(false);

  useEffect(() => {
    loadNotifications().then(setNotifications);
    loadCompactMode().then(setCompactMode);
  }, []);

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
      if (message.target !== 'popup') return;
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      } else if (message.type === 'FFT_DATA') {
        setFft(message.payload);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  useEffect(() => {
    if (!state.playing) {
      setFft(new Array(FFT_BARS).fill(0));
      return;
    }
    browser.runtime
      .sendMessage({ target: 'background', type: 'FFT_START', payload: FFT_BARS } satisfies ExtensionMessage)
      .catch(() => {});
    return () => {
      browser.runtime
        .sendMessage({ target: 'background', type: 'FFT_STOP' } satisfies ExtensionMessage)
        .catch(() => {});
    };
  }, [state.playing]);

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
      fft={fft}
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
