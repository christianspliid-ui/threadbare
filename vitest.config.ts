import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { partitionTestFiles } from './scripts/vitest-test-partition';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Which pool each test file runs in, derived at config-load time from the file's
 * `@vitest-environment` docblock and its use of `vi.mock`.
 * See `scripts/vitest-test-partition.ts` for why this is not a path convention.
 */
const { dom, isolatedNode } = partitionTestFiles(rootDir);

/** Applied to every project — paths that are never test sources. */
const sharedExclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.worktrees/**',
  '**/.claude/worktrees/**',
  '**/preview/**',
  '**/preview-build/**',
];

/** Options every project shares, so the three differ only where they must. */
const baseTest = {
  globals: true,
  setupFiles: './src/test/setup.ts',
} as const;

/**
 * Three projects, one `vitest run` (THR-940). `npm test` still runs the whole
 * suite as a single command — CI's `Test · Typecheck · Build` job and the
 * pre-commit gate both depend on that, and the job name is a required status
 * check that must not move.
 *
 * Only the first project drops isolation. The other two exist precisely because
 * they cannot: jsdom tests leak DOM and timer state, and `vi.mock` is defeated
 * by a shared module registry.
 */
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          ...baseTest,
          name: 'node',
          environment: 'node',
          // The change that reclaims the import time: the heavy engine/data
          // module graph is imported once per worker instead of once per file.
          pool: 'threads',
          isolate: false,
          exclude: [...sharedExclude, ...dom, ...isolatedNode],
        },
      },
      {
        plugins: [react()],
        test: {
          ...baseTest,
          name: 'node-isolated',
          environment: 'node',
          // Isolation left at the default `true` — these files either mock
          // modules or carry module-scope state across file boundaries (THR-949).
          include: isolatedNode,
          exclude: sharedExclude,
        },
      },
      {
        plugins: [react()],
        test: {
          ...baseTest,
          name: 'dom',
          environment: 'jsdom',
          // Isolation left at the default `true`: component tests mutate
          // document, timers, and module-level React state.
          include: dom,
          exclude: sharedExclude,
        },
      },
    ],
  },
});
