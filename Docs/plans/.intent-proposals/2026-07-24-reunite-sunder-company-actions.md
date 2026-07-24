# Action Proposal — Reunite + Sunder company actions (THR-732)

## intent_quote

> can you prep some work for tonight

(Session directive 2026-07-24 evening — continue grooming parked work into Ready for Dev. The design content is Christian's verbatim grill verdict recorded in THR-732 and the 2026-07-23 grill synthesis Q8:)

> yeah i agree 1 shhould persist, and 2 they should be able to reform. influencing reforming and splitup is also great candidates for ascendant actions, get those noted and in the backlog alongside the connect threaded agents action we talked about above.

## scope (what this plan does)

Grooms THR-732 into an executable plan under the action-catalog-design pre-flight (all three gates in the plan's opening section): two global group-targeting UATs — **Reunite** (timed convergence + formation-compatibility window on a disbanded company) and **Sunder** (timed dissent/leave amplification window + cohesion hit on an active company) — mirroring the shipped `blessedUntilTick` pattern, routing all visible output through existing authored moments (formation moment, fray pool, The Parting). Beat-granted, essence-costed. Design session only — executor implements after THR-74 completes.

## scope (what this plan does NOT do — explicit non-goals)

- No new substrate (pre-flight verdict: zero NEW-SUBSTRATE rows; convergence machinery is consumed from THR-74's commissioned remainder, not commissioned here)
- No separate reunion/schism encounter systems (routes into Seeking Companions machinery / fray pool / The Parting)
- No member-scale Sunder targeting in v1 (deferred until THR-733's betrayal content exists)
- No Bless/Sunder cancellation logic (coexisting windows intended)
- No group-vs-group anything (THR-731)
- No new trace types, phases, GameState fields, node/edge types

## impact_class

Reversible — plan doc + Linear transitions; implementation is additive property-window work gated by its own CI/DoD, hard-sequenced behind THR-74.

## evidence cited

- **Linear issue:** THR-732 (Deferral, Social Systems Expansion), user-named verbs in description
- **Vision premises invoked:** probability-never-command, graph-as-memory, failure-is-plot — brainstorm §Vision premises
- **UL terms touched:** Group/Company/Group Cohesion (THR-734, approved 2026-07-24); Reunite/Sunder become UL candidates at implementation — executor adds them to the THR-734 authoring batch or files a follow-up UL-proposal
- **Canon pages consulted:** action-catalog-design skill (pre-flight run in-plan), `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §10.4 surface-shape rule, THR-74 plan + checkpoints (substrate ground truth)
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-party-formation-group-mechanics.md` + grill synthesis Q8/Q9
- **Rejected approaches considered and dismissed:** authored-reunion-encounter, instant dissolution, member-scale targeting, cancellation logic, ship-before-THR-74 — brainstorm §Alternatives

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; windows are node-internal data (correctly properties), all relationships stay edges
- **Ascendants use the same prerequisite system** — respected; both UATs carry standard reach/sphere prerequisites
- **Fixed action count rejection** — respected; data-driven templates in the open pool
- No node types, edge types, GameState fields added

## high-impact files touched (from Codesight)

None ≥100 importers — `unified-action-templates.ts` is the data file (not `src/types/unifiedAction.ts`); group modules, content files, debug bridge all below the bar. Blast Radius omitted per template rule.

## kill criteria

- If playtest shows Reunite re-forming companies near-instantly (convergence + bonus trivializes the journey), halve `REUNITE_COMPAT_BONUS` / lengthen the window — the journey is the story.
- If Sunder dissolves companies within a couple of ticks (amplifiers stack too hard with low cohesion), soften `SUNDER_LEAVE_MULT` — its output should be scenes, then dissolution.
- If THR-74's remainder lands with a different fray-pool eligibility shape than assumed, the Sunder pool read adapts to whatever shipped — one read site, flagged in the handoff.

## explicit user sign-off

Not required (Reversible). The verbs are Christian's verbatim grill request; both were explicitly deferred to backlog by him, and tonight's directive is to prepare queued work.

## author notes for the judge

- The action-catalog-design pre-flight is the plan's opening section — substrate honesty table with grep evidence per row, mortal-loop bridge paragraphs for both verbs, and a surface-shape verdict. Zero new-substrate rows; the one external dependency (convergence machinery) is commissioned to THR-74's remainder, which the ticket's existing blocked-by encodes.
- Constants mirror Bless/Draw Together deliberately (symmetric counterparts); magnitudes are proposals for executor tuning.
- The THR-728 note (player-cast variance) is deliberately non-committal: these cards follow whatever cast-resolution rule is current at implementation — no special-casing.
