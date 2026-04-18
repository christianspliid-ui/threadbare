# THR-93 · Builders Fellowship Migration — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 2 — Remaining Guilds
> Pattern parent: THR-89 (Thieves Guild pilot, Done) · THR-91 (Arcane Circle tracer, Done) · THR-92 (Civic Guard, Ready for Dev)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`

This is a **design delta**, not a re-design. The migration framework is settled and shipped: Phase 0 infra (adapter + `enrichProse()` + multi-target aftermath + aftermath tracing + world-shaping), Phase 1 pilot (Thieves Guild), Phase 2 tracer (Arcane Circle). Civic Guard is already fanning out under THR-92. This doc covers **only what is specific to Builders Fellowship** — the voice, the systemic signature, and the quality-reference problem that Builders faces and Civic Guard did not.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. GraphOps executor present (`src/engine/graphOpExecutor.ts`) and tested. World-shaping (THR-115) shipped. If a new effect-kind need surfaces during Builders migration, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | ~13 standard templates + 2 lifecycle templates in `src/data/builders-fellowship-encounter-content.ts` rewritten to Threadbare bar in Builders voice, with contextual aftermath per template minimum. **Builders is the first guild to exercise GraphOps at content scale** — a built node should exist in the world after a construction encounter resolves. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render the aftermath trace categories. Spot-check only. Merge gating on THR-134 U4 applies. |

**Wiring note:** Because Builders is the first content exercise of GraphOps at scale, the expectation is *use* the existing executor and *report back* any gaps via a Phase 0 follow-up. Do not extend the executor inline.

## The quality-reference problem (different from Civic Guard)

THR-92 had an in-file quality reference: Gate Duty already had clearance-gate wiring. Every migrated Civic Guard template was told "meet or exceed Gate Duty."

**Builders Fellowship has no in-file reference.** The existing file is placeholder-quality prose with zero authored aftermath, zero GraphOps usage, zero encounter-specific attachments. Every template is at baseline.

This means CC cannot anchor on an in-file exemplar. The quality reference is **external**:

1. **`Docs/plans/encounters/flawed-steel-revised.md`** — the authoritative Builders voice exemplar. A forge-master, an apprentice, a mercenary company, and the weight of already-deployed steel. This is the Builders tone at full quality: material attention, quiet satisfaction, craft pride fraying under pressure. **Read this before rewriting any Builders template.** It is the Gate-Duty equivalent — external, not in the target file, but every bit as authoritative.
2. **THR-89 (Thieves Guild) completion** — Threadbare aesthetic benchmark (sensory-first, concrete nouns, no superlatives).
3. **THR-91 (Arcane Circle) completion** — Phase 2 pattern validation, voice-shift discipline.
4. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality for any migrated template.

The absence of an in-file anchor is also the reason Builders is not Phase 2's first fan-out. Civic Guard (with Gate Duty) seeds the second authored-aftermath pattern before Builders needs to generate one from nothing.

## Voice + systemic affinity (from issue)

### Voice

**Patience, craft pride, material attention. Precise language about physical processes. Quiet satisfaction.**

Builders Fellowship prose measures time in seasons, in the drying of mortar, in the grain direction of oak. It does not hurry. Its register is calm-under-skill — the voice of someone whose hands know what the job needs before the conscious mind catches up. When pride cracks, it cracks inward (the forge that will not relight on the first strike, the beam that seats wrong) rather than outward (the raised voice, the dramatic gesture).

Contrast the other Phase 2 guilds already in motion: Civic Guard = formal-that-cracks-under-pressure; Arcane Circle = precise-intellectual; Builders = patient-material. **Do not blur these.** If a Builders template sounds like Civic Guard, the register is wrong.

Anti-voice to reject: generic artisan flavor ("the hammer rings on the anvil"), fantasy-RPG utilitarianism ("you complete the repair and gain reputation"), quaint-village-carpenter cozy ("old Henrik hums as he planes the board"). The Builders register is *serious adult craft*, not storybook labor.

### Systemic signature (Builders' four engine affinities)

1. **GraphOps (structural changes — building creates nodes).** Builders' defining engine affinity. On successful construction encounters, the graph should gain a node that persists: a reinforced wall, a bridge, a workshop annex, a monument. Use the existing `graphOpExecutor` (`src/engine/graphOpExecutor.ts`) — do not invent new ops. At least **4 templates** should fire a GraphOp on success. Failure or Success-at-Cost may fire a weaker op (half-finished structure node, material-loss condition) or none at all. **This is the Builders equivalent of Civic Guard's clearance-gate tagging — it is the scale-exercise of GraphOps for content.**
2. **`{?has_artifact}` tool/material context.** The prose should branch on whether the actor carries tools or raw materials. A forge encounter reads differently when the actor has a hammer vs. when they are improvising. Make this conditional block earn its place on craft-forward templates. At least **6 templates** should carry a `{?has_artifact}` branch.
3. **Reputation tallies (craftsmanship reputation).** Use the craftsmanship / material-honor axis, not generic "guild standing." Quality work raises it; shoddy work lowers it; witnessed rescue-crafts (repairing something in a crisis) raise it sharply. Set `reputationPolarity` on every reputation-bearing outcome.
4. **Encounter-specific attachments (named crafted items).** When a Builders template produces a crafted object, that object should be a named attachment node, not a generic pool draw. A blacksmith who forges a ceremonial blade under divine attention should create *The Mourner's Edge*, not "a fine sword." At least **3 craft-focused templates** should produce a named attachment via GraphOps (not just a `#gold` reward pool tag).

