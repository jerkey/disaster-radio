import { defineConfig } from 'vite'
import { rename, readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'

// Rename index.html -> index.htm and fix script tag for ESP32 compatibility.
// The IIFE output format is a classic script but Vite still injects type="module",
// which breaks captive portal browsers. Strip it and the crossorigin attribute.
const espCompatPlugin = {
  name: 'esp-compat',
  closeBundle: async () => {
    const htmlPath = resolve(__dirname, 'static/index.html')
    let html = await readFile(htmlPath, 'utf8')
    html = html.replace(/ type="module"/g, '').replace(/ crossorigin/g, '')
    await writeFile(htmlPath, html)
    await rename(htmlPath, resolve(__dirname, 'static/index.htm'))
  }
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
  plugins: [espCompatPlugin],
  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
  build: {
    outDir: 'static',
    emptyOutDir: false,
    target: 'es2015',
    rollupOptions: {
      output: {
        format: 'iife',
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
