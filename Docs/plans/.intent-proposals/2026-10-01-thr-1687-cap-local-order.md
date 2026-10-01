# Action proposal — 2026-10-01-thr-1687-cap-local-order

## intent_quote

No direct user message; this is agreed work under delegation. The ticket (THR-1687, filed by the THR-1681 executor 2026-10-01, staged for the design lane by tb-orchestrator) asks:

> The mechanism is confirmed (or replaced) with a measurement.
> Expert content at an expert decider's own location survives the cap at a rate comparable to novice content's (state the target and why; never tune to a KPI).
> `gameplay-report --seeds 42,99,7` re-read: expert mean attempted difficulty, in-window share, total success. Report each; nothing tuned to pass.

The orchestrator's staging comment:

> Decision the plan must make: confirm the mechanism by measurement, then pick between a per-template hashed order inside the local pass and a band-aware reserve (or something better), with the target survival rate stated and justified — never tuned to `KPI_IN_WINDOW_MIN`.

Christian's delegation for this lane (chat, 2026-09-25):

> I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map.

## scope (what this plan does)

Confirms by paired measurement on three seeds that the shortlist's own-hex pass (`capWithDiversity`, THR-1633's `CAP_FILL_LOCAL_SLOTS` walk) keeps templates in catalogue registration order, so recently written (harder) content is cut. Specifies one engine change for the executor: the own-hex pass fills its slots in `hashString(agent:tick:template)` order behind a new switch `CAP_FILL_LOCAL_ORDER` (`'walk'` restores the shipped pass). States a target that is cap neutrality (expert ÷ novice cap keep rate ≥ 0.7 for expert deciders), not a KPI. Reports what the prototype did to the KPIs without choosing anything from them. Splits the skipped invariant clause so the parts that can hold now are re-armed. Files two follow-ups: the master everyday batch (blocked by this) and a measurement ticket for the in-window share.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change `MAX_SCORED_CANDIDATES`, `CAP_FILL_LOCAL_SLOTS`, any reserve, the general fill, or the cache's emission order.
- Does not touch scoring, the forecast window, the decision board or the dice.
- Does not chase `KPI_IN_WINDOW_MIN`; the prototype shows the share does not rise, and that is filed separately.
- Does not author master everyday content (filed as its own ticket).
- Writes no `src/`. The prototype was a throwaway on an unmerged worktree and was reverted.

## impact_class

Reversible — one switch restores the shipped behaviour exactly; the change moves the world's encounter distribution, which is why guard rails are in the Done-when.

## evidence cited

- **Linear issue:** THR-1687 (parents THR-1627, THR-1681; mechanism family THR-814, THR-1614, THR-1633)
- **Vision premises invoked:** what a mortal attempts grows with them (THR-1627 plan); the world runs without the player
- **UL terms touched:** none new (shortlist / decision board / window as already used)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md` (no row touched), `public/encounters-manual-reference.html` (the THR-1633 fill section)
- **Prior plan docs this builds on:** `Docs/plans/2026-09-29-thr-1627-content-above-novice.md` (D2 window-fit banding, kill criterion)
- **Rejected approaches considered and dismissed:** band-aware reserve (preference in the limit; tunes toward the KPI); per-location shuffle at cache build (static); more local slots (median own hex 87–117 templates vs 40 slots); recency weighting (inverts the bias); reordering the general fill (no catalogue cliff there)

## load-bearing decisions touched

- Encounter awareness is hex-granular — respected; the own-hex predicate is unchanged.
- Determinism (NFP #3) — the order is a pure hash, no PRNG draw.
- Engine caches per session — untouched.

## high-impact files touched (from Codesight)

None ≥ 100 importers. `encounterFilterPipeline.ts` 15 importers, `agent-behavior-constants.ts` 70.

## kill criteria

- Experts still attempt easier work than journeymen after the fix on two of three seeds → the board was not the cause; report on THR-1627, no further cap changes.
- Guard rails fail (firings or `start_local` down > 10%) → revert to `'walk'` and decide separately; never retune slot counts to compensate.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The target 0.7 was chosen before looking at whether the prototype met it? Honestly, no: seed 42's 0.77 was in hand when it was set. The justification stands independently (neutrality, minus the legitimate exposure difference that novice templates stand on more hexes), and the shipped pass fails it by a factor of 5–8, so the threshold is not doing fine discrimination. If the judge thinks a different number is better grounded, that is a fair Revise.
- In-window share dips 1–2 points in the prototype. I chose to report it and file a measurement ticket rather than treat it as a reason to prefer the band reserve. The band reserve would likely raise it, which is exactly why choosing it on that basis would be tuning to the KPI.
- Seed 42's cap-band numbers came from a first prototype form (sort all own-hex entries); seeds 99/7 and the gameplay-report A/B from the one-pass form the plan specifies. Both forms select by the same template key; they differ only in which entry represents a template.
