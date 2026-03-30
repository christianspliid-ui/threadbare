# DOC-01 Source-of-Truth Reset — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split `Docs/project-status.md` into a thin now/next/later orientation file and an append-only completed-work archive, then align all references across CLAUDE.md, gamedocumenter, and documentation-ownership.md.

**Architecture:** File migration + reference update across 5 files. No code changes. Verification is line-count and content checks.

**Design doc:** `Docs/plans/2026-03-12-doc-01-project-status-split-design.md`

---

### Task 1: Create `Docs/project-history.md`

**Files:**
- Create: `Docs/project-history.md`
- Read: `Docs/project-status.md` (source of content)

**Step 1: Read the current project-status.md in full**

Run: `cat -n Docs/project-status.md`

Confirm it is entirely completed phases (all `✅ Complete` entries).

**Step 2: Create project-history.md with the existing content**

Create `Docs/project-history.md` with this structure:

```markdown
# Project History

> Append-only archive of completed milestones. Added 2026-03-12 as part of DOC-01 — split from project-status.md.
> Consulted during troubleshooting and reflection. For current focus, see: Docs/project-status.md

[paste entire existing content of project-status.md verbatim below this header, preserving all lines]
```

**Step 3: Verify**

Run: `wc -l Docs/project-history.md`

Expected: ≥ 65 lines (64 original + header).

Run: `grep "✅" Docs/project-history.md | wc -l`

Expected: same count as `grep "✅" Docs/project-status.md | wc -l` (should be ~38).

**Step 4: Commit**

```bash
git add Docs/project-history.md
git commit -m "docs: create project-history.md as append-only completed milestone archive"
```

---

### Task 2: Rewrite `Docs/project-status.md` as thin now/next/later

**Files:**
- Modify: `Docs/project-status.md`

**Step 1: Replace the entire content**

Write the following (adjust current focus and up next to match actual state at time of execution):

```markdown
# Project Status

> Updated 2026-03-12. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
PROD-01 Vertical Slice Contract — define the current player loop, in-scope systems, out-of-scope systems, and next milestone success criteria.

## Up Next
STRUCT-01 Repo Boundary Cleanup — move loose screenshots, stale markdown, and temp artifacts from repo root into proper locations.

## Full Backlog
Notion: https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf
Remediation plan: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

## Completed Work
See: Docs/project-history.md
```

**Step 2: Verify line count**

Run: `wc -l Docs/project-status.md`

Expected: ≤ 20 lines.

**Step 3: Commit**

```bash
git add Docs/project-status.md
git commit -m "docs: rewrite project-status.md as thin now/next/later orientation file"
```

---

### Task 3: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Find the current reference**

Run: `grep -n "project-status\|project.status" CLAUDE.md`

Expected: two lines — one in the gamedocumenter workflow note (line ~86), one as a key link (line ~110).

**Step 2: Update the Project Status section**

Find this line (around line 110):
```
Full status: **`Docs/project-status.md`**
```

Replace with:
```
Current focus: **`Docs/project-status.md`** · Completed milestones: **`Docs/project-history.md`**
```

**Step 3: Update the gamedocumenter workflow note**

Find this line (around line 86):
```
5. After completing work, **use the `gamedocumenter` skill** for documentation updates (Notion, Obsidian, changelog, project-status, backlogs). Non-negotiable — same session, not "later."
```

Replace `project-status` with `project-status/project-history`:
```
5. After completing work, **use the `gamedocumenter` skill** for documentation updates (Notion, Obsidian, changelog, project-status/project-history, backlogs). Non-negotiable — same session, not "later."
```

**Step 4: Verify**

Run: `grep -n "project-status\|project-history" CLAUDE.md`

Expected: both files mentioned.

**Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md references for project-status/project-history split"
```

---

### Task 4: Update `gamedocumenter` skill

**Files:**
- Modify: `.skills/gamedocumenter/SKILL.md`

**Step 1: Read the current step 2**

Run: `grep -A 6 "### 2\. Project Status" .skills/gamedocumenter/SKILL.md`

**Step 2: Replace step 2 with split instructions**

Find:
```markdown
### 2. Project Status (`Docs/project-status.md`)

- Update the relevant phase/section bullet
- Add new phase bullets when a milestone is reached
- Update line counts, test counts, node/edge counts if they changed significantly
```

Replace with:
```markdown
### 2. Project Status & History

**On milestone completion → append to `Docs/project-history.md`:**
- Add one bullet at the bottom: `- Phase/feature name: ✅ Complete (YYYY-MM-DD) — one-line summary. Key files: X, Y. ~N new tests.`
- Never edit existing entries — append only.

