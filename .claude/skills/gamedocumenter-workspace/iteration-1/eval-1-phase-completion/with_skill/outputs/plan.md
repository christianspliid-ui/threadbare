# Game Documenter Execution Plan: Phase 6G Completion

**Task:** Update all documentation after completing Phase 6G (Location Detail Panel implementation)
**Date:** 2026-03-07
**Implementation:** LocationDetailPanel.tsx (280 lines), locationDetail.ts (150 lines), GameView.tsx (modified), 24 new tests across 3 test files

## Overview

Following the gamedocumenter skill exactly, this plan specifies the tool calls in order for all 6 steps. This is a **full phase completion**, so all 6 steps apply (not the lightweight subset).

---

## Step 1: Update CLAUDE.md Changelog

**Tool:** Edit
**File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`
**Operation:** Append rows to the `### Recent Changes` table at the bottom of the Change Audit Trail section

**Exact Rows to Append** (will be added as new table rows):

```
| 2026-03-07 | Repo: src/data/ | Created location-content.ts — location archetypes, descriptive fragments, atmosphere templates | Phase 6G Task 1: location content data |
| 2026-03-07 | Repo: src/engine/ | Created locationDetail.ts — getLocationDetail aggregator (150 lines, 8 tests) | Phase 6G Task 2: location detail engine |
| 2026-03-07 | Repo: src/components/Game/ | Created LocationDetailPanel.tsx — full location character sheet (280 lines, 12 tests) | Phase 6G Task 3: location detail UI |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — wired LocationDetailPanel as conditional right sidebar | Phase 6G Task 4: GameView integration |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-design.md — 7 decisions (sidebar replacement, full sheet, archetype integration, data sources, section layout, aggregator, visual hierarchy) | Phase 6G design rationale |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-implementation.md — 6-task TDD implementation plan | Phase 6G implementation plan |
| 2026-03-07 | Obsidian: Systems/ | Created Location Detail Panel.md; updated Index.md with Location Detail Panel link | Phase 6G vault documentation |
| 2026-03-07 | Notion: Backlog | Marked Phase 6G complete, added reference docs to Reference Documents section | Phase 6G backlog update |
```

**Tool Call Format:**
```
Edit(
  file_path="/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md",
  old_string="<find the end of the most recent table row and identify the selection boundary>",
  new_string="<existing content><newline><newline>| 2026-03-07 | Repo: src/data/ | Created location-content.ts — location archetypes, descriptive fragments, atmosphere templates | Phase 6G Task 1: location content data |
| 2026-03-07 | Repo: src/engine/ | Created locationDetail.ts — getLocationDetail aggregator (150 lines, 8 tests) | Phase 6G Task 2: location detail engine |
| 2026-03-07 | Repo: src/components/Game/ | Created LocationDetailPanel.tsx — full location character sheet (280 lines, 12 tests) | Phase 6G Task 3: location detail UI |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — wired LocationDetailPanel as conditional right sidebar | Phase 6G Task 4: GameView integration |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-design.md — 7 decisions (sidebar replacement, full sheet, archetype integration, data sources, section layout, aggregator, visual hierarchy) | Phase 6G design rationale |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-implementation.md — 6-task TDD implementation plan | Phase 6G implementation plan |
| 2026-03-07 | Obsidian: Systems/ | Created Location Detail Panel.md; updated Index.md with Location Detail Panel link | Phase 6G vault documentation |
| 2026-03-07 | Notion: Backlog | Marked Phase 6G complete, added reference docs to Reference Documents section | Phase 6G backlog update |"
)
```

**Selection Strategy:**
- Find the last existing changelog row (look for the most recent date in the table)
- Use `selection_with_ellipsis` to target the end of that row, capturing ~10 chars from the start of the last row and ~10 chars from its end
- Example: `"| 2026-03-06 | Repo: src/c...nge update |"`
- Append all 8 new rows after it

---

## Step 2: Update CLAUDE.md Project Status

**Tool:** Edit
**File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`
**Section:** `## Project Status`

**Changes Required:**

### 2.1 Add Phase 6G Completion Line
Find the line:
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
```

Replace it with:
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Phase 6G (Location Detail Panel): ✅ Complete — location content data, location detail engine, LocationDetailPanel component, GameView wiring
```

**Tool Call:**
```
Edit(
  file_path="/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md",
  old_string="- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring",
  new_string="- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Phase 6G (Location Detail Panel): ✅ Complete — location content data, location detail engine, LocationDetailPanel component, GameView wiring"
)
```

