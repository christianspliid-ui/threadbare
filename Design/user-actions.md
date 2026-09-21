# User Action Required

**Last updated:** 2026-09-21 22:56 local (2026-09-21 20:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live — **including the last blemish.** The raw `{sphere_flavor}` placeholder that was printing in conversation scenes is fixed ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)); the deploy probe confirms the live site is serving that commit.

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### May a lane draft a design doc on its own? — *from tb-orchestrator*

Your 6 August rule: this hourly lane stages design work but never authors it. **The reason recorded for that rule is that the lane ran the cheaper Sonnet model.** It runs Opus now — the same model an attended design session uses — so the stated reason has quietly expired. Nobody changed the rule; the ground under it moved.

The orchestrator is explicit that the rule may still be right for a reason that was never written down: an unattended lane writing designs skips the back-and-forth of a real design chat, and you may want a person in the room when the game's shape is being decided.

- **Yes** → it drafts the first pass, runs the same audits an attended session uses, and you review a draft instead of starting from nothing.
- **No** → nothing changes, and the rule gets recorded on its own terms so no future run re-opens it.

**Correction added this run:** the orchestrator framed this as three days of empty queue resting on the rule. That is no longer true — three plan docs merged tonight, and the queue refilled without the rule changing. The question stands on its own; the urgency does not.

### Were the stops deliberate? (lane silence — four episodes, all ended)

Every lane has fired on schedule since Monday 17:41 local (re-verified this run), so nothing is stopped right now. The question the episodes raised is still unanswered.

In local time the last stop ran **Sunday 20:57 → Monday 17:41** — overnight, then most of Monday's working day. Earlier episodes: 17 September (~10h), 18 September (~16h), and the Saturday→Sunday gap (~25h). None had a pause marker. Weekend and overnight gaps are declined under your 8 August and 11 September rulings and are not part of this ask; the probe's current worst gap is one of those.

**The evidence says the machine was off, not that a lane broke.** Every lane fired together in one catch-up burst; the hourly Windows cleanup script, which has no connection to Claude, stopped at the same boundary and resumed with it; GitHub's own scheduled jobs stayed green throughout, because they don't run here.

**If it was you:** nothing to do. A pause marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If it wasn't:** say so, and the next session looks into why the machine keeps going quiet. Silence reads as "deliberate" — and if you confirm it, recalibrating the probe is ours to do, not yours to repeat.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). A stranger's sheet reads *"carries no known possessions, conditions…"* right after an encounter wounded them; the familiarity gate withholds it. **Should an encounter's own consequences be exempt — because you were there — or does the fog stay honest?** Silence leaves it as-is.

## Resolved this period

- **2026-09-21 — the three staged designs all have plan docs; the queue refilled without you.** [THR-1479](https://linear.app/threadbare/issue/THR-1479/appointment-primitive-a-mortal-keeps-or-misses-a-meeting-at-a-place-by) and [THR-1348](https://linear.app/threadbare/issue/THR-1348/ambitions-held-below-the-spotlight-tier-have-no-agency-path-10-of-the) are Ready for Dev, [THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and) is in Implementation Planning. Merged 22:27–22:50. This ask led the briefing for eleven runs.
- **2026-09-20 — the raw `{sphere_flavor}` placeholder no longer prints in conversation scenes** ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)). Merged 17:27, live. This was the last blemish on your review sitting.
- **2026-09-20 — finished PRs no longer go red on a stopwatch; the slow test arms got an explicit timeout** ([THR-1517](https://linear.app/threadbare/issue/THR-1517/the-multi-tick-arms-in-orchestratortestts-have-no-explicit-timeout-and)). Merged 17:18; 47 minutes from filed to fixed.
- **2026-09-19 — the unused "lose a hard fight → Wounded/Terrified" rule is deleted; wounds come from each encounter's written ending** ([THR-1503](https://linear.app/threadbare/issue/THR-1503/processencounterconditions-gates-on-a-template-category-no-shipped)). Veto window closed with the merge; live.
- **2026-09-19 — the change classifier reads uncommitted work, and the pickup lane runs it on code changes** ([THR-1513](https://linear.app/threadbare/issue/THR-1513/classifydiffs-browser-verify-reminder-falls-back-to-the-working-tree)). Merged 01:10, live.
- **2026-09-19 — a finished work outside a town now has somewhere for its encounter to land** ([THR-1515](https://linear.app/threadbare/issue/THR-1515/catalyst-families-have-no-member-for-a-hamlet-or-the-wild-a-settlement)). Merged 00:10, live.
- **2026-09-19 — the retro draft picks its period from the newest retro report** ([THR-1512](https://linear.app/threadbare/issue/THR-1512/retro-draft-derives-its-period-from-the-newest-committed-retro-report)). Merged 00:08.
- **2026-09-18 — the six unused family tags are deleted** ([THR-1501](https://linear.app/threadbare/issue/THR-1501/six-family-tags-are-now-orphaned-no-bearer-no-reader-sunset-or-author)). Veto window closed with the merge at 21:18 in silence; any tag restores with one line.
- **2026-09-18 — the undertaking proof script decides seed consumption off state, not off evicted traces** ([THR-1514](https://linear.app/threadbare/issue/THR-1514/undertaking-live-proof-and-content-model-census-decide-seed)). Merged 20:31, live.
- **2026-09-18 — a finished work's follow-up encounter is offered at the town the work touched** ([THR-1511](https://linear.app/threadbare/issue/THR-1511/undertaking-catalysts-wither-where-the-actor-stands-every-cell)). Your veto window closed with the merge at 19:33; live.

---

Older resolved items and every earlier version of this file: `git log -p origin/ops -- Design/user-actions.md`.
The hourly brief that leads with one of these: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md).
