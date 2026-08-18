# User Action Required

**Last updated:** 2026-08-18 12:58 local (10:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

Your held condition is met, re-verified against the live build each run rather than assumed: the prose re-pass and the state-first chip copy are both deployed on these two, and every commit since that publish touched other parts of the game.

**The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
**The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

The bond chip now names the favour and opens the person who owes it, not you. Fifteen chips reporting numbers you cannot see are gone. The prose carries one named person on stage and objects only where you can act on them.

**The question: are these two worth meeting a second time?** Yes releases the next nine encounters; no tells the writer what the bar still misses. The blocking spec ticket finished 2026-08-16 and batch 1 shipped the same day, so your answer is all that stands in front of it.

### 2. Three missing pictures on the opening beat — [THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)

Every nudge card in every Meet-The-First hand shows the same picture — wisps settling over a plain clay bowl. All 424 cards. They were written for three different images (a crowd, a mercy, a blade) and none of the three was ever made, so the game quietly falls back to one stand-in for all of them. [Open the route and see it](https://threadbare.vercel.app/?view=game&firstunmet&size=medium).

**The question: make the three plates, or reuse near-misses?** Making them spends image-generation credits, which is why it is yours rather than the builder's. Reusing is free and same-day, but one of the three lands back on the stand-in it already shows, so a third of the cards gain nothing.

Nothing is blocked on the answer — the builder has other work. It is on the list because it is the game's first impression. Found while fixing the same defect one layer down (see the resolved entries below).

### 3. Rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)

An agent puts five candidates in front of you — the hunger vocabulary, the consequence chips (already rebuilt once, as the proof), region identity, mandate prose, follow-on tags — ranked against stated criteria; you rule on the order in chat. One sitting, no code. Say *"run the wave-1 sitting."*

All three background investigations are finished, so nothing is missing but the sitting. Resolving it closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) and turns it into one written plan per part plus one for the shared machinery.

This remains the only ask that supplies *new* feature work. Reading the old backlog properly keeps putting repair jobs on the shelf, so the builder has work for the next few hours — but that drains a backlog rather than filling one.

[Nations and named areas](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) (High, your own direction) and [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (waiting ~4 days in design) remain good alternatives — name either and the session starts there. Note the sitting may decide the *scope* of the nations one, so doing it first risks designing the narrow version.

### 4. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: when you commit to a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today. The visual it was built to accompany was deleted, so what is left is the pacing alone.

**The question: does committing feel better with that beat of held breath, or should the outcome land immediately?** Pure feel, no measurement settles it, which is why it is yours. Answer either way and the ticket closes — wired to the encounter veil, or retired with its constants and tests. The overnight lane's recommendation, if you want one: no — unskippable on every commit turns tense into waiting, and the timings stay recoverable from history.

The ticket's other half needed no ruling and is already shipped: see the resolved entries below.

### 5. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: nine surfaces, at least 19 screenshots. Every one is a shipped UI change that carries test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

It keeps growing — five passes on 2026-08-16, nine now, as more UI work ships behind the same wall. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 6. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.* That rule just ran to completion on the encounter cards — 42 re-pointed where an honest match existed — and it is what surfaced ask 2, where no honest match exists for two of the three.

**Five quarantined scene images** — [THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) is ready to run but spends image credits, so it is held rather than queued. Nothing is broken; substitutes cover those slots. Say the word whenever you want it run.

## Resolved this period

- 2026-08-18: **42 card pictures that named nothing now point at real ones** — [THR-1052](https://linear.app/threadbare/issue/THR-1052/27-card-imagetags-across-13-shipped-encounters-name-no-image-library): re-pointed where an honest match existed, plus a guard so the class cannot silently recur. Filed at 27, found to be 42 on inspection. It is what turned up ask 2 above.
- 2026-08-18: **the equipment follow-on is already done** — [THR-1169](https://linear.app/threadbare/issue/THR-1169/stat-contribution-migration-the-effect-primitive-exerciser-block-and) ([PR #1541](https://github.com/christianspliid-ui/threadbare/pull/1541)): the items yesterday's job deliberately left out are now sorted into the ones that prove the machinery and the ones that are real gear. Filed and closed inside two hours, no ruling needed.
- 2026-08-18: **fifty-seven pieces of equipment now actually make their bearer more capable** — [THR-745](https://linear.app/threadbare/issue/THR-745/extend-stat-contribution-migration-to-the-remaining-reward-catalog) ([PR #1540](https://github.com/christianspliid-ui/threadbare/pull/1540)): weapons, relics and tomes whose whole point was to make you better at something were carrying no such effect. Already-agreed work, no ruling needed.
- 2026-08-18: **rivals now notice you gradually instead of all at once** — [THR-963](https://linear.app/threadbare/issue/THR-963/detection-pressure-is-fed-essence-costs-123-on-a-0-1-clamped-scale-so) ([PR #1539](https://github.com/christianspliid-ui/threadbare/pull/1539)): the ladder between "unnoticed" and "hunted" had no middle rung, so pressure was priced in the wrong currency and every step read as maximum. Already-agreed work, no ruling needed.
- 2026-08-18: **one of the two orphaned encounter sounds is retired** — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) ([PR #1534](https://github.com/christianspliid-ui/threadbare/pull/1534)): the cue meant to mark each consequence chip shared no vocabulary with the chips at all, so wiring it would have played one note forever behind a passing test. Technical call, made by the lane. The pacing half is ask 4 above.
- 2026-08-18: **six encounter-screen components nothing used any more are gone** — [THR-1167](https://linear.app/threadbare/issue/THR-1167/residue-of-the-encounter-prototype-tree-after-thr-1049-three-test-only) ([PR #1533](https://github.com/christianspliid-ui/threadbare/pull/1533)): the prototype residue, and the two pieces that were not residue became [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) rather than being deleted quietly.
- 2026-08-17: **24 converted encounter templates now have a machine check on their pole binding** — [THR-1091](https://linear.app/threadbare/issue/THR-1091/converted-reach-specific-templates-have-no-polarity-guard) ([PR #1532](https://github.com/christianspliid-ui/threadbare/pull/1532)): the 24 reach trials nothing was checking.
- 2026-08-17: **four prototype components that never reached the game are gone** — [THR-1049](https://linear.app/threadbare/issue/THR-1049/prototype-disposition-encounterscreen-castrail-casttile) ([PR #1531](https://github.com/christianspliid-ui/threadbare/pull/1531)): wire-or-retire, resolved by deletion.
- 2026-08-17: **two review tools can find the avatar again** — [THR-1032](https://linear.app/threadbare/issue/THR-1032/two-debug-aftermath-accessors-cannot-see-the-ascendant-avatar) ([PR #1530](https://github.com/christianspliid-ui/threadbare/pull/1530)): re-checking before building found the fault wider than filed — the name lookup was dead for every character, not just the avatar.
- 2026-08-17: **the lair rule that excluded itself is fixed** — [THR-995](https://linear.app/threadbare/issue/THR-995/adjacent-lair-spawning-is-unreachable-a-lair-is-always-too-close-to) ([PR #1529](https://github.com/christianspliid-ui/threadbare/pull/1529)): a lair could never spawn next to another lair because the proximity rule counted the lair itself.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
