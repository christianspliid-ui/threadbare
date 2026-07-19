# Briefing

**Generated:** 2026-07-19 14:30 local (12:30 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**The same two items. Both re-checked this run, both still open, neither has moved.**

**1. The war question — the one real design call.**

The war system woke up on Saturday: armies march, battles resolve, sieges hold. Three follow-on pieces were written to deepen it, and all three are still parked, unstarted:

- **Battle depth** — more ways a battle can turn: last stands, a commander's luck running out, terrain and morale actually mattering.
- **Sieges** — a siege that tightens as it drags, pulls the region's attention toward it, and starves the place out.
- **Aftermath** — what a war *leaves behind*, plus giving the world's notable figures ambitions beyond fighting.

**Why you and not an agent:** all three were written back when we believed the war system had to be built from scratch. It turned out to already exist — it just wasn't switched on. So the plans describe building things that may be half-built already. Confirmed again this run: nothing technical is holding them, their blocker cleared yesterday. They're waiting on a steer.

**The question:** is deepening war where the next stretch of work should go, or should that effort land somewhere else? Either answer is fine. Say the word and a design session will re-scope them against what's actually in the code first, so you're choosing against reality instead of a stale plan.

**2. The game still won't start on your machine.**

Re-probed this run, still broken, same signature: the packages are installed (276 of them), but the launcher shims npm uses to actually *run* them were never created — the folder that should hold them still doesn't exist. Anything that starts the game or the tests dies with `'vite' is not recognized`.

**Fix — one command, in the project folder:**

```
npm install
```

This one is yours because it's your machine and it needs to finish uninterrupted — not something the hourly automation should do underneath you. Nothing is wrong with the code; the shipped game builds fine on the server, which is why it went unnoticed. It only bites when *you* sit down to play or test locally.

Separately, the usual standing heads-up rather than a task: if you open a session on this machine, **refresh first** — see **Freshness**, and note the refresh command is not the one older briefings gave.

## Queue

**Down to two, and they are the scrapings.** THR-634 — the last of the Codex leftovers — merged since the previous brief, which is good news that makes the line shorter: what remains is two low-priority motive-receipt tidy-ups and an economy-feed warning. **Both have sat since 2026-07-05 — fourteen days**, past the point where I call it stale rather than patient.

**The concern from last hour, now one notch sharper.** Nothing high-priority is queued at all. The three war pieces sit one column back with their blocker cleared; two spin-offs from the ascendant-actions work are parked further back still. The line looks alive by count, but it is two scraps deep and everything genuinely valuable is behind the decision above. The executor will run dry within a cycle or two — that is the practical reason the war question matters this week rather than whenever.

Nothing in the ready line is blocked. Two threads are mid-flight and expected to stay that way between slices: economy Phase 2 and the migration gate.

## Freshness

**Same shape, drifting further.** The home copy is still "detached" — parked on an old commit rather than pointed at `main` — and is now **64 commits behind** `origin/main` (60 last cycle). Its `main` branch itself is fine; the working copy just isn't on it. Nothing unique lives on that snapshot, so nothing is at risk of being lost by moving off it.

It also still carries **~85 uncommitted local edits** (engine army/battle files, some component edits, plus staged plan-doc and script deletions) — too dirty for the hourly auto-sync to fast-forward, which is exactly why it drifts further each hour.

Before an interactive session: triage the edit pile first (item #3 in [`Design/user-actions.md`](user-actions.md)), then re-attach and pull:

```
git switch main && git pull
```

*(Older briefings said `git fetch && git rebase origin/main`. That was correct while the tree was on `main`; it will not work from a detached state. Use the line above.)*

The `.codesight` untracking landed this morning and stopped the tree from *re-dirtying itself* every session, so once this one-time pile is cleared the auto-sync should keep the copy current on its own. The pile itself still needs a human pass — it's the one thing between you and a self-maintaining local copy.

## What's moving

Quieter hour than the last few, as expected after yesterday's dozen-ticket run:

- **Codex retirement finished (THR-634).** The stale Codex scaffolding — the old orientation file and its supporting folder — is out of the repo. That closes the single-executor cleanup that started back in June; there is now one executor and one queue, with nothing left in the tree implying otherwise.
- **Everything else is the same work continuing.** Economy Phase 2 and the migration gate are both mid-flight; neither is stuck, both stay open between slices by design.
- **The Pure Claude Code migration gate is close.** Its briefing-cadence check continues to hold: this file has refreshed hourly without a gap since 2026-07-18 15:36 — now well past the two consecutive days the gate asks for, so the cadence half of that evidence is satisfied.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
