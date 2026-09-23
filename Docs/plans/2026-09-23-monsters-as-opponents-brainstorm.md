> **title:** Brainstorm companion — monsters as opponents (Physical Conflict plan doc 3)
> **companion_to:** `Docs/plans/2026-09-23-monsters-as-opponents.md`
> **created:** 2026-09-23

# Brainstorm companion — monsters as opponents

The route is on the closed Physical Conflict map (THR-1258); the decision tickets are THR-1262, THR-1267 and THR-1268.

## Entity shape (THR-1262, THR-1268)
| Option | Verdict |
|---|---|
| A: an ambient NPC with a monster role | Rejected. It is exposed to faction assignment (it needs an `npcRole`) and graduation hydration. |
| **B: the named elite, finished** | **Chosen.** The elite already exists at every major lair, is already pinned ambient (THR-1403 fixed the wandering THR-1262 saw), and is already located at the den. It gains one typed `monsterState` bag, following the `battleState`/`armyState` precedent. |
| C: a new `actorType: 'monster'` | Rejected. It needs director sign-off, and it would fall outside the effect tick's actor filter, so a monster's powers would silently never run (THR-1530 §5). |
| A new node type | Ruled out by the load-bearing rule. `sublocation` / THR-1177 is the cautionary tale. |

## Temper: a property or a trait
A property is simpler. A **trait** is spell-ready: `trait_grant` is live, so "pacify" or "enrage" is content, not code. The trait costs one edge per monster. Chosen: the trait (THR-1530 §5 recommended it).

## Legendary strength
R2 measured 14 of 22 lairs legendary by tick 100 on seed 42. A severe/severe/6 legendary monster (the THR-1531 "legendary horror" row) would make most of the world's monsters unbeatable solo, and fights would stop producing stories. Chosen instead: +1 clock and one step of Dread. The den is steeped in fear and a little tougher, but still a beast mortals can wear down over visits. Authored set pieces can still field a true horror.

## Trigger granularity (THR-1267)
The charter said "location proximity, hexes are too big". THR-1319's measurement confirmed it: 18 mortals stood on lair hexes (settlements share them) and none at a lair node. A hex trigger would ambush every market day. A node trigger fires only when someone goes into the den, which today means a hunt encounter. That makes plan doc 6 (hunts) the natural amplifier, and M4's CLI evidence treats zero arrivals as a finding, not a failure.

## Two clearings, one loop
THR-1319's presence clearing and the fight's felling are different stories: a village holding its ground, and a hero killing the beast. They must not become two parallel ways to write `cleared_lair`. Felling calls THR-1319's `clearLair` (major) or adds to its `clearingProgress` (legendary), so the reinfestation, army-attrition and sidebar readers see one state.

## Tensions carried forward
- Minor lairs have no fightable monster until they escalate (~30 ticks). Minor-lair beasts are in the v2 layer.
- A warded monster (`death_prevented` via an innate power) survives being "overcome". That's rare, it's traced, and it's a fun edge case for spells later.

## Vision premises touched
The living world pushes back, and the pushback has a name. "Just enough monster" holds.

## Revisions during review (2026-09-23, intent-judge run 1)

**Gate at the draw, not rescue at the bind.** Draft 1 relied on a "blocked-primitive" path to skip steps when the beast was absent, and that path does not exist at runtime: an unbound cast key is simply dropped. The hunt is now offered only where a living monster is (`requiresLiveMonster`, the `requiresOpposingBand` pattern). A monster that dies between the draw and the fight ends the block `no_opponent`, never a fight against "the lair".

**The dead are never cast.** The liveness filter applies to every cast spec, not only monsters, because retained deaths keep their location edge and could be cast as walk-ons today.

**Temper's category.** Temper is a Trait (a new `temper` class), not UL's Innate Power (a capability) and not the `innate` trait category (a worldgen class). The mint is still the seam where Innate Powers arrive later.

**Minor lairs.** `monster.hunt.minor` stays flavour. Minor lairs mint no beast, so a fight there would be against nothing.
