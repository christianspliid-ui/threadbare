# THR-99 · Temple of Spheres Encounters — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 2 — Remaining Guilds
> Pattern parents: THR-89 (Thieves Guild, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done) · THR-95 (Holy Order of Dawn, In Progress) · THR-98 (Underking Court, In Progress)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. The migration framework is settled (Phase 0 infra shipped: adapter, `enrichProse()`, multi-target aftermath, aftermath tracing, GraphOps, world-shaping). Seven guild migrations have already proved the workflow (five fully landed, two in flight). This doc covers **only what is specific to Temple of Spheres** — the voice, the systemic signature, and why the Temple is the most *cosmological* guild in the roster.

## Starting position (important delta from Thieves Guild / Arcane Circle)

`src/data/temple-of-spheres-encounter-content.ts` was **format-migrated** during THR-31 Phase 2h — it is already in `UnifiedActionTemplate` shape with the Temple voice bible embedded at the top of the file, the `TS_*` difficulty constants block, `{?has_faction}` conditionals, aftermath reactions, and reputation tallies on `heart.positive` / `star.positive`. **The file is not starting at placeholder-quality the way Social or Civic Guard did.**

This changes the shape of the work. THR-99 is an **audit + uplift pass** rather than a re-author pass:

- Read every template against the Phase 2 audit checklist.
- Identify which templates are already at the Phase 2 quality bar (the file already sets the bar decently — `ts.quest.tend_shrine` and `ts.senior.sphere_communion` are close).
- Identify which templates need prose uplift, a missing hidden mark, a missing encounter seed, a `{?has_artifact}` branch, or an ActionStepBranch on open-sphere/closed-sphere state.
- Author the deltas. **Do not rewrite templates that are already at bar.**
- Run the editorial checklist (7 questions) on every template to verify the full file now meets Phase 2 criteria.

**Practical consequence:** the time-budget is smaller than Builders or Social. But the quality bar and the systemic signature coverage are the same. The completion comment should flag which templates were uplifted vs. which were left as-is, so the audit comparability with peer guilds is clean.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. ActionStepBranch present. GraphOps executor present and proven at Builders scale. Encounter-seed planting shipped (THR-104). Hidden-mark revelation shipped (THR-112). Intelligence-consumption shipped (THR-113). Multi-target aftermath shipped (THR-114). If a new effect-kind surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 15 Temple of Spheres templates (5 standard quests + 3 senior + 2 elite + 3 social + 2 lifecycle) in `src/data/temple-of-spheres-encounter-content.ts` audited and raised to the Threadbare bar in Temple voice (mystic, layered, careful, *weight*-and-*alignment*-coded), with contextual aftermath per template minimum. **Temple of Spheres is the canonical substrate for sphere-coded aftermath and cosmological witness hidden marks** — the spheres *remember* alignments offered and alignments broken. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render aftermath trace categories. Merge gating on THR-134 U4 applies. Spot-check only. |

**Wiring note:** Temple of Spheres is where sphere-specific reputation flow and cosmological-witness hidden marks earn their keep. Every rite the Temple performs *weighs* against the nine spheres — the fiction should be matched by the mechanics. If an aftermath fires a `heart.positive` reputation tally for a rite that should also shift `star.positive` (because it honored the visible sphere) or `shadow` (because it forced a passage through the closed sphere), the audit should notice and fix. Sphere-correlated reputation is the primary systemic fingerprint of this file.

## The quality reference (external, with in-file anchors)

`temple-of-spheres-encounter-content.ts` has a strong in-file voice bible at the top (lines 3–9) and the first template (`ts.quest.tend_shrine`) is already close to bar — read both first. The external quality reference for templates requiring uplift:

1. **THR-89 completion (Thieves Guild)** — Threadbare aesthetic benchmark (sensory-first, concrete nouns, no superlatives). Less directly applicable to Temple voice but foundational.
2. **THR-93 completion (Builders Fellowship)** — Pattern validation at full scale; patient-material register. Useful for the contemplative templates (`ts.quest.meditate_on_spheres`, `ts.quest.copy_scriptures`, `ts.social.evening_prayer`).
3. **THR-95 (Holy Order of Dawn)** — The closest tonal sibling. Holy Order is liturgical-that-costs; Temple of Spheres is *cosmological-that-weighs*. Both carry the "institutional faith without preachy-ness" problem — the difference is that Holy Order dramatizes *oath* while Temple dramatizes *alignment*. Read Holy Order's voice guidance and note the delta carefully.
4. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality for any migrated template.
5. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read. Seven engine capabilities; Temple of Spheres leans heaviest on reputation-axis precision, hidden marks, and `{?has_artifact}`.
6. **In-file voice bible** (lines 3–9) — the canonical source. Do not drift from "nine, weight, alignment, turning, open sphere, closed sphere, mote, orbit, passage. Never: god."
7. **In-file benchmark** — `ts.quest.tend_shrine` (lines 51–92). Already close to bar. "The Temple does not praise this. The Temple notices it." is the voice in a single sentence.

## Voice + systemic affinity

### Voice

**Cosmic reverence, sphere-specific resonance, the hum of aligned forces. Formal but not cold — awe, not worship.**

Temple of Spheres prose should read as if the narrator is watching a person work with *physics*, not *religion*. The nine spheres are forces — they have weight, alignment, orbit. The Temple's work is to tend the turning, not to beg or to praise. The register is **measured, precise, technical-about-the-metaphysical**, with the occasional moment of beauty when an alignment lands.

The Temple does not pray *to* the spheres. The Temple *aligns with* them. That distinction is the voice in a sentence. Characters *read the weight*, *open the passage*, *hold the orbit*, *close the rite*. They do not invoke, beseech, worship, or venerate.

Contrast the guilds:

- **Thieves Guild** — conspiratorial, leverage-aware, "what does the other side know that we don't"
- **Arcane Circle** — precise-intellectual, theory-first
- **Builders Fellowship** — patient-material, load-and-joint-first
- **Civic Guard** — formal-that-cracks
- **Holy Order of Dawn** — liturgical-that-costs
- **Temple of Spheres (this phase)** — *cosmological-that-weighs*. Every rite is a reading of alignment across the nine. The prose should make the reader feel the weight of forces working together — or failing to.

**Anti-voice to reject:** the worst sin for Temple prose is generic-fantasy cleric-ness ("I call upon the divine!", "by the light of the spheres!", prayers in quotation marks). Also reject: evangelical preachy-ness, the word *god* (the in-file bible explicitly forbids it — there are no gods, there are spheres), purple cosmic mysticism ("the astral resonance of the eternal…"), and grim-dark subversion ("the spheres are dead / indifferent / lies"). The Temple is *metaphysically serious* — the spheres work; the work has weight; the weight has cost.

**Temple of Spheres' structural tension**: the Temple *holds* nine spheres simultaneously. Every rite therefore has a *dominant* sphere and *subordinate* spheres, and the work consists of balancing them — not picking one. Prose should read as if the character is aware of all nine even when acting through one. "The heart-weight held. The mind-weight did not. {name} re-opens the passage and tries again."

**The alignment question** — nearly every Temple template has an implicit "which spheres did the work honor, and which did it force?" branch. An opened passage through the closed sphere costs something (the closed sphere was closed for a reason — opening it is transaction, not gift). A rite performed in the dominant sphere is cheap; a rite performed across sphere boundaries is expensive. **Make the sphere-state readable in prose.** The Holy Order equivalent is "conviction-cost"; for Temple it is "alignment-cost." This is the highest-ROI enrichment pattern for this file.

**The "never god" rule is load-bearing.** The in-file bible forbids the word *god*. It also forbids the posture. The narrator never suggests that a sphere has will, preference, or affection. The spheres *are*; the Temple *aligns*. If a template slips into personifying a sphere (the sphere is "pleased", "angry", "generous"), cut it. The weight was held, or it was not. The orbit closed, or it did not.

