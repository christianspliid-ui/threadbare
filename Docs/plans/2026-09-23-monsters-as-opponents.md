> **title:** Monsters as opponents — the lair's elite gets a fighting card (Physical Conflict plan doc 3 of 6)
> **linear_issue:** THR-1258 (wayfinder map, closed 2026-09-23; slices filed on handoff)
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `done` · Content `done` · UI `N/A here — the monster's player surface is plan doc 4 (see § UI pillar)`

# Monsters as opponents — the lair's elite gets a fighting card

*Every major lair already mints a named monster that sits in its den and does nothing. This doc gives it a card to fight with, a temper to break by, a place in the world's scenes, and a lair that answers when it falls.*

## Why this is load-bearing

Lairs seed, escalate and spread, and since THR-1319 they can be worn down by presence. But the named elite each major lair mints, 14–26 of them on a medium world by mid-game (measured, THR-1268), is **furniture**:
- no system reads `namedEliteId`;
- the elite hunt templates bind no cast;
- the elite leaks into systems meant for mortals: the HUD population count and the plot's target list (THR-1268 §4).

The fight block (plan doc 2) needs an opponent with a card, and the lair loop needs a way to answer a felled monster. This doc supplies both with **no new node type and no new actorType**. A monster is a class of Mortal, like a company is a class of group (THR-1268 §1).

The rules come from the closed Physical Conflict map (THR-1258). The decision tickets are named inline: THR-1268 (monsters), THR-1267 (triggers), THR-1262 (substrate), THR-1531 (numbers), THR-1530 (powers vocabulary).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Lair escalation (`lairEscalation.ts`: `createNamedElite` ~210-249, major→legendary ~447-470) | 🟢 ACTIVE | **extends**: the elite is minted with `monsterState` and a temper trait; legendary escalation hardens the card |
| Lair clearing (`lairClearing.ts`, THR-1319: `clearLair` 191-220, `clearingProgress`, `isChallenger` ~101-108) | 🟢 ACTIVE | **extends**: felling or driving off the monster feeds the same clearing, through `clearLair` and the progress counter. There is no second clearing path |
| Monster factions (`MONSTER_FACTION_DEFINITIONS`, eight creation spheres) | 🟢 ACTIVE | **reads** the sphere → family mapping; factions unchanged |
| Death funnel (`markMortalDead`, `agentLifecycle.ts:225`, THR-1430) | 🟢 ACTIVE | **calls** it for a felled monster (cause `'fight'`, retain) |
| Encounter cast binding: the legacy route (`EncounterSupportActorSpec`, `findExistingActorSupport` / `resolveActorSupport` in `encounterSupportBundle.ts`) and the scored binder (`resolveActorSupportViaBinder`, `encounterSupportBundle.ts:465`, → `binding/binder.ts` `resolveBinding`, THR-1296; opted into per template by `useScoredBinder`, `:610`) | 🟢 ACTIVE | **extends** the legacy route with `matchProperty`, so a template binds the monster already present (closes THR-1274 for monsters). **A spec carrying `matchProperty` always takes the legacy route**, even on a `useScoredBinder` template: the binder reads no property match, and its `unresolved` is an answer it honours (`:621`), so it would refuse the beast. The binder already excludes the dead (`binder.ts:160`) |
| Movement arrival hook (`phaseMovement.ts` arrival branch ~153-361) | 🟢 ACTIVE | **extends** with the lair-arrival fight trigger |
| Traits (`has_trait` edges, trait definition nodes seeded at world init alongside `CONDITION_TRAIT_DEFINITIONS`) | 🟢 ACTIVE | **extends** with four temper trait definitions (content) |
| Monster encounter content (`monster-encounter-content.ts`: `monster.hunt.minor`, `monster.hunt.named_elite`) | 🟢 ACTIVE (flavor only) | **extends**: `monster.hunt.named_elite` gets a fight block against the bound monster; `monster.hunt.minor` is unchanged (§ Encounter templates) |
| Encounter draw gates (`encounterFilterPipeline.ts`; `requiresOpposingBand` at `:343`) | 🟢 ACTIVE | **extends** with `requiresLiveMonster`, the same pattern |
| Content catalogs and tags (`content-objects.ts` Trait row `:334`, `contentCatalogs.ts`, `content-tags.ts`; canon `Docs/canon/content-objects.md`) | 🟢 ACTIVE | **extends**: the temper catalog is registered and `#temper` is seated |
| Fight block (plan doc 2: `readOpponentCard`, `advanceFightClock`, `onFightEnded`, `fight.lair.confront`) | ⚪ planned | **consumed**; this doc's slices are blocked by the fight-block slices they read |

Runtime population, measured by THR-1268 on medium maps:

| | tick 100 | tick ~175 |
|---|---|---|
| Seed 42: elites | 14 | 26 |
| Seed 42: lairs (minor / major / legendary) | 8 / 0 / 14 | 5 / 4 / 22 |
| Seed 99: elites | 16 | 21 |

Every elite gets a card at mint (graphs are in-memory only, so no migration is owed).

Greps on `main` (2026-09-23), each 0 files in `src/`: `isMonster(`, `monsterState`, `MONSTER_FAMILIES`, `requiresLiveMonster`, `matchProperty`, `fightCooldowns`, `trait.temper`, `'#temper'`. Nothing here rebuilds an existing piece.

## Engine pillar

### Systems design

**1. The monster card** (THR-1268 §1, §3). `createNamedElite` writes one typed bag, following the `battleState`/`armyState` discriminator pattern:

```ts
interface MonsterState {
  readonly family: MonsterFamilyId;          // from the lair's dominantSphere
  readonly dread: FightRatingWord;           // plan doc 2's word type: FB1 defines it, so M1 is blocked by FB1
  readonly might: FightRatingWord;
  readonly nerveReach?: ReachDomain;
  readonly clashReach?: ReachDomain;
  readonly clockSize: number;                // MONSTER_CLOCK_BY_TIER.major at mint
  readonly clockFilled: number;              // 0 at mint; written only by advanceFightClock
  readonly clockUpdatedTick: number;
  readonly temperShown: boolean;             // false at mint; set true by the fight's temper checkpoint (plan doc 2, FB4) or a hunt's track step (plan doc 6); read by the lair card (plan doc 4)
}
```

