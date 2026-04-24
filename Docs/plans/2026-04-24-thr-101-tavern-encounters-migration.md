# THR-101 · Tavern Encounters Migration — Design Delta

> Parent project: **Encounter Format Migration** (Now, Urgent) · Phase 3 — Tavern
> Pattern parents: THR-89 (Thieves Guild pilot, Done) · THR-91..99 (8 guilds, Done) · THR-100 (Social, Done)
> Skill: `.claude/skills/template-encounter-rewrite/SKILL.md`
> Migration master plan: `Docs/plans/2026-04-16-encounter-template-migration.md`
> Prior-phase plan (calibration reference): `Docs/plans/2026-04-19-thr-100-social-encounters-migration.md`
> Systemic wiring: `Docs/plans/2026-04-16-systemic-wiring-guide.md`

This is a **design delta**, not a re-design. Phase 0 infrastructure is settled (adapter wiring, `enrichProse()`, aftermath tracing, hidden-mark revelation, intelligence consumption, multi-target aftermath, GraphOps, world-shaping). Nine guild migrations + Social have proved the workflow. This doc covers **only what is specific to Tavern Encounters** — the place-bound voice, the sublocation filter, and the information-hub systemic signature.

## Scope correction

The Linear issue title says "30 templates." **Actual count: 10 main templates** in `src/data/tavern-encounter-content.ts` (file header literally states "10 tavern-exclusive encounter templates"). The master plan doc's table showed 30 as an aspirational count that never materialised in source. Do the 10 that exist. If the fiction surfaces a demand for additional tavern templates during authoring, file a `Deferral` under this project rather than expanding scope mid-migration.

**The 10 templates (for reference):**

| # | id | reach primary / secondary | encounterType | threat | category |
|---|---|---|---|---|---|
| 1 | `tavern.brawl` | iron / flesh | duel | moderate | combat |
| 2 | `tavern.overheard_rumor` | eye / shadow | explore | trivial | intelligence |
| 3 | `tavern.drinking_contest` | flesh / heart | duel | easy | physical-social |
| 4 | `tavern.bardic_performance` | heart / eye | assist | easy | performance |
| 5 | `tavern.shady_deal` | shadow / gold | steal | moderate | covert |
| 6 | `tavern.recruiting_drive` | heart / gold | hire | easy | recruitment |
| 7 | `tavern.the_challenge` | iron / shadow | duel | moderate | combat |
| 8 | `tavern.confession_over_drinks` | heart / eye | assist | easy | intelligence |
| 9 | `tavern.merchants_pitch` | gold / heart | trade | easy | transactional |
| 10 | `tavern.the_warning` | eye / heart | assist | easy | intelligence |

All 10 carry `sublocationTypes: ['sublocation-type.tavern']` and fire only when the acting agent is inside a tavern sublocation. Preserve this filter verbatim — the tavern-specific firing is load-bearing to the design's place-specificity.

## Three-pillar compliance

| Pillar | Status | Rationale |
| -- | -- | -- |
| **Engine** | N/A — settled | All aftermath effect kinds live (seeds, marks, intel, reputation tallies, GraphOps). Sublocation filter logic is in the existing encounter pipeline and does not need changes. If an effect-kind gap surfaces, file a Phase 0 follow-up — do not inline. |
| **Content** | Primary scope | 10 tavern templates in `src/data/tavern-encounter-content.ts` rewritten to Threadbare bar in tavern voice (place-bound, sensory-rich, crowd-aware). Sublocation filter preserved. |
| **UI** | N/A — Phase 0 adapter | No new UI work. `enrichProse()` wired for unified adapter. Chronicle and EncounterVignetteModal render aftermath trace categories. THR-134 U4 merge gate applies (same as every prior migration). Spot-check only. |

## The quality-reference problem

Tavern Encounters has **no in-file quality reference**. The existing 10 templates are placeholder-quality prose — functional but without sensory density, zero authored aftermath, zero hidden marks, zero encounter seeds, zero `{?has_faction}` / `{?has_ally}` / `{ally:strongest}` conditionals, zero ActionStepBranch. Every template is at baseline.

The quality reference is **external**:

