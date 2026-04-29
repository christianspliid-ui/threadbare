# EncounterTemplate → UnifiedActionTemplate Migration

**Date:** 2026-04-16
**Type:** Architecture migration — multi-phase
**Status:** Design
**Applies to:** All 115 legacy EncounterTemplate encounters + 162 consumer files + supporting engine/UI systems
**Related:** Prose Content Quality Pass (Linear), systemic wiring guide, template-encounter-rewrite skill
**Three pillars:** Engine (bridge verification + trace wiring + constants), Content (115 template rewrites + aftermath authoring + editorial pass), UI (aftermath prose rendering + outcome-level differentiation + authored-reward rendering + intelligence beats + adapter consolidation)

---

## Framing: Why This Migration Exists

Threadbearer's core value proposition — the reason the game is named what it's named — is that the player bears the threads of stories that weave the world. Living stories in a living world. The player isn't moving numbers around; they're pulling on threads whose other ends are held by other stories, and watching the weave change.

Every design decision in this migration resolves against that frame. When the fork is between a flat, numeric, repeatable mechanic and a narrative, living, unpredictable one, the answer is always the latter. Many other games do flat-numeric-repeatable better; Threadbearer has no business competing on that axis. This framing is the tiebreaker that makes the rest of this document's choices cheap: generalize Gate Duty's prose-richness to all 115 templates (don't keep it as a specialization); give authors space to breathe in prose fields (don't cap them); author attachments by name (don't default to anonymous pool draws); seed future encounters with specific memory (don't rely on category tags); reveal hidden marks through narrative moments (don't surface them as debug rows).

If any Phase 0 or Phase 1 decision seems to pull toward the flat-numeric direction "for simplicity," it's the wrong call. Cut scope instead — fewer templates, smaller phase — rather than cutting richness per template.

---

## Problem Statement

The game has two encounter formats that produce two different player experiences:

**UnifiedActionTemplate** (8 hand-authored branching encounters): Full access to GraphOps, branch-aware aftermath, typed aftermath reactions (encounter seeds, hidden marks, intelligence grants, reputation tallies, clearance gate tags, recent events), per-step world mutations, 5-level outcome ladder, authored choice cards, and contextual aftermath that tells a different story depending on the path taken.

**EncounterTemplate** (115 template encounters): Binary success/failure, a text string for narrative, `traitModifiers` for stat deltas, `reputationDelta` for a number, and a `RewardPoolRecipe` that randomly draws from a generic attachment pool. No GraphOps. No aftermath reactions. No encounter seeds. No hidden marks. No conditional aftermath. No authored choices.

This isn't a content quality gap — it's a structural cap. Template encounters *cannot* plant a hidden mark when a thief gets caught, *cannot* seed a follow-up encounter when a negotiation goes sideways, *cannot* grant intelligence when a scout maps patrol routes. The prose can imply these things, but the engine can't execute them. The result is that 115 encounters — the vast majority of what the player experiences — feel like book pages while 8 feel like game content.

A prose rewrite alone doesn't fix this. The encounters need to be migrated to the format that supports contextual aftermath, and the prose + wiring should happen as part of the migration — one pass per template, touching each file once.

---

## What Exists Today

### The Migration Bridge

`src/data/unified-action-templates.ts` already contains:

- **`migrateEncounterTemplate()`** — Mechanical conversion: normalizes difficulty (÷100), wraps duration in `{min, max}`, maps encounter type to CRUD type, sets scale to `'local'`, stubs all GraphOps as `[]`. Carries `rewardPool`, `tierPromotionEligible`, `reputationDelta` into `ActionStepOutcomeMetadata`.
- **`migrateEncounterOutcomeMetadata()`** — Extracts the three live signals from legacy outcomes.
- **`buildCanonicalEncounterTemplates()`** — Deduplicates across content modules.
- **`getUnifiedTemplateById()`** — Already the source of truth for template lookup.

The bridge does the *mechanical* conversion today. What it doesn't do is add any systemic wiring — every migrated template has empty GraphOps, no aftermath config, no reactions. The templates run through the unified pipeline but gain none of its capabilities.

### Migration Audit

`src/data/encounter-migration-audit.ts` tracks:

- **115 total templates**, all with at least one live signal (reward pool, reputation delta, or tier promotion)
- **0 thin placeholders** (every template has consequences)
- **2 templates with deferred fields** (traitModifiers/traitChanges not yet representable as GraphOps)
- Live signal breakdown: reward pools, reputation deltas, and tier promotion flags all carried through the bridge

### Template Counts by Content File

| File | Templates | Category |
|------|-----------|----------|
| borderland-encounter-content.ts | 60 | Mixed (exploration, travel) |
| faction-encounter-content.ts | 58 | Cross-faction (generic faction interactions) |
| social-encounter-content.ts | 47 | Social (alliances, recruitment, mentoring) |
| thieves-guild-encounter-content.ts | 43 | Guild-specific |
| arcane-circle-encounter-content.ts | 42 | Guild-specific |
| civic-guard-encounter-content.ts | 44 | Guild-specific |
| builders-fellowship-encounter-content.ts | 42 | Guild-specific |
| merchant-consortium-encounter-content.ts | 42 | Guild-specific |
| holy-order-dawn-encounter-content.ts | 42 | Guild-specific |
| lorekeepers-covenant-encounter-content.ts | 42 | Guild-specific |
| rangers-brotherhood-encounter-content.ts | 42 | Guild-specific |
| underking-court-encounter-content.ts | 42 | Guild-specific |
| temple-of-spheres-encounter-content.ts | 42 | Guild-specific |
| mercenary-encounter-content.ts | 32 | Combat/hire |
| tavern-encounter-content.ts | 30 | Tavern-specific |
| army-encounter-content.ts | 17 | Military |
| monster-encounter-content.ts | 17 | Combat/monster |
| encounter-anomaly-content.ts | 10 | Anomaly/magical |

> **2026-04-28 audit corrections (Cowork, THR-102 + Phase 4 audit).** The original audit script overcounted multiple files by treating nested aftermath-reaction effect IDs and aggregated META map entries as templates. Verified counts based on top-level `id: '...'` matches in each file's templates array:
>
> | File | Audit | Actual top-level templates | Status |
> |---|---|---|---|
> | `social-encounter-content.ts` | 47 | **14** | Already migrated (THR-100) |
> | `tavern-encounter-content.ts` | 30 | **10** | Already migrated (THR-101) |
> | `faction-encounter-content.ts` | 58 | **18** | Pending (THR-102, in Ready for Dev) — 5 standard + 3 senior + 2 elite + 2 lifecycle + 6 social, all `ag.*` |
> | `monster-encounter-content.ts` | 17 | **5** | Pending (THR-103) — `monster.hunt.minor`, `monster.hunt.named_elite`, `monster.encounter.ambush/lair_defense/horde_raid` |
> | `army-encounter-content.ts` | 17 | **6** | **Shipped** (THR-104, 2026-04-29) — `mc.army.raise`, four `army.threshold.*`, `army.aftermath.refugees` migrated to `UnifiedActionTemplate[]` with Threadbare prose and authored aftermath. Programmatic-spawn signal (`locationSubtypes: []`) preserved; threshold IDs still resolve via `armyAttrition.ts`. |
> | `mercenary-encounter-content.ts` | 32 | **13** | **Already migrated** under THR-31 Phase 2f — header note confirms. THR-105 is stranded; close as Cancelled. |
> | `encounter-anomaly-content.ts` | 10 | **10** | Pending (THR-106) — count correct |
> | `borderland-encounter-content.ts` | 60 | **20** | Pending (THR-107) — file's own header reads "20 templates" |
>
> **Effective remaining migration scope:** 18 (THR-102, faction) + 5 (THR-103, monster) + 6 (THR-104, army) + 10 (THR-106, anomaly) + 20 (THR-107, borderland) = **59 templates across five issues.** The original audit suggested ~174 across seven files; the real number is roughly a third of that.
>
> **Subtle reading-trap to avoid in future audits:** `faction-encounter-content.ts` exposes `FACTION_ENCOUNTER_TEMPLATES: UnifiedActionTemplate[]` at line 1242, but builds it via a runtime `toUnifiedTemplate()` adapter applied to three internal `EncounterTemplate[]` arrays (`LEGACY_FACTION_QUEST_TEMPLATES`, `FACTION_LIFECYCLE_TEMPLATES`, `FACTION_SOCIAL_TEMPLATES`). The runtime shape is unified; the source data is not — and the adapter doesn't add authored aftermath. Any file registered through `addTemplates()` in `unified-action-templates.ts` (currently `ANOMALY_*`, `MONSTER_*`) likely uses the same pattern. When auditing migration scope, look at the source-array element type, not the public-export type.

### Hand-Authored Branching Encounters (8, already in UnifiedActionTemplate)

soul-ferryman, flawed-steel, road-ambush, the-courtyard-duel, the-brink-rescue, the-letters-of-introduction, rival-shrine-betrayal, wandering-healer-shrine-access

### Aftermath Pipeline: State of Play

Investigated 2026-04-16. Verdict: **the engine-side aftermath pipeline is general; the UI-side aftermath presentation is not.**

**What works today for any template:**
- `src/engine/encounterAftermath.ts::applyEncounterAftermathReaction()` contains zero `templateId` branching. It dispatches `EncounterAftermathReaction` effects polymorphically by `effect.kind`: `reputation_score`, `reputation_tally`, `clearance_gate_tag`, `encounter_seed`, `hidden_mark`, `intelligence`. Any template that authors these effects and the player selects the reaction will see them applied correctly.
- The test `src/engine/__tests__/hiddenMarks.test.ts` already exercises the pipeline with a non-Gate-Duty template (`broker.quest.rival_shrine_betrayal`) and passes — the engine path is proven generic, not a speculative claim.
- All 8 hand-authored branching encounters declare `aftermathConfig` and route through the same pipeline.
- Orchestrator Phase 2a.8 (`src/engine/unifiedActionResolution.ts`) evaluates encounter seeds planted by aftermath reactions on subsequent ticks — this runs for all templates.

**What is Gate-Duty-specific and must be generalized during this migration:**
- `buildGateDutyEncounterStageModel` calls `buildGateDutyAftermathNarrative()` and `rewriteGateDutyAftermathReactions()` to produce authored aftermath *prose* ("The checkpoint has survived the seizure…") and reaction-label rewrites that embed Gate Duty context.
- `buildUnifiedEncounterStageModel` deliberately does *not* render aftermath narrative prose — it only surfaces the authored-changes summary and raw reaction options from `aftermathSummary`.
- **Consequence:** a migrated template's aftermath mechanics fire correctly, but the player will see bland reaction labels and no aftermath narrative unless the unified adapter is extended. This is the one true UI pillar task this migration must do — consolidating the adapters isn't just cleanup, it requires the unified adapter to grow the capability to render authored aftermath prose from a template field.

**Remaining verification (moves from "unknown" to specific Phase 0 tests):**
- Integration test: a migrated template declaring typed aftermath reactions, resolved end-to-end, produces the expected hidden marks / seeds / intelligence on state after the player selects a reaction in the unified adapter path (not the Gate Duty path).
- Snapshot: aftermath reaction labels and narrative prose, as they appear in the unified adapter UI for a migrated template (once the adapter extension lands).

---

## Migration Design

### Guiding Principle

**One pass per template.** Each template gets migrated, prose-rewritten, and systemically wired in a single authoring pass. The implementing agent reads the `template-encounter-rewrite` skill (which mandates reading the systemic wiring guide), converts the TypeScript from EncounterTemplate to UnifiedActionTemplate format, rewrites all prose to meet the Threadbare aesthetic bar, and authors contextual aftermath (reactions, seeds, marks, intelligence) appropriate to the encounter's fiction. No "migrate now, wire later" — that's how you get 115 templates in a new format with the same empty aftermath.

### Design Decisions

#### 1. Leverage System → Explicit Branching

**Decision:** Replace leverage modulation with explicit `ActionStepBranch` variants where it adds narrative value. Drop it silently where it was just a difficulty modifier.

**Rationale:** The leverage system tracked a hidden 0–1 score that modulated difficulty across steps — "I did well in the opening, so the negotiation gets easier." This is invisible to the player and produces no narrative distinction. The unified model's explicit branching ("your approach in step 1 determines what happens in step 2") is both more transparent and more powerful — it lets the prose change, not just the numbers.

**Migration rules:**
- Templates where leverage merely adjusted difficulty (most combat, most guild tasks): Convert to flat multi-step with `failBehavior: 'continue_weakened'`. The difficulty curve is embedded in per-step difficulty values.
- Templates where leverage gates conditional steps (social negotiations, multi-phase infiltrations): Convert to `ActionStepBranch` with variants keyed on step 1 outcome. Author distinct prose for each variant. These are the templates that gain the most from migration.
- `leverageOnSuccess`, `leverageOnFailure`, `leverageModifiesDifficulty`: Dropped from all templates. No unified equivalent needed — the behavior is replaced, not replicated.

#### 2. Trait Modifiers → GraphOps

**Decision:** Replace `traitModifiers: Record<string, number>` with `GraphOp[]` of type `'update_node'` targeting `$actor` with property changes.

**Rationale:** Only 2 templates currently use trait modifiers (per migration audit). The conversion is mechanical:

```typescript
// Before (EncounterOutcome):
traitModifiers: { 'trait.combat.attack': 0.05, 'trait.social.persuasion': -0.03 }

// After (ActionStep.onSuccess GraphOp[]):
[
  { op: 'update_node', nodeId: '$actor', changes: { 'trait.combat.attack': { delta: 0.05 } } },
  { op: 'update_node', nodeId: '$actor', changes: { 'trait.social.persuasion': { delta: -0.03 } } },
]
```

If more templates need trait mutations during migration, the same pattern applies. The `update_node` op already supports property deltas.

#### 3. Threat Rating → Rarity Tier + Step Difficulty

**Decision:** Drop `threatRating` as a field. Map its intent to `rarityTier` (controls player-facing visibility/importance) and per-step `difficulty` values (controls resolution odds).

**Mapping:**
| ThreatRating | rarityTier | Difficulty Range (0–1) | Rationale |
|---|---|---|---|
| trivial | 1 (Mundane) | 0.15–0.25 | Background noise, low stakes |
| easy | 1–2 (Mundane–Uncommon) | 0.25–0.40 | Routine challenge |
| moderate | 2 (Uncommon) | 0.35–0.55 | Standard encounter |
| hard | 3 (Rare) | 0.50–0.70 | Significant challenge |
| deadly | 4 (Legendary) | 0.65–0.85 | Major encounter, high stakes |

The implementing agent uses judgment within these ranges based on narrative context. A "hard" social negotiation and a "hard" combat encounter should feel equivalently consequential but may have different absolute difficulty values.

**Collapse note:** five threat ratings compress to four rarity tiers. `trivial` and `easy` both land in the Mundane/Uncommon band, losing granularity between "background flavor" and "routine challenge." Phase 0 should audit the actual distribution across the 115 templates — if most templates cluster as `trivial` or `easy`, consider adding a sub-tier (rarityTier 1.5 or `isBackground: true` flag) rather than flattening them.

**Turn-based calibration caveat:** per `project_turn_based.md` (settled 2026-04-16), the game is turn-based, not real-time. In turn-based play, the player observes and reasons about each encounter outcome more carefully, which inflates the *felt* difficulty of the same probability. The ranges above are a starting point carried over from the legacy template's resolution model; Phase 1 playtest should recalibrate based on actual perceived difficulty. Expect to shift ranges downward by ~0.05 across the board if Phase 1 reports encounters feel harder than intended.

#### 4. Encounter Type → CRUD Type

**Decision:** Keep the existing `encounterTypeToCrud()` mapping. It's already implemented in the bridge.

| Encounter Types | CRUD | Rationale |
|---|---|---|
| create, hire, build | create | Agent brings something new into the world |
| explore, acquire, steal, trade | read | Agent interacts with what exists |
| duel | delete | Agent removes or defeats something |
| assist, lead, all others | update | Agent changes the state of something |

#### 5. Conditional Steps → ActionStepBranch or failBehavior

**Decision:** Templates with `conditional` step configurations (leverage_range, partial_success) become either `ActionStepBranch` variants (if narratively distinct) or steps with `failBehavior: 'continue_weakened'` (if the condition was just a difficulty gate).

**Rule of thumb:** If the conditional step has its own distinct narrative, it becomes a branch variant. If it just adjusts numbers, it becomes a weakened continuation.

#### 6. Fields Dropped Without Replacement

These fields are not carried forward. They either have no unified equivalent or their function is handled differently:

| Dropped Field | Rationale |
|---|---|
| `reachSecondary` | Unified templates use single `reach`. Secondary reach was flavor, not mechanical. |
| `culturalAffinity` | Not used in resolution. Cultural context enters through enrichment placeholders (`{culture}`) in prose. |
| `remoteAttempt` | Handled by action availability logic, not template metadata. |
| `visibleTo` | Encounter visibility is computed by the filtering pipeline, not template metadata. |
| `questPriority` | Replaced by `rarityTier` + motivation scoring in unified pipeline. |
| `requiredTraits` | Replaced by `requiredTargetTraits` (simplified: IDs only, no level thresholds). |
| `blockedByTraits` | Not used in unified resolution. |
| `reputationPolarity` | Implicit in aftermath reaction configuration and prose tone. |
| `backgroundTrack` / `musicTrack` | Audio metadata handled separately from encounter logic. Preserve in migration comments for future audio system. |
| `appliesWound` | Replaced by GraphOp that adds a wound condition node. More flexible — the wound can be specific, named, consequential. |

#### 7. What Every Migrated Template Gains

The point of this migration is not format conversion — it's capability access. Rules below are split into **hard requirements** (structural; must be present for the template to merge) and **quality gates** (reviewed in the editorial pass; absence is allowed with a brief comment explaining why).

**Hard requirements (structural — no exceptions):**

| Capability | Requirement | Why |
|---|---|---|
| **Enrichment placeholders** | `{name}` + pronoun family (`{they}`/`{them}`/`{their}`/`{s}`) present in every narrative field that mentions the actor | Agent identity in every scene — the difference between "you succeed" and "Serafina succeeds" |
| **Multiple authored outcome prose** | At least two outcome variants (success + failure) authored with distinct prose, not string-interpolated from each other | Two stories minimum; the binary outcome is already assumed |
| **Structurally distinct success vs. failure consequences** | Success and failure produce different *kinds* of persistence, not mirror-image deltas | "+5 rep / −5 rep" is not distinct; "success plants a favor / failure plants a witness" is |

**Quality gates (reviewed; absence requires a one-line comment):**

| Capability | Target | Review Question |
|---|---|---|
| **Conditional blocks** (`{?has_faction}`, `{?has_artifact}`, etc.) | At least one per template | Does this template read differently for different agent types / world states? If not, why? |
| **Typed aftermath reaction with persistent effect** (hidden_mark / encounter_seed / intelligence / reputation_tally) | At least one per template | Does something persist in the world because of this encounter beyond what the generic reward pool gives? If not, can the encounter justify that (genuinely lightweight fiction)? |
| **Three outcome variants** (success + failure + one of: critical_success / success_at_cost) | Target for all templates; minimum for rarityTier ≥ 3 | Is the third outcome fiction-worthy here, or would it be filler? |
| **Five outcome variants** | Only for rarityTier = 4 (Legendary) | Rare case — only when critical-success and critical-failure produce distinct stories worth authoring |

**Opportunistic capabilities (use where the fiction calls for it — no quota):**

This list is the full design surface — "what an encounter *should* be able to do to the world when the fiction demands it." Each row is marked by readiness:

- **🟢 Today** — works in the engine now (some are undocumented; Phase 0 documents them)
- **🟡 Small engine fix** — closing an existing loop or adding a targeting/scoping field; scoped as Phase 0 engine prerequisites below
- **🔴 Structural work** — new subsystem; not required for migration, but the design lists them so they exist in the plan record rather than being invisible

Design is expansive on purpose; implementation slicing (below) is where we decide which cuts ship with the migration vs. which follow.

| Capability | Readiness | When to Use |
|---|---|---|
| **Encounter seeds (`templateId`)** | 🟢 | Outcome implies a future consequence (the enemy who escaped, the debt unpaid, the secret overheard) |
| **`ActionStepBranch`** | 🟢 | Prior step's outcome meaningfully changes the next step's prose and resolution |
| **Branch-aware aftermath** | 🟢 | Different paths through the encounter produce fundamentally different world-states |
| **Authored choice cards** | 🟢 | Encounter has a meaningful decision point where the player-god intervenes |
| **Authored attachments via GraphOp** | 🟡 | A named, specific thing enters the fiction — "A Debt Remembered," "The Key to Her House." Raw `add_node`+`add_edge` works today but there is no author-friendly "authored attachment" helper or trace path. *Phase 0 wraps the raw ops in a named helper and emits an `authored_attachment_created` trace.* |
| **Location CRUD — sublocations (create, destroy)** | 🟡 | Agent founds a shrine, raids raze a safehouse. Raw `add_node` / `remove_node` + edges work, but `createSublocation()` as a strategic helper is *not* wired into encounter aftermath today. *Phase 0 adds a proper aftermath-effect helper (`spawn_sublocation`, `raze_structure`).* |
| **Location CRUD — property deltas** (prosperity, defense, magicalSaturation) | 🟢 | `update_node` with relative deltas (`'+10'`, `'-0.5'`) works from step `onSuccess`/`onFailure` GraphOps today |
| **NPC CRUD — spawn via EncounterSupportBundle** (must-persist) | 🟢 **(setup-time only)** | Encounter introduces a named survivor, antagonist, or witness who continues to exist via support bundle materialization. **Setup-time only** — cannot decide mid-encounter or in aftermath to spawn an NPC via the bundle path. |
| **NPC CRUD — retire / transform from aftermath** | 🟡 | Raw `remove_node` works from resolution-step GraphOps. No aftermath-time NPC CRUD path exists; mid-encounter branching can't easily spawn NPCs either. *Phase 0 adds aftermath-kind effects for NPC lifecycle.* |
| **Arbitrary edges — canonical types** (`controls`, `member_of`, `trades_with`, `thread`, `relates_to`, etc.) | 🟢 | Fully wired via `add_edge` with symbolic refs. *Caveat: canonical edge types are finite (see `src/types/graph.ts:43`); adding a new edge type requires a schema-design pass, not just author intent.* |
| **Arbitrary edges — new semantic types** (e.g. `ally_of`, `enemy_of`, `sacred_route`, `spy_network`) | 🟡 | The graph will accept unknown `edgeType` strings but no engine system *reads* them; schema widening is real work. *Phase 0 decides per edge whether to add to canonical set, reuse existing (`relates_to` + property), or defer.* |
| **Faction control transfer** (`controls` edge) | 🟢 | Works via `add_edge` type:`controls` |
| **Faction relationship shifts** (cool → hostile, neutral → allied) | 🟡 | Today: express via `relates_to` with properties, or via `apply_influence`. `ally_of`/`enemy_of` are *not* canonical edge types and would need schema work (see above row). |
| **Divine influence on an NPC** (`apply_influence` GraphOp) | 🟢 | Wired — adds decaying influence with reach boost, value drift, behavior tag, strategy override |
| **Intelligence grants** | 🟡 (engine-only today) | Encounter involves reconnaissance, interrogation, overheard information, or mapped territory — *Phase 0 wires consumption into scoring + enrichment* |
| **Hidden marks** | 🟡 (engine-only today) | Encounter involves secrets, witnessed acts, debts, deceptions, or social exposure — *Phase 0 builds the revelation pathway so marks can bloom into discovery encounters* |
| **Multi-agent aftermath effects** (reputation/marks/intel on non-actor participants) | 🟡 | A bystander witnesses and their reputation shifts; a rival is marked by what they did to the agent; a faction absorbs the reputation delta — *Phase 0 adds `targetAgentId` / `targetFactionId` to aftermath effects* |
| **Set (not delta) reputation** | 🟡 | Breaking an oath resets alignment to zero; a coronation sets an agent to +1 with their faction — *Phase 0 adds `reputation_set` effect alongside `reputation_score`* |
| **Condition / attachment CRUD on any participant** (add, remove, modify duration/intensity) | 🟡 | Witness gets a "Haunted by what they saw" condition; co-conspirator carries "Bound by shared secret"; target is cleansed of a curse — *Phase 0 adds `add_condition` / `remove_condition` / `modify_condition` GraphOps with scope* |
| **Faction CRUD — splinter, absorb, dissolve, declare_war, force_peace** | 🟡 | Schism inside a guild produces a splinter faction; two factions merge after the conflict resolves; a faction is formally dissolved — *Phase 0 adds faction-level effect kinds; edges alone can't express splinter/absorb* |
| **Item / artifact spawn + possess atomically** | 🟡 | "Ashenmourne comes out of the tomb and into the agent's hand" — *Phase 0 adds a `spawn_artifact` helper that combines `add_node` + `add_edge(possesses)` + tier assignment* |
| **Omen emission from encounters** | 🟡 | Big moments tilt the world-soul's weather: an atrocity stains the region; a founding consecrates it — *Phase 0 adds `emit_omen` / `modify_omen_intensity` effects* |
| **Encounter-to-encounter causation edges** (`seeded_by`, `in_response_to`) | 🟡 | A revelation encounter can narrate "this is the echo of what you did 30 ticks ago" because the graph remembers — *Phase 0 adds these edge types and wires them to seed spawning* |
| **World-state conditional effects** (gate effects on live state — "only if faction still controls the location") | 🟡 | Seeds and aftermath only fire if the world hasn't drifted out from under them — *Phase 0 adds a `when` predicate on effects* |
| **Thread-edge mutations from encounters** (interventionRatio, court position changes, attention weight) | 🟡 | Encounter outcome lands the agent in / out of the protagonist portfolio; divine attention tilts — *Phase 0 exposes thread-edge deltas as effect kinds* |
| **Scheduled graph mutations** (delayed property changes, scheduled decay) | 🔴 | "Reputation decays 0.01/tick for the next 30 ticks" or "the siege engine arrives in 12 ticks and damages the wall" — beyond Phase 0; structural work |
| **World-soul / thematic pressure feedback from encounters** | 🔴 | Enough betrayals in a region shift the hex's thematic pressure toward Treachery — beyond Phase 0; needs world-soul API surface |
| **Wound / scar system** | 🔴 | `appliesWound: true` is in the schema with no wound catalog; either wire the subsystem or strike from schema — *listed here so it's not invisible* |
| **Generalized Action Targeting** (templates that can be fired at multiple kinds of targets — locations, factions, agents) | 🔴 | The `targetCategories`/`targetSubtypes` fields exist but zero templates use them; full enablement is a separate project |

**Editorial pass:** Every migration is reviewed against these tables before merge. Hard requirements must be satisfied; quality gates may be waived with a one-line justification comment on the template. A template can merge with only the hard requirements if the fiction is genuinely lightweight (a routine travel exploration, a mundane market stop) — the goal is calibrated richness, not uniform maximalism.

#### 8. Encounter-Specific Attachments and Conditions

**This is a key capability the migration unlocks.** Currently, template encounters pull from a generic `RewardPoolRecipe` — category weights + tag filters → random draw from the attachment catalog. A "successful theft" and a "successful negotiation" can produce the same generic gold reward.

Post-migration, encounters can create *contextual* rewards and penalties through two mechanisms:

**Mechanism A: Curated reward pools with encounter-specific tag filters.** Instead of `{ categoryWeights: { possession: 0.7 }, tagFilters: ['#gold'] }`, write `{ categoryWeights: { possession: 0.5, condition: 0.3, agreement: 0.2 }, tagFilters: ['#shadow', '#leverage'] }` — the tag filters narrow the pool to thematically appropriate attachments. This requires good tag coverage in the attachment catalog (the attachment-pipeline skill handles authoring those).

**Mechanism B: GraphOps that create attachment nodes inline.** An encounter's `onSuccess` GraphOps can include:
```typescript
{
  op: 'add_node',
  nodeType: 'attachment',
  nodeName: 'A Debt Remembered',
  properties: {
    category: 'agreement',
    description: 'The merchant remembers your mercy. In a hungry market, that memory is currency.',
    tags: ['#social', '#reputation'],
    duration: 30, // ticks
    effects: [{ kind: 'reputation_tally', key: 'merchant_favor', delta: 1 }],
  },
},
{
  op: 'add_edge',
  edgeType: 'has_attachment',
  source: '$actor',
  target: '$lastCreatedNode',
}
```

This creates a *named, narrative, mechanically specific* attachment that belongs to this encounter — not a random draw from a catalog. The attachment has its own description, duration, and effects. It tells a story.

**Mechanism C: Aftermath reactions with typed effects.** Beyond attachments, aftermath reactions can:
- Plant a **hidden mark** (`{ kind: 'hidden_mark', category: 'witnessed', severity: 0.4, label: 'Caught reaching for the wrong purse', revealFamilies: ['investigation'] }`) — the agent carries an invisible consequence that surfaces when the right system looks for it.
- Seed a **future encounter** (`{ kind: 'encounter_seed', templateId: 'tg.quest.payback_run', delayTicks: 15, seedLabel: 'The wool trader remembers your face' }`) — what happened today creates a specific future story.
- Grant **intelligence** (`{ kind: 'intelligence', category: 'patrol_route', label: 'Market guard rotation at Thornhaven', detail: 'Shift change at third bell, blind spot behind the spice stall' }`) — the encounter produces usable knowledge, not just narrative.

**Authoring guideline:** Every template should have at least one encounter-specific consequence beyond the generic reward pool. The reward pool is fine for material loot — but the *story* consequence should be authored, not random. A theft gone wrong should plant a specific mark. A successful negotiation should seed a specific follow-up. A failed rescue should produce a specific reputation event. This is what "contextual aftermath" means.

### 9. Outcome Ladder: From Binary to Five-Level

**EncounterTemplate** resolution is binary: succeed or fail, determined by a single d100 roll against sigmoid-mapped difficulty.

**UnifiedActionTemplate** uses a five-level outcome ladder:
| Level | Name | When |
|---|---|---|
| 1 | `critical_failure` | Roll far below threshold |
| 2 | `failure` | Roll below threshold |
| 3 | `success_at_cost` | Roll near threshold (marginal) |
| 4 | `success` | Roll above threshold |
| 5 | `critical_success` | Roll far above threshold |

**Migration impact:** Template encounters currently author two prose variants (success narrative, failure narrative). Migrated encounters target three or more — see the quality-gate table in section 7 for the per-rarityTier rule. The "cool failure" principle applies doubly to critical_failure when authored: a critical failure should produce a story you'd *want* to tell, not a duller version of regular failure.

**Authoring cost reality:** Authoring five distinct outcome prose is ~4× the word count of authoring two, plus authoring the consequences that differentiate them. Five-outcome templates are expensive. The rarity-tier gate in section 7 keeps the budget proportional to player-facing significance.

### 10. The `failBehavior` Decision Per Step

Every step in a UnifiedActionTemplate declares what happens when the agent fails it:

- **`'fail_action'`** — The encounter ends. Used for final steps, or for any step where failure means the opportunity is gone (the mark walked away, the gate closed, the enemy escaped).
- **`'continue_weakened'`** — The encounter continues, but the agent carries a disadvantage. Used for early steps in multi-step sequences where partial progress is meaningful.

**Migration rule:** The bridge currently sets early steps to `'continue_weakened'` and the final step to `'fail_action'`. This is a reasonable default but should be reviewed per template during the content pass. Some encounters should hard-fail on step 1 (a botched ambush where surprise is everything). Some should fail-forward even on the final step (a negotiation where even failure produces a relationship).

---

## UI Pillar: Making the New Capabilities Visible

The migration's value proposition — contextual, narrative aftermath — is nullified if the player can't see it. A scan of `src/components/` confirms a significant gap: the engine already supports hidden marks, encounter seeds, intelligence grants, authored attachments, and a five-level outcome ladder, but **none of them have first-class player-facing UI surfaces today.** Only `buildGateDutyEncounterStageModel` renders aftermath narrative prose, and only `AttachmentDetailView` renders one specific attachment case.

This section enumerates the UI work that must land alongside the migration for it not to be cosmetic.

### Mandatory — Without these, migration is invisible

These UI tasks are prerequisites to Phase 1 (thieves guild pilot) actually delivering player-felt improvement. They should be sequenced into Phase 0 or as the opening of Phase 1, not deferred.

| UI Capability | Current State | What's Needed |
|---|---|---|
| **Aftermath narrative prose** | `AftermathVariant.overview` field exists in the schema, but `buildUnifiedEncounterStageModel` does not render it as prose; Gate Duty renders its own state-computed prose via `buildGateDutyAftermathNarrative()` | Add a dedicated multi-paragraph `narrativeProse: string` field to `AftermathVariant` (keep `overview` as a one-line summary for notifications/lists). Extend `buildUnifiedEncounterStageModel` to render `narrativeProse` with enrichment placeholders resolved. **Fully generalize Gate Duty's prose capability to all templates** — per the narrative tiebreaker, every encounter deserves Gate Duty's texture, not just Gate Duty. Gate Duty's state-computed prose becomes (a) template-declared prose with enrichment placeholders where possible, and (b) general-purpose enrichment placeholders (e.g., `{gate:status}`, `{location:unrestPressure}`) that any template can use where state-aware computation is genuinely needed. Nothing that produces prose texture remains encounter-specific. |
| **Outcome ladder differentiation** | No visible distinction between `success`, `critical_success`, or `success_at_cost` outside prose text | Encounter result header shows an outcome-level label (authored per template or defaulted) and tonal differentiation (subtle color/weight). Not gamified — narrative-appropriate. |
| **Authored attachment rendering** | Pool-drawn attachments render identically to GraphOp-created named attachments | When an aftermath creates a named attachment (Mechanism B in section 8), render it with its authored name, description, and effect-flavor text, not as an anonymous "Reward." |
| **Aftermath reaction labels** | Gate Duty uses `rewriteGateDutyAftermathReactions()` to inject context-specific labels; unified path uses raw reaction strings | Reaction cards render template-authored `label` and optional `previewProse` fields. Migrated templates must author these per reaction; the adapter must read them. |
| **Intelligence grant acknowledgment** | No UI surface — intelligence is placed silently on state | Encounter result renders a short "You learned…" beat when an `intelligence` effect fires. Prose authored on the effect itself. |

### Deferred — Desirable, but trackable as Linear issues

These improve the *reach* of the systemic effects but don't block migration quality. File as follow-up issues in the same project, referenced from each phase's exit criteria.

| UI Capability | Why Deferrable | Trigger for Building |
|---|---|---|
| **Hidden mark placement moment** | Marks by design shouldn't announce themselves; the encounter prose already carries the weight | Build when a playtest cohort reports that consequences feel non-causal |
| **Hidden mark reveal flow** | Reveal happens through `revealFamilies` (e.g., investigation actions); reveal UI only matters once a downstream encounter calls for it | Build when the first template with a reveal-family match ships |
| **Agent intelligence inspection panel** | Cumulative intelligence is useful but not new to this migration; current inspection patterns already handle attachments | Build when intelligence quantity per agent justifies a dedicated panel (after Phase 3) |
| **Encounter-seed provenance breadcrumb** | A seeded encounter can open with prose that references its source; doesn't need a UI breadcrumb | Build only if content authoring reveals the prose-only approach is insufficient |
| **Branch-path breadcrumb in aftermath** | Branch-aware aftermath prose should carry its own causal reference; explicit UI breadcrumb is belt-and-suspenders | Build only if playtest shows causality is unclear |

### Adapter Consolidation Plan (revised)

The three-adapter collapse proposed in the original Deprecation Plan is good, but the sequence matters:

1. **Extend the unified adapter** with the Mandatory surfaces above (render authored aftermath prose, outcome-level label, authored attachment flavor, authored reaction labels, intelligence "you learned" beat). This is additive — both adapters can coexist.
2. **Migrate Gate Duty data to use the generalized fields.** Gate Duty's authored prose and reaction rewrites move from adapter-hardcoded strings to template-declared fields read by the unified adapter.
3. **Delete `buildGateDutyEncounterStageModel` and `buildSimpleEncounterStageModel`** together, once Gate Duty is proven on the unified adapter and all 115 templates are migrated. This is the destructive Phase 5 step.

This ordering ensures we don't delete specialization before its content has a home.

### Wiring Checklist Updates

Per `Docs/plans/wiring-checklist.md`, this migration adds these surfaces that need to be registered:
- New template fields: `aftermathVariant.narrativeProse`, `aftermathReaction.label`, `aftermathReaction.previewProse`, `aftermathEffect.prose` (for intelligence beat)
- New adapter capability: rendering authored attachment flavor distinct from pool draws
- New trace category: aftermath reaction selection and effect application (see Tracing section)

---

## Deprecation Plan

### Consumer Surface

162 files reference `EncounterTemplate`. These fall into four categories:

| Category | File Count | Migration Strategy |
|---|---|---|
| **Data definitions** (content files) | ~20 files | Rewrite as `UnifiedActionTemplate` exports |
| **Engine modules** (resolution, scoring, filtering) | ~25 files | Redirect to unified pipeline; delete legacy code |
| **UI adapters** (encounter stage, notifications) | ~7 files | Consolidate around unified adapter |
| **Tests** | ~38 files | Rewrite to test unified pipeline |
| **Types and registries** | ~10 files | Mark deprecated, remove when consumers gone |
| **Migration bridge** | 2 files | Delete when migration complete |

### Deprecation Sequence

1. **Mark `EncounterTemplate` as `@deprecated`** with a comment pointing to UnifiedActionTemplate.
2. **Migrate content files in batches** (by guild, by category — see Phase plan below).
3. **After each batch, verify** the bridge still works for un-migrated templates.
4. **When all content is migrated,** remove the bridge (`migrateEncounterTemplate`, `migrateEncounterOutcomeMetadata`, `migrateEncounterStep`).
5. **Remove legacy engine modules** that only existed for the old pipeline.
6. **Remove the EncounterTemplate type** and all related types.
7. **Delete migration audit** (`encounter-migration-audit.ts`).

### Test Migration Strategy

The 38 test files referencing `EncounterTemplate` are not a simple rewrite. Different test categories need different strategies:

| Test Category | Count (approx) | Strategy |
|---|---|---|
| **Bridge parity tests** | ~5 | Added in Phase 0. Assert a mechanically-converted EncounterTemplate produces identical observable state via the unified pipeline. Deleted in Phase 5 along with the bridge. |
| **Legacy behavior tests** | ~20 | Kept alive until the template they exercise is migrated. When a guild batch merges, its tests either (a) become regression tests against the new unified template, or (b) are deleted if the new template's contract tests cover the same ground. No flag-day rewrite. |
| **Contract tests for new capabilities** | ~8 new | Added in Phase 0. Assert trace emission, aftermath effect application, authored-attachment creation, outcome-level bucketing. These are capability tests, not template tests — one per capability. |
| **Engine integration tests** (resolution, orchestrator phases) | ~10 | Migrated incrementally as engine modules are touched. Keep the existing shape; swap EncounterTemplate fixtures for UnifiedActionTemplate fixtures. |

**Rule during transition:** never run with less test coverage than the prior commit. If a test is deleted, its contract must be covered elsewhere. The `testing-patterns` skill documents the contract test shape; sub-agents reference it when rewriting engine tests.

**Coverage gap auditing:** after each phase merges, run `npm test -- --coverage` and diff against the pre-phase baseline. Any guild whose coverage drops more than 2% gets a targeted test-writing pass before the next guild starts.

### UI Adapter Consolidation

Three adapters currently exist:
- `buildSimpleEncounterStageModel` — for legacy EncounterTemplate encounters
- `buildUnifiedEncounterStageModel` — for UnifiedActionTemplate encounters
- `buildGateDutyEncounterStageModel` — specialized for Gate Duty (the only encounter with authored aftermath reactions today)

Post-migration, `buildSimpleEncounterStageModel` is deleted. `buildGateDutyEncounterStageModel` becomes the general pattern (all encounters can have aftermath reactions). The adapter layer simplifies to a single `buildEncounterStageModel` that handles the unified format.

---

## Worked Example: `tg.quest.pocket_run`

This is the calibration reference. Sub-agents authoring migrations should match this shape, density, and voice. It's not the only valid approach — but it demonstrates every capability an ordinary-stakes template should exercise. Exact field names track `src/types/unifiedAction.ts`; minor schema adjustments may surface during Phase 0.

### Before (EncounterTemplate)

```typescript
{
  id: 'tg.quest.pocket_run',
  name: 'Pocket Run',
  locationTypes: ['town', 'city', 'capital'],
  steps: [
    {
      id: 'tg.quest.pocket_run.1',
      name: 'Scout the Crowd',
      narrative: 'The guild assigns a busy market square. You study the flow of coin.',
      reach: 'eye',
      difficulty: TG_DIFFICULTY_BASE,
      duration: 1,
      onSuccess: { narrative: 'You spot several easy marks among the shoppers.' },
      onFailure: { narrative: 'The crowd is thin today. Slim pickings.' },
    },
    {
      id: 'tg.quest.pocket_run.2',
      name: 'Lift the Purses',
      narrative: 'Nimble fingers and a steady nerve. Time to work.',
      reach: 'shadow',
      difficulty: TG_DIFFICULTY_BASE + TG_DIFFICULTY_STEP,
      duration: 2,
      onSuccess: {
        narrative: 'A good haul. The guild takes its cut and nods approval.',
        tierPromotionEligible: true,
        rewardPool: {
          categoryWeights: { possession: 0.60, condition: 0.25, bestowed_power: 0.15 },
          tagFilters: ['#gold'],
        },
      },
      onFailure: {
        narrative: 'A mark grabs your wrist. You twist free but the haul is lost.',
        rewardPool: { categoryWeights: { condition: 0.80, possession: 0.20 } },
      },
    },
  ],
  reachPrimary: 'shadow',
  reachSecondary: 'eye',
  encounterType: 'steal',
  threatRating: 'easy',
  intrinsicTier: 'shaping',
  motivations: ENCOUNTER_TYPE_MOTIVATIONS.steal,
  questPriority: 3.0,
}
```

What the player experiences: two lines of prose, a binary outcome, a random reward draw. The fiction says the mark grabbed their wrist; the engine doesn't remember.

### After (UnifiedActionTemplate)

```typescript
{
  id: 'tg.quest.pocket_run',
  name: 'Pocket Run',
  rarityTier: 2,                  // Uncommon — visible but routine
  intrinsicTier: 'shaping',
  reach: 'shadow',
  crudType: 'read',               // agent interacts with existing wealth
  scale: 'local',
  apCost: 1,
  actorAffinities: ['mortal', 'adventurer'],
  locationSubtypes: ['town', 'city', 'capital'],
  targetCategories: ['actor'],    // crowd is treated as the target population
  steps: [
    {
      reach: 'eye',
      difficulty: 0.28,
      duration: { min: 1, max: 1 },
      narrativeTemplate:
        '{name} settles at the edge of the {location:marketNameOrFallback}, reading the crowd the way a gull reads a surf line — watching for the one purse that sits too heavy in its cloth.',
      onSuccess: [],               // scouting produces no world mutation
      onFailure: [],
      failBehavior: 'continue_weakened',
      successAfterimage: '{they} found the seam in the crowd.',
      failureAfterimage: 'The crowd moved wrong. {they} would have to lift cold.',
    },
    {
      reach: 'shadow',
      difficulty: 0.44,
      duration: { min: 2, max: 2 },
      narrativeTemplate:
        '{name} drifts close. A lean, a brush, fingers working the seam of a purse cord. Three heartbeats. Four. The weight shifts into {their} sleeve.',
      onSuccess: [
        // Encounter-specific authored attachment — not a pool draw
        {
          op: 'add_node',
          nodeType: 'attachment',
          nodeName: "A Purse's Weight",
          properties: {
            category: 'possession',
            description:
              'Coin {name} lifted at the {location:marketNameOrFallback}. Guild takes its cut; the rest warms {their} belt.',
            tags: ['#gold', '#thieves-guild'],
            duration: 0,             // permanent
            effects: [{ kind: 'gold', delta: 12 }],
          },
        },
        { op: 'add_edge', edgeType: 'has_attachment', source: '$actor', target: '$lastCreatedNode' },
      ],
      onFailure: [],
      failBehavior: 'fail_action',   // caught means the opportunity is gone
      successMetadata: {
        tierPromotionEligible: true,
        rewardPool: {                 // pool draw supplements the authored attachment
          categoryWeights: { possession: 0.4, bestowed_power: 0.6 },
          tagFilters: ['#shadow', '#guild-favor'],
        },
      },
      successAfterimage: '{they} walked out with weight {they} did not arrive with.',
      failureAfterimage: 'A hand closed on {their} wrist.',
    },
  ],
  aftermathConfig: {
    branchOnStep: 1,   // variant keyed on step 2 outcome bucket
    fallback: {        // bucket: success_at_cost — got the purse but was noticed
      overview:
        '{name} walked the cut — but the wool trader\'s eyes caught {them} at the last turn. The coin is real. The memory of {their} face is realer.',
      changes: [],
      reactions: [
        {
          id: 'avoid_the_market',
          label: "Tell {them}: don\'t work this market for a moonturn",
          intent: 'caution',
          effects: [
            {
              kind: 'intelligence',
              category: 'territory_risk',
              label: 'The wool trader at {location:marketNameOrFallback} knows {their} face',
              detail: 'Three moons of quiet, then the memory fades.',
              reliability: 0.9,
            },
          ],
        },
        {
          id: 'double_down',
          label: 'Tell {them}: lean into it, work the next one harder',
          intent: 'reckless',
          effects: [
            {
              kind: 'hidden_mark',
              category: 'witnessed',
              severity: 0.3,
              label: 'The wool trader can place {name} in the crowd',
              revealFamilies: ['investigation', 'civic_guard_inquiry'],
            },
          ],
        },
      ],
    },
    variants: {
      clean_success: {     // bucket: success / critical_success
        overview:
          'The crowd never felt the pull. {name} carries more coin than {they} arrived with, and the guild will hear about {their} hands.',
        changes: [],
        reactions: [
          {
            id: 'bank_with_guild',
            label: 'Tell {them}: deposit the cut before the night watch changes',
            intent: 'professional',
            effects: [
              { kind: 'reputation_tally', key: 'thieves_guild_standing', delta: 1 },
            ],
          },
        ],
      },
      caught: {            // bucket: failure / critical_failure
        overview:
          'The wrist never lies. A shopkeeper\'s grip, a twist of cloth, a face burned into memory. {name} got away. What {they} carry out of the {location:marketNameOrFallback} is not coin.',
        changes: [],
        reactions: [
          {
            id: 'lay_low',
            label: 'Tell {them}: lay low — the heat will cool',
            intent: 'caution',
            effects: [
              {
                kind: 'hidden_mark',
                category: 'witnessed',
                severity: 0.5,
                label: 'Caught reaching at {location:marketNameOrFallback}',
                revealFamilies: ['investigation', 'civic_guard_inquiry'],
              },
            ],
          },
          {
            id: 'pay_for_silence',
            label: 'Tell {them}: find the shopkeeper, pay for silence',
            intent: 'social',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tg.quest.hush_money',
                delayTicks: 3,
                seedLabel: 'The wool trader will want to be found',
                priority: 2,
              },
            ],
          },
          {
            id: 'mark_them',
            label: 'Tell {them}: that shopkeeper is now the job',
            intent: 'reckless',
            effects: [
              {
                kind: 'encounter_seed',
                templateId: 'tg.senior.payback_run',
                delayTicks: 10,
                seedLabel: 'A face {name} will not forget',
                priority: 3,
              },
            ],
          },
        ],
      },
    },
  },
}
```

### What Changed and Why

| Change | Narrative payoff |
|---|---|
| **Three aftermath variants** (`clean_success`, `fallback` = success-at-cost, `caught`) instead of binary | Three distinct stories. Clean runs feel different from near-misses, which feel different from getting caught. |
| **Outcome buckets keyed on step 2** | The step where the action actually resolves drives the aftermath. Step 1 (scouting) is table-setting; step 2 is consequence. |
| **Authored attachment** `"A Purse's Weight"` instead of only a reward pool | The player sees a named, fiction-connected reward, not an anonymous `#gold` draw. Pool draw is kept as supplement. |
| **Intelligence grant** on success-at-cost (`territory_risk`) | The near-miss produces usable knowledge — the agent learns the market is hot for three moons. This is knowledge the god-player can reason about. |
| **Hidden mark** on double-down and on caught variants | The world remembers the agent's face even when the agent doesn't think it does. Surfaces later through `investigation` or `civic_guard_inquiry` reveal families. |
| **Encounter seed** on `pay_for_silence` (3-tick delay) and `mark_them` (10-tick delay) | The player's reaction to getting caught plants a specific future encounter. The fiction of today becomes the story of a future tick. |
| **Authored reaction labels** with `{name}`/`{they}` placeholders | "Tell {them}: don't work this market for a moonturn" reads as divine counsel, not a menu option. |
| **`overview` prose** with enrichment placeholders and aesthetic voice | Replaces the one-line "You got caught" with a paragraph that breathes. |
| **`failBehavior: 'fail_action'` on step 2** | The purse-lift is terminal — if you fail, the opportunity ends. Step 1 uses `continue_weakened` because a bad scout doesn't prevent the lift, just makes it harder. |

### What This Example Does *Not* Demonstrate

These capabilities exist and are valid for other templates, but didn't fit this one. An exemplary migration will use them where the fiction calls for it:

- **Explicit `ActionStepBranch`** (variant steps whose prose differs per prior choice) — useful for multi-phase encounters where step 2's fiction depends on step 1's approach. Pocket Run's two steps are both required; there's no branching.
- **`GraphOp` world-state mutation** (creating NPCs, modifying locations) — useful for encounters that change the world beyond the actor. Pocket Run changes only the actor's purse.
- **Authored `choice` cards at step boundaries** — useful for encounters with explicit god-player intervention points. Pocket Run's choices happen at aftermath, not mid-step.
- **Five outcome levels with distinct prose per level** — we authored three buckets (clean/near-miss/caught) which is the sensible granularity here. A high-stakes heist should go to five.

### Authoring Cost

This rewrite took ~2x the word-count of the original (counting prose + authored reaction effects). That ratio is the realistic baseline — plan schedules accordingly.

---

## Phase Plan

### Phase 0: Infrastructure (Engine + UI)

**Prerequisite for all content work.** Phase 0 is both engine-verification and UI-capability-build. The mandatory UI surfaces in the UI Pillar section must land here, before Phase 1, or the Phase 1 pilot will ship invisible richness and give false-negative feedback on the workflow.

**Engine-side verification (the aftermath pipeline is already general — see State of Play):**
- [ ] Mark `EncounterTemplate` type as `@deprecated` with pointer to `UnifiedActionTemplate`
- [ ] Add integration test: a mechanically-converted template (via the bridge) produces identical game-state changes through the unified pipeline as through the legacy pipeline, for a representative template from each category (combat, social, exploration, guild)
- [ ] Add integration test: a migrated template declaring one `encounter_seed`, one `hidden_mark`, and one `intelligence` reaction effect, resolved end-to-end in the unified adapter path, produces the expected state changes when the player selects each reaction
- [ ] Confirm `traitModifiers` → `update_node` GraphOp path works; only 2 templates need it today (per audit) but verify the path is there for future templates
- [ ] Confirm `appliesWound` can be expressed as a GraphOp that adds a wound condition node (verify node type + edge type exist; authoring pattern documented)
- [ ] Audit `encounterTypeToCrud()` mapping — does every encounter type map to the right CRUD verb? Fix any misclassifications
- [ ] Add integration test for clearance gate tag flow end-to-end on a non-Gate-Duty template
- [ ] Verify **trace** emission for categories marked "verify" in the Tracing section: `unified_action_resolved`, `aftermath_variant_selected`, `aftermath_reaction_selected`, `encounter_seed_planted`, `encounter_seed_triggered`, `hidden_mark_placed`, `hidden_mark_revealed`, `intelligence_granted`. Add assertions to existing tests or new ones.
- [ ] Implement **new** trace emissions: `aftermath_effect_applied` (per-effect granularity when a reaction fires) and `authored_attachment_created` (distinguishes GraphOp-created attachments from pool draws)
- [ ] Land named constants listed in the Constants section as exports (likely in `src/data/encounterTunables.ts`); audit `src/components/CMS/tunableConstants.ts` for overlap and merge rather than duplicate

**UI-side capability build (mandatory for migration visibility):**
- [ ] **⚠️ CRITICAL — wire `enrichProse()` into the UnifiedAction encounter adapter.** `buildUnifiedEncounterStageModel.ts:120` currently passes raw `narrative` strings straight to the UI. This means `{name}`, `{faction}`, `{?has_ally}...{/has_ally}`, and every other placeholder renders **literally** in migrated templates today. Legacy/simple encounters call `enrichProse()`; the unified path does not. **Nothing else in this UI capability list matters until this is fixed** — without it, every migrated template ships broken prose. Add `enrichProse()` calls at model-build time for step narrative, outcome narrative, aftermath variant prose, reaction labels, and aftermath reaction preview prose. This was surfaced by a Codex review; credit to the review pass for catching it before migration started.
- [ ] Extend `buildUnifiedEncounterStageModel` to render `AftermathVariant.overview` as narrative prose with enrichment placeholders resolved (schema field already exists). If `overview` proves insufficient for multi-paragraph prose, add a `narrativeProse` field alongside. Generalizes Gate Duty's `buildGateDutyAftermathNarrative`.
- [ ] Add `label` and `previewProse` fields to `EncounterAftermathReaction`; extend unified adapter to render them (generalizes `rewriteGateDutyAftermathReactions`)
- [ ] Add outcome-level label rendering in the encounter result header (differentiates `success` / `critical_success` / `success_at_cost` / `failure` / `critical_failure`)
- [ ] Extend reward rendering to distinguish authored attachments (named, described, from GraphOps) from pool-drawn attachments
- [ ] Add intelligence-grant "you learned" beat to the encounter result pane; reads authored prose from the effect itself
- [ ] Migrate Gate Duty's authored prose + reaction rewrites from the adapter-hardcoded path to the new template-declared fields (proves the generalized path works before removing the specialized adapter in Phase 5)
- [ ] Update `Docs/plans/wiring-checklist.md` with the new template fields, adapter capability, and trace categories

**Engine prerequisites — closing the loops (design list; slicing below):**

An audit of the encounter engine surfaced that several primitives advertised in the wiring guide are *write-only* today — authors can plant them but nothing downstream reads them. Migrating 115 templates while those loops remain open means asking authors to write into a void, which is exactly the flat/non-living pattern the narrative tiebreaker rejects. This subsection lists the full design surface for Phase 0 engine work. Slicing (which cuts ship with the migration vs. which follow) happens below in the slicing subsection — the point here is that the elephant is on the page.

Group A — Loop closers (highest leverage; without these, migrated content plants into a void):

1. **Hidden mark revelation pathway.** Marks are planted with `revealFamilies` but nothing consumes them. Build a reveal pass: encounters matching `revealFamilies` roll against mark severity during scoring; on hit, fire a "revelation" aftermath that converts the mark into discovery prose + state changes. Severity gates probability. Without this, marks are decoration.
2. **Intelligence consumption.** Intelligence records stored on `GameState.intelligenceRecords` aren't read anywhere. Wire them into (a) encounter visibility/scoring (knowing a shrine's location surfaces shrine encounters), (b) prose enrichment (`{intel:shrine_location}` placeholder), and (c) enrichment conditionals (`{?knows_shrine}...{/knows_shrine}`).

