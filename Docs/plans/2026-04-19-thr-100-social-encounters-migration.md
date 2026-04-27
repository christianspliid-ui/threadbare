# THR-100 · Social Encounters Migration — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 3 — Social
> Pattern parents: THR-89 (Thieves Guild pilot, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, in flight) · THR-93 (Builders Fellowship, Done)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. The migration framework is settled (Phase 0 infra shipped: adapter, `enrichProse()`, multi-target aftermath, aftermath tracing, GraphOps, world-shaping). Four guild migrations have already proved the workflow. This doc covers **only what is specific to Social Encounters** — the voice, the systemic signature, and why social is the most opportunistic phase for the relationship-shaped engine capabilities.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. ActionStepBranch present. GraphOps executor present and proven at Builders scale. Encounter-seed planting shipped (THR-104). Hidden-mark revelation shipped (THR-112). Intelligence-consumption shipped (THR-113). Multi-target aftermath shipped (THR-114). If a new effect-kind surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 14 social templates in `src/data/social-encounter-content.ts` rewritten to the Threadbare bar in social voice (relational, pressure-tempered, subtextual), with contextual aftermath per template minimum. **Social is the highest-leverage phase for encounter seeds, hidden marks, and reputation tallies** — social encounters ARE the canonical substrate for these systems. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render aftermath trace categories. Merge gating on THR-134 U4 applies. Spot-check only. |

**Wiring note:** Social is where the engine capabilities that were built abstractly (encounter seeds, hidden marks, multi-target aftermath) finally meet the content they were designed for. If these systems underperform at content scale, Social is where that surfaces. Report back any gaps via a Phase 0 follow-up; do not extend the executor inline.

## The quality-reference problem (same shape as Builders)

Social Encounters has **no in-file quality reference.** The existing file is placeholder-quality prose, zero authored aftermath, zero hidden marks, zero encounter seeds, zero explicit ActionStepBranch use. Every template is at baseline.

The quality reference is **external**:

1. **THR-89 completion (Thieves Guild)** — Threadbare aesthetic benchmark (sensory-first, concrete nouns, no superlatives). Thieves Guild is also the closest tonal analog — both trade in leverage, subtext, and witnessed promises. **Read Thieves Guild templates first.** The shape is: what-is-said vs. what-is-meant, the posture that gives the line away, the price paid for being heard.
2. **THR-93 completion (Builders Fellowship)** — Pattern validation at full scale; 15 templates with contextual aftermath and GraphOps. Builders proved the workflow; Social follows it.
3. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality for any migrated template.
4. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read. Social is the phase where the 7 engine capabilities are supposed to earn their keep.

## Voice + systemic affinity

### Voice

**Relational, pressure-tempered, subtextual. The words on the surface are the smallest part of what is being transacted.**

Social encounters are the Threadbearer's most literal expression — *threads of stories between mortals*. Every social template should read as if the narrator is watching two people and tracking *three* conversations: the words, the subtext, the postures. The register is *adult political* — people who know what they are doing, not storybook naive.

Contrast the guilds:

- **Thieves Guild** — conspiratorial, leverage-aware, "what does the other side know that we don't"
- **Arcane Circle** — precise-intellectual
- **Builders Fellowship** — patient-material
- **Civic Guard** — formal-that-cracks
- **Social (this phase)** — *mixed*. Each template sits somewhere on the diplomacy ↔ predation axis. Alliance-forging reads warmer; intimidation/sabotage/robbery reads colder; spy/investigate reads Thieves-adjacent. Match the register to the act.

**Anti-voice to reject:** generic fantasy-RPG dialogue tags ("'You have my sword,' he declared"), exposition-first prose ("the noble agrees to your terms and your reputation increases"), melodramatic betrayal theatre ("how DARE you"), or cozy-village gossip. Social at adult-political register means: one character knows more than the other at most moments, and the prose should make the reader feel which one.

**The leverage question** — nearly every social template has an implicit "does the actor have leverage?" branch. Leverage can be intelligence (from a prior Spy On), reputation (authority or shadow axis high), a prior debt (hidden mark), or a connection (`{?has_faction}`, `{ally:strongest}`). **Make the leverage question readable in prose.** This is the highest-ROI enrichment pattern for this file.