1. **THR-100 (Social Encounters, Done)** — Closest tonal analog. Social and tavern share the "subtextual / postures-and-reads" register. Read social templates first for voice calibration.
2. **THR-89 (Thieves Guild, Done)** — The aesthetic benchmark. The `shady_deal` and `overheard_rumor` templates should land in Thieves Guild voice (conspiratorial, leverage-aware). Tavern's covert encounters ARE Thieves-Guild-adjacent.
3. **`Docs/plans/encounters/pick-pocket-skill-test.md`** — skill-level target for any migrated template.
4. **`Docs/plans/2026-04-16-systemic-wiring-guide.md`** — MANDATORY pre-read.
5. **Worked example in the master plan:** `tg.quest.pocket_run` (Pocket Run) — this is what "calibrated migration" looks like for a small template with authored attachments, named intelligence, and branch-aware aftermath.

## Voice + systemic affinity

### Voice

**Place-bound, sensory-rich, crowd-aware. The tavern is a character in every scene.**

Tavern encounters differ from social encounters in one key axis: **the room is always present**. Every paragraph should carry at least one of — the smell (woodsmoke, spilled ale, damp wool, pipe-tobacco, stale sweat), the sound (cutlery on crockery, the hinge of the door, the low register of a crowd, the hiccup-pause when something tense happens), the light (hearth red, lamp-yellow, the slice of daylight when the door opens), or the crowd density (pressed-in, dispersing, the hush-and-return rhythm when attention shifts).

Contrast the phases:

- **Thieves Guild** — conspiratorial, leverage-aware
- **Arcane Circle** — precise-intellectual
- **Builders Fellowship** — patient-material
- **Civic Guard** — formal-that-cracks
- **Social (THR-100)** — relational, pressure-tempered, subtextual
- **Tavern (this phase)** — *place-bound*. Social voice with the room always watching. Crowd reactions are system-readable (the hush, the roar, the drift-back). The bartender is a witness but not a participant — most of the time.

**Anti-voice to reject:** generic fantasy-tavern clichés ("a stranger in a dark corner," "a rough crowd," "a buxom barmaid"), exposition-first prose ("you enter the tavern and look around"), cozy-village gossip, or drink-as-shorthand-for-seedy. Tavern at Threadbare register means: *a specific room in a specific town at a specific hour*, and the prose should make the reader feel which one.

**The crowd-attention question** — nearly every tavern template has an implicit "does the room notice?" beat. For duels, contests, and performances the room is the audience and their attention is the reward. For covert deals and confessions the room is the threat and their attention is the failure state. **Make the crowd-attention state readable in prose.** This is the highest-ROI enrichment pattern for tavern voice — second only to `{location:name}` place-grounding.

### Systemic signature (Tavern's five engine affinities)

Per the Linear issue description, taverns are information hubs — overheard conversations, rumor networks, drunken confessions, promises made over drinks, grudges born of bar fights. The systemic signature:

1. **Intelligence grants (the primary affinity).** Taverns are where information flows. `overheard_rumor`, `confession_over_drinks`, and `the_warning` ARE intelligence encounters — their primary aftermath is an `intelligence` grant with a concrete payload. **At least 3 of 10 templates must grant concrete, consumable intelligence** (a name, a route, a vulnerability, a hidden cache — not "you learn something useful"). Intelligence consumption is live (THR-113) — the payload is read by enrichment (`{intel:X}`) and scoring.
2. **`{location:name}` enrichment (place-specificity).** Tavern encounters are deeply place-specific — atmosphere, clientele, reputation. **Every template's opening beat must reference the specific tavern** via `{location:tavernNameOrFallback}` or equivalent enrichment. A fight in the Gilded Rooster is a different fight from one in the Thornscar. This is the tavern phase's most distinctive wiring vs. social.
3. **`{?has_faction}` and `{?has_ally}` conditionals.** Who you are at the tavern and who you're with changes what happens. A guildsman at the Underking's Court-adjacent tavern gets a different welcome than a stranger. An agent with an `{ally:strongest}` in tow reads differently to the room. **At least 6 of 10 templates should carry a `{?has_faction}` branch, and at least 4 should reference `{?has_ally}` or `{ally:strongest}` / `{rival:strongest}`.** Match the fiction: `brawl` and `the_challenge` benefit from ally backup; `shady_deal` and `confession_over_drinks` benefit from faction context (or its absence as leverage).
4. **Hidden marks (overheard secrets, drinking debts, promises made).** Tavern transactions rarely end cleanly. A confession heard is a mark carried by the listener. A brawl won is a witnessed mark ("bested publicly"). A shady deal gone sour is a witnessed mark on the actor ("caught at the Rooster"). A promise made over ale is a hidden mark that can be called in. **At least 5 of 10 templates should plant or reveal a hidden mark.** Prefer `witnessed_by` scope for public acts (brawls, challenges, performances); prefer `self` scope for confidences carried away (confessions, warnings).
5. **Encounter seeds (relationships initiated over a shared table, grudges born of bar fights).** Every social transaction plants a seed in the tavern: the challenger who lost waits for a rematch; the recruited companion becomes a future collaboration; the confession-hearer will be sought out again. **At least 5 of 10 templates should plant an encounter seed on at least one outcome tier.** `brawl`, `the_challenge`, `shady_deal`, `recruiting_drive`, `confession_over_drinks`, and `the_warning` are the strongest seed candidates.