- The family table `MONSTER_FAMILIES` lives in the new `src/data/monster-families.ts` (the Content pillar has the rows).
- A lair whose `dominantSphere` is a **foundation** sphere has no monster faction (R2's silent `undefined`) and falls back to `MONSTER_FAMILY_FALLBACK` (`'beast'`, the Force family).
- The elite also receives its family's **temper trait** as a `has_trait` edge: `trait.temper.stubborn|berserk|skittish|bargainer`. Temper is a **Trait** (the `trait_template` content kind, a new `temper` class), not a property, so spells, items and cards can later calm or enrage a monster through the existing `trait_grant` vocabulary (THR-1268 §2, THR-1530 §5). Plan doc 2's `readOpponentCard` reads it by id prefix (`trait.temper.*`).
- **Temper is not an Innate Power.** UL **Innate Power** (`Docs/ubiquitous-language/Traits.md` § Innate Power) is a *Power*: a capability stamped on monsters at seeding, with no code anchor yet. Temper is how a creature breaks, not something it can do. THR-1530 §5's phrase "a `trait_grant` innate power" is corrected on that ticket. The mint in `createNamedElite` is the seam where the Powers map will later stamp Innate Powers; nothing here stands in for them.
- **Nor is it the `innate` trait category** (`TraitCategory`, `src/types/traits.ts:18`), which is a worldgen-minted permanent class. Temper traits carry `subcategory: 'temper'`, an additive member of that union. No exhaustive map over the union exists today (`Record<TraitCategory` has 0 hits).

**2. Legendary escalation hardens the card** (THR-1268 §3). When a lair goes major → legendary (`lairEscalation.ts` ~447-470), its elite's card changes:
- `clockSize` rises to `MONSTER_CLOCK_BY_TIER.legendary` (5);
- `dread` rises one word, capped at severe;
- `clockFilled` is **not** reset. A beast wounded before its den grew still carries the wounds.

Most lairs reach legendary by tick ~100, so the legendary card must stay beatable by a capable mortal over several visits, or by a company. That's why it gets +1 clock and one step of dread rather than severe/severe/6 (THR-1531's "legendary horror" row is reserved for authored set pieces).

**3. `isMonster(node)` and the exclusions** (THR-1268 §4). The predicate is `node.properties.isMonsterElite === true || node.properties.monsterState != null`. It lives in `src/engine/monsters/isMonster.ts` beside the decision-tier predicates. Engine call sites:

| Site | Today | Change |
|---|---|---|
| The plot's `isPlottableMortal` (`undertaking-objects.ts:1853-1857`) | **live leak**: `destroy × mortal` can target an elite through the social path | exclude monsters (hunts are plan doc 6's own branch) |
| `phaseNpcGraduation` scan (`npcGraduation.ts` ~370-378) | latent leak (`bumpImportance` has no caller today) | exclude monsters from promotion |
| `lairClearing.isChallenger` (~101-108) | reads `isMonsterElite` directly | call the predicate (one definition) |
| Social visibility (`socialEncounterGeneration.findVisibleAgents`) | safe only by property-shape accident | explicit guard |
| `getAllActorsAtLocation` callers (two in production) | safe only by property-shape accident | `debugWorldSpawnTools.ts:500` needs no guard: it reuses an NPC by `npcRole` and name, and monsters carry no `npcRole`. `findExistingActorSupport` (`encounterSupportBundle.ts:160`) is **M2's**, because it sits in M2's file: its role-match branches exclude `isMonster`, and its `matchProperty` path is how monsters are cast |

The UI leak is the `WorldPulse` population count (`src/components/Game/WorldPulse.tsx:64`, **live**: it counts every `actorType === 'individual'`). It is owned by plan doc 4's **F1** ("Monsters named and counted right", blocked by M1), since this doc ships no component change. The ownership is also recorded on THR-1272.

