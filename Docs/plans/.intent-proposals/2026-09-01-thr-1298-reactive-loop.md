# Action Proposal — 2026-09-01-thr-1298-reactive-loop

## intent_quote

> ready for dev is almost empty. lets promote some design

(Christian, chat, 2026-09-01 — the session-triggering ask. The plan's substantive intent is the
standing design-session ticket THR-1298, filed from Christian's own carve-up ruling on the
Proactive Agent Actions wayfinder map, whose scope line reads verbatim:)

> "**The reactive loop** (Engine + Content) — culprit-carrying mint events, the four template
> conversions with THR-812 fixes, the value-pole selector term (two-scale mapping!), heat/grudge/
> closure doors, replacement-by-magnitude, provenance."

(And the resolved decision record it draws on — THR-1282 resolution + amendment, "RESOLVED —
Christian, live in chat, 2026-08-26", quoted in full on the issue and cited inline in the plan.)

## scope (what this plan does)

Plans (does not implement) the engineering of THR-1282's six settled rulings: undertaking outcome
event nodes carrying culprit + victim + harm class; the mint-lane widening that lets them mint
drives; conversion of the 4 dormant reactive templates into the event-minted lane (retiring the
`ReactiveAmbitionTemplate` machinery); the value-pole selector term routed through
`signedToCanonical01`; grievance heat/one-slot/replacement-by-magnitude/succession on the
`pursues` edge; the three closure doors (satisfaction with overshoot-gated suppression, settlement
as engine hook, cooling to grudge-as-`hostile_to`); board `urgencyWeight`; provenance surfaces
(agent-detail line, grudge line, debug accessor). Design-session output: plan doc + handoff only.

## scope (what this plan does NOT do — explicit non-goals)

- No implementation in this session (design session; executor implements from Ready for Dev).
- God-directed grievances (faith crises) — recorded future charter, out of scope per THR-1282 §6.
- Kin edges — recorded separate future effort; succession uses strongest sworn bond until then.
- The settlement encounter family — engine hook only; authored encounters are future content.
- Moment interrupt surfaces / follow affordance — doc 5's (THR-1299); this doc only consumes
  `resolveMomentPresentation`.
- No change to the encounter mint classification (`classifyMintEvent`) or encounter rules table.
- No new node types, no new edge types.
- No board cutover work (THR-1349's ground) and no motivations authoring (THR-1377's ground) —
  both declared as mutexes instead.

## impact_class

Reversible — a plan doc committed via `docs/plan-*` PR plus Linear state transitions; the planned
feature itself is additive-first with one sanctioned retirement (conversion-first), all behind the
executor's gates.

## evidence cited

- **Linear issue:** THR-1298 (design-session ticket; carve-up quoted in its body)
- **Vision premises invoked:** north stars #1/#2 as restated in `Docs/audits/2026-08-26-proactive-agent-actions-review.md` (Appendix A); two-way-thread doctrine (rulebook)
- **UL terms touched:** undertaking, grievance (new mechanical sense — flagged for the executor; "grudge" already canon in band-contest prose), heat (prose bands only, player-side)
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md` (ambition/grievance/world-minted greps per ticket Step-0), `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-08-26-thr-1292-undertaking-substrate.md` (declared seams: abandon mint event, urgencyWeight slot, followedAgentIds, signedToCanonical01 idiom); `Docs/plans/2026-08-27-thr-1297-action-library-works-holdings-naming.md` (owns edge, holdings single-writer, motive gate); `Docs/plans/2026-08-27-thr-1296-the-binder.md` (named-death seam)
- **Rejected approaches considered and dismissed:** six, in the brainstorm companion — eventType reuse, TickEvent consumption, new grudge edge type, node-side grievance state, separate vendetta scheduler, per-instance milestone targetRefs

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected (event nodes reuse `type: 'event'`; grievance
  state on edges).
- "No inventing node types without verification" / "New node types require full design" —
  respected: zero new node or edge types.
- "Relationships between entities are graph edges, not property fields" — respected: grudge is a
  `hostile_to` edge; culprit link lives on the pursues edge as provenance (same class as the
  established `mintedByEventId`), with the durable relationship being the grudge edge.
- "The world graph is mutated in place" — emission sites live in existing phases that already
  hold the mutation discipline.

## high-impact files touched (from Codesight)

None ≥100 importers. `src/types/graph.ts` (198) and `src/types/gameState.ts` (517) are explicitly
not touched. Checked against `.codesight/graph.md` 2026-09-01; plan states the check in its Blast
Radius section.

## kill criteria

- If the constructed CLI proof cannot produce a grievance mint end-to-end, the lane widening is
  wrong — stop and re-recon rather than patching the rules table.
- If the 300-tick observation runs show grievance heat dominating the board (vendetta monoculture)
  or zero organic mints after tuning, the constants are re-tuned against the THR-1277 field-survey
  baseline (the tunables exist for exactly this); a structural failure (e.g. destroy-verb supply
  too thin to ever fire) is surfaced as a finding on the issue, not silently absorbed.
- If the executor finds the shared step between this and THR-1349/THR-1377 has drifted (board file
  merged under them), re-baseline before slice 6 — the mutex lines exist to make that visible.

## explicit user sign-off

Not required (Reversible). The design decisions themselves carry Christian's recorded resolution
(THR-1282, 2026-08-26) and the carve-up ruling naming this doc; the session ask ("lets promote
some design") authorizes the design-session flow.

## author notes for the judge

- The ticket's exclamation-marked hazard (two-scale mapping) is answered by pinning the formula
  and the single bridge function in the plan text itself, not delegated to executor judgment.
- The plan deliberately makes ambient victims grudge-only. THR-1282 §5's text says ambient mortals
  stop *beyond the second link*; the plan extends grudge-only to ambient victims at any depth
  because only spotlight agents run the decision loop at all (steel-man C4 / THR-1348) — a pursues
  edge on an ambient agent would be an arc-panel lie. This is an engineering interpretation that
  tightens, not loosens, the anti-vendetta guardrail; flagged here so the judge can weigh it
  rather than discover it.
- `undertaking_abandoned` mints are culprit-less self-drives (rebuild/found/flee) — the review's
  "abandonment as grievance fuel is free drama" is served through the mint, not through a
  self-targeted grievance.
- Suggested-model line says opus for a Content-labeled issue family that often runs sonnet; the
  cross-cutting retirement + two vocabulary tables justify it, and the line is advisory anyway.