### 2.2 Update "Current phase" Line
Find the line:
```
- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder
```

Replace with:
```
- Current phase: **Location detail panel complete** — location character sheet with archetype integration working; next up: culture content data implementation (`culture-content.ts`) or encounter system
```

**Tool Call:**
```
Edit(
  file_path="/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md",
  old_string="- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder",
  new_string="- Current phase: **Location detail panel complete** — location character sheet with archetype integration working; next up: culture content data implementation (`culture-content.ts`) or encounter system"
)
```

### 2.3 Update Engine Stats
Baseline: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files

New additions:
- locationDetail.ts (1 new module)
- LocationDetailPanel.tsx (1 new module)
- location-content.ts (1 new module)
- 24 new tests (1,027 → 1,051)

Find the line:
```
- Engine stats: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files
```

Replace with:
```
- Engine stats: ~70 modules, ~10,750 lines, ~1,051 tests across 82 test files
```

**Tool Call:**
```
Edit(
  file_path="/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md",
  old_string="- Engine stats: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files",
  new_string="- Engine stats: ~70 modules, ~10,750 lines, ~1,051 tests across 82 test files"
)
```

### 2.4 Update Content Stats (if applicable)
The task mentions location-content.ts being created, so content packages count increases to 9.

Find the line:
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

Replace with:
```
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 9 content packages (archetype-content.ts and location-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

**Tool Call:**
```
Edit(
  file_path="/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md",
  old_string="- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines",
  new_string="- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 9 content packages (archetype-content.ts and location-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines"
)
```

---

## Step 3: Create Obsidian System Notes

### 3.1 Check Existing Notes in Systems/ Folder
**Tool:** obsidian_list_files_in_dir
**Path:** `TheFantasyWorldSimulator/Systems`

**Expected Output:** List of existing system note files. This tells us whether `Location Detail Panel.md` already exists. If it does, skip the creation step and go to Step 4 (update Index.md only).

**Tool Call:**
```
obsidian_list_files_in_dir(
  dirpath="TheFantasyWorldSimulator/Systems"
)
```

### 3.2 Create Location Detail Panel.md (if it doesn't exist)
**Tool:** obsidian_append_content
**File:** `TheFantasyWorldSimulator/Systems/Location Detail Panel.md`
**Content:**

```markdown
---
tags: [system, ui, player, spatial]
aliases: [LocationDetailPanel]
---
# Location Detail Panel

> Displays comprehensive information about a location including descriptive flavor, inhabitants, artifacts, and influence sphere expression.

*(added 2026-03-07 — Phase 6G implementation)*

## Overview

The Location Detail Panel provides a full character sheet for any location in the hex zoom level. When a player selects a location from the HexZoomView, the right sidebar displays the location's narrative details, internal agents, artifacts, and how it reflects the current influence spheres. This panel mirrors the Agent Detail Panel structure but adapted to location-specific data (atmosphere, governance, cultural markers).

## Components

The panel displays:
- **Header:** Location name, terrain type, current inhabitants count
- **Atmosphere:** Narrative flavor text (2-3 sentences) drawn from location archetypes and cultural context
- **Inhabitants:** List of agents currently at this location with tier markers
- **Artifacts:** Significant objects or structures anchored to this location
- **Sphere Expression:** How each of the 10 influence spheres manifest visually/narratively at this location
- **Connections:** Linked locations, travel lines, neighboring hex relationships

## Data Flow

| Source | Data | Role |
|--------|------|------|
| `world-model.json` | Location nodes, edges to actors/artifacts | Graph structure |
| `location-content.ts` | Archetype definitions, descriptive templates | Narrative flavor |
| `locationDetail.ts` aggregator | Resolved location detail object | Unified data query |
| `GameState` | Current agents, sphere influence map | Runtime state |
| `LocationDetailPanel.tsx` component | Rendering logic, visual layout | UI presentation |

## Implementation

| File | Role |
|------|------|
| `src/types/location.ts` | Location archetype and detail types |
| `src/data/location-content.ts` | Location archetypes with descriptive fragments, atmosphere templates |
| `src/engine/locationDetail.ts` | Core aggregator logic (150 lines, 8 tests) |
| `src/components/Game/LocationDetailPanel.tsx` | Full UI component (280 lines, 12 tests) |
| `src/components/Game/GameView.tsx` | Integration: conditional right sidebar render |

## Connections

