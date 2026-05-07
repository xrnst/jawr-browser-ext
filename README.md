# jawr-browser-ext

Browser extension for [jawr.org](https://jawr.org) - a 24/7 curated web radio.

## Features

- Stream playback (play/pause, volume, mute)
- Now-playing display with cover art and history
- Live FFT visualization
- Desktop notifications when track changes (opt-in)
- Keyboard shortcuts (play/pause, volume, show now-playing)
- Themes (light/dark/amoled/nord/dracula/etc) and locales (en/pt)
- Compact / mini-player mode

## Permissions

| Permission | Reason |
|---|---|
| `notifications` | Show track-change toast (user opt-in via settings) |
| `storage` | Persist volume, theme, language, notification preference |
| `https://jawr.org/*` | Main site links |
| `https://api.jawr.org/*` | Audio stream + now-playing WebSocket + API |

Chrome only:
- `offscreen` - audio playback in MV3 service worker context

## Build (for AMO reviewers)

Tested with Node.js 25.8.0 on Windows 11.
Other recent versions (Node 20+) should also work.

```
npm ci                  # use package-lock.json for reproducible install
npm run build:firefox   # Firefox MV2 -> .output/firefox-mv2/
npm run zip:firefox     # AMO submission zip -> .output/jawr-browser-ext-<version>-firefox.zip
```

Chrome MV3 build: `npm run build`.

Environment variables in `.env` (already included in the source bundle):

```
VITE_AZURACAST_URL=https://api.jawr.org
VITE_AZURACAST_URL_WS=wss://api.jawr.org
```

No secrets, API keys, or private credentials are used.

## Development

```
npm run dev             # Chrome with hot-reload
npm run dev:firefox     # Firefox with hot-reload
```

## Stack

- [WXT](https://wxt.dev) - extension framework
- React 19 + TypeScript
- Tailwind CSS 4
- Phosphor Icons

## License

MIT
