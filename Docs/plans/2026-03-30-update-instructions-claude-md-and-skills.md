# Update Instructions: CLAUDE.md and Skills

**Date:** 2026-03-17
**For:** Claude Code to apply
**Context:** Post-brainstorm session on hex actions, control mechanic, and spheres/reaches consolidation

## CLAUDE.md Updates Needed

### 1. Rejected Approaches — Add 2 entries

In the `## Rejected Approaches (do not reintroduce)` section, add:

```markdown
- ❌ Intervention wheel (AgentWheel) — replaced by ActionDrawer with context-filtered cards via Generalized Action Targeting
- ❌ Fixed action count / capped action slots — replaced by open-ended, data-driven template pool filtered per target context
```

### 2. Key Links — Add new references

In the `## Key Links` section, add:

```markdown
- Spheres and Reaches relationship: Obsidian MCP → `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md`
- Generalized Action Targeting: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`
- Mutable hex state + hex actions: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`
- Hex action brainstorm (control mechanic, prerequisites): `brainstorm-hex-actions-and-control-mechanic.md`
```

### 3. Load-Bearing Architectural Decisions — Add 2 entries

In the `## Load-Bearing Architectural Decisions` section, add:

```markdown
- **Reaches and Spheres are orthogonal axes.** Reaches = what you do (activity categories). Spheres = what fuels it (cosmic energies). They combine freely — same Reach at different Sphere alignments produces different action flavors. Neither subsumes the other.
- **Ascendants use the same prerequisite system as agents.** Domain Capability tiers + sphere alignment checks apply equally. Ascendants are powerful former mortals, not a special-cased entity type. Power level is tunable, not structurally different.
```

### 4. Domain Skills table — Add action system skill

In the `## Domain Skills` table:

**Add** a row:
```markdown
| Action system & targeting | `action-system` | Hex actions, control mechanic, prerequisites, action templates, targeting pipeline |
```
Note: This skill doesn't exist yet. See below.

**Replace** the `content-authoring` row:
```markdown
| Attachment content | `cw-*` (platform) | Use `cw-brainstorming` for exploring new content ideas, `cw-prose-writing` for drafting item/spell/power descriptions, `cw-official-docs` for canonical wiki entries, `cw-story-critique` for reviewing content quality |
```
This replaces the never-created `content-authoring` project skill with the platform creative writing skills, which cover the same ground: brainstorming items/spells/powers, writing their descriptions, documenting them canonically, and reviewing content quality.

### 5. Project Status — Update current phase

The "Current phase" line should reflect that hex action design is in progress:

```markdown
- Current phase: **Hex Actions & Control Mechanic** (design) — check Notion backlog for next priority
```

## Skills Audit

### Existing skills (in `.claude/skills/`)

| Skill | Status | Notes |
|-------|--------|-------|
| `frontend-ui.md` | ✅ Exists, functional | No changes needed |
| `qa-orchestrator/` | ✅ Exists, functional | No changes needed |
| `defuddle`, `json-canvas`, `obsidian-*` | ⚠️ Broken symlinks | These point to the Obsidian plugin — broken in this context. Not blocking. |

### Skills referenced in CLAUDE.md but missing

These are listed in the Domain Skills table but have no corresponding skill file:

| Referenced Skill | Status | Recommendation |
|-----------------|--------|----------------|
| `engine-architecture` | ✅ Restored | Now in `.claude/skills/`. Needs updates (see below). |
| `content-worldbuilding` | ✅ Restored | Now in `.claude/skills/`. Needs updates (see below). |
| `art-direction` | ✅ Restored | Now in `.claude/skills/`. No changes needed. |
| `content-authoring` | 🔄 Replace | Never existed as a project skill. Replace with platform `cw-*` skills (see below). |
| `gamedocumenter` | ✅ Restored | Now in `.claude/skills/`. No changes needed. |
| `image-manipulation` | ✅ Restored | Now in `.claude/skills/`. No changes needed. |
| `action-system` | ❌ Missing (NEW) | Needed for the hex action / control mechanic / prerequisite work. |

### New skill recommended: `action-system`

This session produced enough new design context that an `action-system` skill would be valuable. It should cover:

- The 5 action verbs (Create, Find, Change, Destroy, Control) and their CRUD mappings
- The 4 hex chronicle layers (Land, Soul, People, Ruins) as action target contexts
- The Control mechanic (sustain models: essence drain, state threshold, ritual investment)
- The prerequisite system (two-axis: Reach competence + Sphere alignment)
- Control visibility and contestation via prerequisite-gated encounters
- How `UnifiedActionTemplate` works with `targetCategories`, `targetSubtypes`, `actorPrerequisites`
- The Generalized Action Targeting pipeline (`TargetContext` → `getTargetActionSlots()` → `ActionDrawer`)
- Reference: `brainstorm-hex-actions-and-control-mechanic.md`, `Docs/plans/2026-03-17-generalized-action-targeting-design.md`, `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`

