import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://stadter-kamin.de',

  integrations: [
    sitemap({
      filter: (page) =>
        page !== 'https://stadter-kamin.de/danke/' &&
        page !== 'https://stadter-kamin.de/404/',
    }),
  ],

  adapter: node({
    mode: 'standalone'
  }),

  security: {
    checkOrigin: false
  }
});
