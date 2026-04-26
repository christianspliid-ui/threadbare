# THR-96 · Lorekeepers Covenant Encounters — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 2 — Remaining Guilds
> Pattern parents: THR-89 (Thieves Guild pilot, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done) · THR-95 (Holy Order of Dawn, Ready for Dev — sibling delta)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Audit checklist: `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. The migration framework is settled (Phase 0 infra shipped: adapter, `enrichProse()`, multi-target aftermath, aftermath tracing, GraphOps, world-shaping). Five guild migrations have already proved the workflow and a sixth (THR-95 Holy Order) is in flight. This doc covers **only what is specific to the Lorekeepers Covenant** — the voice, the systemic signature, and why Lorekeepers is the inverse starting-state of Holy Order.

## Starting position (important — the inverse of THR-95)

`src/data/lorekeepers-covenant-encounter-content.ts` was **format-migrated** during THR-31. Like Holy Order, the file is already in `UnifiedActionTemplate` shape. But the delta between the two files is inverted:

- **Voice: at bar already.** The file has an explicit voice bible at lines 1–9 ("record, annal, entry, margin, hand, date, what was said, what was not said, what is remembered. Never: story, myth."), and prose across all 15 templates honours it consistently. Scholarly-warm, precise without dryness, the Covenant's cataloguing impulse visible in every sentence. **Do not rewrite prose for style.** The worst failure mode here is over-editing voice that is already working.
- **Systemic wiring: near-zero.** Nearly every step uses `onSuccess: []` / `onFailure: []`, `failBehavior: 'block'`, and the only aftermath reactions in the file are `reputation_tally` + `recent_event`. Zero encounter seeds. Zero intelligence grants (despite intelligence being Lorekeepers' defining affinity per the issue description). Zero `{?has_artifact}` conditionals (despite artifact context being called out in the issue). Two templates have a `hidden_mark` reaction (`lk.elite.forbidden_library`, `lk.elite.cosmic_revelation`); the other thirteen do not. Zero ActionStepBranch.

So THR-96 is the **inverse work-shape of THR-95**:

- Holy Order → strong wiring + uplift voice to bar.
- Lorekeepers → preserve voice + bring wiring to bar.

**Practical consequence:** the time-budget is similar to Holy Order (both are 15 main templates), but the pattern is different. CC should:

- Read every template and confirm the voice is honoured (fast pass — voice is the strong axis).
- On each template, decide the 1–3 most natural systemic hooks: intelligence grant, hidden-mark revelation, encounter seed, artifact conditional, or ActionStepBranch.
- Author the wiring as additive payload on existing steps/aftermath — without altering prose for its own sake.
- Run the editorial checklist (7 questions) on every template after wiring to verify voice survived the pass.
- The completion comment should flag which templates received **light touch** (1 hook) vs **full systemic wiring** (≥3 hooks) so audit comparability with peer guilds stays clean.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live. `enrichProse()` wired. ActionStepBranch present. GraphOps executor present and proven at Builders scale. Encounter-seed planting shipped (THR-104). Hidden-mark revelation shipped (THR-112). Intelligence-consumption shipped (THR-113). Multi-target aftermath shipped (THR-114). If a new effect-kind or node shape surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 15 Lorekeepers templates across five arrays (`LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES`, `_SENIOR_TEMPLATES`, `_ELITE_TEMPLATES`, `_SOCIAL_TEMPLATES`, `LK_JOIN_TEMPLATE`, `LK_PROMOTION_TEMPLATE`) audited and wired to Phase 2 systemic bar while preserving existing voice. **Lorekeepers is the canonical substrate for intelligence grants and research threads** — the Covenant *records* what it finds, and that record should be consumable by other templates. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` already wired. DebugPanel, Chronicle, EncounterVignetteModal render aftermath trace categories. Merge gating on THR-134 U4 applies. Spot-check only. |

