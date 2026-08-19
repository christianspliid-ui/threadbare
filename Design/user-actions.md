# User Action Required

**Last updated:** 2026-08-19 21:56 local (19:56 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Ten minutes to shape one encounter — [THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the)

The town you helped keeps a door open — *A Standing Welcome*, ten game days, visible on the town's page and reachable from the chip. Nobody has written what happens when you walk back in.

**The ask: one short chat where an agent drafts the brief with you** — what the return visit should be, who is there, what the welcome actually buys. Your own Factory rule puts brief approval before any prose, so this cannot start unattended. Say *"draft the brief for the Grateful Kin return visit."*

It is the smallest ask on this list and it needs only you. It also gates one other thing: the [encounter retrofit](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) is holding its two-encounter sample verdict back from you until this room exists, because The Grateful Kin's payoff currently opens onto nothing. Note the build chain is frozen meanwhile — with the implementation lanes paused (2026-08-19, your request) nothing will build against an approved brief until they resume. The brief keeps; it is ready the moment they do.

### 2. An hour of design time — three jobs are waiting for it

No queue mechanic is in the way; there is simply no attended session. This is also the group **least affected by the paused lanes** — its output is decisions, not queued work. In the order I would take them:

- **[Rank five parts of the game for rebuilding](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under)** — an agent puts five candidates in front of you (hunger vocabulary, consequence chips, region identity, mandate prose, follow-on tags), ranked against stated criteria; you rule on the order in chat. One sitting, no code. All background research is finished. Resolving it closes [the architecture map](https://linear.app/threadbare/issue/THR-1157/typed-game-state-architecture-machinery-first-wave-wayfinder-map). Say *"run the wave-1 sitting."*
- **[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** — your 6 August note: action cards are too wordy, you cannot tell what they do, and playing one gives no feedback, while encounter cards already read the way you wanted. Staged with its reading list gathered; wants an attended session.
- **[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — in design and assigned to you since Friday, untouched. Either give it the hour or say *"put Traits wave 2 back in the pile."*

Four more sit behind these whenever you want them: [the anchor prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots), [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game), and your own two asks — [nations simulated rather than drawn](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) and [the one-button snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in). The wave-1 sitting may decide the *scope* of the nations one, so designing nations first risks designing the narrow version.

### 3. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: when you commit to a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today; the visual it accompanied was deleted, so what is left is the pacing alone.

**The question: does committing feel better with that beat, or should the outcome land immediately?** Pure feel, no measurement settles it. Either answer closes the ticket — wired to the encounter veil, or retired with its constants and tests. Open 43 hours, and it closes whether or not the builders are running. The lane's recommendation: no — unskippable on every commit turns tense into waiting, and the timings stay recoverable from history.

### 4. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: nine surfaces, at least 19 screenshots. Every one is a shipped UI change that carries test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

It keeps growing as more UI work ships behind the same wall. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16 — a merge, not a prune. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 5. Image credits — who decides the spend?

**[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five scene images that break the art rule.** Ready to run whenever you say. Nothing is broken; substitutes cover those slots. It is on your page only because it spends credits.

**The question underneath it.** The opening beat's three missing plates ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) were listed here as your call for the same reason, and a lane made them anyway — taking the arm the ticket recommended, rejecting the free remap because a third of the cards would have gained nothing by it. The judgment looks right. So: **do you want image spends gated on you at all, or decided by the lane and reported after?** Your answer settles the five above and every batch after them. Until you say otherwise the lane keeps the standing rule: *remap where a match is honest, come to you only when it is not.*

### 6. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-19: **four trade cards that promised a deal and delivered nothing now deliver it** — [THR-1188](https://linear.app/threadbare/issue/THR-1188/the-four-actiongold-trade-ops-write-actor-location-a-shape-no-trades) ([PR #1563](https://github.com/christianspliid-ui/threadbare/pull/1563)): flagged as possibly needing your ruling because the cheap repair was to delete all four; the agent found the better path and the cards write real trade routes instead. Nothing was removed from the player.
- 2026-08-19: **trade links between places are declared what they are** — [THR-830](https://github.com/christianspliid-ui/threadbare/pull/1562): the link that says two places trade was declared one shape and read as another by four bits of code; the declaration is now honest and the readers repointed.
- 2026-08-19: **the opening beat stopped dealing the same picture 424 times** — [THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags) ([PR #1561](https://github.com/christianspliid-ui/threadbare/pull/1561)): three plates made — a crowd, a mercy, a blade — so the first encounter a new player sees no longer shows one clay bowl on every card. Credits spent without waiting on you; see ask 5.
- 2026-08-19: **the "design side is frozen" ask was withdrawn** — it claimed a queue rule that does not bind. What survives is ask 2 above: design needs an attended hour, not a queue change.
- 2026-08-19: **two words entered the game's dictionary** — [sphere attunement](https://github.com/christianspliid-ui/threadbare/pull/1558) and [repertoire](https://github.com/christianspliid-ui/threadbare/pull/1559): glossary entries for mechanics that already shipped. Nothing changed on screen.
- 2026-08-19: **a place you read about can now be opened** — [THR-1173](https://linear.app/threadbare/issue/THR-1173/location-link-tier-is-capability-complete-but-unexercised-no-shipped) ([PR #1557](https://github.com/christianspliid-ui/threadbare/pull/1557)): a chip now names a place and opens it.
- 2026-08-19: **earning essence in a sphere now deepens your deck in it** — [THR-1180](https://linear.app/threadbare/issue/THR-1180/sphere-attunement-essenceearnedbysphere-counter-sphere-attunement) ([PR #1556](https://github.com/christianspliid-ui/threadbare/pull/1556)): a fourth way a nudge card can unlock, keyed to what you have spent yourself on.
- 2026-08-19: **every nudge card now does something when you play it** — [THR-1179](https://linear.app/threadbare/issue/THR-1179/nudge-card-mechanics-build-every-card-type-whose-library-status-is-not) ([PR #1555](https://github.com/christianspliid-ui/threadbare/pull/1555)): Whisper, Undertow and Stumble were the last three types with a written face and no mechanic. The deck is complete.
- 2026-08-18: **a god who pulls threads, not furniture** — [THR-1178](https://linear.app/threadbare/issue/THR-1178/nudge-library-completion-sphere-expressive-guidance-authored-card) ([PR #1553](https://github.com/christianspliid-ui/threadbare/pull/1553)): your afternoon note that "physics of the scene" was too narrow. Nudge guidance now reads *influence, never authorship*.
- 2026-08-18: **the favour a town could never repay** — [THR-1175](https://linear.app/threadbare/issue/THR-1175/a-town-cannot-owe-a-social-favour-favor-creation-with-a-non-person) ([PR #1551](https://github.com/christianspliid-ui/threadbare/pull/1551)): your 18:34 finding, fixed and deployed within four hours. It is a standing welcome on the town now — which is what ask 1 exists to pay off.

---

*Older resolved entries and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.*
*The hourly brief that leads with one ask: `git show origin/ops:Design/briefing.md`.*
