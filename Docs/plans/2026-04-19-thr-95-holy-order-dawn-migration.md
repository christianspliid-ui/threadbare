# THR-95 · Holy Order of Dawn Encounters — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 2 — Remaining Guilds
> Pattern parents: THR-89 (Thieves Guild pilot, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. The migration framework is settled (Phase 0 infra shipped: adapter, `enrichProse()`, multi-target aftermath, aftermath tracing, GraphOps, world-shaping). Five guild migrations have already proved the workflow. This doc covers **only what is specific to Holy Order of Dawn** — the voice, the systemic signature, and why the order is the most sacrifice-coded guild in the roster.

## Starting position (important delta from Thieves Guild / Arcane Circle)

`src/data/holy-order-dawn-encounter-content.ts` was **format-migrated** during THR-31 — it is already in `UnifiedActionTemplate` shape with Threadbare-adjacent prose, `{?has_faction}` / `{?has_ally}` conditionals, hidden marks, encounter seeds, reputation tallies. **The file is not starting at placeholder-quality the way Social or Civic Guard did.**

This changes the shape of the work. THR-95 is an **audit + uplift pass** rather than a re-author pass:

- Read every template against the Phase 2 audit checklist.
- Identify which templates are already at the Phase 2 quality bar (some will be).
- Identify which templates need prose uplift, a missing hidden mark, a missing encounter seed, or an ActionStepBranch on conviction / oath-state.
- Author the deltas. **Do not rewrite templates that are already at bar.**
- Run the editorial checklist (7 questions) on every template to verify the full file now meets Phase 2 criteria.

**Practical consequence:** the time-budget is smaller than Builders or Social. But the quality bar and the systemic signature coverage are the same. The completion comment should flag which templates were uplifted vs. which were left as-is, so the audit comparability with peer guilds is clean.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. ActionStepBranch present. GraphOps executor present and proven at Builders scale. Encounter-seed planting shipped (THR-104). Hidden-mark revelation shipped (THR-112). Intelligence-consumption shipped (THR-113). Multi-target aftermath shipped (THR-114). If a new effect-kind surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 15 Holy Order templates (13 standard quests + `hod.join` + `hod.promotion`) in `src/data/holy-order-dawn-encounter-content.ts` audited and raised to the Threadbare bar in Holy Order voice (liturgical, oath-weighted, sacrifice-coded), with contextual aftermath per template minimum. **Holy Order is the canonical substrate for moral-witness hidden marks** — the order *remembers* acts of faith and failure. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render aftermath trace categories. Merge gating on THR-134 U4 applies. Spot-check only. |

**Wiring note:** Holy Order is where moral-witness hidden marks earn their keep — the "order remembers" is a *mechanical* claim, not a fictional flourish. Every failed vigil, broken oath, or compromised rite should leave an inspectable mark. If the hidden-mark reveal pipeline underperforms at Holy Order content scale, that is Phase 0 feedback.

## The quality reference (external, not in-file)

`holy-order-dawn-encounter-content.ts` has a *partial* in-file quality reference — some templates are already at bar (see `hod.quest.temple_vigil` for the benchmark). But the quality reference for templates requiring uplift is **external**:

1. **THR-89 completion (Thieves Guild)** — Threadbare aesthetic benchmark (sensory-first, concrete nouns, no superlatives). Useful for intelligence-coded templates (`hod.senior.inquisition`).
2. **THR-93 completion (Builders Fellowship)** — Pattern validation at full scale; patient-material register. Useful for the contemplative templates (`hod.quest.temple_vigil`, `hod.quest.purify_shrine`, `hod.social.tend_wounded`).
3. **THR-92 completion (Civic Guard)** — Formal-that-cracks register; the closest tonal sibling. Holy Order shares the "institutional voice" problem but trades cracks-under-pressure for costs-of-faith. Read Civic Guard for the tension between formal cadence and human failure.
4. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality for any migrated template.
5. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read. Seven engine capabilities; Holy Order leans heaviest on hidden marks and encounter seeds.
6. **In-file benchmark** — `hod.quest.temple_vigil` (lines ~62–208). Read this template first. It is the voice, the systemic density, and the aftermath-variant pattern the rest of the file should match.

## Voice + systemic affinity

### Voice

**Conviction, sacrifice, the weight of oaths. Liturgical cadence. Beauty that demands a cost.**

Holy Order prose should read as if the narrator is watching a rite performed by people who believe, but are not naive about what belief costs. The register is **formal with slight archaism, punctuated by short declaratives when cost is paid**. Long, assured sentences for the rite; short sentences for the blade, the wound, the body in the dust.

The Dawn does not praise. The Dawn *notices*. That distinction is the voice in a sentence. The order does not speak *of* things; it speaks *about* them in the second hand, in the quiet way, at the hour the faithful don't name.

Contrast the guilds:

- **Thieves Guild** — conspiratorial, leverage-aware, "what does the other side know that we don't"
- **Arcane Circle** — precise-intellectual
- **Builders Fellowship** — patient-material
- **Civic Guard** — formal-that-cracks
- **Holy Order of Dawn (this phase)** — *liturgical-that-costs*. Every rite has a weight. Every oath is a ledger that will be called in. The prose should make the reader feel the price of being seen by the light.

**Anti-voice to reject:** the worst sin for Holy Order prose is generic-fantasy paladin-ness ("for the light!", "I strike in the name of…", heroic declarations). Also reject evangelical preachy-ness, crisis-of-faith melodrama ("has the Dawn abandoned me?"), and grim-dark subversion ("the order is secretly corrupt"). The order is institutionally serious, personally costly, and *not ironic*. The prose earns the faith by showing what it costs, not by asserting it.

**Holy Order's structural tension**: most rites are performed by people who *chose* the burden. That choice, made and re-made, is the systemic substrate. Prose should read as if every character holds a decision they could revoke but don't.

**The oath question** — nearly every Holy Order template has an implicit "is the actor still in good faith?" branch. Faith can be strained by prior broken vows (hidden marks), by unresolved heresies witnessed (investigation intelligence), by rank strain (senior/elite templates require conviction the squire isn't yet tested for). **Make the oath-state readable in prose.** The Civic Guard equivalent is "authority-pressure"; for Holy Order it is "conviction-cost." This is the highest-ROI enrichment pattern for this file.

### Systemic signature (Holy Order's five engine affinities)

Holy Order is the **moral-consequence phase** of the migration. It is the phase where "the world remembers" becomes a *mechanical* claim, not a narrative aspiration.

1. **Hidden marks (moral witness — the defining signature).** The order remembers. Every compromised rite, broken vow, witnessed heresy, mercy granted against orders, or cruelty chosen over compassion should plant a mark. Marks on the *actor* (self-scoped) for private failures; marks on the *target* (witnessed_by scope) for confrontations; marks on *third parties* (witnessed_by) when the rite occurs in public view. **At least 8 of 15 templates should plant or reveal a hidden mark.** This is Holy Order's equivalent of Social's encounter seeds or Builders' GraphOps.
2. **Encounter seeds (broken vows create future confrontations).** A compromised vigil seeds a cleansing quest. A failed duel seeds a reckoning. A heresy uncovered seeds an inquisition. An oath broken seeds a return-of-the-wronged. **At least 6 of 15 templates should plant an encounter seed on at least one outcome tier.** Prefer seeding to guild-internal templates (`hod.senior.*`) from standard-tier failures, and to elite templates from senior failures — the order escalates its own consequences.
3. **Reputation tallies on faith + honor + authority axes.** Holy Order is the primary way the *faith* reputation axis (if canonical) and the *honor* axis move. Use polarity correctly: successful rites raise authority/honor; compromised rites lower honor; rank-misaligned actions (squire attempting elite work) raise shadow. **Every reputation-bearing outcome must set `reputationPolarity`.** Target coverage: every template fires at least one reputation tally.
4. **`{?has_faction}` branches (order backing changes stakes).** The squire acting alone carries the rite on their own conviction. The squire acting as the order's hand inherits its authority *and* its expectations. **At least 10 templates should carry a `{?has_faction}` branch** that materially changes the stakes — not cosmetic framing, real consequence differentials. Look for opportunities to reference the order's rank system (squire → knight → knight_commander) in prose; `hod.promotion` already models this and can seed the rest.
5. **ActionStepBranch on conviction / oath-state.** Templates with multi-step rites (`hod.quest.temple_vigil`, `hod.senior.cleanse_corruption`, `hod.elite.holy_war`, `hod.elite.divine_trial`) have natural leverage-vs-weakness forks: the faithful step advances; the compromised step collapses or rolls a harder difficulty. **At least 3 templates should use explicit `next` ActionStepBranch on conviction or prior-mark state.** Conviction-positive paths should advance faster or unlock the cleaner aftermath variant; conviction-absent paths should use `continue_weakened` to propagate the cost into the next step.

**Intelligence grants** — `hod.senior.inquisition` is the primary intelligence template in this file. The investigation pattern ends with a concrete intelligence grant: a name, a location, a heretic's mark. THR-113 shipped the consumption pathway. Intelligence must be consumable by downstream templates (`hod.senior.cleanse_corruption`, `hod.elite.holy_war`) — do not leave the grant generic.

## Template-count caveat

The issue title says "42 templates." This is the same step-count-vs-main-template confusion Builders, Civic Guard, and Social already documented. Actual count in `holy-order-dawn-encounter-content.ts`:

- **13 standard encounter templates** in `HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES`
- **2 lifecycle templates** exported separately: `HOD_JOIN_TEMPLATE`, `HOD_PROMOTION_TEMPLATE`
- **Total: 15 main templates** across ~40 step entries

CC should:

- Audit all **15 main templates** (13 standard + 2 lifecycle).
- Reconcile the completion comment's coverage metric against **main-template count** (not step count).
- Mirror Thieves Guild + Builders + Arcane Circle framing for audit comparability.
- Expect the completion comment to say "15 main templates (13 quest + 2 lifecycle) / ~40 steps" not "42 templates."

## Template categories (from file survey)

The 15 templates span five categories. CC should preserve category distribution during the audit and match the voice register to the category:

- **Lifecycle** — `hod.join`, `hod.promotion`. Warmest register inside the Holy Order palette, but still cost-aware. `hod.join` already models the "oath as transaction" beat well — treat it as in-file benchmark. Promotion should dramatize rank-strain (squire attempting senior-eligible work).
- **Standard quests** — `hod.quest.temple_vigil`, `hod.quest.purify_shrine`, `hod.quest.escort_pilgrims`, `hod.quest.slay_abomination`, `hod.quest.deliver_judgment`. Contemplative-to-active gradient. Vigil and purify are meditative; escort is tense-procedural; slay is combat; deliver_judgment carries moral weight (intentional fork: is the judgment just?). Heavy hidden-mark usage.
- **Senior quests** — `hod.senior.cleanse_corruption`, `hod.senior.lead_crusade`, `hod.senior.inquisition`. Higher stakes; order-wide consequences. Crusade plants multi-target aftermath candidates (THR-114). Inquisition is the primary intelligence template. Cleanse_corruption is the primary hidden-mark-reveal candidate (uncovers prior marks on a location or target).
- **Elite quests** — `hod.elite.holy_war`, `hod.elite.divine_trial`. Maximum register-cost. Holy War is narratively the closest thing Holy Order has to Builders' `engineer_wonder` — complex, multi-axis, multi-beat. Divine Trial is the order's self-test; should exercise ActionStepBranch on conviction/prior-mark state.
- **Social** — `hod.social.dawn_prayer`, `hod.social.blessing_ceremony`, `hod.social.tend_wounded`. Smallest register. These are the quiet templates that give the order its texture. Low systemic weight per template, but they are what makes the Dawn feel inhabited. Don't over-engineer; keep them short and specific.

**Per-category hints for CC:**

- **Lifecycle** — `hod.join` is already at bar; `hod.promotion` should feel like a weight being handed over. The prose should make the reader feel the rank-cost.
- **Standard quests** — the contemplative ones (vigil, purify) lean on *absence* of action; the active ones (slay, deliver_judgment) lean on cost. The moral-ambiguity beat in `deliver_judgment` is the test of the voice — if it reads as preachy, cut back to observation.
- **Senior quests** — escalation. Seeded from standard failures. Inquisition is where intelligence grants concrete; cleanse_corruption is where prior hidden marks *reveal*.
- **Elite quests** — the Threadbare aesthetic is most tested here. No melodrama. The Holy War is terrible and specific; the Divine Trial is a rite the narrator takes seriously.
- **Social** — contemplative, specific, small. Prayer templates should *not* include the god's voice; they should include the hand on the stone, the knee on the floor, the breath held too long.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives.
- Wiring: `{name}` + pronouns in every prose field; ≥1 conditional block per template; `{?has_faction}`, `{ally:strongest}`, `{rival:strongest}`, `{location}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (encounter seed, hidden mark, reputation tally, intelligence grant, or authored attachment).
- `reputationPolarity` on all reputation-bearing outcomes.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action`).
- Editorial checklist (7 questions from the skill) passed on every template.
- ActionStepBranch used where conviction/oath-state is load-bearing to the narrative fork (not cosmetic prose).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms Holy Order templates fire (seed a Dawn-faction actor if necessary — spawn command in CLI `help`).
- Export encounter log TSV and spot-read 5 random Holy Order outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `hidden_mark_placed` (critical for Holy Order — this is the signature), `encounter_seed_planted`, `reputation_tally_applied`, `intelligence_granted`, `attachment_created`.
- Confirm via `graph.nodes` that a seeded CLI run produces at least one hidden mark from a Holy Order template AND one encounter seed from a Holy Order template. If neither fires, the migration has missed its systemic signature.
- Spot-check in the browser via `?view=game&seeded`: trigger a Holy Order encounter, confirm the aftermath prose renders in EncounterVignetteModal and the Chronicle entry references the systemic consequence.
- Legacy `ENCOUNTER_TEMPLATES` already clean — no Holy Order entries to remove. If any HOD id resurfaces in a legacy array during the audit, remove it; else this step is a no-op.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary plus Holy Order's existing constants block:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat → rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected |
| Reputation axes | reputation trait registry | authority, honor, shadow, faith (confirm names during implementation) |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` — confirm scopes at implementation |
| `HOD_DIFFICULTY_*` | `holy-order-dawn-encounter-content.ts` | Existing per-file difficulty constants; re-use; do not introduce more |
| `FACTION_PROSE_SEED_DELAY_QUEST_TICKS` | `faction-constants.ts` | Existing; re-use for encounter_seed delays |
| `FACTION_PROSE_HIDDEN_MARK_*_SEVERITY` | `faction-constants.ts` | Existing; re-use for hidden_mark severity |

**Open question for CC to check at start (fail-soft):** Confirm the `faith` reputation axis exists (if it does); if not, substitute `honor` or `star.positive` (already in use in-file at line 195), note in completion comment, and file a Phase 0 follow-up under the Encounter Format Migration project labeled `Deferral`. Do not block the migration on axis registration.

## Tracing

All traces exist. Holy Order audit emits (no new trace types):

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
| Reputation axis missing | Substitute closest axis (prefer `star.positive` / `star.negative`, already in use in-file); file Phase 0 follow-up; completion comment notes substitution. |
| `{?has_faction}` condition evaluates with no faction edge | Conditional block omits quietly (standard enrichment behavior). |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file a Phase 0 follow-up. |
| Intelligence grant target missing (inquisition) | Intelligence is recorded against the actor only; trace notes absent target. |
| Rank-gate mismatch (e.g., squire firing elite template via debug spawn) | `minRank` in `HOLY_ORDER_DAWN_ENCOUNTER_META` gates normal flow; debug spawns bypass the gate — this is intentional for testing. |

## Merge gating

Unchanged from THR-91 / THR-92 / THR-93 / THR-100: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Holy Order audits before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 15 Holy Order templates (13 standard + `hod.join` + `hod.promotion`) audited against the Phase 2 checklist
- [ ] Templates requiring uplift brought to Threadbare bar in Holy Order voice (liturgical, oath-weighted, sacrifice-coded)
- [ ] Templates already at bar left untouched; completion comment flags which
- [ ] Each template has ≥1 contextual aftermath reaction (encounter seed, hidden mark, reputation tally, intelligence grant, or named attachment)
- [ ] ≥8 templates plant or reveal a hidden mark (Holy Order's defining signature)
- [ ] ≥6 templates plant an encounter seed on at least one outcome tier
- [ ] Every reputation-bearing outcome sets `reputationPolarity` with correct axis polarity
- [ ] ≥10 templates carry a `{?has_faction}` branch with material stakes differential
- [ ] ≥3 templates use explicit ActionStepBranch `next` on conviction or prior-mark state (not cosmetic)
- [ ] `hod.senior.inquisition` grants concrete intelligence (specific, consumable by `hod.senior.cleanse_corruption` or `hod.elite.holy_war`)
- [ ] `{name}` + pronouns in every prose field
- [ ] Legacy Holy Order entries in `ENCOUNTER_TEMPLATES` removed (confirmed already clean — no-op unless audit reveals otherwise)
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `hidden_mark_placed` AND `encounter_seed_planted` fire from Holy Order templates)
- [ ] Completion comment summarises main-template count (15), uplifted-vs-left-as-is split, counts of marks/seeds/reputation tallies authored, any axis substitutions, any ActionStepBranch patterns worth promoting to skill guidance
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary plus the existing `HOD_*` and `FACTION_PROSE_*` blocks. |
| #2 Inspectability | PASS | All traces exist; `hidden_mark_placed` and `encounter_seed_planted` make Holy Order's signature visible in DebugPanel. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry their own deterministic payloads. Hidden marks are graph nodes — deterministic by seed. |
| #4 Fail-soft | PASS | Fail-soft table covers seven likely failure modes. |
| #5 Narrative over mechanical | PASS | External voice exemplars (Civic Guard, Builders Fellowship, in-file `hod.quest.temple_vigil`) anchor narrative register. |
| #6 Additive | PASS | Audits/uplifts existing templates; removes only any legacy entries resurfacing during audit. |
| #7 Performance budget | PASS with note | Hidden marks and encounter seeds are cheap to plant; ≥8 marks × 15 templates fired per-encounter-run is well under budget. Profile only if Holy Order content scale pushes active marks above ~500 across all actors. |

## Coordination block

**Suggested model:** `model:sonnet` (matches THR-89 / THR-93 / THR-100 precedent; content-authoring at scale with high systemic wiring requirements, not a one-shot text edit — and the audit pass demands careful reading of 1800+ lines before deciding what to uplift)

**Parallel-safe with:** Other Phase 2 remaining guild migrations in the backlog that touch different files — THR-96 (Lorekeepers Covenant · `lorekeepers-covenant-encounter-content.ts`), THR-98 (Underking Court · `underking-court-encounter-content.ts`), THR-99 (Temple of Spheres · `temple-of-spheres-encounter-content.ts`), THR-100 (Social · `social-encounter-content.ts`). File surfaces do not collide.

**Mutex with:** Any in-flight work that touches `src/data/holy-order-dawn-encounter-content.ts`, the unified-action-template types, or the encounter adapter / aftermath-effects engine surface. Check `list_issues state:"In Dev"` before claiming a parallel worktree.

**Codex review:** No. Content-only migration per Phase 1/2/3 precedent; no novel engine surface. Skip codex unless CC discovers a systemic gap worth a second pair of eyes (e.g., the `faith` axis turns out not to exist and substitution pattern needs validation).

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 2
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — **mandatory pre-read** (7 engine capabilities)
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-18-thr-93-builders-fellowship-migration.md` — pattern parent (full-scale audit)
- `Docs/plans/2026-04-19-thr-100-social-encounters-migration.md` — most recent sibling design delta
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- In-file benchmark: `hod.quest.temple_vigil` (at bar; read first)
- THR-89 (Thieves Guild, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done)

---

*Prepared 2026-04-19 by Cowork. Moving THR-95 Idea → Ready for Dev.*
