import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import robotsTxt from 'astro-robots-txt';
import unocss from 'unocss/astro';
import rehypeMathjax from 'rehype-mathjax';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { subset } from '@fontsource/inter';
import { remarkPlugins } from './src/plugins/remark';

// https://astro.build/config
export default defineConfig({
  integrations: [
    vue(),
    unocss({
      injectReset: true,
    }),
    mdx(),
    icon({
      include: {
        simpleIcons: ['github', 'linkedin', 'bluesky', 'x'],
        lucide: ['*'],
      },
    }),
    sitemap(),
    robotsTxt(),
  ],
  markdown: {
    remarkPlugins: [...remarkPlugins],
    rehypePlugins: [rehypeMathjax],
    shikiConfig: {
      transformers: [
        {
          pre(hast) {
            hast.properties['data-meta'] = this.options.meta?.__raw;
            hast.properties['data-code'] = this.source;
          }
        },
        transformerMetaHighlight(),
      ],
      themes: {
        light: 'one-light',
        dark: 'tokyo-night',
      }
    }
  },
  image: {
    domains: ['books.google.com', 'assets.literal.club', 'res.cloudinary.com'],
  },
  site: 'https://www.waleed.de',
  prefetch: {
    prefetchAll: true,
    selector: ':not(a[href*="/bookmarks"]):not(a[href*="/rss"]):not(a[href^="http"]):not(a[href^="https"])'
  },
  output: 'server',
  adapter: cloudflare({
    runtime: {
      bindings: {
        DB: {
          type: 'd1',
          id: '139da35e-db5a-4ee2-8b63-862bccdc7d4a' // Get this from wrangler d1 create command
        }
      }
    }
  })
});
