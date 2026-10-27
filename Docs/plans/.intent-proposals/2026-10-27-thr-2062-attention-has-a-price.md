# Action proposal: Attention has a price (THR-2062)

## intent_quote

From the Linear issue THR-2062 (filed 2026-10-26 by the THR-2058 build, as its Deferral):

> **The question:** what should attending a moment cost? The design is `Docs/plans/2026-04-05-attention-tier-model-design.md`. Either wire a spend (and say what an empty pool does), or retire the pool and its regen. Then set `ATTENTION_GAUGE_SHOWN` back on, or delete the gauge.
>
> **Done when** a plan doc names the spend sites (or the retirement), and its build ticket is filed.

From the THR-2058 plan's Deferral line:

> *Attention is never spent*. Wire a spend to the attention-tier design (`Docs/plans/2026-04-05-attention-tier-model-design.md`) or retire the pool, then set `ATTENTION_GAUGE_SHOWN` back on.

Standing direction for the lane (Christian, 2026-09-25): "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations."

## scope (what this plan does)

Keeps the Attention pool and names its one spend site: answering a thread pull on a mortal set to *Lives on*. The spend moves from a UI-side property write into a traced engine function. Stops pause-mode threads (The First by default) raising pulls, because their chapters already interrupt for free. Makes livelihood pulls (a bonded mortal's home in famine or glut) fire once per crossing and cost nothing, fixing a dedup that re-raised them every three ticks. Says what an empty pool does (unchanged: the badge refuses, the chapter plays out unseen and is filed as missed). Brings the gauge back behind a predicate: shown when a pull can cost something. Replaces numerals on the badge and gauge tooltip with the gauge's own state words.

## scope (what this plan does NOT do — explicit non-goals)

- Does not retire the pool (named as rejected; would be a change of direction).
- Does not wire the April design's story-beat, per-phase or notable costs.
- Does not change any attention number (capacity, regen, costs, multipliers, curator weights).
- Does not change which encounters reach the player; the shaping-tier notification gate is untouched.
- Does not add capacity growth (milestones, items); the April table's progression rows stay design-only.
- Does not change the *Asks you / Lives on* toggle or its defaults.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2062
- **Vision premises invoked:** rulebook §2 *Scan*; north star (witnessing, not steering)
- **UL terms touched:** Thread Tug (player word "the thread pulls"), Attention. No new term; the build adds one sentence to the Thread Tug entry naming the livelihood cause.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/README.md`, `Docs/game-design/laws.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-04-05-attention-tier-model-design.md`, `Docs/plans/2026-10-26-thr-2058-one-thing-at-a-time.md`
- **Rejected approaches considered and dismissed:** retire the pool; charge every chapter; retune the curator cap (see brainstorm)

## load-bearing decisions touched

- "The world graph is mutated in place — never key change detection on graph identity": the engine spend writes ascendant props in place; the hook keeps `touchWorld`.
- "Everything is a graph node/edge": no new node or edge; two optional properties.

## high-impact files touched (from Codesight)

None with ≥100 importers. Measured by grep of import specifiers: `types/attention` 29, `types/resource` 32, `data/opening-reveal-table` 8, `threadTugBadgeModel` 6, `engine/attentionPool` 3, `phaseAttention` 1, `resourceStockTiers` 2. (`types/influence`, 147, is deliberately not touched.)

## kill criteria

After the build, the attention census (3 seeds × 360 ticks): any pull on a pause-mode thread, more than one livelihood pull per mortal per crossing, or a First-alone pool that leaves full means the build is wrong. A three-retinue *Lives on* world that never drops below half on any seed sends the ticket back to design.
