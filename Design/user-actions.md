# User Action Required

**Last updated:** 2026-08-17 13:00 local (11:00 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Six shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 2. HELD by your own ruling — the yes/no on your two batch-1 samples

**Nothing to do right now.** At 10:06 local on 2026-08-17 you ruled on [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to): *"hold the verdict on encounters until this is fixed."* [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) is Done; [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) is not — only the single Bridge chip is fixed, and the 65-chip sweep plus its gate are still queued.

The 11:58 brief on 2026-08-17 asked you for this verdict anyway and pinged you about it. That was an error against your explicit instruction; the ask is withdrawn until the condition you set is met. It returns **once**, with fresh `?spawn=` links to the corrected endings on the deployed build, when THR-1153 lands. Nine encounters ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to): camp seven + two sequels) wait behind it, and that chain is moving without you.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

### 3. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-17: **you ruled the acted-on taxonomy in chat** — bookkeeping stays out of sight, a plot hook that opens foreshadowing is told to the player, decision-constraining costs stay visible and minimal. *Correction: the 11:58 brief said this was recorded on [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions); it was not, and getting it onto the ticket is an agent's job.*
- 2026-08-17: **prose and chips are one package, ratified** — [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)) made your 07:36 ruling Law 56's second clause, with an authoring anchor catalog and a package critic stage.
- 2026-08-17: **the Bridge chip that connected to nothing is gone** — [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) ([PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)) deleted the claim rather than making it clickable; the ticket stays open for the other 65.
- 2026-08-17: **the invisible replay control is fixed** — [THR-1152](https://linear.app/threadbare/issue/THR-1152/step-replay-on-the-aftermath-is-invisible-as-a-control-the-shipped) ([PR #1519](https://github.com/christianspliid-ui/threadbare/pull/1519)) turned the 7px unlabeled dot you found into a control that names itself.
- 2026-08-17: **THR-790 is off your list** — [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) needs a plan doc, which is a design session's job rather than yours.
- 2026-08-17: **the encounter factory now rolls for its premise too** — [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter) ([PR #1518](https://github.com/christianspliid-ui/threadbare/pull/1518)) gives an encounter writer a rollable story-seed catalogue to draw a premise from.
- 2026-08-17: **the character sheet's faction is a concept now, not a string** — [THR-1149](https://linear.app/threadbare/issue/THR-1149/character-sheet-faction-name-is-plain-text-not-clickable-no-tooltip) ([PR #1517](https://github.com/christianspliid-ui/threadbare/pull/1517)) gave it a page, a tooltip and its heraldry.
- 2026-08-17: **rung 6 of your palette ladder is live** — [THR-1145](https://linear.app/threadbare/issue/THR-1145/consequence-draw-reach-weighted-primitive-tables-for-the-encounter) ([PR #1516](https://github.com/christianspliid-ui/threadbare/pull/1516)) draws an encounter's consequences from reach-weighted tables, so the same ending can land differently twice.
- 2026-08-17: **faction rank now reads on the scale the writers use** — [THR-1151](https://linear.app/threadbare/issue/THR-1151/three-member-ofrank-3-readers-are-dead-they-test-an-integer-threshold) ([PR #1515](https://github.com/christianspliid-ui/threadbare/pull/1515)) fixed three places that compared a 0–1 rank against an integer threshold and so never fired.
- 2026-08-17: **faction standing now actually moves** — [THR-1150](https://linear.app/threadbare/issue/THR-1150/faction-reputation-gain-is-dead-in-all-shipped-content-authored) ([PR #1514](https://github.com/christianspliid-ui/threadbare/pull/1514)) made every authored *"your standing rises"* consequence do something.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