**When starting a new focus area → update `Docs/project-status.md`:**
- Set `## Current Focus` to the new work item
- Set `## Up Next` to what follows
- Keep the file ≤ 20 lines total
```

**Step 3: Update the skill description line (frontmatter)**

Find:
```
description: Post-implementation documentation updates — Notion backlogs, Obsidian vault, changelog, project-status, and Content Creator Cheat Sheet.
```

Replace:
```
description: Post-implementation documentation updates — Notion backlogs, Obsidian vault, changelog, project-status/project-history, and Content Creator Cheat Sheet.
```

**Step 4: Verify**

Run: `grep -A 12 "### 2\." .skills/gamedocumenter/SKILL.md`

Expected: new split instructions visible with both files named.

**Step 5: Commit**

```bash
git add .skills/gamedocumenter/SKILL.md
git commit -m "docs: update gamedocumenter skill to distinguish history append vs status update"
```

---

### Task 5: Update `Docs/documentation-ownership.md`

**Files:**
- Modify: `Docs/documentation-ownership.md`

**Step 1: Find references to project-status.md**

Run: `grep -n "project-status" Docs/documentation-ownership.md`

Expected: two lines — one in duplication rules, one in the quick-reference table.

**Step 2: Update the duplication rule**

Find:
```
- **Phase/sprint status** → Notion only. `project-status.md` may summarize phases as completed/in-progress but does not describe task detail.
```

Replace with:
```
- **Phase/sprint status** → Notion only. `project-status.md` holds current focus only (≤ 20 lines). `project-history.md` holds the append-only completed milestone log.
```

**Step 3: Update the quick-reference table**

Find:
```
- `project-status.md` — phase completion summary (completed/in-progress, no task detail)
```

Replace with:
```
- `project-status.md` — current focus + next priority (≤ 20 lines, orientation only)
- `project-history.md` — append-only completed milestone archive (troubleshooting reference)
```

**Step 4: Verify**

Run: `grep -n "project-status\|project-history" Docs/documentation-ownership.md`

Expected: both files mentioned in correct contexts.

**Step 5: Commit**

```bash
git add Docs/documentation-ownership.md
git commit -m "docs: update documentation-ownership.md for project-status/project-history split"
```

---

### Task 6: Update Notion remediation plan

Mark DOC-01 as complete on the Notion remediation plan page.

**Step 1: Fetch the remediation plan page**

Fetch: https://www.notion.so/2026-03-12-Remediation-Plan-Prioritized-Audit-Follow-up-3212b241dfb08136a6b6c58670a764b9

**Step 2: Add completion note**

Add an inline note to the DOC-01 section:
```
> ✅ Complete 2026-03-12 — project-status.md rewritten as thin orientation file; project-history.md created as append-only archive; CLAUDE.md, gamedocumenter, documentation-ownership.md all updated.
```

---

### Task 7: Append to `Docs/changelog.md`

**Files:**
- Modify: `Docs/changelog.md`

**Step 1: Append four rows**

```
| 2026-03-12 | Docs/project-history.md | Created as append-only archive of completed milestones; seeded with content from project-status.md | DOC-01 source-of-truth reset |
| 2026-03-12 | Docs/project-status.md | Rewritten as thin now/next/later orientation file (≤ 20 lines) | DOC-01 source-of-truth reset |
| 2026-03-12 | CLAUDE.md | Updated project status references to reflect two-file split | DOC-01 source-of-truth reset |
| 2026-03-12 | .skills/gamedocumenter/SKILL.md | Updated step 2 to distinguish append-to-history vs update-status | DOC-01 source-of-truth reset |
| 2026-03-12 | Docs/documentation-ownership.md | Updated references to reflect two-file split | DOC-01 source-of-truth reset |
```

**Step 2: Commit**

```bash
git add Docs/changelog.md
git commit -m "docs: changelog entries for DOC-01 project-status split"
```

---

## Verification Checklist

After all tasks complete, confirm:

- [ ] `wc -l Docs/project-status.md` → ≤ 20 lines
- [ ] `grep "✅" Docs/project-history.md | wc -l` → ≥ 38 (all original entries present)
- [ ] `grep "project-history" CLAUDE.md` → at least one match
- [ ] `grep "project-history" .skills/gamedocumenter/SKILL.md` → at least one match
- [ ] `grep "project-history" Docs/documentation-ownership.md` → at least one match
- [ ] Notion DOC-01 item has completion note