### Systemic signature (Temple of Spheres' five engine affinities)

Temple of Spheres is the **cosmological-weight phase** of the migration. It is the phase where "the spheres remember" becomes a *mechanical* claim — reputation flows across sphere-aligned axes, hidden marks are planted by cosmological witness, and `{?has_artifact}` branches mutate the passage-work.

1. **Sphere-specific aftermath + reputation polarity (the defining signature).** Temple rites are not generic reputation-moving actions. Every rite has a *dominant* reach that aligns with one of the nine spheres and a *contextual* reach for the subordinate work. The reputation tallies should map to the sphere(s) the rite honored: `heart.positive` for contemplative/healing rites, `star.positive` for visionary/attunement rites, `shadow` for rites that forced a passage through the closed sphere, and so on. The in-file templates already use `heart.positive` and `star.positive` — the audit should extend this to the full nine-sphere palette where the fiction calls for it. **Every template must fire at least one reputation tally with `reputationPolarity` set; ≥8 templates should fire reputation tallies on ≥2 sphere-aligned axes** (primary sphere + witnessing sphere). This is Temple of Spheres' equivalent of Social's encounter seeds or Builders' GraphOps.
2. **Hidden marks (cosmological witness — the spheres remember).** A rite performed cleanly leaves no mark. A rite performed with a forced passage, a broken alignment, or a cost paid in the closed sphere *does* leave a mark. Marks on the *actor* (self-scoped) for private alignment debt; marks on the *target* or *location* (witnessed_by) when the rite is consecrated in public; marks on the *artifact* (revealed later) when a relic is crafted with unresolved alignment. **At least 7 of 15 templates should plant or reveal a hidden mark.**
3. **Encounter seeds (attunement journeys and pilgrimage consequences).** A completed `ts.quest.meditate_on_spheres` plants a seed for `ts.senior.sphere_communion`. A consecrated ground seeds future pilgrimage encounters. A crafted relic seeds future theological-debate encounters *about the relic*. A founded cathedral seeds sphere-convergence events. **At least 6 of 15 templates should plant an encounter seed on at least one outcome tier.** Prefer seeding senior from standard, and elite from senior — the Temple's rank structure *is* the escalation ladder.
4. **`{?has_faction}` branches (Temple teaching vs. solo practitioner).** A practitioner working *within* the Temple inherits the weight of the institution's accumulated alignment; a practitioner working *alone* carries the whole alignment on their own reading. **At least 10 templates should carry a `{?has_faction}` branch** that materially changes the stakes — not cosmetic framing, real consequence differentials. Prefer `{?has_faction}` branches that reference rank (acolyte → high_priest → pontifex); `ts.promotion` is already the pattern for rank-strain and can seed the voice for the rest.
5. **ActionStepBranch on open-sphere / closed-sphere state.** Templates with multi-step rites (`ts.quest.tend_shrine`, `ts.senior.sphere_communion`, `ts.senior.craft_relic`, `ts.elite.sphere_convergence`, `ts.elite.found_cathedral`) have natural alignment forks: a step that opened the passage cleanly unlocks a faster closing step; a step that forced the passage triggers a `continue_weakened` with a harder difficulty on the closing. **At least 3 templates should use explicit `next` ActionStepBranch on sphere-state or prior-mark state** (not cosmetic).

**Additional systemic pattern worth authoring**: **`{?has_artifact}` branches**. Temple of Spheres is the guild where artifacts *matter most* systemically — a sphere-attuned relic changes the passage itself. A practitioner holding a sphere-attuned staff during a rite of communion is working through a different alignment than one without. **At least 3 templates should carry a `{?has_artifact}` branch** where the artifact materially changes the encounter (difficulty, aftermath reaction, prose beat). `ts.senior.craft_relic` is the obvious anchor — the crafted relic should leave a lasting `{?has_artifact}` hook on the actor for downstream templates.