**Wiring note:** Lorekeepers is where the intelligence consumption loop earns its keep. Intelligence grants are the graph substrate of "the Covenant discovered something." If an inquisition template in Holy Order (`hod.senior.inquisition`) can consume an intelligence record planted by a Lorekeepers template (`lk.senior.decipher_prophecy`, `lk.elite.forbidden_library`), the file has done its job. If no downstream template can reach into the Covenant's archive, the wiring is cosmetic.

## The quality reference (external + in-file voice benchmark)

The voice reference is **in-file** — read the existing prose first and do not over-write it. The systemic reference is **external** (other guild migrations that shipped systemic density without compromising voice):

1. **In-file voice benchmark** — all 15 templates. The voice bible at the top of the file (lines 1–9) is the standard. Read three contrasting templates before making any change: `lk.quest.catalogue_ruins` (line 52), `lk.elite.cosmic_revelation` (line 473), `lk.join` (line 625). These three cover the register span (standard observation → elite archival → lifecycle warmth).
2. **THR-89 completion (Thieves Guild)** — Threadbare aesthetic benchmark. Useful for the intelligence-grant pattern — how to grant concrete, consumable intelligence (name, location, mark) rather than generic "lore."
3. **THR-91 completion (Arcane Circle)** — the closest tonal sibling and the most relevant systemic model. Arcane Circle is "precise-intellectual / cold-discovery" where Lorekeepers is "precise-intellectual / warm-cataloguing." The *systemic wiring* pattern of Arcane Circle — spell knowledge as intelligence, ritual failure as hidden mark, ritual consequence as encounter seed — is directly transferable.
4. **THR-93 completion (Builders Fellowship)** — pattern validation at full scale; patient register. Useful for the contemplative templates (`lk.quest.catalogue_ruins`, `lk.senior.compose_treatise`, `lk.social.manuscript_exchange`) where stakes are low per step and systemic density comes from the accumulation rather than the drama.
5. **THR-95 sibling delta (Holy Order of Dawn)** — `Docs/plans/2026-04-19-thr-95-holy-order-dawn-migration.md`. The direct pattern cousin; note that THR-96 inverts the axis of work (voice preserved, wiring uplifted) so coverage expectations are aligned to *density* not *voice rewrite*.
6. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read. Seven engine capabilities; Lorekeepers leans heaviest on **intelligence grants** and **encounter seeds** (research threads), then on **hidden marks** (forbidden knowledge exposure), then on **`{?has_artifact}`**.
7. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — the skill-level target quality for any migrated template; applies to new wiring-bearing prose additions (success/failure afterimages, any new step narrative, any aftermath variant reactionProse).

## Voice + systemic affinity

### Voice

**Quiet, precise, patient. Scholarly-warm. The Covenant loves what it keeps.**

The voice is already at bar. The register is **observation before interpretation** — the Covenant records what was said, what was not said, what the margins note, what the date fixes. The rhetorical shape is *the annal*: dated, authored, edited across hands, always revisable but never forgotten. The prose is warm where the Arcane Circle is cold — the Covenant cares about what it files, without becoming precious about it.

Contrast the guilds:

- **Thieves Guild** — conspiratorial, leverage-aware
- **Arcane Circle** — precise-intellectual / cold-discovery
- **Builders Fellowship** — patient-material
- **Civic Guard** — formal-that-cracks
- **Holy Order of Dawn** — liturgical-that-costs
- **Lorekeepers Covenant (this phase)** — *quiet-that-accumulates*. Every entry is small. The whole annal is enormous. The Covenant's pressure is the pressure of accumulated record.

**Anti-voice to reject:** the worst sins for Lorekeepers prose are (a) turning the scholars into librarian-caricatures ("Silence in the stacks!"), (b) making the annal mystical ("the ancient runes glowed with forbidden knowledge"), (c) introducing stakes through melodrama ("the world's history hangs in the balance"), and (d) inserting Covenant opinion into the record. The Covenant is explicit about the last one — see `lk.elite.cosmic_revelation.2` (line 495) where *interpretation creeping in* is the failure mode. Preserve that ethic.

