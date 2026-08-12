# Briefing

**Generated:** 2026-08-12 15:58 local (2026-08-12 13:58 UTC) · keep-work-flowing-cc

## The one thing

**Action cards print a danger word that isn't real — may I stop printing it?** ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards say a working is *steady / uncertain / perilous*. For **85% of castable cards the number behind that word cannot move the odds at all** — the difficulty it's computed from never reaches the roll. So the word varies while the actual risk doesn't.

- **(a)** make the word track the odds the cast will really roll
- **(b)** stop printing a risk word where the odds are flat, and print something true instead — scale, or cost
- **(c)** lower the floors so authored danger bites again (this also changes how every mortal resolves everything)

**Recommendation: (b).** If the danger doesn't vary, a danger word is the wrong thing to print.

Same caveat as before: this overlaps [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unify the card grammar) and [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language). All three are the same question — *what does a card actually tell you?* Say the word and they get ruled together in one sitting.

## Also waiting (4)

- **[THR-1092](https://linear.app/threadbare/issue/THR-1092)** — **new today.** How strict should the automated prose checker be about "abstract" words? It currently fails any encounter using too many words like *devotion*, *surveillance*, *settlement* — which is the actual vocabulary an encounter about the House of Devotion or a spying mission has to use. It fails **128 of 683 encounters (1 in 5)**, including Build and Forge Alliance. Recommendation: keep the number visible for sorting, stop treating it as an automatic fail, and leave the four sharper checks (vague language, hedging, thin premises, wrong voice) as the real gates. Your call because it defines what "clean prose" means for everything written from here.
- **[THR-962](https://linear.app/threadbare/issue/THR-962)** — where the encounter sound cues should be routed. Needs your ears, not a screen.
- **[THR-961](https://linear.app/threadbare/issue/THR-961)** — how those cues should feel. Same sitting.
- **Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

## Queue

**Backed up — 21 ready, 0 in flight.** Every one of the 21 is cleanup: infrastructure, deferrals, prose/UI tidying. **Zero feature or content work on the shelf.** The constraint is design capacity, not your direction.

- **Both work lanes are on and running** — the executor fired 13:01Z, the orchestrator 13:26Z. This morning's grooming report flagged them as switched off; that has since resolved and is not an open item.
- **In Dev is empty because work finished, not because it stalled.** [PR #1404](https://github.com/christianspliid-ui/threadbare/pull/1404) merged this hour ([THR-1066](https://linear.app/threadbare/issue/THR-1066) — two prose register defects fixed; the abstraction question it left behind is THR-1092 above).
- **Two High-priority items would refill the shelf, and both need a design session first** — [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language) and [THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory). On THR-1082 you have already answered most of the design questions in chat; that session is largely writing down what you said.
- **The orchestrator is still re-listing [THR-907](https://linear.app/threadbare/issue/THR-907) and [THR-974](https://linear.app/threadbare/issue/THR-974) as needing you. They don't.** You ruled both on 2026-08-10 — four of four on THR-907, "not yet" on THR-974. The rulings live in ticket comments and the ticket states never moved, so the lane keeps re-reading them as open. Suppressed here; it needs an executor to move those two tickets, and it will repeat every hour until one does.
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991) — untouched 9 days.
- No parked In-Dev issues.

## Health

- **Home tree's `node_modules` is still broken** — `.bin` has no `esbuild` and no `vitest`, so anything shelling out to the test runner can't run there. Repair is `npm install` in the home tree; the housekeeping job refuses to do it itself. An executor's job, not yours. Unchanged for a third day.
- **The home tree has uncommitted edits to `Docs/impediments.md` while sitting 4 commits behind `main`.** That is the shape that stops the auto-sync job cold. Nothing has broken yet — flagged so it gets cleared before it does. Executor's job.
- **Two stale worktrees still need disposition** — `hopeful-shaw-3150f4` (24d) and `jovial-mcnulty-37a4c9` (25d), both unmerged. The housekeeping job will not delete unmerged work on its own; it otherwise ran 18 minutes ago and is healthy.
- **The lane-silence probe still flags the 20.6 h gap on 10–11 Aug.** Declined again as machine-off, per your 2026-08-08 ruling. Noted only so it isn't mistaken for a new outage.
- Deploy, CI checks, scheduled workflows and task heartbeats: all green. The live site is serving the latest commit on main ([`bc35d704`](https://github.com/christianspliid-ui/threadbare/commit/bc35d704)).
