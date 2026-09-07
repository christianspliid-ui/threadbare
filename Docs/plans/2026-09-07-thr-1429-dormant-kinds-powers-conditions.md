> **title:** `The dormant kinds I — powers and conditions — THR-1429`
> **linear_issue:** THR-1429
> **author:** `Claude Code`
> **created:** 2026-09-07
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The dormant kinds I — powers and conditions — THR-1429

*Three wanted cells wake two dormant seams: a scholar learns a spell, a zealot blesses and a witch curses, a rival's power is sealed — and every one of them lands in a system that already reads it.*

## Why this is load-bearing

The grid (`Docs/canon/undertaking-grid.generated.md`) carries twenty *wanted* cells — decided yes, the operation named, not built. The map [THR-1396](https://linear.app/threadbare/issue/THR-1396) ordered them into bands on 2026-09-07 by how many subsystems each opens for the first time, after Christian's ruling that undertakings must *"spread out … to interface with all the different systems, and not overcrowd certain parts of the game where we already have a lot of complexity"* ([THR-1399](https://linear.app/threadbare/issue/THR-1399)). The readers band shipped the same day ([THR-1428](https://linear.app/threadbare/issue/THR-1428), PR #1839). This is the first half of the next band, **the dormant kinds**: the three cells that touch Powers and Conditions.

What is dormant today, exactly. The Power kind has *no node shape of its own* — the world-object registry says so in its own note (`src/data/world-objects.ts:303`: *"a cast spell mints a condition trait and `knows_spell` has no writer. A later ticket gives it a shape"*). `use × Power` is live but can only cast a *bestowal* (a god-given trait, subcategory `bestowed`), so no mortal has ever cast anything a mortal learned. The Condition kind is live only as a thing to *cure*: nothing a mortal does puts a condition on anyone, so the blessing and curse conditions the catalog already carries (`reward_condition_dawn_kissed` … `reward_condition_mark_of_debt`, `src/data/reward-attachment-catalog.ts:2850-3060`) are reached only by encounter rewards. This plan is the later ticket the registry note promised, and it is the first cell in the game *whose object is made against a person* — THR-1397's words.

Every decision it needs is recorded: the three cells and the curse fork on [THR-1397](https://linear.app/threadbare/issue/THR-1397) (*"cursing = one signed create × condition"*), caster identity and the tradition shelves on [THR-1230](https://linear.app/threadbare/issue/THR-1230), *known versus wielded* on [THR-1231](https://linear.app/threadbare/issue/THR-1231), the Power family words on [THR-1238](https://linear.app/threadbare/issue/THR-1238). The plan cites each where it is used. What it adds is the *how*: the shape, the seams, and one rule the map wrote on 2026-09-07 — a cell ships with its reader.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Strategic Projects & Control | 🟢 ACTIVE | **extends** — three semantics registered on the object registry (`src/data/undertaking-objects.ts`: `POWER.create`, `POWER.destroy`, `CONDITION.create`); resolver unchanged |
| Attachments, Items & Possessions | 🟢 ACTIVE (Power kind 🟠 dormant within it) | **activates the Power kind** — gives it the node shape the registry deferred (a trait node, class `spell` beside `bestowed`), the first writer of `knows_spell`, and the slot cap the attachment system already holds (`SLOT_CAPS.spell = 3`, `src/data/attachment-slot-constants.ts:21`) |
| Effects & Conditions | 🟢 ACTIVE | **extends** — the condition mint (`instantiateReward`, `src/engine/rewardPool.ts:545`, the `trait` branch with `ticksRemaining`) gets its first mortal caller; the suppression pass (`applySuppressions`, `src/engine/effects/effectSuppression.ts:131`) gets its first mortal-made `suppress` source; `conditionDecay`, `effectPredicates`, `graphConditions` read what lands, unchanged |
| Ambitions & Undertakings | 🟢 ACTIVE | **extends** — the motive gate (`evaluateMotiveGate`, `src/engine/undertakingMotive.ts:149`) is applied to a *create* cell for the first time (the curse), and the grievance minting rules (`src/data/ambition-minting-rules.ts`) gain the harm a curse registers, so the cursed can come to hate |
| Personality & Emergent Traits | 🟢 ACTIVE | **preserves** — `TraitCategory` gains one member (`'spell'`, `src/types/traits.ts:12`); nothing that reads categories today matches it, and the mastery / personality funnels are untouched |
| Encounters & Dilemmas | 🟢 ACTIVE | **preserves** — reads conditions and powers through the effect walkers as before; no template authored |
| Spheres & Quintessence | 🟠 DORMANT | **preserves** — the spell's price path shipped in THR-1428; a learned spell pays through it |

Grep evidence (measured, corrected after the intent judge's first pass): `knows_spell` is written by no engine module — its only non-test hits are `src/data/world-objects.ts`, `src/types/edgeSchema.ts` and `src/types/graph.ts` (schema and registry, no writer); `TraitCategory` has no `spell` member (`src/types/traits.ts:12`); `instantiateReward` is called from no undertaking cell (`grep -n instantiateReward src/data/undertaking-objects.ts` → 0); the `suppress` effect (`src/types/effects.ts:392`) **is** carried by four catalog entries, two of them `target: 'spell'` — The Hush Stone (`reward-attachment-catalog.ts:2051`) and **Null-Touched** (`reward_condition_null_touched`, `:3409-3428`: a `condition`-subcategory trait, tier 2, `{ type: 'suppress', target: 'spell', scope: self, ticks: 8 }`) — so the seal has an existing condition to mint and this plan authors none. Population consumed: the five spell templates in `src/data/spell-templates.ts`, each already carrying `sphereAffinity` (the tradition shelf the Powers generator will widen); the fourteen blessing and curse conditions in the catalog plus Null-Touched; the casters — mortals with the spell-weaver mastery trait, a caster `npcRole`, or Veil at or above the floor (THR-1229's composed predicate; the census counts them).

## Engine pillar

### Systems design

**S1 — The Power kind gets its shape (the registry's deferred ticket).** A power is a **trait node** whose subcategory names its class, exactly the shape `use × Power` already reads: `bestowed` (a bestowal — unchanged), and now **`spell`** (a learned power). `TraitCategory` gains `'spell'`; the registry row's `classes.spell` becomes `['spell']` (it is `[]` today); the discriminator on `POWER.shape` widens to `['bestowed', 'spell']`. **The shape follows THR-1395's rule for traits — shared definitions, per-bearer state on the `has_trait` edge** (`src/data/world-objects.ts:310`; `src/engine/traitShape.ts:52` marks the per-bearer node id deprecated): there is **one definition node per spell**, minted once at `gameInit` from `SPELL_TEMPLATES` beside the trait definitions the seeding pass already mints, `{ type: 'trait', subcategory: 'spell', spellTemplateId, sphereAffinity, effects? }`. A mortal who **wields** the spell holds a `has_trait` edge to that definition node (the bestowal's edge shape, `rewardPool.ts:93-104`, with per-bearer state — `acquiredTick`, `source: 'learn_spell'` — on the edge); a mortal who **knows** it holds a `knows_spell` edge to the *same* node — the biography THR-1231 ruled unlimited, so a spell once learned stays on the sheet when it is not carried. The edge schema's `knows_spell` row (`src/types/edgeSchema.ts:558-567`) is retargeted from `action_template` to `trait` with its comment rewritten: it named `action_template` only because *"spells are not graph nodes at all today"*, and after this plan they are; the edge has no writer and no instances, so nothing migrates. No `action_template` node is minted for a spell. The slot cap for wielded spells is the one the attachment system already holds (`SLOT_CAPS.spell`, 3), enforced by the existing `phaseSlotCaps` pass; this plan adds no cap logic. The Powers generator, when it lands, mints its spells as definition nodes through the same seam.

**S2 — `create × Power` = `learn_spell`.** The scholar's tier-one work (THR-1397). Site: the actor's current Location (a scholarly Place there — a research circle, an archive — is a *fit* signal to the calling row, not a mechanical requirement; nothing in this plan reads Places). Gate: the actor must be a **caster** — THR-1230 ruling 4, composed as THR-1229 recommended: holds the spell-weaver mastery trait, or holds a caster `npcRole`, or has Veil capability at or above `LEARN_SPELL_CASTER_VEIL_FLOOR`; otherwise refused `not_a_caster` (traced, never faked). Which spell: from the actor's **tradition shelf** — the spell definitions whose `sphereAffinity` (the field every template already carries, `spell-templates.ts:19,46,76,106,132`) matches one of the actor's aligned spheres, sorted by id, first one the actor does not already `knows_spell`; none → refused `no_spell_to_learn`. Writes, in order: the `knows_spell` edge to the definition node (always); then, if the actor has a free spell slot under `SLOT_CAPS.spell`, a permanent `has_trait` edge to the same node (the bestowal edge's shape) — wielded. No free slot → known but not wielded, traced `spell_known_not_wielded`; a later *prepare* verb is not this plan's. Reader, same commit: `use × Power` enumerates wielded powers of either class and casts through `activateSpell` as it does today — *"one way of being able to cast"*, THR-1397 verbatim — and the sheet shows both known and wielded (UI pillar).

**S3 — `create × Condition` = `inflict_condition`, one signed cell.** THR-1397: *"Against another it is a curse: motive-gated, Veil-leaning, a signed condition with a duration on the bearer's edge … For oneself or an ally it is a blessing, the same cell un-gated."* The **sign** is read from the actor's relation to the target at proposal time:

| Target | Sign | Gate | Pool |
|---|---|---|---|
| the actor | blessing | none | catalog conditions tagged `#blessing` |
| an ally — same faction (`member_of`), same company (`getGroupOf`), or `reputation_with` ≥ `CONDITION_ALLY_STANDING_MIN` | blessing | none | `#blessing` |
| another the actor holds a motive against (`holdsMotive` over `MOTIVE_GATE_KINDS`: rivalry, grudge, contested ambition, faction war) | curse | the motive gate, as `evaluateMotiveGate` already applies it to seize / lower / destroy | `#curse` |
| a stranger | — | refused `no_sign` | — |

You do not bless strangers and you do not curse the innocent; the sign is the gate. Which condition: within the pool, prefer a template whose tags name one of the actor's two leading Reaches (`#star`, `#veil`, `#heart` …), sorted by id, first; the tier is capped by outcome band (`CONDITION_TIER_CAP_BY_BAND`: plain success reaches tier 1, critical success tier 2; the tier-3 Anointing stays an encounter reward). Op: `instantiateReward(graph, templateId, targetId, tick)` — the catalog's own mint, the `trait` branch (`rewardPool.ts:650-675`), which writes the `has_trait` edge with `ticksRemaining` from the template or `REWARD_CONDITION_DEFAULT_TICKS`; the curse's duration is then scaled by band (`CURSE_DURATION_TICKS_BY_BAND`) on the edge. The site for the moment card is the target's Location. A curse registers harm: a new harm class **`afflicted`** (`UndertakingHarmClass`), with a minting rule beside the others so the cursed mortal may mint a vengeance ambition against a *seen* culprit (THR-1383's seen-harm rule holds: the outcome node records the culprit; whether the target *saw* it is the grievance lane's call, unchanged). A blessing registers no harm. Readers, same commit: `conditionDecay` (the duration), `effectPredicates` / `graphConditions` (eligibility), the encounter walkers (test-shaping), the grievance funnel (the new harm class), and `destroy × Condition` (the cure, live) — the counter-play THR-1397 required in the same commit.

**S4 — `destroy × Power` = `seal_power`.** THR-1397: *"a curse-class condition that suppresses the power, motive-gated — create × Condition's op with a suppression sign."* Object: another mortal's *wielded* power (a trait node the target `has_trait`); `destroy` is already motive-gated by verb (`MOTIVE_GATED_VERBS`). Op: the same condition mint, minting the catalog's existing **Null-Touched** (`reward_condition_null_touched`, `reward-attachment-catalog.ts:3409-3428`: tier 2, `{ type: 'suppress', target: 'spell', scope: self, ticks: 8 }`) — decided on the record: it already carries exactly the mechanism the seal needs, and authoring a second spell-suppressing condition would be a duplicate mechanism in the catalog. Two edits to the entry, not a new one: it gains the `#curse` tag so the sign logic and the sheet read it as a curse, and its `suppress.ticks` is aligned to the condition's own duration (`SEAL_POWER_SUPPRESS_TICKS`, scaled by band on the edge's `ticksRemaining`), so the seal and the condition expire together. The power is *not* removed — it stays known and wielded, and `applySuppressions` (`effectSuppression.ts:131`, runs every tick before the per-agent effect tick) writes the `suppressed` flag on the bearer's spell attachments for the duration and lifts it when the ticks run out. Reader, same commit: the suppression pass, and `use × Power`, which must refuse `power_suppressed` while the flag is set (one read of the effect runtime state; today it does not look). Curing Null-Touched (`destroy × Condition`) lifts the seal early — the counter-play, free.

**S5 — The same-commit reader rule, applied.** Each of the three cells names its production reader above; `scripts/undertaking-grid-dispositions.ts` carries it in the `reader` field THR-1428 introduced, and the generator prints it.

### Graph nodes / edges

No new node type, no new edge type. New **subtype**: `TraitCategory` `'spell'` (registry row + UL term *Spell*, already seated by THR-1238 + canon row in `Docs/canon/world-objects.md` — the one-PR rule for a kind's class).

- Spell definition node (new class, one per spell, minted at `gameInit`): `{ type: 'trait', properties: { subcategory: 'spell', spellTemplateId, sphereAffinity, effects?, name } }` — THR-1395's shared-definition shape.
- `has_trait` actor → definition node — wielded (permanent; the bestowal edge's shape; per-bearer state on the edge).
- `knows_spell` actor → the same definition node — known; properties `{ learnedTick, sphereAffinity, source: 'learn_spell' }`. Edge schema target retargeted `action_template` → `trait` (no instances exist).
- `has_trait` actor → condition node with `ticksRemaining` — the catalog mint's own shape; the curse adds `inflictedBy` and `sign: 'blessing' | 'curse' | 'seal'` to the edge properties (additive).
- `undertaking_outcome` event node with `harmClass: 'afflicted'` for a curse or a seal (the existing outcome node, one new class value).

### Tick phases

| Cell | Phase | Notes |
|---|---|---|
| `learn_spell`, `inflict_condition`, `seal_power` | `strategic_projects` (2a.55) — cell completion inside the resolver | synchronous graph writes; nothing scheduled |
| spell definition nodes | `gameInit` (beside the trait definition seeding) | once per world |
| suppression | `effect_shells` cluster (`applySuppressions` runs before the per-agent effect tick, unchanged) | reads the Sealed condition's `suppress` effect like any other |
| condition expiry | `conditionDecay` (2a.52) | unchanged |
| grievance minting from `afflicted` | `ambitionTick` (the grievance funnel) | one new rule row, same funnel |

No new phase. `Docs/plans/wiring-checklist.md` needs no phase row; it gains the three cells under the undertakings entry.

### Resolution logic

- **Caster predicate** (S2): `hasTrait(spell_weaver mastery) || npcRoles ∩ CASTER_NPC_ROLES || domainCapability.veil ≥ LEARN_SPELL_CASTER_VEIL_FLOOR`, evaluated at proposal (the `object` target rule's site enumeration) so a non-caster never sees the cell on the board — the `no_eligible_apprentice` doctrine.
- **Tradition shelf** (S2): spell definitions whose `sphereAffinity` ∈ the actor's aligned spheres (the existing `sphereAffinities` read); none aligned → the unaligned spells are *not* offered (a shelf, not a shop).
- **Sign** (S3): self → blessing; ally test in the order listed (faction, company, standing); else motive test over `MOTIVE_GATE_KINDS`; else refused. Evaluated at proposal so the cell is offered only where it can resolve.
- **Template choice** (S3, S4): filter by pool tag → prefer Reach-tag match → sort by id → first. No draw.
- **Band effects**: `CONDITION_TIER_CAP_BY_BAND` caps the template tier; `CURSE_DURATION_TICKS_BY_BAND` scales the curse's `ticksRemaining`; the blessing keeps the template's duration (a gift is what it is).
- **Seal duration**: `SEAL_POWER_SUPPRESS_TICKS`, scaled by the same band table.

### PRNG callouts

None. Every choice is a filter, a sort and a first. The cast itself (`activateSpell`) keeps its existing seeded draw (`mulberry32(tick × 104729 + actorId.length)`, `undertaking-objects.ts`).

## Content pillar

### Encounter templates

Content: N/A for new templates — no encounter is authored. The conditions a mortal now inflicts are the ones encounters already hand out, so every encounter that reads a blessing or a curse (`effectPredicates`, the test shapers) reads these the same way.

### Prose tables

- `src/data/undertaking-verb-prose.ts` — no new token; three **cell overrides** (`CELL_OVERRIDE_MAX_PER_CELL` = 3 each) carry the register: *learning* (*"{Actor} has {object} now, and the world is a little different for a mind that holds it"*), *blessing* (*"{Owner} walks under {object}; {actor} saw to it"*), *cursing* (*"{Object} is on {owner}. Nobody saw {actor} do it — yet."*), *sealing* (*"{Owner}'s art is bound. {Actor} tied the knot."*). GM narration, never in situ; magnitudes as words.
- `src/data/economic-chronicle-content.ts` — untouched. Conditions already reach the chronicle through the outcome node.

### Attachment content

- `src/data/reward-attachment-catalog.ts` — **no new entry.** Everything this plan inflicts is already in the catalog: six blessings (`dawn_kissed`, `healers_touch`, `fortune_marked`, `saints_ward`, `earthblood_vigor`, `the_anointing`), five curses (`ill_luck`, `nightmares`, `tonguebound`, `mark_of_debt`, `watch_scrutiny`), and the seal, Null-Touched (`reward_condition_null_touched`), which gains the `#curse` tag and has its `suppress.ticks` aligned to `SEAL_POWER_SUPPRESS_TICKS`.
- `src/data/spell-templates.ts` — untouched; every template already carries `sphereAffinity`. No new spell (the generator's job, Powers map).
- `src/data/condition-trait-content.ts` — untouched unless Null-Touched lacks a player-facing line (the executor checks).

### Data tables

- `src/data/strategic-action-constants.ts` — the constants below.
- `src/data/world-objects.ts` — Power row: `classes.spell: ['spell']`; `status: 'live'` once the writer exists; the registry note rewritten.
- `src/types/traits.ts` — `TraitCategory` + `'spell'`; `src/types/strategicAction.ts` — `UndertakingHarmClass` + `'afflicted'`.
- `src/data/ambition-minting-rules.ts` — the `afflicted` row (vengeance category, culprit required, the same personality funnel).
- `scripts/undertaking-grid-dispositions.ts` — the three cells move from `wanted` to live with their `reader`; regenerate the grid.
- `Docs/canon/world-objects.md` — Power's classes row; `Docs/canon/undertakings.md` — the three cells; `Docs/ubiquitous-language/Traits.md` — *Spell* entry gains the shape line (the term exists).

## UI pillar

*Screenshot tool: Playwright (DOM — the agent sheet). No WebGL surface changes.*

### Player-facing display

- **Powers on the sheet.** `AgentDetailPanel`'s attachments strand already lists bestowals (`has_trait` to a `bestowed` node); it now lists **spells** in the same strand with the class word (*Spell · Bestowal*), a **Sealed** badge when the attachment's runtime state is `suppressed`, and a **Knows** row for `knows_spell` edges not currently wielded (name, tradition word). Law 1 (image, tooltip, link), Law 4 (words: *wielded* / *known* / *sealed*, never a slot count as a numeral — the cap reads as *"carries as many as a mind can hold"* in the tooltip), Law 56 (every badge reads the node or edge, never a cache).
- **Conditions on the sheet.** Already rendered as chips (`AttachmentsTab`); the chip's tooltip gains the sign word and, for a curse whose culprit is *known to the bearer* (the grievance lane's own seen-test), the culprit's name with a link. Unknown culprit → *"someone's doing"*.
- **The target's sheet is the receipt.** A cursed mortal shows the curse the tick it lands; a blessed ally shows the blessing. Nothing else announces it.

### Event notifications

- The actor's completion moment (existing `undertaking_checkpoint` → moment card) carries the cell-override line. Followed actor → interrupt-or-badge per `resolveMomentPresentation` (unchanged rule).
- A followed *target* of a curse or a seal gets a **badge** on their sheet row, not an interrupt: the affliction is state (Law 56), and the attention pool cannot watch everything. This is the one presentation addition: `enqueueUndertakingMoments` gains a record for the *target* with `momentClass: 'afflicted'`, presentation always `badge`.
- Chronicle: the outcome node's line, as every harm-carrying completion already writes.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getPowers(actorId)` → `{ known: [...], wielded: [...], suppressed: [...] }`, JSDoc in `src/debug-bridge.d.ts`.
- CLI `agent <name>` prints known / wielded spells and active conditions with their sign and remaining ticks (words in the sheet, numbers in the CLI — the CLI is the inspector).
- Traces `power_learned` and `condition_inflicted` filterable in the trace viewer.

### Visual presence (HexMapV2)

N/A — no signifier; a condition or a power has no map presence, and none is designed here (THR-1230 ruling 2's map-arena spells are the Powers map's, not this plan's).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/undertaking-objects.ts` (`POWER.create` / `.destroy`, `CONDITION.create`) | `strategic_projects` | moment card (`resolveMomentPresentation`) | graph only | `power_learned`, `condition_inflicted` | `__DEBUG.getPowers`, CLI `agent` |
| `src/engine/gameInit.ts` (spell-template nodes) | `gameInit` | — | graph | — | CLI `graph` counts |
| `src/engine/rewardPool.ts` (`instantiateReward`, unchanged; edge gains `sign`, `inflictedBy`) | `strategic_projects` | `AttachmentsTab` chips | graph | existing reward traces | existing |
| `src/engine/effects/effectSuppression.ts` (unchanged reader) + `use × Power` refusal `power_suppressed` | `effect_shells`, `strategic_projects` | Sealed badge | `effectStates` | existing suppression traces | `__DEBUG.getPowers().suppressed` |
| `src/engine/undertakingMotive.ts` (curse gate through the existing `evaluateMotiveGate`) | `strategic_projects` (proposal) | — | — | existing motive-gate trace | candidate board trace |
| `src/data/ambition-minting-rules.ts` (`afflicted` row) | `ambitionTick` | — | ambitions | existing grievance traces | `ambition` CLI |
| `src/engine/undertakingMoments.ts` (target badge record) | `strategic_projects` | sheet badge | `pendingUndertakingMoments` | `moment_surface` | existing |
| `src/types/trace.ts` | — | — | — | two categories registered at every site `undertaking_tier_defaulted` is (four) | trace viewer |

Prose pipeline: cell overrides resolve through the existing verb-prose resolver; no `enrichProse()` change. Player controls: **N/A by design** — autonomous world behaviour; the god's nudge over a caster's deliberate spells (THR-1230 ruling 5) is the encounter side's and untouched.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `LEARN_SPELL_CASTER_VEIL_FLOOR` | `0.35` | the Veil capability at which a mortal without a caster trait or role may still study |
| `CASTER_NPC_ROLES` | `['mage', 'hedge_witch', 'priest', 'oracle']` (matched against the seeded roles; executor confirms the ids) | roles that make a mortal a caster |
| `SLOT_CAPS.spell` | `3` (exists) | wielded spells per mortal |
| `CONDITION_ALLY_STANDING_MIN` | `0.6` | `reputation_with` score at which another mortal counts as an ally for a blessing |
| `CONDITION_TIER_CAP_BY_BAND` | `{ critical_success: 2, success: 1, success_at_cost: 1 }` | highest condition tier a band may inflict |
| `CURSE_DURATION_TICKS_BY_BAND` | `{ critical_success: 36, success: 24, success_at_cost: 12 }` | a curse's `ticksRemaining` by band (three, two, one day) |
| `SEAL_POWER_SUPPRESS_TICKS` | `24` | how long a Sealed power stays bound (scaled by the curse table) |
| `REWARD_CONDITION_DEFAULT_TICKS` | `15` (exists) | a blessing's duration when the template names none |
| `HARM_ON_AFFLICT` | `'afflicted'` | the harm class a curse or a seal registers |
| `AFFLICTED_MINTING_RULE` | vengeance category, culprit required, same weight as `property_destroyed` | the grievance row for `afflicted` |

## Tracing

```ts
// PowerLearnedTrace — emitted when learn_spell completes (S2)
interface PowerLearnedTrace extends TraceBase {
  category: 'power_learned';
  actorId: string;
  spellTemplateId: string;
  tradition: string;
  wielded: boolean;                 // false when the slot cap left it known-only
  refused?: 'not_a_caster' | 'no_spell_to_learn' | 'already_known';
}
// ConditionInflictedTrace — emitted when inflict_condition or seal_power completes (S3, S4)
interface ConditionInflictedTrace extends TraceBase {
  category: 'condition_inflicted';
  actorId: string;
  targetId: string;
  templateId: string;
  sign: 'blessing' | 'curse' | 'seal';
  motive?: string;                  // the motive that opened the gate, for a curse or a seal
  ticksRemaining: number;
  refused?: 'no_sign' | 'no_template' | 'target_gone' | 'power_not_wielded';
}
```

Volume: cell completions only — a handful per tick at most. The candidate board's existing `undertaking_cell_unreachable` and motive-gate traces cover the proposal-time refusals.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Actor is not a caster | cell not offered at proposal; if reached, refused `not_a_caster`, traced |
| No spell on the actor's shelf | refused `no_spell_to_learn` |
| Spell already known | refused `already_known` (no duplicate edge) |
| No free spell slot | known-only; `wielded: false` on the trace; no node minted |
| Spell definition node missing (a world seeded before this ship) | refused `no_definition`, traced; nothing minted per bearer (THR-1395: no per-bearer node) |
| Target neither self, ally nor motive-holder | refused `no_sign` at proposal |
| Pool has no template matching the Reach preference | fall back to the pool sorted by id |
| Pool empty (catalog edited) | refused `no_template` |
| Target gone by completion | refused `target_gone` |
| Target's power no longer wielded (seal) | refused `power_not_wielded` |
| `instantiateReward` returns null | refused, traced; nothing half-written (the mint is atomic per call) |
| Effect runtime state missing for the sealed attachment | `applySuppressions` skips it (existing behaviour); `use × Power` treats absent state as not suppressed |
| `ticksRemaining` absent on a blessing edge | `REWARD_CONDITION_DEFAULT_TICKS` (existing default) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/traits.ts` | high (a `src/types/` sibling) | one union member added to `TraitCategory`; measured today, `Record<TraitCategory` has 0 hits and `case 'bestowed'` exactly one (`src/engine/conditionOverflow.ts:76`) — so the arms to add are few; the greps are the executor's check, and the registry contract test pins the union against the classes table and fails by name |
| `src/types/strategicAction.ts` | high | one union member on `UndertakingHarmClass`; `HARM_CLASS_LABELS` and `UNDERTAKING_MINTING_RULES` are total over it and fail to typecheck until the row exists — that is the guard |
| `src/types/trace.ts` | high | two additive categories |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `world-object-registry` | 🟢 LIVE | **extend** — Power row gains class `spell`; the contract test's union pin is the guard |
| `attachment-grants-trait-while-held` | 🟢 LIVE | **preserve** |
| `effect-vocabulary-consolidated-spellings` | 🟢 LIVE | **preserve** — `applySuppressions` gains a mortal-made source; the mechanism is unchanged |
| `destroy-candidates-gated-on-motive` | 🟢 LIVE | **extend** — the gate now also opens (or refuses) a *create* cell, the curse; row note updated |
| `world-events-mint-ambitions` | 🟢 LIVE | **extend** — `afflicted` harm mints a vengeance drive through the same rules table |
| `undertaking-object-types` | 🔵 UNVERIFIED-OK | **extend** — three semantics; `POWER.shape` discriminator widened |
| `undertaking-checkpoint-events` | 🟢 LIVE | **extend** — a target-side `afflicted` badge record |
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — `knows_spell`, `has_trait` (spell), condition edges with consumers named above |
| `mortal-learns-a-spell` | — | **add** — producer `learn_spell`, consumers `use × Power`, the sheet, the slot-cap pass. Register in `scripts/interface-contracts.ts` |
| `mortal-inflicts-a-condition` | — | **add** — producer `inflict_condition` / `seal_power`, consumers `conditionDecay`, `effectPredicates`, `applySuppressions`, the grievance funnel. Register in the same change |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (no new catalog entry — two edits to Null-Touched; cell overrides, data rows; templates N/A with rationale)
- [x] UI pillar present (sheet strand, chips, target badge; HexMap N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. Against `Vision/02-non-negotiables.md`: the god is not the protagonist (a mortal curses a mortal, the god only watches; the nudge over casts is out of scope and untouched); mechanics surface through prose, never numbers (known / wielded / sealed as words); everything is a graph node or edge (no new type); additive over destructive (one class, one harm class, no removal); narrative over mechanical perfection (the sign is a story rule enforced as a gate). Against `Vision/taste-profile.md`: no numbers in the UI. The living world gains its first person-to-person affliction, which is the kind of consequence the hyperconnectivity ruling asked for.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: **a caster may learn a spell** (known unlimited, wielded capped), **a mortal may bless an ally or curse an enemy** (the sign is the gate; a curse is a harm the cursed may avenge), **a rival's power may be sealed** (suppressed, not removed; curing lifts it). All three are `[DESIGN]` today in `Docs/canon/rulebook.md` § powers and § conditions.
- [x] The executor moves them to `[IMPL]` in the same PR and re-verdicts the sections.

> Brainstorm companion: `Docs/plans/2026-09-07-thr-1429-dormant-kinds-powers-conditions-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every threshold, duration and cap is a named constant; the pools are catalog tags |
| 2. Inspectability | PASS | two traces name the actor, target, template, sign and motive; `__DEBUG.getPowers`; the proposal-time refusals ride the existing board traces |
| 3. Determinism | PASS | no new random call; filter → sort → first everywhere |
| 4. Fail-soft | PASS | thirteen rows; every refusal named and traced |
| 5. Narrative over mechanical perfection | PASS with note | the sign is a story rule (you bless friends, you curse enemies) enforced as a gate; a stranger is refused rather than randomly assigned — deliberately no "neutral" outcome |
| 6. Additive over destructive | PASS with note | one subtype, one harm class, three semantics, two edits to an existing catalog entry; the one schema row change (`knows_spell` target `action_template` → `trait`) touches an edge with no writer and no instances; `bestowed` untouched |
| 7. Performance budget | PASS | per-completion work; the caster predicate and the sign are evaluated at proposal on the existing board pass |

## Kill criteria

- If the census (THR-1402) shows no caster ever completing `learn_spell` on two seeds, the shelf or the caster floor is too narrow — the constants move, not the shape.
- If curses never fire because no actor holds a motive against a co-located target, the sign rule is right and the *supply* is the grievance lane's problem (THR-1383), recorded on the map rather than loosened here.
- If sealing a power never changes a cast outcome (the suppression flag set but `use × Power` still casts), the reader was pointed wrong — the Done-when below is the guard.

## Done when

- [ ] Headless: `spawn undertaking <caster> cell.create.power --band success` on seed 42 medium leaves a `knows_spell` edge and a wielded `has_trait` to a `spell`-class trait node; a second learn with the cap full leaves `knows_spell` only (`wielded: false` on the trace); a non-caster is refused `not_a_caster`
- [ ] `spawn undertaking <agent> cell.create.condition` on an ally lands a `#blessing` condition with `sign: 'blessing'`; on a mortal the actor holds a grudge against, a `#curse` with `ticksRemaining` from the band table and an outcome node with `harmClass: 'afflicted'`; on a stranger, refused `no_sign`
- [ ] `spawn undertaking <agent> cell.destroy.power` on a rival's wielded spell lands `reward_condition_null_touched` with `sign: 'seal'`, `applySuppressions` sets `suppressed` on the rival's spell attachment next tick, and the rival's `cell.use.power` is refused `power_suppressed` until the seal expires or is cured
- [ ] A cursed mortal who *saw* the culprit mints a vengeance ambition through `UNDERTAKING_MINTING_RULES['afflicted']` (test in the grievance minting suite)
- [ ] Spell definition nodes exist after `gameInit` (`graph.getNodesByType('trait')` with `subcategory: 'spell'` = `SPELL_TEMPLATES.length`, one per spell, none per bearer); the registry contract test pins `TraitCategory` ↔ `classes.spell`; the `knows_spell` schema row targets `trait`
- [ ] The grid regenerates with the three cells live and their `reader` printed; `Docs/canon/world-objects.md`, `undertakings.md`, `rulebook.md` (§ powers, § conditions → `[IMPL]`), the UL *Spell* line, and the wiki pages `traits-marks-reference`, `undertaking-grid`, `cosmology-reference` updated or exempt with a reason
- [ ] 30-tick CLI engine smoke and `npm run test:heavy` locally
- [ ] UI: Playwright screenshot at 1920×1080 of `AgentDetailPanel` showing a spell in the attachments strand with the class word, a Knows row, a Sealed badge on a suppressed spell, and a curse chip whose tooltip names a known culprit; console clean; `window.__DEBUG.getPowers(<id>)` assertion; UI-Laws line (1, 4, 5, 13/14, 17, 21, 33, 37, 56)
- [ ] `npm test` and `npx vite build` pass; types verified via `tsc -b --force` net-new diff (not `tsc --noEmit` — no-op here, THR-686)
- [ ] Closing commit body includes `Fixes THR-1429`
- [ ] Browser-verify screenshot at 1920×1080 included for the sheet surface

## Coordination block

**Suggested model:** opus — a union change with exhaustive switches, a new harm class through the grievance funnel, and a shape decision the registry deferred; needs the surrounding code read.
**Parallel-safe with:** THR-1401, THR-1402, THR-1404 (map decision tickets); encounter-content tickets; HexMapV2 tickets.
**Files to touch:** `src/data/undertaking-objects.ts`, `src/data/world-objects.ts`, `src/types/traits.ts`, `src/types/strategicAction.ts`, `src/types/trace.ts`, `src/engine/gameInit.ts`, `src/data/spell-templates.ts`, `src/data/reward-attachment-catalog.ts`, `src/data/condition-trait-content.ts`, `src/data/ambition-minting-rules.ts`, `src/data/strategic-action-constants.ts`, `src/data/undertaking-verb-prose.ts` (overrides), `src/engine/undertakingMoments.ts`, `src/debug-bridge.ts` + `.d.ts`, `src/components/Game/AgentDetailPanel.tsx` (attachments strand), `scripts/undertaking-grid-dispositions.ts`, `scripts/interface-contracts.ts`, `Docs/canon/world-objects.md`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, `Docs/ubiquitous-language/Traits.md`, three wiki pages, tests named below.
**Mutex with:** THR-1430 (the dormant kinds II — both edit `src/data/undertaking-objects.ts`, `scripts/undertaking-grid-dispositions.ts`, `src/types/strategicAction.ts` and `Docs/canon/undertakings.md`; land this one first); THR-1403 (same files); any ticket editing `src/types/traits.ts` or the reward catalog; the Powers map's generator work if it starts (it mints through the spell-template seam this plan creates — sequence, do not race).

## Notes for the executor

- **The shape is the decision the registry deferred.** `src/data/world-objects.ts:303` says a later ticket gives Power a shape; this is it. Keep the trait-node shape (it is what `use × Power` already reads), keep `bestowed` untouched, and follow THR-1395: **one shared definition node per spell, per-bearer state on the `has_trait` edge** — never a node per bearer (`traitShape.ts:52` deprecates that id). Retarget the `knows_spell` schema row to `trait` and rewrite its comment; do not mint `action_template` nodes for spells and do not invent a `spell_template` node type.
- **The seal is Null-Touched.** `reward_condition_null_touched` already carries `suppress: spell`; add the `#curse` tag and align its `suppress.ticks` to the constant. Do not author a second suppressing condition (The Hush Stone at `:2051` is an item, not a condition — leave it).
- **Exhaustive switches over `TraitCategory`.** Grep `Record<TraitCategory` and `case 'bestowed'`; add the `spell` arm where a category is dispatched (art resolution, sheet grouping, slot caps: a `spell`-class trait counts against `SLOT_CAPS.spell`, which today keys on the attachment's slot type — confirm the key the slot pass reads and map the class to it).
- **The caster predicate** is THR-1229's composition (spell-weaver mastery ∪ Veil floor ∪ caster roles ∪ Arcane Circle rank). Confirm the mastery trait id and the role ids from `src/data/*trait-content.ts` and the npc seeding roles; the constants table's role list is a starting guess to correct, not a spec.
- **The sign is read once, at proposal**, on the candidate board (the `object` target rule enumerates targets; add the sign as an enumeration filter beside the motive gate). Do not re-read it at completion except to refuse `target_gone`.
- **`afflicted` through the funnel.** `ambition-minting-rules.ts` is total over `UndertakingHarmClass`; the label goes in `HARM_CLASS_LABELS` (`ambitionTick.ts:290`). The seen-harm rule from THR-1383 applies unchanged: whether the cursed mortal saw the culprit is the grievance lane's test, not this cell's.
- **Sealed and `use × Power`.** `applySuppressions` writes `suppressed` on `effectStates` keyed by attachment id; the refusal in `use × Power` reads that state through the runtime (the `SimulationRuntime` the resolver already receives) — never by re-walking effects.
- **Target badge.** `enqueueUndertakingMoments` is the single writer of the queue; add the `afflicted` class with presentation fixed to `badge` inside `resolveMomentPresentation` (never interrupt: Law 49 collation, and an affliction is state the sheet already shows).
- **Not this plan's:** map-arena spells, the cast decision family, the generator, seeded knowing (Powers map); the capability-growth rider (THR-1403); unlearning one's own spell (THR-1397: not worth a work).
- **Tests:** `src/data/__tests__/undertaking-objects.test.ts` (each semantic, each refusal), `src/data/__tests__/worldObjects.test.ts` (the union pin), `src/engine/__tests__/undertakingMotiveGate.test.ts` (the sign), `src/engine/__tests__/undertakingGrievanceMinting.test.ts` (`afflicted`), `src/engine/__tests__/spellActivation.test.ts` (suppressed refusal), a gameInit test for the spell-template nodes. Falsify each guard at its owning layer.

## Forked-audit verdicts

Three independent auditors (sonnet), spawned in one message on 2026-09-07, plus the intent judge (fable, cold).

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | ten named tunables; pools are catalog tags, not hardcoded lists |
| 2. Inspectability | PASS | two trace categories with typed refusal reasons; `__DEBUG.getPowers`; CLI `agent`; wiring table complete |
| 3. Determinism | PASS | no new random call; the existing seeded `activateSpell` draw left unchanged |
| 4. Fail-soft | PASS | thirteen rows, all traced, none throw |
| 5. Narrative over mechanical | PASS-with-note | the sign-as-gate is a deliberate story rule, candidly noted |
| 6. Additive over destructive | PASS | one `TraitCategory` member, one harm class; `bestowed` and existing readers untouched |
| 7. Performance budget | PASS | completion-time work on the existing board pass; no new phase |

**NFP AUDIT: PASS.**

### Three-pillar audit

Engine, Content and UI each present-and-substantive; no missing required sections; Wiring table matches the template's column contract; substrate check PASS — seven inventory subsystems named with matching badges, the dormant Power kind activated inside an ACTIVE subsystem, no green-field duplication. **PILLAR AUDIT: PASS.**

### Vision audit

Non-negotiables 1, 3, 4, 6, 7 confirmed in substance; no contradictions; north star and core loop silent (engine substrate). One note: cite `Vision/02-non-negotiables.md` directly rather than paraphrase — applied in this revision's Vision audit section. **VISION AUDIT: PASS-with-notes** (the note resolved).

### Intent-judge verdict

**Run 1 (fable, cold): Revise** — dimensions 1–10 PASS; dimension 11 (substrate existence) VIOLATION: three substrate claims were false against source. The catalog *does* carry a spell-suppressing condition (Null-Touched, `reward_condition_null_touched:3409-3428`), so the seal mints it instead of authoring a duplicate; THR-1395 rules shared definitions with per-bearer state on the edge, not a node per bearer, so the Power shape became one definition node per spell (and the `knows_spell` schema row is retargeted to `trait`); every spell template already carries `sphereAffinity`, so no field is added. The grep evidence line was replaced with measured counts and the Blast Radius softened to what the greps actually find. All five required actions applied in this revision.

**Run 2 (fable, cold, revised copy): Allow** — all eleven dimensions PASS, zero gaps. Every corrected substrate claim was re-verified by the judge at the cited line numbers: four `suppress` carriers, two with `target: 'spell'` (The Hush Stone is an item, Null-Touched the condition); Null-Touched carries no `#curse` tag today, so the tag edit is real work; `TraitCategory` has no `spell`; `sphereAffinity` on all five templates; the `knows_spell` row is `DORMANT (no producers)` so the retarget touches nothing live. Impact class Reversible, confirmed. Two advisory notes (the Linear plan-doc line; this run-2 record) applied at handoff.