## Template-count caveat

The issue title says "42 templates." This is the same step-count-vs-main-template confusion that THR-92 already documented. Actual main templates in `builders-fellowship-encounter-content.ts`:

- **13 standard encounter templates** across tiers (standard, senior, elite)
- **2 lifecycle templates** — `BF_JOIN_TEMPLATE` and `BF_PROMOTION_TEMPLATE` (already grouped in `BF_LIFECYCLE_TEMPLATES`)
- ~52 step entries total

CC should:

- Migrate all **13 standard** + **2 lifecycle** main templates
- Reconcile the completion comment's coverage metric against **main-template count** (not step count)
- Mirror Thieves Guild + Arcane Circle + (in-flight) Civic Guard framing for audit comparability
- Expect the completion comment to say "15 main templates / ~52 steps" not "42 templates"

## Representative template categories (from file survey)

The 13 standard templates span five categories. CC should preserve category distribution during rewrites:

- **Construction** — `repair_wall`, `lay_foundation`, `raise_bridge` (large-project tier)
- **Crafting** — `forge_tools`, `craft_commission`, `master_craft` (named-attachment tier)
- **Design** — `survey_site`, `design_fortification`
- **Large Projects** — `grand_monument`, `engineer_wonder` (elite tier; strongest GraphOps candidates — monuments SHOULD exist in the world after completion)
- **Social** — `workshop_tour`, `guild_feast`, `material_trade`

Plus lifecycle: `BF_JOIN_TEMPLATE`, `BF_PROMOTION_TEMPLATE`.

**Per-category hints for CC:**

