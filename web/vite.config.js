import { defineConfig } from 'vite'

export default defineConfig({
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    outDir: 'static',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'build/bundle.js',
        assetFileNames: 'build/[name][extname]',
        chunkFileNames: 'build/[name].js',
      },
    },
  },
  server: {
    proxy: {
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