### Systemic signature (Social's five engine affinities)

Social is the **richest systemic phase** in the migration. It is the phase where the engine capabilities that were built for relational consequence finally operate at scale.

1. **Encounter seeds (relational consequences).** Social's defining signature. Negotiations that fail plant a seed: the slighted party seeks revenge. Alliances forged plant a seed: the new ally calls in a favor. Intimidation succeeds plant a seed: the cowed target waits for a moment of weakness. **At least 8 of 14 templates should plant an encounter seed on at least one outcome tier.** This is Social's equivalent of Builders' GraphOps.
2. **Hidden marks (social debts, witnessed promises, betrayals).** Every social transaction that isn't a clean exchange leaves a mark. A failed deceive plants "witnessed as a liar" on the actor in the target's intelligence. A sealed patronage plants "owed to {patron}" on the client. A failed duel plants "bested publicly" on the loser. **At least 6 templates should plant or reveal a hidden mark.** Use `hidden_mark_placed` trace, prefer the `witnessed_by` scope for betrayals and public failures.
3. **Reputation tallies across multiple axes.** Social encounters are the primary way reputation moves. Use the full axis palette (authority, shadow, honor, reliability, and craftsmanship where craft-adjacent — e.g. material trade). Polarity matters: intimidation raises shadow, persuasion raises authority, sabotage raises shadow and lowers honor. **Every reputation-bearing outcome must set `reputationPolarity`.** Target coverage: every template fires at least one reputation tally.
4. **`{?has_faction}` and `{ally:strongest}` / `{rival:strongest}` conditionals.** Social templates should read differently when the actor has faction backing vs. going it alone, or when they are approaching a known ally vs. a known rival. **At least 10 templates should carry a `{?has_faction}` branch, and at least 6 should reference `{ally:strongest}` or `{rival:strongest}`.** This is the second-highest enrichment opportunity in the file.
5. **ActionStepBranch for leverage (the step-level branching system).** Several social templates have "leverage vs no leverage" as the actual narrative fork, not a cosmetic prose branch. Where the leverage state meaningfully changes which step fires next, use ActionStepBranch — not just enrichment conditionals. **At least 4 templates should use an explicit `next` ActionStepBranch on leverage or reputation.** Leverage-bearing paths should advance faster or collapse difficulty; leverage-absent paths should use `continue_weakened` to propagate the disadvantage into the next step.

**Intelligence grants** — `spy_on` explicitly produces intelligence. That intelligence must be consumable (THR-113 shipped the consumption pathway). Make the granted intelligence concrete — a name, a location, a vulnerability — not a generic "you learn something useful."

## Template-count caveat

The issue title says "47 templates." This is the same step-count-vs-main-template confusion Builders and Civic Guard already documented. Actual main templates in `social-encounter-content.ts`:

- **14 standard encounter templates** (no separate lifecycle templates — social is a verb palette, not a guild)
- ~32 step entries total (from file survey: forge_alliance/2 + recruit_faction/2 + investigate_reputation/2 + spy_on/2 + negotiate_deal/2 + persuade/2 + intimidate/2 + deceive/2 + challenge_duel/3 + sabotage/3 + rob/2 + establish_patronage/3 + political_leverage/~3 + one more)

CC should:

- Migrate all **14 main templates**
- Reconcile the completion comment's coverage metric against **main-template count** (not step count)
- Mirror Thieves Guild + Builders + Arcane Circle framing for audit comparability
- Expect the completion comment to say "14 main templates / ~32 steps" not "47 templates"

## Representative template categories (from file survey)

The 14 templates span six categories. CC should preserve category distribution during rewrites and match the voice register to the category:

