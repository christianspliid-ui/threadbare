# Briefing

**Generated:** 2026-08-12 14:55 local (2026-08-12 12:55 UTC) · keep-work-flowing-cc

## The one thing

**Action cards print a danger word that isn't real — may I stop printing it?** ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards say a working is *steady / uncertain / perilous*. For **85% of castable cards the number behind that word cannot move the odds at all** — the difficulty it's computed from never reaches the roll. So the word varies while the actual risk doesn't.

- **(a)** make the word track the odds the cast will really roll
- **(b)** stop printing a risk word where the odds are flat, and print something true instead — scale, or cost
- **(c)** lower the floors so authored danger bites again (this also changes how every mortal resolves everything)

**Recommendation: (b).** If the danger doesn't vary, a danger word is the wrong thing to print.

Same caveat as yesterday: this overlaps [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unify the card grammar) and [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language). All three are the same question — *what does a card actually tell you?* Say the word and they get ruled together in one sitting.

## Also waiting (3)

- **[THR-962](https://linear.app/threadbare/issue/THR-962)** — where the encounter sound cues should be routed. Needs your ears, not a screen.
- **[THR-961](https://linear.app/threadbare/issue/THR-961)** — how those cues should feel. Same sitting.
- **Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

## Queue

**Backed up — 21 ready, 0 in flight.** Every one of the 21 is cleanup: infrastructure, deferrals, prose/UI tidying. **Zero feature or content work on the shelf.** Unchanged from this morning; the constraint is design capacity, not your direction.

- **The executor is moving again and clearing work.** Two PRs merged in the last hour — [#1402](https://github.com/christianspliid-ui/threadbare/pull/1402) ([THR-1055](https://linear.app/threadbare/issue/THR-1055), rare endings for the ten hod quests) and [#1403](https://github.com/christianspliid-ui/threadbare/pull/1403) ([THR-1062](https://linear.app/threadbare/issue/THR-1062), Meeting Batch A slot 2). In Dev is empty because both finished, not because anything stalled.
- **One lane is still asking you for verdicts you already gave.** The orchestrator's report this hour again lists [THR-907](https://linear.app/threadbare/issue/THR-907) and [THR-974](https://linear.app/threadbare/issue/THR-974) under *Needs Christian*. You ruled both on **2026-08-10** — four of four on THR-907, "not yet" on THR-974. The rulings went into ticket comments and the ticket states never moved, so the lane keeps re-reading them as open. **Nothing is owed by you.** Suppressed here; it needs an executor to move those two tickets out of the asking state, and it will repeat every hour until one does.
- **Two High-priority items would refill the shelf, and both need a design session first** — [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language) and [THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory). On THR-1082 you have already answered most of the design questions in chat; that session is largely writing down what you said. *(— from `daily-backlog-grooming`, this morning.)*
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991) — untouched 9 days.
- No parked In-Dev issues.

## Health

- **Home tree's `node_modules` is still incomplete** — `.bin` is missing, so anything that shells out to `vitest` can't run there. Repair is `npm install` in the home tree; an executor's job, not yours. Unchanged since yesterday.
- **Two stale worktrees still need disposition** — `hopeful-shaw-3150f4` and `jovial-mcnulty-37a4c9`, both unmerged. The housekeeping job will not delete unmerged work on its own; it otherwise ran 15 minutes ago and is healthy.
- **The home tree has uncommitted edits to `Docs/impediments.md`** while sitting 2 commits behind `main`. That is the shape that stops the auto-sync job cold. Nothing has broken yet — flagged so it gets cleared before it does. Executor's job.
- **The lane-silence probe still flags the 20.6 h gap on 10–11 Aug.** Declined again as machine-off, per your 2026-08-08 ruling — the Windows housekeeping job, which knows nothing about lanes, missed the identical window. Noted only so it isn't mistaken for a new outage.
- Deploy, CI checks, scheduled workflows, armed PRs and task heartbeats: all green. The live site is serving the latest commit on main ([`d6a3af32`](https://github.com/christianspliid-ui/threadbare/commit/d6a3af32)).
