import { defineConfig } from 'vite'
import { rename } from 'fs/promises'
import { resolve } from 'path'

// Rename index.html -> index.htm after build for ESP32 firmware compatibility
const renameIndexPlugin = {
  name: 'rename-index',
  closeBundle: async () => {
    const from = resolve(__dirname, 'static/index.html')
    const to = resolve(__dirname, 'static/index.htm')
    await rename(from, to)
  }
}

export default defineConfig({
  plugins: [renameIndexPlugin],
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
