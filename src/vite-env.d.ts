/// <reference types="vite/client" />

/**
 * The commit the running bundle was built from (THR-1134).
 *
 * Substituted at build time by the `define` block in `vite.config.ts` from
 * Vercel's `VERCEL_GIT_COMMIT_SHA`. Reads `'local'` under the dev server and a
 * local `vite build`; readers that run outside Vite (vitest, the CLI) see no
 * substitution at all, so every consumer must guard with a `typeof` check rather
 * than assume the identifier exists.
 */
declare const __BUILD_SHA__: string;
