# Action proposal — Words teach themselves by something changing (THR-1980)

## intent_quote

The originating ask is the Linear issue THR-1980, filed by the cold-playtest lane from round 4 (Christian's lane; the issue's design question is the ask):

> **Design question.** Which ten words must a new player learn in the first fifteen minutes, where does each one teach itself (by something visibly changing, not by a tooltip), and which of the rest stay hidden until they first matter?

> **Fixed when** at most one round-5 tester lists any of: the sphere pour, the odds legend, Fated, Attention, Dominion, Elder powers, or Chronicle tier jargon under "never understood".

> **Done when** this ticket's implementation tickets are filed into this milestone (*Cold playtest · round 4*) and this ticket is closed by the design pass.

The lane's authority: Christian, 2026-09-25 (THR-1611): *"I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations."* A cold-playtest finding with a design-pass Done-when is agreed work (precedents THR-1807, THR-1982).

## scope (what this plan does)

Answers the ten-word question with a table, and specifies two build slices. S1 makes the pour and the odds visibly readable: a refill-speed word and rung on each essence row and live on the pour screen (from the already-computed, unread `computeEssenceIncome`), a one-sentence odds legend naming the ladder worst to best, "still {Tier}" / "close to {Next}" on within-tier moves, and the full pip ladder in the card legend. S2 keeps later words out of the way until they matter: a first-use caption primitive (one visible line per panel until hovered, used or dismissed; max two at once; Law 51 store), Attention re-timed to the first chapter, Dominion added to the reveal table on the *A path opens* gift, the Chronicle gated to threaded mortals for tier-ups and critical successes with player prose free of tier numbers and `Q`, and "Let it stand" reworded to "Go on".

## scope (what this plan does NOT do — explicit non-goals)

- Does not recolour Fated (Christian's 2026-10-04 ruling, THR-1724). Reserved for him with options.
- Does not show any rate as a number (Law 13 [E]); a numeral would need a law amendment.
- Does not change starting pools, the pool cap, income, upkeep, odds, tier thresholds or growth.
- Does not add a tutorial, overlay or glossary page.
- Does not rename the six taxonomies (Reach / Sphere / Domain / Scale / rarity / verb).
- Does not touch the opening picks (THR-1981) or The First's trade (THR-1982/1984).
- Does not gate the Dominion map lens button (lens bar has its own label).

## impact_class

Reversible

## evidence cited

- **Linear issue:** THR-1980
- **Vision premises invoked:** god-game "read before acting"; onboarding reveal order (THR-1808 plan `Docs/plans/2026-10-12-thr-1808-post-bond-reveal.md`)
- **UL terms touched:** Dominion, Thread, Forecast tier, Attention (no new terms)
- **Canon pages consulted:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md` (Laws 1, 2, 11, 12, 13, 15, 17, 18, 31, 33, 42, 51, 53, 57, 58)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-11-thr-1807-terms-explain-themselves.md` (its decision held back seen-once captions until round 4 showed no hovers, and rejected moving starting pools)
- **Rejected approaches considered and dismissed:** numeric rate (Law 13), unequal starting pools (THR-1807 rejection), pools below cap (balance change), within-tier progress bar (third magnitude language, Law 15), glossary/tutorial (THR-1807 rejection)

## load-bearing decisions touched

- "The world graph is mutated in place" — not engaged (no graph writes).
- "Everything is a graph node/edge" — captions are a localStorage preference, not world state; no relationship stored as a property.
- Engine caches per session — `computeEssenceIncome` memo already lives in `GameView`; no module-scope cache added.

## high-impact files touched (from Codesight)

`src/engine/orchestrator.ts`, `src/types/gameState.ts` (TickEvent), `src/data/ui-content.ts` — wide-blast. Plan carries a Blast Radius section; edits are additive optional fields and one gated branch.

## kill criteria

- Round 5: two or more testers still list the sphere pour, the odds legend, Fated, Attention, Dominion or Chronicle jargon under never-understood **while saying they saw its caption or word** → the visible-change approach failed for that word; next step is a law-amendment ask to Christian (numeric rate) or the Fated colour fork.
- Captions push any rail past the 1920×1080 viewport → drop `FIRST_USE_CAPTIONS_MAX_VISIBLE` to 1, then to tooltip-only for the rail.
- Chronicle gate leaves the Now tab empty for a full season in a seeded run → widen the gate to Notables.
