# app — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**app** is a typescript project built with raw-http.

## Scale

171 UI components · 486 library files · 38 middleware layers · 4 environment variables

**UI:** 171 components (react) — see [ui.md](./ui.md)

**Libraries:** 486 files — see [libraries.md](./libraries.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `src\engine\graph.ts` — imported by **389** files
- `src\types\gameState.ts` — imported by **192** files
- `src\types\index.ts` — imported by **191** files
- `src\types\traits.ts` — imported by **173** files
- `src\engine\traceBuffer.ts` — imported by **113** files
- `src\types\encounter.ts` — imported by **106** files

## Required Environment Variables

- `DEV` — `src\components\Game\GameView.tsx`
- `OBSIDIAN_VAULT_ROOT` — `scripts\enhance-frontmatter.ts`

---
_Back to [index.md](./index.md) · Generated 2026-04-16_