**4. Monsters in scenes: cast binding and the hunt gate** (THR-1268 §5, closes THR-1274 for monsters). `EncounterSupportActorSpec` gains the additive `matchProperty?: { key: string; value: unknown }`.
- `findExistingActorSupport` checks it **before** role matching, among the actors at the encounter's location.
- **The dead are never cast.** Today the candidate filter is only `actorType === 'individual'` (`encounterSupportBundle.ts:160-161`), and a retained death keeps its `located_at` edge ("Edges are left standing", `agentLifecycle.ts:269`). So a band casualty can be cast as a scene's guard today. M2 adds `deceased !== true` to the candidate filter for **every** spec. That is a latent-defect fix, tested, and it is also what stops `matchProperty` from binding a felled monster's body.
- When `matchProperty` is set, materialization is skipped. The cast system never mints a monster; `createNamedElite` owns creation.
- **Routing:** a spec with `matchProperty` skips `resolveActorSupportViaBinder` and goes straight to the legacy `resolveActorSupport`, whatever the template's `useScoredBinder`. It is the one spec shape the binder cannot answer.
- **An unmatched spec is simply unbound.** It lands in `unresolved` (`encounterSupportBundle.ts:631`), which `prepareEncounterSupportBundle` drops (`:659`). Nothing skips steps: `'blocked-primitive'` is an authored delivery value, not a runtime path.
- **So the hunt is gated at the draw, not rescued at the bind.** A new template flag, `requiresLiveMonster?: boolean`, follows the `requiresOpposingBand` pattern. It is checked in `encounterFilterPipeline.ts` beside that gate (`:343`): the entry's `locationId`, resolved through `resolveToParentLocation` (`sublocationShape.ts`), must be a lair whose `namedEliteId` names a node that `isMonster` and is not `deceased`. The check is O(1) per entry. Like its sibling, it can only hide content.
- **If the monster dies between the draw and the fight** (another mortal fells it first), `opponentRef: 'beast'` is unbound or names a deceased node. Plan doc 2 then ends the block at its first fight step, `broke_off` with reason `no_opponent` or `opponent_gone`, and never falls back to the action's target. The aftermath reads `fight:broke_off`. Every line of prose that names the beast sits inside `{?has_cast:beast}` (`proseEnrichment.ts:936-954`).
- A template can then bind `{ key: 'beast', kind: 'actor', matchProperty: { key: 'isMonsterElite', value: true } }` and use `{cast:beast}`, `opposes: 'beast'` and `opponentRef: 'beast'`.
- **The hunt's other entrances.** The draw gate covers the draw. Two more routes reach `monster.hunt.named_elite`:
  - **its own return seed**, `named_elite_creature_returns` (`monster-encounter-content.ts:425-437`), an `encounter_seed` by `templateId`. A templateId seed skips the draw filters (`encounterSeeding.ts:669-671`), targets the seeded mortal (`:383`), and never gets a support bundle. So M2 sets **`inheritContext: true`** on it: the seed carries the lair target and the `beast` binding. A beast that died since ends the fight `opponent_gone`, and a hunter who has left the hex ends it `separated` (plan doc 2's rules), never a fight against nothing;
  - **the Adventurers' Guild** (`faction-definitions.ts:152`), whose quest candidates are built at the member's current location (`factionQuestGeneration.ts:71`). The gate hides the named-elite hunt there except when the member stands at a lair with a living beast. **That is intended:** the Guild's offer is the hunt in front of you. Going after a beast from afar is plan doc 6's hunt undertaking.

**5. What felling it does to the lair** (THR-1268 §6, THR-1270). This extends plan doc 2's `onFightEnded(state, action, ctx)` for fights whose opponent satisfies `isMonster`. `ctx` is plan doc 2's `FightEndContext` (`tick`, `rng`, `runtime`, `overrideCtx`), threaded from `executeStepResult`. The `'fight'` member of `MortalDeathCause` (`agentLifecycle.ts:168`) is added by plan doc 2's FB2.

| Result | Writes |
|---|---|
| `overcome` | (1) `markMortalDead(state.graph, monsterId, ctx.tick, { cause: 'fight', byActorId: fighterId, mode: 'retain' }, ctx.runtime, ctx.overrideCtx)`. On `died`, the monster is retained, deceased, with `slainBy` set. (2) **Only on `died`**, the lair: at **major**, `clearLair(state, lair, victorsFactionId)` (credit via the victor's first `member_of`, the same rule as `factionOf` in `lairClearing.ts`); at **legendary**, `clearingProgress += MONSTER_FELLED_CLEARING_PRESSURE × LAIR_CLEARING_RESISTANCE.legendary`, and the monster faction remains (the raider question, THR-767). The lair's `namedEliteId` is cleared by `clearLair` or explicitly. (3) After a `clearLair`, `touchStructure(ctx.runtime)`, mirroring `lairEscalation.ts:591`: the subtype flipped outside the escalation phase that normally bumps it, so encounter scoring and the distance matrix would otherwise read stale. |
| `overcome`, but the funnel returns `not_a_mortal` (already dead: a concurrent fight felled it first), `warded` or `echo` | **Nothing to the lair, so there is no second clearing credit.** `monster.felled` traces `lairCleared: false` and `funnel: <outcome>`. Plan doc 2 records `overcome` only for the write that filled the clock, so `not_a_mortal` is the defensive case |
| `driven_off` | `clearingProgress += MONSTER_DRIVEN_OFF_CLEARING_PROGRESS` (1) |
| **every monster result** | The branch records what it wrote on the resolved action as `fightState.lairOutcome = { lairId, felled, lairCleared, clearingProgressAfter }`, the shape plan doc 2's FB2 declares. Plan doc 4's "felled" and "lair cleared" chips read this field, never the trace buffer |
| `bargained`, `broke_off`, and every defeat | nothing to the lair |

Plan doc 1 owns everything that happens to the *fighter*.

**6. Walking into the lair** (THR-1267). In `phaseMovement`'s arrival branch, after the final tier (location or place) is known, a check fires when the agent's resolved position is a `lair` location, or a place inside one, whose `namedEliteId` names a living monster. The agent must not be `isMonster` or deceased, and must be **idle**: `isUnifiedAgentIdle(state.unifiedActions, mortalId)` (`unifiedActionLifecycle.ts:241`), the busy test the `encounterSeeding.ts:696-703` pattern applies. The check then:
- **gives way to a deliberate hunt.** A mortal who walked here *to hunt* arrives holding `movementState.targetEncounterId` (set when the hunt was chosen from another hex, `phaseAgentDecision.ts:1681`). If that names a template carrying `requiresLiveMonster`, the trigger skips (`skipped: 'arriving_for_hunt'`) and the hunt's own fight follows when the mortal takes it up. THR-1267 makes the hunt "the deliberate entrance"; the forced confront is for everyone who walks in *without* meaning to. The check reads `targetEncounterId` before anything in the arrival branch clears it. Plan doc 6's H2 adds the same skip for a hunter keeping a hunt appointment;
- confirms the pair is off cooldown: `state.fightCooldowns?.[fightPairKey(mortalId, monsterId)]` is at most `tick − FIGHT_TRIGGER_COOLDOWN_TICKS`. **One key rule serves every fight trigger** (this doc and plan doc 5's grudge duels): `fightPairKey(a, b)` joins the two ids, sorted, with `|`. `fightCooldowns` is an additive optional `GameState` map of transient bookkeeping, not a relationship. It is **pruned on write**: whenever a trigger writes a key, entries older than `FIGHT_TRIGGER_COOLDOWN_TICKS` are deleted, since they can no longer block anything;
- spawns plan doc 2's `fight.lair.confront` with `createUnifiedAction({ actorId, templateId: 'fight.lair.confront', targetId: monsterId, source: 'system' })`, the `encounterSeeding.ts:738` pattern.

**The god's avatar is never confronted.** `phaseMovement` ticks the avatar too (`:63`), but an avatar walking into a lair is the god visiting, not a mortal wandering in: mortals fight and the god leans (Vision `02-non-negotiables.md` §1, the charter's god-seat rule). The trigger skips an actor with an outgoing `avatar_of` edge (`getAvatarAscendant`, `:75`), traced `skipped: 'avatar'`.

**Hex presence does not trigger.** Settlements share lair hexes (THR-1319 measured 18 mortals on lair hexes routinely, and none at the lair node). The trigger applies to unthreaded mortals too, whose fights resolve in the background. It costs one `resolveToParentLocation` (`sublocationShape.ts`) and one `namedEliteId` read per arrival. There is no index, so nothing is cached at module scope.

### Graph nodes / edges

- **No new node or edge types.**
- Nodes: the elite actor gains the `monsterState` property bag (internal to the node).
- Edges: one `has_trait` edge to a temper trait, an existing edge type.
- Trait definitions: four new temper trait nodes, seeded at world init through `ENCOUNTER_TRAIT_DEFINITIONS` (`src/engine/traitDefinitionSeeding.ts`), where the condition traits are.
- Writes into existing systems: lair `clearingProgress` / `clearLair` (existing writer), and the monster's `deceased` via the existing funnel.

### Tick phases

- **No new phase.** The mint and the hardening run inside `phaseLairEscalation` (existing).
- The arrival trigger runs inside `phaseMovement` (existing).
- Fight consequences run inside plan doc 2's `onFightEnded` during step resolution.

### Resolution logic

None new. Monsters never roll: the fighter rolls against the monster's card (plan doc 2). Temper decisions are plan doc 2's runtime forks, reading the trait.

### PRNG callouts

No new stream. The family is chosen from `dominantSphere` (deterministic). The elite's name already comes from `mulberry32(hashStringSeed(lairId))`, unchanged. The trigger itself has no roll: it is forced on arrival, and the cooldown is deterministic. **The spawn draws, though:** `createUnifiedAction` feeds its `rng` to `computeStepDuration` (`unifiedActionLifecycle.ts:285-286`), and `phaseMovement(state)` receives no rng. So M4 passes the arrival branch's existing stream, `mulberry32(state.seed + state.tick * 47 + hashString(actorId))` (`phaseMovement.ts:182`), the one the branch already seeds its arrival encounters with.

## Content pillar

### Data tables: the eight families (THR-1268 §3)
`src/data/monster-families.ts`:

| Family (sphere) | Short description (card line) | Nerve reach | Clash reach | Dread | Might | Temper |
|---|---|---|---|---|---|---|
| `beast` (Force) | *a beast of claw and hunger* | heart | iron | fair | steep | berserk |
| `golem` (Matter) | *a thing of stone that does not tire* | heart | stone | fair | steep | stubborn |
| `stormkin` (Energy) | *a crackle of weather with a will* | heart | star | steep | fair | skittish |
| `behemoth` (Life) | *a great beast grown too large* | heart | iron | fair | steep | stubborn |
| `mindthing` (Mind) | *something that thinks at you* | veil | eye | steep | fair | bargainer |
| `wraith` (Spirit) | *a grief that learned to walk* | veil | veil | severe | gentle | skittish |
| `echo` (Time) | *a moment that will not end* | star | eye | steep | fair | bargainer |
| `blight` (Entropy) | *rot with a hunger in it* | stone | iron | steep | fair | berserk |

*The Time family's id `echo` (THR-1268's name) is not the Aspect echo (`MortalDeathOutcome 'echo'`, which `MonsterFelledTrace.funnel` reports). The player-facing word is the family line; the executor may rename the id if a reader ever confuses the two.*

The descriptions are GAME register, one line each (prose doctrine). The executor finalizes them against the voice scorer; the mechanics columns are fixed by THR-1268.

### Attachment content: four temper traits
Four trait definitions in the new `src/data/temper-trait-content.ts`, seeded like the condition traits:
- public;
- the tag `#temper`, its class word (as `#condition` is for conditions);
- **no** capability contributions;
- flavour text and a tooltip word.

**Seating `#temper`** is a design-session decision, recorded here per `Docs/canon/content-objects.md` § tags. It goes in `src/data/content-tags.ts` on the `family` axis, scoped to `trait_template`, described as *How a creature breaks when a fight turns.* It has four bearers the day it lands. `#monster` is **not** seated: nothing queries it, and the class word carries the meaning.

**Catalog registration (M1):**
- `trait.temper.` joins the Trait kind's `idPrefixes`, and `{ module: 'data/temper-trait-content', export: 'TEMPER_TRAIT_DEFINITIONS' }` joins its `catalogs` (`src/data/content-objects.ts:334`);
- the same key goes into `src/data/contentCatalogs.ts`;
- seeding joins `ENCOUNTER_TRAIT_DEFINITIONS` (`src/engine/traitDefinitionSeeding.ts`);
- the hover index joins `ATTACHMENT_TEMPLATE_SOURCES` (`src/engine/attachmentTemplateIndex.ts`).

- **the world-object registry:** `'temper'` joins `TRAIT_SUBCATEGORIES` (`src/data/world-objects.ts:193`), then `npm run generate-world-objects` regenerates its two outputs (both tracked by `check:generated-freshness`). The temper trait nodes carry `subcategory: 'temper'`, and `worldObjects.test.ts` ("finds no unregistered discriminator value in a generated world", `:210`, in `npm test`) fails any value the world writes that no kind claims.

Without the registration, `contentTags.test.ts` and `check:attachment` fail the tag by name, and `worldObjects.test.ts` fails the subcategory.

The words are *stubborn*, *berserk*, *skittish* and *bargains*.

### Encounter templates
- **`monster.hunt.named_elite`** is rewritten so its climax is a `fightBlock({ opponentRef: 'beast' })` against the cast `beast` (bound by `matchProperty`), and it sets `requiresLiveMonster: true`. Its existing opening prose and aftermath rewards stay, rekeyed on the `fight:<result>` memories. Every line naming the beast sits inside `{?has_cast:beast}`.
- **Its return seed follows the beast's survival.** `named_elite_creature_returns` (*"If the beast lived, it remembers the face."*) is planted only by the variants whose result leaves the beast alive: `fight:driven_off`, `fight:bargained`, `fight:yielded`, `fight:routed`, `fight:struck_down` and `fight:broke_off`. The `fight:overcome` variant plants nothing.
- **`monster.hunt.minor` is unchanged.** It draws at `['lair', 'wilderness']` with `variants: {}` (`monster-encounter-content.ts:101,176`), and minor lairs mint no monster. It stays the flavour-and-presence path that THR-1319's clearing pressure already counts. Minor-lair beasts are the v2 layer (THR-1258, Out of scope).
- **`fight.lair.confront`** (authored in plan doc 2) gains **one family-keyed opening line per family** through a **new `{target:family}` placeholder**. It joins the existing `{target:place}` / `{target:faction}` family in `src/engine/proseEnrichment.ts` and resolves to the target's family card line (the table's second column). For any other target, the family's existing residual strip (`/\{target:[^}]+\}/g`) removes it, so the sentence must read cleanly without it. The trigger (§6) makes the monster the action's target, so no cast binding is needed there. The wiring guide documents it (M2).

