import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { constantWriter } from './vite-plugin-constant-writer';
import { fileURLToPath } from 'node:url';

/**
 * Agent-lane worktrees live *inside* the repo root (`.claude/worktrees/<name>`),
 * so the dev server's watcher sees every checkout and every reap as thousands of
 * root-relative file events. Each hourly lane costs ~2 x 4.6k events, and the
 * `tsconfig.json` each worktree carries trips Vite's "changed tsconfig file
 * detected -> clearing cache and forcing full-reload" path, which starved
 * `/src/main.tsx` past a 90s timeout during an attended session (THR-1415).
 *
 * These patterns are appended to Vite's own defaults (`.git`, `node_modules`,
 * `test-results`, cacheDir) rather than replacing them - see
 * `resolveChokidarOptions`. Dev-server only; `vite build` does not watch.
 *
 * Anchored to this config's own directory (THR-1670). The unanchored
 * `**\/.claude/worktrees/**` also matched *every file of a server started inside
 * a worktree* — its own `src/` sits under `.claude/worktrees/<name>/` — so a
 * worktree dev server never saw an edit and served stale transforms until
 * restarted (impediments #1098, #1100, #1102, #1104). Anchored, the home tree
 * still ignores the worktrees nested in it, and a worktree watches itself.
 */
const CONFIG_DIR = fileURLToPath(new URL('.', import.meta.url)).replace(/\\/g, '/').replace(/\/$/, '');
const WATCH_IGNORED_WORKTREES = [`${CONFIG_DIR}/.claude/worktrees/**`, `${CONFIG_DIR}/.worktrees/**`];

export default defineConfig({
  plugins: [react(), tailwindcss(), constantWriter()],
  /**
   * THR-1134: the commit an incident snapshot came from. Vercel sets
   * `VERCEL_GIT_COMMIT_SHA` at build time; the dev server and a local `vite build`
   * read `'local'`, and a bundle whose `run.build` says `local` is itself a
   * finding — it means the file did not come from the deployed build.
   */
  define: {
    __BUILD_SHA__: JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? 'local'),
  },
  server: {
    watch: {
      ignored: WATCH_IGNORED_WORKTREES,
    },
  },
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