Group B — Multi-target (the "story affects more than one participant" range):

3. **`targetAgentId` / `targetFactionId` on aftermath effects.** Every aftermath effect today defaults to `action.actorId`. Add explicit target fields plus symbolic refs (`$actor`, `$ally`, `$rival`, `$witness`, `$faction`) so reputation, marks, intelligence, and content grants can land on any participant.
4. **Condition / attachment CRUD with scope.** New GraphOp verbs: `add_condition`, `remove_condition`, `modify_condition`. Scope field: `self` / `target` / `all_participants` / `faction_members` / `witnesses`. This unlocks "witness gets Haunted-by-what-they-saw", "co-conspirator carries Bound-by-shared-secret", "target is cleansed of a curse".
5. **`reputation_set` effect (alongside `reputation_score` delta).** Coronation sets an agent to +1 with their faction. Oath-breaking resets alignment to zero. Delta-only is a constraint that the fiction keeps running into.

Group C — World-shaping effect kinds (the CRUD-the-world menu):

6. **Faction-level effects.** New effect kinds: `faction_splinter`, `faction_absorb`, `faction_dissolve`, `faction_declare_war`, `faction_force_peace`. Raw edge GraphOps can fake some of these; splinter and absorb need structural ops because they involve member-edge migration.
7. **`spawn_artifact` helper effect.** Atomic "create artifact node + create `possesses` edge + assign tier/tags". Today authors write `add_node` + `add_edge` separately, which nobody does.
8. **Omen emission.** New effects: `emit_omen` (spawns or replaces the region's active omen), `modify_omen_intensity` (shifts existing omen strength). Enables "atrocity stains the region", "founding consecrates it".

Group D — Causation and conditional firing (longer-horizon story coherence):

9. **Encounter-to-encounter causation edges.** New edge types: `seeded_by` (target encounter points back at seed source), `in_response_to` (resolver-queryable). Auto-populated when seeds fire. Enables resolvers to narrate "this is the echo of what you did".
10. **`when` predicate on effects.** Effects fire only if a live-state predicate passes (`faction.controls(location)`, `actor.reputation > 0.5`, `agent.faction === X`). Without this, 20-tick-delayed seeds fire regardless of whether the world drifted out from under them.
11. **Thread-edge mutations as effect kinds.** `set_court_position`, `adjust_attention_weight`, `mark_intervention`. Lets encounter outcomes formally move an agent in / out of the protagonist portfolio.

Group E — Documented-but-dead (decide explicitly):

12. **Wound / scar system.** `appliesWound: true` exists in schema with no catalog, no accumulation, no consequence. Either wire it or strike from the schema so authors stop trying to use it.
13. **Target filtering system.** `targetCategories`, `targetSubtypes`, `requiredNodeProperties`, `requiredTargetTraits` defined, zero encounters use them. Generalized Action Targeting is its own project — confirm this work is out-of-scope here and route it to the appropriate Linear project.

**Slicing the elephant (which cuts ship with Phase 0 of the migration):**

This is where we get conservative. Not every item above needs to land before Phase 1. The slicing criterion is: *does migrated content in Phases 1–4 plausibly want this capability, and does its absence produce write-only authoring?*

Effort sizing uses T-shirt sizes (S = ~1 day, M = 2–4 days, L = 1–2 weeks of focused work) based on the Codex review pass — all estimates assume solo-agent focus and include tests.

- **Must-ship with Phase 0 — Group A (1, 2) — effort: M/L.** Loop closers. Without these, the migration is propagating dead primitives at scale. Intelligence consumption (item 2) is the M side (new enrichment placeholders, scoring signal, conditional); mark revelation (item 1) is the L side (new reveal pass integrated with encounter scoring + revelation aftermath kind + severity gating). These are the reason we said "Option B" when the user picked a direction.
- **Should-ship with Phase 0 if scope allows — Group B (3, 4, 5) — effort: M.** Multi-target aftermath. Three additive items, none structural: symbolic ref resolution (`$ally`, `$witness`, `$faction`), condition CRUD GraphOps with scope enum, and a `reputation_set` effect kind. Social, faction, and witness-heavy encounter batches (Phases 2–3) lean on these; absence forces workarounds.
- **Can-ship incrementally during Phase 2–4 — Group C (6, 7, 8) — effort: M/L.** `spawn_artifact` (item 7) is S — a trivial atomic helper over existing GraphOps. Omen emission (item 8) is M — requires region-omen lookup plus replace semantics. Faction-level effects (item 6) are the L — `faction_splinter` and `faction_absorb` involve member-edge migration and need their own tests. Land per-item when a guild batch demands them, not as a block.
- **Defer past migration unless a batch blocks on them — Group D (9, 10, 11) — effort: M.** Causation edges (item 9) and `when` predicates (item 10) are high-value but not blocking. Thread-edge mutation effects (item 11) are small but depend on the thread system's current API surface. Migration can proceed with temporal-seed fragility as a known limitation; a retrofit pass adds them later without rewriting content.
- **Decide now, implement separately — Group E (12, 13) — effort: L (if wired) or S (if struck).** Either wire the wound system and the generalized-targeting system or strike the dead schema fields. If wired, both are L scope — wounds is a full subsystem (catalog, accumulation, consequences); generalized targeting is its own Linear project. If struck, it's a one-pass field removal plus a schema-validation test. Don't leave schema landmines.

The exit criterion below is updated to reference Group A (and, when scope allows, Group B) explicitly. The rest becomes a Linear project of its own, sequenced so the biggest-leverage items land first but not all gating Phase 1.

**Phase 0 total budget check:** Must-ship (Group A: M/L) plus should-ship-if-possible (Group B: M) plus the tracing work added above (see Tracing section — ~M of engine instrumentation + tests) plus the `enrichProse` wiring fix in the UnifiedAction encounter adapter (S–M) plus the wiring-guide correction pass (S). Realistic Phase 0 bottom is ~2 weeks, stretch top is ~4 weeks depending on whether Group B lands inside it. This is "serial, one agent" work for the core API changes — do not split the engine changes across parallel agents; they are too cross-cutting.

*Caveat — parallelizable verification sidecars:* once the core APIs land (trace categories array updated, `applyEncounterAftermathReaction()` instrumented, `enrichProse` called from the unified adapter), follow-up verification tasks CAN run in parallel on separate branches. Good sidecar candidates: (a) DebugPanel trace-visibility smoke suite covering the new + newly-surfaced categories, (b) template fixture checks that exercise each aftermath effect kind end-to-end, (c) unified adapter prose regression tests that lock in every placeholder and conditional block from the enrichment reference. These are read-mostly test additions — they don't touch the cross-cutting engine surface and merge cleanly against each other.

**Wiring-guide correction pass (landed with Phase 0):**

The current wiring guide (`Docs/plans/2026-04-16-systemic-wiring-guide.md`) is ~70% accurate. The Codex review pass surfaced specific overstatements that authors will hit immediately. Before Phase 0 exits, rewrite the guide to reflect reality:

- **Correct the enrichment-placeholder claim at line 38.** The guide says "Every `narrative` field in steps and outcomes supports dynamic text substitution." This is aspirational, not current: `buildUnifiedEncounterStageModel.ts:120` passes raw `narrative` strings straight to the UI without calling `enrichProse()`. Placeholders render literally in migrated templates today. Either gate the statement with "once Phase 0's adapter fix lands" or fix the adapter first (see ⚠️ CRITICAL item in UI capability build above — the latter is preferred since it unblocks all Phase 1+ authoring).
- **Correct the effect-count framing at line 170 and line 474.** The "40 effect types" figure is about the attachment/spell effect system (`GraphMutationEffect`, `CreateStructureEffect`, `FactionManipulateEffect`, `SpawnEffect`, etc.) — type-level categories, not encounter aftermath effect kinds. The encounter aftermath system has **7 effect kinds** (`reputation_score`, `reputation_tally`, `clearance_gate_tag`, `recent_event`, `encounter_seed`, `hidden_mark`, `intelligence`). Say this clearly, with both numbers, so authors don't chase unreachable capabilities.
- **Flag the capability-vs-wiring distinction explicitly.** A "type-level" capability (a TypeScript effect-kind exists) is not the same as a "wiring-level" capability (the engine has a reader and consumer). The current guide conflates them. Add a column or banner: "author-visible type-level primitives" vs. "wired end-to-end". Hidden marks, intelligence records, and several graph-ops helpers are type-level without end-to-end wiring today (Group A and parts of Group C close this gap).
- **Promote the undocumented primitives that authors actually use to first-class citizens:** `ActionStepBranch` + `BranchAwareAftermathConfig`, `AuthoredChoiceCards`, `EncounterSupportBundle` (with its persistence modes), `RewardPoolRecipe`, `successAfterimage` / `failureAfterimage`, `recent_event.significance`.
- **Document the full CRUD-the-world capability surface** — the expanded Opportunistic table in this migration plan is the source of truth. Mirror it into the wiring guide with "today / Phase 0 / future" readiness markers (🟢 / 🟡 / 🔴) matching this doc's convention.
- **Add a revelation-pathway section for hidden marks and an intelligence-consumption section**, once Group A loops land. Pre-landing, mark these sections "planned — not yet wired" rather than omit them (authors will look for them).
- **Remove or clearly mark as "planned"** the capabilities that don't work end-to-end today: mark revelation pre-Group-A, intelligence consumption pre-Group-A, high-level graph ops author-facing API (raw GraphOps work; strategic helpers like `createSublocation` aren't wired into encounter aftermath), SupportBundle spawn at aftermath-time (setup-time only today).
- **Add a tracing section.** The guide currently doesn't tell authors what traces their content emits. Post-Phase 0 (when the aftermath/seed/mark/intel traces land), add a short "how to verify your content actually fired" section pointing to the new trace categories and the DebugPanel filter.

