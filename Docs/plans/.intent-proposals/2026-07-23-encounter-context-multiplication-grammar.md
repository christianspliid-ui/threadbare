# Action Proposal — 2026-07-23-encounter-context-multiplication-grammar

## intent_quote

> "feel free to continue work on the remaining/outstanding content work."

(Christian, chat, 2026-07-23 — immediately after directing "go look at the content architecture project", whose one substantive remaining item is THR-573.)

Linear issue THR-573 (created by Christian, 2026-07-03), verbatim deliverable:

> "Design the context-multiplication grammar: which axes multiply, which combine, and where authored prose vs resolver-generated prose sits (primitive-first — name the reusable engine primitives explicitly) · Run the three catalog-expansion pre-flight checks (Substrate Honesty, Mortal-Loop Bridge, Surface-Shape) before drafting any surface · Interaction with the Encounter Format Migration project (115 legacy templates) — the multiplication layer should target UnifiedActionTemplate only · Quality floor: meeting-encounter prose eval remains the bar; plainer readable voice per canon"

> "Done when: Plan doc with the multiplication grammar, primitive inventory, and tier model · Worked example: one authored core expanded to ≥20 surfaces, evaluated against the prose bar · Authoring-pipeline changes specced (encounter-pipeline skill updates)"

## scope (what this plan does)

Designs the Tier-2 context-multiplication grammar on top of the shipped Phase-0 surface foundation (THR-467/475): two identity axes congruent with `SURFACE_KEY_AXES` (place, counterpart role), a declared-default fragment-table primitive (`contextFragments` + `{frag:*}` enrichment token), the surface-counting rule that makes the ~1,000 target measurable, the concrete tier model, a full worked example (`social_scene.recruitment_pitch` → 20 surfaces from 9 authored fragments, all fragments included verbatim as executor content), and the `template-context-rewrite` authoring-pipeline spec. Includes the three pre-flight checks the issue mandates. Hands off to the executor lane as one implementable slice (engine seam + one retrofit proof).

## scope (what this plan does NOT do — explicit non-goals)

- Does not implement anything — design session; no `src/` edits.
- Does not build Tier-3 procedural/ambient grammar (parent Phase 3).
- Does not build per-run pool partitioning (`RUN_POOL_MIN_ELIGIBLE` enforcement, parent Phase 4).
- Does not retrofit any family beyond the single `recruitment_pitch` proof; scale-out authoring gates on the KPI read after the proof ships.
- Does not add personality or faction-stance identity axes (recorded rejections/deferrals with reasons in the brainstorm companion).
- Does not touch bespoke Tier-1 `encounter-pipeline` mechanics.
- Does not add player-facing UI chrome (seen/unseen codex stays deferred).

## impact_class

Reversible — a plan doc plus a specced additive engine layer; the layer itself is opt-in per template and removable.

## evidence cited

- **Linear issue:** THR-573
- **Vision premises invoked:** replayability-first; narrative over mechanical perfection; player-as-god; generated-within-constraints (via `game-design-direction` premises as reflected in canon pages)
- **UL terms touched:** Surface (candidate new UL term — see note below), Scene / Cast / Target / Support Bundle (THR-700, consulted), Encounter, UnifiedActionTemplate, Encounter Seed. **New-term note:** "Surface" and "Fragment" are used consistently here and in the parent plan but not yet UL-declared — a follow-up `UL-proposal` issue is flagged in the handoff.
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/prose.md` (register model, 5-question bar, voice rules), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-06-22-encounter-volume-scaling-design.md` (director-endorsed parent), `Docs/plans/2026-06-22-thr467-phase0-encounter-surface-foundation.md` (shipped), `Docs/plans/2026-05-04-encounter-experience-design-plan.md` (four load-bearing rules)
- **Rejected approaches considered and dismissed:** compile-time surface expansion; per-field variant maps; resolver-only variation as backbone; personality identity axis (v1); faction-stance identity axis (deferred with path); runtime LLM generation (already canon-rejected). Full reasoning in the brainstorm companion.

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected; fragments are template data, no new node/edge types (plan states this explicitly in Engine pillar).
- "No inventing node types without verification" — no node types invented.
- "Relationships are edges, not property fields" — not applicable; no relationships encoded.
- Rejected-approaches list — plan verifies no reintroduction (EncounterTemplate stays dead; no pure-template prose; no intelligence gating; no fixed action counts).

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` — 278 importers (CLAUDE.md high-impact list). Additive optional field only. Blast Radius section present in the plan.
- `src/engine/proseEnrichment.ts` — not on the ≥100 list but high fan-in; noted in Blast Radius anyway.

## kill criteria

1. **Proof-slice KPI fails:** after the `recruitment_pitch` retrofit ships, the THR-457 harness should show template top-share falling and eligible-pool depth rising for that family. If surfaces do not register as distinct in play (novelty already surface-keyed, so this is measurable), the grammar's premise — prose following selection identity is what makes multiplication real — is wrong; halt Phase-2 scale-out and re-design before authoring more fragments.
2. **Fragment quality floor fails:** if the 9 worked-example fragments cannot pass the register scorer + editorial bar at implementation, the per-fragment authoring budget is unrealistic and the tier model's Tier-2 arithmetic collapses; escalate to Christian with samples rather than lowering the bar.
3. **Reader test:** if composed surfaces read as Mad-Libs (fragment seams visible), the slot granularity is wrong — revisit slot placement (fewer, larger slots), not the axis set.

## explicit user sign-off

Not required — Reversible class. (Direction-level sign-off exists at the parent: director decisions 2026-06-22 endorsing hybrid/tiered/~1,000 target.)

## author notes for the judge

- The June parent design predates the THR-694–700 scene-integration chain; this plan deliberately re-grounds Tier 2 on that newer substrate (cast continuity as coloration, declared-default invariant borrowed from cast tokens). That is why the grammar looks different in mechanism — runtime `{frag:*}` resolution rather than the parent's vaguer "fragments keyed per context value" — while landing the same tiered intent.
- The strongest design commitment is axis congruence: identity axes = `SURFACE_KEY_AXES`, nothing else. This is the plan's answer to "which axes multiply, which combine" and it is deliberately conservative; the brainstorm records the v2 path for faction stance.
- The ticket's "115 legacy templates" interaction item is answered by evidence rather than design: the legacy format was removed by THR-108 (grep evidence in the Substrate inventory), so "target UnifiedActionTemplate only" is now vacuously satisfied and stated as such.
- The worked example's fragments are intended as landable content, not illustration — the executor ships them verbatim. Mechanical scoring at design time was approximated by inspection against the scorer's detector classes (digits, rare words, interiority, probability words); the plan makes the sweep a hard gate at implementation, which is where the authoritative score runs.
