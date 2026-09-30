> **title:** The seeded spell generator — every tradition teaches its own spells — THR-1572
> **linear_issue:** THR-1572
> **author:** Claude Code (design lane, run 2026-09-30a)
> **created:** 2026-09-30
> **three_pillars:** Engine `done` · Content `done — the THR-1232 cores ported and grown to two flavour lines, 34 tradition rows (themes, price lean, vice, word banks, notice families), the Foundation-sphere shelves, role themes` · UI `done — the spell row on the sheet says what the spell does, what it costs, what goes wrong and who teaches it, in words`

# The seeded spell generator — THR-1572

*Today every caster in the world carries the same spell. On seed 42, all 109 seeded casters hold Height Anchor, because the tradition shelf matches nobody and every one of them falls through to the cantrip. After this plan a priest of the Dawn and a hedge-witch in the marsh carry different spells, each taught by a real tradition, priced the way that tradition prices its magic, named in its words, and promising only what the engine does.*

## Why this is load-bearing

The Powers & Spellcraft map ([THR-1226](https://linear.app/threadbare/issue/THR-1226/wayfinder-map-powers-and-spellcraft)) closed on 2026-09-24 with two plan docs. The first, [the power runtime](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-29-thr-1571-power-runtime.md) (THR-1571), shipped all three slices by 2026-09-29: spells are seeded, cast on a step's own roll, and carried. Its closing words for this ticket: *"the generator (THR-1572) fills the shelf."* The briefing tells Christian the same thing: *"Spells are not ready for you to look at yet … each caster still holds only one starting spell."*

Measured on `origin/main` fa244756, 2026-09-30 (CLI, seed 42, medium, tick 0):

```
[WorldGen] Seeded knowing: 109/109 casters wield a spell (109 via the fallback)
{"casters":109,"bySpell":{"power.spell.spell_height_anchor":109},
 "byRole":{"priest":31,"healer":20,"scholar":11,"warmage":7,"enchanter":7,"alchemist":6,"monk":6,"acolyte":6,"herald":4,"chaplain":4,"oracle":1,"?":6}}
```

Two facts fall out of it, and both shape this plan:

1. **The shelf is seven authored templates** (`SPELL_TEMPLATES`, `src/data/spell-templates.ts`: five deliberate, two fate-woven). A world of a hundred casters cannot be dressed from seven.
2. **A caster has no sphere at worldgen.** `seedSpellKnowing` (`src/engine/seedAttachments.ts:291`) filters the shelf by `alignedSpheres` (`src/engine/casterIdentity.ts:65`). On all 109 casters `sphereAlignment` is absent and every `sphereAffinity.scores` entry is `0` (same census), and no settlement carries a `dominantSphere` (`{"ds":{"none":109}}`). So the sphere-keyed shelf is structurally empty at tick 0, and the fallback cantrip fires for everyone. A generator keyed on the caster's sphere would inherit the same hole.

**Settled input — not reopened here** (each is cited where the plan uses it):

- **[THR-1230](https://linear.app/threadbare/issue/THR-1230/what-is-a-power-to-the-player-ratify-the-power-objects-shape), the generator axes:** agency × arena × price × tier × sphere and tradition; most magic fate-woven, a marked few deliberate; the four price layers free → strain → gamble → transgression; one caster badge with tradition shelves.
- **[THR-1232](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to), the prototype, judged 2026-09-24** ([twenty generated spells](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-09-24-twenty-generated-spells.md)): spells **grow around authored cores with seeded variation**; **free composition is limited to one optional rider** in the same arena; the eight envelope rules in § Content pillar each came from a failure in that run.
- **[THR-1235](https://linear.app/threadbare/issue/THR-1235/random-table-raw-material-what-the-world-can-tell-the-generator), the seeded-table pattern:** `drawFromTable(tableId, weights, seedKey, n)`, one stream per table.
- **The power runtime, shipped** ([THR-1571](https://linear.app/threadbare/issue/THR-1571), [THR-1670](https://linear.app/threadbare/issue/THR-1670), [THR-1671](https://linear.app/threadbare/issue/THR-1671)): the template fields `agency`, `arena`, `castReach`, `castProse`; the stateless-carried rule (`CARRIED_EFFECT_ALLOWED_TYPES`); the band decides the cast; backlash by price layer; strain as a timed condition; seeded knowing.
- **The item generator, shipped** ([THR-1570](https://linear.app/threadbare/issue/THR-1570), [plan](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md)): the shape this plan copies — authored cores, a pure generator, an honest-vocabulary validator, an engine read-back gate with a dishonest control batch, words derived at render. Its modules are reused, not re-invented (§ Substrate inventory).

**Decided in this plan by the design lane under delegation** (process.md rule 4, 2026-09-11). Each is marked *Lane decision* where it appears, and each can be vetoed in chat:

1. **A caster's tradition comes from what they do and whom they serve, not from their sphere** (role themes plus the faction's reach lean). The spell's sphere then follows the tradition.
2. **A world keeps one spell library per tradition in use**, generated at worldgen and shared by that tradition's casters. A spell is not unique to its bearer.
3. **A generated spell's template lives on its definition node**, read through one resolver. No module-level registry.
4. **No generated spell carries a world-doom price.** Transgression's doom half is the soul price, which already lands on quintessence; the population cap on `doom_rate_multiplier` is therefore zero.
5. **Notice is a hidden mark** on the caster (existing `forbidden_contact` category), placed when a transgression spell is cast or first carried, revealed by the encounter families the tradition names.
6. **A deliberate spell's landed effect must write something.** Modifier-only primitives stay out of cast effects until [THR-1683](https://linear.app/threadbare/issue/THR-1683)'s per-cast channel lands, and encounter-arena cast effects target the caster only until its ally/enemy filter lands.

The brainstorm companion records the options weighed for each.

**The prototype source is in git** on the never-merged branch [`proto/thr-1572-spell-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1572-spell-generator/Docs/audits/2026-09-24-proto-spells) (`generator.mjs`, 1704 lines; `twenty-spells.json`; the critique notes). It was copied verbatim from the design vault, which is not git-backed. **Port from it; do not rewrite from the write-up.**

## Substrate inventory

Measured 2026-09-30 against `origin/main` fa244756 (grep + read + two CLI censuses; line numbers are that tree's).

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Spell data:** `SPELL_TEMPLATES` (7 templates), `getSpellTemplate(id)` (`spell-templates.ts:267`, a find over the static array), `spellDefinitionNode` (:297), `carriedEffectsOf` (:329), `allSpellDefinitionNodes` (:341) | 🟢 ACTIVE | **extends**. `spellDefinitionNode` gains the generated template on the node; a new `resolveSpellTemplate(graph, id)` reads authored first, then the node |
| **`getSpellTemplate` production callers** (grep, 2026-09-30): `undertaking-objects.ts:2404` (`use × Power`), `resolutionModifiers.ts:849`, `stepCast.ts:65`, `unifiedActionResolution.ts:660` and :2482, `debugEncounterTools.ts:725`, `debug-bridge.ts:2832`, `components/Game/encounter-stage/adapters/buildStepCastModel.ts:38` and :95 | 🟢 ACTIVE | **repointed** to `resolveSpellTemplate` (each has a graph in reach). Authored ids resolve exactly as today |
| **Seeded knowing:** `seedSpellKnowing` (`seedAttachments.ts:291-373`), shelf = `alignedSpheres`, fallback = lowest-tier template; trace `spell.seeded` | 🟢 ACTIVE, but the shelf is empty at tick 0 (census above) | **extends**. Picks from the caster's tradition library; the sphere shelf and cantrip stay as the fallback |
| **Caster identity:** `isCaster`, `alignedSpheres` (`src/engine/casterIdentity.ts`); `CASTER_NPC_ROLES` (11 roles, `strategic-action-constants.ts:1543`) | 🟢 ACTIVE | **extends**. A new `casterTraditionOf` beside them |
| **Learning:** `create × Power` (`learn_spell`, `undertaking-objects.ts:~2269`) reads `alignedSpheres` for its shelf | 🟢 ACTIVE | **extends**. Offers the next spell of the caster's tradition library |
| **Traditions:** 34 nodes with `category: 'magic-tradition'` in `src/data/world-model.json` (`primarySpheres`, `sphereWeights` over Creation spheres only), read through `engine/taxonomy.ts`. **Not minted into the game graph; no actor carries one** (0 hits for a tradition property on actors) | 🟢 ACTIVE (catalog) | **reuses** as the tradition list; the generator's authored `TRADITION_ENV` rows key on these ids |
| **Seeded tables:** `drawFromTable` (`src/lib/drawTable.ts`, lifted by THR-1570); one namer `hashSeed` / `pickFrom` (`engine/naming/workNames.ts`) | 🟢 ACTIVE | **reuses** |
| **Honest vocabulary:** `ITEM_HONEST_VOCABULARY`, `ITEM_HONEST_RULE_KEYS`, `ITEM_HONEST_TRIGGER_EVENTS` (incl. `spell_cast` since THR-1571), `ITEM_HONEST_CONDITION_OWN_REACHES` (`src/data/item-honest-vocabulary.ts`) | 🟢 ACTIVE | **reuses** for carried effects (intersected with `CARRIED_EFFECT_ALLOWED_TYPES`); **extends** with a cast table |
| **Item generator modules:** `validateGeneratedItem.ts`, `describeItem.ts`, `readBack.ts`, `reviewWorld.ts`, `reviewBatch.ts` (`src/engine/itemGenerator/`) | 🟢 ACTIVE | **reuses** the carried-effect checks, the word helpers and the three-mortal review world; no copy |
| **Effect execution:** `executeEffect` (`effectExecutors.ts:871`). Arms that **write**: `teleport`, `forced_move`, `dispel`, `alter_terrain`, `modify_rules`, `inflict_condition`, `resource_manipulate` on `fight_clock`, plus `spawn`, structures, `faction_manipulate`, `cascade`, `choice_set`. Every other type returns `modifierOnlyResult` (:904-947) — **including `duration`, `aura`, `conditional` and `suppress`**, which write nothing when cast | 🟢 ACTIVE | **preserve**. The cast vocabulary admits only arms that write (Lane decision 6) |
| **Cast resolution:** `resolveCast`, `resolveCastTarget` (`src/engine/spellCasting.ts`); `CAST_LANDED_BANDS`, `BACKLASH_ELIGIBLE_BANDS_BY_TRIGGER`, strain (`spell-casting-constants.ts`). Known gaps, filed: modifier-only landed effects write nothing, and `targeting.filter` is ignored ([THR-1683](https://linear.app/threadbare/issue/THR-1683)) | 🟢 ACTIVE | **extends** by one thing: a transgression cast returns a notice mark (§ Resolution logic) |
| **Hidden marks:** `HiddenMark` with `category` (`forbidden_contact` exists, `types/unifiedAction.ts:110-119`) and `revealFamilies`; placed by aftermath (`encounterAftermath.ts:1849`), revealed through `evaluateMarkReveals` (live caller `encounterScoring.ts:1427`) | 🟢 ACTIVE | **reuses** as the home for notice (Lane decision 5) |
| **World doom:** `phaseDoom.ts:349-355` multiplies `doom_rate_multiplier` across **every** individual actor | 🟢 ACTIVE | **not emitted** (Lane decision 4) |
| **Conditions:** eight shared definitions (`condition-trait-content.ts`: blessed, cursed, exhausted, grieving, inspired, shaken, terrified, wounded) | 🟢 ACTIVE | **reuses** as the only conditions a generated spell may name |
| **The sheet:** `AttachmentsTab.tsx:205` renders a Power row with its class word (`Spell · `), tier and `flavorText` | 🟢 ACTIVE | **extends** with three optional word lines for a generated spell |

Green-field parts, with their evidence: **0 hits** for `spellGenerator`, `generateSpell`, `casterTradition`, `resolveSpellTemplate` or a `gen_spell` / `power.spell.gen` id across `src/` (Grep, 2026-09-30). The generator, its cores, its tradition rows and its cast vocabulary are new; everything they write lands in systems that already read it.

**Population consumed:** 109 casters on seed 42 medium (103 by role, 6 by trait or Veil); 83 of them in a faction. Seed 99 is recorded at build (§ Done when).

## Engine pillar

### Systems design

A new module family, `src/engine/spellGenerator/`, pure and fail-soft, shaped like `itemGenerator/`:

| Module | Does |
|---|---|
| `casterTradition.ts` | `casterTraditionOf(graph, actorId, worldSeed): TraditionId`. *Lane decision 1.* Weight each of the 34 traditions by **role fit** (`ROLE_THEMES[role]` ∩ the tradition's themes: `SPELL_GEN_ROLE_FIT_WEIGHT` on a match, `SPELL_GEN_OFF_ROLE_WEIGHT` otherwise) × **faction lean** (1 + `SPELL_GEN_FACTION_LEAN` × the faction definition's `reachWeights` dotted with the tradition's theme reaches, `THEME_REACH`), then one hashed pick keyed `tradition:${worldSeed}:${actorId}`. A caster by trait or Veil has no role and draws on faction lean alone. Deterministic, no graph write |
| `generateSpell.ts` | `generateSpell(req: SpellGenRequest): GeneratedSpell \| null`. Given a tradition, a tier and a slot, picks a core the tradition teaches (hard fit, rule 1), draws the sphere from the tradition's `sphereWeights` (plus the Foundation shelves, rule 4), the price layer (§ Resolution logic), an optional rider (at most one, same arena, same Reach), the backlash from the sphere's miscast list, the vice drift and the notice for a transgression, the flavour line, and the name. Every table is drawn eagerly on its own stream. Never touches the graph |
| `validateGeneratedSpell.ts` | The honest-vocabulary validator. Carried effects: every row `live` or `narrow` in `ITEM_HONEST_VOCABULARY` **and** in `CARRIED_EFFECT_ALLOWED_TYPES`, the item validator's per-effect checks reused (caps, live rule keys, live triggers, real conditions, the "when…" rule). Cast effects: every row `live` in `SPELL_CAST_HONEST_VOCABULARY` (§ Data tables), a target the runtime resolves, no `update_property`. Whole spell: one arena, at most two Reaches, a price the tradition allows, no `doom_rate_multiplier`, a notice family that matches at least one encounter template (`familyMatchesTemplate`), no unrendered `{…}`, no name collision with another spell in the world. Returns `string[]` problems |
| `describeSpell.ts` | Plain words for a spell — *What it does*, *What it costs*, *What goes wrong* — ported from the prototype's clause functions (`generator.mjs:361-455`, :872-946), reusing `describeItem`'s magnitude and duration words where the shape is shared. "The bearer" carries a spell, "the caster" casts one. Pure over the template, so words never go stale |
| `spellLibrary.ts` | `buildSpellLibrary(graph, worldSeed, traditionIds)`: for each tradition in use, fills `SPELL_LIBRARY_SHAPE` slots with `generateSpell`, rerolling on validator problems, and mints each spell's definition node. `resolveSpellTemplate(graph, id)`: authored template by id, else the template on the node. `getTraditionLibrary(graph, traditionId)`: its spells, by tier then id |
| `src/data/spell-generator-cores.ts` | The authored cores (Content pillar) |
| `src/data/spell-generator-tables.ts` | Tradition rows, role themes, theme reaches, price leans, tier windows, sphere tables (Reach pulls, miscasts, words), the Foundation shelves, magnitudes |
| `src/data/spell-honest-vocabulary.ts` | `SPELL_CAST_HONEST_VOCABULARY`, the live cost types, the live cast targets |

**The library (Lane decision 2).** A tradition's spells belong to the tradition. At the tail of worldgen, before seeded knowing, the world derives each caster's tradition, collects the set in use, and builds one library per tradition. On seed 42 that is 109 casters over the traditions they draw, so at most `34 × SPELL_LIBRARY_SIZE` nodes and in practice a fraction of it. Two casters of Holy Magic carry spells from the same book; a priest and a warmage never do. It also keeps the runtime's model intact: one shared definition node per spell, many bearers, per-bearer state on the edge.

**Where a generated template lives (Lane decision 3).** `spellDefinitionNode` writes the whole generated `SpellTemplate` onto the node as `properties.template` (plain data; effects are plain objects) plus a provenance bag (§ Graph nodes). `resolveSpellTemplate(graph, id)` returns `getSpellTemplate(id)` for an authored id and otherwise the node's template. The nine `getSpellTemplate` call sites above switch to it. There is no module-level registry of generated templates, because a registry keyed on id would outlive the session that minted it (CLAUDE.md: engine caches are owned per session), and the graph already is the per-session store.

**Seeded knowing changes, additively.** `seedSpellKnowing` gains an optional `library?: SpellLibraryIndex`. When `SPELL_GEN_ENABLED` is true and the caster's tradition has a library, the caster gets `SEEDED_SPELLS_PER_CASTER` spells from it: among the library's lowest-tier spells, one hashed pick keyed `seed_spell:${worldSeed}:${actorId}`, so two priests of one order do not all carry the same one. The `knows_spell` edge records `tradition: <id>` (per-bearer state on the edge, the runtime's pattern). No library, or `SPELL_GEN_ENABLED = false` → today's path exactly (sphere shelf, then the cantrip). The trace gains `byTradition` and `fromLibrary`.

**Learning.** `create × Power` offers the caster's next unknown spell from their tradition library, lowest tier first, before the sphere shelf. A caster's tradition is read off their seeded `knows_spell` edge; a caster with none is derived through `casterTraditionOf`.

### Graph nodes / edges

No new node type and no new edge type.

| Shape | Change |
|---|---|
| `trait` node, `subcategory: 'spell'`, id `power.spell.<spellId>` | A generated spell's node gains `properties.template` (the full `SpellTemplate`), `properties.origin = 'generated'`, and `properties.generated` (below). Its `effects` are written from `passiveEffects` exactly as `carriedEffectsOf` does for authored spells |
| Generated spell ids | `spell_gen_${traditionSlug}_${tier}_${slot}` (e.g. `spell_gen_holy_1_0`). Unique within a world; a different world regenerates its own library under the same ids, which is safe because nothing carries a node across worlds (no save/load path exists, `agentAttachments.ts:132-133`) |
| `knows_spell` edge | Gains `tradition` (the tradition id) on seeded and learned edges |
| `GameState.hiddenMarks` | Gains `forbidden_contact` marks for notice (Lane decision 5) |

```ts
/** On a generated spell's definition node only. Read by the sheet, the debug bridge and the gate test. */
interface GeneratedSpellProvenance {
  traditionId: string;        // 'magic.holy'
  coreId: string;             // 'enc.soul_ward'
  flavourIndex: number;       // which of the core's authored lines fired
  riderId?: string;
  priceLayer: 'free' | 'strain' | 'gamble' | 'transgression';
  seedKey: string;            // re-running it reproduces the spell
  catchIndexes: number[];     // indexes into passiveEffects that are the price, not the boon
  rerolls: number;
}
```

The tradition is a catalog id, like a sphere name, not a relationship to a graph entity: traditions are not minted as nodes, and minting 34 nodes to hang one edge each on would be a new node kind for display alone. It is recorded where per-bearer facts already live, on the edge, and on the spell's own node.

### Tick phases

None new. Generation runs once, at worldgen, between the spell definitions and seeded knowing. Learning and casting run where they already run. Cost: one library build per world (at most a few hundred table draws per tradition in use).

### Resolution logic

**Core choice.** Eligible cores are those whose `themes` intersect the tradition's themes (**hard**, rule 1: at a soft weight a misfit still got through in twenty spells), whose `arena` and `agency` fit the slot, and whose `tiers` include the slot's tier. Weight × `SPELL_GEN_CORE_REPEAT_DECAY ^ n`, *n* = spells already built on that core in this world, so a second tradition reaching for the same core tends to find another.

**The library slate.** `SPELL_LIBRARY_SHAPE` gives each tradition `{ tier 1: 2, tier 2: 2, tier 3: 1, tier 4: 1 }` spells. Agency by tier follows ruling 1 and the prototype: tier 1 always fate-woven; tier 2 deliberate with `SPELL_GEN_DELIBERATE_SHARE_BY_TIER[2] = 0.33`; tier 3 at 0.5; tier 4 always deliberate. Arena is drawn from `SPELL_GEN_ARENA_MIX`, restricted to arenas the tradition's themes reach (a travel tradition gets map-travel slots; a war tradition gets fight slots). Every library holds at least one spell a caster can use on a step (encounter or fight arena), so a seeded caster is never handed only map magic.

**Price (rules 2 and 3).** The tradition's primary theme sets a lean (`THEME_PRICE_LEAN`); the tier sets a window (`TIER_PRICE_WINDOW`). **The lean is never overridden:** a layer the lean forbids (weight 0: holy and heal never transgress; curse and death are never free) stays forbidden whatever the tier, and a tier window that would leave no layer widens to the lean's best layer. This is the fix for *Search the Distance* (a gentle divination forced to eat its caster's soul) and *Second Sight* (death magic priced like a hedge-witch's charm). The layer is then built from the agency's own table:

| Layer | Deliberate (paid when cast) | Fate-woven (paid by carrying) |
|---|---|---|
| free | nothing | nothing |
| strain | `reach_drain` (→ the timed *Strained* condition, THR-1571), `condition_inflict` exhausted, or `tick_exhaust` | a standing `passive` weakness in the paired Reach (`STRAIN_PAIR`), or a vow (`action_gate`) for holy and heal only |
| gamble | backlash `trigger: 'always'` | `action_trigger` on `encounter_failure` → a sphere condition, or `self_remove` |
| transgression | `doom_increase` (the soul price, via `spell_price`) + notice; backlash `trigger: 'critical_failure'` | `resource_manipulate` quintessence per tick on self + `axiological_drift` toward the **tradition's** vice + notice |

**Vice (rule 7).** "It changes them" reads the tradition's primary theme (`THEME_VICE`: an axis and a direction), never the effect's Reach. The fix for *Green Chart*, whose mapping spell made its bearer Misleading.

**Notice (rule 6, Lane decision 5).** A transgression spell carries `notice: { severity, revealFamilies }` from its tradition row. `resolveCast` returns it as `CastResult.notice` on every cast of that spell, landed or fizzled, and the call site appends a `HiddenMark { category: 'forbidden_contact', severity, label: '<spell name> was cast', targetAgentId: caster, revealFamilies }` exactly as aftermath does. A fate-woven transgression places the same mark once, when the spell is first carried (seeding or learning). One mark per caster per spell (`SPELL_NOTICE_ONE_PER_SPELL`): a second cast refreshes nothing, so a necromancer is noticed, not buried in marks. The mark is revealed by the ordinary reveal path (`evaluateMarkReveals`); the validator refuses a notice whose families match no encounter template, so notice can never be a promise nothing keeps.

**Doom (Lane decision 4).** The generator never emits `doom_rate_multiplier`, in any layer. `phaseDoom.ts:349-355` multiplies it across every individual actor, so with a library shared by a tradition's casters, one small doom-rate price on a tier-1 Necromancy spell would multiply once per carrier. The soul price already lands on quintessence as `spell_price` (FB3), which is per caster and additive. The ticket's "population cap" is therefore zero, and it is a constant (`SPELL_GEN_DOOM_RATE_CAP = 0`), not a code path, so raising it later is a data change behind its own read-back.

**The balance envelope at population scale.** Three measures, each a constant and each checked by the census in § Done when on a 300-tick medium run:

- `SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE = 0.15` — at most this share of a library's fate-woven spells may be transgressions, so the world's standing soul drain stays a minority of its casters;
- `SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET` — the summed per-tick quintessence drain of every seeded carrier, measured at tick 0, must stay under this share of their summed passive regeneration (`QUINTESSENCE_PASSIVE_REGEN` × carriers), so no world's casters are net-drained by what they carry; over budget, the library build rerolls the heaviest carried transgressions to strain, largest drain first;
- the runtime's own `POWER_UPKEEP_TICK_COST_BUDGET_PCT` (5%) for tick cost, measured with `npm run measure:tick-cost` before and after.

**Deliberate spells write (Lane decision 6).** A deliberate spell's `effects` may hold only rows `live` in `SPELL_CAST_HONEST_VOCABULARY`: arms of `executeEffect` that return mutations (§ Data tables). The prototype's `duration` riders ("the caster is slightly better at Iron for half a day"), a cast `aura` and a cast `suppress` all execute as `modifierOnlyResult` and would write nothing, so the validator refuses them in cast effects. Encounter-arena cast effects target `self` only: `resolveCastTarget` ignores `targeting.filter` today, and on the S2 review link an `enemy`-filtered spell landed on the caster's own ally ([THR-1683](https://linear.app/threadbare/issue/THR-1683)). Fight-arena cast effects may target the opponent, which `resolveCast` takes from the step. When THR-1683 ships, its rows flip to `live` behind their read-back cases, and the generator needs no other change.

**Rerolls.** Validator problems → reroll the slot with seed key suffix `:r<k>` up to `SPELL_GEN_MAX_REROLLS`. Still failing → the slot is left empty and traced. A tradition whose library ends up with no step-usable spell falls back to the authored shelf for seeding (§ Fail-soft).

### PRNG callouts

No `Math.random()`. Seed keys, all hashed with `hashSeed`:

- tradition: `tradition:${worldSeed}:${actorId}`;
- spell: `gen_spell:${worldSeed}:${traditionId}:${tier}:${slot}` (+ `:r<k>` on reroll);
- seeded pick: `seed_spell:${worldSeed}:${actorId}`.

Every table inside `generateSpell` is its own stream through `drawFromTable(tableId, weights, seedKey, n)`, so cutting a core or a word never reshuffles another table. Worldgen's own streams are **not** consumed, so a world with `SPELL_GEN_ENABLED = false` and one with it on stay identical in everything but the spells. Determinism test: the same world seed produces byte-identical libraries and identical holders.

## Content pillar

### Encounter templates

N/A: no template is authored or edited. A generated spell reaches encounters through what already reads spells: the step cast (THR-1670), carried effects on the walker, and hidden-mark reveals through existing encounter families.

### Attachment content — the cores

Port the prototype's 37 cores (`generator.mjs:458-831`) into `src/data/spell-generator-cores.ts`, then apply the envelope rules:

- **Drop or retarget every core that emits a refused shape.** Measured against the prototype's own small print: the cores that reach for `duration` or `modify_rules` riders on a cast keep their `modify_rules` (live) and lose the `duration` rider; `fight.trade_answer` (`reactive`) and `fight.trophy` (`stacking` on `on_kill`) are refused as carried (stateful, `CARRIED_EFFECT_ALLOWED_TYPES`); `sight.survey`'s cast twin keeps only its `modify_rules awareness_range_bonus`. The executor re-measures each against the two vocabularies; **a core that cannot pass is dropped, never faked**.
- **Two flavour lines per core (rule 8).** Each core carries `flavours: { themes: string[]; text: string }[]` — at least two authored sentences, each naming the theme family it suits, so *Height Anchor* and *Brace of Loam* no longer share one sentence word for word. Placeholders: `{tradition_noun}` and `{blow}` only, filled from the tradition row.
- **Each core carries its `themes`** (the hard fit), `arena`, `agency`, `tiers`, the Reach it pulls, and its name kernels (`nouns`, `verbs`, `objects`).

### The tradition rows

`src/data/spell-generator-tables.ts` carries one row per world-model tradition (34), ported from the prototype's `TRADITION_ENV` (`generator.mjs:268-302`) and extended:

| Field | Rule it serves | Example (`magic.necromancy`) |
|---|---|---|
| `themes` (first = primary) | 1 — what the tradition teaches, hard | `['death','fear','curse']` |
| `cond` | the situation its conditionals name | `in_mystical` |
| `nouns`, `mass`, `blow`, `road`, `ward` | 5 — word banks per tradition | `['Grave','Barrow','Knell','Shroud']`, `['Bone']` |
| `vice` (via the primary theme) | 7 — "it changes them" | `THEME_VICE.death` |
| `noticeFamilies` | 6 — who notices | the encounter families that reveal `forbidden_contact` |

The price lean is by primary theme (`THEME_PRICE_LEAN`, `generator.mjs:305-321`, 15 themes).

**Role themes (Lane decision 1).** `ROLE_THEMES` maps each of the 11 caster roles to the themes it practises: priest `holy, heal, ward`; oracle `sight, time, luck`; acolyte `holy, ward`; monk `holy, mind, ward`; chaplain `holy, war`; enchanter `craft, mind, ward`; warmage `war`; alchemist `craft, curse`; scholar `sight, craft, time`; healer `heal, wild`; herald `travel, mind`. A tradition with none of the role's themes keeps `SPELL_GEN_OFF_ROLE_WEIGHT`, so a few hedge necromancers and weather-witches still turn up among the priests.

**The Foundation shelves (rule 4).** No tradition weights Order, Chaos, Light or Darkness. The prototype's patch (`FOUNDATION_SHELF_PATCH`, `generator.mjs:338-343`) becomes authored data: Light from Holy, Divination, Restoration and Ascension; Darkness from Illusion, Necromancy, Dreamcraft and Shamanism; Order from Warding, Rune, Binding and Enchantment; Chaos from Chaos, Luck, Demonology and Weather. A tradition's sphere draw is its own `sphereWeights` plus the Foundation spheres whose shelf names it, at `SPELL_GEN_FOUNDATION_SHELF_WEIGHT` — **and only for tier 3 and 4 slots** (`SPELL_GEN_FOUNDATION_MIN_TIER = 3`). The taste profile is explicit: *"Foundation spheres are elder magic in-game … they discover them through ruins, texts, and encounters"* (`Vision/taste-profile.md` § Elder magic). Seeding draws from a library's lowest tier, so no mortal starts the world carrying elder magic; it is reached only by learning up a tradition, and it stays rare. The world model is **not** edited; the shelves are the generator's reading of it. `world-model.json`'s stray fifth Foundation sphere (Shadow, not in canon's twelve) is ignored and noted.

### Prose tables

The cores' flavour lines, the tradition word banks, the sphere miscast lines (`CAST_MISCASTS`, `generator.mjs:404-455`) and the name grammar are the prose. Register: **GAME, not novel** — plain sentences, one concrete detail, GM narration. Names: two or three plain words from the core's function words, the tradition's nouns and the sphere's adjectives; a deliberate spell may take the card form (imperative verb + object: *Bar the Road*), per Prose Doctrine v2. Reach and sphere names never appear in a name. Each generated deliberate spell also gets `castProse` (landed / fizzled), built from its core's flavour line and the tradition's `blow`, with `{actor}` / `{target}` placeholders only, so the step cast's afterimage line (THR-1670) works for generated spells with no new slot.

### Data tables

`spell-honest-vocabulary.ts` (new):

| Cast effect | Status | Writer (in `executeEffect`) |
|---|---|---|
| `inflict_condition` | live | `executeInflictCondition` — the eight real conditions only |
| `resource_manipulate` (`fight_clock`) | live, fight arena | `executeFightClock` |
| `teleport`, `forced_move` | live, map-travel arena | `executeTeleport` / `executeForcedMove` via `rebindLocatedAt` (THR-1571) |
| `modify_rules` | live, keys in `ITEM_HONEST_RULE_KEYS` plus `encounter_reach_override` | `executeModifyRules` (persisted override) |
| `alter_terrain` | live, `warded` / `shrouded` only | `executeAlterTerrain`; 2 of 11 overlays are read — `warded` in `movementCost.ts:161`, `shrouded` in `encounterAwareness.ts:187` |
| `dispel` | live | `executeDispel` — edge-only for conditions since THR-1571 |
| `duration`, `aura`, `conditional`, `passive`, `suppress`, `test_shaper`, `social_modifier` | **refused in cast effects** | `modifierOnlyResult` — until THR-1683's per-cast channel |
| `transfer`, `compel`, `spawn`, structures, `faction_manipulate`, `cascade`, `choice_set` | **refused** | out of the map's scope |

Live costs (paid by `payCosts`, `src/engine/spellActivation.ts`; `doom_increase` becomes the soul price at :284): `reach_drain`, `condition_inflict`, `doom_increase`, `tick_exhaust`, `multi` of these. Refused **by policy**, not by absence: `attachment_consume` (`payCosts` does execute it, :290, but no core needs it), `relationship_damage` and `health_sacrifice` — each would need its own read-back case before a core may use it. Live cast targets: `self` (every arena), the fight opponent (fight arena), a hex (map arenas).

Magnitudes: `SPELL_GEN_MAGNITUDE_BY_TIER` (the prototype's `TIERS`, `generator.mjs:129-138`), inside `EFFECT_PER_ITEM_CAP = 0.15` (`src/data/effect-constants.ts:112`).

### Review path

A generated spell reaches a world only through cores and rows that have passed three gates:

1. **The gate test** (`src/engine/spellGenerator/__tests__/spellGenerator.gate.test.ts`): for seeds `SPELL_GEN_GATE_SEEDS`, every tradition, a full library each — **zero validator problems and zero read-back failures**; every core fires at least once across the grid; every tradition's library holds a step-usable spell; determinism. The **read-back** mints each spell into the item generator's three-mortal review world (`itemGenerator/reviewWorld.ts`) and calls the real readers: a carried effect changes its Reach's roll through the walker; a cast is run through `resolveCast` on a `success` and a `failure` band and its writes are observed on the graph (and absent on the fizzle); strain pays the Strained condition; backlash fires on the bands its layer allows; a transgression places exactly one notice mark. **A control batch of deliberately dishonest spells must fail** (a cast `duration`, a `doom_rate_multiplier`, an `enemy`-filtered encounter cast, a notice family nothing reveals, a stateful carried primitive), or a clean pass proves nothing.
2. **The CLI** (`npm run cli`): `generate spells [N] [--tradition <id>] [--seed S]` prints each spell as the sheet reads it (name, tradition, what it does, what it costs, what goes wrong, under the hood) with its verdicts; `spells` lists a live world's libraries and holders.
3. **Christian's bar stays "does it read as one thing?"** — the coherence bar the prototype proposed: *a player could guess its tradition from its name and effect, and its price from its tradition*. A batch is surfaced as a sample the way THR-1232 was, never as a diff, and only once the system is level (§ UI pillar → Review).

## UI pillar

*Screenshot tool: **Playwright** (DOM) — the attachments tab is DOM, not canvas.*

Engages UI Laws **1, 4, 13/14, 17, 21, 33, 37, 56**.

### Player-facing display

`AttachmentsTab.tsx` gains, for a Power row whose node has `properties.origin === 'generated'`, up to four optional lines under the flavour text (Law 4: each only when it has content):

- **Taught by** — *Taught by Holy Magic*: the tradition's world-model name, plain text (a tradition has no page to link to; Law 21 forbids a dead link).
- **What it does** — `describeSpell(template).does`: one or two plain sentences, magnitudes in words (Law 13).
- **What it costs** — the price in words (*Casting it leaves the caster Strained in Veil for a couple of days*).
- **What goes wrong** — the backlash or carried price in words.

Authored spells are unchanged. The class word (`Spell · `), tier name, sealed line and pinned mark are untouched. No numbers appear; the only number a spell ever shows is the step's existing +N odds line from THR-1670.

### Event notifications

None new. A transgression's notice places a mark silently, as aftermath marks do (*"A consequence has taken root, unseen."* is the existing mark event); its reveal arrives through the existing reveal path. Casts reach the player through the step and the chronicle, unchanged.

### Debug inspection (DebugPanel)

- `window.__DEBUG.getSpellLibraries()` → `{ traditionId, name, spells: { id, name, tier, agency, arena, priceLayer, coreId, holders }[] }[]`.
- `window.__DEBUG.previewGeneratedSpell({ tradition, tier, slot?, seed? })` → the spell, its words and its validator problems, without minting.
- `window.__DEBUG.getSpellHolders()` (THR-1571) gains `tradition` per holder.
- CLI `generate spells …` and `spells` (above).
- `?spell=<id>` (THR-1670) accepts a generated id, so `?spell=spell_gen_holy_1_0` stamps it on `@hero` for review.

### Visual presence (HexMapV2)

N/A: a spell has no map presence. A `warded` or `shrouded` hex a map-mark spell writes renders through the overlay layer that already draws both.

### Review

The briefing's standing line, *"Spells are not ready for you to look at yet"*, is lifted by this ticket's closeout **only** when the level-system rule holds (process.md rule 5): data (the libraries), logic (the runtime), content (the ported cores) and UI (the sheet lines) all shipped to the deployed build. The review link then is `?view=game&seeded&size=medium&testavatar&spell=<generated id>&spawn=<template with a step in the spell's Reach>`, plus a CLI sample of thirty.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase / call site | UI component | GameState flow | Trace | Debug |
|---|---|---|---|---|---|
| `spellGenerator/casterTradition.ts` | worldgen, before seeded knowing; `create × Power` | AttachmentsTab (*Taught by*) | `graph` (edge property) | `spell.library_built` (tradition counts) | `getSpellHolders` |
| `spellGenerator/generateSpell.ts` + `validateGeneratedSpell.ts` | via `buildSpellLibrary` | — | — | `spell.generated`, `spell.generate_fallback` | `previewGeneratedSpell`, CLI `generate spells` |
| `spellGenerator/spellLibrary.ts` | worldgen tail (`worldSeed.ts:2382`, immediately before `seedSpellKnowing`) | AttachmentsTab | `graph` (definition nodes) | `spell.library_built` | `getSpellLibraries` |
| `resolveSpellTemplate` | every former `getSpellTemplate` site (nine) | step cast model, sheet | — | — | — |
| `seedSpellKnowing` (edited) | worldgen tail | AttachmentsTab | `graph` | `spell.seeded` (+ `byTradition`, `fromLibrary`) | `getSpellHolders` |
| `resolveCast` notice (edited) | step cast and `use × Power` | — (a hidden mark) | `hiddenMarks` | `spell.notice_placed` | CLI `eval state.hiddenMarks` |
| `describeSpell.ts` | — | AttachmentsTab | — | — | CLI output |

**Player controls:** none. The player meets these spells on mortals; the god acts on a cast only through the step's existing cards (THR-1670) and on a spell through `?spell=` for review.

**Prose:** generation composes every string from the cores' and rows' own lines; nothing goes through `enrichProse()` except the generated `castProse`, which resolves at cast time exactly as authored `castProse` does (THR-1670). The validator refuses an unrendered placeholder other than `{actor}` / `{target}` in `castProse`.

`Docs/plans/wiring-checklist.md` gains the library and resolver rows. `Docs/plans/2026-04-16-systemic-wiring-guide.md` § Capability 37: Spells — carried and cast (THR-1571) gains the two vocabularies and the rule that a cast must write.

## Interface impact

| Contract (interface map) | Impact | Detail |
|---|---|---|
| `seeded-spell-holders` (THR-1571) | **extend** | Producer gains the library path; consumers unchanged |
| `spell-cast-applies-effects` (THR-1571) | **extend** | `CastResult.notice` → `hiddenMarks`; a new consumer, the notice appender at both cast sites |
| `generated-item-honest-vocabulary` (THR-1570) | **preserve** | Reused for carried spell effects, unchanged |
| `one-namer-shared-primitives` | **preserve** | New consumer of `hashSeed` / `pickFrom` |
| **add:** `spell-notice-reveals-through-hidden-marks` | **add** | Producer: `resolveCast` (`CastResult.notice`) and the carried-transgression placement; carrier `state.hiddenMarks` (the carrier the `a-concealed-sale-ends-the-company-that-was-sold` row already names); reader `evaluateMarkReveals` (`encounterScoring.ts:1427`), unchanged. There is no general hidden-mark contract row today, so this one is scoped to spell notice |
| **add:** `generated-spell-honest-vocabulary` | **add** | *A spell the world makes promises only what the engine does.* Producer: `validateGeneratedSpell` + `spell-honest-vocabulary.ts`; read site: the gate test's read-back and `buildSpellLibrary` (refuses an invalid spell). Registered in `scripts/interface-contracts.ts` in the same PR |
| **add:** `spell-template-resolves-from-graph` | **add** | Producer: `spellDefinitionNode` (`properties.template`); consumers: the nine `resolveSpellTemplate` sites. Live-read proof: a generated spell casts through `use × Power` and through a step |

`scripts/interface-contracts.ts` and `npm run generate-interface-map` are updated in the same PR (the two-file edit).

## Constants table

In `src/data/spell-generator-tables.ts` unless noted.

| Constant | Default | Purpose |
|---|---|---|
| `SPELL_GEN_ENABLED` | `true` | Master switch; `false` restores today's seeding exactly |
| `SPELL_LIBRARY_SHAPE` | `{1: 2, 2: 2, 3: 1, 4: 1}` | Spells per tier in each tradition's library |
| `SPELL_GEN_DELIBERATE_SHARE_BY_TIER` | `{1: 0, 2: 0.33, 3: 0.5, 4: 1}` | Ruling 1: most magic is woven, a marked few are cast |
| `SPELL_GEN_ARENA_MIX` | prototype `ARENA_MIX` | Arena draw weights, restricted by the tradition's themes |
| `SPELL_GEN_ROLE_FIT_WEIGHT` / `SPELL_GEN_OFF_ROLE_WEIGHT` | `1.0` / `0.05` | Tradition choice: a role's own traditions, with a thin tail of others |
| `SPELL_GEN_FACTION_LEAN` | `1.0` | Strength of the faction's reach lean on tradition choice |
| `SPELL_GEN_FOUNDATION_SHELF_WEIGHT` | `0.3` | How often a tradition draws a Foundation sphere it is shelved under |
| `SPELL_GEN_FOUNDATION_MIN_TIER` | `3` | Elder magic stays rare: Foundation-sphere spells only at tier 3–4, never seeded at tick 0 |
| `SPELL_GEN_CORE_REPEAT_DECAY` | `0.15` | Weight × this per earlier spell on the same core in this world |
| `SPELL_GEN_MAX_REROLLS` | `3` | Validator rerolls before a slot is left empty |
| `SPELL_GEN_MAX_RIDERS` | `1` | THR-1232: free composition holds one block deep |
| `SPELL_GEN_MAGNITUDE_BY_TIER` | prototype `TIERS` | Bonus, penalty, duration and chance envelopes per tier |
| `THEME_PRICE_LEAN` | prototype, 15 themes | Rule 2: the price lean a tradition's primary theme sets; a 0 is a hard ban |
| `TIER_PRICE_WINDOW` | prototype | Soft tier multipliers on the layer draw; widened, never overriding the lean |
| `SPELL_GEN_DOOM_RATE_CAP` | `0` | Lane decision 4: no generated spell carries `doom_rate_multiplier` |
| `SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE` | `0.15` | Population envelope: carried transgressions per library |
| `SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET` | `0.25` | Seeded carriers' summed per-tick quintessence drain, as a share of their summed `QUINTESSENCE_PASSIVE_REGEN` |
| `SPELL_GEN_MAX_HOLDER_SHARE` | `0.2` | Census bar: no single spell held by more than this share of a world's casters (today: one spell, 100%) |
| `SPELL_NOTICE_SEVERITY_BY_TIER` | `{1: 0.2, 2: 0.35, 3: 0.5, 4: 0.7}` | How strongly a transgression is noticed |
| `SPELL_NOTICE_ONE_PER_SPELL` | `true` | One notice mark per caster per spell |
| `SPELL_GEN_GATE_SEEDS` | `[7, 42, 99]` | Gate-test seeds |

## Tracing

```ts
// spell.library_built — one aggregate per world
interface SpellLibraryBuiltTrace extends TraceBase {
  category: 'spell.library_built';
  traditions: number;                    // traditions in use
  spells: number;
  byTradition: Record<string, number>;   // casters per tradition
  emptySlots: number;                    // slots the validator could not fill
  soulDrainShare: number;                // measured vs SPELL_GEN_WORLD_SOUL_DRAIN_BUDGET
}
// spell.generated — each generated spell
interface SpellGeneratedTrace extends TraceBase {
  category: 'spell.generated';
  spellId: string; name: string; traditionId: string; coreId: string;
  tier: number; agency: 'fate_woven' | 'deliberate'; arena: string;
  priceLayer: string; sphere: string; seedKey: string; rerolls: number;
}
// spell.generate_fallback — a slot left empty
interface SpellGenerateFallbackTrace extends TraceBase {
  category: 'spell.generate_fallback';
  traditionId: string; tier: number; slot: number; seedKey: string;
  reason: 'no_eligible_core' | 'validator_exhausted' | 'threw';
  lastProblems: string[];
}
// spell.notice_placed — a transgression was noticed
interface SpellNoticePlacedTrace extends TraceBase {
  category: 'spell.notice_placed';
  casterId: string; spellId: string; markId: string; severity: number;
  site: 'cast' | 'carried';
}
```

`spell.seeded` (THR-1571, `SpellSeededTrace` in `src/types/trace.ts`) gains `byTradition` and `fromLibrary`. All four interfaces follow the live spell traces' shape (`SpellCastResolvedTrace extends TraceBase { category: … }`, `trace.ts:2772`) and are registered in the `trace.ts` category union and registry beside them.

## Fail-soft table

| Failure | Fallback |
|---|---|
| No core fits a slot | Slot left empty; `spell.generate_fallback` (`no_eligible_core`) |
| Validator still finds problems after the rerolls | Slot left empty; trace carries the problems |
| A tradition's library has no step-usable spell | Its casters are seeded from the sphere shelf and cantrip, today's path |
| `casterTraditionOf` finds no weight (no role, no faction) | Uniform over the 34, still hashed; never throws |
| The generator throws | Caught in `buildSpellLibrary`; that tradition gets no library; `threw` traced; worldgen continues |
| `resolveSpellTemplate` meets a node with no `template` | Returns `undefined`, which every caller already handles as `no_spell_template` |
| Soul-drain budget exceeded | Heaviest carried transgressions rerolled to strain until under budget; the share is traced |
| A notice family later matches nothing | The gate test fails at CI; at runtime the mark simply never reveals |
| `SPELL_GEN_ENABLED = false` | Today's seeding, byte for byte |

## Blast Radius

`src/types/effects.ts` sits among the ≥100-importer type files (`.codesight/graph.md`). This plan adds **nothing** to it: `SpellTemplate` already carries every field a generated spell needs (`agency`, `arena`, `castReach`, `castProse`, `passiveEffects`). `GeneratedSpellProvenance` lives in `src/engine/spellGenerator/types.ts`. `CastResult` (`spellCasting.ts`, not high-import) gains an optional `notice`.

`src/types/trace.ts` is also a ≥100-importer file (146 importers, `.codesight/graph.md`). It gains four trace interfaces and two optional fields on `SpellSeededTrace` — an **additive** append to the category union and registry, beside the THR-1571 spell traces. No existing member changes.

**Behavioural blast:**

1. Seeding hands ~100 casters different spells per world instead of one shared cantrip. Carried effects now apply across more Reaches.
2. Nine call sites move from `getSpellTemplate` to `resolveSpellTemplate`; authored ids resolve identically.
3. Transgression casts now place hidden marks, a new producer into `hiddenMarks`.
4. Worldgen gains one library build; no other stream is consumed.

## Three-pillar check

- [x] Engine pillar present — tradition derivation, generator, validator, library, resolver, seeding and learning, notice
- [x] Content pillar present — ported cores with two flavour lines, 34 tradition rows, role themes, Foundation shelves, cast vocabulary, review path
- [x] UI pillar present — *Taught by*, *What it does*, *What it costs*, *What goes wrong* on the sheet; debug levers; the review link once level
- [x] Wiring section connects them

## Vision audit

- **Systemic over scripted.** The world writes its magic from authored ideas dressed by who teaches it. A priest's spell and a necromancer's differ because their traditions do.
- **Narrative over mechanical perfection.** A tradition prices its magic by what it is (rule 3's "cost is characterization"), and a dark art is noticed.
- **Prose, not numbers.** The sheet speaks in words; no new number reaches the player.
- **Elder magic, discovered not selected** (taste profile). A tradition is something a mortal belongs to and a player learns by watching, not a menu. This plan gives the tension a home rather than resolving it: the god sees what a mortal was taught. Foundation-sphere (elder) spells exist only at tiers 3–4 and are never seeded, so elder magic is reached by a mortal climbing their tradition, not handed out at tick 0 (§ The Foundation shelves).
- **You shift probabilities; you do not direct characters.** Unchanged: mortals cast by their own read; the god bends the roll.

- [x] This plan does not contradict any Vision premise
- [x] No Vision edit is needed, so none is in scope

## Rulebook impact

`Docs/canon/rulebook.md` has no Spells heading; the THR-1571 rules are the paragraph beginning **"Casters start the world with a spell, and a cast does what it says."** (:458). This plan appends to that paragraph, tagged `[IMPL — THR-1572]`:

> Every caster belongs to a tradition, chosen by the work they do and the people they serve. A tradition teaches its own spells, and a world writes them fresh from a set of authored ideas. A tradition prices its magic its own way: holy and healing arts never cost the soul, and death and curse arts never come free. Dark arts are noticed, and what is noticed can come out later.

The S1 line *"Priests, healers, scholars and other casters start the world knowing one spell of their tradition"* becomes true as written.

- [x] This plan changes a rule of play (what casters know and what their magic costs)
- [x] `rulebook.md` and the quick reference are updated in the same PR

**UL.** **Tradition** is used in canon and code comments with no UL entry (0 hits in `Docs/ubiquitous-language/` for a Tradition definition, grep 2026-09-30). The executor proposes it as a `UL-proposal` issue in the same pass as the build — *a school of magic a caster belongs to; it decides what spells they can learn and how that magic is paid for* — seated under the standing delegation with Christian's veto retained, and cross-links **Spell**.

## NFP-compliance table

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | PASS | 22 named constants; every envelope, lean, share, budget and severity is data |
| 2. Inspectability | PASS | Four traces; `seedKey` reproduces any spell; provenance on the node; three debug levers and two CLI commands |
| 3. Determinism | PASS | Hashed seed keys, one stream per table, no worldgen stream consumed; determinism asserted in the gate |
| 4. Fail-soft | PASS | Nine-row table; every failure falls back to today's seeding or an empty slot; nothing throws into worldgen or the tick |
| 5. Narrative over mechanical | PASS | Traditions characterize price and vice; notice is story; the honest vocabulary keeps the words true |
| 6. Additive over destructive | PASS with note | New modules and optional fields; one repointing across nine call sites (authored ids unchanged); a master switch restores today |
| 7. Performance budget | PASS | One library build per world; no per-tick generation; tick cost measured against the runtime's 5% budget |

## Done when

- [ ] CLI, seed 42 and seed 99, medium, tick 0: `spell.library_built` reports the traditions in use and zero `emptySlots`; `spell.seeded` reports every caster seeded with `fromLibrary` ≥ 90% of casters; **no single spell is held by more than `SPELL_GEN_MAX_HOLDER_SHARE` (0.2) of casters** (today: one spell held by 100%). Both censuses in the closeout
- [ ] The gate test passes: zero validator problems and zero read-back failures across `SPELL_GEN_GATE_SEEDS` × all 34 traditions; every core fires; every library holds a step-usable spell; the dishonest control batch fails; determinism holds
- [ ] A generated deliberate spell casts through `use × Power` and through a step (`?spell=` on a generated id), and its writes are on the graph on `success` and absent on `failure` (both arms, one test)
- [ ] A transgression cast places exactly one `forbidden_contact` mark on the caster; a second cast places none
- [ ] `SPELL_GEN_ENABLED = false` reproduces today's `spell.seeded` exactly (regression test)
- [ ] A 300-tick medium census (seed 42): cast count, backlash count, `spell_price` quintessence spent, notice marks placed and revealed; the soul-drain share under budget; tick cost within `POWER_UPKEEP_TICK_COST_BUDGET_PCT` of the pre-change baseline (`npm run measure:tick-cost -- --map medium --ticks 100`, both numbers)
- [ ] `npm run cli` → `generate spells 30 --seed 42` prints thirty readable spells with verdicts
- [ ] The sheet shows *Taught by*, *What it does*, *What it costs* and *What goes wrong* for a generated spell — browser-verify via Playwright at 1920×1080 on `?view=game&seeded&size=medium&testavatar&spell=<generated id>`, four-part evidence (screenshot, console, an `await window.__DEBUG.getSpellLibraries()` assertion, UI-Laws line 1, 4, 13/14, 17, 21, 33, 37, 56)
- [ ] Interface contracts and map, wiring checklist, systemic wiring guide, rulebook and quick reference, `content-objects.md` (generated spells are Powers minted from the generator), the Tradition UL proposal, and any wiki page whose `sources` match are updated in the same PR; systems inventory regenerated
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build`, `npm run test:heavy` and a 30-tick CLI smoke pass
- [ ] Closing commit body includes the close keyword for THR-1572 on its own line

## Kill criteria

- **The gate cannot reach zero read-back failures for the ported cores** → shrink the vocabulary to what reads back; a core that cannot survive is dropped, never faked. If fewer than two cores survive for a common arena × agency × tier cell, the library shape shrinks for that cell rather than repeat one sentence.
- **Tradition choice collapses** (census: one tradition holds more than half of the casters on either seed) → the role themes or faction lean are wrong; retune `ROLE_THEMES` or `SPELL_GEN_FACTION_LEAN`. The generator stays.
- **The world reads as over-magicked or too dark** (cold playtest or the census shows notice marks on more than a quarter of casters) → lower `SPELL_GEN_CARRIED_TRANSGRESSION_MAX_SHARE` or `SPELL_GEN_OFF_ROLE_WEIGHT`. One constant each.
- **Christian reads a thirty-spell sample and calls it flat** → the machine stays; the cores and flavour lines are re-authored through the CLI review path, exactly as THR-1232 was judged.
- **Christian vetoes a lane decision** → each is one function, one constant or one table row: tradition derivation (`casterTradition.ts`), the shared library (`SPELL_LIBRARY_SHAPE`, or per-caster slots), the template's home (`resolveSpellTemplate`), the doom cap (`SPELL_GEN_DOOM_RATE_CAP`), the notice home (`CastResult.notice`), the write rule (`SPELL_CAST_HONEST_VOCABULARY` rows). Revise on this ticket before build.

## Coordination block

**Suggested model:** opus — a port of a 1700-line prototype into five engine modules, 34 authored tradition rows and ~37 cores re-measured against two vocabularies, a read-back harness, and a nine-site repointing; judgement-heavy content and cross-module engine work.

**Parallel-safe with:** [THR-1664](https://linear.app/threadbare/issue/THR-1664) (the ruin visit: relocation and appointment code, not spells); [THR-1677](https://linear.app/threadbare/issue/THR-1677) and [THR-1678](https://linear.app/threadbare/issue/THR-1678) (journeyman and expert encounter content: encounter data files, not spell or seeding code); [THR-1685](https://linear.app/threadbare/issue/THR-1685) (a reputation chip's tag: chip adapters, not the attachments tab's Power row).

**Mutex with:** [THR-1683](https://linear.app/threadbare/issue/THR-1683) (both edit `src/engine/spellCasting.ts` — this plan adds `CastResult.notice`, that one adds the per-cast channel and the target filter; whichever lands second rebases, and if THR-1683 lands first the executor flips its rows in `spell-honest-vocabulary.ts` to `live` behind read-back cases); [THR-1672](https://linear.app/threadbare/issue/THR-1672) (both change how a caster comes to know a spell in `create × Power` and `seedAttachments.ts`). Re-check at claim time for any In-Dev ticket editing `src/components/Game/tabs/AttachmentsTab.tsx`.

**Files to touch:**
- Create: `src/engine/spellGenerator/{casterTradition,generateSpell,validateGeneratedSpell,describeSpell,spellLibrary,types}.ts` and `__tests__/spellGenerator.gate.test.ts`
- Create: `src/data/spell-generator-cores.ts`, `src/data/spell-generator-tables.ts`, `src/data/spell-honest-vocabulary.ts`
- Edit: `src/data/spell-templates.ts` (`spellDefinitionNode` writes a generated template; `resolveSpellTemplate` beside `getSpellTemplate`)
- Edit: the nine `getSpellTemplate` call sites (§ Substrate inventory)
- Edit: `src/engine/seedAttachments.ts` (library path in `seedSpellKnowing`), `src/engine/worldSeed.ts` (library build before `seedSpellKnowing`, :2382), `src/engine/gameInit.ts` (notice marks for seeded carried transgressions, once `state.hiddenMarks` exists)
- Edit: `src/engine/spellCasting.ts` (`CastResult.notice`) and its two call sites (append the mark)
- Edit: `src/types/trace.ts` (four trace interfaces, two `SpellSeededTrace` fields — additive)
- Edit: `src/data/undertaking-objects.ts` (`create × Power` offers the tradition library)
- Edit: `src/components/Game/tabs/AttachmentsTab.tsx` (four optional lines)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, `scripts/cli.ts`; `scripts/interface-contracts.ts`; rulebook; `content-objects.md`; wiring checklist; systemic wiring guide

## Notes for the executor

- **Port, don't reinvent.** The prototype is on [`proto/thr-1572-spell-generator`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1572-spell-generator/Docs/audits/2026-09-24-proto-spells). Its `liveness()` table (`generator.mjs:91-127`) predates the power runtime and the fight block: `inflict_condition` and `fight_clock` are live now, `teleport` and `forced_move` execute since THR-1571, and `duration` is modifier-only when cast. Re-measure; trust `executeEffect`, not the prototype's badges. Its `mulberry32` and `fnv1a` are replaced by `drawFromTable` and `hashSeed`.
- **Reuse the item generator; do not fork it.** `validateGeneratedItem`'s per-effect checks, `describeItem`'s words and `reviewWorld`'s three-mortal world are imported. If a helper is private, export it from its own module rather than copy it.
- **The sphere shelf is empty at tick 0 on purpose-less grounds**, not by design: no caster carries a sphere yet. Do not "fix" it by giving casters spheres in this ticket — that changes every sphere reader in the game. Tradition is the key this plan uses; the sphere shelf stays as the fallback.
- **A generated id must not collide with an authored one.** Authored ids are `spell_<name>`; generated are `spell_gen_<tradition>_<tier>_<slot>`. A data test asserts no authored id starts `spell_gen_`.
- **Out of scope, deliberately:** per-caster unique spells; spells as divine gifts and found tomes ([THR-1672](https://linear.app/threadbare/issue/THR-1672)); the per-cast channel and ally/enemy filter ([THR-1683](https://linear.app/threadbare/issue/THR-1683)); giving casters spheres at worldgen; minting traditions as graph nodes; a tradition page; monster casts; generated innate powers (THR-1671's eight stay authored).
- **The gate test may be slow** (it mints into review worlds for 3 seeds × 34 traditions). If it exceeds the fast lane's budget, tag it `// @vitest-lane heavy` and keep a one-seed, three-tradition smoke in the fast lane.

> Brainstorm companion: `Docs/plans/2026-09-30-thr-1572-seeded-spell-generator-brainstorm.md`

## Intent-judge verdict

*2026-09-30, judged on fable, cold context; proposal at `Docs/plans/.intent-proposals/2026-09-30-thr-1572-seeded-spell-generator.md`. Substrate spot-checked across 20+ files; all claims held (seedSpellKnowing :291, the nine `getSpellTemplate` sites, the modifier-only arms, `phaseDoom.ts:349-355`, the four contract ids, `payCosts` → soul price).*

- **Run 1 — Allow.** Ten dimensions PASS, one GAP (blast radius: the new traces touch `src/types/trace.ts`, 146 importers, unlisted). Five precision fixes recommended, all folded in before the PR: `trace.ts` added to Blast Radius and Files to touch; the trace interfaces reshaped to the live `extends TraceBase { category }` pattern; the rulebook edit anchored to the THR-1571 paragraph (:458), since there is no Spells heading; both overlay readers cited; `payCosts` named as the cost writer, with `attachment_consume` refused by policy.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-30 (auditors on sonnet, run after the intent-judge Allow)*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Named constants table (`SPELL_GEN_*`, `THEME_PRICE_LEAN`, envelope budgets); no inline magic numbers. |
| 2. Inspectability | PASS | Four traces, `seedKey` and provenance on the node, debug levers, CLI, and a wiring table with trace and debug columns. |
| 3. Determinism | PASS | Hashed seed keys, one `drawFromTable` stream per table, no worldgen streams consumed, determinism test in the gate. |
| 4. Fail-soft | PASS | Nine-row table; rerolls, then an empty slot, then today's seeding; generator throws are caught. |
| 5. Narrative over mechanical | PASS | Tradition-characterized price and vice, notice as story, game-register prose. |
| 6. Additive over destructive | PASS-with-note | New modules and optional fields, plus `SPELL_GEN_ENABLED` restoring today's seeding. The note is the repointing of nine `getSpellTemplate` call sites and the edit to `seedSpellKnowing`. |
| 7. Performance budget | PASS-with-note | One library build per world, no per-tick generation, tick cost measured against the 5% budget. The note is that the soul-drain reroll loop and the gate test's speed are unmeasured, though a heavy-lane fallback is named. |

NFP AUDIT: PASS-with-notes

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Five module specs, graph/edge changes (no new node type), resolution logic, hashed seed keys and one stream per table, and an explicit note that no new tick phase is needed. |
| Content | present-and-substantive | Cores ported with two flavour lines each, 34 tradition rows, role themes, Foundation shelves, prose register, honest-vocabulary tables, three-gate review path. Encounter templates are marked N/A with a reason. |
| UI | present-and-substantive | Four conditional lines on the attachments tab, UI Laws cited, debug levers and `?spell=`, hex map marked N/A with rationale, Playwright named, review gate tied to the level-system rule. |

Wiring maps each module to a call site or worldgen phase, UI component, GameState flow, trace and debug lever. Substrate: the inventory lists `spell`, `itemgenerator` and Hidden Marks as ACTIVE and the plan extends or reuses all three; no spell generator, tradition-assignment or library subsystem exists to duplicate.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: north star (mortal as a person; the world resolves) extended; core loop (cards bend odds, fate picks the band) confirmed; non-negotiables 1, 2, 3, 4, 7 confirmed; emergence vs authorship confirmed; hidden vs shown touched. Contradictions: none. Two soft leans: the sheet shows *Taught by* at tick 0 (toward shown over discovered), and the Foundation shelves could make elder magic common. *(Resolved after the audit: Foundation-sphere spells are confined to tiers 3–4 and never seeded — `SPELL_GEN_FOUNDATION_MIN_TIER` — per the taste profile's "Foundation spheres are elder magic … discovered". The* Taught by *line stays, named as a tension in the brainstorm.)*

VISION AUDIT: PASS-with-notes
