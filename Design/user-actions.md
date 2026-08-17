# User Action Required

**Last updated:** 2026-08-17 21:57 local (19:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

**New this hour — your held condition is met, and it was verified rather than assumed.** You said the sample returns only when the prose re-pass and the state-first chip copy are visibly live on these two. They merged and deployed; the live site serves that build.

**The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
**The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

The bond chip now names the favour and opens the person who owes it, not you. Fifteen chips reporting numbers you cannot see are gone. The prose carries one named person on stage and objects only where you can act on them.

**The question: are these two worth meeting a second time?** Yes releases the next nine encounters; no tells the writer what the bar still misses. The ticket is parked waiting on this answer.

### 2. One attended design hour — the program has run out of designed work

Everything you directed this morning is one step back from the build queue: nobody has designed it yet, and a design pass only happens in an attended session.

**Recommendation, taken unless you veto it:** the next design session writes up [the shared machinery](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) — your acted-on ruling turned into the plan the builders work from. It is Urgent, and [wave-1 ordering](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) plus [the second-seam prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) are both queued behind it. Say *"design the shared machinery."*

[Nations and named areas](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) (High, your own direction this morning) remains a good session — say *"design nations and named areas"* and it starts there. The switch is about reach, not merit.

### 3. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Six shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 4. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

## Resolved this period

- 2026-08-17: **the lair rule that excluded itself is fixed** — [THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) ([PR #1529](https://github.com/christianspliid-ui/threadbare/pull/1529)): a lair could never spawn next to another lair because the proximity rule counted the lair itself.
- 2026-08-17: **batch 1 of the encounter retrofit shipped** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) ([PR #1528](https://github.com/christianspliid-ui/threadbare/pull/1528)): the bond chip fix, fourteen more invisible chips found by the same pattern, and the prose re-pass. This is what unblocked ask 1 above.
- 2026-08-17: **the acted-on taxonomy is settled** — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) closed. The typed-state map no longer has a question waiting on you.
- 2026-08-17: **the raw engine word is off the choice card** — [THR-1048](https://linear.app/threadbare/issue/THR-1048/the-legacy-encounter-choice-card-breaks-laws-13-and-14-15percent) ([PR #1527](https://github.com/christianspliid-ui/threadbare/pull/1527)): the stance now says what the god does, not what the enum is.
- 2026-08-17: **the publishing stoppage cleared itself** — the commit flagged at 17:00 published shortly after; the live site is current. No switch to flip.
- 2026-08-17: **"the god sways the odds" is now the game's language** — [THR-1166](https://linear.app/threadbare/issue/THR-1166/content-sweep-the-god-decides-the-god-sways-odds-and-influences) ([PR #1525](https://github.com/christianspliid-ui/threadbare/pull/1525)) swept the content from your canon correction this morning, plus a gate that keeps the distinction.
- 2026-08-17: **two silent writes fixed** — [THR-1165](https://linear.app/threadbare/issue/THR-1165/two-dollarcast-sentinels-resolve-to-nothing-at-runtime-the-caravan) ([PR #1526](https://github.com/christianspliid-ui/threadbare/pull/1526)): the caravan master's bond and the swindler's mark were claimed by chips but never written.
- 2026-08-17: **the designer view section 5 promised** — [THR-1140](https://linear.app/threadbare/issue/THR-1140/reputation-tallies-are-system-visible-with-no-designer-surface) ([PR #1524](https://github.com/christianspliid-ui/threadbare/pull/1524)) built the tally readout rather than pruning the vocabulary.
- 2026-08-17: **every chip in the game now reaches what it names** — [THR-1164](https://linear.app/threadbare/issue/THR-1164/anchor-the-corpus-sort-every-chip-that-names-a-referent-and-gate-on) ([PR #1523](https://github.com/christianspliid-ui/threadbare/pull/1523)) sorted 48 chips across 17 templates and added a gate that sees all 683 templates.
- 2026-08-17: **prose and chips are one package, ratified** — [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)) made your 07:36 ruling Law 56's second clause.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
