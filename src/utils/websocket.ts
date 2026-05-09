import type { HistoryItem, Song } from '../types';

export type NowPlayingUpdate = {
  song: Song | null;
  history: HistoryItem[];
};

const IS_CHROME = import.meta.env.BROWSER === 'chrome';
const ALARM_NAME = 'jawr-ws-reconnect';

export function createWebSocketManager(
  wsUrl: string,
  onUpdate: (update: NowPlayingUpdate) => void,
): { destroy: () => void } {
  let ws: WebSocket | null = null;
  let reconnectDelay = 1000;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let alarmListener: ((alarm: chrome.alarms.Alarm) => void) | null = null;
  let destroyed = false;

  function scheduleReconnect() {
    if (destroyed) return;
    const delayMs = reconnectDelay;
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
    if (IS_CHROME) {
      // chrome.alarms minimum is 30s; clamp up
      const delayInMinutes = Math.max(0.5, delayMs / 60000);
      chrome.alarms.create(ALARM_NAME, { delayInMinutes });
      if (!alarmListener) {
        alarmListener = (alarm) => {
          if (alarm.name === ALARM_NAME) connect();
        };
        chrome.alarms.onAlarm.addListener(alarmListener);
      }
    } else {
      reconnectTimer = setTimeout(connect, delayMs);
    }
  }

  function parseMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      if (msg.connect?.data) {
        for (const item of msg.connect.data) {
          if (item.channel === 'station:jawr' && item.data?.np) {
            const np = item.data.np;
            onUpdate({
              song: np.now_playing?.song ?? null,
              history: np.song_history ?? [],
            });
          }
        }
        return;
      }

      if (msg.channel === 'station:jawr' && msg.pub?.data?.np) {
        const np = msg.pub.data.np;
        onUpdate({
          song: np.now_playing?.song ?? null,
          history: np.song_history ?? [],
        });
      }
    } catch {
      // malformed message — ignore
    }
  }

  function connect() {
    if (destroyed) return;

    const socket = new WebSocket(wsUrl);
    ws = socket;

    socket.onopen = () => {
      reconnectDelay = 1000;
      socket.send(JSON.stringify({ subs: { 'station:jawr': {} } }));
    };

    socket.onmessage = (event) => {
      parseMessage(event.data as string);
    };

    socket.onclose = () => {
      if (destroyed) return;
      scheduleReconnect();
    };

    socket.onerror = () => {
      socket.close();
    };
  }

  connect();

  return {
    destroy() {
      destroyed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (IS_CHROME) {
        chrome.alarms.clear(ALARM_NAME);
        if (alarmListener) chrome.alarms.onAlarm.removeListener(alarmListener);
      }
      ws?.close();
    },
  };
}