**Intelligence grants** — `ts.senior.banish_corruption` is the primary intelligence-adjacent template. The banishment pattern reveals something about the corruption's source — a name, a location, a sphere that was forced open. THR-113 shipped the consumption pathway. If the revealed intelligence is a hidden mark on a third party, it should be consumable downstream by `ts.elite.sphere_convergence` or a Holy Order inquisition. Do not leave the grant generic.

## Template-count caveat

The issue title says "42 templates." This is the same step-count-vs-main-template confusion Builders, Civic Guard, Social, Holy Order, and Underking Court already documented. Actual count in `temple-of-spheres-encounter-content.ts`:

- **13 standard encounter templates** in `TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES` (5 standard quests + 3 senior + 2 elite + 3 social)
- **2 lifecycle templates** exported separately: `TS_JOIN_TEMPLATE`, `TS_PROMOTION_TEMPLATE`
- **Total: 15 main templates** across ~40 step entries

CC should:

- Audit all **15 main templates** (13 standard + 2 lifecycle).
- Reconcile the completion comment's coverage metric against **main-template count** (not step count).
- Mirror Thieves Guild + Builders + Arcane Circle + Holy Order framing for audit comparability.
- Expect the completion comment to say "15 main templates (13 quest + 2 lifecycle) / ~40 steps" not "42 templates."

## Template categories (from file survey)

The 15 templates span five categories. CC should preserve category distribution during the audit and match the voice register to the category:

- **Lifecycle** — `ts.join`, `ts.promotion`. Warmest register inside the Temple palette, but still alignment-aware. `ts.join` should dramatize the first reading of the nine — the acolyte who cannot yet hold all nine at once. `ts.promotion` should dramatize the rank-strain of attempting a high_priest rite as an acolyte.
- **Standard quests** — `ts.quest.tend_shrine`, `ts.quest.heal_the_sick`, `ts.quest.meditate_on_spheres`, `ts.quest.consecrate_ground`, `ts.quest.copy_scriptures`. Contemplative-to-transactional gradient. Tend_shrine and meditate_on_spheres are measured; heal_the_sick is tense (the sick body is a misalignment); consecrate_ground is transactional with lasting consequence (the ground *stays* consecrated or does not); copy_scriptures is textual and patient — should read like Builders' patient-material register transposed into metaphysics.
- **Senior quests** — `ts.senior.sphere_communion`, `ts.senior.banish_corruption`, `ts.senior.craft_relic`. Higher stakes; sphere-crossing work. Sphere_communion is the primary ActionStepBranch candidate (open-sphere/closed-sphere gating). Banish_corruption is the primary intelligence-revealing candidate. Craft_relic is the primary `{?has_artifact}`-seeding candidate (and the in-file sample at this scope is already strong — use as anchor).
- **Elite quests** — `ts.elite.sphere_convergence`, `ts.elite.found_cathedral`. Maximum register-cost. Sphere_convergence is the Temple's analog to Holy Order's Holy War — multi-axis, multi-beat, terrible if mishandled. Found_cathedral is lasting world-shape — should plant a GraphOps aftermath (new location node or promoted location subtype) if the wiring supports it. Check `graphOpExecutor` kinds before authoring.
- **Social** — `ts.social.evening_prayer`, `ts.social.alms_giving`, `ts.social.theological_debate`. Smallest register. Evening_prayer is the Temple's quietest moment — should read as nine weights held simultaneously in silence. Alms_giving is transactional faith expressed through coin and stone, not sermon. Theological_debate is the Temple's only template where *talk* is the action — the prose should make the ideas feel physical (an argument about open-sphere ethics has weight too).

**Per-category hints for CC:**

