# Documentation Update Plan: AVATAR_SIGHT_RANGE Constant Change

## Task Summary
Changed AVATAR_SIGHT_RANGE constant from 3 to 4 in `src/types/visibility.ts` and updated one test. This is a minor tweak affecting < 3 files, so per the skill, we run the **lightweight subset (Steps 1-2 only)** of the gamedocumenter checklist.

## Exact Tool Call Sequence

### Step 1: Update CLAUDE.md Changelog

**Tool:** `Edit` (normal filesystem file)
**File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`
**Action:** Append a row to the `### Recent Changes` table

**Current table ends around line 130 with:**
```
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
```

**Tool Call Details:**
- **Pattern:** Find the last row of the Recent Changes table and insert after it
- **old_string:** (the entire last row)
```
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
```
- **new_string:**
```
| 2026-03-06 | Repo: src/components/Game/ | Modified GameView.tsx — wired visibility, zoom, AvatarHUD, move mode, initial camera centering | Phase 6F Task 9: full integration |
| 2026-03-07 | Repo: src/types/ | Modified visibility.ts — AVATAR_SIGHT_RANGE constant: 3 → 4 | Quick fix: expanded avatar detection range for better discoverability |
```

**Expected outcome:** One new row appended to the changelog.

---

### Step 2: Update CLAUDE.md Project Status

**Tool:** `Edit` (normal filesystem file)
**File:** `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`
**Action:** Update three fields in the `## Project Status` section

#### 2a. Update Current Phase Line
**Current line (around line 180):**
```
- Current phase: **Playable map complete** — fog of war, avatar movement, zoom/pan all working; next up: culture content data implementation (`culture-content.ts`) or narrative context builder
```

**new_string:**
```
- Current phase: **Phase 6F+ (post-map tweaks)** — avatar sight range expanded to 4 (was 3) for better exploration pacing; ready for culture content data implementation (`culture-content.ts`) or narrative context builder
```

#### 2b. Update Engine Stats (if needed)
**Check:** No new files created, no new modules. One file modified, one test updated. Engine stats remain:
- ~67 modules
- ~10,500 lines
- ~1,027 tests

**No change needed to engine stats line.**

#### 2c. Update Content Stats (if needed)
**Check:** No content changes. Content stats remain unchanged.

**No change needed to content stats line.**

---

## Summary of Tool Calls (in order)

1. **Edit CLAUDE.md** → Append changelog row (date: 2026-03-07, where: Repo: src/types/, change: visibility.ts constant, why: quick fix for exploration range)

2. **Edit CLAUDE.md** → Update "Current phase" line to reflect the quick fix and current readiness

---

## Why Steps 3-6 Are Not Needed

Per the skill checklist:

> Run the lightweight subset (Steps 1-2 only) for:
> - Single bug fixes
> - Minor tweaks (< 3 files changed)

This change:
- ✅ Is a single tweak (one constant value)
- ✅ Affects < 3 files (visibility.ts + 1 test)
- ✅ Does not introduce new systems (no Obsidian vault notes needed)
- ✅ Does not change phase/task tracking (no Notion backlog update needed)
- ✅ Does not require a git commit (no repo-level code change; only internal constant tuning)

---

## Expected Outcome

After these two Edit tool calls:
1. CLAUDE.md changelog will have a new row documenting the change
2. CLAUDE.md "Current phase" will reflect the expanded sight range and readiness for next phase

Both changes are lightweight, non-destructive, and preserve project continuity. No Obsidian/Notion/git updates required for this scope.
