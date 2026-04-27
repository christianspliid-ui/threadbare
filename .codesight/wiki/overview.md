# app — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**app** is a typescript project built with raw-http.

## Scale

248 UI components · 550 library files · 42 middleware layers · 16 environment variables

**UI:** 248 components (react) — see [ui.md](./ui.md)

**Libraries:** 550 files — see [libraries.md](./libraries.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `src\engine\graph.ts` — imported by **453** files
- `src\types\gameState.ts` — imported by **265** files
- `src\types\index.ts` — imported by **201** files
- `src\types\traits.ts` — imported by **186** files
- `src\types\unifiedAction.ts` — imported by **170** files
- `src\engine\traceBuffer.ts` — imported by **161** files

## Required Environment Variables

- `ANTHROPIC_API_KEY` — `scripts\review\review-client.ts`
- `CODEX_INTERNAL_ORIGINATOR_OVERRIDE` — `scripts\session-precheck.ts`
- `DEV` — `src\components\Game\GameView.tsx`
- `DRIFT_SCAN_BASELINE_PATH` — `scripts\drift-scan\index.ts`
- `LINEAR_API_KEY` — `scripts\check-process.ts`
- `NODE_ENV` — `src\components\Game\GuildQuestPanel.tsx`
- `OBSIDIAN_VAULT_ROOT` — `scripts\enhance-frontmatter.ts`
- `PROCESS_CHECK_FILES` — `scripts\check-process.ts`
- `PROCESS_CHECK_LINEAR_LOOKBACK_DAYS` — `scripts\check-process.ts`
- `RETRO_DRAFT_DATE` — `scripts\retro-draft.ts`
- `REVIEW_CANCEL_GRACE_SEC` — `scripts\review\wrapper.ts`
- `REVIEW_HEARTBEAT_INTERVAL_SEC` — `scripts\review\wrapper.ts`
- _...2 more_

---
_Back to [index.md](./index.md) · Generated 2026-04-27_