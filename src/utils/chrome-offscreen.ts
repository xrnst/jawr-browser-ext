import type { ExtensionMessage } from '../types';

const OFFSCREEN_URL = 'offscreen.html';

async function hasOffscreenDocument(): Promise<boolean> {
  const url = chrome.runtime.getURL(OFFSCREEN_URL);
  const contexts = (await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    documentUrls: [url],
  })) as chrome.runtime.ExtensionContext[];
  return contexts.length > 0;
}

export async function ensureOffscreen(): Promise<void> {
  if (await hasOffscreenDocument()) return;
  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: 'Radio audio playback',
  });
}

export async function sendToOffscreen(msg: ExtensionMessage): Promise<void> {
  if (!(await hasOffscreenDocument())) return;
  chrome.runtime.sendMessage(msg).catch(() => {});
}
