# Briefing

**Generated:** 2026-07-19 11:29 local (09:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One real call this cycle — the war system.**

The war system woke up yesterday. Armies march, battles resolve, sieges hold. That work (THR-614) is done and merged.

Three follow-on pieces were written to deepen it, and they're sitting untouched in the backlog:

- **Battle depth** — more ways a battle can turn: last stands, a commander's luck running out, terrain and morale actually mattering.
- **Sieges** — a siege that tightens as it drags, pulls the whole region's attention toward it, and starves the place out.
- **Aftermath** — what a war *leaves behind*, and giving the world's notable figures ambitions beyond fighting.

**Why this needs you and not an agent:** all three were written back when we believed the war system had to be built from scratch. It turned out to already exist — it just wasn't switched on. So the plans describe building things that may be half-built already, and nobody should queue them up until someone decides what's actually wanted.

**The question:** is deepening war where the next stretch of work should go, or would you rather that effort land somewhere else? Either answer is fine — I just need the steer before these get queued or shelved. If you'd like, say the word and a design session will re-scope them against what's actually in the code first, so you're choosing against reality instead of a stale plan.

**Second item — the game won't start on your machine right now.**

Found while running this brief: `npm run dev` and `npm test` both fail in your local copy. The packages are installed (276 of them), but the little launcher shims npm uses to actually *run* them are missing, so every command that starts the game or the tests dies with "'vite' is not recognized."

**Fix — one command, in the project folder:**

```
npm install
```

This is yours to run because it's your machine and it needs to finish uninterrupted; it's not something the hourly automation should do underneath you. Nothing is lost and nothing is broken in the code itself — the shipped game builds fine on the server, which is why this went unnoticed. It only bites when *you* sit down to play or test locally.

Separately, the usual standing heads-up, not a task: if you open an interactive session on this machine, **refresh first** — and the refresh command changed this hour (see **Freshness**).

## Queue

**Thin, and about to run dry.** Four items ready for the executor, down from five — the economy card art (THR-656) shipped this hour. What's left is four low-priority tidy-ups: retiring the last Codex leftovers (THR-634), two small motive-receipt clean-ups (THR-642/643), and an economy-feed warning (THR-644). **All four have sat untouched since 2026-07-05 — fourteen days**, well past the two-week mark where I start calling it stale rather than patient.

**The part worth your attention:** nothing high-priority is queued, but three *high-priority* war pieces (the ones above) are sitting one step back in the backlog with their blocker already cleared. So the line looks healthy by count while the genuinely valuable work is parked behind a decision. Once the executor finishes the four scraps, it idles. That's the practical reason the war question above matters this week rather than whenever.

Nothing in the ready line is blocked. Two threads are mid-flight and expected to stay that way between slices: the economy Phase 2 work (THR-616) and the migration gate (THR-652).

## Freshness

**Changed this hour, and the old fix command no longer applies.** The home copy is no longer sitting on `main` — it's in a "detached" state, parked on a commit from yesterday evening, **58 commits behind** `origin/main` (54 last cycle). Its `main` branch itself is fine and nearly current; the working copy just isn't pointed at it.

It also still carries **~85 uncommitted local edits** (`src/engine/army*`/`battle*`, Codex/AscendantBar/GameView component edits, plus staged plan-doc and script deletions) — too dirty for the hourly auto-sync to fast-forward, which is why it keeps drifting further behind.

Before an interactive session: triage the edit pile first (item #3 in [`Design/user-actions.md`](user-actions.md)), then re-attach to the branch and pull:

```
git switch main && git pull
```

*(Note: previous briefings said `git fetch && git rebase origin/main`. That was right while the tree was on `main`; it won't do the job from a detached state. Use the line above.)*

**Also worth knowing:** THR-660 landed yesterday and stopped the tree from *re-dirtying itself* every session, so once this one-time pile is cleared the auto-sync should keep the copy current on its own. There are also 23 leftover agent worktrees under `.claude/worktrees/` — normal automation residue, and the existing cleanup script handles it; no action needed from you.

## What's moving

- **Economy card art (THR-656) shipped this hour** — the "Awning Unfurled" market card now has art, closing the last gap from the player-progression work.
- **Economy Phase 2 (THR-616)** stays active — multi-slice engine and content work; expect it to sit "in dev" between slices, not stuck.
- **The Pure Claude Code migration gate (THR-652, urgent)** is close. One of its two checks is now satisfied: this briefing has refreshed every hour without a gap from 2026-07-18 15:36 through 2026-07-19 10:35 — two straight days, which is what the gate asked for.
- **Yesterday's haul**, for context on why the queue is thin: the war system activation (THR-614), the orphaned-card inspector (THR-659), design-agent substrate visibility (THR-658), the plans index (THR-576), and the last three manual wiki pages (THR-600/601/602) all closed.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