- **Construction** — GraphOp on success creates or reinforces a structure node at the target location. `{?has_artifact}` branches heavily (the right tools matter).
- **Crafting** — Named attachment via GraphOps on success. Failure may plant a hidden mark on the crafter (the flawed piece that went out under their name — see Flawed Steel as the tonal anchor).
- **Design** — Less GraphOps, more encounter seeding: a completed design seeds a future construction encounter at the surveyed site.
- **Large Projects** — Strongest GraphOps exercise. Monuments are persistent world objects. Success should make them a *place* agents can visit. Failure at this tier should leave a ruined/abandoned scaffold as a visible scar.
- **Social** — Reputation tallies heaviest here; GraphOps lightest. Material-honor reputation rises or falls based on how craft talk lands.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives.
- Wiring: `{name}` + pronouns in every prose field; ≥1 conditional block per template; `{location}`, `{artifact:tool}`, `{ally:*}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (GraphOp, reputation tally, hidden mark, encounter seed, intelligence grant, or named-attachment creation).
- `reputationPolarity` on all reputation-bearing outcomes.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action`).
- Editorial checklist (7 questions from the skill) passed on every template.

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms Builders templates fire.
- Export encounter log TSV and spot-read 5 random Builders outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `graph_op_executed` (critical for Builders — this is the one most likely to surface wiring gaps), `hidden_mark_placed`, `encounter_seed_planted`, `reputation_tally_applied`, `attachment_created`.
- Confirm via `graph.nodes` that at least one construction encounter produced a persistent structure node during a seeded CLI run. If no GraphOps fire, the migration has missed its systemic signature.
- Remove Builders Fellowship entries from legacy `ENCOUNTER_TEMPLATES` at end.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat→rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` |
| Aftermath effect kinds | `graphOpExecutor.ts`, `aftermathEffects.ts` | All existing kinds |
| Craftsmanship reputation axis | reputation trait registry | Material-honor / craftsmanship axis; confirm the axis name during implementation and file a follow-up if it is missing |

**Open question for CC to check at start (fail-soft):** The reputation registry currently covers authority/shadow/iron etc. If "craftsmanship" or "material-honor" is not yet a registered axis, CC should:

1. Prefer the closest existing axis (likely `iron`-adjacent "honor" or "reliability" depending on registry) for v1.
2. File a Phase 0 follow-up issue under the Encounter Format Migration project, labeled `Deferral`, titled "Register craftsmanship reputation axis for Builders Fellowship."
3. Note the substitution in the completion comment.

Do **not** block the migration on axis registration — ship the migration with the best-fit axis and the follow-up filed.

## Tracing

All traces exist. Builders migration emits (no new trace types):

```ts
// existing types — see src/types/traces.ts
encounter_aftermath_applied
encounter_aftermath_effect
graph_op_executed
hidden_mark_placed
encounter_seed_planted
reputation_tally_applied
attachment_created
intelligence_granted
```

## Fail-soft cases

| Failure | Fallback |
| -- | -- |
| GraphOp payload malformed | Executor rejects; trace `graph_op_failed`; encounter still resolves (cosmetic loss, no crash). |
| Craftsmanship axis missing | Substitute iron-adjacent axis per constants-table note; completion comment flags the substitution. |
| `{?has_artifact}` condition evaluates with no actor artifact | Conditional block omits quietly (standard enrichment behavior). |
| Named-attachment template id collision | GraphOps executor dedups by id; the second attempt is a no-op and the existing attachment persists. |
| Legacy template removal causes test breakage | Fix test by migrating it alongside, or scope the removal narrower. Do not skip tests. |

## Merge gating

Unchanged from THR-91 / THR-92: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). THR-134 is **In Review**. CC options:

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 closes during implementation, merge normally.

The invariant: **do not merge** Builders Fellowship templates before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 13 standard Builders templates + 2 lifecycle templates converted to UnifiedActionTemplate format
- [ ] Prose meets Threadbare bar (Builders voice consistent: patient-material, quiet satisfaction, cracking-inward-not-outward)
- [ ] Each template has ≥1 contextual aftermath reaction (GraphOp, reputation tally, hidden mark, encounter seed, or named-attachment creation)
- [ ] ≥4 templates fire a GraphOp on success, producing a persistent world node
- [ ] ≥3 craft-focused templates produce a named attachment via GraphOps (not just a reward pool tag)
- [ ] ≥6 templates carry a `{?has_artifact}` conditional branch
- [ ] `{name}` + pronouns in every prose field; ≥1 conditional block per template
- [ ] `reputationPolarity` set on all reputation-bearing outcomes
- [ ] Legacy Builders Fellowship entries removed from `ENCOUNTER_TEMPLATES`
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `graph_op_executed` trace fires)
- [ ] Codex review run + findings addressed
- [ ] Completion comment summarises main-template count (~15), any new effect-kind gaps discovered, and any axis-substitution note
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary. |
| #2 Inspectability | PASS | All traces exist; `graph_op_executed` makes the Builders-specific signature visible in DebugPanel. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. |
| #4 Fail-soft | PASS | Fail-soft table covers the five likely failure modes. |
| #5 Narrative over mechanical | PASS | External voice exemplar (Flawed Steel) ensures narrative is primary. |
| #6 Additive | PASS | Adds migrated templates; removes only the legacy entries being replaced. |
| #7 Performance budget | PASS with note | Per-template GraphOp on success is cheap; executor is already performance-tested. Large-project tier monuments persist as world nodes — fine at Builders' volume (<15 templates), profile if a future guild adds >100 GraphOps-heavy templates. |

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 2
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/encounters/flawed-steel-revised.md` — **Builders voice exemplar (authoritative)**
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — 7 engine capabilities (mandatory pre-read)
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- THR-89 completion (Thieves Guild) · THR-91 completion (Arcane Circle) · THR-92 handoff (Civic Guard)

---

*Prepared 2026-04-18 by Cowork. Moving THR-93 Idea → Ready for Dev.*
