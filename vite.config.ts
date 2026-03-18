import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'es2019',

    // Disable sourcemaps for production
    sourcemap: false,

    // Fast and safe minification
    minify: 'esbuild',

    // Extract CSS into separate file
    cssCodeSplit: true,

    // Clean dist folder before build
    emptyOutDir: true,

    lib: {
      entry: resolve(__dirname, 'src/index.ts'),

      // Global name for CDN (window.ChatyPlayer)
      name: 'ChatyPlayer',

      // ✅ Added UMD for browser/CDN support
      formats: ['es', 'cjs', 'umd'],

      // ✅ Type-safe + production-safe naming
      fileName: (format) => {
        const map = {
          es: 'chatyplayer.es.js',
          cjs: 'chatyplayer.cjs.js',
          umd: 'chatyplayer.umd.js'
        } as const

        return map[format as keyof typeof map]
      }
    },

    rollupOptions: {
      // Keep empty unless you add deps later
      external: [],

      output: {
        exports: 'named',

        // Stable CSS output
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'styles/[name][extname]'
          }
          return '[name][extname]'
        },

        // Better optimized output
        generatedCode: {
          constBindings: true
        }
      }
    }
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  esbuild: {
    // Remove license comments
    legalComments: 'none'
  }
})