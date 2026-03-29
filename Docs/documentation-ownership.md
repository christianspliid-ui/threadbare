# Documentation Ownership Map

> Added 2026-03-12. Defines where each type of fact lives and what must never be duplicated.
> Updated 2026-03-22: Notion backlog archived → backlog now lives in `.planning/BACKLOG.md`. Obsidian `Build Status` deprecated.

## The Three Surfaces (+ CLAUDE.md)

| Surface | Owns | Does NOT own |
|---------|------|--------------|
| **Obsidian vault** (`TheFantasyWorldSimulator/`) | Domain model: systems, mechanics, relationships, terminology definitions | Task tracking, implementation rationale, project status |
| **Repo** (`Docs/`, `.planning/`) | Implementation rationale, design plans, changelog, UI patterns, project status, backlog, milestone roadmaps | System definitions |
| **`CLAUDE.md`** | Session workflow, architectural decisions, non-functional priorities, skill routing, rejected approaches | Anything duplicated from the above — link, don't copy |

### Archived surfaces

| Surface | Status | What happened |
|---------|--------|---------------|
| **Notion** (`Development Backlog`) | Archived 2026-03-22 | Pending items migrated to `.planning/BACKLOG.md`. Some content not yet migrated to Obsidian. |
| **Obsidian** `Build Status` note | Deprecated 2026-03-22 | Was frozen at 2026-03-05. Project status lives in `Docs/project-status.md` + `Docs/project-history.md`. |
| **Paper** | Archived 2026-03-29 | Was planned for visual documentation (component anatomy, style tiles, asset registry). Never actively maintained. Visual docs live in `STYLE.md` and `Design/style-tile.html`. |

---

## Duplication Rules

**One fact, one home.** If the same information exists in two places, one of them is wrong or stale.

- **What to build next** → `.planning/BACKLOG.md` only. Prioritized backlog of future work.
- **Active milestone tracking** → `.planning/ROADMAP.md`. Phase-level progress and decisions. (`.planning/STATE.md` is machine-generated GSD executor state — not manually maintained.)
- **Project status** → `Docs/project-status.md` (current focus, ≤60 lines) + `Docs/project-history.md` (append-only archive).
- **System definitions** (e.g. "what is the Doom Clock") → Obsidian only. Other surfaces link to it.
- **Why a decision was made** → `Docs/plans/` only. CLAUDE.md references the plan doc, not the rationale itself.
- **Visual style** → `STYLE.md` + `Design/style-tile.html` in repo.

---

## What Lives Where — Quick Reference

### Obsidian
- All wikilinked system notes (`Index.md` as entry point)
- Cosmology, reaches, actor types, relationship types
- Content strategy and narrative archetypes

### Repo — `.planning/`
- `BACKLOG.md` — prioritized future work (migrated from Notion 2026-03-22). Completed ✅ items archived to `BACKLOG_HISTORY.md`.
- `BACKLOG_HISTORY.md` — append-only archive of completed backlog items (split from BACKLOG.md 2026-03-29)
- `ROADMAP.md` — active milestone phase plan
- `REQUIREMENTS.md` — milestone requirements
- `STATE.md` — GSD executor state (machine-generated, not manually maintained)
- `phases/` — per-phase plan documents

### Repo — `Docs/plans/`
- One markdown file per design decision / implementation plan
- Named by date: `YYYY-MM-DD-topic.md`
- Tradeoffs, alternatives considered, "why not X"

### Repo — `Docs/` (top level)
- `project-status.md` — current focus + next priority (≤60 lines, orientation only)
- `project-history.md` — append-only completed milestone archive (troubleshooting reference)
- `changelog.md` — append-only log of changes (date | where | what | why)
- `ui-patterns.md` — frontend interaction conventions and component patterns
- `documentation-ownership.md` — this file

---

## Volatile Facts — Special Handling

Some facts change so frequently they must not be documented statically:

| Fact | Where | How |
|------|-------|-----|
| File sizes / line counts | Nowhere static | Check live with `wc -l` |
| Test counts | `.planning/STATE.md` (GSD executor auto-updates) | Approximate; updated after each plan completion |
| Node/edge counts | `world-model.json` is the source; `CLAUDE.md` note is updated per session | |
| Engine module count | `CLAUDE.md` project status line only | Updated when meaningfully changed |

---

## Change Audit Trail

When any documentation surface is updated:
- Add a dated inline note near the change (date, what, why — one line)
- Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`)
