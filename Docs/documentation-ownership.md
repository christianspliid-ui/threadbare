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
| **Canon pages** (`Docs/canon/`) | Per-domain navigation layer: current spec pointers, rejected approaches, open questions, last-reviewed date. Agent Step 0 for authoring work. | Definitions (those live in UL), rationale (those live in plans) |

### Archived surfaces

| Surface | Status | What happened |
|---------|--------|---------------|
| **Notion** (`Development Backlog`) | Archived 2026-04-04 | Backlog migrated to `.planning/BACKLOG.md` (2026-03-22), then to Linear (2026-04-13). Design docs, archetypes, and reference content migrated to Obsidian vault (2026-04-04). Dilemma templates remain pending TypeScript import. |
| **`.planning/BACKLOG.md`** | Retired 2026-04-13 | Replaced by Linear (Threadbare team). File tombstoned with pointer to Linear. |
| **`.planning/HANDOVER.md`** | Retired 2026-04-13 | Replaced by Linear issue comments with coordination blocks. File tombstoned with pointer to Linear. |
| **Obsidian** `Build Status` note | Deprecated 2026-03-22 | Was frozen at 2026-03-05. Project status lives in `Docs/project-status.md` + `Docs/project-history.md`. |
| **Paper** | Archived 2026-03-29 | Was planned for visual documentation (component anatomy, style tiles, asset registry). Never actively maintained. Visual docs live in `STYLE.md` and `Design/style-tile.html`. |

---

## Duplication Rules

**One fact, one home.** If the same information exists in two places, one of them is wrong or stale.

- **What to build next** → Linear (Threadbare team) only. Issues sorted by priority within projects.
- **Active milestone tracking** → Linear Projects (lifecycle: Idea → Next → Research → Discovery → Now → Done).
- **Legacy milestone overview** → `.planning/ROADMAP.md`. Phase-level history.
- **Project status** → `Docs/project-status.md` (current focus, ≤60 lines) + `Docs/project-history.md` (append-only archive).
- **System definitions** (e.g. "what is the Doom Clock") → Obsidian only. Other surfaces link to it.
- **Why a decision was made** → `Docs/plans/` only. CLAUDE.md references the plan doc, not the rationale itself.
- **Visual style** → `STYLE.md` + `Design/style-tile.html` in repo.
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
- `project-status.md` — current focus + next priority (≤60 lines, orientation only)
- `project-history.md` — append-only completed milestone archive (troubleshooting reference)
- `changelog.md` — append-only log of changes (date | where | what | why)
- `ubiquitous-language/` — canonical terminology (UL wins on disagreements)
- `canon/` — per-domain Canon pages (agent Step 0 for authoring tasks); schema in `canon/README.md`
- `documentation-ownership.md` — this file

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
