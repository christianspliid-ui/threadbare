# Action Proposal — 2026-10-03-thr-1715-the-first-asks

## intent_quote

There is no live user in this run (unattended design lane, tb-design-lane run 2026-10-03c). The originating intent is the ticket, filed from cold playtest round 2, quoted verbatim:

> "The outcome is agreed: the store page's "when the moment matters you whisper". The *how* is a design call."

> "**Recommended direction:** The First defaults to `pause`. Her story-weight encounters stop and ask. Chores never enter the Ledger as chapters. The ledger badge counts only chapters waiting on the player."

> "## Fixed when — No round-3 tester finds a story chapter of The First's that resolved without them. Implementation tickets go into this milestone."

Tester quotes carried by the ticket:

> Story (quit point): "I'd chosen to be her god, and the game lived her life without me." … "make the main screen pause and ask me at those moments."

> Skimmer (quit point): "Aldric resolved 14 'chapters' by herself in seconds ('Mend Equipment,' 'Forage for Provisions'), so I felt like a spectator reading a log." … "put me into one within 60 seconds, make them the main loop instead of something the simulation interrupts."

The delegation basis is Christian's ruling of 2026-09-25, recorded in the design-lane skill: "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations". Process.md rule 4: the *how* of an agreed design is the agent's.

## scope (what this plan does)

The plan makes The First's story chapters stop the world and ask the player, by default. Her thread is born `pause`, and pause-mode shaping steps notify without a tug (enacting UI Law 39). Chores, meaning raw encounters authored `threatRating: 'trivial'` and flagged `routine`, are removed from notifications, from the Ledger's default view and from the badge, and stay reachable under a Daily-life filter. The Auto/Pause toggle is repaired: it reaches pause for The First, repaints, gives rejection feedback, and its never-charged cost becomes 0. A per-mortal story breath (24 turns after a pause-mode mortal's story chapter ends) keeps the halts from becoming a drumbeat.

## scope (what this plan does NOT do — explicit non-goals)

- It does not re-tier the attention matrix or the raw corpus's `intrinsicTier`.
- It does not change any watched or retinue mortal's behaviour unless the player sets that thread to pause.
- It does not hold or queue UnifiedActions; actions still advance in the tick pipeline. Only the clock halts, through the existing interrupt registry.
- It does not fix the encounter cache's flattened threat (`RARITY_TO_THREAT[1]`); that is reported as a side finding.
- It does not design the threading ceremony (THR-1644) or the first-ten-minutes onboarding (THR-1716).
- It does not fix "Your nudge left…" copy on untouched chapters (THR-1708).
- It adds no new encounter content.

## impact_class

Reversible. It touches defaults, an optional template flag, an optional edge property, one filter stage and UI copy. Each is one revert. Old saves keep their explicit modes.

## evidence cited

- **Linear issue:** THR-1715
- **Vision premises invoked:** `Vision/01-core-loop.md` ("Time stops for every moment"; the cadence/drumbeat paragraph), `Vision/00-north-star.md` (one complex story at a time), `Vision/taste-profile.md` (clock halts for an encounter, a choice, the Chapter Ledger)
- **UL terms touched:** Chapter Ledger (one-line amendment: routine excluded from the default view), Follow (unchanged; noted that bond-follow already interrupts undertaking moments), Thread. New display term "Daily life" is copy only; no new UL term is proposed.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/design-governance.md`, `Docs/design-system/laws.md` (Laws 1, 13/14, 17, 21, 33, 37, 39, 40, 42, 47, 49, 51, 52, 55), `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1605-the-opening.md` (clock model, interrupt registry, unread badge S5), `Docs/plans/2026-04-05-attention-tier-model-design.md` (tiers, preserved)
- **Rejected approaches considered and dismissed:** queueing actions; a wall-clock halt cap; re-tiering the corpus; a hand chore list; a "waiting" badge (all in the brainstorm companion)
- **Census evidence:** `Docs/audits/2026-09-25-living-world-data/readers/first-chapters.ts` and its output JSON (seeds 42/99/7, 150 turns)

## load-bearing decisions touched

- **Relationships are edges, not property fields:** respected. `lastStoryChapterEndTick` is relationship-internal data on the existing thread edge, not a relationship encoded as an id.
- **No inventing node types:** respected. There are no new node or edge types.
- **World graph mutated in place, so never key on identity:** this is the root of the toggle's dead repaint. The plan adds the missing `touchWorld()`.
- **Engine caches owned per session:** not touched.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (hundreds of importers): one optional field.
- `src/types/influence.ts` (high): one optional property.
- The plan has a Blast Radius section.

## kill criteria

- The census after build shows any auto-resolving step notification for a First story chapter, or halting chapters outside 5–8 per 150 turns after tuning the breath within 12–36. Then the mechanism is wrong; reopen the design.
- Round-3 cold testers report The First's moments as too frequent ("it keeps stopping") or report a story chapter resolved without them. Then retune the breath, or revisit the classification (C2 audit).
- If chores turn out to carry consequences players need to see as chapters, drop U2's default filter.

## explicit user sign-off

N/A. Reversible class; delegated under process.md rule 4 with a 24-hour veto window (`Claimable from:` on the issue).

## author notes for the judge

- The ticket's literal recommendation (default pause) was measured and found to do nothing on its own, because The First's chapters are all shaping tier and shaping needs an attended tug. The plan's E3b (pause admits without a tug) is what makes the default real. Law 39 already says pause tier interrupts every beat, so E3b aligns code with canon.
- The breath is the call most open to taste. It is justified by the core loop's anti-drumbeat paragraph and by a measured 6–8-turn story cadence at 1 s/turn. It is not requested by the ticket. It is flagged as a veto-able call.
- Badge semantics deviate from the ticket's third bullet, with reasoning (a waiting chapter is already on screen).
- The toggle cost going to 0 is a small product call, justified by Law 51 and by the charge never having fired.
- I am uncertain whether every one of the 34 trivial entries reads as a chore; the C2 audit in the build PR covers that.