- **Alliance / Formation** — `forge_alliance`, `recruit_faction`, `establish_patronage`. Warmest register. Heavy `{?has_faction}` / `{ally:strongest}` branching. Alliance-success plants encounter seeds (the ally will call). Patronage plants a "owed to" hidden mark on the client.
- **Intelligence** — `investigate_reputation`, `spy_on`. Thieves-adjacent register — cold, observational. `spy_on` is the primary intelligence grant; investigate_reputation is a reputation-reveal (uses `hidden_mark_placed` with `revealed` scope or adjacent). Intelligence grants must be concrete.
- **Negotiation / Persuasion** — `negotiate_deal`, `persuade`. Register depends on stakes. Leverage branches heavily here (ActionStepBranch candidates). Successful deals plant encounter seeds (contract fulfillment, counter-party grievance if one side feels short-changed).
- **Coercion** — `intimidate`, `challenge_duel`, `rob`, `sabotage`. Colder register. Heavy hidden-mark usage (witnessed as aggressor, bested publicly, sabotage implicated). Reputation swings shadow up, honor/authority down unless the target deserved it per witnessed marks. `sabotage` is the template most likely to spawn a revenge encounter seed.
- **Deception** — `deceive`. Thieves-like in tone. Failure plants "witnessed as liar" hidden mark; success plants a seed that the deception will be discovered later (the revealed-lie encounter is part of the system's design — THR-132 mark-reveal-prose shipped).
- **Political** — `political_leverage`. The most complex template — should exercise `{ally:strongest}`, `{rival:strongest}`, `{?has_faction}`, reputation tallies on multiple axes, and at least one encounter seed. This is the Social phase's equivalent of the Builders "engineer_wonder" tier-elite exercise.

**Per-category hints for CC:**

- **Alliance / Formation** — warmest prose; forge_alliance and recruit_faction should feel like two people sizing each other up and deciding whether to trust. Patronage should feel like a debt being accepted.
- **Intelligence** — what-is-seen vs. what-is-known is the structural tension. `spy_on` grants intelligence as a concrete mark; `investigate_reputation` *reveals* a latent mark that was already there.
- **Negotiation / Persuasion** — ActionStepBranch is load-bearing here. Leverage-positive path: the other side already knows they're going to say yes. Leverage-absent path: every concession costs.
- **Coercion** — the Threadbare aesthetic is most tested here. No melodrama. The intimidated character is afraid in specific, observable ways (the hand that won't stop moving, the pause before the answer). The robber's success is not triumphant; it is precise and depleting.
- **Deception** — subtext is the whole template. The surface dialogue is one thing; the deception is the gap between surface and what the actor is actually doing. Failure is the target noticing the gap.
- **Political** — multi-axis, multi-actor. The actor moves against a rival *through* an ally. Use multi-target aftermath (THR-114) here if the template warrants it.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives.
- Wiring: `{name}` + pronouns in every prose field; ≥1 conditional block per template; `{?has_faction}`, `{ally:strongest}`, `{rival:strongest}`, `{location}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (encounter seed, hidden mark, reputation tally, intelligence grant, or authored attachment).
- `reputationPolarity` on all reputation-bearing outcomes.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action`).
- Editorial checklist (7 questions from the skill) passed on every template.
- ActionStepBranch used where leverage is load-bearing to the narrative fork (not cosmetic prose).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms social templates fire.
- Export encounter log TSV and spot-read 5 random social outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `encounter_seed_planted` (critical for Social — this is the signature), `hidden_mark_placed`, `reputation_tally_applied`, `intelligence_granted`, `attachment_created`.
- Confirm via `graph.nodes` that a seeded CLI run produces at least one encounter seed from a social template AND one hidden mark from a social template. If neither fires, the migration has missed its systemic signature.
- Spot-check in the browser via `?view=game&seeded`: trigger a social encounter, confirm the aftermath prose renders in EncounterVignetteModal and the Chronicle entry references the systemic consequence.
- Remove Social entries from legacy `ENCOUNTER_TEMPLATES` at end.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat → rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected |
| Reputation axes | reputation trait registry | authority, shadow, honor, reliability (confirm names during implementation) |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` — confirm scopes at implementation |

**Open question for CC to check at start (fail-soft):** Confirm which reputation axes are canonical in the registry. If an expected axis (e.g., "reliability" or "honor") is missing, substitute the closest existing axis, note in completion comment, and file a Phase 0 follow-up under the Encounter Format Migration project labeled `Deferral`. Do not block the migration on axis registration.

## Tracing

All traces exist. Social migration emits (no new trace types):

```ts
// existing types — see src/types/traces.ts
encounter_aftermath_applied
encounter_aftermath_effect
encounter_seed_planted
hidden_mark_placed
reputation_tally_applied
intelligence_granted
attachment_created
```

## Fail-soft cases

| Failure | Fallback |
| -- | -- |
| Encounter seed payload malformed | Executor rejects; trace `encounter_seed_failed`; encounter still resolves (cosmetic loss, no crash). |
| Hidden mark scope unknown | Fall back to `self`-scoped mark; completion comment flags it. |
| Reputation axis missing | Substitute closest axis; file Phase 0 follow-up; completion comment notes substitution. |
| `{?has_faction}` condition evaluates with no faction edge | Conditional block omits quietly (standard enrichment behavior). |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file a Phase 0 follow-up. |
| Intelligence grant target missing | Intelligence is recorded against the actor only; trace notes absent target. |
| Legacy template removal breaks tests | Fix test by migrating alongside, or scope removal narrower. Do not skip tests. |

## Merge gating

Unchanged from THR-91 / THR-92 / THR-93: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Social templates before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 14 social templates converted to UnifiedActionTemplate format
- [ ] Prose meets Threadbare bar (social register matched per category: warm for alliance, cold for coercion, thieves-adjacent for intelligence, subtextual for deception)
- [ ] Each template has ≥1 contextual aftermath reaction (encounter seed, hidden mark, reputation tally, intelligence grant, or named attachment)
- [ ] ≥8 templates plant an encounter seed on at least one outcome tier
- [ ] ≥6 templates plant or reveal a hidden mark
- [ ] Every reputation-bearing outcome sets `reputationPolarity` with correct axis polarity
- [ ] ≥10 templates carry a `{?has_faction}` branch
- [ ] ≥6 templates reference `{ally:strongest}` or `{rival:strongest}`
- [ ] ≥4 templates use explicit ActionStepBranch `next` on leverage or reputation (not cosmetic)
- [ ] `spy_on` grants concrete intelligence (specific, consumable — not generic "you learn something")
- [ ] `{name}` + pronouns in every prose field
- [ ] Legacy Social entries removed from `ENCOUNTER_TEMPLATES`
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `encounter_seed_planted` AND `hidden_mark_placed` fire from social templates)
- [ ] Completion comment summarises main-template count (14), counts of seeds/marks/reputation tallies authored, any axis substitutions, any ActionStepBranch patterns worth promoting to skill guidance
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary. |
| #2 Inspectability | PASS | All traces exist; `encounter_seed_planted` and `hidden_mark_placed` make Social's signature visible in DebugPanel. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry their own deterministic payloads. |
| #4 Fail-soft | PASS | Fail-soft table covers seven likely failure modes. |
| #5 Narrative over mechanical | PASS | External voice exemplars (Thieves Guild + pick-pocket-skill-test) anchor narrative register. |
| #6 Additive | PASS | Adds migrated templates; removes only the legacy entries being replaced. |
| #7 Performance budget | PASS with note | Encounter seeds are cheap to plant; ≥8 seeds × 14 templates fired per-encounter-run is well under budget. Profile only if a future content batch pushes seeds above ~200 active at once. |

## Coordination block

**Suggested model:** `model:sonnet` (matches THR-89 / THR-93 precedent; content-authoring at scale with high systemic wiring requirements, not a one-shot text edit)

**Parallel-safe with:** Other Phase 2/3 guild migrations in the backlog that touch different files (e.g., Arcane Circle deferrals, Civic Guard deferrals) — file surfaces don't collide.

**Mutex with:** Any in-flight work that touches `src/data/social-encounter-content.ts`, the unified-action-template types, or the encounter adapter/aftermath-effects engine surface. Check `list_issues state:"In Dev"` before claiming a parallel worktree.

**Codex review:** No. Content-only migration per Phase 1/2/3 precedent; no novel engine surface. Skip codex unless CC discovers a systemic gap worth a second pair of eyes.

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 3
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — **mandatory pre-read** (7 engine capabilities)
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-18-thr-93-builders-fellowship-migration.md` — most recent migration design delta (pattern parent)
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- THR-89 (Thieves Guild, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, in flight) · THR-93 (Builders Fellowship, Done)

---

*Prepared 2026-04-19 by Cowork. Moving THR-100 Idea → Ready for Dev.*
