import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cesium from 'vite-plugin-cesium';
import path from 'path';
import dotenv from 'dotenv';
import svgr from 'vite-plugin-svgr';
import os from 'os';

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // point to Nest root

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
const LOCAL_IP = getLocalIP();

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // svgr(),
    svgr({
      svgrOptions: {
        icon: true, // optional, scales SVGs like icons
      },
    }),
    cesium(),
  ],
  build: {
    outDir: 'dist', // default; you can change this if Nest expects another folder
  },
  worker: {
    format: 'es', // Ensure Web Workers use ES module format
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min.mjs'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // <-- maps '@' to /src
    },
  },
  define: {
    'import.meta.env.VITE_CESIUM_API_KEY': JSON.stringify(
      process.env.VITE_CESIUM_API_KEY,
    ),
  },
  // server: {
  //   host: true,
  //   port: 5173,
  //   proxy: {
  //     '/api': {
  //       target: 'https:bhhph.online', // 👈 your VPS backend
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //     '/media': {
  //       target: 'https:bhhph.online',
  //       changeOrigin: true,
  //       secure: false,
  //     },
  //   },
  // },

  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        // Use localhost or 127.0.0.1 for internal proxying
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        // This ensures /api/user stays /api/user when it hits NestJS
        rewrite: (path) => path,
      },
      '/media': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