**Pre-Phase 1 exit criteria:**
- [ ] All engine-side integration tests pass
- [ ] Gate Duty now renders via the unified adapter with identical player-facing presentation to before
- [ ] A hand-crafted sample migrated template (not from the 115 — a throwaway for testing) demonstrates all mandatory UI surfaces firing: outcome label, authored reaction labels, authored aftermath prose, authored attachment, intelligence beat
- [ ] **Group A loop closers shipped:** hidden mark revelation pathway live (a planted mark can trigger a revelation encounter in an encounter matching `revealFamilies`); intelligence consumption live (granted intelligence affects scoring visibility and is accessible via enrichment placeholders or conditionals)
- [ ] **Group B shipped if scope allows, with impediment logged if deferred:** `targetAgentId`/`targetFactionId` on aftermath effects, condition CRUD GraphOps with scope, `reputation_set` effect
- [ ] **Wiring guide correction pass merged:** undocumented primitives promoted, effect-count corrected, CRUD-the-world capability surface mirrored, revelation/intelligence sections added once Group A lands
- [ ] **Wound system decision logged:** either the Group E (12) wiring lands or the `appliesWound` field is struck from the schema; no landmine left behind

### Phase 1: Guild Encounters — Thieves Guild Pilot (Content + Engine)

**Why first:** Smallest risk, highest learning. The thieves guild encounters have the skill test output (`pick-pocket-skill-test.md`) as a reference, the guild voice guide in the `template-encounter-rewrite` skill, and the clearest systemic affinity (hidden marks, intelligence grants). This batch proves the workflow before scaling.

