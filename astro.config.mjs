import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import unocss from "unocss/astro";
import rehypeMathjax from "rehype-mathjax";
import { transformerMetaHighlight } from "@shikijs/transformers";
import { subset } from "@fontsource/inter";
import { remarkPlugins } from "./src/plugins/remark";
import { fileURLToPath } from 'node:url';

// Helper function to get the current directory name
const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://astro.build/config
export default defineConfig({
  // Server configuration
  server: {
    port: 3000,
    host: true,
    // Security headers are now handled by the security middleware
    headers: {}
  },
  
  // Enable view transitions for smooth page transitions
  build: {
    format: 'file',
    // Enable view transitions API
    viewTransitions: true,
    // Enable prefetching for faster page loads
    prefetch: {
      prefetchAll: true,
      defaultStrategy: 'viewport'
    },
    // Enable modern build output
    modern: true,
    // Enable sourcemaps in development
    sourcemap: true,
    // Minify output
    minify: true
  },
  
  // Configure the build output
  output: 'static',
  adapter: '@astrojs/cloudflare',
  
  // Configure Vite
  vite: {
    build: {
      // Minify the output
      minify: 'esbuild',
      // Generate sourcemaps for production
      sourcemap: true,
      // Disable sourcemap hashes for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor modules into separate chunks
            vendor: ['vue', 'vue-router', 'axios'],
            // Split UI components into a separate chunk
            ui: ['@headlessui/vue', '@heroicons/vue'],
            // Split utility functions into a separate chunk
            utils: ['date-fns', 'lodash', 'zod']
          },
          // Use content hashes for better caching
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Minify CSS
      cssMinify: true,
      // Enable brotli compression
      brotliSize: true,
      // Enable gzip compression
      gzip: true
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'axios'],
      exclude: ['@astrojs/mdx']
    },
    // Enable server-side rendering
    ssr: {
      noExternal: ['@heroicons/vue', '@headlessui/vue']
    }
  },
  
  // Build output configuration
  output: 'static',
  adapter: '@astrojs/cloudflare',
  
  // Vite configuration
  vite: {
    resolve: {
      alias: {
        // Add any necessary aliases here
      }
    },
    server: {
      fs: {
        // Allow serving files from one level up from the package root
        allow: [fileURLToPath(new URL('../../', import.meta.url))]
      }
    },
    build: {
      // Minify the output
      minify: 'esbuild',
      // Generate sourcemaps for production
      sourcemap: true,
      // Disable sourcemap hashes for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor modules into separate chunks
            vendor: ['vue', 'vue-router', 'axios'],
            // Split UI components into a separate chunk
            ui: ['@headlessui/vue', '@heroicons/vue'],
            // Split utility functions into a separate chunk
            utils: ['date-fns', 'lodash', 'zod']
          },
          // Use content hashes for better caching
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash][extname]'
        }
      },
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Minify CSS
      cssMinify: true,
      // Enable brotli compression
      brotliSize: true,
      // Enable gzip compression
      gzip: true
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'axios'],
      exclude: ['@astrojs/mdx']
    },
    // Enable server-side rendering
    ssr: {
      noExternal: ['@heroicons/vue', '@headlessui/vue']
    }
  },
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
  // Image optimization settings
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
    // Enable modern formats (WebP/AVIF)
    formats: ['image/avif', 'image/webp'],
    // Responsive images
    deviceSizes: [640, 768, 1024, 1280, 1536],
    // Image quality
    quality: 80,
  },
  
  site: "https://www.waleed.de",
  
  // Performance optimizations
  vite: {
    build: {
      chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor libraries into separate chunks
            'vendor': ['vue', '@vueuse/core', 'radix-vue'],
            // Split large third-party libraries
            'analytics': ['astro-analytics', 'astro-umami-analytics'],
          },
        },
      },
    },
  },
  // Prefetch configuration - more selective to reduce bandwidth usage
  prefetch: {
    prefetchAll: false,
    selector: 'a[href^="/posts/"]', // Only prefetch blog post links
    throttle: 2, // Limit concurrent prefetches
  },
});
