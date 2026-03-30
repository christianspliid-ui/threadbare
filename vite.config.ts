import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { constantWriter } from './vite-plugin-constant-writer';

export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
});
