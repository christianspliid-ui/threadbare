# Documentation Update Plan — Complete Index

**Task:** Update all three documentation layers after completing culture content data and narrative context builder tasks.

**Status:** Plan complete (dry-run, no changes executed)

**Date Created:** 2026-03-07

**Total Files:** 6 documentation files (1,147 lines)

---

## Quick Navigation

### 1. **README.md** — Start here
Overview of the entire plan, files description, and quick reference for tools used.
- Best for: Understanding what needs to happen
- Read time: 5 minutes
- Includes: File guide, workarounds, execution flow diagram

### 2. **summary.md** — Executive summary
High-level view of the changes, tools, and validation checklist.
- Best for: Quick reference or explaining to others
- Read time: 3 minutes
- Includes: By-layer changes, stats, checklist

### 3. **plan.md** — Detailed implementation guide
Step-by-step narrative for all 6 documentation update steps with exact content strings.
- Best for: Understanding "what" and "why" for each change
- Read time: 15 minutes
- Includes: All 6 steps, content blocks, success criteria

### 4. **tool-calls-detailed.md** — Copy-paste ready parameters
Exact JSON parameters for all 13 tool calls (ready to execute).
- Best for: Actual execution of the plan
- Read time: 10 minutes
- Includes: 13 complete tool call blocks with all parameters

### 5. **EXECUTION-CHECKLIST.md** — Step-by-step tracker
Comprehensive checklist for executing and validating all 13 tool calls.
- Best for: Tracking progress during execution
- Read time: 20 minutes
- Includes: Pre-checks, per-tool verification, post-execution validation, issue resolution

### 6. **INDEX.md** — This file
Navigation guide and quick reference for all 5 files.

---

## Content Summary

### Tasks Being Documented

| Task | File | Lines | Tests | Phase |
|------|------|-------|-------|-------|
| Culture Content Data | `src/data/culture-content.ts` | 950 | 45 | Content Strategy & Architecture |
| Narrative Context Builder | `src/engine/narrativeContext.ts` | 200 | 12 | Content Strategy & Architecture |
| **Total** | 2 files | 1,150 | 57 | Phase completion |

### Documentation Layers Being Updated

| Layer | Tool | Files | Operations |
|-------|------|-------|-----------|
| **CLAUDE.md** (changelog + status) | Edit | 1 | 5 (1 append, 4 replace) |
| **Obsidian vault** (system notes + index) | MCP | 3 | 4 (2 append new, 1 read, 1 append) |
| **Notion backlog** (phase tracking) | API | 1 | 2 (1 replace section, 1 insert refs) |
| **Git** (commit changes) | Bash | 1 | 1 (add + commit) |

### Project Stats Updated

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Engine modules | ~67 | ~69 | +2 |
| Engine lines | ~10,500 | ~10,850 | +350 |
| Engine tests | ~1,027 | ~1,084 | +57 |
| Test files | 79 | 81 | +2 |
| Content packages | 8 | 9 | +1 (culture-content.ts) |

---

## How to Use These Files

### Scenario A: "I need to understand what's happening"
1. Read **README.md** (5 min) — overview
2. Read **summary.md** (3 min) — executive summary
3. Skim **plan.md** (5 min) — see narrative flow
Total: ~13 minutes

### Scenario B: "I'm ready to execute the plan"
1. Read **EXECUTION-CHECKLIST.md** — Pre-execution section (5 min)
2. Open **tool-calls-detailed.md** — Tool 1
3. Read each tool section and execute in order
4. Check off EXECUTION-CHECKLIST.md as you go
5. Run validation section at end
Total: ~45 minutes (including execution)

### Scenario C: "Something went wrong, help"
1. Open **EXECUTION-CHECKLIST.md** — "Common Issues & Resolutions" section
2. Find your error type
3. Follow resolution steps
4. Return to plan at appropriate step

### Scenario D: "I want to review before executing"
1. Read **plan.md** thoroughly (understand all changes)
2. Read **tool-calls-detailed.md** (verify exact parameters)
3. Review **summary.md** validation checklist
4. When confident, proceed with EXECUTION-CHECKLIST.md

---

## Key API Workarounds Implemented

### Workaround #1: Obsidian Patch Failures
❌ **Problem:** `obsidian_patch_content` on Index.md headings with inline dates fails consistently
✅ **Solution:** Use `obsidian_append_content` to add new content at end of file

**Where used:** Index.md update (Tool 9)

