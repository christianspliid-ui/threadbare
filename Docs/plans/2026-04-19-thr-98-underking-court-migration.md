# THR-98 · Underking Court Encounters — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 2 — Remaining Guilds
> Pattern parents: THR-89 (Thieves Guild pilot, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done) · THR-95 (Holy Order of Dawn, Ready for Dev — identical structure)
> Sibling design docs: `Docs/plans/2026-04-19-thr-95-holy-order-dawn-migration.md` (read this first — Underking Court is the shadow-mirror pass of the same framework)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. The migration framework is settled (Phase 0 infra shipped: adapter, `enrichProse()`, multi-target aftermath, aftermath tracing, GraphOps, world-shaping). Six guild migrations have already proved the workflow; THR-95 is the structural sibling (15 main templates, same audit+uplift shape). This doc covers **only what is specific to Underking Court** — the voice, the systemic signature, and why the Court is the most debt-coded guild in the roster.

## Starting position (delta from Thieves Guild / Arcane Circle)

`src/data/underking-court-encounter-content.ts` was **format-migrated** during THR-31 Phase 2b — it is already in `UnifiedActionTemplate` shape with voice-bible prose, `{?has_faction}` conditionals, and reputation tallies (13 `shadow.positive`/`shadow.negative` tallies counted). **The file is not starting at placeholder quality.** This is an **audit + uplift pass**, the same shape as THR-95:

- Read every template against the Phase 2 audit checklist.
- Identify which templates are already at the Phase 2 quality bar.
- Identify which templates need prose uplift, missing hidden marks, missing encounter seeds, or ActionStepBranch on debt/compact-state.
- Author the deltas. **Do not rewrite templates that are already at bar.**
- Run the editorial checklist (7 questions) on every template.

**Practical consequence:** time-budget comparable to THR-95 Holy Order. The quality bar and systemic-signature coverage are the same. Completion comment should flag which templates were uplifted vs. left as-is, for peer-guild audit comparability.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. ActionStepBranch present. GraphOps executor proven. Encounter-seed planting shipped. Hidden-mark revelation shipped. Intelligence-consumption shipped. Multi-target aftermath shipped. If a new effect-kind surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 15 Underking Court templates (13 standard quests + `UK_JOIN_TEMPLATE` + `UK_PROMOTION_TEMPLATE`) in `src/data/underking-court-encounter-content.ts` audited and raised to the Threadbare bar in Underking voice (regal-shadow, compact-weighted, euphemistic-eternal), with contextual aftermath per template minimum. **Underking Court is the canonical substrate for debt-ledger encounter seeds** — the Court *remembers what is owed*. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render aftermath trace categories. Merge gating on THR-134 U4 applies. Spot-check only. |

**Wiring note:** Underking Court is where debt-ledger encounter seeds earn their keep — the "Court remembers what is owed" is a *mechanical* claim, not a fictional flourish. Every favor extended, compact held, mark blackmailed, territory seized, or alliance betrayed should plant a concrete seed that fires on a deterministic delay. If the encounter-seed planting pipeline underperforms at Court content scale, that is Phase 0 feedback.

## The quality reference (external + in-file benchmark)

`underking-court-encounter-content.ts` already has voice coherence — the file header ("The Court speaks as if every conversation has been happening for a hundred years. Euphemism does work that a direct word would spoil. 'compact', 'old word', 'what is owed', 'long quiet' are load-bearing phrases") is a strong foundation. Quality reference for templates requiring uplift is partly in-file and partly external:

