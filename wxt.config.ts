import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  extensionApi: 'webextension-polyfill',
  modules: ['@wxt-dev/module-react'],
  zip: {
    excludeSources: ['screenshots/**', 'docs/**', '.output/**', '.wxt/**'],
    includeSources: ['.env'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: ({ browser }) => ({
    name: 'jawr - just another web radio',
    short_name: 'jawr',
    description: 'discover new music on a curated 24/7 web radio',
    icons: {
      16: 'icons/16.png',
      32: 'icons/32.png',
      48: 'icons/48.png',
      96: 'icons/96.png',
      128: 'icons/128.png',
    },
    permissions: browser === 'chrome'
      ? ['offscreen', 'notifications', 'storage']
      : ['notifications', 'storage'],
    host_permissions: [
      'https://jawr.org/*',
      'https://api.jawr.org/*',
    ],
    browser_specific_settings: {
      gecko: {
        id: 'jawr@jawr.org',
        data_collection_permissions: { required: ['none'] },
      },
    },
    commands: {
      'toggle-radio': {
        description: 'Play / pause',
      },
      'display-now-playing': {
        description: 'Show current song',
      },
      'lower-volume': {
        description: 'Volume down',
      },
      'raise-volume': {
        description: 'Volume up',
      },
    },
  }),
});
