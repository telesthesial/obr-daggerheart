import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
