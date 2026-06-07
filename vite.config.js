import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        vote: resolve(__dirname, 'vote.html'),
        drink: resolve(__dirname, 'drink.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  server: {
    port: 3000,
  },
  optimizeDeps: {
    include: ['@aws-sdk/client-dynamodb', '@aws-sdk/lib-dynamodb'],
  },
});
