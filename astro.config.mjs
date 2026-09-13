import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwind from '@astrojs/tailwind';

// Astro SSR sur Cloudflare Workers — stack alignée sur abc.nsi.xyz
// https://astro.build/config
export default defineConfig({
  site: 'https://numaps.nsi.xyz',
  output: 'server',
  adapter: cloudflare({
    imageService: 'passthrough',
    platformProxy: {
      enabled: true
    }
  }),
  integrations: [tailwind()]
});
