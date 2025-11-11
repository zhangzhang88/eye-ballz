import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'gary-sultrier-noncomprehensively.ngrok-free.dev',
      '.ngrok.io',
      '.ngrok-free.app'
    ]
  }
})
