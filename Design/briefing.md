# Briefing

**Generated:** 2026-07-24 02:10 local (2026-07-24 00:10 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing, unchanged from the last brief — the same four clicks.**

**1. All four old Cowork automations can be switched off now.** The replacements are live and producing real runs, and this brief was written by one of them. In the Cowork app, disable: `keep-work-flowing`, `daily-backlog-grooming`, `weekly-workflow-retro`, `weekly-project-hygiene`. Leave `weekly-invoice-check` alone — it's personal, not Threadbare. Until you flip them, four jobs run twice; nothing breaks. Details: [`user-actions.md`](user-actions.md) item 1.

## Queue

**Healthy — 2 ready, executor mid-flight, nothing blocked, nothing stale.**

- **In development: party formation & group mechanics (THR-74, High)** — adventurers band together, travel as a group, and resolve encounters together. Its first slice is already up as a pull request (see below).
- **Ready, top first:** the world minting ambitions into mortals (THR-726 — world events write themselves into what people want, instead of ambitions only coming from within), and a small dead-contract cleanup (THR-722). Both fresh from yesterday's design passes.

## Freshness

**Home tree: current and clean.** On `main`, level with the server, no local edits.

**The dev-tooling regression from last hour is still present, now on the books:** the home tree's installed dependencies are missing their command shims (`node_modules/.bin` gone again — logged as impediment #203 overnight), so `npm run dev` and `npm test` fail on the home tree until someone reruns `npm install` there. Agent-fixable; nothing you need to do unless you want the dev server before a session gets to it.

**Cleanup reaper: alive and healthy** — last run 01:40 (within the hour), tracking 23 worktrees / 31 branches / 1 stash, nothing flagged for a human decision.

## What's moving

- **Party formation's first slice is up as a pull request (THR-74, part 1 of 3: the group-layer engine core), but its test gate came back red.** It's armed to merge itself the moment the checks go green; until the executor session fixes the failure it waits. Agent work, nothing for you — noted so the next brief can confirm it landed.
- **Two pieces of overnight bookkeeping landed:** the armed-pull-request starvation pattern and the missing-shims regression above were both written into the impediment log (#202, #203), so Friday's retro sees them.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
