import type { ExtensionMessage, StreamStatus } from '../types';

const OFFSCREEN_URL = 'offscreen.html';

async function hasOffscreenDocument(): Promise<boolean> {
  const url = chrome.runtime.getURL(OFFSCREEN_URL);
  const contexts = (await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    documentUrls: [url],
  })) as chrome.runtime.ExtensionContext[];
  return contexts.length > 0;
}

let creating: Promise<void> | null = null;

export async function ensureOffscreen(): Promise<void> {
  if (await hasOffscreenDocument()) return;
  if (creating) return creating;
  creating = chrome.offscreen
    .createDocument({
      url: OFFSCREEN_URL,
      reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
      justification: 'Radio audio playback',
    })
    .finally(() => {
      creating = null;
    });
  await creating;
}

export async function sendToOffscreen(msg: ExtensionMessage): Promise<void> {
  if (!(await hasOffscreenDocument())) return;
  chrome.runtime.sendMessage(msg).catch(() => {});
}

export async function getOffscreenStatus(): Promise<StreamStatus | null> {
  if (!(await hasOffscreenDocument())) return null;
  const status: unknown = await chrome.runtime
    .sendMessage({ target: 'offscreen', type: 'OFFSCREEN_GET_STATUS' } satisfies ExtensionMessage)
    .catch(() => null);
  return typeof status === 'object' && status !== null ? (status as StreamStatus) : null;
}
