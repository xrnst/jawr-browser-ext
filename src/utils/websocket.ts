import { readNowPlayingFrame, type NowPlayingUpdate } from './now-playing';

const IS_CHROME = import.meta.env.BROWSER === 'chrome';
const ALARM_NAME = 'jawr-ws-reconnect';
const CHANNEL = 'station:jawr';

export function createWebSocketManager(
  wsUrl: string,
  onUpdate: (update: NowPlayingUpdate) => void,
): void {
  let reconnectDelay = 1000;
  let alarmListener: ((alarm: chrome.alarms.Alarm) => void) | null = null;

  function scheduleReconnect() {
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
      setTimeout(connect, delayMs);
    }
  }

  function connect() {
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectDelay = 1000;
      socket.send(JSON.stringify({ subs: { [CHANNEL]: { recover: true } } }));
    };

    socket.onmessage = (event) => {
      readNowPlayingFrame(event.data as string, CHANNEL).forEach(onUpdate);
    };

    socket.onclose = scheduleReconnect;

    socket.onerror = () => {
      socket.close();
    };
  }

  connect();
}
