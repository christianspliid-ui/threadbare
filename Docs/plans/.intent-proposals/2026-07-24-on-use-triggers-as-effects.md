# Action Proposal — Item on-use triggers as effect primitives (THR-719)

## intent_quote

> lets prepare some more, as i will be away the entire day.

(Session directive 2026-07-24 — groom queued-but-unready work into Ready for Dev. The design content was verdicted by Christian in the 2026-07-23 interface-map chat review, recorded verbatim in THR-719:)

> **User verdict (chat review 2026-07-23):** re-express on-use triggers as **effect primitives** (extend the effects[] vocabulary with on-outcome triggers) and port the authored content. Do NOT wire the legacy resolver as-is — that recreates a parallel path beside the 2026-03-31 effects[] architecture, the exact drift class the interface map exists to kill.
>
> Retire `attachmentTriggers.ts` + its test suite once ported (dead-contract test rule, DoD). Update the interface-map row in the same PR.

## scope (what this plan does)

Grooms THR-719 into an executable plan: extends the **already-production-wired** `action_trigger` primitive (TB-104, orchestrator-called) with outcome-band events, `probability`, item-behavior payload kinds (only those authored content uses), and `narrativeTemplate` prose; ports every `onUseTriggers` block in the two catalogs onto it; switches the tooltip read path; deletes the legacy resolver, its tests, and the `onUseTriggers` field; re-badges the interface row LIVE with live grep symbols. Design session only — executor implements.

## scope (what this plan does NOT do — explicit non-goals)

- No wiring of `attachmentTriggers.ts` (deleted, not adopted — user verdict verbatim)
- No new standalone trigger primitive (the wired one exists; extension only)
- No `ReactiveEffect` changes (different agency direction — things done TO the agent)
- No speculative payload kinds (`spawn_actor` etc. only if authored content uses them)
- No THR-720 `activatedEffects` work (user-parked), no THR-723/THR-737/THR-718 scope
- No tag-overlap gating in v1 (existing predicate field covers it if ever needed)

## impact_class

Reversible — plan doc + Linear transitions; the implementation includes a deliberate, user-verdicted retirement (resolver + typed field + tests) whose safety net is the build-failing deleted field, all CI-gated.

## evidence cited

- **Linear issue:** THR-719 (Medium, Content Architecture), user verdict in description
- **Vision premises invoked:** failure-is-plot, one source of truth — brainstorm §Vision premises
- **UL terms touched:** Aftermath/outcome-ladder vocabulary referenced, no new UL terms (primitive names are code identifiers)
- **Canon pages consulted:** `Docs/canon/interface-map.generated.md` (LEAKED row → THR-719), systems-inventory
- **Prior plan docs this builds on:** `Docs/plans/2026-07-23-system-interface-map.md` § remediation (b) + § User verdicts; TB-104 Phase 1B (action_trigger)
- **Rejected approaches considered and dismissed:** wiring legacy as-is, new primitive, ReactiveEffect extension, full payload port, tooltip-only field, soft-deprecation — brainstorm §Alternatives

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected; payload executions ride existing condition/possession machinery + `touchWorld()`
- **Additive over destructive (NFP #6)** — the retirement is the sanctioned exception: the old shape structurally blocks the one-substrate goal; noted in-plan with the build-failing field as guard
- No node types, edge types, GameState fields added

## high-impact files touched (from Codesight)

None ≥100 importers (`effects.ts`, `actionTrigger.ts`, `effectExecutors.ts`, `attachments.ts`, catalogs, tooltip files — none on the CLAUDE.md list). Blast Radius omitted per template rule.

## kill criteria

- If the port finds an authored trigger that cannot map 1:1 onto the extended primitive, stop and surface it in the PR body rather than silently dropping behavior — that entry defines a missing payload kind.
- If deleting the legacy code makes the typecheck ratchet *rise* (unexpected coupling), investigate before `--update` — a rise means something imported the dead code after all.
- If narrative events from trigger firings spam the feed in the 30-tick smoke, add a significance floor at the call site (one constant) before shipping.

## explicit user sign-off

Not required (Reversible). The design direction and the retirement are Christian's verbatim verdicts (2026-07-23 chat review, quoted above).

## author notes for the judge

- The THR-718 first-pass lesson (over-narrow greps) was applied deliberately: the substrate search found `ActionTriggerEffect` production-wired at `orchestrator.ts:854` — which converts this ticket from "new primitive" (as the issue text implied) to "extend the wired one." That is the plan's core claim; verify it at `src/engine/effects/actionTrigger.ts` and the orchestrator call.
- Outcome-band event names and the payload-kind predicate are agent defaults flagged for review.
- The `first_use` legacy condition maps to existing `maxFires: 1` — no new mechanism.
