# Briefing

**Generated:** 2026-07-19 13:10 local (11:10 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two items, both carried from earlier today and both still open.** I re-checked each against reality this run rather than repeating them on faith — neither has moved.

**1. The war question — still the one real design call.**

The war system woke up yesterday (THR-614, done and merged): armies march, battles resolve, sieges hold. Three follow-on pieces were written to deepen it, and they are still sitting untouched:

- **Battle depth** — more ways a battle can turn: last stands, a commander's luck running out, terrain and morale actually mattering.
- **Sieges** — a siege that tightens as it drags, pulls the region's attention toward it, and starves the place out.
- **Aftermath** — what a war *leaves behind*, plus giving the world's notable figures ambitions beyond fighting.

**Why you and not an agent:** all three were written back when we believed the war system had to be built from scratch. It turned out to already exist — it just wasn't switched on. So the plans describe building things that may be half-built already. I confirmed this run that their blocker is cleared and all three are parked, waiting on a steer rather than on any technical dependency.

**The question:** is deepening war where the next stretch of work should go, or should that effort land somewhere else? Either answer is fine. Say the word and a design session will re-scope them against what's actually in the code first, so you're choosing against reality instead of a stale plan.

**2. The game still won't start on your machine.**

Re-tested this run and it is still broken: the packages are installed, but the launcher shims npm uses to actually *run* them are missing, so anything that starts the game or the tests dies with "'vite' is not recognized."

**Fix — one command, in the project folder:**

```
npm install
```

This one is yours because it's your machine and it needs to finish uninterrupted — not something the hourly automation should do underneath you. Nothing is broken in the code itself; the shipped game builds fine on the server, which is why it went unnoticed. It only bites when *you* sit down to play or test locally.

Separately, the usual standing heads-up rather than a task: if you open a session on this machine, **refresh first** — see **Freshness**, and note the refresh command is not the one older briefings gave.

## Queue

**Down to three, and the executor is working the last of them.** THR-634 (retiring the final Codex leftovers) was picked up this hour, leaving three low-priority tidy-ups behind it: two motive-receipt clean-ups (THR-642/643) and an economy-feed warning (THR-644). **All three have sat since 2026-07-05 — fourteen days**, past the point where I call it stale rather than patient.

**The part worth your attention is unchanged from this morning, and is now more pressing:** nothing high-priority is queued, while the three war pieces sit one step back with their blocker already cleared. The line looks alive by count, but it's three scraps deep and the genuinely valuable work is parked behind the decision above. When the executor finishes these, it idles. That's the practical reason the war question matters this week rather than whenever.

Nothing in the ready line is blocked. Two threads are mid-flight and expected to stay that way between slices: economy Phase 2 (THR-616) and the migration gate (THR-652).

## Freshness

**Unchanged in kind, slightly worse in degree.** The home copy is still in a "detached" state — parked on a commit from yesterday evening rather than pointed at `main` — and is now **59 commits behind** `origin/main` (58 last cycle). Its `main` branch itself is fine; the working copy just isn't on it.

It also still carries **~85 uncommitted local edits** (`src/engine/army*`/`battle*`, Codex/AscendantBar/GameView component edits, plus staged plan-doc and script deletions) — too dirty for the hourly auto-sync to fast-forward, which is exactly why it keeps drifting further behind each hour.

Before an interactive session: triage the edit pile first (item #3 in [`Design/user-actions.md`](user-actions.md)), then re-attach and pull:

```
git switch main && git pull
```

*(Older briefings said `git fetch && git rebase origin/main`. That was correct while the tree was on `main`; it will not work from a detached state. Use the line above.)*

THR-660 landed this morning and stopped the tree from *re-dirtying itself* every session, so once this one-time pile is cleared the auto-sync should keep the copy current on its own. The pile itself still needs a human pass — it's the one thing standing between you and a self-maintaining local copy.

## What's moving

- **Codex retirement (THR-634) went into flight this hour** — the last stale Codex scaffolding files come out of the repo.
- **The `.codesight` untracking (THR-660) merged this morning**, which is the fix that should stop the freshness section above from recurring once the existing dirt is cleared.
- **Economy card art (THR-656)** shipped earlier today — the "Awning Unfurled" market card now has art.
- **Economy Phase 2 (THR-616)** stays active — multi-slice engine and content work; expect it to sit "in dev" between slices, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is close. Its briefing-cadence check continues to hold: this file has refreshed hourly without a gap since 2026-07-18 15:36.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
