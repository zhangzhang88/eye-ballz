import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        'viewer-3d': 'viewer-3d.html',
        'upload': 'upload.html',
        'preview': 'preview.html'
      }
    }
  },
  server: {
    allowedHosts: [
      'gary-sultrier-noncomprehensively.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok-free.app'
    ]
  }
})
