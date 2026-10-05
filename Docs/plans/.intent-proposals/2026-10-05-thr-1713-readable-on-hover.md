# Action proposal — readable on hover (THR-1713)

## intent_quote

> Ticket THR-1713 (filed 2026-10-03 from cold playtest round 2, attended at Christian's request), "The design question": *"which of these does a first-session player need to read, and through what (hover tooltip, plain label, or hidden until relevant)? Testers asked for **hover tooltips on numbers** in both rounds, not more labels. Respect the chip-noun doctrine (sheet words, ≤15-word chips, effect on hover)."*

> "Recommended direction: A single hover-tooltip pass over the five things all three testers named: essence bars incl. drift cause, card cost stars, forecast words, the dilemma factor colours, the Reaches row. Hide Quintessence until it changes."

> "Fixed when: A round-3 tester can say, unprompted, what one essence bar is for and what a "doomed" card means. Implementation tickets go into this milestone."

> Tester (veteran), round 2: *"put a hover tooltip on every number, because your depth is invisible until I can read it."*

> Christian, 2026-09-25 (design-lane mandate): *"you can probably iterate and progress designs without me in many situations"*.

## scope (what this plan does)

One hover-tooltip pass over the five surfaces the ticket names, plus the measured placement defects behind the recurrence:

- **Essence rows**: the whole row is the tooltip target; the tooltip gives the sphere's role, a trend word, and the causes that fed or drew it lately.
- **Nudge-card marks**: cost, odds pips, sphere and keyword chip, using registry tooltips that are currently switched off for nudge cards.
- **Forecast words**: per-tier tooltip on the pill; cast cards show the display word instead of the raw key.
- **Factor lines**: a helps/hinders kind tag, because Law 31 requires a word with the colour.
- **Reaches**: tooltip on the sheet tier word, plus a heading tooltip that separates Reaches from Spheres.
- **Quintessence**: hidden on the identity strip until it drops below its top word; the sheet keeps it.

Engine part: a bounded, deterministic per-sphere essence-movement record, written at the existing phase-merge seam and at three out-of-tick spend sites. It exists so the drift cause is real and not guessed. It never writes balances.

## scope (what this plan does NOT do — explicit non-goals)

- No numbers added. No rates, percentages or "+N" anywhere (Law 13).
- No change to essence economics, costs, income or any rule of play.
- Does not re-decide "was Perilous" (THR-1714, shipped) or the encounter layout (THR-1724, shipped).
- Does not re-fix the three-essence-numbers bug (THR-1706, shipped).
- No teaching added to Meet The First's prose (THR-868 verdict 10).
- Does not bring back the per-line factor hover that THR-1478 removed.
- No tooltips beyond the named surfaces. The ticket's "every number" is read as these five plus the defects found on them, not an app-wide sweep.
- Does not judge the round-3 Fixed-when; the next cold playtest does.

## impact_class

Reversible. A UI pass plus one optional, additive GameState field; no balance or rule change. The design lane makes it under delegation with a veto invited.

## evidence cited

- **Linear issue:** THR-1713 (related: THR-1607, THR-1706, THR-1714, THR-1724, THR-1478, THR-868)
- **Vision premises invoked:** rulebook-quick-reference "You spend sphere-typed essence"; "you nudge; fate rolls"; Ruling 6 / Law 13 words not numerals
- **UL terms touched:** Forecast tier, Reach, Sphere, Quintessence, Nudge (no new player-facing terms; "helps/hinders" are kind-tag words, not concepts)
- **Canon pages consulted:** `Docs/design-system/laws.md` (1, 10–20, 27, 31, 33, 46, 53), `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`
- **Prior plan docs this builds on:**
  - `Docs/plans/2026-09-27-thr-1606-what-your-hand-did.md` (B4)
  - `Docs/plans/2026-10-03-thr-1714-show-the-roll.md` (D2, verdict-10 interpretation)
  - `Docs/plans/2026-07-30-thr-868-meet-the-first-nudge-conversion.md` (verdict 10)
- **Rejected approaches considered and dismissed:** none of the CLAUDE.md rejected list applies. Within the plan: `computeEssenceIncome` as cause source; trace-driven causes; a full per-event ledger; restoring the per-line factor hover; ▲/▼ polarity glyphs.

## load-bearing decisions touched

- **Reaches and Spheres are orthogonal axes**: respected and stated in the new `ui.reaches` copy.
- **World graph mutated in place / never key on graph identity**: not touched; the new field is GameState, reference-compared like `essenceEarnedBySphere`.
- **Everything is a graph node/edge**: the movement record is GameState run-level bookkeeping of the god's own resource, not an entity relationship. It follows the `essenceEarnedBySphere` precedent; no new node or edge type.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts`: ~669 importing files (one optional field)
- `src/engine/orchestrator.ts`: codesight hot file (one seam call)
- `src/types/trace.ts`: trace vocabulary (one category)

The plan has a Blast Radius section.

## kill criteria

- If round 3 testers still cannot say what an essence bar is for or what "doomed" means, *with these hovers present and confirmed in the deployed DOM*, then hovering is the wrong channel. The next move is an always-visible plain label or a first-contact moment, and that fork goes to Christian.
- If `test:heavy` or the tick-cost trend shows the seam call costs more than noise (over ~2% of tick median), move the record to sample only the five mapped phases.

## explicit user sign-off

N/A: Reversible class.

## author notes for the judge

- The surprise was that THR-1607's tooltips were live during round 2 and testers still found none. The plan's spine is placement, measured with greps quoted in the plan's "Measured" table. Please check those claims against source if you doubt them.
- D9 (the meeting) is an interpretation of THR-868 verdict 10, the same one THR-1714 recorded. It is recorded for veto with a one-prop fallback.
- The drift-cause engine record is the biggest part. I chose it over `computeEssenceIncome` because the testers' example (Matter falling) is upkeep and spend, which an income forecast cannot see.
- "Implementation tickets go into this milestone": this plan is one implementation ticket (THR-1713 itself, moved to Ready for Dev), as with prior lane plans. If the executor finds it too big, the natural seam is engine record + essence row vs. the card/forecast/factor/reaches hovers.
