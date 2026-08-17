# User Action Required

**Last updated:** 2026-08-17 15:59 local (13:59 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. The slice review session — released, [THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game)

Play the five-encounter slice on the deployed build and rule on four verdicts: **prose**, **firing**, **UI**, **game**. (Consequence was split out by your 2026-08-02 ruling.) "Needs another iteration" is a valid ruling.

- [The Unsafe Bridge](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [The Grateful Kin](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [free play, everything firing](https://threadbare.vercel.app/?view=game&seeded&size=medium&forceencounters)

Your 2026-08-17 10:06 hold is discharged: the Bridge chip was deleted ([PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520)), the Grateful Kin chips anchored ([PR #1523](https://github.com/christianspliid-ui/threadbare/pull/1523)), the site serves that commit (`60084988`), and the anchor gate is clean across all 683 templates. Machine-verified on the served commit; no human has looked at the screen yet.

The **batch-1 sample verdict** rides the same sitting — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), 2 of 6, nine encounters queued behind it, parked 41 hours on exactly this.

### 2. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Six shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 3. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

## Resolved this period

- 2026-08-17: **the dormant-hook question went back to the design lane** — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions): your call that it needs a technical definition before you rule. Off your list until that proposal exists; your wording is on the ticket.
- 2026-08-17: **every chip in the game now reaches what it names** — [THR-1164](https://linear.app/threadbare/issue/THR-1164/anchor-the-corpus-sort-every-chip-that-names-a-referent-and-gate-on) ([PR #1523](https://github.com/christianspliid-ui/threadbare/pull/1523)) sorted 48 chips across 17 templates and added a gate that sees all 683 templates, not just the encounter prefix. This released your slice review.
- 2026-08-17: **a chip can now reach what it names** — [THR-1153](https://linear.app/threadbare/issue/THR-1153/a-law-56-backed-chip-whose-backing-the-player-cannot-reach-is-still-a) ([PR #1522](https://github.com/christianspliid-ui/threadbare/pull/1522)) closed: the noun that names an anchor opens it.
- 2026-08-17: **prose and chips are one package, ratified** — [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)) made your 07:36 ruling Law 56's second clause, with an authoring anchor catalog and a package critic stage.
- 2026-08-17: **the Bridge chip that connected to nothing is gone** — [PR #1520](https://github.com/christianspliid-ui/threadbare/pull/1520) deleted the claim rather than making it clickable.
- 2026-08-17: **the invisible replay control is fixed** — [THR-1152](https://linear.app/threadbare/issue/THR-1152/step-replay-on-the-aftermath-is-invisible-as-a-control-the-shipped) ([PR #1519](https://github.com/christianspliid-ui/threadbare/pull/1519)) turned the 7px unlabeled dot you found into a control that names itself.
- 2026-08-17: **THR-790 is off your list** — [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) needs a plan doc, which is a design session's job rather than yours.
- 2026-08-17: **the encounter factory now rolls for its premise too** — [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter) ([PR #1518](https://github.com/christianspliid-ui/threadbare/pull/1518)) gives an encounter writer a rollable story-seed catalogue to draw a premise from.
- 2026-08-17: **the character sheet's faction is a concept now, not a string** — [THR-1149](https://linear.app/threadbare/issue/THR-1149/character-sheet-faction-name-is-plain-text-not-clickable-no-tooltip) ([PR #1517](https://github.com/christianspliid-ui/threadbare/pull/1517)) gave it a page, a tooltip and its heraldry.
- 2026-08-17: **rung 6 of your palette ladder is live** — [THR-1145](https://linear.app/threadbare/issue/THR-1145/consequence-draw-reach-weighted-primitive-tables-for-the-encounter) ([PR #1516](https://github.com/christianspliid-ui/threadbare/pull/1516)) draws an encounter's consequences from reach-weighted tables, so the same ending can land differently twice.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