### content-worldbuilding skill — EXISTS, needs updates

File: `.claude/skills/content-worldbuilding/SKILL.md`

Changes needed:

1. **Fix Star reach description:** Currently says "Star: Navigation/Fate" — should be "Star: Faith, devotion, divine connection, transcendence" (matches the canonical design tile and Obsidian note).

2. **Add Obsidian reference:** In the Cosmology section, add: "For the canonical reference on how Spheres and Reaches combine, read `TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md` via Obsidian MCP."

3. **Add action verb taxonomy:** After the Nine Reaches table, add a section:
```markdown
## Action Verbs (5)
Actions decompose into 5 verbs, mapped to CRUD:
- **Create** → `create` — bring something into existence
- **Find** → `read` — perceive, search, reveal
- **Change** → `update` (one-time) — modify once for a one-time cost
- **Destroy** → `delete` — remove, corrupt, scatter
- **Control** → `update` (sustained) — ongoing commitment requiring continuous resources, focus, or stability
```

4. **Add hex chronicle layers as action contexts:** After the action verbs section:
```markdown
## Hex Chronicle Layers (Action Contexts)
The hex detail view has 4 narrative layers, each a target context for actions:
- **The Land** — terrain, biome, resources, divineInfluence, corruption
- **The Soul** — sphere influence, magical saturation, leylines
- **The People** — cultures, factions, agents, encounters, locations
- **The Ruins** — historical culture, archaeology, exploration hooks (context-gated: only on hexes with historical culture)
```

5. **Add prerequisite system:** After the hex layers section:
```markdown
## Actor Prerequisites (Two-Axis)
Actions are gated by two orthogonal prerequisite checks:
- **Reach prerequisite** — Domain Capability tier in the relevant Reach (competence gate)
- **Sphere prerequisite** — sphere alignment match (alignment gate)
Ascendants use the same prerequisite system as agents. No special-casing.
```

6. **Update template count:** "Current stats" section says 198 nodes, 290 edges — update to match current numbers (244 nodes, 371 edges, 19 content packages).

### engine-architecture skill — EXISTS, needs updates

File: `.claude/skills/engine-architecture/SKILL.md`

Changes needed:

1. **Update CRUD action system section:** Currently says "36 enriched templates across the Nine Reaches" — now 119+ templates including hex (4), location (4), attachment (4), sublocation (3), divine (8), encounter (68), plus 36 CRUD base templates.

2. **Add Generalized Action Targeting:** New section after CRUD Action System:
```markdown
## Generalized Action Targeting

The action pipeline uses `TargetContext` → `getTargetActionSlots()` → `ActionDrawer`:
- Any graph node the player focuses on becomes an action target
- Templates declare `targetCategories` and `targetSubtypes` for filtering
- Filtering cascade: node-type → subtype → traits → sphere → essence → range
- Detail views construct `TargetContext` from their focused node
- Design doc: `Docs/plans/2026-03-17-generalized-action-targeting-design.md`
```

3. **Add HexMutation system:** New section:
```markdown
## Hex Mutations

Hexes aren't graph nodes — they live in `GameState.tiles[]`. Hex actions produce `HexMutation[]` instead of `GraphOp[]`:
- `HexMutation { col, row, field: 'divineInfluence' | 'corruption', delta, source }`
- Applied in `phaseHexState` tick phase
- Terrain transformation is threshold-based via lookup table
- Design doc: `Docs/plans/2026-03-17-world-state-and-hex-actions-design.md`
```

4. **Add Control mechanic (upcoming):** New section:
```markdown
## Control Actions (Design Phase)

A 5th action verb beyond CRUD: sustained actions requiring ongoing resources/focus/stability.
- Control slots scale with Domain Capability tier
- Three sustain models: essence drain, state threshold, ritual investment
- Active controls spawn visible encounter nodes that rivals can contest
- Prerequisites: Reach tier + Sphere alignment gate who can see/attempt contestation
- Brainstorm: `brainstorm-hex-actions-and-control-mechanic.md`
```

## NEW: state-of-game-design Skill

A new foundational skill that consolidates cross-cutting game design context. All other domain skills depend on it. File ready for Claude Code to install:

**Source:** `state-of-game-design-SKILL.md` (in workspace root)
**Destination:** `.claude/skills/state-of-game-design/SKILL.md`

