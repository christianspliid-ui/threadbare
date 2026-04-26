# Config

## Environment Variables

- `ANTHROPIC_API_KEY` **required** — scripts\review\review-client.ts
- `CODEX_INTERNAL_ORIGINATOR_OVERRIDE` **required** — scripts\session-precheck.ts
- `DEV` **required** — src\components\Game\GameView.tsx
- `DRIFT_SCAN_BASELINE_PATH` **required** — scripts\drift-scan\index.ts
- `LINEAR_API_KEY` **required** — scripts\check-process.ts
- `NANOBANANANA_API_KEY` (has default) — .env.example
- `NODE_ENV` **required** — src\components\Game\GuildQuestPanel.tsx
- `OBSIDIAN_VAULT_ROOT` **required** — scripts\enhance-frontmatter.ts
- `PROCESS_CHECK_FILES` **required** — scripts\check-process.ts
- `PROCESS_CHECK_LINEAR_LOOKBACK_DAYS` **required** — scripts\check-process.ts
- `RETRO_DRAFT_DATE` **required** — scripts\retro-draft.ts
- `REVIEW_CANCEL_GRACE_SEC` **required** — scripts\review\wrapper.ts
- `REVIEW_HEARTBEAT_INTERVAL_SEC` **required** — scripts\review\wrapper.ts
- `REVIEW_SIGTERM_GRACE_SEC` **required** — scripts\review\wrapper.ts
- `REVIEW_WALL_CLOCK_TIMEOUT_SEC` **required** — scripts\review\wrapper.ts
- `VERCEL_OIDC_TOKEN` (has default) — .env.local

## Config Files

- `.env.example`
- `tsconfig.json`
- `vercel.json`
- `vite.config.ts`

## Key Dependencies

- react: ^19.2.0
- zod: ^4.3.6