- [ ] Migrate all ~43 thieves guild templates from EncounterTemplate → UnifiedActionTemplate format
- [ ] Rewrite all prose to meet Threadbare aesthetic bar (per `template-encounter-rewrite` skill)
- [ ] Author contextual aftermath for each template (minimum: one aftermath reaction per template)
- [ ] Add encounter-specific attachments/conditions where the fiction calls for it (named rewards, not just pool draws)
- [ ] Author encounter seeds for templates where failure/success implies future consequences
- [ ] Add hidden marks for templates involving secrecy, witnessed acts, deception
- [ ] Run editorial checklist (7 questions) on every template
- [ ] Verify migrated templates work in the unified pipeline (CLI smoke test: `tick 30`, check `encounters`, `agents`)
- [ ] Delete thieves guild entries from legacy `ENCOUNTER_TEMPLATES` array

### Phase 2: Remaining Guild Encounters (Content)

9 guild files, ~42 templates each. Apply the same workflow proven in Phase 1.

- [ ] Arcane Circle (42 templates) — systemic affinity: encounter seeds, hidden marks, `{?has_artifact}` conditionals
- [ ] Civic Guard (44 templates) — systemic affinity: reputation flow, clearance gates, `{?has_faction}` authority dynamics
- [ ] Builders Fellowship (42 templates) — systemic affinity: GraphOps (structural changes), `{?has_artifact}` tool context
- [ ] Merchant Consortium (42 templates) — systemic affinity: intelligence grants, encounter seeds (trade relationships)
- [ ] Holy Order of Dawn (42 templates) — systemic affinity: hidden marks (moral witness), reputation tallies (faith)
- [ ] Lorekeepers Covenant (42 templates) — systemic affinity: intelligence grants, content grants, `{?has_artifact}` scroll/book context
- [ ] Rangers Brotherhood (42 templates) — systemic affinity: encounter seeds (terrain knowledge), intelligence (patrol routes)
- [ ] Underking Court (42 templates) — systemic affinity: hidden marks (underground debts), encounter seeds (favors owed)
- [ ] Temple of Spheres (42 templates) — systemic affinity: sphere-specific aftermath, hidden marks (cosmic witness)

