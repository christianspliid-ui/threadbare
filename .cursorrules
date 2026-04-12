# Project Context

This is a typescript project using raw-http.

The UI has 166 components. See .codesight/components.md for the full list with props.
Middleware includes: custom, validation, auth.

High-impact files (most imported, changes here affect many other files):
- src\engine\graph.ts (imported by 370 files)
- src\types\index.ts (imported by 186 files)
- src\types\gameState.ts (imported by 176 files)
- src\types\traits.ts (imported by 156 files)
- src\engine\traceBuffer.ts (imported by 106 files)
- src\types\encounter.ts (imported by 97 files)
- src\types\agent.ts (imported by 96 files)
- src\types\influence.ts (imported by 86 files)

Required environment variables (no defaults):
- DEV (src\components\Game\GameView.tsx)
- OBSIDIAN_VAULT_ROOT (scripts\enhance-frontmatter.ts)

Read .codesight/wiki/index.md for orientation (WHERE things live). Then read actual source files before implementing. Wiki articles are navigation aids, not implementation guides.
Read .codesight/CODESIGHT.md for the complete AI context map including all routes, schema, components, libraries, config, middleware, and dependency graph.
