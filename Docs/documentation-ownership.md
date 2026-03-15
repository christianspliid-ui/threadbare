# Documentation Ownership Map

> Added 2026-03-12. Defines where each type of fact lives and what must never be duplicated. Written as part of DOC-02 from the remediation plan.

## The Four Surfaces

| Surface | Owns | Does NOT own |
|---------|------|--------------|
| **Notion** (`Development Backlog`) | Sprint tasks, phase status, backlog items, audit follow-ups, work-in-progress tracking | System design, code architecture, UI specifications |
| **Obsidian vault** (`TheFantasyWorldSimulator/`) | Domain model: systems, mechanics, relationships, terminology definitions, build status | Task tracking, implementation rationale, raw code shape |
| **Repo docs** (`Docs/`) | Implementation rationale — why we chose X over Y, design tradeoffs, plan docs, changelog, UI patterns | Project planning, phase progress, backlog |
| **Paper** | UI/system visual documentation — component anatomy, visual style, asset registry, player journey maps, interaction flows | Implementation detail (no file sizes, line counts, or code snippets) |
| **`CLAUDE.md`** | Session workflow, architectural decisions, non-functional priorities, skill routing, rejected approaches | Anything duplicated from the above four — link, don't copy |

---

## Duplication Rules

**One fact, one home.** If the same information exists in two places, one of them is wrong or stale.

- **Phase/sprint status** → Notion only. `project-status.md` holds current focus only (≤ 20 lines). `project-history.md` holds the append-only completed milestone log.
- **System definitions** (e.g. "what is the Doom Clock") → Obsidian only. Other surfaces link to it.
- **Why a decision was made** → `Docs/plans/` only. CLAUDE.md references the plan doc, not the rationale itself.
- **Visual component shape/anatomy** → Paper only. Obsidian may link to the Paper board; repo docs do not describe component appearance.
- **Current next priority** → Notion (Remediation Plan or active backlog item). `CLAUDE.md` says "check Notion for next tasks" rather than restating them.

---

## What Lives Where — Quick Reference

### Notion
- Development Backlog page and sub-pages
- Remediation plan items (DOC-*, TECH-*, ARCH-*, FE-*, etc.)
- Sprint goals and acceptance criteria
- Audit follow-ups

### Obsidian
- All wikilinked system notes (`Index.md` as entry point)
- Build status (`Build Status` note)
- Cosmology, reaches, actor types, relationship types
- Content strategy and narrative archetypes

### Repo — `Docs/plans/`
- One markdown file per design decision / implementation plan
- Named by date: `YYYY-MM-DD-topic.md`
- Tradeoffs, alternatives considered, "why not X"

### Repo — `Docs/` (top level)
- `project-status.md` — current focus + next priority (≤ 20 lines, orientation only)
- `project-history.md` — append-only completed milestone archive (troubleshooting reference)
- `changelog.md` — append-only log of changes (date | where | what | why)
- `ui-patterns.md` — frontend interaction conventions and component patterns
- `documentation-ownership.md` — this file

### Paper
- `Threadbare — Style Tile` (to be split per PAPER-02: Brand + Art Direction, UI Tokens + Chrome, Hex Asset Registry, Prompt / Art Pipeline)
- `HexZoom Component Overview` (concepts only — no file sizes or code shape per PAPER-03)
- Player Journey Board (to be created alongside PROD-01 Vertical Slice Contract)

---

## Volatile Facts — Special Handling

Some facts change so frequently they must not be documented statically:

| Fact | Where | How |
|------|-------|-----|
| File sizes / line counts | Nowhere static | Check live with `wc -l` |
| Test counts | Notion task entries only (as "approximately X new tests") | Not in Obsidian |
| Node/edge counts | `world-model.json` is the source; `CLAUDE.md` note is updated per session | |
| Engine module count | `CLAUDE.md` project status line only | Updated when meaningfully changed |

---

## Change Audit Trail

When any documentation surface is updated:
- Add a dated inline note near the change (date, what, why — one line)
- Append to `Docs/changelog.md` (format: `| date | where | what changed | why |`)
