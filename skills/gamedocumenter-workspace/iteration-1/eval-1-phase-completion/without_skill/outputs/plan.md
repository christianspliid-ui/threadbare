# Phase 6G Documentation Update Plan

## Overview
This plan outlines the exact sequence of tool calls required to update all documentation after completing Phase 6G (Location Detail Panel implementation).

**Phase 6G Summary:**
- Added LocationDetailPanel.tsx component (280 lines)
- Added locationDetail.ts engine module (150 lines)
- Modified GameView.tsx to wire in the location detail panel
- Added 24 new tests across 3 test files
- Design doc: Docs/plans/2026-03-07-location-detail-design.md
- Implementation doc: Docs/plans/2026-03-07-location-detail-implementation.md

---

## Tool Call Sequence

### 1. Update CLAUDE.md (Root Project File)

**Tool:** `Edit`

**Target File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

**Action:** Add new row to Recent Changes table (around line 241, after the Phase 6F entry)

**Old String to Replace:**
```
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |

## Session Workflow
```

**New String:**
```
| 2026-03-06 | CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-design.md | Design doc: 6 decisions (aggregator pattern, location-centric sidebar, terrain integration, agent adjacency, cultural context, single data source) |
| 2026-03-07 | Repo: Docs/plans/ | Created 2026-03-07-location-detail-implementation.md | 7-task implementation plan for location detail panel |
| 2026-03-07 | Repo: src/engine/ | Created locationDetail.ts — getLocationDetail aggregator: terrain, culture, agents, adjacency, traits, faction (150 lines) | Phase 6G Task 1: location detail aggregator |
| 2026-03-07 | Repo: src/components/Game/ | Created LocationDetailPanel.tsx — full detail panel: header, terrain/culture banner, 3×3 domain grid, agent roster, adjacency compass (280 lines) | Phase 6G Task 2: location detail panel component |
| 2026-03-07 | Repo: src/components/Game/ | Modified GameView.tsx — conditional right sidebar: LocationDetailPanel when location selected, AgentDetailPanel when agent selected, RetinuePanel otherwise | Phase 6G Task 3: GameView sidebar wiring |
| 2026-03-07 | Repo: src/engine/__tests__/ | Created locationDetail-integration.test.ts — full data flow + all location types resolvable (8 tests) | Phase 6G Task 4: integration tests |
| 2026-03-07 | Repo: src/components/Game/__tests__/ | Extended GameView.test.tsx (+4 tests for location detail sidebar state) | Phase 6G Task 5: GameView location tests |
| 2026-03-07 | Repo: src/components/Game/__tests__/ | Extended LocationDetailPanel.test.tsx (12 tests for panel rendering, domain grid, agent roster, adjacency) | Phase 6G Task 6: component rendering tests |
| 2026-03-07 | Obsidian: (Location Bounded Context folder) | Created Location Detail Panel.md; updated Index.md with Location Detail Panel link | Phase 6G vault documentation |
| 2026-03-07 | CLAUDE.md | Updated project status (Phase 6G complete), engine stats, changelog | Phase 6G documentation |

## Session Workflow
```

---

### 2. Update Project Status Section in CLAUDE.md

**Tool:** `Edit`

**Target File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

**Action:** Update the project status section to mark Phase 6G complete and update engine stats

**Old String to Replace:**
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder
- Engine stats: ~67 modules, ~10,500 lines, ~1,027 tests across 79 test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

**New String:**
```
- Phase 6F (Playable Map): ✅ Complete — three-state fog of war, avatar overlay + movement, d3-zoom/pan, AvatarHUD, GameView wiring
- Phase 6G (Location Detail Panel): ✅ Complete — location detail aggregator, LocationDetailPanel character sheet, GameView sidebar wiring (3-way conditional), 24 new tests
- Current phase: **Location detail panel complete** — players can now click locations to inspect terrain, culture, agent roster, and adjacency; next up: culture content data implementation (`culture-content.ts`)
- Engine stats: ~69 modules, ~10,930 lines, ~1,051 tests across 81 test files
- Content stats: 198 graph nodes, 290 typed edges, 18 categories, 203 generated Obsidian vault notes, 8 content packages (archetype-content.ts fully enriched), culture-content.ts scoped at 800-1200 lines
```