- [[Hex Zoom View]] — location selection triggers detail panel
- [[Agent Detail Panel]] — parallel structure for agent character sheets
- [[Narrative Archetypes]] — location archetypes define prose tone and flavor
- [[Content Strategy]] — location-content.ts part of content package ecosystem
- [[Influence System]] — sphere expression reflects active influence state
```

**Tool Call:**
```
obsidian_append_content(
  filepath="TheFantasyWorldSimulator/Systems/Location Detail Panel.md",
  content="---
tags: [system, ui, player, spatial]
aliases: [LocationDetailPanel]
---
# Location Detail Panel

> Displays comprehensive information about a location including descriptive flavor, inhabitants, artifacts, and influence sphere expression.

*(added 2026-03-07 — Phase 6G implementation)*

## Overview

The Location Detail Panel provides a full character sheet for any location in the hex zoom level. When a player selects a location from the HexZoomView, the right sidebar displays the location's narrative details, internal agents, artifacts, and how it reflects the current influence spheres. This panel mirrors the Agent Detail Panel structure but adapted to location-specific data (atmosphere, governance, cultural markers).

## Components

The panel displays:
- **Header:** Location name, terrain type, current inhabitants count
- **Atmosphere:** Narrative flavor text (2-3 sentences) drawn from location archetypes and cultural context
- **Inhabitants:** List of agents currently at this location with tier markers
- **Artifacts:** Significant objects or structures anchored to this location
- **Sphere Expression:** How each of the 10 influence spheres manifest visually/narratively at this location
- **Connections:** Linked locations, travel lines, neighboring hex relationships

## Data Flow

| Source | Data | Role |
|--------|------|------|
| \`world-model.json\` | Location nodes, edges to actors/artifacts | Graph structure |
| \`location-content.ts\` | Archetype definitions, descriptive templates | Narrative flavor |
| \`locationDetail.ts\` aggregator | Resolved location detail object | Unified data query |
| \`GameState\` | Current agents, sphere influence map | Runtime state |
| \`LocationDetailPanel.tsx\` component | Rendering logic, visual layout | UI presentation |

## Implementation

| File | Role |
|------|------|
| \`src/types/location.ts\` | Location archetype and detail types |
| \`src/data/location-content.ts\` | Location archetypes with descriptive fragments, atmosphere templates |
| \`src/engine/locationDetail.ts\` | Core aggregator logic (150 lines, 8 tests) |
| \`src/components/Game/LocationDetailPanel.tsx\` | Full UI component (280 lines, 12 tests) |
| \`src/components/Game/GameView.tsx\` | Integration: conditional right sidebar render |

## Connections

- [[Hex Zoom View]] — location selection triggers detail panel
- [[Agent Detail Panel]] — parallel structure for agent character sheets
- [[Narrative Archetypes]] — location archetypes define prose tone and flavor
- [[Content Strategy]] — location-content.ts part of content package ecosystem
- [[Influence System]] — sphere expression reflects active influence state
"
)
```

---

## Step 4: Update Obsidian Index.md

**Critical Workaround:** Do NOT use `obsidian_patch_content` with heading targets. Index.md headings contain inline styling like `*(added 2026-03-06)*`, which causes API failures.

### 4.1 Get Current Index.md Content
**Tool:** obsidian_get_file_contents
**File:** `TheFantasyWorldSimulator/Index.md`

**Tool Call:**
```
obsidian_get_file_contents(
  filepath="TheFantasyWorldSimulator/Index.md"
)
```

**Expected Output:** Full content of Index.md so we can see where to append the new link.

### 4.2 Append New Link to Index.md
**Tool:** obsidian_append_content
**Strategy:** Append a new link at the end of the file (or within an existing logical section like "Player Systems" or "Spatial & Map Systems" if one exists)

**Content to Append:**
```markdown

- [[Location Detail Panel]] — Full character sheet for locations with archetype flavor, inhabitants, artifacts, and sphere expression *(added 2026-03-07)*
```

**Alternative (if index has clear section headers):** If Index.md has a section like `## Spatial & Map Systems` or `## Player Systems`, use `obsidian_append_content` to append at the end, creating a new subsection if needed.

**Tool Call:**
```
obsidian_append_content(
  filepath="TheFantasyWorldSimulator/Index.md",
  content="
- [[Location Detail Panel]] — Full character sheet for locations with archetype flavor, inhabitants, artifacts, and sphere expression *(added 2026-03-07)*"
)
```

**Note:** We use `append_content` to add at the end of the file, which always works. The skill explicitly warns against trying to patch headings with inline styling.

---

## Step 5: Update Notion Backlog

### 5.1 Fetch Current Notion Page
**Tool:** notion-fetch
**Page ID:** `3182b241dfb081b9af78c279eef405cf` (Development Backlog)

**Tool Call:**
```
notion-fetch(
  id="3182b241dfb081b9af78c279eef405cf"
)
```

**Purpose:** Read the current state of the backlog to identify:
1. Where Phase 6G section is (or if it needs to be created)
2. What the task list looks like
3. Where the Reference Documents section is

### 5.2 Update Phase 6G Section Header
**Tool:** notion-update-page
**Command:** replace_content_range

Find the Phase 6G header and task list in the fetched content. Replace the old structure with:

```
### Phase 6G: Location Detail Panel ✅ Complete (2026-03-07)
*Design doc: **`Docs/plans/2026-03-07-location-detail-design.md`**. Implementation plan: **`Docs/plans/2026-03-07-location-detail-implementation.md`**. 24 new tests across 3 test files, 3 new files + 1 modified.*
- [x] Create location content data package — location archetypes, atmosphere templates (`src/data/location-content.ts`)
- [x] Create location detail engine aggregator — 6 query functions (150 lines, 8 tests) (`src/engine/locationDetail.ts`)
- [x] Create LocationDetailPanel component — full character sheet (280 lines, 12 tests) (`src/components/Game/LocationDetailPanel.tsx`)
- [x] Wire into GameView — conditional right sidebar rendering based on selected location
```

**Selection Strategy:** Use `selection_with_ellipsis` to uniquely target the Phase 6G section. For example:
```
selection_with_ellipsis="### Phase 6G: Location...right sidebar rendering"
```

**Tool Call:**
```
notion-update-page(
  page_id="3182b241dfb081b9af78c279eef405cf",
  command="replace_content_range",
  selection_with_ellipsis="### Phase 6G: Location...right sidebar rendering",
  new_str="### Phase 6G: Location Detail Panel ✅ Complete (2026-03-07)
*Design doc: **\`Docs/plans/2026-03-07-location-detail-design.md\`**. Implementation plan: **\`Docs/plans/2026-03-07-location-detail-implementation.md\`**. 24 new tests across 3 test files, 3 new files + 1 modified.*
- [x] Create location content data package — location archetypes, atmosphere templates (\`src/data/location-content.ts\`)
- [x] Create location detail engine aggregator — 6 query functions (150 lines, 8 tests) (\`src/engine/locationDetail.ts\`)
- [x] Create LocationDetailPanel component — full character sheet (280 lines, 12 tests) (\`src/components/Game/LocationDetailPanel.tsx\`)
- [x] Wire into GameView — conditional right sidebar rendering based on selected location"
)
```

### 5.3 Add Reference Doc Links
**Tool:** notion-update-page
**Command:** insert_content_after

Find the "Reference Documents" section in the backlog. Append links to the two new design docs.

**Selection to target:** Find a recent reference link that serves as an anchor (e.g., a Phase 6F doc link).

**Content to insert:**
```
- `Docs/plans/2026-03-07-location-detail-design.md` — Location detail system design document with 7 architectural decisions
- `Docs/plans/2026-03-07-location-detail-implementation.md` — Location detail system 6-task TDD implementation plan
```

**Tool Call:**
```
notion-update-page(
  page_id="3182b241dfb081b9af78c279eef405cf",
  command="insert_content_after",
  selection_with_ellipsis="Reference Documents...2026-03-06...",
  new_str="
- \`Docs/plans/2026-03-07-location-detail-design.md\` — Location detail system design document with 7 architectural decisions
- \`Docs/plans/2026-03-07-location-detail-implementation.md\` — Location detail system 6-task TDD implementation plan"
)
```

**Note:** If there is no existing Phase 6G section in the backlog, you may need to create it first before updating. Fetch the page, identify the insertion point between Phase 6F and Phase 6H (or at the end if Phase 6H doesn't exist yet), then use `insert_content_after` to add the entire Phase 6G section.

---

## Step 6: Commit Documentation Changes

**Tool:** Bash (git commands)
**Location:** /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/

### 6.1 Stage CLAUDE.md
```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add CLAUDE.md
```

**Tool Call:**
```
Bash(
  command="cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git add CLAUDE.md"
)
```

### 6.2 Commit
```bash
cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git commit -m "docs: update project status for Phase 6G completion

Added Location Detail Panel system notes to vault, updated changelog with 8 new entries covering location-content.ts, locationDetail.ts aggregator, LocationDetailPanel component, and GameView integration. Updated engine stats (70 modules, 10,750 lines, 1,051 tests), content stats (9 packages), and current phase status. Added design and implementation plan references to Notion backlog.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

**Tool Call:**
```
Bash(
  command="cd /sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator && git commit -m 'docs: update project status for Phase 6G completion

Added Location Detail Panel system notes to vault, updated changelog with 8 new entries covering location-content.ts, locationDetail.ts aggregator, LocationDetailPanel component, and GameView integration. Updated engine stats (70 modules, 10,750 lines, 1,051 tests), content stats (9 packages), and current phase status. Added design and implementation plan references to Notion backlog.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>'"
)
```

---

## Execution Order Summary

All tool calls should be made in this strict order. Steps 1-2 update CLAUDE.md files. Step 3 creates vault notes. Step 4 updates vault index. Step 5 updates Notion. Step 6 commits.

1. **Edit** — Append 8 changelog rows to CLAUDE.md (Step 1)
2. **Edit** — Add Phase 6G completion line to Project Status (Step 2.1)
3. **Edit** — Update "Current phase" line (Step 2.2)
4. **Edit** — Update "Engine stats" line (Step 2.3)
5. **Edit** — Update "Content stats" line (Step 2.4)
6. **obsidian_list_files_in_dir** — Check if Location Detail Panel.md already exists (Step 3.1)
7. **obsidian_append_content** — Create Location Detail Panel.md in Systems/ (Step 3.2)
8. **obsidian_get_file_contents** — Read current Index.md (Step 4.1)
9. **obsidian_append_content** — Add new link to Index.md (Step 4.2)
10. **notion-fetch** — Read current Notion backlog (Step 5.1)
11. **notion-update-page** — Replace Phase 6G section header and tasks (Step 5.2)
12. **notion-update-page** — Insert reference doc links (Step 5.3)
13. **Bash (git add)** — Stage CLAUDE.md for commit (Step 6.1)
14. **Bash (git commit)** — Commit documentation changes (Step 6.2)

---

## Critical Workarounds Reminder

From the skill:

1. **Obsidian headings with inline styling fail on patch:** Index.md has headings like `## Systems *(added 2026-03-06)*`. Never use `obsidian_patch_content` on these. Always use `obsidian_append_content` instead.

2. **Notion requires fetching first:** Always call `notion-fetch` before attempting `notion-update-page`. Content shifts between sessions, and stale `selection_with_ellipsis` targets will fail.

3. **Selection uniqueness matters:** For Notion's `selection_with_ellipsis`, provide enough context (~10 chars from start + ellipsis + ~10 chars from end) to make the target unambiguous.

4. **Commit only after API updates:** Do Obsidian and Notion updates BEFORE the git commit. If an API call fails, fix it before committing, so the commit message remains truthful.

5. **Obsidian is MCP, not filesystem:** The vault files are served through the Obsidian MCP plugin. Never attempt to Read/Edit/Write vault files directly via filesystem tools. Always use obsidian_* tools.

---

## Expected Outcomes

After executing all tool calls in order:

1. **CLAUDE.md**
   - 8 new changelog rows appended to Recent Changes table
   - Phase 6G completion line added to Project Status
   - "Current phase" updated to Location Detail Panel complete
   - Engine stats: 70 modules, 10,750 lines, 1,051 tests
   - Content stats: 9 packages (location-content.ts added)

2. **Obsidian Vault**
   - New note: `Systems/Location Detail Panel.md` with full system documentation
   - Index.md updated with new link: `[[Location Detail Panel]]`

3. **Notion Backlog**
   - Phase 6G section marked ✅ Complete (2026-03-07)
   - All Phase 6G tasks checked [x]
   - Two new reference docs linked in Reference Documents section

4. **Git History**
   - One commit: "docs: update project status for Phase 6G completion"
   - CLAUDE.md changes staged and committed
   - Commit message includes Co-Authored-By footer

---

## Notes for Execution

- This plan assumes design docs (`2026-03-07-location-detail-design.md` and `2026-03-07-location-detail-implementation.md`) already exist in `Docs/plans/`. If they don't, the Notion update will fail when trying to reference them. Verify they exist before proceeding.
- The test count (24 tests across 3 test files) is distributed as: 8 tests in locationDetail.test.ts, 12 tests in LocationDetailPanel.test.tsx, and 4 tests in integration test file.
- Location-content.ts line count is estimated; verify actual line count before finalizing engine stats if precision is critical.
- All file paths are relative to the repo root except where absolute paths are explicitly specified in tool calls.
