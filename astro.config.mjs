import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.tyfn.online',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  build: { format: 'directory' },
});