### Phase 3: Social + Tavern + Faction Encounters (Content)

- [ ] Social encounters (47 templates) — relationships are the core mechanic; heavy use of encounter seeds, hidden marks for witnessed promises/betrayals, `{ally:strongest}` and `{rival:strongest}` integration
- [ ] Tavern encounters (30 templates) — intelligence hub; heavy use of intelligence grants, `{location}` context, `{?has_faction}` for who-you-are-changes-what-happens
- [ ] Faction encounters (58 templates) — cross-faction generic interactions; moderate wiring, ensure faction-conditional blocks

### Phase 4: Combat + Exploration Encounters (Content)

- [ ] Monster encounters (17 templates) — `{artifact:weapon}` integration, hidden marks for witnessed combat, encounter seeds for escaped enemies
- [ ] Army encounters (17 templates) — GraphOps for troop state changes, reputation tallies for command performance
- [ ] Mercenary encounters (32 templates) — encounter seeds for contract relationships, hidden marks for witnessed cowardice/heroism
- [ ] Borderland encounters (60 templates) — largest batch; mixed categories; terrain-specific intelligence grants, encounter seeds for wilderness discoveries
- [ ] Anomaly encounters (10 templates) — sphere-specific aftermath, hidden marks for cosmic exposure

### Phase 5: Legacy Cleanup (Engine + UI)