### Prose tables
Covered by the per-family opening lines above. No new prose system.

## UI pillar

*Screenshot tool: none owed by this plan's slices.*

**UI: N/A here, by design.** The monster's player-facing surface belongs to **plan doc 4** (THR-1272), which reads this doc's card:
- the lair sidebar card by name (fixing the live raw-id defect at `HexSidebar.tsx:533`);
- the opponent header;
- the pips and words;
- the `WorldPulse` count fix.

Nothing in this doc changes a component. UI Laws engaged here: none.

### Debug inspection (DebugPanel)
Plan doc 2's `inspectOpponentCard(id)` covers the card. This doc adds `window.__DEBUG.listMonsters()` (dev-only, declared in `debug-bridge.d.ts` with JSDoc) and the CLI command `monsters`. **Its return shape is pinned,** because plan doc 4's review route and plan doc 6's `huntedBy[]` build on it:

```ts
interface ListedMonster {
  readonly id: string; readonly name: string;
  readonly lairId: string; readonly lairTier: 'major' | 'legendary' | 'cleared';
  readonly family: MonsterFamilyId;
  readonly dread: FightRatingWord; readonly might: FightRatingWord;
  readonly clockSize: number; readonly clockFilled: number;
  readonly temper: 'stubborn' | 'berserk' | 'skittish' | 'bargainer';
  readonly temperShown: boolean;
  readonly deceased: boolean;              // slain monsters are listed too, flagged
}
```

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Add rows for the monster card mint, the `isMonster` exclusions, cast `matchProperty`, the lair-arrival trigger, and `onFightEnded`'s monster branch.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `createNamedElite` card + temper | `phaseLairEscalation` (existing) | — (plan doc 4) | elite node `monsterState`, `has_trait` | existing escalation trace + `monster.minted` | `listMonsters`, `inspectOpponentCard` |
| Legendary hardening | `phaseLairEscalation` | — | `monsterState` | `monster.hardened` | `listMonsters` |
| `isMonster` exclusions | each call site's phase | — | — | — | unit tests |
| Cast `matchProperty` + the liveness filter | encounter creation (support bundle) | existing veil (`{cast:beast}`) | `supportBindings` | existing support-bundle trace | existing |
| `requiresLiveMonster` draw gate | encounter draw (`encounterFilterPipeline.ts`) | — | — | existing filter path | unit tests |
| `{target:family}` | prose enrichment | existing veil | — | — | wiring guide |
| Lair-arrival trigger | `phaseMovement` arrival branch | existing veil (fight steps) | `unifiedActions`, `fightCooldowns` | `fight.trigger` | trace viewer |
| Felled / driven off writes | `onFightEnded` (plan doc 2) | — (plan doc 4 chips) | lair `clearingProgress` / `cleared_lair`; monster `deceased` | `monster.felled`, `monster.driven_off` + existing `clearLair` trace | `listMonsters` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `MONSTER_CLOCK_BY_TIER` | `{ major: 4, legendary: 5 }` | The monster's clock size at mint and after hardening (THR-1531) |
| `MONSTER_LEGENDARY_DREAD_STEP` | `1` | How many words Dread rises at legendary (capped at severe) |
| `MONSTER_FAMILY_FALLBACK` | `'beast'` | Family for foundation-sphere lairs |
| `MONSTER_FELLED_CLEARING_PRESSURE` | `0.5` | × `LAIR_CLEARING_RESISTANCE.legendary` added when a legendary lair's monster falls |
| `MONSTER_DRIVEN_OFF_CLEARING_PROGRESS` | `1` | Clearing progress from driving the monster off |
| `FIGHT_TRIGGER_COOLDOWN_TICKS` | `25` | Per pair (the `fightPairKey` rule), for every fight trigger: lair arrivals here and plan doc 5's grudge duels (THR-1267) |

