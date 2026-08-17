# User Action Required

**Last updated:** 2026-08-17 08:54 local (06:54 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Sample 2 of 6 from Batch 1 — [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)

Your ruling 6: you sample two encounters per batch. Batch 1 shipped 2026-08-15. Re-checked against `main` this hour — both ids resolve, and the site serves `74240e02`, the current tip.

- **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**
- **[The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)**

These two because your own [THR-974](https://linear.app/threadbare/issue/THR-974/consequence-verdict-session-christian-rules-on-world-graph-consequence) rewrites targeted them, run back through the factory with those 10 rewrites as the critic's validation reference rather than verbatim text — your amendment when you approved the brief. So they read hardest on whether the plainness re-register landed in the writing, not just the spec.

[All six side by side](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-08-15.md) · [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)

### 2. Batch 2 of the retrofit — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**Sequenced behind ask 1, and there is nothing to approve until it lands.** Ruling 2 gates a batch behind an approved brief, and the ticket names your sample verdicts as *"direct input to the retrofit bar"* — drafting batch 2's brief first would pre-empt the feedback it exists to absorb.

Its other blocker, the amended spec ([THR-1129](https://linear.app/threadbare/issue/THR-1129/encounter-factory-ruling-9-sitting-fable-drafts-the-amended-nudge)), closed 2026-08-16. Your verdict is the only thing left holding it. What remains after batch 1: the **camp seven** plus two sequels — roughly nine encounters.

**Nudge-card art, when it next comes up.** Batch 1 measured the gap far smaller than the corpus sweep implied — 9 dead tags, 7 with honest matches already in the library, shipped by remapping. Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

### 3. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

*— from daily-backlog-grooming.* Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 4. An attended design session for [THR-790 — Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

*— from tb-orchestrator.* The longest-waiting agreed item on the board: created 2026-07-26 as part of the Traits program you settled that same day, blocker `Done` since then, still without a plan doc 22 days later.

What it lacks is design finalization, and that needs you in the room — location traits, artifact traits, and draw-by-trait pools. Its sibling [THR-791 (wave 3)](https://linear.app/threadbare/issue/THR-791/traits-wave-3-minting-identity-god-earned-traits-relationship-traits) is blocked on the identical gap and clears once this lands a plan doc, so the session buys two tickets, not one. As of 2026-08-17 it is also the readiest way to refill an empty build queue.

### 5. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-17: **the encounter factory now rolls for its premise too.** [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter) ([PR #1518](https://github.com/christianspliid-ui/threadbare/pull/1518)) — a rollable story-seed catalogue an encounter writer draws a starting premise from. With THR-1145 this completes both halves of *make the factory vary itself*.
- 2026-08-17: **the character sheet's faction is a concept now, not a string.** [THR-1149](https://linear.app/threadbare/issue/THR-1149/character-sheet-faction-name-is-plain-text-not-clickable-no-tooltip) ([PR #1517](https://github.com/christianspliid-ui/threadbare/pull/1517)) — the faction name was dead text; it now opens the faction's page, carries a tooltip, and shows its heraldry.
- 2026-08-17: **rung 6 of your palette ladder is live.** [THR-1145](https://linear.app/threadbare/issue/THR-1145/consequence-draw-reach-weighted-primitive-tables-for-the-encounter) ([PR #1516](https://github.com/christianspliid-ui/threadbare/pull/1516)) — an encounter's consequences are now drawn from reach-weighted tables instead of each one being hand-picked, so the same ending can land differently twice.
- 2026-08-17: **faction rank now reads on the scale the writers use.** [THR-1151](https://linear.app/threadbare/issue/THR-1151/three-member-ofrank-3-readers-are-dead-they-test-an-integer-threshold) ([PR #1515](https://github.com/christianspliid-ui/threadbare/pull/1515)) — three places meant to treat a senior guild member differently compared a 0–1 rank against an integer threshold, so they never fired.
- 2026-08-17: **faction standing now actually moves.** [THR-1150](https://linear.app/threadbare/issue/THR-1150/faction-reputation-gain-is-dead-in-all-shipped-content-authored) ([PR #1514](https://github.com/christianspliid-ui/threadbare/pull/1514)) — every authored consequence of the form *"your standing with the mercenary company rises"* had been silently doing nothing.
- 2026-08-17: **THR-907 is off your list — you had already ruled it.** [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) carried all four verdicts from 2026-08-10, with the prose bar sharpened 2026-08-15. Two briefs re-asked you for them in error.
- 2026-08-17: **rung 5 of your palette ladder is live.** [THR-1146](https://linear.app/threadbare/issue/THR-1146/palette-primitive-reward-draw-tag-filtered-random-item-as-a) — an ending can hand out *a blade from the strongbox* rather than always the same authored blade.
- 2026-08-17: **rung 4 of your palette ladder is live.** [THR-1144](https://linear.app/threadbare/issue/THR-1144/palette-primitive-membership-change-join-leave-and-rank-in-a-faction) — one person joining, leaving, or rising in a faction: recruitments, expulsions, defections, promotions.
- 2026-08-16: **your morning play session became four tickets, and all four have shipped.** [THR-1136](https://linear.app/threadbare/issue/THR-1136/aftermath-screen-corner-chrome-removal-step-replay-from-the-ending), [THR-1137](https://linear.app/threadbare/issue/THR-1137/compulsion-premonition-the-gods-will-loops-every-tick-no-pending-gate), [THR-1139](https://linear.app/threadbare/issue/THR-1139/premonition-modal-shows-no-portrait-of-the-mortal-add-entityvisual) and [THR-1138](https://linear.app/threadbare/issue/THR-1138/character-sheet-faction-section-prints-a-raw-percentage-62percent), where faction standing now reads as a word instead of `62%`.
- 2026-08-16: **rungs 2 and 3 of your palette ladder are live.** [THR-1142](https://linear.app/threadbare/issue/THR-1142/palette-primitive-agent-relocation-encounters-can-send-people) — encounters can send people somewhere — and [THR-1143](https://linear.app/threadbare/issue/THR-1143/palette-primitive-location-conditions-timed-readable-states-on-places) — timed states on places, a pass closed for the season, a festival, a plague scare.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