**After all content is migrated:**

- [ ] Remove `migrateEncounterTemplate()`, `migrateEncounterOutcomeMetadata()`, `migrateEncounterStep()` from unified-action-templates.ts
- [ ] Remove `buildCanonicalEncounterTemplates()` and legacy encounter content aggregation
- [ ] Delete `encounter-migration-audit.ts` and its tests
- [ ] Remove `EncounterTemplate`, `EncounterStep`, `EncounterOutcome`, `EncounterProgress` types
- [ ] Remove `buildSimpleEncounterStageModel` adapter
- [ ] Consolidate `buildGateDutyEncounterStageModel` into a general `buildEncounterStageModel`
- [ ] Remove legacy resolution functions that only served EncounterTemplate
- [ ] Clean up all `@deprecated` markers
- [ ] Remove leverage-related types and logic (`leverageOnSuccess`, `leverageOnFailure`, `leverageModifiesDifficulty`, `conditional`)
- [ ] Update all 38 test files to test against unified types only
- [ ] Final `npm test`, `npx tsc --noEmit`, `npx vite build` verification

### Phase 6: Skill + Documentation Updates

- [ ] Update `template-encounter-rewrite` skill to target UnifiedActionTemplate format (not EncounterTemplate)
- [ ] Update systemic wiring guide if any new capabilities discovered during migration
- [ ] Update `encounter-pipeline` skill (in `.agents/`) for the unified format
- [ ] Update Obsidian vault pages for encounter system architecture
- [ ] Update wiring checklist with any new integration surfaces
- [ ] Final changelog + project-status + project-history entries

---

## Constants (NFP #1: Tunability)

All migration-authored templates should parameterize through these named constants rather than embedding magic numbers. Defaults listed; per-template overrides are allowed and encouraged where the fiction warrants it.

### Difficulty ranges by rarity tier (mapped from legacy `threatRating`)

| Constant | Default | Notes |
|---|---|---|
| `DIFFICULTY_TRIVIAL` | 0.15–0.25 | Background noise, low stakes |
| `DIFFICULTY_EASY` | 0.25–0.40 | Routine challenge |
| `DIFFICULTY_MODERATE` | 0.35–0.55 | Standard encounter |
| `DIFFICULTY_HARD` | 0.50–0.70 | Significant challenge |
| `DIFFICULTY_DEADLY` | 0.65–0.85 | Major, high stakes |

Ranges deliberately overlap — a "moderate" social negotiation and a "hard" combat encounter can land on the same absolute number and still feel tier-appropriate because rarityTier carries the framing.

### Step structure defaults

| Constant | Default | Rationale |
|---|---|---|
| `DEFAULT_STEP_DURATION_MIN_TICKS` | 1 | Single-step resolution |
| `DEFAULT_STEP_DURATION_MAX_TICKS` | 2 | Most steps resolve within 1–2 ticks |
| `DEFAULT_EARLY_STEP_FAIL_BEHAVIOR` | `'continue_weakened'` | Early steps don't terminate the encounter |
| `DEFAULT_FINAL_STEP_FAIL_BEHAVIOR` | `'fail_action'` | Final-step failure = encounter over |

These are *defaults*. Per-template overrides are the norm for encounters with specific fictional logic (ambushes hard-fail on step 1; negotiations fail-forward on the final step).

### Outcome ladder thresholds

| Constant | Default | Notes |
|---|---|---|
| `OUTCOME_CRITICAL_FAILURE_THRESHOLD` | −0.30 (below rolled threshold) | Roll 30+ pts below difficulty gate |
| `OUTCOME_FAILURE_THRESHOLD` | 0 to −0.30 | Below gate |
| `OUTCOME_SUCCESS_AT_COST_THRESHOLD` | 0 to +0.10 | Marginal above gate |
| `OUTCOME_SUCCESS_THRESHOLD` | +0.10 to +0.30 | Comfortably above |
| `OUTCOME_CRITICAL_SUCCESS_THRESHOLD` | +0.30 and above | Far above gate |

(Values are illustrative — verify against `src/engine/unifiedActionResolution.ts` during Phase 0 and align this table to the actual bucket boundaries.)

### Aftermath reaction budget

| Constant | Default | Purpose |
|---|---|---|
| `MAX_REACTIONS_PER_VARIANT` | 4 | Cognitive budget for player choice at aftermath |
| `RECOMMENDED_REACTIONS_PER_VARIANT` | 2–3 | Authoring target; fewer is fine for lower-stakes encounters |

### Encounter seed parameters

