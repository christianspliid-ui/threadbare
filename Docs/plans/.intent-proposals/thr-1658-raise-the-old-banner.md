# Action Proposal — Raise the Old Banner (THR-1658)

## intent_quote

The ticket (filed 2026-09-28 as a deferral from THR-1631, the world-with-a-past plan, on Christian's Linear account by the design lane):

> **Open design question (needs a design pass, not a build):** what should turn descent into a want? Candidates: a rule that fires when a descendant stands in a ruin of their ancestors' empire; or one that names the Realm now holding the land as the obstacle, without a grievance. Whether the land's current holder counts as a wrong done to the descendant is a question about what the game means, so a design pass may need to reserve it for Christian.
>
> **Done when:** a plan or a decision records the rule, or the deferral is closed as not wanted.

Christian's upstream ruling, recorded on THR-1591 and quoted in THR-1631's description:

> **decided by Christian 2026-09-25, option A "explain the map"** ("a is fine")

The map audit that option A adopted says a past "feeds ambitions that today have no holder at t0 (`seek_revenge`, `chase_the_wonder`, `reclaim_homeland`, gap 7)" (THR-1631 plan § Why).

The lane's mandate (Christian, chat, 2026-09-25):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

## scope (what this plan does)

Records the rule that turns descent into a want, as a buildable plan: a new descent-gated ambition, *Raise the Old Banner*, offered only to heirs who already decide, through the ordinary re-evaluation when a slot frees. It is a soft drive (no culprit, no grievance). It completes when the heir has stood on the hex of an elder ruin of their ancestors' empire and taken a holding on the old land since the drive began. Engine: one optional template field read by `passesEligibility`, one snapshot field, two milestone condition types, one provenance label on the refill write, one read-only `descent.ts` module (with the region→historical-culture predicate lifted from the descent writer so writer and reader agree). Content: the template, its prose, a rulebook paragraph. UI: the existing intent line shows "Because of the old blood of …"; one debug accessor.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change `ambition_reclaim_homeland` (the exile's drive) or its `holding_seized` mint.
- Does not mint anything at t0, and does not displace an existing want to make room.
- Does not give anyone a grievance against a Realm, a leader or anyone living over an ancient fall.
- Does not add a target rule steering claims to "ancestral land" (proximity already starts there; reported if wrong).
- Does not fix the dead `loyalty`-followers milestone or the non-canonical `bond` basis (reported findings).
- Does not touch re-evaluation cadence, slot count or selection scoring.
- Does not add ruin encounter content (THR-1598's lane).
- Does not add a map signifier or a new UI component.

## impact_class

Reversible — additive engine fields and conditions, one new template; removing the template entry removes the behaviour.

## evidence cited

- **Linear issue:** THR-1658 (deferral of THR-1631; sibling of THR-1657)
- **Vision premises invoked:** `Vision/00-north-star.md` (the world does something next), `Vision/01-core-loop.md` (consequences compound), `Vision/02-non-negotiables.md` (narrative over mechanical perfection)
- **UL terms touched:** Ambition, Location, Place (existing). No new UL term; "descent" is not shown to the player.
- **Canon pages consulted:** `Docs/canon/rulebook.md` § 10.7, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/process.md` rule 4, `Docs/canon/world-objects.md`, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md` (Lane decisions 1, 4, 5; S1e; S3)
- **Rejected approaches considered and dismissed:** mint `reclaim_homeland` as-is (its `return` milestone is free for someone who never left; its `followers` milestone is unreachable); grievance against the land's current holder (most heirs' towns are held by nobody — 7 of 12 — and a fall 700–1100 years ago has no living culprit); t0 mint with a free-slot rule (11 of 12 heirs start with both slots full); a ruin-delve trigger (0 delves by anyone in 450 measured ticks); milestones on strength (already true for ~half of heirs) or on loyalty followers (written by nothing).

## load-bearing decisions touched

- **Relationships are edges, not properties** — respected: descent stays the worldgen property it already is (internal data about the mortal); the plan reads `owns` and `belongs_to` edges; no new property encodes a relationship.
- **Agent position is three-tier (hex → location → sublocation)** — respected: the ruin condition resolves position to the hex.
- **Encounter awareness is hex-granular** — cited as the reason "at the ruin" means "on the ruin's hex" (default reach 0).
- **The world graph is mutated in place** — no cache added; reads are on the existing passes.
- **No inventing node types** — none added.

## high-impact files touched (from Codesight)

None ≥100 importers. Measured by grepping `src/` + `scripts/` imports: `src/types/ambition.ts` 29, `ambitionTick.ts` 19, `ambitionSelection.ts` 12, `graphConditions.ts` 7, `src/data/ambition-templates.ts` ~39. No Blast Radius section required.

## kill criteria

DW5 census on seeds 42/99/7, 300 ticks. If no heir takes the drive up on any seed: ship anyway (path test-proven) and name the starving stage (no free slot at a re-evaluation tick vs outscored). If heirs take it up but never meet *walk the old stones* while standing on ancestral-ruin hexes between checks: raise `OLD_BANNER_RUIN_REACH_HEXES` to 1 and record both runs. If claims land off the old land: reported, a target rule is a separate decision. If Christian vetoes D2 (he wants a grievance), the template moves to the grievance pool with a culprit rule — a re-plan, not a patch.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- The ticket itself flagged "whether the land's current holder counts as a wrong" as possibly Christian's. The lane decided it (D2: not a wrong) because (a) THR-1657 already drew the line "living-memory wars mint grievances" and gave none for the elder age, (b) THR-1282 §2's rule that a witness never inherits someone else's revenge points the same way, (c) measured, most heirs' towns have no holder at all, so a grievance rule would mostly have no culprit. The veto line is explicit in the decision record. If you judge this a fork with no agreed outcome, say Escalate.
- The rank evidence (banner-like profile ranks first among unpursued refill templates for 8 of 9 heirs) uses one seed per heir for all scores, so it is indicative; DW5 measures the real take-up.
- "Heirs who stood on an ancestral-ruin hex" was sampled every tick; milestones are checked every 15 ticks, hence the reach lever.
- The milestone window on `agent_took_ancestral_ground` is the critical correctness point (seed 7: 3 of 6 heirs already own a Place on old land at t0).