**Secondary:** ActionStepBranch — where the tavern template has a genuine narrative fork (e.g., the brawl's "first-blood lands vs. doesn't" changes step 2's texture), use ActionStepBranch rather than cosmetic prose-only variation. **Target: at least 2 templates use explicit ActionStepBranch `next` on outcome, not cosmetic.** `brawl`, `the_challenge`, and `shady_deal` are the strongest candidates.

### Per-category hints for CC

- **Combat (brawl, drinking_contest, the_challenge)** — the crowd is a third actor. Write the hush before the first blow and the roar after the last. `brawl` should feel like a tavern brawl (chairs, bottles, bodies hitting tables) — not a duel in a clearing. `the_challenge` is more formal: steel-drawn, a ringed space, witnesses. Failure is a wound (current file already has `appliesWound: true` — in migration, express as a `condition_attachment` effect per the systemic wiring guide, templateId `trait.condition.wounded`).
- **Intelligence (overheard_rumor, confession_over_drinks, the_warning)** — these are the tavern phase's "signature" templates. Each should grant concrete intelligence with an authored `label` and `detail`. `overheard_rumor` grants general intel (market rotations, shipment routes, faction gossip). `confession_over_drinks` grants deeply personal intel (a crime, a name, a hidden shame) AND plants a hidden mark on the listener (they carry what they heard). `the_warning` is the one the agent is the target of — someone is telling them something useful, which creates a favor-debt (hidden mark) or an alliance seed.
- **Performance (bardic_performance)** — the crowd's attention is the stakes. Success: reputation travels (rep tally + encounter seed "the Gilded Rooster talks about {name}"). Failure: cold room, no seed, light rep hit.
- **Covert (shady_deal)** — Thieves-adjacent voice. Three steps (contact → exchange → clean exit) map well to ActionStepBranch on "contact read" — did the contact trust you or not? Authored attachment on success (the parcel is named: "A Sealed Letter for Brenn," "A Paper of Forged Marks"). Hidden mark on failure (the guard at the door "remembers that face" — this is already in the placeholder prose; express as `hidden_mark_placed` with `witnessed_by` scope).
- **Recruitment (recruiting_drive)** — success plants a persistent companion (authored attachment or NPC spawn via EncounterSupportBundle — prefer the authored attachment path for a "recruitment contract" rather than spawning an NPC from aftermath, which is not wired). Rep tally on authority axis.
- **Transactional (merchants_pitch)** — the thinnest template mechanically, but a chance for `{?has_faction}` to bite: factioned agents get better terms or get hustled harder depending on faction reputation. Pool-drawn reward is fine here; the "story consequence" is modest and not every template needs a seed.

## Quality bar (Threadbare + systemic wiring, unchanged)

Per-template:

- Prose: Threadbare aesthetic — sensory-first, concrete nouns, present-tense observation, no superlatives. **Plus tavern-specific: every template's opening beat carries at least one of (smell, sound, light, crowd).**
- Wiring: `{name}` + pronouns in every prose field; `{location:tavernNameOrFallback}` (or equivalent) in the opening beat; ≥1 conditional block per template; at least `{?has_faction}` OR `{?has_ally}` somewhere; `{ally:strongest}` / `{rival:strongest}` where the fiction calls for it.
- Contextual aftermath: ≥1 reaction per template (encounter seed, hidden mark, reputation tally, intelligence grant, or authored attachment).
- `reputationPolarity` on all reputation-bearing outcomes.
- `failBehavior` reviewed per step (early: `continue_weakened`, final: `fail_action` for combat-resolving final steps like `brawl.standing` or `challenge.contest`; `continue_weakened` is fine for intelligence/trade final steps where partial success has fiction).
- Editorial checklist (7 questions from the `template-encounter-rewrite` skill) passed on every template.
- **Wound conversion:** where the legacy template has `appliesWound: true`, convert to a `condition_attachment` aftermath effect (`{ kind: 'condition_attachment', templateId: 'trait.condition.wounded' }`). **Do not** use `appliesWound` in the migrated template — it is `EncounterTemplate`-only.

Per phase:

- Intelligence grants: ≥3/10 concrete, consumable.
- `{?has_faction}`: ≥6/10.
- `{?has_ally}` or `{ally:strongest}` / `{rival:strongest}`: ≥4/10.
- Hidden marks: ≥5/10 templates plant or reveal.
- Encounter seeds: ≥5/10 templates plant on at least one outcome tier.
- ActionStepBranch `next` on outcome: ≥2/10 (genuine fork, not cosmetic).

## Verification

- `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- CLI smoke: `npm run cli -- --seed 42`, advance, `eval` or `encounters` confirms tavern templates fire when an agent is at a tavern sublocation. If no tavern sublocation exists in the seeded world, spawn one via `spawn sublocation tavern --at <actor>` and retry.
- Export encounter log TSV and spot-read 5 random tavern outcomes — ≥7/10 distinct, aftermath fires, systemic consequences visible in DebugPanel.
- DebugPanel traces expected: `encounter_aftermath_applied`, `encounter_aftermath_effect`, `encounter_seed_planted`, `hidden_mark_placed`, `reputation_tally_applied`, `intelligence_granted`, `attachment_created`. Critical for Tavern: `intelligence_granted` AND `encounter_seed_planted` must fire from tavern templates during the seeded CLI run. If neither fires, the migration has missed its systemic signature.
- Confirm via `graph.nodes` that at least one intelligence record AND one encounter seed trace back to a tavern template.
- Spot-check in the browser via `?view=game&seeded`: if a tavern-triggering agent can be observed, confirm aftermath prose renders in EncounterVignetteModal and Chronicle references the consequence.
- Remove Tavern entries from legacy `ENCOUNTER_TEMPLATES` at end.

## Constants / tunables

No new constants required. Re-uses the settled migration vocabulary:

| Constant | Defined in | Purpose |
| -- | -- | -- |
| `RarityTier` mapping | master plan doc §3 | Threat → rarity tier per template (trivial→1, easy→1-2, moderate→2, hard→3, deadly→4) |
| `failBehavior` values | `unified-action-templates.ts` | `continue_weakened` / `fail_action` |
| Aftermath effect kinds | `aftermathEffects.ts`, `graphOpExecutor.ts` | All existing kinds — no new kinds expected |
| Reputation axes | reputation trait registry | authority, shadow, honor, reliability (confirm names at implementation) |
| Hidden mark scopes | hidden mark registry | `witnessed_by`, `self`, `revealed` (confirm scopes at implementation) |
| `condition_attachment` templateIds | condition registry | `trait.condition.wounded` for brawl/challenge failure |

**Open question for CC to check at start (fail-soft):** Confirm which reputation axes are canonical. If an expected axis (e.g., "authority" for challenge-wins) is missing, substitute the closest axis, note in completion comment, and file a `Deferral` under Encounter Format Migration. Do not block the migration on axis registration.

## Tracing

All traces exist. Tavern migration emits (no new trace types):

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
| `{location:tavernNameOrFallback}` resolves with no tavern name | Enrichment falls back to generic "tavern" (standard behavior). |
| Encounter seed payload malformed | Executor rejects; trace `encounter_seed_failed`; encounter still resolves (cosmetic loss, no crash). |
| Hidden mark scope unknown | Fall back to `self`-scoped mark; completion comment flags it. |
| Reputation axis missing | Substitute closest axis; file `Deferral`; completion comment notes substitution. |
| `{?has_faction}` or `{?has_ally}` condition evaluates with no edge | Conditional block omits quietly (standard enrichment behavior). |
| ActionStepBranch `next` id invalid | Step dispatcher falls back to linear next-step; file `Deferral`. |
| Intelligence grant target missing | Intelligence recorded against the actor only; trace notes absent target. |
| `condition_attachment` templateId `trait.condition.wounded` missing | Log to completion comment; substitute nearest available condition or omit with comment; file `Deferral` if template id was renamed. |
| Tavern sublocation filter misconfigured (templates fail to surface) | Verify `sublocationTypes: ['sublocation-type.tavern']` is preserved verbatim; if sublocation-type id changed, update and note in completion comment. |
| Legacy tavern template removal breaks tests | Fix test by migrating alongside, or scope removal narrower. Do not skip tests. |

## Merge gating

Unchanged from THR-89 / THR-91..99 / THR-100: code-merge gated on **THR-134 U4** (aftermath chronicle/toast feedback for aftermath effects). Check THR-134 status at implementation start.

1. **Preferred:** complete implementation, open PR, keep branch unmerged until THR-134 U4 passes.
2. **Alternative:** if THR-134 has closed, merge normally.

The invariant: **do not merge** Tavern templates before U4 is verified. A silent migration defeats the point.

## Exit criteria

- [ ] All 10 tavern templates converted to UnifiedActionTemplate format
- [ ] `sublocationTypes: ['sublocation-type.tavern']` preserved on every template
- [ ] Prose meets Threadbare bar; tavern-specific: every opening beat carries ≥1 of smell/sound/light/crowd
- [ ] Each template has ≥1 contextual aftermath reaction (encounter seed, hidden mark, reputation tally, intelligence grant, or named attachment)
- [ ] ≥3 templates grant concrete, consumable intelligence (name / route / vulnerability — not generic)
- [ ] ≥5 templates plant an encounter seed on at least one outcome tier
- [ ] ≥5 templates plant or reveal a hidden mark
- [ ] Every template opening beat references `{location:tavernNameOrFallback}` (or equivalent enrichment)
- [ ] ≥6 templates carry a `{?has_faction}` branch
- [ ] ≥4 templates reference `{?has_ally}` or `{ally:strongest}` / `{rival:strongest}`
- [ ] ≥2 templates use explicit ActionStepBranch `next` on outcome (genuine fork, not cosmetic)
- [ ] Every `appliesWound: true` converted to `condition_attachment` (`trait.condition.wounded`) aftermath effect
- [ ] Every reputation-bearing outcome sets `reputationPolarity` with correct axis polarity
- [ ] `{name}` + pronouns in every prose field
- [ ] Legacy tavern entries removed from `ENCOUNTER_TEMPLATES`
- [ ] Editorial checklist (7 questions) passed on every template
- [ ] Verification gates green (tests, tsc, build, CLI smoke with tavern sublocation, encounter log spot-check, DebugPanel confirms `intelligence_granted` AND `encounter_seed_planted` fire from tavern templates)
- [ ] Completion comment summarises template count (10), counts of seeds/marks/intel/reputation tallies authored, any axis substitutions, any ActionStepBranch patterns worth promoting to skill guidance
- [ ] Merge deferred until THR-134 U4 closes (or merged concurrently)

## NFP compliance

| NFP | Status | Note |
| -- | -- | -- |
| #1 Tunability | PASS | No new magic numbers; re-uses settled migration vocabulary. |
| #2 Inspectability | PASS | All traces exist; `intelligence_granted` and `encounter_seed_planted` make Tavern's signature visible in DebugPanel. |
| #3 Determinism | PASS | Content-only change; no new PRNG surfaces. Seeds carry deterministic payloads. |
| #4 Fail-soft | PASS | Fail-soft table covers ten likely failure modes, including sublocation filter and condition-template lookup. |
| #5 Narrative over mechanical | PASS | External voice exemplars (Thieves Guild + Social + pick-pocket-skill-test) anchor narrative register. Tavern-specific: sensory-opening rule. |
| #6 Additive | PASS | Adds migrated templates; removes only the legacy entries being replaced. |
| #7 Performance budget | PASS with note | Encounter seeds are cheap; ≥5 seeds × 10 templates fired per-encounter-run is well under budget. Profile only if a future content batch pushes active seeds above ~200. |
