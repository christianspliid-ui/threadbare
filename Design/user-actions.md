# User Action Required

**Last updated:** 2026-08-18 02:57 local (00:57 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

Your held condition is met, re-verified against the live build rather than assumed: the prose re-pass and the state-first chip copy are both deployed on these two.

**The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
**The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

The bond chip now names the favour and opens the person who owes it, not you. Fifteen chips reporting numbers you cannot see are gone. The prose carries one named person on stage and objects only where you can act on them.

**The question: are these two worth meeting a second time?** Yes releases the next nine encounters; no tells the writer what the bar still misses. Blocking spec ticket THR-1129 finished 2026-08-16, so your answer is all that stands in front of it.

### 2. Rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)

An agent puts five candidates in front of you — the hunger vocabulary, the consequence chips (already rebuilt once, as the proof), region identity, mandate prose, follow-on tags — ranked against stated criteria; you rule on the order in chat. One sitting, no code. Say *"run the wave-1 sitting."*

All three background investigations are finished, so nothing is missing but the sitting. Resolving it closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) and turns it into one written plan per part plus one for the shared machinery.

[Nations and named areas](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) (High, your own direction) and [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (waiting 51 h) remain good alternatives — name either and the session starts there. Note the sitting may decide the *scope* of the nations one, so doing it first risks designing the narrow version.

### 3. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: when you commit to a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today. The visual it was built to accompany was deleted, so what is left is the pacing alone.

**The question: does committing feel better with that beat of held breath, or should the outcome land immediately?** Pure feel, no measurement settles it, which is why it is yours. Answer either way and the ticket closes — wired to the encounter veil, or retired with its constants and tests.

The ticket's other half needed no ruling and is already shipped: see the resolved entry below.

### 4. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Six shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 5. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

## Resolved this period

- 2026-08-18: **one of the two orphaned encounter sounds is retired** — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) ([PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534)): the cue meant to mark each consequence chip turned out to share no vocabulary with the chips at all, so wiring it would have played one note forever behind a passing test. Technical call, made by the lane. The pacing half is ask 3 above.
- 2026-08-18: **six encounter-screen components nothing used any more are gone** — [THR-1167](https://linear.app/threadbare/issue/THR-1167/residue-of-the-encounter-prototype-tree-after-thr-1049-three-test-only) ([PR #1533](https://github.com/christianspliid-ui/threadbare/pull/1533)): the prototype residue, and the two pieces that were not residue — those became [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) rather than being deleted quietly.
- 2026-08-17: **24 converted encounter templates now have a machine check on their pole binding** — [THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard) ([PR #1532](https://github.com/christianspliid-ui/threadbare/pull/1532)): the 24 reach trials nothing was checking.
- 2026-08-17: **four prototype components that never reached the game are gone** — [THR-1049](https://linear.app/threadbare/issue/THR-1049/prototype-disposition-encounterscreen-castrail-casttile) ([PR #1531](https://github.com/christianspliid-ui/threadbare/pull/1531)): wire-or-retire, resolved by deletion.
- 2026-08-17: **two review tools can find the avatar again** — [THR-1032](https://linear.app/threadbare/issue/THR-1032/two-debug-aftermath-accessors-cannot-see-the-ascendant-avatar) ([PR #1530](https://github.com/christianspliid-ui/threadbare/pull/1530)): re-checking before building found the fault wider than filed — the name lookup was dead for every character, not just the avatar.
- 2026-08-17: **the lair rule that excluded itself is fixed** — [THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) ([PR #1529](https://github.com/christianspliid-ui/threadbare/pull/1529)): a lair could never spawn next to another lair because the proximity rule counted the lair itself.
- 2026-08-17: **batch 1 of the encounter retrofit shipped** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) ([PR #1528](https://github.com/christianspliid-ui/threadbare/pull/1528)): the bond chip fix, fourteen more invisible chips found by the same pattern, and the prose re-pass. This is what unblocked ask 1 above.
- 2026-08-17: **the acted-on taxonomy is settled** — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) closed. The typed-state map no longer has a question waiting on you.
- 2026-08-17: **the raw engine word is off the choice card** — [THR-1048](https://linear.app/threadbare/issue/THR-1048/the-legacy-encounter-choice-card-breaks-laws-13-and-14-15percent) ([PR #1527](https://github.com/christianspliid-ui/threadbare/pull/1527)): the stance now says what the god does, not what the enum is.
- 2026-08-17: **the publishing stoppage cleared itself** — the commit flagged at 17:00 published shortly after; the live site is current. No switch to flip.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
