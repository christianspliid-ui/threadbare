# Briefing

**Generated:** 2026-07-19 13:29 local (11:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two items, both carried and both re-verified this run.** Neither has moved.

**1. The war question — still the one real design call.**

The war system woke up yesterday: armies march, battles resolve, sieges hold. Three follow-on pieces were written to deepen it, and all three are still parked, unstarted:

- **Battle depth** — more ways a battle can turn: last stands, a commander's luck running out, terrain and morale actually mattering.
- **Sieges** — a siege that tightens as it drags, pulls the region's attention toward it, and starves the place out.
- **Aftermath** — what a war *leaves behind*, plus giving the world's notable figures ambitions beyond fighting.

**Why you and not an agent:** all three were written back when we believed the war system had to be built from scratch. It turned out to already exist — it just wasn't switched on. So the plans describe building things that may be half-built already. Re-confirmed this run: their blocker is cleared, and they're waiting on a steer rather than any technical dependency.

**The question:** is deepening war where the next stretch of work should go, or should that effort land somewhere else? Either answer is fine. Say the word and a design session will re-scope them against what's actually in the code first, so you're choosing against reality instead of a stale plan.

**2. The game still won't start on your machine.**

Re-tested this run and it is still broken, in the same way: the packages themselves are installed, but the launcher shims npm uses to actually *run* them are all missing — the folder that should hold them is completely empty. Anything that starts the game or the tests dies with "'vite' is not recognized."

**Fix — one command, in the project folder:**

```
npm install
```

This one is yours because it's your machine and it needs to finish uninterrupted — not something the hourly automation should do underneath you. Nothing is broken in the code itself; the shipped game builds fine on the server, which is why it went unnoticed. It only bites when *you* sit down to play or test locally.

Separately, the usual standing heads-up rather than a task: if you open a session on this machine, **refresh first** — see **Freshness**, and note the refresh command is not the one older briefings gave.

## Queue

**Three left, and they're the scrapings.** THR-634 (retiring the final Codex leftovers) is in flight, leaving three low-priority tidy-ups: two motive-receipt clean-ups and an economy-feed warning. **All three have sat since 2026-07-05 — fourteen days**, past the point where I call it stale rather than patient.

**The concern is unchanged and now sharper:** nothing high-priority is queued, while the three war pieces sit one column back with their blocker cleared, and two fresh spin-offs from yesterday's ascendant-actions work are parked even further back. The line looks alive by count, but it's three scraps deep and the genuinely valuable work is behind the decision above. When the executor finishes these, it idles — that's the practical reason the war question matters this week rather than whenever.

Nothing in the ready line is blocked. Two threads are mid-flight and expected to stay that way between slices: economy Phase 2 and the migration gate.

## Freshness

**Unchanged in kind, slightly worse in degree.** The home copy is still "detached" — parked on an old commit rather than pointed at `main` — and is now **60 commits behind** `origin/main` (59 last cycle). Its `main` branch itself is fine; the working copy just isn't on it. Nothing unique lives on that snapshot, so nothing is at risk of being lost by moving off it.

It also still carries **~85 uncommitted local edits** (engine army/battle files, some component edits, plus staged plan-doc and script deletions) — too dirty for the hourly auto-sync to fast-forward, which is exactly why it drifts further behind each hour.

Before an interactive session: triage the edit pile first (item #3 in [`Design/user-actions.md`](user-actions.md)), then re-attach and pull:

```
git switch main && git pull
```

*(Older briefings said `git fetch && git rebase origin/main`. That was correct while the tree was on `main`; it will not work from a detached state. Use the line above.)*

The `.codesight` untracking landed this morning and stopped the tree from *re-dirtying itself* every session, so once this one-time pile is cleared the auto-sync should keep the copy current on its own. The pile itself still needs a human pass — it's the one thing standing between you and a self-maintaining local copy.

## What's moving

The last day was the most productive stretch in a while — roughly a dozen tickets closed:

- **Player action progression v1 is done.** The multi-session thread open since 2026-07-04 — in-run capability growth and the unlock cadence — closed this morning.
- **The six no-op ascendant actions now have real effects.** Cards that looked functional but did nothing when cast (attune, curse and nullify an artifact; fortify a place; lay a trap; grant a vision) now actually change the world. Two sanctify cards remain hollow and were spun off as their own ticket.
- **The game manual wiki is complete** — the last three pages (stealth & rival gods, attention & story, twilight & the world-soul) all landed.
- **Codex retirement (THR-634)** is in flight this hour — the last stale Codex scaffolding comes out of the repo.
- **Housekeeping shipped:** the `.codesight` dirt fix, a plans index, an orphaned-action-card inspector, and the substrate-visibility tooling that stops design agents from re-planning systems that already exist — the exact failure that caused the war-plan confusion above.
- **The Pure Claude Code migration gate** is close. Its briefing-cadence check continues to hold: this file has refreshed hourly without a gap since 2026-07-18 15:36.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
