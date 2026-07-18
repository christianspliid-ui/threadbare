# User Action Required

**Last updated:** 2026-07-18, 14:29 local (light refresh by the hourly `keep-work-flowing-cc` CC task; last full rebuild was the 2026-06-23 retro)
**Owner of items below:** Christian. Everyone else's blockers go in Linear or `Docs/impediments.md`.
**Refresh cadence:** The hourly `keep-work-flowing-cc` scheduled task keeps this current (prunes resolved items, adds newly-surfaced Christian-owned ones); the `retrospective` skill still does the deep periodic rebuild. This is the slow-moving standing-asks list — the fresh-this-hour view is [`Design/briefing.md`](briefing.md).

## How this works

The retrospective stopped being the right channel for "Christian, please flip one switch." Christian-owned asks were buried in retro prose, and nothing surfaced them between retros. This file replaces that pattern.

Read order: top to bottom is blast radius. The top items break canonical workflow invariants right now; the bottom items are operational debt with workarounds in place.

For each item:
- **Fix** = the literal command, click path, or line of config that resolves it.
- **What breaks** = the named system or invariant currently degraded.
- **Source** = `Docs/impediments.md` entry numbers + occurrence count, so the cost is visible.

When an item resolves: delete it from this file, mark the corresponding impediment as resolved in the dashboard regen, note the close in the next retro under "What shipped." No history retained here — `git log` + the retros are the audit trail.

---

## 1. Decide the Obsidian MCP path · RECURRING

**Status:** Open · ~60 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Formally accept that the vault skills fall back to direct filesystem writes when the MCP is unreachable, and stop carrying this item every retro. (The fallback already ships in the vault-log skill and requires `OBSIDIAN_VAULT_PATH`.)

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop, and the vault drifts from canonical state. Either path closes the issue; status quo is the worst option — we keep paying the queue+replay cost without resolving it.

---

## 2. Triage orphan uncommitted changes in working trees · WILL NOT SELF-HEAL

**Status:** Open · ~60 days · ~20 non-`.codesight` files uncommitted on the home tree as of 2026-07-18 14:29 (5 tracked, 15 untracked), which is also **15 commits behind** `origin/main` (mostly `Docs/plans/` drafts and `.intent-proposals/`; run `git fetch && git rebase origin/main` first, then triage). Note: the home tree's local `Design/briefing.md` and `Design/user-actions.md` also show as modified — those are stale local copies that will conflict on rebase; discard them (`git checkout -- Design/`) since origin/main carries the current versions.
**Source:** Impediment #59 + 2026-07-18 `keep-work-flowing-cc` freshness pings

**Fix.** Run `git status` on `main`; for each tracked-but-uncommitted file, attribute it to a Linear issue (commit with `Fixes THR-XX`) or `git checkout --` discard. Untracked files: same triage — `git add` + commit if intentional, `rm` if not.

**What breaks if not done.** This is the upstream cause of the dirty-worktree bounces (historically ~50% of automation slots wasted). [THR-277](https://linear.app/threadbare/issue/THR-277) makes pickup resilient *to* dirty state via worktree isolation, but it doesn't clean the state. Until the orphan changes are triaged, the dirty worktree stays dirty.

**Mitigated by:** [THR-277](https://linear.app/threadbare/issue/THR-277) — worktree isolation in pull-work routes pickup around dirty state while orphan triage is pending.

---

## Resolved this period

- **2026-07-18 — the 3 rescued plan docs landed on `origin/main`** (was item #1). PR #573 committed `Docs/plans/2026-07-17-pure-claude-code-migration.md`, its brainstorm companion, and the entity-visual-header plan (landed as `Docs/plans/2026-07-05-thr-637-entity-visual-header.md`). The six migration tickets that reference the spec can now find it on `main`; the detached tip stays parked as branch `rescue/2026-07-17-detached-plans` for the audit trail.
- **2026-06-23 — `LINEAR_API_KEY` set in the Codex automation environment** (was an earlier item; impediment #141, 17 recurrences). Confirmed by Christian same day the retro surfaced it. _Superseded 2026-06-23 by the full Codex-lane retirement (THR-486): there is now a single Opus executor and one `Ready for Dev` queue, so the Codex-specific unblock is moot. Kept for the audit trail; safe to prune at the next full retro rebuild._
- **2026-06-23 — GitHub Pro / branch protection resolved** (impediment #56). Branch protection is now active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). The "CI stays advisory because branch protection can't be enforced" concern is closed. To be removed on next retro day.
- **2026-07-18 — Linear-from-scheduled-context confirmed reliable** (three clean data points: 2026-06-23, and two `keep-work-flowing-cc` runs on 2026-07-18). The hedge is dropped — scheduled/autonomous CC sessions can trust the Linear MCP without caveating conclusions on it.

---

*This file is regenerated by the hourly `keep-work-flowing-cc` task from `Docs/impediments.md`, the Linear board, and any newly filed Christian-owned impediments; the `retrospective` skill does the deep periodic rebuild. Manual edits between refreshes are fine — they'll be preserved as long as the item is still open. To force a refresh, run `/retrospective` or ask a design session to rebuild user-actions.*
