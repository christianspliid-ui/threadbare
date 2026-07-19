# Briefing

**Generated:** 2026-07-19 15:28 local (13:28 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One item changed this hour, and it changed in your favour.**

**1. The war question — you may have already answered it by playing.**

For the last several briefs this was the top ask: three war follow-ons — deeper battles, sieges that tighten as they drag, and what a war *leaves behind* — were written, their blocker cleared on Saturday, and they sat waiting on a steer about whether deepening war is where the next stretch of effort goes.

**What changed:** you played, and you filed four pieces of work off the back of it — the notification rework. Encounters and tugs move onto the entity's card in the Threads panel instead of firing into a global toast queue, and agents you hold no thread with stop shouting at you entirely. That is now the highest-priority thing on the board, and the foundation piece is already being built.

So the question is narrower than it was:

> **Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Either answer is fine and neither is urgent this week. The reason to answer at all is that the three war pieces still describe *building* things that turned out to be already built — the war system was dormant, not missing. Whenever they get picked up they need a re-scope against what's actually in the code first. If you say "war is later," they sit safely as they are. If you say "both," someone should do that re-scope now, so you're choosing against reality rather than a stale plan.

**2. The game still won't start on your machine.**

Re-probed this run — fourth consecutive check, unchanged. The packages are installed (276 of them), but the launcher shims npm uses to actually *run* them were never created; that folder still doesn't exist. Anything that starts the game or the tests dies with `'vite' is not recognized`.

**Fix — one command, in the project folder:**

```
npm install
```

This one is yours because it's your machine and it needs to finish uninterrupted — not something the hourly automation should do underneath you. Nothing is wrong with the code; the shipped game builds fine on the server, which is why it went unnoticed. It only bites when *you* sit down to play or test locally.

## Queue

**Recovered — five waiting, up from two, and this time they aren't scraps.** Last hour's warning that the executor would run dry within a cycle or two is withdrawn: your play session put three real pieces of the notification rework on the board, two of them high priority.

Two caveats, both mild:

- **Two of the three new pieces are waiting on the third.** The badge itself — the thing an encounter or a tug actually appears *on* — is being built right now. Removing the map vibration, and stopping unthreaded agents from toasting, both hang off that badge existing, so they unblock on their own when it lands. Nothing to do.
- **The two oldest items are properly stale** — a motive-receipt documentation tidy-up and an economy-feed warning, both sitting since 2026-07-05, now **fourteen days** old. Neither is important; they're just old enough that I'd rather name them than keep quietly counting them as queue depth.

One process note for the agents rather than for you: three items are marked in-flight against a limit of one, and two of those have nobody attached — the economy phase-2 work and the migration go/no-go gate. Parked rather than lost, but they should be picked back up or released.

## Freshness

**Still drifting, and now measurably worse: 69 commits behind** `origin/main` (64 last hour, 60 before that). The home copy remains "detached" — parked on an old commit rather than pointed at `main` — and still carries **~85 uncommitted local edits**, which is why the hourly auto-sync can't fast-forward it and why it slips further each cycle.

**New this run — I checked what is actually at risk, and the answer is: less than earlier briefs implied, but not nothing.**

- The detached snapshot has **no unique commits**. Everything on it is already on `main`; re-attaching loses nothing.
- The ~85 tracked edits (engine army/battle files, some component edits, staged plan-doc and script deletions) are **stale echoes of work that already shipped**. I confirmed the staged deletions target files that are present and healthy on `main`. Safe to discard.
- **But 15 untracked files are not on `main` at all** — a batch of design proposals, brainstorm docs, and a judge-metrics file. Those are genuinely unique and a blanket clean would destroy them. They survive the commands below, which is precisely why these are the commands to use.

Before an interactive session:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git fetch origin
git switch -f main
git reset --hard origin/main
```

That re-attaches you to `main`, discards the stale tracked edits, and **leaves the 15 unique untracked docs in place** for a separate look. *(Ignore the `git switch main && git pull` line from earlier briefs — with this many local edits it will refuse or drag the mess along. `git fetch && git rebase origin/main`, from briefs before that, does not work from a detached state at all.)*

Yesterday's `.codesight` untracking stopped the tree from *re-dirtying itself* every session, so once this one-time pile is cleared the auto-sync should keep the copy current on its own.

## What's moving

- **The entity-anchored badge went into build** — the surface the rest of the notification rework hangs off.
- **Saturday's war activation is confirmed shipped and closed.**
- **A correction to last hour's brief on the migration gate.** It claimed this file had refreshed "hourly without a gap" and was "well past" the two consecutive days the gate wants. Checking the actual history: the task has been firing since 2026-07-18 09:15 — about **30 hours** — and several hours show no commit (02:00, 08:00–09:00, 11:00–12:00 today). Those are almost certainly *quiet* runs rather than missed ones, because this task deliberately skips committing when nothing substantive changed, and the run log backs that up. But the honest read is that the two-day bar is met around **tomorrow morning**, not already, and whoever closes that gate should cite the task's run log rather than this file's commit history.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