1. **THR-89 completion (Thieves Guild)** — **the critical tonal sibling and contrast**. Both factions share `shadow` as primary reach. Thieves Guild is tactical-conspiratorial ("what does the other side know that we don't"). Underking Court is **strategic-eternal** — the Court does not worry about what the other side knows; the Court has been here longer than they have. Read the Thieves Guild completion to see what Underking Court is *not*. The Court is not clever; it is patient.
2. **THR-95 (Holy Order of Dawn)** — structural sibling (15 templates, 5 categories, same audit shape). Holy Order is liturgical-that-costs; Underking Court is **institutional-that-is-owed**. Both are institutional-serious. Both are not-ironic. They are dark mirrors. If Holy Order is the Dawn, Underking Court is the long-quiet that predates the surface sky.
3. **THR-92 completion (Civic Guard)** — formal-that-cracks. Useful for senior and elite Court templates where the formal register must hold under strain (`uk.elite.shadow_coup`, `uk.elite.seize_territory`).
4. **THR-93 completion (Builders Fellowship)** — patient-material register. Useful precedent for the *patient* half of Underking Court's voice; Builders is patient about material, the Court is patient about *time*.
5. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality. Directly relevant: `uk.quest.pickpocket_run` is the Court's answer to the Thieves Guild pilot.
6. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read. Seven engine capabilities; Underking Court leans heaviest on **encounter seeds** and **hidden marks (witnessed-by-the-Court)**.
7. **In-file voice header (lines 1–8)** — read first. The euphemism vocabulary ("compact", "old word", "what is owed", "long quiet") is load-bearing. Any uplift that abandons euphemism is off-register.

## Voice + systemic affinity

### Voice

**Regal-of-shadows, compact-weighted, euphemistic-eternal. The Court speaks as if every conversation has been happening for a hundred years.**

The Court prose should read as if the narrator is watching institutions older than the surface kingdom operate with the calm of something that has already won. Register: **formal with slight archaism, euphemistic, patient cadence, short declaratives when the compact closes**. Long, assured sentences for the compact; short sentences for the blade in the side-alley, the body in the canal, the price called in.

The Court does not threaten. The Court *remembers*. That distinction is the voice in a sentence. The Court does not speak *of* what is owed; it speaks *about* it, in the old way, with words chosen to spare the direct meaning.

Contrast the guilds:

- **Thieves Guild** — conspiratorial, leverage-aware, tactical ("what does the other side know that we don't")
- **Arcane Circle** — precise-intellectual
- **Builders Fellowship** — patient-material
- **Civic Guard** — formal-that-cracks
- **Holy Order of Dawn** — liturgical-that-costs, Dawn-coded, oath-weighted (THR-95)
- **Underking Court (this phase)** — *regal-of-shadows*, compact-weighted, euphemistic-eternal. The Court is institutional crime that styles itself as a shadow government. Every favor is a ledger. Every compact is a debt that will be called in. The prose should make the reader feel the weight of something older than the city above.

**Anti-voice to reject (high-risk for this file):**

- Generic mob-boss tropes ("made you an offer you can't refuse", "the boss sends his regards", Italian-mafia code-switching) — the Court is *not* a crime family.
- Edgy-bad-boy criminal chic — the Court is not cool; it is old.
- Cynical nihilism ("there is no honor among thieves") — the Court has a great deal of honor; it is just a different kind of honor, with older rules. "The compact is held" is a *moral* statement in this voice.
- Breathless gangster drama — the Court does not rush. Nothing in Court prose should feel like a heist movie.
- Thieves-Guild voice bleeding across — both factions share `shadow` reach; do not share tonal register. If a sentence would fit in the Thieves Guild file, it is probably off-register for the Court.

**The Court's structural tension**: most Court templates are performed by people who *owe* the Court, not by people who chose it. That asymmetry — pawn vs. compact-holder — is the systemic substrate. Prose should read as if every character moves inside a ledger that was written before they were born. Promotion (pawn → enforcer → underboss → underking) is the slow admission that one has begun to write in the ledger rather than be written in it.

**The debt question** — nearly every Court template has an implicit "what does the Court call this *costs*?" branch. Debt is concrete. A favor done is a favor owed. A compact held earns the Court's memory; a compact broken earns the Court's other memory. **Make the debt-state readable in prose.** The Holy Order equivalent is "conviction-cost"; for Underking Court it is "compact-state" — is this actor acting with the Court's knowledge, against it, or underneath it? This is the highest-ROI enrichment pattern for this file.

