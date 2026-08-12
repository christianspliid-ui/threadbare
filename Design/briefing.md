# Briefing

**Generated:** 2026-08-12 14:00 local (2026-08-12 12:00 UTC) · keep-work-flowing-cc

## The one thing

**Action cards print a danger word that isn't real — may I stop printing it?** ([THR-998](https://linear.app/threadbare/issue/THR-998))

Cards say a working is *steady / uncertain / perilous*. For **85% of castable cards the number behind that word cannot move the odds at all** — the difficulty it's computed from never reaches the roll. So the word varies while the actual risk doesn't.

- **(a)** make the word track the odds the cast will really roll
- **(b)** stop printing a risk word where the odds are flat, and print something true instead — scale, or cost
- **(c)** lower the floors so authored danger bites again (this also changes how every mortal resolves everything)

**Recommendation: (b).** If the danger doesn't vary, a danger word is the wrong thing to print.

One caveat worth your eye: this overlaps [THR-1002](https://linear.app/threadbare/issue/THR-1002) (unify the card grammar) and [THR-1082](https://linear.app/threadbare/issue/THR-1082) (consequence icon language). All three are the same question — *what does a card actually tell you?* If you'd rather rule them together in one sitting than one at a time, say so and they get bundled.

## Also waiting (3)

- **[THR-962](https://linear.app/threadbare/issue/THR-962)** — where the encounter sound cues should be routed. Needs your ears, not a screen.
- **[THR-961](https://linear.app/threadbare/issue/THR-961)** — how those cues should feel. Same sitting.
- **Tenacious-style trait** — parked option, no urgency. Safe default is "stays parked."

## Queue

**Backed up — 21 ready, 1 in flight.** Every one of the 21 is cleanup: infrastructure, deferrals, prose/UI tidying. **Zero feature or content work on the shelf.**

- **Four asks came off this list, and one of them was our error.** The briefing has spent two days asking you for the play verdicts — you already gave them on **2026-08-10**, all of them, in chat. Four of four on [THR-907](https://linear.app/threadbare/issue/THR-907) (prose *"this is the bar"*, firing *"rhythm works, prune later"*, UI *"good enough"*, game *"the decisions land"*), and *"not yet"* on [THR-974](https://linear.app/threadbare/issue/THR-974) — the consequence is surfaced but not legible, which chartered [THR-1082](https://linear.app/threadbare/issue/THR-1082). Both tickets are still open, which is why the ask kept regenerating; the rulings were recorded in comments and the ticket state never moved. **Nothing is owed by you on either.** That also answers the aftermath question — you saw it fire live that day.
- **The shelf's real constraint is design capacity, not your direction.** The two High items that would refill it, [THR-1082](https://linear.app/threadbare/issue/THR-1082) and [THR-1043](https://linear.app/threadbare/issue/THR-1043) (the Encounter Factory), each need a design session to write the plan doc before an executor can touch them. On THR-1082 you have already answered most of the open design questions in chat — a design session there is mostly writing down what you said. *(— from `daily-backlog-grooming` and `tb-orchestrator`, both this morning.)*
- Stale: [THR-991](https://linear.app/threadbare/issue/THR-991) — untouched 9 days.
- No parked In-Dev issues.

## Health

- **The two work lanes are back on.** `tb-opus-pickup` and `tb-orchestrator` both read enabled again and both fired at 13:26 today; the executor has already opened [PR #1402](https://github.com/christianspliid-ui/threadbare/pull/1402) for [THR-1055](https://linear.app/threadbare/issue/THR-1055). They resumed within minutes of yesterday's brief going out. **Nothing recorded why they stopped** — Friday's retro has the ~15 lane-hours logged and will take it. No action needed from you unless you want the cause chased.
- **The lane-silence probe flags a 20.6 h gap on 10–11 Aug.** The Windows housekeeping job — which knows nothing about lanes — missed the identical window (last fired 21:40 on the 10th, next at 07:26 the following morning). That makes it machine-off, not a lane fault. Declined as normal per your 2026-08-08 ruling; noted only so it isn't confused with the stoppage above.
- **Home tree's `node_modules` is still broken** — the whole directory is empty, `.bin` included. Repair is `npm install` in the home tree; an executor session's job, not yours.
- **Two stale worktrees still need disposition** — `hopeful-shaw-3150f4` and `jovial-mcnulty-37a4c9`, both 24 days old and unmerged. The housekeeping job will not delete unmerged work on its own.
- Deploy, CI checks, scheduled workflows, armed PRs and task heartbeats: all green. The live site is serving the latest commit on main ([`eabbc173`](https://github.com/christianspliid-ui/threadbare/commit/eabbc173)).