### Workaround #2: Notion Selection Staling
❌ **Problem:** `selection_with_ellipsis` values become stale between sessions
✅ **Solution:** Always fetch current page (Tool 10) before determining selection values for Tools 11-12

**Where used:** Notion backlog updates (Tools 11-12)

### Workaround #3: Filesystem-First Safety
✅ **Pattern:** Update CLAUDE.md via filesystem (Edit tool) before API calls
✅ **Benefit:** If APIs fail, changelog and status are already updated locally

**Where used:** All CLAUDE.md updates happen first (Tools 1-5)

---

## Execution Dependencies

```
Tier 1 (Independent)
├── Tool 1: Edit CLAUDE.md — add changelog rows
├── Tool 2: Edit CLAUDE.md — update phase status line
├── Tool 3: Edit CLAUDE.md — update current phase
├── Tool 4: Edit CLAUDE.md — update engine stats
├── Tool 5: Edit CLAUDE.md — update content stats
├── Tool 6: Obsidian append — Culture Content Data.md
└── Tool 7: Obsidian append — Narrative Context Pipeline.md

Tier 2 (Depends on Tier 1)
├── Tool 8: Obsidian read — Index.md
└── Tool 10: Notion fetch — Backlog

Tier 3 (Depends on Tier 2)
├── Tool 9: Obsidian append — Index.md (depends on Tool 8)
├── Tool 11: Notion replace — Content Strategy (depends on Tool 10)
└── Tool 12: Notion insert — Reference docs (depends on Tool 10)

Tier 4 (Depends on all above)
└── Tool 13: Bash commit — Git (depends on Tools 1-5)
```

**Execution order:** 1-5, then 6-7 (parallel), then 8-10 (8 depends on 8, 10 independent), then 9/11/12 (parallel, both depend on prerequisites), then 13.

---

## Files Location

All files are in:
```
/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/
  skills/gamedocumenter-workspace/
    iteration-1/eval-3-multi-task/
      with_skill/outputs/
        ├── INDEX.md (this file)
        ├── README.md
        ├── summary.md
        ├── plan.md
        ├── tool-calls-detailed.md
        └── EXECUTION-CHECKLIST.md
```

---

## Validation Checklist (Quick Version)

After execution completes:

- [ ] CLAUDE.md has 2 new changelog rows for 2026-03-07
- [ ] CLAUDE.md Project Status shows Culture & Narrative Context ✅ Complete
- [ ] CLAUDE.md engine stats: ~69 modules, ~10,850 lines, ~1,084 tests
- [ ] Obsidian has Culture Content Data.md system note
- [ ] Obsidian has Narrative Context Pipeline.md system note (or updated)
- [ ] Obsidian Index.md has new section with both new system links
- [ ] Notion backlog Content Strategy section marked ✅ Complete (2026-03-07)
- [ ] Notion backlog has reference doc links for both new design docs
- [ ] Git shows new commit with correct message and Co-Authored-By footer

**Full validation:** See EXECUTION-CHECKLIST.md "Post-Execution Validation" section

---

## Related Documents

**Skill Definition:**
- `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/skills/gamedocumenter/SKILL.md`

**Project Instructions:**
- `/sessions/gracious-elegant-planck/mnt/TheFantasyWorldSimulator/CLAUDE.md`

**Design Docs (assumed to exist):**
- `Docs/plans/2026-03-07-culture-content-design.md`
- `Docs/plans/2026-03-07-narrative-context-design.md`

**Backlog:**
- https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf

---

## Notes

- **This is a dry-run plan** — no tool calls have been executed
- **All parameters are documented** — ready for execution when needed
- **No files have been modified** — plan is non-destructive until execution
- **Generated without executing any tools** — safe to review and validate first
- **Follows gamedocumenter skill exactly** — all 6 steps, all workarounds included

---

## Support

If you need to:

- **Understand a tool call:** See `tool-calls-detailed.md` for exact JSON parameters
- **Track progress:** Use `EXECUTION-CHECKLIST.md` to check off each step
- **Debug an issue:** See `EXECUTION-CHECKLIST.md` "Common Issues & Resolutions"
- **See the big picture:** Read `README.md` or `summary.md`
- **Review detailed narrative:** Read `plan.md`

---

**Plan Status:** Ready for execution
**Last Updated:** 2026-03-07 00:13 UTC
**Execution Date:** [To be filled in when executed]
