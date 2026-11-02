import { useEffect, useState } from 'react';
import type { ExtensionMessage } from '../types';

export function useFrequencyBands(bars: number): number[] {
  const [bands, setBands] = useState<number[]>(() => Array.from({ length: bars }, () => 0));

  useEffect(() => {
    const listener = (rawMessage: unknown) => {
      const message = rawMessage as ExtensionMessage;
      if (message.target === 'popup' && message.type === 'FFT_DATA') setBands(message.payload);
    };
    browser.runtime.onMessage.addListener(listener);
    browser.runtime
      .sendMessage({ target: 'background', type: 'FFT_START', payload: bars } satisfies ExtensionMessage)
      .catch(() => {});
    return () => {
      browser.runtime.onMessage.removeListener(listener);
      browser.runtime
        .sendMessage({ target: 'background', type: 'FFT_STOP' } satisfies ExtensionMessage)
        .catch(() => {});
    };
  }, [bars]);

  return bands;
}