## Tracing

Every trace below **extends `TraceBase`** (`src/types/trace.ts:1276-1283`) with the listed `category`. Each is registered in the THR-928 trio (the `TraceCategory` union, `TRACE_CATEGORIES`, the `TraceEntry` union) in the slice that first emits it; `src/types/trace.ts` joins that slice's files to touch.

```ts
interface MonsterMintedTrace extends TraceBase { category: 'monster.minted'; monsterId: string; lairId: string; family: MonsterFamilyId; dread: FightRatingWord; might: FightRatingWord; clockSize: number; temper: string; fellBack: boolean; }
interface MonsterHardenedTrace extends TraceBase { category: 'monster.hardened'; monsterId: string; lairId: string; clockSize: number; dread: FightRatingWord; }
interface FightTriggerTrace extends TraceBase { category: 'fight.trigger'; source: 'lair_arrival'; mortalId: string; monsterId: string; lairId: string; skipped?: 'cooldown' | 'busy' | 'monster_dead' | 'arriving_for_hunt' | 'hunt_appointment' | 'avatar'; }
interface MonsterFelledTrace extends TraceBase { category: 'monster.felled'; monsterId: string; lairId: string; byActorId: string; lairTier: 'major' | 'legendary'; funnel: 'died' | 'warded' | 'echo' | 'not_a_mortal'; lairCleared: boolean; clearingProgressAfter: number; }
interface MonsterDrivenOffTrace extends TraceBase { category: 'monster.driven_off'; monsterId: string; lairId: string; byActorId: string; clearingProgressAfter: number; }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Lair `dominantSphere` missing or foundation | `MONSTER_FAMILY_FALLBACK`; `monster.minted.fellBack = true` |
| Temper trait definition missing from the graph | Mint without the edge; `readOpponentCard` defaults to stubborn (plan doc 2) |
| `namedEliteId` points at a missing or deceased node | Trigger skips (`monster_dead`); plan doc 4's sidebar shows no monster |
| `clearLair` throws | Caught; progress not credited; `monster.felled` traces `lairCleared:false` |
| `markMortalDead` returns `warded` / `echo` for a monster | The monster lives; the result reads as overcome-but-survived (the clock stays full and recovers lazily); no clearing credit; traced |
| `markMortalDead` returns `not_a_mortal` on `overcome` (already dead) | No clearing credit; `monster.felled` traces `lairCleared: false`, `funnel: 'not_a_mortal'` |
| `requiresLiveMonster` finds no lair, no elite, or a dead elite | The hunt is not offered. Like `requiresOpposingBand`, the gate can only hide content |
| Cast `matchProperty` finds no living actor (the monster died between the draw and the bind) | The key stays unbound (`unresolved`, dropped). Prose naming it is inside `{?has_cast:beast}`; plan doc 2 ends the block `broke_off` / `no_opponent` at its first fight step, with no fallback to the target |
| The bound monster is deceased by fight time (a concurrent fight felled it) | Plan doc 2's `opponent_gone` end (`broke_off`) |
| `fightCooldowns` missing | Treated as empty |

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| lair escalation → monster card | **add** | plan doc 2's `readOpponentCard` (the fight); plan doc 4's sidebar card |
| fight → lair clearing | **add** (a second writer to `clearingProgress` / `clearLair`) | the existing reinfestation / army-attrition / sidebar readers of `cleared_lair` |
| fight → death funnel | **extend** (`'fight'` cause) | the existing deceased readers |
| movement arrival → fight spawn | **add** | the unified-action pipeline (existing) |
| lair + monster → encounter draw | **add** (`requiresLiveMonster` reads the lair's `namedEliteId` and the monster's `deceased`) | the draw pipeline (existing) |
| death funnel → cast binding | **extend** (`findExistingActorSupport` now reads `deceased`) | every cast-bound template |

The executor updates `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` in the slice that lands each write.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 613 | One additive **optional** field, `fightCooldowns?: Record<string, number>`. No existing literal needs it; the ratchet must show zero net-new errors |
| `src/types/encounter.ts` | 119 | One additive optional field, `EncounterSupportActorSpec.matchProperty?` |
| `src/types/unifiedAction.ts` | 501 | One additive optional template flag, `requiresLiveMonster?` (M2) |
| `src/types/traits.ts` | 347 | `'temper'` joins `TraitCategory` (M1). It is additive, and no exhaustive map over the union exists (`Record<TraitCategory` has 0 hits) |
| `src/types/trace.ts` | 134 | Five categories join the closed `TraceCategory` union (`:69`) and the THR-928 trio, guarded by `trace-vocabulary.test.ts`; additive members, each in the slice that first emits it |

**Behavioural blast:** from M1 on, every newly minted elite carries a card and a temper edge, and monsters stop being plot targets (closing a leak). From M2 on, the retained dead stop being cast in scenes (closing a latent leak) and the named-elite hunt is offered only where a living monster is, including through the Adventurers' Guild, whose offer now appears only at a lair. The world's encounter mix is otherwise unchanged until M2/M4 put monsters in fights.

## Three-pillar check

- [x] Engine pillar present (card, hardening, predicate, cast binding, lair writes, trigger)
- [x] Content pillar present (8 families, 4 temper traits, hunt template rewrites, family openings)
- [x] UI pillar N/A with rationale (plan doc 4 owns the monster's surface); debug surfaces included
- [x] Wiring section connects them

## Vision audit

- [x] **No Vision premise is contradicted.** The living world gains a pushback loop with a face: a named beast that mortals wound, one after another, until it falls and the den is cleared. The premises this touches:
  - `Vision/00-north-star.md`: every kind of mortal accumulates a story; here, including the ones who walk into a den;
  - `Vision/01-core-loop.md`: the fight is an encounter, and felling feeds the aftermath; the loop's shape is unchanged;
  - `Vision/02-non-negotiables.md`: the god is not the protagonist, since mortals fight and the god leans; everything stays a graph node or edge;
  - `Vision/03-design-tensions.md`: systemic emergence (every major lair's beast is fightable) against authored moments (the family lines and hunt templates).
- [x] **Monsters stay "just enough"** (charter rule 9): no bestiary, no roaming, one card per elite.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This changes a rule of play. **§7 "Fights"** (created by plan doc 2) gains a **"Monsters"** paragraph: a lair's monster, its card by family, temper, wounds that persist, and what felling it does to the lair. It is written `[IMPL]` with the slice that lands it. The quick-reference card's Fights line mentions the lair's beast.
- [x] `Docs/canon/rulebook.md` is updated in the implementation PRs, not in this plan-doc PR.

> Brainstorm companion: `Docs/plans/2026-09-23-monsters-as-opponents-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is named; the family table is data |
| 2. Inspectability | PASS | Five trace types; `listMonsters`; the card is readable on the node |
| 3. Determinism | PASS | No new randomness; the family comes from the sphere |
| 4. Fail-soft | PASS | See the table; the foundation-sphere fallback closes a silent `undefined` |
| 5. Narrative over mechanical perfection | PASS | Families read as creatures; wounds persist; felling one clears a den |
| 6. Additive over destructive | PASS | Additive bag, trait, predicate, spec field, template flag and GameState map. The two behaviour removals close leaks: monsters are no longer plot targets (live), and the dead are no longer cast (latent) |
| 7. Performance budget | PASS | Mint-time writes only; one map lookup per arrival |

