import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import vue from "@astrojs/vue";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import unocss from "unocss/astro";
import rehypeMathjax from "rehype-mathjax";
import { transformerMetaHighlight } from "@shikijs/transformers";
import { remarkPlugins } from "./src/plugins/remark";
import { fileURLToPath } from 'node:url';

// https://astro.build/config
export default defineConfig({
  site: "https://www.waleed.de",

  // Server configuration
  server: {
    port: 3000,
    host: true,
  },

  // Build configuration
  build: {
    format: 'file',
  },

  // Cloudflare adapter for server-side API routes
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),

  // Vite configuration
  vite: {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue', '@vueuse/core', 'radix-vue'],
          },
        },
      },
    },
  },

  // Integrations
  integrations: [
    vue(),
    unocss({
      injectReset: true,
    }),
    mdx(),
    icon({
      include: {
        simpleIcons: ["github", "linkedin", "bluesky", "x"],
        lucide: ["*"],
      },
    }),
    sitemap(),
    robotsTxt(),
  ],

  // Markdown configuration
  markdown: {
    remarkPlugins: [...remarkPlugins],
    rehypePlugins: [rehypeMathjax],
    shikiConfig: {
      transformers: [
        {
          pre(hast) {
            hast.properties["data-meta"] = this.options.meta?.__raw;
            hast.properties["data-code"] = this.source;
          },
        },
        transformerMetaHighlight(),
      ],
      themes: {
        light: "one-light",
        dark: "tokyo-night",
      },
    },
  },

  // Image optimization
  image: {
    domains: ["books.google.com", "assets.literal.club", "res.cloudinary.com"],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.google.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
        pathname: '/**',
      },
    ],
  },

  // Prefetch configuration
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
});
