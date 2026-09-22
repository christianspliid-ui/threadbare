# User Action Required

**Last updated:** 2026-09-22 08:58 local (06:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### One design hour: are scenes being offered to exactly the people who will refuse them?

[THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), on the design desk since 06:37 local.

When the world decides *which mortal* should be handed a scene, it favours mortals who lean one way on the scene's named value — tradition over novelty, say. But when that scene's choice then *forks* on the same value, the arm that actually matters is often the other one. So the game reliably hands a two-way choice to the person who will take the boring arm.

**Measured, not suspected.** A Bargain at the Crossroads fired once in a thousand ticks and was refused; the meeting it was meant to arrange never happened on any seed. A content fix to that one scene made it fire 3 and 11 times on two seeds. Every other scene written to the same house guide is still starved — **and the guide still tells authors to write them that way**, so the corpus grows the problem while the question waits.

**The fork:** either the rule was always meant to draw both kinds of mortal (and the code has quietly disagreed with its own documentation for months), or the lopsidedness *is* the design — a Protector really should be drawn to a mercy scene — and the house guide must stop telling authors to reuse that axis for the fork. Both readings are defensible; whichever you pick, the work after it is ordinary. Open a chat and say you want to work THR-1525.

### May a lane draft a design doc on its own? — *from tb-orchestrator*

Your 6 August rule: the hourly planning lane stages design work but never authors it. **The recorded reason is that the lane ran the cheaper Sonnet model.** It runs Opus now — the same model an attended design session uses — so the stated reason has quietly expired.

The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design chat, and you may want a person in the room when the game's shape is decided.

- **Yes** → it drafts the first pass, runs the same audits an attended session uses, and you review a draft instead of starting from nothing.
- **No** → nothing changes, and the design sessions are yours to run.

**The shelf is one job deep** — it hit zero an hour ago and refilled only because a blocker cleared on its own. Three tickets arrived overnight and all three were declined as questions rather than work: [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the). A yes would not settle THR-1525 — that one is a question about meaning and stays yours — but it would let the lane draft the other two.

### Turn off Linear's auto-complete for sub-issues — it closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night, erasing five pieces of authored work** — two parts of the appointment feature at 00:12 local, then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15, a quarter of a second after the parent closed. None had been started.

**Nothing was lost, and no builder did anything wrong.** All five were restored, each verified unstarted four ways first; the longest erasure lasted twenty minutes.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion.

**Why it is still here but not leading.** It cannot fire this hour — no parent with unfinished children is being worked, checked this run. It fires again the next time one is, and both recoveries so far happened only because an hourly sweep looked. A hand-written warning on the parent ticket was in place and did not stop it; a note cannot stop a setting. *— from tb-orchestrator*

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live — including the last blemish, the raw `{sphere_flavor}` placeholder in conversation scenes ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### Were the stops deliberate? (lane silence — four episodes, all ended)

Every lane has fired on schedule since Monday 17:41 local, re-verified this run, so nothing is stopped now. The question the episodes raised is still open.

In local time the last stop ran **Sunday 20:57 → Monday 17:41** — overnight, then most of Monday's working day. Earlier: 17 September (~10h), 18 September (~16h), and the Saturday→Sunday gap (~25h). None had a pause marker. Weekend and overnight quiet is declined under your 8 August and 11 September rulings and is not part of this ask.

**The evidence says the machine was off, not that a lane broke.** Every lane fired together in one catch-up burst; the hourly Windows cleanup script, which has no connection to Claude, stopped at the same boundary and resumed with it; GitHub's own scheduled jobs stayed green throughout, because they don't run here.

**If it was you:** nothing to do — a marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If it wasn't:** say so, and the next session looks into why the machine keeps going quiet.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-22 — a mortal is never dealt a trait they already carry, and the artifact catalogues are seated** ([THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the), traits wave 2 slice 2). Merged 07:54 local via [#1983](https://github.com/christianspliid-ui/threadbare/pull/1983); it was the sole gate on slice 3, which is now on the build shelf.
- **2026-09-22 — the appointment feature is complete: a mortal can now be promised a meeting, keep it or miss it, and a work can be built around it.** The third and last part, [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff), merged at 06:52 local; [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by), [THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die) and [THR-1524](https://linear.app/threadbare/issue/THR-1524/appointment-reachability-the-crossroads-plants-nothing-on-the-live) closed ahead of it.
- **2026-09-22 — the appointment planter now records a promise as kept or broken on the promise itself** ([THR-1527](https://linear.app/threadbare/issue/THR-1527/the-appointment-planter-writes-an-owes-favor-edge-without-its-two)). Merged 05:24 local via [#1980](https://github.com/christianspliid-ui/threadbare/pull/1980).
- **2026-09-22 — places now earn traits from their own fortunes, and the encounter pool reads them** ([THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools), traits wave 2 slice 1). Merged and live; two follow-on slices remain, one of which the measurement may have made moot.
- **2026-09-21 — two silently-closed halves of the appointment feature were restored** 20 minutes after Linear closed them unbuilt. The cause is the toggle above.
- **2026-09-21 — the design queue refilled itself and the builder is working again.** The "start the staged designs" ask led the briefing for eleven runs.
- **2026-09-20 — the raw `{sphere_flavor}` placeholder no longer prints in conversation scenes** ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). Merged 17:27, live. This was the last blemish on your review sitting.
- **2026-09-20 — finished PRs no longer go red on a stopwatch; the slow test arms got an explicit timeout** ([THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and)). Merged 17:18; 47 minutes from filed to fixed.
- **2026-09-19 — the unused "lose a hard fight → Wounded/Terrified" rule is deleted; wounds come from each encounter's written ending** ([THR-1503](https://linear.app/threadbare/issue/THR-1503/processencounterconditions-gates-on-a-template-category-no-shipped)). Veto window closed with the merge; live.
- **2026-09-19 — the change classifier reads uncommitted work, and the pickup lane runs it on code changes** ([THR-1513](https://linear.app/threadbare/issue/THR-1513/classifydiffs-browser-verify-reminder-falls-back-to-the-working-tree)). Merged 01:10, live.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).
