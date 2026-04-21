import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  extensionApi: 'browser',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'jawr',
    description: 'a web-based radio that helps you find a new track to love! - jawr.org',
    version: '2026.1.0.0',
    permissions: ['offscreen', 'notifications', 'storage'],
    commands: {
      'toggle-radio': {
        description: 'Toggle Radio',
      },
      'display-now-playing': {
        description: 'Display Now Playing',
      },
      'lower-volume': {
        description: 'Lower Radio Volume',
      },
      'raise-volume': {
        description: 'Raise Radio Volume',
      },
    },
  },
});
