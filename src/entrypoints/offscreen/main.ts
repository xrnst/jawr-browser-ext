import type { ExtensionMessage } from '../../types';

const audio = new Audio();
audio.preload = 'none';

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.target !== 'offscreen') return false;
  switch (message.type) {
    case 'OFFSCREEN_PLAY':
      audio.src = message.payload;
      audio.play().catch(() => {
        chrome.runtime
          .sendMessage({ target: 'background', type: 'OFFSCREEN_ERROR' } satisfies ExtensionMessage)
          .catch(() => {});
      });
      break;
    case 'OFFSCREEN_PAUSE':
      audio.pause();
      audio.src = '';
      break;
    case 'OFFSCREEN_SET_VOLUME':
      audio.volume = message.payload;
      break;
    case 'OFFSCREEN_SET_MUTED':
      audio.muted = message.payload;
      break;
  }
  return false;
});