### CLAUDE.md Domain Skills Table — Replace with layered model

Replace the current Domain Skills table with:

```markdown
## Domain Skills

Context for specific problem types lives in on-demand skills. **Always load `state-of-game-design` first** — it provides the foundational cosmology, action system, and architectural context that all other skills depend on.

| Domain | Skill | When to load |
|--------|-------|-------------|
| **Foundational (load first)** | `state-of-game-design` | Always — before any other domain skill. Cosmology, reaches, spheres, action verbs, prerequisites, architectural decisions. |
| Engine & code architecture | `engine-architecture` | Writing engine modules, tick loop work, tracing, resolution, PRNG |
| Frontend & UI | `frontend-ui` | Building components, styling, accessibility, layout at 1920–3440px. Loads `Docs/design-system/` |
| Content systems & worldbuilding | `content-worldbuilding` | Content packages, graph data, constraint layers, world-model.json |
| Art direction & visual style | `art-direction` | Hex tiles, prompt construction, STYLE.md, Threadbare aesthetic |
| Creative prose & content | `cw-*` (platform) | `cw-brainstorming` for ideas, `cw-prose-writing` for drafts, `cw-official-docs` for wiki, `cw-story-critique` for review |
| Post-implementation docs | `gamedocumenter` | Notion/Obsidian/changelog updates after completing work |
| Image manipulation | `image-manipulation` | Geometric clipping, alpha masks, hex tile pipeline |
| QA sweeps | `qa-orchestrator` | Systematic UI/UX/frontend QA |
```

### Dedup: Strip Cross-Cutting Context from Individual Skills

Now that `state-of-game-design` is the canonical source, strip the following duplicated content from individual skills. Replace each stripped section with a one-line pointer: `> **Prerequisite:** Load `state-of-game-design` first for foundational context.`

**content-worldbuilding/SKILL.md — Strip these sections:**
1. `## Cosmology` (entire section including Foundation Spheres, Creation Spheres, Nine Reaches table) — all now in state-of-game-design. Replace with: `## Cosmology\n\n> Covered by \`state-of-game-design\`. Load that skill first.\n> For the canonical reference: Obsidian → \`TheFantasyWorldSimulator/Cosmology/Spheres and Reaches.md\``
2. `## Graph Data Model` (the graph-first principle + stats) — now in state-of-game-design
3. `## Rival Gods` — keep, this is content-specific
4. `## World-Soul & Metaprogression` — keep, this is content-specific
5. `## Content Generation Pipeline` — keep, this is content-specific
6. `## Design Assessment for Content & Systems` — keep the content-specific NFP checklist and design doc template, but remove any general NFP explanation (that's in CLAUDE.md and state-of-game-design)

**engine-architecture/SKILL.md — Strip these sections:**
1. `## CRUD Action System` paragraph about "36 enriched templates" — now in state-of-game-design with updated count (119+). Replace with: `## Action System\n\n> Covered by \`state-of-game-design\`. Load that skill first for the full action system context (5 verbs, 119+ templates, targeting pipeline).`
2. The NFP bullet list (Tunability, Inspectability, etc.) — now in state-of-game-design. The engine-specific NFP *checklist table* stays (it's domain-specific guidance).
3. `## Resolution: Sigmoid Pool → d100` — keep, this is engine-specific implementation detail
4. `## Fail-Soft Tick Loop` — keep, this is engine-specific
5. `## Action Selection: Maslow Pipeline` — keep, this is engine-specific
6. Add the Generalized Action Targeting, HexMutation, and Control mechanic sections (as specified in the earlier instructions above)

**frontend-ui/SKILL.md — No stripping needed.** It has minimal cross-cutting context — just a brief "Visual Style: Threadbare" mention which is fine as a local reminder.

**art-direction/SKILL.md — No stripping needed.** Its Threadbare aesthetic content is domain-specific detail, not duplicated elsewhere.

**gamedocumenter/SKILL.md — No stripping needed.** Entirely procedural/operational.

**image-manipulation/SKILL.md — No stripping needed.** Entirely technical/procedural.

**qa-orchestrator/SKILL.md — No stripping needed.** Entirely procedural.

## Obsidian Index.md — Still needs manual update

The Obsidian patch API failed during the session. These changes still need to be applied to `TheFantasyWorldSimulator/Index.md`:

1. In "Player Systems" section: strike through Agent Wheel, Divine Toolkit, Intervention Delivery with deprecation notes
2. In "Cosmology" section: add link to [[Spheres and Reaches]]
3. In "Generalized Action Architecture" section: add link to hex action brainstorm concepts

These can be done via Claude Code editing the vault files directly, or via Obsidian CLI.
