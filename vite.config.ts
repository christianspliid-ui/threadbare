import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { constantWriter } from './vite-plugin-constant-writer';

export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'data-encounter': ['./src/data/encounter-content.ts'],
          'data-action-templates': ['./src/data/unified-action-templates.ts'],
          'data-culture': ['./src/data/culture-content.ts'],
        },
      },
    },
  },
});
