# Documentation Update Plan: AVATAR_SIGHT_RANGE Change

## Summary
User has changed AVATAR_SIGHT_RANGE constant from 3 to 4 in `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/src/types/visibility.ts` and updated one test. This plan outlines all tool calls needed to update documentation across three layers (CLAUDE.md changelog, Obsidian vault, Notion backlog).

**Date of change:** 2026-03-07

---

## Tool Calls Sequence

### Layer 1: CLAUDE.md Changelog Update

**Tool:** Edit

**Purpose:** Add a one-line entry to the "Recent Changes" table documenting the constant tuning change.

**Parameters:**
```
file_path: "/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md"

old_string: "| 2026-03-06 | Repo: src/engine/ | Created avatarMove.ts — moveAvatarToHex with transient location creation (3 tests) | Phase 6F Task 8: avatar movement |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |"

new_string: "| 2026-03-06 | Repo: src/engine/ | Created avatarMove.ts — moveAvatarToHex with transient location creation (3 tests) | Phase 6F Task 8: avatar movement |
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| CLAUDE.md | Updated project status (Phase 6F complete), engine stats, changelog | Phase 6F documentation |
| 2026-03-07 | Repo: src/types/visibility.ts | Changed AVATAR_SIGHT_RANGE from 3 to 4 | Avatar sight range tuning: increased player awareness in fog-of-war view |"
```

**Rationale:** Follows the Change Audit Trail format established in the CLAUDE.md documentation strategy. Lightweight entry includes date, location, what changed, and brief rationale.

---

### Layer 2: Obsidian Vault Update

**Tool:** obsidian_patch_content

**Purpose:** Update the Obsidian vault note documenting the fog-of-war visibility system to reflect the new constant value.

**Parameters:**
```
filepath: "Systems/Fog of War.md"
(If "Systems/Fog of War.md" doesn't exist, create it first using obsidian_append_content)

operation: "replace"
target_type: "heading"
target: "Constants"
content: "### Constants

| Constant | Value | Purpose |
|----------|-------|---------|
| `AVATAR_SIGHT_RANGE` | 4 | Player avatar's sight range in hexes for fog-of-war visibility calculation (updated 2026-03-07 — tuning) |
| `AGENT_SIGHT_RANGE` | 1 | NPC agent sight range in hexes |
| `SCRY_SIGHT_RANGE` | 1 | Scry ability sight range in hexes |
| `SCRY_ESSENCE_PER_TICK` | 2 | Essence cost per scry tick |
| `MOVE_ESSENCE_COST` | 0 | Essence cost for avatar movement (free in prototype) |"
```

**Alternative if "Constants" section doesn't exist:** Use `target_type: "heading"` and `target: "## Fog of War System"` to append the constants block.

**Rationale:** The Obsidian vault documents "what the system is" — specs and constants. The AVATAR_SIGHT_RANGE is a tunable constant that directly affects gameplay mechanics, so it must be tracked in the vault with the date of change for future designers to understand the tuning history.

---

### Layer 3: Notion Backlog Update

**Tool:** notion_fetch + notion_update_page

**Step A - Fetch current state:**
```
id: "https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf"
```

**Purpose:** Retrieve the current backlog page to identify where to add or update the tuning note.

**Step B - Update backlog:**

After fetching, locate the **Phase 6F** or **Phase 6F (Playable Map)** section and update or add a note:

```
Tool: notion_update_page

page_id: "3182b241dfb081b9af78c279eef405cf" (or the actual page ID from fetch response)

command: "replace_content_range"

selection_with_ellipsis: "Phase 6F (Playal...complete)"
(Adjust to match exact text in page)

new_str: "Phase 6F (Playable Map) — ✅ Complete
- Fog of war: three-state visibility (unexplored/remembered/visible)
- Avatar overlay + movement: d3-zoom/pan enabled
- Avatar sight range tuned to 4 hexes (2026-03-07)"
```

**Alternative approach:** If Notion doesn't track implementation details, add an inline comment/dated note:
```
new_str: "Phase 6F (Playable Map) — ✅ Complete
_(Updated 2026-03-07 — tuned AVATAR_SIGHT_RANGE from 3→4 for better player awareness)_"
```

**Rationale:** The Notion backlog says "what to build next" and tracks progress. Tuning notes help track why decisions were made during implementation. A dated inline note provides light traceability without cluttering the backlog with technical constants.

---

## Execution Notes

1. **No code changes needed** — the user has already updated `src/types/visibility.ts` and one test.

2. **Documentation-only updates** — all changes are to non-code documentation layers:
   - CLAUDE.md (changelog table)
   - Obsidian vault note (system specs)
   - Notion backlog (progress tracking)

3. **Traceability pattern** — all three updates follow the established pattern:
   - Include today's date (2026-03-07)
   - State what changed (constant value, range)
   - Provide brief rationale (tuning motivation)

4. **If Obsidian note doesn't exist yet:**
   - Run `obsidian_append_content` first to create `Systems/Fog of War.md`
   - Then update via `obsidian_patch_content`

5. **Test suite impact:**
   - The user mentioned updating "one test" — no additional test updates needed
   - Changelog entry in CLAUDE.md should note the test was already updated by the user

---

## Three-Layer Documentation Consistency

This plan ensures:
- ✅ **CLAUDE.md:** Single source for what changed and when (audit trail)
- ✅ **Obsidian vault:** Current constant values and system behavior (specs reference)
- ✅ **Notion:** Implementation phase status and tuning decisions (project tracking)

No duplicate content — each layer has a distinct purpose and audience.