**Lorekeepers' structural tension**: the Covenant must record what it cannot yet understand. The observer is not the interpreter. The hand in the margin is not the voice in the entry. This is the systemic substrate — **the gap between observation and meaning is where intelligence grants live**. An intelligence grant is not "you learned a fact"; it is "you have the observation; the meaning is for a later hand."

**Preserve the load-bearing lexicon** (from the in-file voice bible, lines 6–8): *record, annal, entry, margin, hand, date, what was said, what was not said, what is remembered*. Never: *story, myth, legend, lore* (except where the Covenant is explicitly describing an *outsider's* framing). Any aftermath prose CC authors should honour this lexicon.

### Systemic signature (Lorekeepers' five engine affinities)

Lorekeepers is the **discovery-consumption phase** of the migration. It is the phase where "what an agent knows" becomes a *mechanical* claim — the intelligence graph — not a narrative aspiration.

1. **Intelligence grants (the defining signature).** Every archival discovery yields a concrete, consumable intelligence record. Not "lore unlocked" — a specific record with a specific referent: a named heretic (→ Holy Order inquisition), a hidden library entry (→ elite follow-ups), a ley-line node at a specific hex (→ Arcane Circle ritual), a faction's dated transgression (→ Civic Guard prosecution). **At least 8 of 15 templates should grant an intelligence record** on a success tier. The grant payload must name a downstream template kind or be typed so downstream consumers can filter — see the THR-113 consumption pathway. Prefer `intelligence_granted` aftermath reactions at the template level; add `intelligence_record` step-level payloads where multi-beat research structure calls for it (e.g., `lk.elite.forbidden_library` grants one intelligence record per step, each with a distinct referent).
2. **Encounter seeds (research threads).** A partial discovery seeds a follow-up investigation. An unfinished translation seeds a return visit. A contradictory annal entry seeds a senior-tier re-examination. A stolen tome seeds a retrieval quest. **At least 6 of 15 templates should plant an encounter seed on at least one outcome tier.** Prefer seeding standard failures → senior templates, and senior failures → elite templates (`lk.elite.cosmic_revelation` naturally seeds from `lk.senior.decipher_prophecy` incomplete resolutions). The Covenant's work is cumulative — seeds are how the accumulation becomes a visible game loop.
3. **Hidden marks (forbidden knowledge exposure).** The Covenant notices what other institutions want hidden. Every compromised archive, failed manuscript exchange, denied library access, or exposed heresy in a prophecy should plant a hidden mark. Marks on the *target* (witnessed_by) when the Covenant publishes the record; marks on the *actor* (self-scoped) when the Covenant asked for discretion and the actor failed it; marks on *third parties* (witnessed_by) when the cataloguing was public. **At least 6 of 15 templates should plant or reveal a hidden mark.** Revelation is stronger than planting — prefer revelation on templates that interact with prior Covenant records (`lk.senior.decipher_prophecy`, `lk.senior.excavate_archive`, `lk.elite.forbidden_library`).
4. **`{?has_artifact}` branches (scroll/book/tool context changes stakes).** The issue description calls this out explicitly and the current file has zero instances. The Covenant's work changes materially when the actor holds a relevant artifact — a cipher stone to translate a text, a provenance ledger to catalogue ruins, a star chart to map ley lines. **At least 8 templates should carry a `{?has_artifact}` conditional** that materially changes the stakes (not cosmetic framing). Use `{artifact:relevant}` or a named-artifact enrichment placeholder where one is bound; fall back to `{artifact:any}` when the relevance gate is weak. The contemplative templates (`lk.quest.translate_text`, `lk.quest.map_ley_lines`) are the highest-ROI candidates. If the current `{?has_artifact}` enrichment placeholder is not yet live, flag the gap and file a Phase 0 follow-up — do not block the migration.
5. **ActionStepBranch on intelligence-holding or artifact-holding state.** Templates with multi-step research structure (`lk.quest.catalogue_ruins`, `lk.senior.decipher_prophecy`, `lk.senior.excavate_archive`, `lk.elite.forbidden_library`, `lk.elite.cosmic_revelation`) have natural leverage-vs-weakness forks: holding relevant prior intelligence advances faster; holding a relevant artifact unlocks a cleaner aftermath variant. **At least 3 templates should use explicit `next` ActionStepBranch** on prior-intelligence or artifact state. Intelligence-positive paths should advance faster or unlock the better aftermath; intelligence-absent paths should use `continue_weakened` to propagate the cost (a record with a hole).

**Content grants.** Content grants are mentioned in the issue description as a secondary affinity. Treat these as a special case of intelligence grants where the payload is a category of scholarship rather than a specific referent (e.g., "decipherment technique," "star-chart notation"). If the `content_grant` aftermath reaction kind does not exist, CC should **not invent it inline** — use typed intelligence records with a `category` field if the `intelligence_record` payload supports it, or flag the gap as a Phase 0 follow-up labeled `Deferral` in the project. Do not block the migration on a new effect kind.

**The failBehavior cleanup.** Every step in the file currently uses `failBehavior: 'block'`. Migration precedent is `continue_weakened` (early steps) / `fail_action` (final step). Review per step — where the research naturally continues with a hole (`lk.quest.translate_text.1` failure leaves the margin blank but the translation continues), use `continue_weakened`; where the research blocks (`lk.elite.forbidden_library.1` failure = access denied, no record taken), `fail_action` is correct. `block` should disappear from the file by the end of the migration.

## Template-count caveat

The issue title says "42 templates." This is the same step-count-vs-main-template confusion Builders, Civic Guard, Social, and Holy Order already documented. Actual count in `lorekeepers-covenant-encounter-content.ts`:

- **5 standard quest templates** in `LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES` (`lk.quest.catalogue_ruins`, `lk.quest.translate_text`, `lk.quest.recover_tome`, `lk.quest.map_ley_lines`, `lk.quest.interview_elder`)
- **3 senior templates** in `LOREKEEPERS_SENIOR_TEMPLATES` (`lk.senior.decipher_prophecy`, `lk.senior.excavate_archive`, `lk.senior.compose_treatise`)
- **2 elite templates** in `LOREKEEPERS_ELITE_TEMPLATES` (`lk.elite.forbidden_library`, `lk.elite.cosmic_revelation`)
- **3 social templates** in `LOREKEEPERS_SOCIAL_TEMPLATES` (`lk.social.lecture_hall`, `lk.social.debate_forum`, `lk.social.manuscript_exchange`)
- **2 lifecycle templates** exported separately: `LK_JOIN_TEMPLATE`, `LK_PROMOTION_TEMPLATE`
- **Total: 15 main templates** across ~37 step entries

CC should:

- Audit all **15 main templates** (13 quest/social + 2 lifecycle).
- Reconcile the completion comment's coverage metric against **main-template count** (not step count).
- Mirror Thieves Guild + Builders + Arcane Circle + Holy Order framing for audit comparability.
- Expect the completion comment to say "15 main templates (5 standard + 3 senior + 2 elite + 3 social + 2 lifecycle / ~37 steps)" not "42 templates."

## Template categories (from file survey)

The 15 templates span five categories. Match the voice register to the category; match the systemic-affinity allocation to the category's natural pressure:

- **Lifecycle** — `lk.join`, `lk.promotion`. Warmest register inside the Lorekeepers palette; the Covenant is genuinely warm about admission and promotion (see `lk.promotion.2` afterimage at line 697: *"The Covenant is warm about this."*). Low systemic weight is acceptable here — faction reputation plus a recent_event is probably enough. Don't force intelligence grants into lifecycle; the beats are social. `lk.join` already has a natural hook: the actor **submits a record as a membership test**. A successful join could grant *back* an intelligence record — the Covenant's existing reading of the actor's submission. This is a low-ROI but distinctive hook.
- **Standard quests** — `lk.quest.catalogue_ruins`, `lk.quest.translate_text`, `lk.quest.recover_tome`, `lk.quest.map_ley_lines`, `lk.quest.interview_elder`. This is where the intelligence-grant signature earns its keep. Every standard quest should grant at least one intelligence record on success (the ruin's entry, the hand's identity, the tome's contents, a ley-line node, the elder's account) and probably plant a hidden mark or encounter seed on failure (`translate_text` incomplete → "for one generation, something will be remembered slightly wrong" is already written into the afterimage — systemise it with an encounter seed that surfaces a re-translation template 120 ticks later). `{?has_artifact}` branches belong most heavily here — cipher stones for `translate_text`, star charts for `map_ley_lines`, provenance ledgers for `catalogue_ruins`.
- **Senior quests** — `lk.senior.decipher_prophecy`, `lk.senior.excavate_archive`, `lk.senior.compose_treatise`. Higher stakes; order-wide consequences. `decipher_prophecy` is the canonical hidden-mark-reveal candidate (the prophecy references a prior mark on a named actor or location). `excavate_archive` is the canonical encounter-seed generator (what's unearthed is larger than what's resolved; a senior failure should seed an elite template). `compose_treatise` is the primary content-grant template — if content grants don't land as an effect kind, grant a broad-category intelligence record and note the category.
- **Elite quests** — `lk.elite.forbidden_library`, `lk.elite.cosmic_revelation`. Maximum register-cost. `forbidden_library` already has a hidden_mark; extend it — each of its three steps should grant a distinct intelligence record with a distinct referent, and the final step should plant an encounter seed (the *next* library, the one the Covenant now knows exists). `cosmic_revelation` is the narrative set-piece of the file and the closest thing Lorekeepers has to Builders' `engineer_wonder` or Holy Order's `holy_war` — it should exercise ActionStepBranch on prior intelligence (has the actor already seen a contradicting date in another template? branch to the accelerated interpretation path).
- **Social** — `lk.social.lecture_hall`, `lk.social.debate_forum`, `lk.social.manuscript_exchange`. Smallest register. These are the quiet templates that give the Covenant its texture. Low systemic weight per template, but they are what makes the annal feel inhabited. Treat them mostly as reputation carriers; `manuscript_exchange` is the natural exception — it's where artifacts change hands, so a `{?has_artifact}` branch with meaningful differential is appropriate.

**Per-category hints for CC:**

- **Lifecycle** — the Covenant's warmth is the load-bearing beat. Don't over-wire.
- **Standard quests** — the intelligence-grant volume lives here. This is where the signature coverage is earned.
- **Senior quests** — escalation, reveal, seed. Prior-record hooks are most natural here.
- **Elite quests** — the Threadbare aesthetic is most tested here. Resist the temptation to make the forbidden knowledge *sound* forbidden. The Covenant records; it does not adjudicate.
- **Social** — light, specific, small. Don't wire `lecture_hall` and `debate_forum` heavily; keep them as reputation carriers.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: **preserve existing voice** (Lorekeepers' starting voice is already at bar). Edit for enrichment wiring and aftermath reactionProse only; never for style.
- Wiring: `{name}` + pronouns in every prose field (spot-check; most are already present); ≥1 conditional block per template; `{?has_faction}` exists across the file — add `{?has_artifact}` and `{?has_ally}` / `{?has_rival}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template beyond the existing reputation_tally — intelligence grant, encounter seed, hidden mark (plant or reveal), or authored attachment. **New reactions should be additive to the existing reputation_tally + recent_event blocks.**
- `reputationPolarity` on all reputation-bearing outcomes (the file currently has `domain: 'eye.positive'` style tallies; confirm polarity is correct per outcome tier).
- `failBehavior` reviewed per step — every `'block'` in the file gets evaluated; most should become `continue_weakened` (early steps) or `fail_action` (final steps). `block` should disappear by end of migration.
- Editorial checklist (7 questions from the skill) passed on every template. **Add one additional check specific to Lorekeepers:** does the prose still obey the voice bible's lexicon? If a new afterimage or reactionProse introduces *story* / *myth* / *legend* where the voice bible rejects those words, rewrite.
- ActionStepBranch used where prior-intelligence / artifact state is load-bearing to the narrative fork (not cosmetic prose).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, `run 200`, `encounters` confirms Lorekeepers templates fire (seed a Covenant-faction actor if necessary — spawn command in CLI `help`; use `--faction lorekeepers_covenant`).
- Export encounter log TSV and spot-read 5 random Lorekeepers outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `intelligence_granted` (critical for Lorekeepers — this is the signature), `encounter_seed_planted`, `hidden_mark_placed`, `reputation_tally_applied`, `attachment_created` (if any template plants a named artifact attachment, unlikely this phase).
- Confirm via `graph.nodes` / `eval state.graph.getNodesByType('intelligence')` that a seeded CLI run produces at least one intelligence record from a Lorekeepers template AND one encounter seed from a Lorekeepers template. If neither fires, the migration has missed its systemic signature.
- Confirm **downstream consumption** by at least one non-Lorekeepers template: seed an actor with Lorekeepers membership, run 200 ticks, and eval whether any intelligence record produced by Lorekeepers was read by Holy Order inquisition, Arcane Circle ritual, or another downstream scorer. If not, file a Phase 0 follow-up — the consumption pathway exists (THR-113); the failure is either template-side (no template is reading) or payload-typing (the grant shape is wrong for the consumer). Do not block the migration if the consumption path fails; log it as a Deferral.
- Spot-check in the browser via `?view=game&seeded`: trigger a Lorekeepers encounter, confirm the aftermath prose renders in EncounterVignetteModal and the Chronicle entry references the systemic consequence (the intelligence recorded, the mark planted, the seed sown).
- Legacy `ENCOUNTER_TEMPLATES` already clean — no Lorekeepers entries to remove. If any `lk.*` id resurfaces in a legacy array during the audit, remove it; else this step is a no-op.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary plus Lorekeepers' existing constants block:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | design doc | Threat → rarity tier per template |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` (replaces per-step `block`) |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected; do not invent `content_grant` inline |
| Reputation axes | reputation trait registry | `eye.positive` is already in-file; confirm `eye.negative` for compromised outcomes |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` — confirm scopes at implementation |
| `LK_DIFFICULTY_*` / `LK_SENIOR_BASE` / `LK_ELITE_BASE` | `lorekeepers-covenant-encounter-content.ts` | Existing per-file difficulty constants; re-use; do not introduce more |
| `FACTION_PROSE_SEED_DELAY_*_TICKS` | `faction-constants.ts` | Existing; re-use for encounter_seed delays — `_QUEST_TICKS` for quest-to-senior seeding, `_SOCIAL_TICKS` (already imported) for social escalations |
| `FACTION_PROSE_HIDDEN_MARK_DEFAULT_SEVERITY` | `faction-constants.ts` | Existing and already imported; re-use for new marks |

**Open questions for CC to check at start (fail-soft):**

1. Confirm that the intelligence-record payload shape supports a `category` field if content grants need to piggyback on the intelligence pathway; if not, file a Phase 0 follow-up labeled `Deferral` for a `content_grant` effect kind.
2. Confirm that the `{?has_artifact}` enrichment placeholder is live in `enrichProse()`; if not, file a Phase 0 follow-up labeled `Deferral` and fall back to `{?has_faction}` + a prose-level reference to the artifact by name. Do not block the migration.
3. Confirm that `failBehavior: 'block'` is still a legal value at the time of implementation; if the adapter has removed it, the migration's cleanup pass is mandatory, not optional.

## Tracing

All traces exist. Lorekeepers audit emits (no new trace types):

```ts
// existing types — see src/types/traces.ts
encounter_aftermath_applied
encounter_aftermath_effect
intelligence_granted
encounter_seed_planted
hidden_mark_placed
reputation_tally_applied
attachment_created
```

## Fail-soft cases

| Failure | Fallback |
| -- | -- |
| Intelligence-record payload shape rejected | Record reputation_tally only; trace `intelligence_grant_failed`; encounter still resolves; completion comment flags the rejection pattern. |
| Content-grant effect kind missing | Fall back to typed intelligence record with `category` field if supported, else broad intelligence record + prose-level reference; file Phase 0 follow-up. |
| Hidden mark scope unknown | Fall back to `self`-scoped mark; completion comment flags it. |
| Encounter seed payload malformed | Executor rejects; trace `encounter_seed_failed`; encounter still resolves (cosmetic loss, no crash). |
| `{?has_artifact}` enrichment not yet live | Omit the conditional; prose references the artifact by name in-line; file Phase 0 follow-up. |
| Reputation axis missing / polarity wrong | Substitute closest axis (prefer `star.positive` / `star.negative`); file Phase 0 follow-up; completion comment notes substitution. |
| `{?has_faction}` condition evaluates with no faction edge | Conditional block omits quietly (standard enrichment behavior). |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file a Phase 0 follow-up. |
| Downstream consumption zero (intelligence grant unread by any template) | Do not block; log Deferral; investigate whether the grant shape is wrong or whether no downstream scorer is reading Lorekeepers category records. |

## Merge gating

Unchanged from THR-91 / THR-92 / THR-93 / THR-95 / THR-100: code-merge gated on THR-134 U4 closure (chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Lorekeepers audits before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 15 Lorekeepers templates (5 standard + 3 senior + 2 elite + 3 social + `lk.join` + `lk.promotion`) audited against the Phase 2 checklist
- [ ] Voice preserved — no cosmetic rewrites of existing prose; new prose (aftermath reactionProse, any new step narrative) honours the voice bible lexicon (`record`, `annal`, `entry`, `margin`, `hand`, `date`; never `story`, `myth`, `legend`)
- [ ] Each template has ≥1 contextual aftermath reaction beyond the pre-existing reputation_tally + recent_event (intelligence grant, encounter seed, hidden mark, artifact attachment)
- [ ] ≥8 templates grant an intelligence record on a success tier (Lorekeepers' defining signature)
- [ ] ≥6 templates plant an encounter seed on at least one outcome tier (research threads)
- [ ] ≥6 templates plant or reveal a hidden mark (forbidden-knowledge exposure)
- [ ] ≥8 templates carry a `{?has_artifact}` conditional with material stakes differential (fallback documented per the fail-soft table if enrichment not live)
- [ ] ≥3 templates use explicit ActionStepBranch `next` on prior-intelligence or artifact state (not cosmetic)
- [ ] Every reputation-bearing outcome sets `reputationPolarity` with correct axis polarity
- [ ] Every step's `failBehavior` reviewed — `'block'` replaced with `continue_weakened` / `fail_action` per step semantics (`'block'` should not remain in the file)
- [ ] `{name}` + pronouns in every prose field (spot-check; most already present)
- [ ] At least one Lorekeepers-produced intelligence record observed as consumed by a downstream template (Holy Order, Arcane Circle, Civic Guard, or another scorer) during CLI verification — OR a Deferral filed if consumption is zero
- [ ] Legacy Lorekeepers entries in `ENCOUNTER_TEMPLATES` removed (confirmed already clean — no-op unless audit reveals otherwise)
- [ ] Editorial checklist (7 questions from the skill) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke, encounter log spot-check, DebugPanel confirms `intelligence_granted` AND `encounter_seed_planted` fire from Lorekeepers templates)
- [ ] Completion comment summarises main-template count (15), light-touch vs full-wiring split, counts of intelligence grants / seeds / marks / `{?has_artifact}` branches authored, any axis substitutions, any downstream-consumption observations, any Phase 0 follow-ups filed
- [ ] Merge deferred until THR-134 U4 closes (or closed concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; constants re-used from settled migration vocabulary plus the existing `LK_*` and `FACTION_PROSE_*` blocks. |
| #2 Inspectability | PASS | All traces exist; `intelligence_granted` and `encounter_seed_planted` make Lorekeepers' signature visible in DebugPanel. Downstream-consumption check makes the intelligence graph legible. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry their own deterministic payloads. Intelligence records are graph nodes — deterministic by seed. |
| #4 Fail-soft | PASS | Fail-soft table covers nine likely failure modes, including the novel "downstream consumption zero" case. |
| #5 Narrative over mechanical | PASS | Voice is preserved. Systemic wiring is additive; the editorial checklist includes an explicit voice-bible-lexicon check to prevent wiring-induced voice drift. |
| #6 Additive | PASS | Audits/wires existing templates; removes only `failBehavior: 'block'` (cleanup) and any legacy entries resurfacing during audit. |
| #7 Performance budget | PASS with note | Intelligence records and encounter seeds are cheap to plant; ≥8 grants × 15 templates fired per-encounter-run is well under budget. Profile only if Lorekeepers content scale pushes active intelligence records above ~2000 across all actors. |

## Coordination block

**Suggested model:** `model:sonnet` (matches THR-89 / THR-93 / THR-95 / THR-100 precedent; content-authoring at scale with high systemic wiring requirements, and the additive-wiring pass demands careful reading of ~720 lines plus systemic-guide internalisation before deciding where hooks land)

**Parallel-safe with:** Other Phase 2 remaining guild migrations that touch different files — THR-95 (Holy Order of Dawn · `holy-order-dawn-encounter-content.ts`, currently Ready for Dev / claimed by CC), THR-98 (Underking Court · `underking-court-encounter-content.ts`), THR-99 (Temple of Spheres · `temple-of-spheres-encounter-content.ts`), THR-100 (Social · `social-encounter-content.ts`, currently In Review). File surfaces do not collide.

**Mutex with:** Any in-flight work that touches `src/data/lorekeepers-covenant-encounter-content.ts`, the unified-action-template types, or the encounter adapter / aftermath-effects engine surface. Check `list_issues state:"In Dev"` before claiming a parallel worktree.

**Codex review:** No. Content-only migration per Phase 1/2/3 precedent; no novel engine surface. Skip codex unless CC discovers a systemic gap worth a second pair of eyes (e.g., the intelligence-record `category` field shape needs validation, or the downstream-consumption pathway reveals a payload-typing bug that requires an engine-side fix).

## References

- `Docs/plans/2026-04-16-encounter-template-migration.md` — Phase 2
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — per-phase gate criteria
- `Docs/plans/2026-04-16-systemic-wiring-guide.md` — **mandatory pre-read** (7 engine capabilities; intelligence + seeds are the heaviest for Lorekeepers)
- `Docs/plans/encounters/pick-pocket-skill-test.md` — Threadbare aesthetic target
- `Docs/plans/2026-04-18-thr-93-builders-fellowship-migration.md` — pattern parent (full-scale audit)
- `Docs/plans/2026-04-19-thr-100-social-encounters-migration.md` — most recent content-pattern sibling
- `Docs/plans/2026-04-19-thr-95-holy-order-dawn-migration.md` — direct sibling delta (inverse axis of work: voice-uplift vs. wiring-uplift)
- Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
- In-file voice bible: lines 1–9 of `lorekeepers-covenant-encounter-content.ts`
- In-file wiring benchmarks (already partial): `lk.elite.forbidden_library` (line 417, has hidden_mark) and `lk.elite.cosmic_revelation` (line 473, has hidden_mark + cross-axis reputation tally)
- THR-89 (Thieves Guild, Done) · THR-91 (Arcane Circle, Done) · THR-92 (Civic Guard, Done) · THR-93 (Builders Fellowship, Done) · THR-97 (Rangers Brotherhood, Done) · THR-95 (Holy Order, Ready for Dev)

---

*Prepared 2026-04-19 by Cowork. Moving THR-96 Idea → Ready for Dev.*