| Constant | Default | Notes |
|---|---|---|
| `SEED_DELAY_MIN_TICKS` | 3 | Short payback/follow-up |
| `SEED_DELAY_DEFAULT_TICKS` | 10 | Standard middle-distance seeding |
| `SEED_DELAY_MAX_TICKS` | 30 | Long-arc callbacks |
| `SEED_PRIORITY_DEFAULT` | 2 | Competes with other motivation signals |

### Hidden mark defaults

| Constant | Default | Notes |
|---|---|---|
| `HIDDEN_MARK_SEVERITY_LOW` | 0.2–0.3 | Fleeting witness, minor slip |
| `HIDDEN_MARK_SEVERITY_STANDARD` | 0.4–0.5 | Solid witness, remembered face |
| `HIDDEN_MARK_SEVERITY_HIGH` | 0.6–0.8 | Major incident, lasting imprint |
| `HIDDEN_MARK_DEFAULT_REVEAL_FAMILIES` | `['investigation']` | Most marks surface through investigation actions |

### Intelligence reliability

| Constant | Default | Notes |
|---|---|---|
| `INTELLIGENCE_RELIABILITY_CERTAIN` | 0.95 | First-hand observation |
| `INTELLIGENCE_RELIABILITY_LIKELY` | 0.80 | Second-hand, credible source |
| `INTELLIGENCE_RELIABILITY_UNCERTAIN` | 0.50 | Rumor, possibly stale |

### Encoding note

These should land as exported `const` values in `src/data/encounterTunables.ts` (or wherever existing tunables live — check `src/components/CMS/tunableConstants.ts` and merge rather than duplicate). Templates reference them by name:

```typescript
difficulty: DIFFICULTY_EASY_MID,    // not 0.33
delayTicks: SEED_DELAY_DEFAULT_TICKS, // not 10
```

---

## Tracing (NFP #2: Inspectability)

Traces let us answer "why did that happen?" without rerunning the game. This section was rewritten against the actual `TraceCategory` union in `src/types/trace.ts:17-103` — the earlier draft named categories that don't exist. Reality check from the audit:

- **`applyEncounterAftermathReaction()` in `src/engine/encounterAftermath.ts:17` emits ZERO traces.** Every branch of its effect switch (reputation_score, reputation_tally, clearance_gate_tag, recent_event, encounter_seed, hidden_mark, intelligence — 7 kinds) mutates state and appends `TickEvent`s only. The aftermath system is currently a silent applier. This is the single biggest tracing gap in the pipeline.
- **`graph_op_execution` is defined as an interface (`trace.ts:872`) and in the `TraceEntry` discriminated union, but is NOT in the `TRACE_CATEGORIES` array (lines 61-103).** The DebugPanel's category filter reads from that array, so GraphOp traces that do get emitted are invisible in the UI today.
- **`choice_set_player_resolved` / `choice_set_player_dismissed` have the same omission bug** — defined at `trace.ts:937-949`, included in the union, missing from `TRACE_CATEGORIES`. Authored branch resolution will not surface in the DebugPanel filter until this is fixed.
- **Several trace categories the earlier draft cited (`unified_action_resolved`, `aftermath_variant_selected`, `aftermath_reaction_selected`, `encounter_seed_planted`, `hidden_mark_placed`, `intelligence_granted`) do not exist at all.** They were not "verify" items — they were phantom names. Phase 0 replaces them with real categories and adds the missing ones.

### What exists today (migration can rely on immediately)

All categories below are present in `TRACE_CATEGORIES` and are emitted by live engine code.

| Category | Emitted by | What it covers for migration |
|---|---|---|
| `encounter_resolution` | Encounter step resolver | Per-step outcome, difficulty, capability, probability, roll, success, traitChanges, rewardSummary. This is the primary "did the template resolve?" signal. |
| `action_execution` | Unified action pipeline | Per-action outcome, `opsApplied`/`opsFailed`, duration. Fires once per UnifiedAction resolution. |
| `narrative_generation` | Prose pipeline | Generated prose with tier (routine/notable/chronicle), templateId, sphereWords. Confirms enriched prose actually shipped. |
| `context_harvest` | Prose pipeline | Ranked context nodes chosen for enrichment. Useful for "why did the prose say X?" |
| `ripple_consequence` | Ripple system | Follow-on effects applied to connections. Adjacent to — but NOT the same as — aftermath reactions. |
| `reputation_trait` | Reputation system | Tally increments, trait assignments, removals, decay. Covers reputation mechanic effects *if they route through the reputation-trait path* — aftermath `reputation_score`/`reputation_tally` writes today bypass this trace. |
| `interaction_depth` | Revelation system | Cumulative depth delta. Fires from dilemmas, encounters observed, divine actions. |
| `agent_revelation` | Revelation system | Per-facet revelation events. Adjacent to intelligence grants. |
| `encounter_scoring` / `encounter_filter` / `idle_decision` / `encounter_cache` / `encounter_awareness` / `faction_awareness` | Encounter selection pipeline | The full selection chain. Seeded encounters flow through these once planted. |
| `target_action_filter` | Player action filtering | Per-slot filter cascade. Confirms generalized targeting admits the right templates per context. |
| `dilemma_resolution` | Dilemma resolver | 2×2 dilemma outcome with strategies, moves, stakes, sentiment/reputation deltas. |

### What must be added in Phase 0 (silent paths the migration depends on)

| Category | Where to emit | Why migration needs it |
|---|---|---|
| `encounter_aftermath_applied` (new) | `encounterAftermath.ts` — fire once per reaction application with summary of effects | Without this, there is NO way to answer "did this reaction actually run, and what did it change?" The aftermath system is the single highest-value-add of this migration; it must not be invisible. |
| `encounter_aftermath_effect` (new, per-effect) | `encounterAftermath.ts` switch — fire inside each `case` branch | Per-effect trace: which kind fired, what payload, what node got mutated. This is what `aftermath_effect_applied` was trying to be in the earlier draft. |
| `encounter_seed_planted` (new) | `encounterAftermath.ts` `case 'encounter_seed'` | Seed provenance — answers "why is this encounter on the agent's board?" by letting you query back to the source encounter+reaction. |
| `encounter_seed_triggered` (new) | Encounter seed activation site (location TBD in Phase 0 survey) | Closes the loop: a planted seed that never fires is a dead pipeline; a fired seed is a narrative beat you can explain. |
| `hidden_mark_placed` (new) | `encounterAftermath.ts` `case 'hidden_mark'` | Query "why is this agent acting guilty?" by filtering placed marks on the agent. |
| `hidden_mark_revealed` (new) | Hidden-mark reveal site (wherever `revealFamilies` is matched at read time) | Confirms marks actually fire when relevant encounters roll — today we can write marks nothing ever reads. |
| `intelligence_granted` (new) | `encounterAftermath.ts` `case 'intelligence'` | Intelligence is player-visible narrative payload; needs a trace, not just the auto-generated TickEvent. |
| `authored_attachment_created` (new) | Wherever encounter GraphOps produce an attachment node (Phase 0 adds the aftermath-path helper — see Engine prerequisites) | Distinguishes authored encounter-specific attachments from pool-draw attachments — the difference matters for the rarity/importance system. |
| `graph_op_execution` (exists in union, not in `TRACE_CATEGORIES`) | Already emitted; just add to `TRACE_CATEGORIES` array | Makes existing GraphOp traces filterable in the DebugPanel. This is a one-line fix blocking visibility of a system we already have. |
| `choice_set_player_resolved` / `choice_set_player_dismissed` | Same — already in `TraceEntry` union, missing from `TRACE_CATEGORIES` | Same DebugPanel visibility fix. Authored branch choices are a Phase 0 capability; their traces need to be filterable before Phase 1 authoring starts. |

### Interface shapes for the new traces

```typescript
interface EncounterAftermathAppliedTrace {
  readonly category: 'encounter_aftermath_applied';
  readonly tick: number;
  readonly encounterId: string;     // action.templateId
  readonly actionId: string;        // action.actionId — correlates with action_execution
  readonly actorId: string;
  readonly reactionId: string;      // EncounterAftermathReaction.id
  readonly effectKinds: readonly string[];  // summary; full detail in per-effect traces
}

interface EncounterAftermathEffectTrace {
  readonly category: 'encounter_aftermath_effect';
  readonly tick: number;
  readonly encounterId: string;
  readonly actionId: string;
  readonly reactionId: string;
  readonly effectIndex: number;     // position in reaction.effects
  readonly effectKind:
    | 'reputation_score' | 'reputation_tally' | 'clearance_gate_tag'
    | 'recent_event' | 'encounter_seed' | 'hidden_mark' | 'intelligence';
  readonly effectDetail: Readonly<Record<string, unknown>>;  // kind-specific payload
  readonly success: boolean;        // false if actor/node missing, etc.
  readonly failReason?: string;
}

interface EncounterSeedPlantedTrace {
  readonly category: 'encounter_seed_planted';
  readonly tick: number;
  readonly seedId: string;
  readonly targetAgentId: string;
  readonly sourceEncounterId: string;   // source templateId
  readonly sourceReactionId: string;
  readonly templateId?: string;         // specific template if named, else family-only
  readonly encounterFamily?: string;
  readonly delayTicks: number;
  readonly eligibleAfterTick: number;
  readonly seedLabel: string;
  readonly priority: number;
}

interface EncounterSeedTriggeredTrace {
  readonly category: 'encounter_seed_triggered';
  readonly tick: number;
  readonly seedId: string;
  readonly targetAgentId: string;
  readonly ticksBetweenPlantAndTrigger: number;  // tick - seed.plantedTick
  readonly resolvedTemplateId: string;
  readonly outcome: 'scheduled' | 'fired' | 'discarded';
  readonly discardReason?: string;
}

interface HiddenMarkPlacedTrace {
  readonly category: 'hidden_mark_placed';
  readonly tick: number;
  readonly markId: string;
  readonly actorId: string;             // target of the mark
  readonly sourceEncounterId: string;
  readonly sourceTemplateId: string;
  readonly markCategory: string;
  readonly severity: number;
  readonly revealFamilies: readonly string[];
  readonly label: string;
}

interface HiddenMarkRevealedTrace {
  readonly category: 'hidden_mark_revealed';
  readonly tick: number;
  readonly markId: string;
  readonly actorId: string;
  readonly revealedBy: string;          // encounter/action templateId that matched revealFamilies
  readonly ticksSincePlacement: number;
}

interface IntelligenceGrantedTrace {
  readonly category: 'intelligence_granted';
  readonly tick: number;
  readonly recordId: string;
  readonly agentId: string;
  readonly sourceEncounterId: string;
  readonly intelCategory: string;
  readonly label: string;
  readonly reliability: number;
  readonly targetRegion?: string;
  readonly targetEntityId?: string;
}

interface AuthoredAttachmentCreatedTrace {
  readonly category: 'authored_attachment_created';
  readonly tick: number;
  readonly sourceEncounterId: string;
  readonly sourceTemplateId: string;
  readonly ownerActorId: string;
  readonly attachmentNodeId: string;
  readonly attachmentName: string;
  readonly attachmentCategory: string;  // possession / condition / agreement / etc.
  readonly origin: 'aftermath_effect' | 'step_graphop' | 'support_bundle';
}
```

### What this enables

- **"Why did this encounter fire?"** — `encounter_seed_triggered` → `encounter_seed_planted` → `encounter_aftermath_applied` → source encounter+reaction. Closed loop from narrative consequence back to originating player choice.
- **"Why is this agent acting guilty?"** — query `hidden_mark_placed` on the agent; confirm revelation via `hidden_mark_revealed`. If marks are placed but never revealed, the reveal pipeline is dead.
- **"Is the aftermath system doing anything?"** — `encounter_aftermath_applied` count per tick. After Phase 1, if this is zero for a migrated guild, the guild's templates aren't wiring aftermath correctly.
- **"Which reactions are dead options?"** — group `encounter_aftermath_applied` by `reactionId` and correlate with the template's authored reactions. Zero-selection reactions are candidates for rewrite or removal.
- **"Did the DebugPanel just hide this?"** — the three existing-but-unfiltered traces (`graph_op_execution`, `choice_set_player_*`) should not be invisible. Phase 0's one-line `TRACE_CATEGORIES` fix resolves this.

### Phase 0 trace work — concrete deliverables

