# User Action Required

**Last updated:** 2026-08-17 10:57 local (08:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The acted-on taxonomy — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions)

*— from tb-orchestrator.* A chat session, no prep, nothing built or waiting on it. Say **"work the map"** when you have the time.

**When the game writes something down about you that nothing reads yet, does it tell you?** You have ruled twice in opposite directions: reach-reputation tallies invisible everywhere while still bending how people treat you ([THR-1136](https://linear.app/threadbare/issue/THR-1136/aftermath-screen-corner-chrome-removal-step-replay-from-the-ending) §5, 2026-08-16), and plot-hook recordings where *"we need to make it clear to the player that that is what has happened"* (2026-08-17). Both are right in their own case; this reconciles them into one rule the code can carry.

Three classes to grill: **acted-on** (a consumer exists now — full visibility), **dormant hook** (filed for later — the player is told, and something must eventually use it or it lapses), **bookkeeping** (never player-facing, by design). Open sub-questions: does an unused hook expire and does the player see it expire; who may mint one; how a write declares its class.

The live frontier of the [new architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map), and the only question on it that needs nothing built first — your own sequencing, *"lets get it sorted. higest priority."*

### 2. The yes/no on your two batch-1 samples — [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)

- **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**
- **[The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)**

You played the Bridge on 2026-08-17 and that sitting produced the chip-anchoring rule, the package rule and the replay-dot bug. Your own [07:36 comment](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) records that as *shaping the bar, not the release*. All that is left is **worth meeting twice: yes or no, on each** — about a minute.

The Bridge's PATH chip is no longer a caveat: [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) shipped and merged this morning, and the chip that named a river the world does not have is gone rather than made clickable. Judge the writing. Both ids re-checked against `main` this hour; the site serves `d942ac8f`, the current tip.

[All six side by side](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-08-15.md) · [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)

### 3. Batch 2 of the retrofit — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Two gates, and only one is yours.** The verdict above, plus [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship)'s anchor rules — your 07:36 comment sequenced the batch-2 brief after those spec edits land. THR-1154 is agent work, claimable now, and moves without you. Parked ~35 h.

The brief will name its anchors before drafting, per your ruling that prose is written toward its chips rather than chips bolted onto finished prose. What remains after batch 1: the **camp seven** plus two sequels — roughly nine encounters.

**Nudge-card art, when it next comes up.** Batch 1 measured the gap far smaller than the corpus sweep implied — 9 dead tags, 7 with honest matches already in the library, shipped by remapping. Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

### 4. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

*— from daily-backlog-grooming.* Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 5. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-17: **the Bridge chip that connected to nothing is gone.** [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) ([PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)) — under your harder bar the fix deleted the claim rather than making it clickable. Ticket deliberately stays open: the same sweep found 65 more chips naming things the game has no object for, and sorting them needs THR-1154's vocabulary first.
- 2026-08-17: **the invisible replay control is fixed.** [THR-1152](https://linear.app/threadbare/issue/THR-1152/step-replay-on-the-aftermath-is-invisible-as-a-control-the-shipped) ([PR #1519](https://github.com/christianspliid-ui/threadbare/pull/1519)) — the 7px unlabeled dot you found this morning now reads as a control and names itself. Filed and shipped inside two hours of your play session.
- 2026-08-17: **THR-790 is off your list.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) needs a plan doc, which is a design session's job rather than yours; with the queue no longer empty, nothing about it requires you. It stays on the board as design supply.
- 2026-08-17: **the encounter factory now rolls for its premise too.** [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter) ([PR #1518](https://github.com/christianspliid-ui/threadbare/pull/1518)) — a rollable story-seed catalogue an encounter writer draws a starting premise from. With THR-1145 this completes both halves of *make the factory vary itself*.
- 2026-08-17: **the character sheet's faction is a concept now, not a string.** [THR-1149](https://linear.app/threadbare/issue/THR-1149/character-sheet-faction-name-is-plain-text-not-clickable-no-tooltip) ([PR #1517](https://github.com/christianspliid-ui/threadbare/pull/1517)) — the faction name was dead text; it now opens the faction's page, carries a tooltip, and shows its heraldry.
- 2026-08-17: **rung 6 of your palette ladder is live.** [THR-1145](https://linear.app/threadbare/issue/THR-1145/consequence-draw-reach-weighted-primitive-tables-for-the-encounter) ([PR #1516](https://github.com/christianspliid-ui/threadbare/pull/1516)) — an encounter's consequences are now drawn from reach-weighted tables instead of each one being hand-picked, so the same ending can land differently twice.
- 2026-08-17: **faction rank now reads on the scale the writers use.** [THR-1151](https://linear.app/threadbare/issue/THR-1151/three-member-ofrank-3-readers-are-dead-they-test-an-integer-threshold) ([PR #1515](https://github.com/christianspliid-ui/threadbare/pull/1515)) — three places meant to treat a senior guild member differently compared a 0–1 rank against an integer threshold, so they never fired.
- 2026-08-17: **faction standing now actually moves.** [THR-1150](https://linear.app/threadbare/issue/THR-1150/faction-reputation-gain-is-dead-in-all-shipped-content-authored) ([PR #1514](https://github.com/christianspliid-ui/threadbare/pull/1514)) — every authored consequence of the form *"your standing with the mercenary company rises"* had been silently doing nothing.
- 2026-08-17: **THR-907 is off your list — you had already ruled it.** [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) carried all four verdicts from 2026-08-10, with the prose bar sharpened 2026-08-15. Two briefs re-asked you for them in error.
- 2026-08-17: **rung 5 of your palette ladder is live.** [THR-1146](https://linear.app/threadbare/issue/THR-1146/palette-primitive-reward-draw-tag-filtered-random-item-as-a) — an ending can hand out *a blade from the strongbox* rather than always the same authored blade.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