### Systemic signature (Underking Court's five engine affinities)

Underking Court is the **long-memory phase** of the migration. It is the phase where "the world remembers what is owed" becomes a *mechanical* claim, not a narrative aspiration.

1. **Encounter seeds (the defining signature — debt-ledger).** The Court remembers what is owed. Every favor extended, compact held, mark blackmailed, territory seized, rival eliminated, or alliance betrayed should plant a concrete seed. Prefer seeding standard failures → senior templates (a failed `uk.quest.blackmail_mark` seeds a reprisal confrontation at senior tier), senior failures → elite templates (a failed `uk.senior.corrupt_official` seeds a `uk.elite.shadow_coup` opportunity or obstacle), and **cross-faction retaliation seeds** (a successful `uk.senior.eliminate_rival` against a Civic Guard or Holy Order target plants a cross-faction reprisal seed — this is where the Court's canonical rivalries become mechanical). **At least 8 of 15 templates should plant an encounter seed on at least one outcome tier.** This is Underking Court's defining systemic density — higher than Holy Order's ≥6 — because the Court's entire narrative premise is *the ledger*.

2. **Hidden marks (witnessed-by-the-Court — the Court remembers who paid).** Marks on the *actor* (self-scoped) for compacts broken; marks on the *target* (witnessed_by scope) for marks made; marks on *rival factions* (witnessed_by scope) when the Court interferes with Civic Guard / Holy Order operations. **At least 6 of 15 templates should plant or reveal a hidden mark.** Particularly: `uk.quest.blackmail_mark` should *always* plant a mark (it is in the template name); `uk.senior.corrupt_official` should plant a mark on the official; `uk.social.whisper_network` should reveal prior marks the Court has accumulated.

3. **Reputation tallies on shadow + heart + authority axes.** Underking Court's canonical alignment is `shadow.negative` (Infamous) + `heart.negative` (Manipulator). The existing file tallies `shadow.positive` and `shadow.negative` 13 times. **Opportunity: `heart.*` is not currently used in-file** (0 occurrences confirmed). Heart-axis tallies should appear on templates involving intimidation, corruption, blackmail, and whisper-network work — where a successful Court operation moves the actor toward `heart.negative` (Manipulator) whether or not they wanted it. **Every reputation-bearing outcome must set `reputationPolarity`.** Target coverage: every template fires at least one reputation tally; at least 5 templates fire a `heart.*` tally. Also consider `authority.negative` on elite templates (`uk.elite.seize_territory`, `uk.elite.shadow_coup`) — the Court's elite tier erodes legitimate authority.

4. **`{?has_faction}` branches (Court backing changes stakes).** The pawn acting on their own carries the compact on their own conviction. The pawn acting as the Court's hand inherits its reach *and* its ledger. **At least 10 templates should carry a `{?has_faction}` branch** that materially changes the stakes — not cosmetic framing, real consequence differentials. Look for opportunities to reference the Court's rank system (pawn → enforcer → underboss → underking) in prose; `uk.promotion` models the rank-ledger and can seed the rest. Prose pattern: when the Court is at the actor's back, the crowd does not look; when it isn't, the crowd might remember.

5. **ActionStepBranch on compact-state.** Templates with multi-step operations (`uk.senior.heist_planning`, `uk.senior.corrupt_official`, `uk.elite.seize_territory`, `uk.elite.shadow_coup`) have natural compact-vs-exposure forks: the Court-backed step advances with less friction; the exposed step collapses or rolls a harder difficulty. **At least 3 templates should use explicit `next` ActionStepBranch on compact-state or prior-mark state.** Compact-positive paths should advance faster or unlock the cleaner aftermath variant; compact-exposed paths should use `continue_weakened` to propagate the exposure into the next step. `uk.elite.shadow_coup` is the natural showcase — the coup either has the Court's full ledger behind it or it doesn't, and that should fork the step graph.

**Intelligence grants** — `uk.social.whisper_network` is the primary intelligence template in this file. The whisper pattern ends with a concrete intelligence grant: a name the Court has been keeping, a face a pawn saw in a market, a location a competing faction has been watching. THR-113 shipped the consumption pathway. Intelligence must be consumable by downstream templates (`uk.senior.blackmail_mark` [from standard], `uk.senior.eliminate_rival`, `uk.senior.corrupt_official`, `uk.elite.*`) — do not leave the grant generic. **Distinguish from Thieves Guild intelligence**: Thieves Guild intelligence is tactical (*how to get in*). Court intelligence is strategic (*who is owed, and by whom*).

## Template-count caveat

The issue title says "42 templates." Same step-count-vs-main-template confusion documented on Builders, Civic Guard, Holy Order, Social. Actual count in `underking-court-encounter-content.ts` (confirmed by file survey at lines 52–720, id grep):

- **13 standard encounter templates** in `UNDERKING_COURT_ENCOUNTER_TEMPLATES` (5 standard / 3 senior / 2 elite / 3 social)
- **2 lifecycle templates** exported separately: `UK_JOIN_TEMPLATE`, `UK_PROMOTION_TEMPLATE`
- **Total: 15 main templates** across ~35–40 step entries

CC should:

- Audit all **15 main templates** (13 standard + 2 lifecycle).
- Reconcile the completion comment's coverage metric against **main-template count** (not step count).
- Mirror Thieves Guild + Builders + Holy Order framing for audit comparability.
- Expect the completion comment to say "15 main templates (13 quest + 2 lifecycle) / ~35–40 steps" not "42 templates."

## Template categories (from file survey)

The 15 templates span five categories. CC should preserve category distribution during the audit and match the voice register to the category:

- **Lifecycle** — `uk.join`, `uk.promotion`. Register: the ledger opens. `uk.join` should dramatize the first favor accepted; `uk.promotion` should dramatize the first name the actor signs off on. The Court does not welcome; the Court *notes*.
- **Standard quests** — `uk.quest.pickpocket_run`, `uk.quest.fence_goods`, `uk.quest.protection_racket`, `uk.quest.smuggle_cargo`, `uk.quest.blackmail_mark`. Pawn-tier work. Low ledger-weight per template but high frequency. **Pickpocket_run is the Court's direct answer to the Thieves Guild pilot — voice test**. Fence_goods and smuggle_cargo are patient-material in register (the Court moves objects the way Builders move stone). Protection_racket and blackmail_mark are the compact-weighted register — both must plant marks or seeds.
- **Senior quests** — `uk.senior.heist_planning`, `uk.senior.eliminate_rival`, `uk.senior.corrupt_official`. Higher stakes; Court-wide consequences. Heist_planning is the Court's multi-beat strategic template (seed to an elite template on failure). Eliminate_rival is the primary cross-faction seed template — a Civic Guard or Holy Order target plants a reprisal seed with a deterministic delay. Corrupt_official is the primary hidden-mark template (marks the official, marks the city, marks the actor).
- **Elite quests** — `uk.elite.seize_territory`, `uk.elite.shadow_coup`. Maximum register-cost. Shadow_coup is the Court's `engineer_wonder`-equivalent — multi-axis, multi-beat, should exercise ActionStepBranch on compact-state. Seize_territory is the Court's territorial-reach template — large-scale GraphOps candidate (location-level reputation shift, tax-flow changes).
- **Social** — `uk.social.gambling_den`, `uk.social.black_market`, `uk.social.whisper_network`. Smallest register but **highest content texture**. Whisper_network is the intelligence template; gambling_den plants low-severity marks on patrons; black_market plants supply-chain seeds. Don't over-engineer; keep them short, specific, euphemistic.

**Per-category hints for CC:**

- **Lifecycle** — `uk.join` should read as *the actor discovers the Court was already there*; `uk.promotion` should read as *the actor begins to write in the ledger*. Both should end with the Court taking note — use "the long quiet", "the old word", "what is owed" as register anchors.
- **Standard quests** — the patient-material ones (fence_goods, smuggle_cargo) should feel like trade conducted in the register of trade; the compact-weighted ones (protection_racket, blackmail_mark) should feel like a door closing quietly. Pickpocket_run is the voice benchmark for standard tier — already at bar in `uk.quest.pickpocket_run.1`/`.2` per the file survey; use it as the in-file sibling reference.
- **Senior quests** — escalation. Seeded from standard failures. Cross-faction reprisal seeds earn their keep here.
- **Elite quests** — the Threadbare aesthetic is most tested here. No melodrama. The shadow coup is patient and specific; the territory seizure is old and precise.
- **Social** — contemplative, euphemistic, small. These are what give the Court its institutional texture — the sense that the Court has rooms you never see.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives. Court euphemism vocabulary (compact, old word, what is owed, long quiet) as register anchors.
- Wiring: `{name}` + pronouns in every prose field; ≥1 conditional block per template; `{?has_faction}`, `{ally:strongest}`, `{rival:strongest}`, `{location}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (encounter seed, hidden mark, reputation tally, intelligence grant, or authored attachment).
- `reputationPolarity` on all reputation-bearing outcomes.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action`).
- Editorial checklist (7 questions from the skill) passed on every template.
- ActionStepBranch used where compact-state is load-bearing to the narrative fork (not cosmetic prose).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms Court templates fire (seed an Underking Court-faction actor if necessary — spawn command in CLI `help`).
- Export encounter log TSV and spot-read 5 random Court outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `encounter_seed_planted` (critical for Underking Court — this is the signature), `hidden_mark_placed`, `reputation_tally_applied`, `intelligence_granted`, `attachment_created`.
- Confirm via `graph.nodes` that a seeded CLI run produces at least one encounter seed from a Court template AND one hidden mark from a Court template. If neither fires, the migration has missed its systemic signature.
- Cross-faction seed check: `uk.senior.eliminate_rival` against a Civic Guard/Holy Order target should plant a cross-faction reprisal seed visible in the graph. Confirm with CLI `eval state.graph.nodes.filter(n => n.category === 'encounter_seed' && n.properties.source === 'underking_court')`.
- Spot-check in the browser via `?view=game&seeded`: trigger a Court encounter, confirm aftermath prose renders in EncounterVignetteModal and the Chronicle entry references the systemic consequence.
- Legacy `ENCOUNTER_TEMPLATES` already clean — no Court entries to remove. If any UK id resurfaces in a legacy array during the audit, remove it; else this step is a no-op.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary plus Underking Court's existing constants block:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat → rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected |
| Reputation axes | reputation trait registry | shadow, heart, authority (confirm `heart.*` is canonical during audit) |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` — confirm scopes at implementation |
| `UK_DIFFICULTY_BASE`, `UK_DIFFICULTY_STEP`, `UK_SENIOR_BASE`, `UK_ELITE_BASE`, `UK_JOIN_DIFFICULTY`, `UK_PROMOTION_DIFFICULTY` | `underking-court-encounter-content.ts` | Existing per-file difficulty constants; re-use; do not introduce more |
| `FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS` | `faction-constants.ts` | Existing; re-use for encounter_seed delays |
| `FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY` | `faction-constants.ts` | Existing; re-use for hidden_mark severity |
| `FACTION_PROSE_HIDDEN_MARK_BETRAYAL_SEVERITY` | `faction-constants.ts` | Existing; re-use for betrayal-tier severity on `uk.senior.eliminate_rival` seeds |

**Open questions for CC to check at start (fail-soft):**

1. Confirm the `heart.*` reputation axis is canonical. The faction definition explicitly cites `heart.negative` (Manipulator) alignment, but the file currently uses 0 `heart.*` tallies. If the axis exists, this uplift pass should add `heart.negative` tallies on intimidation/blackmail/whisper templates (target: 5+ templates). If it does not exist, substitute `shadow.positive`/`shadow.negative` (already in use), note in completion comment, and file a Phase 0 follow-up labeled `Deferral`. **Do not block the migration on axis registration.**
2. Confirm `authority.negative` is canonical for elite-tier tallies on `uk.elite.seize_territory` / `uk.elite.shadow_coup`. Same fallback behavior.

## Tracing

All traces exist. Underking Court audit emits (no new trace types):

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
| `heart.*` axis unregistered | Substitute `shadow.positive`/`shadow.negative` (already in use); file Phase 0 follow-up labeled `Deferral`; completion comment notes substitution. |
| `authority.*` axis unregistered | Substitute `shadow.negative` for elite templates; file Phase 0 follow-up; completion comment notes substitution. |
| Encounter seed payload malformed | Executor rejects; trace `encounter_seed_failed`; encounter still resolves (cosmetic loss, no crash). |
| Hidden mark scope unknown | Fall back to `self`-scoped mark; completion comment flags it. |
| Cross-faction reprisal seed target faction missing (no Civic Guard or Holy Order actor in world) | Seed plants with generic `rival` target; executor resolves to nearest faction on consumption; no crash. |
| `{?has_faction}` condition evaluates with no faction edge | Conditional block omits quietly (standard enrichment behavior). |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file a Phase 0 follow-up. |
| Intelligence grant target missing (whisper_network) | Intelligence is recorded against the actor only; trace notes absent target. |
| Rank-gate mismatch (pawn firing elite template via debug spawn) | `minRank` in `UNDERKING_COURT_ENCOUNTER_META` gates normal flow; debug spawns bypass the gate — intentional for testing. |

## Merge gating

Unchanged from THR-91 / THR-92 / THR-93 / THR-95 / THR-100: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Court audits before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 15 Underking Court templates (13 standard + `UK_JOIN_TEMPLATE` + `UK_PROMOTION_TEMPLATE`) audited against the Phase 2 checklist
- [ ] Templates requiring uplift brought to Threadbare bar in Court voice (regal-shadow, compact-weighted, euphemistic-eternal)
- [ ] Templates already at bar left untouched; completion comment flags which
- [ ] Each template has ≥1 contextual aftermath reaction (encounter seed, hidden mark, reputation tally, intelligence grant, or named attachment)
- [ ] ≥8 templates plant an encounter seed on at least one outcome tier (Underking Court's defining signature — higher than Holy Order's ≥6 because the Court's premise is the ledger)
- [ ] ≥6 templates plant or reveal a hidden mark
- [ ] ≥1 cross-faction reprisal seed (`uk.senior.eliminate_rival` or similar) targeting Civic Guard / Holy Order
- [ ] Every reputation-bearing outcome sets `reputationPolarity` with correct axis polarity
- [ ] ≥5 templates fire a `heart.*` tally (subject to axis confirmation; see fail-soft)
- [ ] ≥10 templates carry a `{?has_faction}` branch with material stakes differential
- [ ] ≥3 templates use explicit ActionStepBranch `next` on compact-state or prior-mark state (not cosmetic); `uk.elite.shadow_coup` is the natural showcase
- [ ] `uk.social.whisper_network` grants concrete intelligence (specific, consumable by `uk.senior.*` or `uk.elite.*`)
- [ ] `uk.quest.blackmail_mark` plants a hidden mark on the target (always — template name demands it)
- [ ] `{name}` + pronouns in every prose field
- [ ] Legacy Underking Court entries in `ENCOUNTER_TEMPLATES` removed (confirmed already clean — no-op unless audit reveals otherwise)
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `encounter_seed_planted` AND `hidden_mark_placed` fire from Court templates)
- [ ] Cross-faction seed check: `eval state.graph.nodes.filter(n => n.category === 'encounter_seed' && n.properties.source === 'underking_court')` returns ≥1 after a CLI run
- [ ] Completion comment summarises main-template count (15), uplifted-vs-left-as-is split, counts of seeds/marks/reputation tallies authored, any axis substitutions (heart.*, authority.*), any ActionStepBranch patterns worth promoting to skill guidance
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary plus the existing `UK_*` and `FACTION_PROSE_*` blocks. |
| #2 Inspectability | PASS | All traces exist; `encounter_seed_planted` and `hidden_mark_placed` make the Court's signature visible in DebugPanel. The cross-faction reprisal seed check has a specific `eval` command for verification. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry their own deterministic payloads. Hidden marks are graph nodes — deterministic by seed. Cross-faction reprisal delays use `FACTION_PROSE_SEED_DELAY_SOCIAL_TICKS` (settled). |
| #4 Fail-soft | PASS | Fail-soft table covers nine likely failure modes, including axis substitution fallbacks and cross-faction target-missing. |
| #5 Narrative over mechanical | PASS | External voice exemplars (Thieves Guild as contrast, Holy Order as structural sibling, Civic Guard/Builders as register references) anchor narrative register. In-file voice-bible header provides the euphemism vocabulary. |
| #6 Additive | PASS | Audits/uplifts existing templates; removes only any legacy entries resurfacing during audit. |
| #7 Performance budget | PASS with note | Encounter seeds and hidden marks are cheap to plant; ≥8 seeds × 15 templates fired per-encounter-run is well under budget. Cross-faction reprisal seeds may cluster at cities where both Court and Guard/Order operate — profile only if active seed count exceeds ~800 across all factions. |

## Coordination block

**Suggested model:** `model:sonnet` (matches THR-89 / THR-93 / THR-95 / THR-100 precedent; content-authoring at scale with high systemic wiring requirements — audit pass demands careful reading of 900+ lines before deciding what to uplift, and the Thieves-Guild-voice-adjacency requires active tonal discrimination)

**Parallel-safe with:** Other Phase 2 remaining guild migrations that touch different files — THR-95 (Holy Order of Dawn · `holy-order-dawn-encounter-content.ts`, currently Ready for Dev), THR-96 (Lorekeepers Covenant · `lorekeepers-covenant-encounter-content.ts`), THR-99 (Temple of Spheres · `temple-of-spheres-encounter-content.ts`), THR-100 (Social · `social-encounter-content.ts`, currently In Dev/In Review). File surfaces do not collide.

**Mutex with:** Any in-flight work that touches `src/data/underking-court-encounter-content.ts`, the unified-action-template types, or the encounter adapter / aftermath-effects engine surface. Check `list_issues state:"In Dev"` before claiming a parallel worktree.

**Codex review:** No. Content-only migration per Phase 1/2/3 precedent; no novel engine surface. Skip codex unless CC discovers a systemic gap worth a second pair of eyes (e.g., the `heart.*` axis turns out not to exist AND the substitution pattern needs validation across multiple templates).

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 2
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — **mandatory pre-read** (7 engine capabilities)
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-19-thr-95-holy-order-dawn-migration.md` — **structural sibling** (same 15-template shape; read for audit framing)
- `Docs/plans/2026-04-18-thr-93-builders-fellowship-migration.md` — pattern parent (full-scale audit)
- `Docs/plans/2026-04-19-thr-100-social-encounters-migration.md` — most recent systemic-wiring sibling
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- In-file benchmark: `uk.quest.pickpocket_run` (at bar; read first for voice anchor)
- THR-89 (Thieves Guild, Done — **tonal contrast, both `shadow` reach**) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-95 (Holy Order of Dawn, Ready for Dev — **structural sibling**) · THR-97 (Rangers Brotherhood, Done)

---

*Prepared 2026-04-19 by Cowork. Moving THR-98 Idea → Ready for Dev.*
