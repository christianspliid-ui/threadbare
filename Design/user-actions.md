# User Action Required

**Last updated:** 2026-09-22 03:00 local (01:00 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Turn off Linear's auto-complete for sub-issues — it is closing unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. On 21 September that closed [THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die) and [THR-1519](https://linear.app/threadbare/issue/THR-1519/appointment-primitive-slice-3-the-undertaking-grid-a-work-whose-payoff) — the tooling and the counter that make the appointment feature *get used* — 0.3 seconds after part one closed. Neither had been started. The orchestrator restored both within twenty minutes; **nothing was lost, and the builder did nothing wrong.** THR-1518 has since shipped for real.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion.

**It is still loaded.** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) tops the queue with three unfinished children ([THR-1520](https://linear.app/threadbare/issue/THR-1520/traits-wave-2-slice-2-draw-by-trait-completion-dedup-against-what-the), [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits), [THR-1522](https://linear.app/threadbare/issue/THR-1522/traits-wave-2-slice-4-the-deferred-location-trait-consumers-merchant)) — re-verified this run, one of them claimable right now. A hand-written warning guards it; a toggle guards it permanently. *— from tb-orchestrator*

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live — including the last blemish, the raw `{sphere_flavor}` placeholder in conversation scenes ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). The deploy probe confirms the live site is serving it.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### May a lane draft a design doc on its own? — *from tb-orchestrator*

Your 6 August rule: this hourly lane stages design work but never authors it. **The recorded reason is that the lane ran the cheaper Sonnet model.** It runs Opus now — the same model an attended design session uses — so the stated reason has quietly expired. Nobody changed the rule; the ground under it moved.

The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design chat, and you may want a person in the room when the game's shape is decided.

- **Yes** → it drafts the first pass, runs the same audits an attended session uses, and you review a draft instead of starting from nothing.
- **No** → nothing changes, and the rule gets recorded on its own terms so no future run re-opens it.

**No urgency.** The queue refilled on 21 September without the rule changing; nothing waits on the answer.

### Were the stops deliberate? (lane silence — four episodes, all ended)

Every lane has fired on schedule since Monday 17:41 local, re-verified this run, so nothing is stopped now. The question the episodes raised is still open.

In local time the last stop ran **Sunday 20:57 → Monday 17:41** — overnight, then most of Monday's working day. Earlier: 17 September (~10h), 18 September (~16h), and the Saturday→Sunday gap (~25h). None had a pause marker. Weekend and overnight quiet is declined under your 8 August and 11 September rulings and is not part of this ask.

**The evidence says the machine was off, not that a lane broke.** Every lane fired together in one catch-up burst; the hourly Windows cleanup script, which has no connection to Claude, stopped at the same boundary and resumed with it; GitHub's own scheduled jobs stayed green throughout, because they don't run here.

**If it was you:** nothing to do — a marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If it wasn't:** say so, and the next session looks into why the machine keeps going quiet. Recalibrating the probe is ours, not yours to repeat.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-22 — the appointment feature's authoring half is built and proven.** [THR-1518](https://linear.app/threadbare/issue/THR-1518/appointment-primitive-slice-2-the-authoring-harness-guide-spec-die) (the harness that teaches encounter authors the new promise exists) and [THR-1524](https://linear.app/threadbare/issue/THR-1524/appointment-reachability-the-crossroads-plants-nothing-on-the-live) (proving it reaches the live board) both merged; the third part is queued.
- **2026-09-21 — two silently-closed halves of the appointment feature were restored** 20 minutes after Linear closed them unbuilt. The cause is the toggle above.
- **2026-09-21 — the design queue refilled itself and the builder is working again.** [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) shipped with four items queued behind it. The "start the staged designs" ask led the briefing for eleven runs.
- **2026-09-20 — the raw `{sphere_flavor}` placeholder no longer prints in conversation scenes** ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). Merged 17:27, live. This was the last blemish on your review sitting.
- **2026-09-20 — finished PRs no longer go red on a stopwatch; the slow test arms got an explicit timeout** ([THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and)). Merged 17:18; 47 minutes from filed to fixed.
- **2026-09-19 — the unused "lose a hard fight → Wounded/Terrified" rule is deleted; wounds come from each encounter's written ending** ([THR-1503](https://linear.app/threadbare/issue/THR-1503/processencounterconditions-gates-on-a-template-category-no-shipped)). Veto window closed with the merge; live.
- **2026-09-19 — the change classifier reads uncommitted work, and the pickup lane runs it on code changes** ([THR-1513](https://linear.app/threadbare/issue/THR-1513/classifydiffs-browser-verify-reminder-falls-back-to-the-working-tree)). Merged 01:10, live.
- **2026-09-19 — a finished work outside a town now has somewhere for its encounter to land** ([THR-1515](https://linear.app/threadbare/issue/THR-1515/catalyst-families-have-no-member-for-a-hamlet-or-the-wild-a-settlement)). Merged 00:10, live.
- **2026-09-19 — the retro draft picks its period from the newest retro report** ([THR-1512](https://linear.app/threadbare/issue/THR-1512/retro-draft-derives-its-period-from-the-newest-committed-retro-report)). Merged 00:08.
- **2026-09-18 — the six unused family tags are deleted** ([THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author)). Veto window closed with the merge at 21:18 in silence; any tag restores with one line.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).