## Slices

Each slice is one Linear issue in the Physical Conflict project, **not** a child of the map. Evidence follows THR-688 rule C (engine and content, CLI/headless).

| Slice | Scope | Blocked by | Done-when (all: `npm test`, `test:heavy`, `check:typecheck`, `vite build`, 30-tick CLI smoke) |
|---|---|---|---|
| **M1: The monster card** | §1–3: `MonsterState` + `monster-families.ts` + foundation fallback; temper trait content, its catalog registration, the `#temper` seat and `TraitCategory` `'temper'`, seeding, and the edge at mint; legendary hardening; `isMonster` + the engine exclusions; `listMonsters` debug + CLI `monsters`; `monster.minted` / `monster.hardened` traces; **UL Temper** seated by delegation (with the Innate Power and `innate` disambiguation of §1; the M1 issue records `seated by delegation <date>`); the UL **Trait Category** entry (`Docs/ubiquitous-language/Traits.md:75`, whose "One of ten classes" is already stale: `TraitCategory` has eleven members with `spell`) gains `temper` as the twelfth, with the count corrected and its lifecycle contract: *minted at `createNamedElite`, permanent, changed only by `trait_grant` or removal, read at the fight's temper checkpoint*; the `**Seated since: #temper**` paragraph in `Docs/canon/content-objects.md`; **`'temper'` in `TRAIT_SUBCATEGORIES`** (`src/data/world-objects.ts`) and the regenerated world-objects outputs | FB1 (plan doc 2): `MonsterState` imports `FightRatingWord` | Tests: mint writes the card for every family (8 + fallback); hardening at legendary (clock 5, dread +1 capped, clockFilled kept); the plot rejects a monster target; graduation skips monsters; `contentTags.test.ts` and `check:attachment` pass with `#temper` seated and the Trait kind listing `trait.temper.`; **`worldObjects.test.ts` "finds no unregistered discriminator value" stays green** with temper traits in the world. **CLI:** seed 42 medium, tick 120: `monsters` lists every elite with a card, and none lacks one (predicate: every `isMonsterElite` node has `monsterState`) |
| **M2: Monsters in scenes** | §4 + the hunt rewrite: `matchProperty`; the liveness filter for every spec; `requiresLiveMonster` + its filter-pipeline gate; `monster.hunt.named_elite` with a fight block against `beast`; `{target:family}` and the family openings for `fight.lair.confront`; `inheritContext: true` on the hunt's return seed | M1, FB7 | Tests: `matchProperty` binds the living monster at the location and never materializes; no spec ever binds a deceased node (monster or mortal); **a `useScoredBinder` template with a `matchProperty` spec binds the monster through the legacy route**; **the return seed `named_elite_creature_returns` spawns the hunt with the lair target and the `beast` binding carried**; **both death windows:** a beast that died *before* the seed spawned arrives unbound (`resolveSeedInheritance` drops a dead binding, `encounterSeeding.ts:426`) and ends `no_opponent`, one that died *after* the spawn ends `opponent_gone`; **the `fight:overcome` variant plants no return seed**; the role-match branches never bind a monster; `requiresLiveMonster` hides the hunt at a lair whose elite is dead or absent; `{target:family}` resolves for a monster target and strips cleanly otherwise; the golden test stays green. **CLI:** `spawn encounter @hero monster.hunt.named_elite` at a major lair binds `beast` = the elite and the fight's `fight.step` trace names it as the opponent |
| **M3: What felling it does** | §5: `onFightEnded` monster branch: felled → the death funnel + `clearLair` (major) / pressure (legendary) + `touchStructure`; driven off → progress; `fightState.lairOutcome`; traces | M1, FB2 (it adds `'fight'` to `MortalDeathCause` and the `FightEndContext`) | Tests: overcome at major clears the lair (subtype `cleared_lair`, credit to the victor's faction) and bumps `structuralCacheVersion`; at legendary, progress rises by half the resistance and the faction remains; a warded monster survives with no clearing credit; `not_a_mortal` credits nothing (two `overcome` dispatches against one monster credit the lair once); driven off adds 1; `fightState.lairOutcome` matches what was written (felled, cleared, progress) |
| **M4: Walking into the lair** | §6: the arrival trigger + `fightCooldowns` + `fight.trigger` trace | M1, FB7, **F4 (plan doc 4)**: THR-1267 made the trigger forced *because* the monster's name, Dread word and clock are visible on the lair's sidebar, and F4 is the slice that shows them | Tests: arrival at a lair node, or at a place inside it (resolved through `resolveToParentLocation`), spawns `fight.lair.confront` targeting its monster; hex co-presence does **not**; the cooldown holds; no trigger for a dead monster, a busy mortal or **the god's avatar** (`skipped: 'avatar'`); **a hunter from another hex who arrives for `monster.hunt.named_elite` gets the hunt's fight, fights once, and never gets a back-to-back confront and hunt** (`skipped: 'arriving_for_hunt'`); the pair key is the sorted join, and stale entries are pruned on write. **CLI:** seed 42 medium, 200 ticks: report `fight.trigger` counts **by outcome**: spawned, and each `skipped` reason. **Skips alone do not satisfy the check**; ≥1 spawned confront does. If none spawns, report the counts as a finding, not a fail. Also report the **furniture check**: the number of natural (non-debug) fights against any monster in the run |

## Kill criteria

- **M1, before merge:** if the CLI predicate finds any `isMonsterElite` node without `monsterState`, the mint path is incomplete. Fix it before merge.
- **M3, after merge:** if the clearing writes double-count with THR-1319's presence pressure (for example, a legendary lair clears within one escalation pass from a lone fight), halve `MONSTER_FELLED_CLEARING_PRESSURE`. It is a tunable, so no code change is needed.
- **M4, after merge:** if lair fights fire on every market day, the trigger has slipped to hex granularity. That is a defect; revert to node granularity.
- **The furniture check, M4 then plan doc 6's closeout.** A zero at M4 (no natural fight against any monster on seeds 42 and 99 at 200 ticks) is expected: mortals rarely wander into a lair unmeaning, and deliberate hunters skip the confront by design. Plan doc 6's hunts are the deliberate path. **Re-measure at plan doc 6's closeout.** If it still reads zero there, the elite is still furniture: file a Deferral to raise the lair-encounter draw weight (a tunable), in the Physical Conflict project.

## Done when

- [ ] M1–M4 each closed by its own PR, with that slice's Done-when evidence
- [ ] Every `isMonsterElite` node in a seeded world carries `monsterState` from tick of mint (M1 CLI predicate)
- [ ] **Wiki pages owed under the blocking `check:wiki-freshness` gate** (matched against `public/wiki-manifest.json` `sources`): M1 → `armies-battles-reference` (lair escalation and clearing), `traits-marks-reference` (trait seeding, `TraitCategory`), `content-objects` (the catalog registration), **`world-objects`** (`TRAIT_SUBCATEGORIES`), `undertaking-grid` (the plot exclusion) and `agents-reference` (graduation), with a one-line note on `cosmology-reference` for its type-only `traits.ts` match (not a `Wiki-freshness-exempt:` token, which would switch the gate off for the whole PR, `scripts/check-wiki-freshness.ts:460-461`); M2 → `encounters-manual-reference` (cast binding, the draw gate, the hunt) and `attention-story-reference` (`{target:family}`), with a one-line note on `divine-actions-reference` for its type-only `unifiedAction.ts` match; M3 → `armies-battles-reference` (felling clears lairs); M4 → none of its own. **Every slice that edits `Docs/canon/interface-map.md` or `scripts/interface-contracts.ts`** (all four, per § Interface impact) also commits the regenerated `system-interface-map` page (`npm run generate-interface-map`, also run by `prebuild`)
- [ ] Rulebook §7 "Monsters" paragraph `[IMPL]`; `#temper` seated and the temper catalog registered (M1); the systemic wiring guide documents `matchProperty`, `requiresLiveMonster` and `{target:family}` (M2); interface map rows
- [ ] **The UL entry Monster, the world-objects Mortal-row class note and its canon row are owned by plan doc 6's H1.** The THR-1258 carve-up assigns them there, and H1 is blocked by M1, which ships the `isMonster` predicate they cite. Nothing in this doc seats them
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke per slice; the close keyword for that slice's issue on its own line in the closing commit and PR body
- [ ] `Browser-verify exempt: engine + content only` on every slice (no `src/components/` change here)

## Coordination block

**Suggested model:** opus. M1 touches four systems' predicates and must not over-exclude; M3 writes into THR-1319's clearing loop.

**Parallel-safe with:**
- **M1 is blocked by FB1** (it imports `FightRatingWord`). Once FB1 lands, M1 is parallel-safe with FB2–FB4 (plan doc 2): they only read `monsterState`, and the files are disjoint **apart from `src/types/trace.ts`**, where each slice only adds union members;
- the ward fix (THR-1534): `bandOpposition.ts`, `graphOp.ts`, `graphOpExecutor.ts`, disjoint.

**Mutex with:**
- M3 with plan doc 1's D1/D2, since all three extend `src/engine/fights/fightOutcome.ts` (`onFightEnded`); run them in sequence;
- M1 with any slice editing `lairEscalation.ts` or `undertaking-objects.ts`;
- M1 with plan doc 1's D1: both edit `src/debug-bridge.ts`/`.d.ts` and `src/types/trace.ts` (D1's scar goes into the existing condition catalog, so no registration file is shared). Run them in sequence;
- M4 with plan doc 1's D2: both edit `src/types/gameState.ts` (`fightCooldowns?`; the `fight_ended` tick-event type);
- M1 with plan doc 2's FB7: both edit `src/debug-bridge.ts`/`.d.ts` and `scripts/cli.ts`;
- M2 with any slice editing `encounterFilterPipeline.ts` or `proseEnrichment.ts`;
- M4 with any slice editing `phaseMovement.ts`'s arrival branch;
- M1 with any slice editing `src/data/world-objects.ts` (plan doc 6's H1 edits it too, but H1 is blocked by M1, so the two are already sequenced).

**Files to touch:**
- M1: `Docs/canon/content-objects.md` (the `#temper` seat), `src/data/world-objects.ts` (`TRAIT_SUBCATEGORIES`) and its generated outputs, `Docs/ubiquitous-language/` (Temper), `src/engine/lairEscalation.ts`, `src/types/monster.ts`, new `src/data/monster-families.ts`, new `src/data/temper-trait-content.ts`, `src/engine/traitDefinitionSeeding.ts`, `src/engine/attachmentTemplateIndex.ts`, `src/data/content-objects.ts`, `src/data/contentCatalogs.ts`, `src/data/content-tags.ts`, `src/types/traits.ts`, new `src/engine/monsters/isMonster.ts`, `src/data/undertaking-objects.ts`, `src/engine/npcGraduation.ts`, `src/engine/lairClearing.ts`, `src/engine/socialEncounterGeneration.ts`, `src/types/trace.ts`, `src/debug-bridge.ts`/`.d.ts`, `scripts/cli.ts`
- M2: `src/data/monster-encounter-content.ts` (the rewrite and the return seed's `inheritContext`), `src/types/encounter.ts`, `src/types/unifiedAction.ts` (`requiresLiveMonster?`), `src/engine/encounterSupportBundle.ts`, `src/engine/encounterFilterPipeline.ts`, `src/engine/proseEnrichment.ts`, `src/data/monster-encounter-content.ts`, `src/data/encounters/fight-lair-confront.ts`
- M3: `src/engine/fights/fightOutcome.ts`, `src/engine/lairClearing.ts` (export the credit helper), `src/types/trace.ts`
- M4: `src/engine/phaseMovement.ts`, `src/types/gameState.ts` (`fightCooldowns?`), `src/types/trace.ts`

## Notes for the executor

- **Do not** add an `actorType: 'monster'`. It falls outside the effect tick's `individual|ascendant` filter (THR-1530 §5) and needs director sign-off (THR-1262).
- **Do not** reset `clockFilled` on hardening. Wounds outlast the den's growth.
- `clearLair` is THR-1319's writer; do not write `cleared_lair` yourself. `clearLair` does not bump `structuralCacheVersion`, and the escalation phase that usually does is not running, so `touchStructure(ctx.runtime)` after it is yours.
- **Do not** let a fight fall back to the action's target when `opponentRef` is set but unbound. Plan doc 2 ends it `no_opponent`; a hunt that fights "the lair" is the failure this rule prevents.
- The trigger is location-granular **by design**. Do not "fix" it to hex co-presence; THR-1319's measurement is the reason.
- If M4's CLI run spawns zero confronts, read the skip counts before the code. Deliberate hunters skip by design (`arriving_for_hunt`, `hunt_appointment`), so zero spawned confronts means no mortal wandered into a lair *without meaning to*, not that the trigger is broken.

## Intent-judge verdict

*intent-judge, run 4 of 4, 2026-09-23. **Allow**, impact class Reversible (judge-confirmed).*

- **Model slip, recorded:** `INTENT_JUDGE_MODEL` is `fable`, but the account's Fable limit was exhausted (HTTP 429). All four runs were on Opus 5.5, at the spawner's direction, and the judge recorded the anti-correlation slip. Treat this as a partial-guarantee verdict.
- **Run history:** run 1 Revise (12 findings), run 2 Revise (9), run 3 Revise (4), run 4 Allow (2 GAPs, 9 polish).
- **The two GAPs, fixed inline before commit** (no re-run needed, per the verdict):
  - `'temper'` is registered in `TRAIT_SUBCATEGORIES`, which M1's scope, Done-when, files and wiki pages now carry;
  - the furniture check has a response: a zero at M4 is expected, and the check is re-measured at plan doc 6's closeout, with a Deferral if it still reads zero.
- **Polish applied:**
  - both death windows are tested in M2;
  - the `echo` note sits below the table;
  - M4's spawn stream is named;
  - the god's avatar is never confronted (`skipped: 'avatar'`, Vision non-negotiable 1);
  - `system-interface-map` is named for every slice that edits the interface map;
  - the return seed is planted only where the beast lives;
  - the proposal's temper wording is fixed;
  - the UL class count is corrected to twelve;
  - the merged THR-1525 line is dropped.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-23 (three sonnet auditors, in parallel, after the intent-judge Allow).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 6 named constants (`MONSTER_CLOCK_BY_TIER`, `FIGHT_TRIGGER_COOLDOWN_TICKS`, etc.); Kill Criteria retunes `MONSTER_FELLED_CLEARING_PRESSURE` — "It is a tunable, so no code change is needed" |
| 2. Inspectability | PASS | 5 new `TraceBase`-extending trace types (`monster.minted`, `.hardened`, `fight.trigger`, `.felled`, `.driven_off`); `listMonsters()` + CLI `monsters` with a pinned `ListedMonster` shape; Wiring table maps every module to trace/debug columns |
| 3. Determinism | PASS | Dedicated "PRNG callouts" section: no new stream; family derives deterministically from `dominantSphere`; arrival trigger reuses the existing seeded `mulberry32(state.seed + …)` stream |
| 4. Fail-soft | PASS | 9-row Fail-soft table: missing sphere/trait, dead `namedEliteId`, `clearLair` throw caught, funnel edge cases (`warded`/`echo`/`not_a_mortal`), unbound cast, stale `fightCooldowns` |
| 5. Narrative over mechanical | PASS | Vision audit ties to north-star/non-negotiables; explicit rule bars a fight from falling back to "the lair" as target — "a hunt that fights 'the lair' is the failure this rule prevents" |
| 6. Additive over destructive | PASS-with-note | "No new node type and no new actorType"; all Blast Radius fields optional/additive. Caveat: two runtime behavior removals (monsters excluded as plot targets; retained-dead excluded from casting) — framed as closing a live and a latent leak, not destructive feature removal |
| 7. Performance budget | PASS | "Mint-time writes only; one map lookup per arrival"; arrival check costs one `resolveToParentLocation` + one property read, explicitly "nothing is cached at module scope" (no premature indexing) |

**NFP AUDIT: PASS-with-notes (see rows above)**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All 5 required subsections (Systems design, Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts) present with real spec — monster card shape, legendary hardening, `isMonster` predicate + 5 exclusion call sites, cast-binding/hunt-gate mechanics, lair-consequence table, movement-arrival trigger — none are placeholders |
| Content | present-and-substantive | All 4 required subsections present: Data tables (8 families, full stat columns), Attachment content (4 temper traits + catalog registration steps), Encounter templates (named-elite rewrite, return seed, minor-hunt no-op, `{target:family}`), Prose tables (explicitly points to the family-opening lines rather than being empty) |
| UI | N/A-with-rationale | Names the deferring doc (plan doc 4 / THR-1272) and lists exactly what's deferred (sidebar card, opponent header, pips/words, `WorldPulse` fix); keeps a justified Debug-inspection subsection despite N/A, stating "UI Laws engaged here: none" |

**Missing required sections:** None.

**Wiring check:** Present and connects both active pillars. Its 8-row table uses the checklist's exact Module / Orchestrator phase / UI component / GameState field / Trace / Debug-visibility columns, wiring every Engine and Content module to `phaseLairEscalation`, `phaseMovement`, the encounter draw gate, the support-bundle binder, and prose enrichment; UI-component cells correctly read "—" or "(plan doc 4)" given the UI N/A.

**Substrate check:** PASS. Opens with `## Substrate inventory` immediately after the load-bearing hook, before Engine pillar. Cross-checked against `Docs/canon/systems-inventory.md`: lair escalation/clearing → 🟢 ACTIVE "Ruins, Clues & Delves"; traits → 🟢 ACTIVE "Personality & Emergent Traits"; death funnel → 🟢 ACTIVE "Agent Lifecycle"; cast binding/draw gates → 🟢 ACTIVE "Encounters & Dilemmas"; movement trigger → 🟢 ACTIVE "Movement & Colocation" — all correctly extends/reads/calls, none claimed as green-field. Includes runtime population counts (14→26 elites, seed 42) per impediment #599, plus a grep-verified zero-prior-hits check for new vocabulary. No duplication found.

PILLAR AUDIT: PASS

### Vision audit

[design-audit-overflow: the auditor's opening reading-notes paragraph is omitted to stay near the cap; its sections 1–4 are verbatim. The omitted notes record that it ran `npm run vision-audit`, read all five Vision files directly, found the script's "named without citation" list to be a regex false positive, and skipped a stale `design-brief.md`.]

**1. Vision premises touched**
- `00-north-star.md` → "mortals accumulate a story; wounds persist" — [confirmed, narrow: the visiting mortal's thread, not the core nudge-card moment]
- `01-core-loop.md` → "encounter/aftermath machinery; one story at a time via spotlight tiers" — [extended: forced lair-arrival trigger reuses the existing arrival-seed pattern; scan discipline untouched]
- `02-non-negotiables.md` → §1 god-not-protagonist (avatar excluded from the trigger, explicitly cited) and §4 graph edges (temper modeled as a trait edge, reasoned explicitly) — [confirmed]; §2/3/5/6/7 addressed via the NFP table/three-pillar check, not the Vision-audit bullets — [silent there, not missing]
- `03-design-tensions.md` → #2 emergence-vs-authorship, explicitly cited — [extended, self-monitored via kill-criteria + scheduled re-measurement]
- `taste-profile.md` → plain-register prose bar; no-new-node-types-without-sign-off (explicit actorType refusal, THR-1262) — [confirmed, one soft risk below]

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- North star: supportive, not central — the god-mortal moment lives in sibling docs; this ships substrate (opponent card + lair answer).
- Core loop: preserved — fights route through existing encounter/aftermath machinery; forced trigger follows established precedent; unthreaded fights stay backgrounded.
- Non-negotiables: held — avatar excluded (mortals fight, the god leans); temper is an edge, not a property; no new actorType.
- Design tensions: leans systemic (8 reused family lines across 14–26 instances/world) but self-corrects via named kill-criteria, not blind drift.
- Taste profile: mostly respected; two family lines ("a grief that learned to walk," "something that thinks at you") read closer to the retired lyrical register than Prose Doctrine v2's plain mandate — deferred to the voice scorer, a soft risk not a lock-in.

**4. VISION AUDIT: PASS-with-notes** [design-brief-stale]

**Author's response to the notes:** none of the three audits returned FAIL or REVISE. The two family lines the Vision auditor flags are already marked in § Content pillar for the executor to finalize against the voice scorer. The NFP #6 caveat (two runtime behaviour removals) is intended, and is stated in § Blast Radius.