1. **Add eight categories to `TRACE_CATEGORIES`** in `src/types/trace.ts`: the six new aftermath/seed/mark/intel traces above, plus the two existing-but-missing ones (`graph_op_execution`, `choice_set_player_resolved`, `choice_set_player_dismissed`) — actually that's three existing ones, so nine total category-array additions if you count both choice-set variants separately.
2. **Instrument `applyEncounterAftermathReaction()`** at `encounterAftermath.ts:17` — emit `encounter_aftermath_applied` once at function entry with effect-kind summary, then `encounter_aftermath_effect` inside each case branch. Preserve existing `TickEvent` appends (they're player-facing chronicle; traces are developer-facing).
3. **Wire `encounter_seed_triggered`** at the seed-activation site (located during Phase 0 pipeline survey — likely wherever `PendingEncounterSeed` is consumed by the encounter cache).
4. **Wire `hidden_mark_revealed`** at the mark-read site (the reveal predicate matching `revealFamilies`).
5. **Add tests** asserting each new trace fires on a representative resolution. A migrated template with a `recent_event + hidden_mark + encounter_seed + intelligence` reaction should produce: 1 `encounter_aftermath_applied`, 4 `encounter_aftermath_effect`, 1 `hidden_mark_placed`, 1 `encounter_seed_planted`, 1 `intelligence_granted`. Contract-test this count.
6. **DebugPanel smoke check** — open the DebugPanel filter, confirm all nine new/surfaced categories appear and filter correctly.

Without steps 1–3 the aftermath system remains silent — every Phase 1+ template that relies on aftermath effects will be unverifiable in the trace buffer, which is the premise of Inspectability (NFP #2).

---

## NFP Compliance

| Priority | NFP | Status | Notes |
|---|---|---|---|
| 1 | **Tunability** | PASS | All difficulty values, rarity tiers, duration ranges, and aftermath reaction parameters are named constants in the template definitions. Changing game feel = changing template values. |
| 2 | **Inspectability** | PASS | UnifiedActionTemplate produces richer traces than EncounterTemplate. Per-step GraphOp execution is logged. Aftermath reactions are typed and traceable. Branch paths recorded in choiceHistory. |
| 3 | **Determinism** | PASS | Resolution uses same seeded PRNG (resolutionService.ts). GraphOps are deterministic. No randomness in aftermath reaction selection (player-chosen). |
| 4 | **Fail-soft** | PASS with note | Migration bridge remains functional for un-migrated templates during transition. If a migrated template has malformed aftermath config, the unified pipeline falls back to no-aftermath (logged, not crashed). Needs verification in Phase 0. |
| 5 | **Narrative > mechanical** | PASS | The entire point. Contextual aftermath, encounter-specific attachments, and authored prose are narrative improvements enabled by the mechanical migration. |
| 6 | **Additive > destructive** | PASS with note | Phase 0–4 are purely additive (new templates alongside legacy). Phase 5 is destructive (legacy removal). Destructive work only after all content migrated and verified. |
| 7 | **Performance budget** | PASS | UnifiedActionTemplate resolution is already the active pipeline. Migrated templates don't add load — they replace bridge-converted templates with native ones. Aftermath reaction processing is O(reactions per template), bounded by authored content. |

---

## Fail-Soft Table

| Failure Case | Fallback Behavior |
|---|---|
| Migrated template has empty `aftermathConfig` | No aftermath shown; encounter completes normally with reward pool only |
| `aftermathConfig` references non-existent branch step | Falls back to `fallback` variant (logged as warning) |
| GraphOp references `$actor` or `$target` that doesn't resolve | Op skipped, warning logged in trace buffer |
| Encounter seed references template that doesn't exist | Seed stored but never triggers; logged when seed expires |
| Hidden mark has unrecognized `revealFamilies` | Mark stored but never revealed; logged during reveal attempts |
| Legacy EncounterTemplate still in registry during transition | Bridge converts on-the-fly as today; no player-visible difference |
| Reward pool tag filters match zero attachments | Falls back to unfiltered category draw; logged as content gap |

---

## Scale, Parallelism, and Playtesting Gates

### Parallelism model

Guild content files are **independent** — each file exports its own templates array; there are no cross-file template references. This means Phase 2's nine guild batches can be executed in parallel by multiple coding agents on separate branches without merge conflicts, *provided* Phase 0 and Phase 1 have landed first on `main`.

Recommended working model:
- **Phase 0 serial.** One agent; must land before anything else. Roughly a week of focused work (engine verification, UI adapter extension, trace wiring, constants).
- **Phase 1 serial.** One agent on a pilot branch. This is the workflow proof — if the `template-encounter-rewrite` skill's output isn't meeting the Threadbare bar, we learn that on 43 templates, not 115.
- **Phase 2 parallel.** Up to nine coding agents, one per guild, each on their own branch. Each agent merges their guild when complete. Branches are short-lived (one guild each) to limit divergence from `main`.
- **Phase 3/4 can mix serial and parallel** depending on content dependencies — social encounters touching faction relationships may want to land after guild migrations merge.
- **Orchestrator agent runs throughout.** A reviewing sub-agent runs batch quality reviews after every two guild merges (Phase 2) or every ~10 templates (Phase 1), with authority to pause the migration and request reassessment. See "Pause authority" below for the full charter.

### Why this works

Each guild's content file is self-contained. The unified template format is stable (Phase 0 locks it). The `template-encounter-rewrite` skill standardizes output. Merge conflicts are bounded to the specific guild file being edited — tests are per-guild. The only shared-surface risk is if two guilds both touch a common tunable constant, which the Constants table is explicitly designed to prevent by naming them.

### Why this doesn't work without Phase 0

If Phase 0 UI adapter extensions don't land first, parallel Phase 2 agents will all independently notice that aftermath prose isn't rendering and either (a) accept the regression or (b) each build their own workaround. Phase 0 being a solid foundation is what makes the parallelism safe.

### Playtesting gates between phases

Migration progress is validated by actual play, not just tests passing. Between each phase:

**Gate 1 — after Phase 1 (thieves guild pilot):**
- Run `npm run cli -- --seed 42` and `run 200` to generate ~200 ticks of thieves-guild-heavy play
- Export encounter log TSV via `window.__DEBUG.exportEncounterLogAll()`; human reads 10 random thieves-guild encounter outcomes
- **Pass criteria:** at least 7/10 encounters feel distinct from each other and from their pre-migration shape; aftermath reactions fire and persist; at least 3 encounters exhibit visible systemic consequences (seed triggers, mark reveals, intelligence beats) within the 200-tick window
- **Fail criteria:** if ≥ 3/10 encounters feel indistinguishable from their pre-migration version, pause and diagnose before scaling to Phase 2. Likely causes: prose voice not landing, reaction labels too generic, aftermath prose field not rendering

**Gate 2 — after each Phase 2 guild merges:**
- Lighter check: CLI smoke test + spot-read 3 encounters from the newly merged guild
- Parallel guilds may land at different times; each gets its own check

**Gate 3 — after Phase 2 complete, before Phase 3:**
- Full seeded game playthrough for ~500 ticks on the browser side (not CLI)
- Screenshot-assisted review: does the encounter stage UI feel coherent across all nine guilds? Are any adapter-level bugs surfacing that the per-guild CLI tests missed?
- Record any impediments in `Docs/impediments.md`; retrospective if ≥ 3 impediments accumulate

**Gate 4 — after Phase 4 (all content migrated), before Phase 5 cleanup:**
- Content-complete playthrough
- This is the final check before destructive legacy removal. If content regressions surface, they must be fixed on the unified path, not by reverting to the bridge.

### Horizon estimate

The design deliberately does not commit to calendar dates — that's a project-tracking concern outside this design doc's scope. But as a sizing anchor for scheduling:

- **Per-template authoring cost (sub-agent):** ~30–60 min for a standard template, ~2–3 hrs for a complex branching one
- **Per-template editorial pass (reviewing agent):** ~10–15 min
- **Per-guild total at ~42 templates:** ~30–50 hrs of focused agent work
- **With nine guilds parallel:** the wall-clock bottleneck becomes Phase 1 (serial pilot), then review throughput, not authoring

These are order-of-magnitude figures; Phase 1 produces the real per-template cost signal.

### Pause authority: the orchestrator agent

Pause decisions are **delegated to an orchestrator agent** rather than waiting on the human to notice drift. The orchestrator runs as a reviewing sub-agent between work batches with a standing charter:

**Review cadence:**
- **After every two guild merges in Phase 2** (or every batch of ~10 templates in Phase 1) the orchestrator runs a batch review pass.
- Lightweight enough to run automatically; heavyweight enough to catch systemic drift before it propagates across more guilds.

**What the orchestrator checks:**
- Spot-reads 3–5 random templates from the batch against the Threadbare quality bar and the narrative tiebreaker (framing section at the top of this doc)
- Confirms mandatory UI surfaces from the UI Pillar table are actually firing (aftermath prose rendering, reaction labels visible in chronicle, seed follow-ups appearing)
- Checks trace coverage against the Tracing section — are the batch's templates emitting the expected `encounter.aftermath.*` traces?
- Compares authored richness to the worked example (`tg.quest.pocket_run`) — if templates are landing systematically flatter than the worked example, that's a drift signal

**Pause triggers (orchestrator invokes pause):**
- Playtest feedback or CLI spot-reads indicate the aesthetic bar isn't landing on ≥ 30% of batch templates
- Aftermath systems are firing in traces but feel non-causal to the player (UI-gap signal, not content-gap)
- A critical engine assumption is invalidated mid-batch (bridge break, trace gap, reaction path divergence, new schema need)
- Quality trend is negative across two consecutive batches (even if no single batch fails outright)

**What pause means:**
- Halt new content migration (no new sub-agents dispatched, in-flight branches finish but do not trigger follow-on batches)
- Orchestrator produces a short diagnostic report: what drifted, likely root cause (Phase 0 infra gap vs. `template-encounter-rewrite` skill gap vs. tiebreaker miscalibration), proposed remediation
- Human reviews the diagnostic, decides whether to extend Phase 0 infrastructure, refine the skill, or adjust the quality bar, then resumes

**Why delegate this:** a solo developer using Cowork as their primary interface cannot realistically monitor nine parallel guild branches for quality drift. An orchestrator agent with a standing charter catches drift earlier than end-of-phase gates would, and the pause decision itself is the kind of judgment call this system is good at when given concrete criteria (the Threadbare bar, the worked example, the UI pillar table).

---

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Content volume** — 115+ templates is a lot of authoring work | High | Batch by guild/category. Prove workflow on thieves guild first. Use `template-encounter-rewrite` skill to standardize sub-agent output quality. |
| **Rarity tier misassignment** changes when encounters surface to player | Medium | Threat-to-rarity mapping table above. Review player-facing encounter frequency after Phase 1 pilot. |
| **Leverage-dependent templates lose nuance** when converted to flat steps | Medium | Identify the ~10 templates with meaningful leverage branching and convert to explicit ActionStepBranch. The rest were just difficulty modifiers. |
| **Test coverage gap** during transition | Medium | Phase 0 adds integration tests that verify parity. Legacy tests kept alive until Phase 5. |
| **162-file deprecation surface** is hard to track | Low | Batch deprecation by category. TypeScript compiler catches stale imports when types are removed in Phase 5. |

---

## Relationship to Prose Content Quality Pass

The existing Linear project "Prose Content Quality Pass" (THR-82 through THR-88) specced prose rewrites + systemic wiring for template encounters. This migration project *subsumes* that work: every prose rewrite happens as part of the format migration. The issues in the Prose Content Quality Pass should be updated to reference the migration plan, and the content work should be sequenced according to the phases above rather than the original Tier C / Tier B structure.

Specifically:
- **THR-82** (guild encounters) → absorbed by Phases 1 + 2
- **THR-83** (social encounters) → absorbed by Phase 3
- **THR-84** (tavern encounters) → absorbed by Phase 3
- **THR-85** (combat encounters) → absorbed by Phase 4
- **THR-86** (routine template monotony) → **stays independent**. Addresses `narrative-content.ts`, which is a separate content system that produces narrative event strings (day-in-the-life flavor, background world events). It does not go through the encounter template pipeline — different data shape, different consumer, different UI surface. Fixing encounter monotony via this migration does not fix narrative-content monotony; they're parallel problems requiring parallel passes.
- **THR-87** (cool failure patterns) → absorbed into all phases as a quality requirement in the editorial pass (see section 7).
- **THR-88** (backstory strata) → **stays independent**. Addresses the backstory content system (per `prose-vignettes-and-enrichment` skill), which generates agent backstory prose at world-gen time. Encounter aftermath is about what happens *during* play; backstory is about what happened *before*. They feed different enrichment placeholders (`{artifact}` / `{ally}` / `{rival}`) and live in different content tables.

THR-86 and THR-88 remain as independent issues on the Prose Content Quality Pass project. THR-82–85 and THR-87 are absorbed into the migration phases.
