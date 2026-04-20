import { useEffect, useState } from 'react';
import { RadioPlayer } from '../../components/RadioPlayer';
import type { ExtensionMessage, ExtensionState } from '../../types';

const DEFAULT_STATE: ExtensionState = {
  playing: false,
  song: null,
  history: [],
  volume: { value: 0.5, isMuted: false },
};

function send(msg: ExtensionMessage) {
  browser.runtime.sendMessage(msg).catch(() => {});
}

export default function App() {
  const [state, setState] = useState<ExtensionState>(DEFAULT_STATE);

  useEffect(() => {
    // Get initial state
    browser.runtime
      .sendMessage({ type: 'GET_STATE' } satisfies ExtensionMessage)
      .then((response: ExtensionState) => {
        if (response) setState(response);
      })
      .catch(() => {});

    // Listen for updates
    const listener = (message: ExtensionMessage) => {
      if (message.type === 'STATE_UPDATE') {
        setState(message.payload);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <RadioPlayer
      state={state}
      onPlay={() => send({ type: 'PLAY' })}
      onPause={() => send({ type: 'PAUSE' })}
      onToggleMute={() => send({ type: 'TOGGLE_MUTE' })}
      onSetVolume={(v) => send({ type: 'SET_VOLUME', payload: v })}
    />
  );
}
