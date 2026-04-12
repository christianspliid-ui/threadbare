# app — Overview

> **Navigation aid.** This article shows WHERE things live (routes, models, files). Read actual source files before implementing new features or making changes.

**app** is a typescript project built with raw-http.

## Scale

166 UI components · 475 library files · 34 middleware layers · 4 environment variables

**UI:** 166 components (react) — see [ui.md](./ui.md)

**Libraries:** 475 files — see [libraries.md](./libraries.md)

## High-Impact Files

Changes to these files have the widest blast radius across the codebase:

- `src\engine\graph.ts` — imported by **381** files
- `src\types\index.ts` — imported by **188** files
- `src\types\gameState.ts` — imported by **183** files
- `src\types\traits.ts` — imported by **169** files
- `src\engine\traceBuffer.ts` — imported by **109** files
- `src\types\encounter.ts` — imported by **96** files

## Required Environment Variables

- `DEV` — `src\components\Game\GameView.tsx`
- `OBSIDIAN_VAULT_ROOT` — `scripts\enhance-frontmatter.ts`

---
_Back to [index.md](./index.md) · Generated 2026-04-12_