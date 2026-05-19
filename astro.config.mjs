import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://www.tyfn.online',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', de: 'de-DE' },
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
  },
  build: { format: 'directory' },
  redirects: {
    '/portfolio/zentrik': '/portfolio/easyngo/',
    '/portfolio/zentrik/': '/portfolio/easyngo/',
    '/de/portfolio/zentrik': '/de/portfolio/easyngo/',
    '/de/portfolio/zentrik/': '/de/portfolio/easyngo/',
  },
});
