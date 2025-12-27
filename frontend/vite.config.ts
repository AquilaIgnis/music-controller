import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const FrontEndPort = 811;
const APIPort = 980;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1', // bind IPv4 loopback
    port: FrontEndPort,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${APIPort}`,
        changeOrigin: true,
      },
      '/spotify': {
        target: `http://127.0.0.1:${APIPort}`,
        changeOrigin: true,
      },
    },
  },
});
