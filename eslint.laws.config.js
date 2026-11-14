// Engine laws: the rules CLAUDE.md's Non-Functional Priorities state, enforced as lint
// instead of prose. Run alone with `npm run lint:laws` (CI's Test · Typecheck · Build job);
// `eslint.config.js` includes the same block, so `npm run lint` enforces it too.
import tseslint from 'typescript-eslint'

const ENGINE_SOURCE = ['src/engine/**/*.ts']
const ENGINE_TESTS = ['src/engine/**/__tests__/**', 'src/engine/**/*.test.ts']

export const engineLaws = {
  files: ENGINE_SOURCE,
  ignores: ENGINE_TESTS,
  languageOptions: { parser: tseslint.parser },
  rules: {
    'no-restricted-properties': ['error', {
      object: 'Math',
      property: 'random',
      message:
        'NFP #3 (determinism): take a seeded `rng: () => number` from the calling phase, or build one with `mulberry32(hashString(...))` from src/lib/prng.ts keyed on stable ids. Do not add a fallback; make the parameter required.',
    }],
    'no-restricted-imports': ['error', {
      patterns: [{
        regex: '^react($|/)|/(components|hooks|contexts)(/|$)',
        message:
          'The engine is pure simulation and must run headless (CLI, tests, worker). Move the shared piece into src/engine, src/lib or src/types and import it from the UI side instead.',
      }],
    }],
  },
}

// Standalone run: register the plugins whose rules existing disable-comments name, and
// leave unused-directive reporting to the full `npm run lint`.
export default [
  {
    plugins: { '@typescript-eslint': tseslint.plugin },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
  },
  engineLaws,
]
