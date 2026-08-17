# User Action Required

**Last updated:** 2026-08-17 11:58 local (09:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The yes/no on your two batch-1 samples — [THR-1131](https://linear.app/threadbare/issue/THR-1131/retrofit-batch-1-the-slice-six-through-the-factory-line-contract-thr)

- **[The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)**
- **[The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin)**

**Now the only gate on batch 2.** [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) — the anchor catalog from your 07:36 ruling — merged 2026-08-17 11:40 local ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)), so the second gate is gone. Nine encounters ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to): camp seven + two sequels) wait on your verdict alone. Parked ~37 h.

You played the Bridge on 2026-08-17 and that sitting produced the chip-anchoring rule, the package rule and the replay-dot bug — your own [07:36 comment](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) records that as *shaping the bar, not the release*. All that remains is **worth meeting twice: yes or no**, on each. About a minute.

**Two things changed since you read it.** The chip naming a river the world does not have is **gone** rather than made clickable ([THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a), [PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)); and a plain **success** on the Bridge now renders **zero** chips — no success override is authored, so the base ending is the face. That is the honest Law 56 rendering, not a regression, and four assertions pin it.

Both ids re-verified against `main` this hour; the six are confirmed gone from `retrofitPending`, leaving only the two sequels. [All six side by side](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-08-15.md) · [PR #1494](https://github.com/christianspliid-ui/threadbare/pull/1494)

**Nudge-card art, when it next comes up.** Batch 1 measured the gap far smaller than the corpus sweep implied — 9 dead tags, 7 with honest matches already in the library, shipped by remapping. Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

### 2. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

*— from daily-backlog-grooming.* Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 3. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-17: **you ruled the acted-on taxonomy in chat — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) needs no sitting.** Your rule, verbatim: *"which parts of the game logic are bookkeeping the system does invisibly for the player, and which elements help the player tell a story of the game world and the happenings in their head … most bookkeeping we keep out of sight."* Reach-reputation is an indirect measure that spawns real happenings → invisible; a plot hook opening foreshadowing **is** a real happening → the player is told. Caveat you named: basic decision-constraining bookkeeping (what you can afford, what an action costs) stays visible, simple, minimal. The leftovers — hook expiry, who may mint one, how a write declares its class — are agent typing work under your 2026-08-12 rule, not asks.
- 2026-08-17: **prose and chips are one package, ratified.** [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)) — your 07:36 ruling is now Law 56's second clause plus an authoring anchor catalog and a package critic stage. This is what cleared batch 2's non-you gate.
- 2026-08-17: **the Bridge chip that connected to nothing is gone.** [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) ([PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)) — under your harder bar the fix deleted the claim rather than making it clickable. Ticket deliberately open: the same sweep found 65 chips naming things the game has no object for, now unblocked by the catalog above.
- 2026-08-17: **the invisible replay control is fixed.** [THR-1152](https://linear.app/threadbare/issue/THR-1152/step-replay-on-the-aftermath-is-invisible-as-a-control-the-shipped) ([PR #1519](https://github.com/christianspliid-ui/threadbare/pull/1519)) — the 7px unlabeled dot you found this morning now reads as a control and names itself. Filed and shipped inside two hours of your play session.
- 2026-08-17: **THR-790 is off your list.** [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) needs a plan doc, which is a design session's job rather than yours. It stays on the board as design supply.
- 2026-08-17: **the encounter factory now rolls for its premise too.** [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter) ([PR #1518](https://github.com/christianspliid-ui/threadbare/pull/1518)) — a rollable story-seed catalogue an encounter writer draws a starting premise from. With THR-1145 this completes both halves of *make the factory vary itself*.
- 2026-08-17: **the character sheet's faction is a concept now, not a string.** [THR-1149](https://linear.app/threadbare/issue/THR-1149/character-sheet-faction-name-is-plain-text-not-clickable-no-tooltip) ([PR #1517](https://github.com/christianspliid-ui/threadbare/pull/1517)) — the faction name was dead text; it now opens the faction's page, carries a tooltip, and shows its heraldry.
- 2026-08-17: **rung 6 of your palette ladder is live.** [THR-1145](https://linear.app/threadbare/issue/THR-1145/consequence-draw-reach-weighted-primitive-tables-for-the-encounter) ([PR #1516](https://github.com/christianspliid-ui/threadbare/pull/1516)) — an encounter's consequences are now drawn from reach-weighted tables instead of each one being hand-picked, so the same ending can land differently twice.
- 2026-08-17: **faction rank now reads on the scale the writers use.** [THR-1151](https://linear.app/threadbare/issue/THR-1151/three-member-ofrank-3-readers-are-dead-they-test-an-integer-threshold) ([PR #1515](https://github.com/christianspliid-ui/threadbare/pull/1515)) — three places meant to treat a senior guild member differently compared a 0–1 rank against an integer threshold, so they never fired.
- 2026-08-17: **faction standing now actually moves.** [THR-1150](https://linear.app/threadbare/issue/THR-1150/faction-reputation-gain-is-dead-in-all-shipped-content-authored) ([PR #1514](https://github.com/christianspliid-ui/threadbare/pull/1514)) — every authored consequence of the form *"your standing with the mercenary company rises"* had been silently doing nothing.
- 2026-08-17: **THR-907 is off your list — you had already ruled it.** [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) carried all four verdicts from 2026-08-10, with the prose bar sharpened 2026-08-15. Two briefs re-asked you for them in error.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
