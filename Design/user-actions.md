# User Action Required

**Last updated:** 2026-07-19, 15:28 local (light refresh by the hourly `keep-work-flowing-cc` CC task; last full rebuild was the 2026-06-23 retro)
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

## 0. Reinstall local dependencies — `npm run dev` / `npm test` are broken on the home tree · WILL NOT SELF-HEAL

**Status:** Open · **newly surfaced 2026-07-19 11:29** by the hourly `keep-work-flowing-cc` run; **re-verified still broken 2026-07-19 15:28** — fourth consecutive run (`node_modules/.bin` still absent entirely, while 276 top-level packages are present, confirming the packages are there but unlaunchable; `npm exec -- vite --version` still returns `'vite' is not recognized`).
**Source:** Discovered directly this run — the pre-commit `lint:plan-doc` hook failed with `'esbuild' is not recognized`, and the root cause turned out to be broader than the deps-free-worktree case already logged as impediment #186.

**Evidence.** `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator\node_modules` contains 276 top-level packages, but **`node_modules/.bin` does not exist at all** — the binary shims npm scripts rely on were never created (consistent with the known `esbuild` / `npm install` `spawn EPERM` failure mode, impediment #21). Probed and confirmed this run:

```
$ npm exec -- vite --version
'vite' is not recognized as an internal or external command
$ npx --no-install vitest --version
'vitest' is not recognized as an internal or external command
```

Consequence: **every** `npm run` script that shells out to a binary — `dev`, `test`, `build`, and the `lint:plan-doc` pre-commit step — fails in the home tree. CI is unaffected (it installs cleanly), which is why this stayed invisible.

**Fix — Christian, on the home machine, in the project folder:**
```
npm install
```
Let it run to completion. If it fails with `EPERM` on `esbuild`, retry once; if it still fails, that is impediment #21 recurring and worth logging rather than looping.

**Workaround in the meantime (agents only, not a substitute).** Which workaround works depends on where you are committing from:

- **From the home tree** (has `node_modules`): putting the platform binary on `PATH` is enough —
  ```
  export PATH="$PWD/node_modules/@esbuild/win32-x64:$PATH"
  ```
- **From a scratch worktree** (no `node_modules` at all): **the `export PATH` line above does not work** — verified failing 2026-07-19 13:10. On Windows, npm runs each script through `cmd.exe`, which does not inherit the bash-exported `PATH` in a usable form, so the hook still dies with `'esbuild' is not recognized`. What *does* work is giving the worktree its own shim directory, which npm prepends to `PATH` automatically:
  ```
  mkdir -p node_modules/.bin
  cp <home-tree>/node_modules/@esbuild/win32-x64/esbuild.exe node_modules/.bin/
  ```
  Both pre-commit hooks (`check:skill-sync`, `lint:plan-doc`) then run green.

**What breaks if not done.** No local dev server, no local test runs, no local production build — so the "run it in the browser and screenshot it" step in the Definition of Done cannot be satisfied from this tree, and the pre-commit lint step fails on every commit.

---

## 1. Land the last rescued plan doc onto `main` — near-resolved · WILL NOT SELF-HEAL

**Status:** Open (minor) · **largely resolved 2026-07-18 13:29.** The spec that actually mattered is now on `origin/main`: `Docs/plans/2026-07-17-pure-claude-code-migration.md` **and** its brainstorm companion are both landed (verified this run), so the six migration tickets that reference it can read it from `main`. Only **one** rescued doc is still stranded on the `rescue/2026-07-17-detached-plans` branch — `Docs/plans/2026-07-05-entity-visual-header.md` — and its feature (THR-637, Entity Visual Header) already **shipped** (PR #564), so the doc is now a historical artifact, not a live dependency. This item is a candidate to prune at the next full retro.
**Source:** 2026-06-23 retro + 2026-07-18 `keep-work-flowing-cc` freshness pings (retro E1); rescue verified complete 2026-07-18 11:25; migration spec confirmed on `origin/main` 2026-07-18 13:29

**Fix — a design session can do this; it is not a Christian-only task.**
```
git fetch
git checkout rescue/2026-07-17-detached-plans -- Docs/plans/2026-07-05-entity-visual-header.md
# commit onto a docs/* branch off current main, open a PR
```
Then triage the other uncommitted working-tree files (item #3).

**What breaks if not done.** Nothing live — the only remaining stranded doc backs an already-shipped feature. No data-loss risk (commits are branch-anchored), no active spec gap.

---

## 2. Decide the Obsidian MCP path · RECURRING

**Status:** Open · ~60 days · ~12 occurrences
**Source:** Impediments #66, #71, #75, #86

**Fix — pick one.**
- **Option A (auto-start):** Configure the Obsidian Local REST API plugin to start with the OS, so the MCP can reach it without Obsidian being open.
- **Option B (filesystem fallback):** Formally accept that the vault skills fall back to direct filesystem writes when the MCP is unreachable, and stop carrying this item every retro. (The fallback already ships in the vault-log skill and requires `OBSIDIAN_VAULT_PATH`.)

**What breaks if not done.** Vault appends from session activity (log.md, retro outputs, ingest results) silently queue or drop, and the vault drifts from canonical state. Either path closes the issue; status quo is the worst option — we keep paying the queue+replay cost without resolving it.

---

## 3. Triage orphan uncommitted changes in working trees · WILL NOT SELF-HEAL

**Status:** Open · ~60 days · **~85 non-`.codesight` files uncommitted** on the home tree as of 2026-07-19 15:28. **The tree is not on `main` — it is in a detached-HEAD state**, parked on `013c1044` (2026-07-18 evening), **69 commits behind** `origin/main` (64 at 14:30, 60 at 13:29, 58 at 11:29 — climbing roughly one per hourly briefing merge; alarm threshold is 10). It is **zero commits ahead**, so nothing unique lives on the detached snapshot and re-attaching risks no loss. The local `main` branch itself is healthy — the working copy simply is not pointed at it. It stays behind because it is too dirty for the hourly auto-sync to fast-forward, so it slips further each cycle until the dirt is cleared.

**Triage resolved 2026-07-19 15:28 — the pile is now split into "safe to discard" and "must keep".** Earlier revisions of this item called for a careful file-by-file pass without saying which files were actually at risk. That pass has now been done:

- **Tracked edits (~70 files) — safe to discard.** `src/engine/army*`, `battle*`, Codex/AscendantBar/GameView/DebugTab component edits, plus staged plan-doc and script *deletions*. Verified: `HEAD` is an ancestor of `origin/main` (no unique commits anywhere on the snapshot), and the staged deletions target files that are **present and healthy on `origin/main`** (spot-checked `Docs/plans/2026-07-17-pure-claude-code-migration.md`, `Docs/canon/systems-inventory.md`, `Docs/plans/2026-07-05-thr-637-entity-visual-header.md`). These are stale local echoes of work that already shipped cleanly (the TB-073 war system and the orphaned-card inspector both merged).
- **Untracked files (15) — NOT on `origin/main`; do not blanket-clean.** `Docs/judge-metrics/2026-W29.md`, nine `Docs/plans/.intent-proposals/*.md`, and five `Docs/plans/2026-07-04|05-*-brainstorm.md` / exploration docs. Each was checked against `origin/main` individually and none exist there. A `git clean -fd` destroys them. They need their own pass: keep and commit onto a `docs/*` branch if still wanted, delete if superseded.

**Source:** Impediment #59 + 2026-07-18/19 `keep-work-flowing-cc` freshness pings; safe/unsafe split established 2026-07-19 15:28

**Fix.** Because the tracked pile is now confirmed discardable, the re-attach no longer has to wait on triage — and **the untracked docs survive these commands**, so this is safe to run before deciding their fate:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git fetch origin
git switch -f main
git reset --hard origin/main
```

Then handle the 15 untracked docs separately (`git status --porcelain | grep '^??'` to list them).

**Command history — two earlier published fixes are wrong, do not use them.** `git fetch && git rebase origin/main` does not work from a detached HEAD. `git switch main && git pull` (published 2026-07-19 14:30) will refuse or drag the dirty tracked edits along at this volume; `switch -f` + `reset --hard` is the working form.

**What breaks if not done.** This is the upstream cause of the Codex dirty-worktree bounces (~50% of automation slots historically wasted). [THR-277](https://linear.app/threadbare/issue/THR-277) makes pickup resilient *to* dirty state via worktree isolation, but it doesn't clean the state. Until the orphan changes are triaged, the dirty worktree stays dirty.

**Mitigated by:** [THR-277](https://linear.app/threadbare/issue/THR-277) — worktree isolation in pull-work routes pickup around dirty state while orphan triage is pending. **Shipped 2026-07-19:** [THR-660](https://linear.app/threadbare/issue/THR-660) (Done, PRs #616/#617) untracked the gitignored-but-committed `.codesight/` files that were the largest chronic contributor to the dirty tree. This stops the *recurring* per-session re-dirtying, so once this one-time ~85-file triage is done and the tree pulls THR-660, the deterministic `ThreadbareRepoAutoSync` task can fast-forward the home tree each hour instead of skipping on dirt. The one-time triage below is still required — THR-660 prevents the tree from re-dirtying itself, but does not clear the edits already sitting there.

---

## Resolved this period

- **2026-06-23 — `LINEAR_API_KEY` set in the Codex automation environment** (was item #1; impediment #141, 17 recurrences). Confirmed by Christian same day the retro surfaced it. _Superseded 2026-06-23 by the full Codex-lane retirement (THR-486): there is now a single Opus executor and one `Ready for Dev` queue, so the Codex-specific unblock is moot. Kept for the audit trail; safe to prune at the next full retro rebuild._
- **2026-06-23 — GitHub Pro / branch protection resolved** (was item #4 in the prior seed; impediment #56). Branch protection is now active on `main` with `Test · Typecheck · Build` as a required status check (THR-282 shipped 2026-04-30). The "CI stays advisory because branch protection can't be enforced" concern is closed. To be removed on next retro day.
- **2026-07-18 — Linear-from-scheduled-context confirmed reliable** (was item #4; three clean data points now: 2026-06-23, and two `keep-work-flowing-cc` runs on 2026-07-18). The hedge is dropped — scheduled/autonomous CC sessions can trust the Linear MCP without caveating conclusions on it.

---

*This file is regenerated by Cowork on retro day from `Docs/impediments.md`, the active retro, and any newly filed Christian-owned impediments. Manual edits between retro days are fine — they'll be preserved as long as the item is still open. To force a refresh between retros, run `/retrospective` or ask Cowork directly: "rebuild user-actions."*
