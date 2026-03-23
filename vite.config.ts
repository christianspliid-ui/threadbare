import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { constantWriter } from './vite-plugin-constant-writer';

export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
  server: {
    headers: {
      // Required for SharedArrayBuffer — enables multi-threaded WASM
      // (ONNX Runtime uses this for parallel inference in the narration worker)
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
