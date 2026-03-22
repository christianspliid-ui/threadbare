# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.

---

## 2026-03-22: Documentation cleanup + Notion migration

**Context:** Cowork assessed full project state. Found three issues: (1) Obsidian Build Status frozen since March 5, (2) Notion backlog stale since March 18, (3) documentation-ownership.md out of date. User decided to deprecate Notion entirely and move all tracking to repo markdown.

**What Cowork already did (via MCP + filesystem):**
- Deprecated Obsidian `Build Status` note (added callout, updated Index.md link)
- Archived Notion backlog (added deprecation notice to page)
- Created `.planning/BACKLOG.md` with all pending items migrated from Notion
- Updated `Docs/documentation-ownership.md` — rewrote for three surfaces (Obsidian, Repo, Paper), removed Notion as active surface
- Updated `CLAUDE.md` — replaced all Notion references with `.planning/BACKLOG.md` and `.planning/ROADMAP.md`
- Updated `Docs/cowork-ways-of-working.md` — added handover protocol, updated role description, removed Notion references
- Updated `gamedocumenter` skill — replaced Step 5 (Notion) with BACKLOG.md workflow, updated tool reference table, removed Notion error docs
- Updated `retrospective` skill — replaced Notion backlog reference with `.planning/BACKLOG.md`

**Action for Claude Code:**
- [ ] Commit all documentation changes in one commit (see files list below)
- [ ] Verify no other files reference Notion backlog URL (`https://www.notion.so/Development-Backlog-3182b241dfb081b9af78c279eef405cf`) — clean up any stragglers
- [ ] Update gamedocumenter eval cases (`.claude/skills/gamedocumenter-workspace/evals/evals.json`) — eval 1 and 3 reference Notion updates that no longer apply
- [ ] Delete stale `state-of-game-design-SKILL.md` at repo root — it's a copy of `.claude/skills/state-of-game-design/SKILL.md` with outdated Notion URLs
- [ ] Clean up stale skill directories: `skills/` (root) and `.skills/` (root) are old copies of `.claude/skills/` — they still have Notion URLs. Canonical skills are in `.claude/skills/`. Delete the stale dirs if they're not git-tracked for a reason, or consolidate.
- [ ] Clean up stale worktrees in `.worktrees/` and `.claude/worktrees/` — these contain old branch checkouts with outdated files

**Files changed by Cowork:**
- `.planning/BACKLOG.md` (new)
- `.planning/HANDOVER.md` (new — this file)
- `Docs/documentation-ownership.md` (rewritten)
- `Docs/cowork-ways-of-working.md` (rewritten)
- `CLAUDE.md` (5 edits: doc strategy table, key links, definition of done, session workflow, project status)
- `.claude/skills/gamedocumenter/SKILL.md` (Step 5 replaced, tool table updated, common mistakes updated)
- `.claude/skills/retrospective/SKILL.md` (Notion reference replaced)

---

## 2026-03-22: Skill improvements for Claude Code

**Context:** Cowork audited all 11 project skills against actual development workflow. Found gaps and stale content.

**Action for Claude Code:**

### Merge frontend-ui skills (quick)
- [ ] The folder-based `.claude/skills/frontend-ui/SKILL.md` (59 lines, generic) and the loose `.claude/skills/frontend-ui.md` (references `Docs/design-system/INDEX.md` with specific loading instructions) should be merged. The loose file has better content — fold its design-system loading instructions into the folder-based SKILL.md, then delete the loose file.

### Create hexmap-renderer skill (medium)
- [ ] Create `.claude/skills/hexmap-renderer/SKILL.md` capturing Three.js patterns and decisions from the Hex Map V2 work. Source material: `.planning/STATE.md` "Decisions" section (coordinate mapping, winding order, quad strips, resize handling, zoom math, province seeding, etc.) + `.planning/phases/` plan docs. This will prevent rediscovering these patterns in Phases 4-8.

### Write evals for high-use skills (when time permits)
- [ ] `state-of-game-design` — 3 eval cases testing whether the skill leads to correct cosmology/reaches/spheres usage
- [ ] `engine-architecture` — 3 eval cases testing trace emission, PRNG usage, fail-soft patterns

---

## Completed

*Claude Code moves entries here after acting on them.*
