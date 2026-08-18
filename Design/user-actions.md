# User Action Required

**Last updated:** 2026-08-18 21:56 local (19:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Ten minutes to shape one encounter — [THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the)

The town you helped now keeps a door open — *A Standing Welcome*, ten game days, visible on the town's page and reachable from the chip. Nobody has written what happens when you walk back in.

**The ask: one short chat where an agent drafts the brief with you** — what the return visit should be, who is there, what the welcome actually buys. Your own Factory rule puts brief approval before any prose, and no brief exists yet, so this cannot start unattended. Say *"draft the brief for the Grateful Kin return visit."*

Smallest ask on this list, longest chain behind it: return visit → payoff real → the sample verdict you have been holding → batch 2's nine encounters. The verdict is held by the lane, not by you — asking *"worth meeting twice?"* while the payoff opens onto an unwritten room would earn a no it has not earned.

### 2. Rank five parts of the game for rebuilding — [the wave-1 sitting](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)

An agent puts five candidates in front of you — the hunger vocabulary, the consequence chips (already rebuilt once, as the proof), region identity, mandate prose, follow-on tags — ranked against stated criteria; you rule on the order in chat. One sitting, no code. Say *"run the wave-1 sitting."*

All three background investigations are finished, so nothing is missing but the sitting. Resolving it closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map) and turns it into one written plan per part plus one for the shared machinery. Still the largest-leverage ask here — no longer the one holding the pipeline up, since four feature jobs landed on the shelf on 2026-08-18.

[Nations and named areas](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) (High, your own direction) and [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) remain good alternatives — name either and the session starts there. Note the sitting may decide the *scope* of the nations one, so doing it first risks designing the narrow version.

### 3. Spending image credits — three missing plates, and five quarantined ones

**[THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags) — the opening beat.** Every nudge card in every Meet-The-First hand shows the same picture, wisps settling over a plain clay bowl. All 424 cards. They were written for three different images (a crowd, a mercy, a blade) and none was ever made. [Open the route and see it](https://threadbare.vercel.app/?view=game&firstunmet&size=medium). **Make the three, or reuse near-misses?** Reusing is free and same-day, but one of the three lands back on the stand-in it already shows, so a third of the cards gain nothing.

**[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five scene images that break the art rule.** Ready to run whenever you say. Nothing is broken; substitutes cover those slots.

Both are yours only because they spend credits. Nothing is blocked on either. Standing rule the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not* — which is exactly what surfaced the first one.

### 4. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: when you commit to a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today; the visual it accompanied was deleted, so what is left is the pacing alone.

**The question: does committing feel better with that beat, or should the outcome land immediately?** Pure feel, no measurement settles it. Either answer closes the ticket — wired to the encounter veil, or retired with its constants and tests. The lane's recommendation: no — unskippable on every commit turns tense into waiting, and the timings stay recoverable from history.

This is the second half of the ticket. The first half — a cue meant to mark each consequence chip, which turned out to share no vocabulary with the chips at all — was a technical call and the lane retired it on 2026-08-18.

### 5. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: nine surfaces, at least 19 screenshots. Every one is a shipped UI change that carries test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

It keeps growing — five passes on 2026-08-16, nine now, as more UI work ships behind the same wall. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 6. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-18: **the guard that would have caught your favour bug** — [THR-1177](https://linear.app/threadbare/issue/THR-1177/edge-integrity-the-enforce-now-package-validate-at-the-two-generic) ([PR #1552](https://github.com/christianspliid-ui/threadbare/pull/1552)): the two places that write links between things now check what they are joining, so a debt owed by a town is refused at the point of writing rather than found by you in play.
- 2026-08-18: **the favour a town could never repay** — [THR-1175](https://linear.app/threadbare/issue/THR-1175/a-town-cannot-owe-a-social-favour-favor-creation-with-a-non-person) ([PR #1551](https://github.com/christianspliid-ui/threadbare/pull/1551)): your 18:34 finding, fixed and deployed within four hours. It was worse than reported — the debt was uncollectable by construction, headed for a silent sweep a week later. It is a standing welcome on the town now.
- 2026-08-18: **a company can now actually break up over a betrayal** — [THR-1174](https://linear.app/threadbare/issue/THR-1174/dissolutionreason-betrayal-has-a-consumer-and-no-producer-a-company) ([PR #1549](https://github.com/christianspliid-ui/threadbare/pull/1549)): the ending existed in the telling but nothing could cause it, so the betrayal scene had no way to end the company it broke. It has a producer now, and its own parting words.
- 2026-08-18: **a chip promised grief the game could not feel** — [THR-1171](https://linear.app/threadbare/issue/THR-1171/apotheosis-attaches-traitconditiongrieving-which-is-not-a-defined) ([PR #1548](https://github.com/christianspliid-ui/threadbare/pull/1548)): Apotheosis told you a companion would be left grieving, but no such state existed. Grief is now defined, and the sweep that catches this class was widened past cards.
- 2026-08-18: **the company drama is complete, four scenes of four** — [THR-733](https://linear.app/threadbare/issue/THR-733/company-drama-content-sweep-leadership-dispute-romance-betrayal) ([PR #1547](https://github.com/christianspliid-ui/threadbare/pull/1547)): "The Quiet Offer" lands the betrayal, joining the sacrifice, the leadership dispute and the romance.
- 2026-08-18: **the underlines you flagged at lunchtime now answer** — [THR-1172](https://linear.app/threadbare/issue/THR-1172/finish-the-entity-reference-contract-an-underline-must-earn-itself) ([PR #1546](https://github.com/christianspliid-ui/threadbare/pull/1546)): filed from your chat report, merged and deployed within two hours. *A favour owed* explains on hover and opens the debtor on click; a word that cannot answer no longer gets styled at all.
- 2026-08-18: **42 card pictures that named nothing now point at real ones** — [THR-1052](https://linear.app/threadbare/issue/THR-1052/27-card-imagetags-across-13-shipped-encounters-name-no-image-library): re-pointed where an honest match existed, plus a guard so the class cannot silently recur. Filed at 27, found to be 42 on inspection. It is what turned up ask 3 above.
- 2026-08-18: **the equipment follow-on is already done** — [THR-1169](https://linear.app/threadbare/issue/THR-1169/stat-contribution-migration-the-effect-primitive-exerciser-block-and) ([PR #1541](https://github.com/christianspliid-ui/threadbare/pull/1541)): the items yesterday's job deliberately left out are now sorted into the ones that prove the machinery and the ones that are real gear.
- 2026-08-18: **fifty-seven pieces of equipment now actually make their bearer more capable** — [THR-745](https://linear.app/threadbare/issue/THR-745/extend-stat-contribution-migration-to-the-remaining-reward-catalog) ([PR #1540](https://github.com/christianspliid-ui/threadbare/pull/1540)): weapons, relics and tomes whose whole point was to make you better at something were carrying no such effect.
- 2026-08-18: **rivals now notice you gradually instead of all at once** — [THR-963](https://linear.app/threadbare/issue/THR-963/detection-pressure-is-fed-essence-costs-123-on-a-0-1-clamped-scale-so) ([PR #1539](https://github.com/christianspliid-ui/threadbare/pull/1539)): the ladder between "unnoticed" and "hunted" had no middle rung, so every step read as maximum.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