- **Lifecycle** — `ts.join` models the acolyte's first reading; `ts.promotion` models rank-strain. Both should reference the three ranks (acolyte / high_priest / pontifex) in prose where load-bearing.
- **Standard quests** — Tend_shrine is already the in-file benchmark. Extend its voice to heal_the_sick (the body as misalignment) and consecrate_ground (the land as substrate). Meditate_on_spheres should be the most *quiet* standard quest — prose should earn its calm. Copy_scriptures should treat text as a sphere the copyist must hold in alignment with the original.
- **Senior quests** — escalation. Sphere_communion is the ActionStepBranch candidate. Banish_corruption is where corruption is a *forced passage*, not a villainy — the corruption was an alignment that broke, and the banishment is a re-alignment. Avoid moral-horror framing.
- **Elite quests** — the Threadbare aesthetic is most tested here. No melodrama. Sphere_convergence is terrible because it is *large*, not because it is *evil*. Found_cathedral is a commitment of sphere-weight to a place — the prose should feel like an anchor being set.
- **Social** — contemplative, specific, small. Evening_prayer should not contain the word "prayer" in its prose (the posture is the prayer; naming it cheapens it). Alms_giving should be transactional and clean. Theological_debate is the Temple's most *talky* template — the prose should still honor the voice bible (no "god", no invocation).

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives. Temple voice bible additions: load-bearing lexicon (nine, weight, alignment, turning, open sphere, closed sphere, mote, orbit, passage); forbidden word: *god*.
- Wiring: `{name}` + pronouns in every prose field; ≥1 conditional block per template; `{?has_faction}`, `{?has_artifact}`, `{ally:strongest}`, `{rival:strongest}`, `{location}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (encounter seed, hidden mark, reputation tally, intelligence grant, or authored attachment).
- `reputationPolarity` on all reputation-bearing outcomes — with sphere-aligned axis correctness.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action` or `block` per in-file pattern).
- Editorial checklist (7 questions from the skill) passed on every template.
- ActionStepBranch used where open-sphere/closed-sphere state is load-bearing to the narrative fork (not cosmetic prose).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms Temple templates fire (seed a Temple-faction actor if necessary — spawn command in CLI `help`).
- Export encounter log TSV and spot-read 5 random Temple outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `hidden_mark_placed` (critical for Temple — cosmological witness), `encounter_seed_planted`, `reputation_tally_applied` (with sphere-aligned axis names), `intelligence_granted`, `attachment_created`.
- Confirm via `graph.nodes` that a seeded CLI run produces at least one hidden mark from a Temple template AND one encounter seed from a Temple template. If neither fires, the migration has missed its systemic signature.
- Spot-check in the browser via `?view=game&seeded`: trigger a Temple encounter, confirm the aftermath prose renders in EncounterVignetteModal and the Chronicle entry references the systemic consequence.
- Legacy `ENCOUNTER_TEMPLATES` already clean — no Temple entries to remove. If any `ts.*` id resurfaces in a legacy array during the audit, remove it; else this step is a no-op.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary plus Temple's existing constants block:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat → rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` / `block` |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected |
| Reputation axes | reputation trait registry | heart.positive, star.positive, shadow, plus sphere-aligned axes where canonical |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` — confirm scopes at implementation |
| `TS_DIFFICULTY_*`, `TS_SENIOR_BASE`, `TS_ELITE_BASE`, `TS_JOIN_DIFFICULTY`, `TS_PROMOTION_DIFFICULTY` | `temple-of-spheres-encounter-content.ts` | Existing per-file difficulty constants; re-use; do not introduce more |
| `FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS` | `faction-constants.ts` | Existing; re-use for encounter_seed delays |
| `FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY` | `faction-constants.ts` | Existing; re-use for hidden_mark severity |

**Open question for CC to check at start (fail-soft):** Confirm which sphere-aligned reputation axes are canonical (the in-file templates use `heart.positive` and `star.positive`; the full nine-sphere axis set may not all be registered). If an intended axis does not exist, substitute the closest canonical axis, note in completion comment, and file a Phase 0 follow-up under the Encounter Format Migration project labeled `Deferral`. Do not block the migration on axis registration.

## Tracing

All traces exist. Temple audit emits (no new trace types):

```ts
// existing types — see src/types/traces.ts
encounter_aftermath_applied
encounter_aftermath_effect
hidden_mark_placed
encounter_seed_planted
reputation_tally_applied
intelligence_granted
attachment_created
```

## Fail-soft cases

| Failure | Fallback |
| -- | -- |
| Hidden mark scope unknown | Fall back to `self`-scoped mark; completion comment flags it. |
| Encounter seed payload malformed | Executor rejects; trace `encounter_seed_failed`; encounter still resolves (cosmetic loss, no crash). |
| Reputation axis missing | Substitute closest canonical axis (prefer `heart.positive` / `star.positive`, already in use in-file); file Phase 0 follow-up; completion comment notes substitution. |
| `{?has_faction}` condition evaluates with no faction edge | Conditional block omits quietly (standard enrichment behavior). |
| `{?has_artifact}` condition evaluates with no artifact edge | Conditional block omits quietly (standard enrichment behavior). If the artifact-branch was load-bearing to the step's aftermath, audit the non-artifact aftermath path separately. |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file a Phase 0 follow-up. |
| Intelligence grant target missing (banish_corruption) | Intelligence is recorded against the actor only; trace notes absent target. |
| Rank-gate mismatch (e.g., acolyte firing elite template via debug spawn) | `minRank` in `TEMPLE_OF_SPHERES_ENCOUNTER_META` gates normal flow; debug spawns bypass the gate — this is intentional for testing. |
| GraphOps aftermath on `ts.elite.found_cathedral` unsupported (e.g., subtype promotion not available) | Fall back to encounter_seed + reputation tally; completion comment notes the deferral; file Phase 0 follow-up if the capability was expected. |

## Merge gating

Unchanged from THR-91 / THR-92 / THR-93 / THR-95 / THR-98 / THR-100: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Temple of Spheres audits before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 15 Temple templates (5 standard quests + 3 senior + 2 elite + 3 social + `ts.join` + `ts.promotion`) audited against the Phase 2 checklist
- [ ] Templates requiring uplift brought to Threadbare bar in Temple voice (mystic, layered, careful, sphere-vocabulary load-bearing; never "god")
- [ ] Templates already at bar left untouched; completion comment flags which
- [ ] Each template has ≥1 contextual aftermath reaction (encounter seed, hidden mark, reputation tally, intelligence grant, or named attachment)
- [ ] Every template fires at least one reputation tally with `reputationPolarity` set
- [ ] ≥8 templates fire reputation tallies on ≥2 sphere-aligned axes (primary sphere + witnessing sphere)
- [ ] ≥7 templates plant or reveal a hidden mark (Temple's cosmological-witness signature)
- [ ] ≥6 templates plant an encounter seed on at least one outcome tier
- [ ] ≥10 templates carry a `{?has_faction}` branch with material stakes differential
- [ ] ≥3 templates carry a `{?has_artifact}` branch that materially changes the encounter (not cosmetic framing)
- [ ] ≥3 templates use explicit ActionStepBranch `next` on open-sphere/closed-sphere or prior-mark state (not cosmetic)
- [ ] `ts.senior.banish_corruption` grants concrete intelligence (specific, consumable by `ts.elite.sphere_convergence` or cross-guild templates)
- [ ] `ts.elite.found_cathedral` considers GraphOps aftermath (new location node or subtype promotion) — if wiring unsupported, fall back to seed+reputation and note in completion comment
- [ ] `{name}` + pronouns in every prose field
- [ ] Forbidden word *god* absent from every prose field (voice-bible invariant)
- [ ] Legacy Temple entries in `ENCOUNTER_TEMPLATES` removed (confirmed already clean — no-op unless audit reveals otherwise)
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `hidden_mark_placed` AND `encounter_seed_planted` fire from Temple templates)
- [ ] Completion comment summarises main-template count (15), uplifted-vs-left-as-is split, counts of marks/seeds/reputation tallies authored, any axis substitutions, any ActionStepBranch patterns worth promoting to skill guidance, any `{?has_artifact}` patterns worth promoting
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary plus the existing `TS_*` and `FACTION_PROSE_*` blocks. |
| #2 Inspectability | PASS | All traces exist; `hidden_mark_placed` and `encounter_seed_planted` make Temple's signature visible in DebugPanel. Sphere-axis reputation tallies surface in `reputation_tally_applied` with axis names — visible delta is the whole audit signal. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry their own deterministic payloads. Hidden marks are graph nodes — deterministic by seed. |
| #4 Fail-soft | PASS | Fail-soft table covers nine likely failure modes including `{?has_artifact}` and GraphOps-on-found_cathedral. |
| #5 Narrative over mechanical | PASS | In-file voice bible is canonical; external voice exemplars (Holy Order, Builders) anchor sibling registers; Threadbare aesthetic holds. |
| #6 Additive | PASS | Audits/uplifts existing templates; removes only any legacy entries resurfacing during audit. |
| #7 Performance budget | PASS with note | Hidden marks and encounter seeds are cheap to plant; ≥7 marks × 15 templates fired per-encounter-run is well under budget. Profile only if Temple content scale pushes active marks above ~500 across all actors. |

## Coordination block

**Suggested model:** `model:sonnet` (matches THR-89 / THR-93 / THR-95 / THR-98 / THR-100 precedent; content-authoring at scale with high systemic wiring requirements, not a one-shot text edit — and the audit pass demands careful reading of 700+ lines before deciding what to uplift, plus sphere-aligned reputation-axis reasoning that rewards a thinking model)

**Parallel-safe with:** Other Phase 2 remaining guild migrations that touch different files — THR-95 (Holy Order · `holy-order-dawn-encounter-content.ts`), THR-96 (Lorekeepers · `lorekeepers-covenant-encounter-content.ts`), THR-98 (Underking Court · `underking-court-encounter-content.ts`), THR-100 (Social · `social-encounter-content.ts`). File surfaces do not collide.

**Mutex with:** Any in-flight work that touches `src/data/temple-of-spheres-encounter-content.ts`, the unified-action-template types, the encounter adapter / aftermath-effects engine surface, the reputation axis registry (additions there affect this audit's sphere-axis reasoning), or the `graphOpExecutor` (found_cathedral's possible GraphOps aftermath depends on it). Check `list_issues state:"In Dev"` before claiming a parallel worktree.

**Codex review:** No. Content-only migration per Phase 1/2/3 precedent; no novel engine surface. Skip codex unless CC discovers a systemic gap worth a second pair of eyes (e.g., the sphere-aligned axis set turns out to be incomplete and substitution pattern needs validation across the nine spheres).

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 2
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — **mandatory pre-read** (7 engine capabilities)
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-18-thr-93-builders-fellowship-migration.md` — pattern parent (full-scale audit)
- `Docs/plans/2026-04-19-thr-95-holy-order-dawn-migration.md` — closest tonal sibling (liturgical-that-costs ↔ cosmological-that-weighs)
- `Docs/plans/2026-04-19-thr-98-underking-court-migration.md` — concurrent sibling design delta
- `Docs/plans/2026-04-19-thr-100-social-encounters-migration.md` — recent sibling design delta
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- In-file voice bible: `src/data/temple-of-spheres-encounter-content.ts` lines 3–9
- In-file benchmark: `ts.quest.tend_shrine` (close to bar; read first)
- THR-89 (Thieves Guild, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done) · THR-95 (Holy Order, In Progress) · THR-98 (Underking Court, In Progress)

---

*Prepared 2026-04-19 by Cowork. Moving THR-99 Idea → Ready for Dev.*
