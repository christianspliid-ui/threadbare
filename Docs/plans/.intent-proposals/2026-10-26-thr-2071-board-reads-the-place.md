# Action proposal — the board reads the place (THR-2071)

## intent_quote

There is no live user ask; the design lane runs unattended. The governing intents are:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, 2026-09-25 (THR-1611)

The ticket itself (THR-2071, filed by tb-opus-pickup on 2026-10-26, a Bug), verbatim:

> "These terms can move God's Will's ranking and the selection trace. They cannot move what a mortal actually does. As a result, a blighted province does not draw more desperate scenes, and a haunted town does not draw more uncanny ones."

> "Done when (predicates): Each live additive scorer term that is meant to steer a mortal's own choice either reaches `scoreUnifiedBoard` as a named, tunable pull with a 0-weight kill switch, or is documented as God's-Will-only, with the reason. A board test shows a booming town's board ranks `encounter.market_day_festival` above an equal-value non-economic candidate. A census … shows the lean on vs off over pooled seeds."

> "Needs a small design pass: decide which terms belong on the board and at what weight. A term that moves picks can change the measured shares that other gates rely on."

## scope (what this plan does)

Adds one capped multiplier (`boardContextPull`) to each encounter entry in `scoreUnifiedBoard`, computed from the eight scorer terms classified as describing where the mortal stands or who they are (economic context, location traits, local and global sphere resonance, reputation, faction boost, chain next step, intel). The pull keeps the scorer's proportion (`(base + W·C)/base`), clamped to [0.5, 2], with weight 0 as the kill switch. Adds `factionScoringBoost` to `ScoredCandidate`, two optional fields to the board entry and its trace, three constants, a census script, and a code comment classifying the shortlist-only terms.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the shortlist (`finalScore`, top 5) or any term's value in the scorer.
- Does not put pacing terms (exploration, familiarity, novelty, share ceilings, curator, rarity) or world-offer terms (doom/omen identity bias, hidden-mark reveal) on the board; they stay shortlist-only, as today.
- Does not wire the god's steering verbs or movement leans (Mark the Ground, Draw Together, Whisper Intuition, relocation, appointment pull, broken drift, ruins, anomaly) — split to THR-2073 because they were zero on three headless worlds.
- Does not re-plan THR-2040 (famine and glut); it only notes that the larder term would ride this pull.
- No player-facing UI, content rows or prose.

## impact_class

Reversible — a single weight constant set to 0 restores today's board exactly.

## evidence cited

- **Linear issue:** THR-2071; follow-up THR-2073; related THR-2067, THR-2040, THR-725, THR-790, THR-641
- **Vision premises invoked:** `Docs/game-design/laws.md` Laws 13, 18, 20, 42, 44, 45
- **UL terms touched:** none new
- **Canon pages consulted:** `Docs/game-design/laws.md`, `Docs/canon/systems-inventory.md` (decision row), `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** THR-2067 fix (commit 00bb637d, role lean on the board); `Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws.md`
- **Rejected approaches considered and dismissed:** board reads `finalScore`; one pull per term in the `1 + W·term` shape; uncapped ratio; shortlist-normalised pulls; moving exploration and the doom bias onto the board; wiring the god verbs without a census. Reasons in the brainstorm companion.

## load-bearing decisions touched

- "Engine caches are owned per session" — untouched (pure function).
- "The world graph is mutated in place" — untouched (no graph writes).
No load-bearing decision is changed.

## high-impact files touched (from Codesight)

None at ≥100 importers: `encounterScoring.ts` 33, `decisionBoard.ts` 10, `phaseAgentDecision.ts` 10, `agent-behavior-constants.ts` 83.

## kill criteria

- On/off census over pooled seeds 42/99/7 × 240: if the economic term's winner share is no higher than at weight 0, ship nothing, move the ticket to Todo, record the census.
- If undertaking share of non-idle verdicts moves by more than 1 point, halve the cap once and re-run; if it still moves, ship nothing.
- Prototype numbers already measured: undertaking share 6.27 % → 6.67 %; economic winner share 30.8 % → 39.2 % vs ~28 % board share.
