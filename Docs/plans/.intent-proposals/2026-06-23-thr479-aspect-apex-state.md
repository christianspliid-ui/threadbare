# Action Proposal — THR-479 Aspect apex state

## intent_quote

> advance THR-467/THR-469 children and the THR-414-derived design item THR-479 (Aspect apex state); resolve THR-390's status.

Director verdicts (THR-479, AskUserQuestion 2026-06-23):
> Trigger = "Capstone encounter/agreement"; Effects = "Hybrid: light mechanics + heavy narrative"; Reversibility = "Permanent + survives death".

THR-414 verdict #1 origin:
> "Aspect" is NOT a sixth rung but a distinct apex milestone/flag beyond tier 4. This ticket designs what "Aspect" then becomes.

## scope (what this plan does)

Designs the "Aspect" apex state as a graph-native milestone reached by resolving a bespoke apotheosis capstone encounter offered to a sustained tier-4 (Enthralled) mortal. Defines a new `aspect_of` edge, a `grant_aspect` graph op/aftermath reaction, eligibility seeding in the encounter phase, a modest essence-conduit + narrative-gravity grant, death→mythic-echo handling, two traces, four constants, and the three-pillar surfacing (apotheosis encounter, chronicle beat, retinue badge, thread-detail prose, debug). It does not change the five-integer tier scale (THR-478 owns the rename).

## scope (what this plan does NOT do — explicit non-goals)

- Does NOT add a sixth tier or touch `InfluenceTier = 0|1|2|3|4`.
- Does NOT rename the five tier display names (THR-478).
- Does NOT grant combat/capability power spikes — mechanic is a small essence trickle + curated-encounter weighting only.
- Does NOT make Aspect reversible or lossable; not a property on the existing `thread` edge.
- Does NOT auto-promote on a tick/rarity threshold (trigger is the capstone encounter, per verdict).
- Does NOT author the full Twilight mythic-echo feature (noted as a non-blocking follow-up).

## impact_class

Reversible — additive engine/content/UI feature; new edge type + content + UI. No destructive schema change; tier scale untouched.

## evidence cited

- **Linear issue:** THR-479 (child of THR-414); sibling THR-478.
- **Vision premises invoked:** player-as-god framing (divine intervention, not character control); prose-first.
- **UL terms touched:** "Aspect" (now distinct from the five tier names) — needs a `UL-proposal` follow-up in the Influence/Retinue shard.
- **Canon pages consulted:** `Docs/canon/rulebook.md` (Influence Tier), `Docs/canon/cosmology.md` (reaches/spheres unaffected).
- **Prior plan docs this builds on:** THR-414 rulebook review; THR-467 encounter-volume tiering (apotheosis = Tier-1 bespoke marquee).
- **Rejected approaches considered and dismissed:** (a) sixth tier rung — rejected by THR-414 verdict; (b) flag on the `thread` edge — rejected because aspect-of is a distinct relationship (load-bearing: relationships are edges); (c) auto-promotion on threshold — rejected by director verdict in favor of a capstone encounter.

## load-bearing decisions touched

- "Everything is a graph node/edge" — RESPECTED: Aspect is a new edge, not a relational table.
- "Relationships between entities are graph edges, not property fields" — RESPECTED: `aspect_of` is an edge, not a property on `thread`.
- "No inventing node types without verification" — RESPECTED: no new node type; an edge type is added with full design (category, properties, connected nodes, tick participation, traces) per the "new edge type requires checking graph.ts first" rule. Verified `aspect_of` does not already exist in the `EdgeType` union.
- "New node types require full design before code" — N/A (no new node type).

## high-impact files touched (from Codesight)

- `src/types/graph.ts` — `EdgeType` union is widely imported. Change is additive (one union member). Blast Radius section present in the plan doc. No exhaustive-switch rewrite expected (most edge switches use default fall-through); TS will flag any that need a case.

## kill criteria

- If playtest shows apotheosis firing too often (Aspect stops feeling rare) or never (unreachable), tune `ASPECT_ELIGIBILITY_TICKS` / re-offer cooldown — no code change (NFP #1). If the essence trickle distorts economy, drop `ASPECT_ESSENCE_PER_TICK` to 0. If the whole concept doesn't earn its complexity in play, the edge + op are isolated and removable without touching the tier scale.

## explicit user sign-off

N/A (Reversible class). Director verdicts on the three live design questions captured via AskUserQuestion 2026-06-23.

## author notes for the judge

Representation (edge) and surfacing (prose touchpoints) were NOT separately verdicted by the director — they are agent recommendations grounded in the load-bearing decisions, flagged as "confirm at impl" in the plan. The apotheosis encounter is prose-heavy (Tier-1 bespoke); the handoff suggests opus-tier authoring. The "survives death" semantics require the death/cleanup phase to NOT garbage-collect the `aspect_of` edge or its mortal node — this is the one place the design adds a constraint to an existing system; called out in the Wiring table and Fail-soft table.
