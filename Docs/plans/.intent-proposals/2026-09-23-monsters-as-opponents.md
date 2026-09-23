# Action Proposal — monsters as opponents (Physical Conflict plan doc 3 of 6)

## intent_quote

Christian, chat, 2026-09-23. His direction on the fight research:

> the learnings and direction here is good, make sure we also are prepared to integrate spells when we get those up and running. this is a large design as far as i can see at the level of encounters and undertakings?

His delegation for the night:

> well i am going to bed. you have tons of tokens and time all night to work on this map, you have free roam to take the feature as far as you can design wise. also you can move elements of it into ready for dev so there is enough for our execution agent to work on tonight also. see you tomorrow

## scope (what this plan does)

Gives each lair's named elite (minted at major tier) a fighting card. The work, in four slices:
- **The card.** A `monsterState` bag holds family, Dread, Might, reach overrides and a persistent clock, drawn from an eight-family table keyed on the lair's dominant sphere, with a fallback for foundation spheres. Temper is a Trait of the new `temper` class. Legendary lairs harden the card (+1 clock, one step of Dread).
- **One `isMonster` predicate** that closes the live leaks: the plot's target list, graduation and the challenger count. Social visibility is guarded explicitly.
- **Cast binding** by property, so encounters can bind "the monster here" (closes THR-1274 for monsters), with the named-elite hunt rewritten to fight it (`monster.hunt.minor` stays flavour: minor lairs mint no beast).
- **Felling writes into the THR-1319 clearing loop** through its own writer.
- **A lair-arrival fight trigger** at node granularity, with a pair cooldown.

It carries out THR-1268, THR-1267 (monster half) and THR-1262.

## scope (what this plan does NOT do — explicit non-goals)

- No player-facing surface. The lair sidebar card, the opponent header and the `WorldPulse` count fix belong to plan doc 4.
- No fight mechanics; those are plan doc 2. No fighter-side consequences (defeat faces, victory rewards); those are plan doc 1.
- No minor-lair beasts, roaming, bestiary or ecology (charter rule 9; the v2 layer).
- No new node type and no new `actorType`.
- No change to monster factions or armies. Raider bands stay THR-767.
- No hunts as undertakings; that is plan doc 6.

## impact_class

Reversible. The card, trait, predicate, spec field and GameState map are all additive. There is one behaviour removal: monsters can no longer be plot targets, which closes a live leak and is reversible by removing one predicate call. The M1 slice lands content and engine logic behind its tests.

## evidence cited

- **Linear issue:** THR-1258 (closed map, carve-up comment); decision tickets THR-1268, THR-1267, THR-1262, THR-1531, THR-1530.
- **Vision premises invoked:** the living world pushes back; "just enough monster".
- **UL terms touched:** Mortal, Cast (scene cast), Trait, Innate Power (disambiguated, not used). New term **Temper**, seated by delegation in M1 (2026-09-11 blanket). **Monster** (a class of Mortal) is seated by plan doc 6's H1, per the THR-1258 carve-up. "Lair" has no UL entry and none is seated here.
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Monster as a class of Mortal, as company is a class of group), `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`, `Docs/canon/rulebook.md` §7.
- **Prior plan docs / tickets built on:** THR-1319 (lair clearing), THR-1403 (elite pinned ambient), THR-1430 (the death funnel), THR-1274 (non-human cast gap).
- **Rejected approaches:** options A and C, a new node type, a hex trigger, severe/severe/6 legendaries. The reasons are in the brainstorm companion.

## load-bearing decisions touched

- **No inventing node types:** respected. The monster stays an `actor` / `individual`.
- **Relationships are edges:** respected. Temper is a `has_trait` edge. The lair link keeps the existing `located_at` edge plus `lairId` (unchanged). The trigger cooldown is transient bookkeeping keyed by pair, not a relationship.
- **Encounter awareness is hex-granular:** untouched. The *fight trigger* is node-granular by design (THR-1267), and awareness of the monster is unchanged.

## high-impact files touched (from Codesight)

- `src/types/encounter.ts` (119 importers) gains `EncounterSupportActorSpec.matchProperty?` (M2); it is a row in the plan's Blast Radius table.

- `src/types/gameState.ts` (613 importers) gains one additive optional field, `fightCooldowns?`; `src/types/unifiedAction.ts` (501) gains `requiresLiveMonster?`; `src/types/traits.ts` (347) gains the `TraitCategory` member `temper`; `src/types/trace.ts` (134) gains five categories. All four are rows in the plan's Blast Radius table.

## kill criteria

- If M1's CLI predicate finds any `isMonsterElite` node without `monsterState`, the mint path is incomplete. Fix it before merge.
- If M3's clearing writes double-count with THR-1319's presence pressure (for example, a lair clears within a single escalation from a lone fight at legendary), halve `MONSTER_FELLED_CLEARING_PRESSURE` (tunable).
- If M4 shows lair fights firing on every market day, the trigger has slipped to hex granularity. That is a defect; revert to node granularity.

## explicit user sign-off

N/A (Reversible). The direction and delegation are quoted above.

## author notes for the judge

- **Third revision (after run 3's Revise, 4 required actions):** the hunt's return seed carries its context (`inheritContext: true`), and the Adventurers' Guild's narrowing is stated as intended; `listMonsters()`'s return shape is pinned (slain monsters listed, flagged); the UL Trait Category entry gains `temper` with its lifecycle contract; M4's evidence counts spawned confronts by outcome, skips never satisfy it, and a furniture check is reported; the stale executor note is rewritten; the type-only wiki matches take one-line notes, not a PR-wide exemption token; the `echo` family id is disambiguated.

- **Second revision (after run 2's Revise, 9 findings):** M4 is busy-tested with `isUnifiedAgentIdle` and gives way to a mortal arriving for the named-elite hunt (`skipped: 'arriving_for_hunt'`); the wiki pages each slice owes are named from the manifest; a `matchProperty` spec always takes the legacy route, never the scored binder; Temper is seated as a UL term in M1 and `#temper` recorded in the content-objects canon; the coordination block's mutex reasons are corrected (M1↔D1 on the debug bridge and traces; D2↔M4 on `gameState.ts`; `trace.ts` overlaps noted); the `getAllActorsAtLocation` callers are named; one pair-key rule and prune-on-write for `fightCooldowns`; the THR-1272 and THR-1268 notes are posted.

- R2 code research (this session, on current `main`) measured the population and audited the leaks. The plot leak was confirmed by R4 (`isPlottableMortal` has no monster exclusion).
- The UI pillar is N/A by the map's carve-up: the monster's surface is plan doc 4.
- Revised after a first judge run (Revise, 12 findings): type ownership (M1 blocked by FB1), the death call's context (plan doc 2's FightEndContext), the hunt gate and liveness filter, the temper catalog and tag seat, Innate Power disambiguation, WorldPulse ownership (plan doc 4 F1), M4 blocked by F4, trace.ts blast row, kill criteria in the plan, the lookup without an index.
