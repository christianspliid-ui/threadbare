# User Action Required

**Last updated:** 2026-09-24 00:58 local (22:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Board read live this run.

## Standing asks

### May a lane draft a design doc on its own? — *from tb-orchestrator*

Your 6 August rule: the hourly planning lane stages design work but never authors it. **The recorded reason is that the lane ran the cheaper Sonnet model.** It runs Opus now, the same model an attended design session uses, so the stated reason has quietly expired. ([The rule, in the process canon](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/canon/process.md).) The rule may still be right for a reason never written down: an unattended lane writing designs skips the back-and-forth of a real design chat.

- **Yes** → it drafts the first pass, runs the same audits an attended session uses, and you review a draft instead of starting from nothing.
- **No** → nothing changes, and the design sessions are yours to run.

**A yes would let the lane draft three designs:** [THR-1523](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), [THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the), [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location).

### Design session wanted: sequel scenes fire on their own ([THR-1526](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the)) — *from tb-orchestrator*

The follow-up scenes of the crossroads bargain and the swindled family can fire on their own. So a stranger turns up to collect on a promise the mortal never made. This is a bug in the appointments work you already approved. The design question is small: how a scene marks itself "only reachable as a sequel". **The builder has finished THR-1525, THR-1534 and THR-1536. Its only queued job is the first fight slice ([THR-1537](https://linear.app/threadbare/issue/THR-1537/fight-block-fb1-fight-steps-read-their-opponent)).** It takes about half an hour in a chat and has no creative fork. Say **"design THR-1526"**. A yes on the ask above would let the lane draft it instead.

### The odds shown are not the odds rolled ([THR-1535](https://linear.app/threadbare/issue/THR-1535/the-odds-shown-are-not-the-odds-rolled-the-unified-road-never-reads-a)) — *from tb-orchestrator*

Right now, a mortal's items, conditions and standing change the percentage the player sees. They do not change the actual dice on the main encounter path. So every item bonus is decorative, and the shown odds are wrong by exactly that amount. The fix makes the dice honour them. That shifts the odds on **every** ordinary encounter step at once, which is why it was filed *held*.

**Are you OK with that global balance shift landing unattended?** A yes promotes it to the build queue. The ticket already stops itself if success rates move by more than 10 points. Nothing else waits on it.

### Turn off Linear's auto-complete for sub-issues — it closes unbuilt work

When a parent issue closes, Linear marks its unfinished children finished too. **It happened twice in four hours on Sunday night, erasing five pieces of authored work**: two parts of the appointment feature at 00:12 local, then all three parts under [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) at 04:15. All five were restored, each checked first to confirm nothing had been built. No builder did anything wrong.

**The fix:** [Linear → Team settings → General](https://linear.app/threadbare/settings/teams/THR/general) → turn off auto-completing sub-issues on parent completion. It fires again the next time a parent with unfinished children is completed. *— from tb-orchestrator*

### Finish the sitting — two encounters left, screen clean ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

You stopped after four feedback batches on Saturday 12 September with *"more batches expected."* Everything those batches produced is shipped and live, including the last blemish ([THR-1516](https://linear.app/threadbare/issue/THR-1516/sphere-flavor-leaks-raw-into-social-scene-step-prose-its-resolver)).

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The one question: **is the integrated encounter experience at an acceptable state?** A pass unlocks the next stage: encounters reaching into factions, war, economy and divine actions. Say **"work the map"** in a chat when done.

### Were you away from the app on Monday 14 and Tuesday 15 September? (lane silence, all ended)

[Today's workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md) read the computer's power log. **The 17 and 18 September stops are explained: the computer was asleep**, and lanes cannot run on a sleeping machine. But on **14 and 15 September the computer was awake all day, and no lane started at all**. So either the Claude app was closed, or the lanes were switched off.

**If you were away or had the app closed:** nothing to do. A marker at `~/.claude/threadbare-pause.json` keeps this off your list next time. **If you weren't:** say so, and it becomes a fault to chase.

### Fog or witness — does a stranger's sheet show what you just watched happen?

Found while building [THR-1461](https://linear.app/threadbare/issue/THR-1461). Right after an encounter wounds a stranger, their sheet still reads *"carries no known possessions, conditions…"*, because the familiarity gate hides it. **Should an encounter's own consequences be exempt, because you were there? Or does the fog stay honest?** If you say nothing, it stays as it is.

## Resolved this period

- **2026-09-24 — a killing's grief now reaches the victim's family and friends, not the corpse** ([THR-1536](https://linear.app/threadbare/issue/THR-1536/a-killings-grief-reaches-only-the-corpse-the-ambition-phase-walks-the)). Merged 00:35 local via [#1994](https://github.com/christianspliid-ui/threadbare/pull/1994). It is live on the site.
- **2026-09-23 — two death paths no longer skip the "will not die" ward** ([THR-1534](https://linear.app/threadbare/issue/THR-1534)). Merged via [#1990](https://github.com/christianspliid-ui/threadbare/pull/1990), and live on the site.
- **2026-09-23 — mortals now want both ends of what they value** ([THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its)). Merged 22:41 local via [#1989](https://github.com/christianspliid-ui/threadbare/pull/1989), and live on the site.
- **2026-09-23 — THR-1525 ruled: mortals are drawn from both poles, with an optional per-axis pin.** [Plan doc](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-23-desire-score-both-poles.md) merged via [#1988](https://github.com/christianspliid-ui/threadbare/pull/1988). [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) is now ready for the builder.
- **2026-09-23 — the 17 and 18 September lane stops are explained.** The computer was asleep, according to [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md).
- **2026-09-23 — the builder's credit came back without a top-up.** Its 08:11 run succeeded, and the ask that led the brief all yesterday is closed.
- **2026-09-23 — artifacts can now carry traits, such as storied or cursed, and the artifact sheet shows them** ([THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits)). Merged 08:37 local via [#1985](https://github.com/christianspliid-ui/threadbare/pull/1985).
- **2026-09-23 — the "heavy simulation tests failing" item left your list.** It is a slow test runner rather than broken code, which makes it a technical call, not yours.
- **2026-09-22 — the "move the builder off Fable" option was withdrawn.** No agent can change a scheduled lane's model.
- **2026-09-22 — holding a town now means something to a faction** ([THR-1448](https://linear.app/threadbare/issue/THR-1448/a-held-town-is-a-faction-position-holding-opens-faction-encounters-and)). Merged via [#1981](https://github.com/christianspliid-ui/threadbare/pull/1981).

---

Older resolved items and every earlier revision of this file: `git log -p origin/ops -- Design/user-actions.md`.
Run history and health detail: [`Design/briefing.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/briefing.md), refreshed hourly.