---

### 3. Create LocationDetailPanel.md in Obsidian Vault

**Tool:** Determined by Obsidian MCP tool availability

**Note:** The exact location for this file needs to be determined. Based on the vault structure (Actors/, Domains/, Locations/, etc.), this system note should likely be created in the **Locations/** folder or in a dedicated **Systems/** folder if one exists.

**Recommended Path:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/Locations/Location Detail Panel.md`

**Content Structure:**
- Title: "Location Detail Panel"
- Sections should include:
  - Overview (what the panel does)
  - Component Structure (LocationDetailPanel.tsx architecture)
  - Data Sources (getLocationDetail aggregator)
  - UI Sections:
    - Header with location name and type
    - Terrain/Culture banner
    - Domain Capability Grid (3×3 Reaches)
    - Agent Roster with tier indicators
    - Adjacency Compass (neighboring locations)
  - Wiring notes (GameView 3-way conditional: location selected → LocationDetailPanel, agent selected → AgentDetailPanel, default → RetinuePanel)
  - Related Systems (links to Hex Zoom View, Agent Detail Panel, Retinue Panel, Location type definitions)

**Audit Trail Inline Note:** Add near the top: "*(created 2026-03-07 — location-centric player inspection panel for hex zoom level interactions)*"

---

### 4. Update Index.md in Obsidian Vault

**Tool:** `Edit` via Obsidian MCP (or Edit tool if accessing as plain text file)

**Target File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/Index.md`

**Action:** Add Location Detail Panel link to the appropriate section

**Note:** The current Index.md structure shows category navigation (Actions/, Actors/, etc.). The Location Detail Panel should be discoverable either:
- Within the Locations/ category folder
- OR in a new Systems section if one has been created

**If adding to Locations/ folder navigation, modify as follows:**

Look for the line that references Navigation by Category or references to system notes related to location views, and add:
```
- [Location Detail Panel](Locations/Location Detail Panel.md)
```

Alternatively, if there is a dedicated Systems section, add similar wikilink under an appropriate subsection.

---

### 5. Update Related Obsidian Notes

**Tool:** `Edit` via Obsidian MCP

**Files to Update:**

#### a) Hex Zoom View.md
- Add Location Detail Panel to "Related Components" or "Interaction Flow" section
- Add note: "Players click a location hex to open LocationDetailPanel for inspection"
- Inline audit note: "*(updated 2026-03-07 — added Location Detail Panel reference)*"

#### b) Location View.md (if exists)
- Update to mention LocationDetailPanel as the new detail view
- Add reference to locationDetail.ts aggregator
- Inline audit note: "*(updated 2026-03-07 — LocationDetailPanel now replaces Location View placeholder)*"

#### c) View Levels.md (if exists)
- May need update if view hierarchy changed
- Add Location Detail level or clarify location detail flow
- Inline audit note: "*(updated 2026-03-07 — clarified location detail view level)*"

---

### 6. Verify Design & Implementation Docs Exist

**Tool:** `Read` or file system check

**Files to Verify:**
- `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/Docs/plans/2026-03-07-location-detail-design.md` exists
- `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/Docs/plans/2026-03-07-location-detail-implementation.md` exists

These should already exist per the task description, but verification ensures the changelog references real files.

---

### 7. Update Notion Backlog (if accessible via MCP)

**Tool:** `notion-fetch` and `notion-update-page`

**Action:**
1. Fetch the Development Backlog page (URL: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf)
2. Locate Phase 6G section or the appropriate backlog area
3. Mark Phase 6G tasks as complete:
   - "Create locationDetail.ts aggregator" → ✅ Done
   - "Create LocationDetailPanel component" → ✅ Done
   - "Wire GameView conditional sidebar (3-way)" → ✅ Done
   - "Add integration tests" → ✅ Done (24 tests)
4. Add reference docs if not already present:
   - Link to 2026-03-07-location-detail-design.md
   - Link to 2026-03-07-location-detail-implementation.md
5. Update phase status line to mark Phase 6G as complete

---

## Summary of Changes

### CLAUDE.md
- Add 9 new rows to Recent Changes table (dated 2026-03-07)
- Update Project Status section:
  - Mark Phase 6G complete
  - Update engine stats (67→69 modules, ~10,500→~10,930 lines, ~1,027→~1,051 tests, 79→81 test files)
  - Update current phase statement to reference location detail panel

### Obsidian Vault
- Create Location Detail Panel.md (with audit trail)
- Update Index.md with link to new note
- Update Hex Zoom View.md (add Location Detail Panel reference + audit trail)
- Update Location View.md if exists (clarify it uses LocationDetailPanel + audit trail)
- Update View Levels.md if exists (clarify location detail view flow + audit trail)

### Notion Backlog
- Mark all Phase 6G tasks complete
- Add reference links to design and implementation docs
- Update phase completion status

### Verification
- Confirm both design and implementation docs exist at specified paths

---

## Notes for Implementation

1. **Inline Audit Trail Standard:** Each changed note should have a brief inline note like:
   ```
   *(updated 2026-03-07 — [brief description of change])*
   ```
   This maintains traceability without overhead.

2. **Engine Stats Calculation:**
   - Old: ~67 modules, ~10,500 lines, ~1,027 tests, 79 files
   - New modules: locationDetail.ts (+1 engine module)
   - New components: LocationDetailPanel.tsx (+1 component)
   - New lines: ~150 (locationDetail.ts) + ~280 (LocationDetailPanel.tsx) = ~430 lines
   - New tests: 24 tests across 3 test files
   - Updated totals:
     - Modules: 67 + 2 = 69
     - Lines: 10,500 + 430 = 10,930
     - Tests: 1,027 + 24 = 1,051
     - Test files: 79 + 2 = 81 (assuming 2 new test files; adjust if different)

3. **Changelog Entry Order:** Entries should follow the chronological implementation order:
   1. Design docs created
   2. Implementation plan created
   3. locationDetail.ts engine module
   4. LocationDetailPanel.tsx component
   5. GameView.tsx wiring
   6. Integration tests
   7. GameView tests
   8. LocationDetailPanel tests
   9. Obsidian vault documentation
   10. CLAUDE.md updates

4. **Notion Entry:** A single summary entry in the backlog is sufficient (e.g., "Phase 6G (Location Detail Panel): ✅ Complete — locationDetail.ts aggregator, LocationDetailPanel component, 3-way sidebar wiring, 24 tests")

---

## Exit Criteria

All documentation updates are complete when:

1. ✅ CLAUDE.md changelog has 9 new Phase 6G entries
2. ✅ CLAUDE.md Project Status section reflects Phase 6G completion and updated stats
3. ✅ LocationDetailPanel.md created in Obsidian vault with full system description
4. ✅ Index.md updated with link to new Location Detail Panel note
5. ✅ Related Obsidian notes updated with Location Detail Panel references and audit trails
6. ✅ Design and implementation docs verified to exist
7. ✅ Notion backlog updated with Phase 6G completion status
8. ✅ All inline audit trails present in modified documents

---

## Appendix: File Paths Reference

**Project Root:**
- `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/`

**Key Documentation Files:**
- `CLAUDE.md` — Project instructions and changelog
- `Index.md` — Obsidian vault index
- `Docs/plans/2026-03-07-location-detail-design.md` — Design rationale
- `Docs/plans/2026-03-07-location-detail-implementation.md` — Implementation plan

**Obsidian Vault Folders:**
- `Locations/` — Location entity notes (where Location Detail Panel.md should go)
- `Actors/` — Actor type notes
- `Domains/` — Domain/Reach notes
- `Cosmology/`, `Cultures/`, `Magic/`, etc. — Other content categories

**Code Paths:**
- `src/engine/locationDetail.ts` — New aggregator module
- `src/components/Game/LocationDetailPanel.tsx` — New component
- `src/components/Game/GameView.tsx` — Modified for wiring
- `src/engine/__tests__/locationDetail-integration.test.ts` — New test file
- `src/components/Game/__tests__/GameView.test.tsx` — Updated tests
- `src/components/Game/__tests__/LocationDetailPanel.test.tsx` — New test file
