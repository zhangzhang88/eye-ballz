import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'gary-sultrier-noncomprehensively.ngrok-free.dev',
      'eye.ztr8.uk',
      '.ngrok.io',
      '.ngrok-free.app'
    ]
  }
})
