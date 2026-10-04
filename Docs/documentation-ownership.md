# Documentation Ownership Map

> Added 2026-03-12. Defines where each type of fact lives and what must never be duplicated.
> Updated 2026-04-26: rewrote for Linear-first workflow (BACKLOG.md/HANDOVER.md retired 2026-04-13).

## The Three Surfaces (+ CLAUDE.md)

| Surface | Owns | Does NOT own |
|---------|------|--------------|
| **Obsidian vault** (`TheFantasyWorldSimulator/`) | Domain model: systems, mechanics, relationships, terminology definitions. Plus LLM KB infrastructure: `Index.md` (comprehensive catalog), `log.md` (change journal), `raw/` (source materials), `output/` (generated reports) | Task tracking, implementation rationale, project status |
| **Repo** (`Docs/`, `.planning/`) | Implementation rationale, design plans, changelog, UI patterns, project status, milestone roadmaps | System definitions, issue tracking (that's Linear) |
| **Linear** ([Threadbare team](https://linear.app/threadbare)) | Issue tracking, backlog prioritization, handoff comments, project milestones, agent coordination state | System definitions, implementation rationale |
| **`CLAUDE.md`** | Session workflow, architectural decisions, non-functional priorities, skill routing, rejected approaches | Anything duplicated from the above — link, don't copy |
| **Canon pages** (`Docs/canon/`) | Per-domain navigation layer: current spec pointers, rejected approaches, open questions, last-reviewed date. Agent Step 0 for authoring work. Also hosts **generated** artifacts (`systems-inventory.md`, `interface-map.generated.md`, `consumption-ledger.generated.md`, `setting-coverage.generated.md`) — never hand-edit those; edit their registries/generators (e.g. `scripts/interface-contracts.ts`) and regenerate. | Definitions (those live in UL), rationale (those live in plans) |
| **AI index** (`Docs/ai-index/`) | Thin live runtime contracts for engine work — graph interpretation, tick-phase order, refactor footguns. The *detail* layer under `Docs/canon/engine.md`, which routes to it; registered as dependents of the `architecture` doctrine (guidance manifest), so an engine-authority edit flags them. Refreshed when `src/types/graph.ts` / `orchestrator.ts` / `phaseRegistry.ts` change shape. | Design rationale (plans), definitions (UL), gate law (canon/verification-gates.md) |

### Archived surfaces

| Surface | Status | What happened |
|---------|--------|---------------|
| **Notion** (`Development Backlog`) | Archived 2026-04-04 | Backlog migrated to `.planning/BACKLOG.md` (2026-03-22), then to Linear (2026-04-13). Design docs, archetypes, and reference content migrated to Obsidian vault (2026-04-04). Dilemma templates remain pending TypeScript import. |
| **`.planning/BACKLOG.md`** | Retired 2026-04-13 | Replaced by Linear (Threadbare team). File tombstoned with pointer to Linear. |
| **`.planning/HANDOVER.md`** | Retired 2026-04-13 | Replaced by Linear issue comments with coordination blocks. File tombstoned with pointer to Linear. |
| **Obsidian** `Build Status` note | Deprecated 2026-03-22 | Was frozen at 2026-03-05. Project status lives in `Docs/project-status.md` + `Docs/project-history.md`. |
| **Paper** | Archived 2026-03-29 | Was planned for visual documentation (component anatomy, style tiles, asset registry). Never actively maintained. Visual docs live in `STYLE.md` and the in-app `?view=styleguide`. |

---

## Duplication Rules

**One fact, one home.** If the same information exists in two places, one of them is wrong or stale.

- **What to build next** → Linear (Threadbare team) only. Issues sorted by priority within projects.
- **Active milestone tracking** → Linear Projects (lifecycle: Idea → Next → Research → Discovery → Now → Done).
- **Legacy milestone overview** → `.planning/ROADMAP.md`. Phase-level history.
- **Project status** → one `Docs/status/YYYY-MM-DD-thr-XXXX.md` fragment per shipped ticket (`Docs/project-status.md` is **generated and untracked** since THR-1016 — assembled from the newest fragments under a ≤60-line cap; never hand-edit it) + `Docs/project-history.md` (append-only archive).
- **System definitions** (e.g. "what is the Doom Clock") → Obsidian only. Other surfaces link to it.
- **Why a decision was made** → `Docs/plans/` only. CLAUDE.md references the plan doc, not the rationale itself.
- **Visual style** → `STYLE.md` (art direction) + `Docs/design-system/` (UI) + `?view=styleguide` (living component reference). Hex asset registry: `src/data/hex-tile-assets.ts`.
- **Canonical terminology** → `Docs/ubiquitous-language/` (UL wins on disagreements).

---

## What Lives Where — Quick Reference

### Obsidian
- All wikilinked system notes (`Index.md` as entry point — comprehensive catalog of all pages)
- Cosmology, reaches, actor types, relationship types
- Content strategy and narrative archetypes
- `log.md` — Append-only vault change journal (ingests, queries, lints, updates)
- `raw/` — Immutable source materials for LLM ingest (design docs, research, web clips)
- `output/` — LLM-generated reports, query results, audit outputs

### Linear
- All issue tracking (states: Todo, In Design, Implementation Planning, Ready for Dev, In Dev, Done)
- Handoff coordination blocks (CC pickup via comments)
- Project milestones and lifecycle status
- Agent coordination state (claims, WIP, parallel-safe/mutex)

### Repo — `.planning/`
- `ROADMAP.md` — legacy active milestone phase plan
- `REQUIREMENTS.md` — milestone requirements
- `phases/` — per-phase plan documents
- `BACKLOG_HISTORY.md` — pre-Linear completed-item archive (read-only history)

### Repo — `Docs/plans/`
- One markdown file per design decision / implementation plan
- Named by date: `YYYY-MM-DD-topic.md`
- Tradeoffs, alternatives considered, "why not X"

### Repo — `Docs/` (top level)
- `status/` — one fragment per shipped ticket (`project-status.md` is generated from the newest of these and untracked, THR-1016 — never hand-edit)
- `project-history.md` — append-only completed milestone archive (troubleshooting reference)
- `changelog.md` — append-only log of changes (date | where | what | why)
- `ubiquitous-language/` — canonical terminology (UL wins on disagreements)
- `canon/` — per-domain Canon pages (agent Step 0 for authoring tasks); schema in `canon/README.md`
- `ai-index/` — live runtime contracts for engine work (graph-contract, tick-phases, invariants-and-footguns); routed to by `canon/engine.md`
- `documentation-ownership.md` — this file

---

## Obsidian Vault as LLM Knowledge Base

> Moved here from `CLAUDE.md` § Documentation Strategy by THR-760 (2026-07-26). This file is the declared ownership authority for documentation surfaces, so the vault's own structure, scripts, and conventions belong here; CLAUDE.md keeps a two-line pointer.

The vault follows the Karpathy LLM Knowledge Base pattern — a persistent, compounding artifact where the LLM maintains the wiki and humans provide direction and raw sources.

**Three layers:**
- **`raw/`** — Immutable source materials (design docs, research, web clips). LLM reads but never modifies.
- **Wiki** (`Systems/`, `Cosmology/`, etc.) — LLM-compiled and maintained pages. The LLM owns this content.
- **`output/`** — Generated reports, query results, audit outputs filed back into the vault.
- **`Ubiquitous-Language/`** — Auto-mirrored glossary shard pages generated from `Docs/ubiquitous-language/` via `npm run mirror-ul`. Never hand-edit; edit the shard in `Docs/ubiquitous-language/` and re-mirror.
- **`Brainstorms/`** — Hand-curated **exploratory design drafts** (`YYYY-MM-DD-<topic>.md`), the pre-repo stage of the plan-doc lifecycle (THR-918). Rewritten freely with no git/PR/CI/lint; promoted into `Docs/plans/` only when the owning issue moves toward Ready for Dev, at which point design governance applies in full. Not git-backed — an unpromoted draft has no history. Canon pages may cite these paths as iteration records. See `Docs/canon/process.md` § Plan-doc lifecycle.

**Infrastructure files:**
- **`Index.md`** — Comprehensive catalog of ALL vault pages with one-line summaries. LLM-maintained. Read this first to navigate.
- **`log.md`** — Append-only chronological record of ingests, queries, lints, and updates.

**Access:** vault writes go through the **filesystem**, not the Obsidian MCP — set `OBSIDIAN_VAULT_PATH` in `.claude/settings.local.json`. See `Docs/ops/sandbox-limitations.md` for why (structurally closed 2026-07-21, THR-654).

**Core workflows** (each skill documents its own procedure; this table is routing only):

| Workflow | Skill | What it does |
|----------|-------|-------------|
| Ingest | `vault-ingest` | Compile raw sources into wiki pages, update index, log |
| Query | `vault-query` | Ask questions against the vault (3 depth tiers) |
| Lint | `vault-lint` | Audit vault health: orphans, broken links, stale content |
| Enrich | `vault-enrich` | Improve pages: add cross-refs, expand content, fix issues |
| Log append | `vault-log` | Append a `- **<type>** \| <description>` entry to `log.md` |

**Vault maintenance scripts:**

| Script | What it does |
|--------|-------------|
| `npm run generate-vault` | Regenerate graph-node pages from `world-model.json` (does NOT touch `Index.md` or `Systems/`) |
| `npm run mirror-ul` | Mirror UL shard docs into `Ubiquitous-Language/` in the Obsidian vault and append a vault log entry |
| `npm run mirror-ul:dry` | Print planned UL mirror writes without touching the vault |
| `npm run sync-vault` | Run `generate-vault` then `mirror-ul` in sequence |
| `npm run rebuild-index` | One-time rebuild of `Index.md` from all vault files |
| `npm run enhance-frontmatter` | One-time bulk update of frontmatter on hand-curated files |

**Frontmatter conventions:**

```yaml
# Auto-generated files (from world-model.json):
tags: [<category>, generated]
aliases: [<node name>]
id: <node-id>
category: <category>
status: complete
last-generated: YYYY-MM-DD

# Hand-curated files (Systems/, Brainstorms/, etc.):
tags: [<category>, <subcategory>]
aliases: [<alternative names>]
status: stub | draft | complete | deprecated
created: YYYY-MM-DD
updated: YYYY-MM-DD
```

---

## Volatile Facts — Special Handling

Some facts change so frequently they must not be documented statically:

| Fact | Where | How |
|------|-------|-----|
| File sizes / line counts | Nowhere static | Check live with `wc -l` |
| Test counts | CI output | Approximate; checked per verification run |
| Node/edge counts | `world-model.json` is the source; `CLAUDE.md` note is updated per session | |
| Engine module count | `CLAUDE.md` project status line only | Updated when meaningfully changed |

---

## Change Audit Trail

When any documentation surface is updated:
- Add a dated inline note near the change (date, what, why — one line)
- Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`)

---

## Relocated from CLAUDE.md (THR-1718) — documentation strategy, canon routing, key links, audit trail, codesight

> **Relocated verbatim from `CLAUDE.md` by THR-1718 (2026-10-04).** These are the documentation-surface sections CLAUDE.md used to carry in full. The text below is unchanged; paths in it are repo-root relative, and "this file" / "this section" mean their original place in `CLAUDE.md`. `CLAUDE.md` now carries a short card pointing here.

### Documentation Strategy

Four surfaces, each with a distinct purpose. Full ownership rules and duplication policy: **`Docs/documentation-ownership.md`**

- **Obsidian vault** — Two roles. (a) Domain model: systems, mechanics, terminology (wikilinks) — read `Index.md` first. (b) **Exploratory design drafts** (`Brainstorms/YYYY-MM-DD-<topic>.md`): brainstorming and rapid-prototyping thinking lives here, not in the repo — no git, no PR, no CI, no lint, rewrite freely. It is promoted into `Docs/plans/` **only when its issue moves toward Ready for Dev**, and governance applies from that moment (THR-918). The vault is not git-backed, so an unpromoted draft has no history — that is the accepted price of zero ceremony. See `Docs/canon/process.md` § Plan-doc lifecycle.
- **Repo `.planning/`** — Legacy milestone roadmap, phase history (backlog and handover retired — use Linear)
- **Repo `Docs/`** — Implementation rationale (`plans/`), changelog, UI patterns, project status
- **Canon pages** (`Docs/canon/`) — Per-domain navigation layer (current spec pointers, rejected approaches, open questions). **Agent Step 0 for authoring tasks.** See `Docs/canon/README.md` for the schema.

#### Canon Pages (agent Step 0 for authoring)

When starting any encounter, prose, attachment, or other content authoring task, load the relevant Canon page **before any other reference material**:

| Domain | Canon page | When to load |
|--------|-----------|-------------|
| Encounters | `Docs/canon/encounters.md` | Before running `encounter-pipeline`, `template-encounter-rewrite`, or any encounter content work |
| Cosmology | `Docs/canon/cosmology.md` | Before any content that references Reaches, Spheres, or Quintessence — includes encounters, agents, and faction content |
| Process | `Docs/canon/process.md` | At session start, instead of re-reading CLAUDE.md sections on NFPs, three-pillar rule, definition of done, design governance, coordination protocol, drift scan, retrospectives, and UL-proposal flow. Meta-canon for every design session. |
| Prose | `Docs/canon/prose.md` | Before any prose, vignette, enrichment, or content-table work — picks the right prose skill (`prose-pipeline`, `prose-content-systems`, `prose-vignettes-and-enrichment`), names the four pipelines, and asserts Threadbare voice + player-as-god framing. |
| Hex map | `Docs/canon/hex-map.md` | Before any HexMapV2 / Three.js / hex-renderer work — picks the right hex-map skill (`hexmap-core`, `hexmap-layers`), names the load-bearing decisions (raw Three.js / no R3F, three-tier position model, Y-flip, stencil clipping, hex-distance awareness), and lists current rejected approaches. |
| Rulebook (quick-reference) | `Docs/canon/rulebook-quick-reference.md` | **Always-load at session start** — board-game card, ~80 lines, current rules of play only. Companion to the full rulebook. |
| Rulebook (full synthesis) | `Docs/canon/rulebook.md` | Before any design or content work that touches **rules of play** — turn structure, action verbs, prerequisites, resources, encounters, clocks, win/loss. Each rule carries `[IMPL] / [DESIGN] / [OPEN]`. The single synthesis surface for how the systems combine into a game. |
| World objects | `Docs/canon/world-objects.md` | **Step 0 for any work that adds, names, targets or retires a kind of thing in the world** — an undertaking object, a chip anchor, a subtype, a content target rule. The catalogue of world objects in game words (Area · Hex · Location · Place · Route · Mortal · … · Event), the registry that derives the node schema (`src/data/world-objects.ts`), and the one-PR rule for adding a kind (registry row + UL term + canon row). Generated companion `world-objects.generated.md` (`npm run generate-world-objects`) carries the census badges and the drift verdict. |
| Content objects | `Docs/canon/content-objects.md` | **Step 0 for any work that adds, names, targets or retires a kind of authored content** — a template type, a catalog, a content-to-content reference, a gate over authored entries. The thirteen content kinds in game words (Encounter · Action · Undertaking · Item · … · Trait · … · Card), the catalogs that hold each, the world object a granted entry becomes, and the one-PR rule (row + UL term + canon row). Sibling of World objects: that page says what is *in* the world, this one what an author may *write*. Generated companion `content-objects.generated.md` (`npm run generate-content-objects`) carries the census and the drift verdict. |
| Systems inventory | `Docs/canon/systems-inventory.md` | **Required Step-0 load for any Engine-pillar design work.** Generated (`npm run generate-systems-inventory`) map of every subsystem wired into the engine — aliases (incl. legacy names like `TB-073`), the modules + tick phases that implement it, and an ACTIVE/DORMANT badge. Grep it for your premise nouns *before* drafting so you extend/activate an existing system instead of green-fielding a duplicate (the THR-614 failure). Cannot drift the way hand-written canon did. |

This table routes the common authoring domains; **the one full canon index — all 18 pages — is `Docs/canon/README.md`** (THR-1334).

**Why Canon pages exist:** agents triangulating canonical content from 6–12 files make silent errors (wrong reach count, stale formats, deprecated systems). A Canon page is a single ≤200-line entrypoint that answers "what is current?" and lists stale sources to avoid. The UL remains the terminology authority; Canon pages point to UL and add the navigation layer on top.

#### Obsidian vault

Vault work goes through the **filesystem**, not the Obsidian MCP — set `OBSIDIAN_VAULT_PATH` (see § Known Sandbox Limitations). The vault's structure, maintenance scripts, and frontmatter conventions live in **`Docs/documentation-ownership.md` § Obsidian Vault as LLM Knowledge Base**; each `vault-*` skill documents its own workflow.

### Key Links

- **Backlog & issue tracking: [Linear (Threadbare team)](https://linear.app/threadbare)** — single source of truth for all issues, states, and dependencies
- Linear coordination protocol: `Docs/plans/2026-04-13-linear-coordination-protocol.md`
- **Roadmap milestones: [Linear Projects](https://linear.app/threadbare/projects)** — 8 projects (Linear Setup, UI/UX Design Infrastructure, Procedural Hex Vignettes, Content Architecture, Attention Tier Model, Thematic Pressure, Social Systems Expansion, Rarity Model) with lifecycle statuses (Idea → Next → Research → Discovery → Now → Done)
- Legacy milestone roadmap: `.planning/ROADMAP.md` (still maintained for high-level overview)
- Completed items archive: `.planning/BACKLOG_HISTORY.md` (pre-Linear history)
- Obsidian vault index: `TheFantasyWorldSimulator/Index.md`, read from the filesystem via `OBSIDIAN_VAULT_PATH` (no Obsidian MCP for vault work — THR-654)
- Documentation ownership: `Docs/documentation-ownership.md`
- Integration wiring checklist: `Docs/plans/wiring-checklist.md`
- Design Reference Wiki (self-maintaining served HTML pages): `Docs/design-reference-wiki.md` — register a new served reference page in `public/wiki-manifest.json`; `npm run build` regenerates the hub + nav.
- Impediment log: `Docs/impediments.md` · Retrospectives: `Design/retros/`

Design docs live in `Docs/plans/` (named `YYYY-MM-DD-topic.md`). New plans copy `Docs/plans/_template.md` as a skeleton. Find existing plans by browsing the directory or loading the relevant domain skill.


### Change Audit Trail

When modifying Obsidian vault notes:

- **In the document:** Dated inline note near the change (date, what, why — one line).
- **In the changelog:** Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`).
- **In the vault log:** Append to `log.md` via the `vault-log` skill — a filesystem write to `OBSIDIAN_VAULT_PATH` (format: `- **<type>** | <description>`).


## Codesight — Codebase Intelligence

Codesight is installed as both a **static analysis output** (`.codesight/`) and an **MCP server** (`codesight` in `.mcp.json`). A SessionStart hook regenerates the analysis each session.

**Use codesight actively:**
- Before touching unfamiliar code, check `.codesight/wiki/index.md` for orientation (WHERE things live), then read actual source files.
- Use `.codesight/CODESIGHT.md` for the full context map: components, libraries, config, middleware, dependency graph.
- Use `.codesight/components.md` for the component catalog with props.
- Use `.codesight/graph.md` for the import dependency graph and high-impact files.
- Use the codesight MCP tools when available for live queries (blast radius, dependency chains).
- To refresh mid-session after significant changes: `npx codesight --wiki`

**High-impact files:** read the current list from **`.codesight/graph.md`** (regenerated by the SessionStart hook each session) — importer counts are too volatile to snapshot here (a 2026-07-03 snapshot was ~50% understated by 2026-08-29, THR-1362). The stable shape: `src/engine/graph.ts`, `src/types/gameState.ts`, `src/types/unifiedAction.ts`, `src/engine/traceBuffer.ts` and their `src/types/` siblings sit at the top with hundreds of importers each — treat any change to them as wide-blast and check `.codesight/graph.md` for the live numbers before sizing the change.

Wiki articles are navigation aids, not implementation guides — always read source files before implementing.
