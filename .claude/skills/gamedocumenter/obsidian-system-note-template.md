# Obsidian System Note Template

Use this when creating new system notes in `TheFantasyWorldSimulator/Systems/`.

```markdown
---
tags: [system, <category>]
aliases: [<AliasOne>, <AliasTwo>]
---
# System Name

> One-line summary of what this system does.

*(added YYYY-MM-DD — Phase X description)*

## Overview

2-3 paragraphs explaining the system. What does it do? Why does it exist? What's the key insight?

## [Domain-Specific Sections]

The meat of the note. Tables, mechanics, rules — whatever describes THIS system.

## Implementation

| File | Role |
|------|------|
| `src/types/foo.ts` | Types and constants |
| `src/engine/foo.ts` | Core logic |
| `src/components/Game/Foo.tsx` | UI component |

## Connections

- [[Related System]] — how it connects
- [[Another System]] — how it connects
```

## Tag Categories

`system` · `ui` · `engine` · `player` · `spatial` · `content` · `narrative` · `adversarial` · `meta`

## Naming Conventions

- Title case with spaces: `Fog of War.md`, not `fog-of-war.md`
- Path: `TheFantasyWorldSimulator/Systems/`
- Aliases should include the code-level name (e.g., `AvatarHUD`, `MandateTracker`)
