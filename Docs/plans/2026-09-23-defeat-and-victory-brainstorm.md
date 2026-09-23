> **title:** Brainstorm companion — defeat, death and victory (Physical Conflict plan doc 1)
> **companion_to:** `Docs/plans/2026-09-23-defeat-and-victory.md`
> **created:** 2026-09-23

# Brainstorm companion — defeat, death and victory

Route: the closed Physical Conflict map (THR-1258). Decision tickets: THR-1266 (including its correction comment), THR-1270, THR-1261.

## What death costs, and who decides
| Considered | Verdict |
|---|---|
| Death on any critical failure | Rejected. About 15% of bold fights against strong monsters end struck down (THR-1531), which would kill protagonists weekly. |
| Death scaled by step difficulty | Rejected. It punishes brave choices twice (lower odds *and* higher lethality). The *opponent* decides instead: a berserk beast kills, a skittish one flees. |
| **Death only on struck down, by the victor's nature** | **Chosen.** Temper for monsters, mercy for mortals, about 2% per visit against a berserk elite. |
| A death funnel of our own | Unnecessary. `markMortalDead` (THR-1430) exists and names this framework as its next caller. The THR-1261 research that said "build one" was stale. |

## The First
**Chosen: The First never dies in a fight in v1.** The run is built around that bond, and ending it on a doubles roll in a background fight the player didn't watch reads as a bug, not a tragedy. Christian's veto lives on THR-1266.

**Alternatives kept for the veto conversation:**
- The First can die only in *attended* fights (the god is watching and could have intervened).
- The First can die, with an echo, like an Aspect.

## Scars
The Meet-The-First "scar" is quintessence erosion, not a mark. A mortal mauled by a beast should *carry* something readable, so **Scarred** is a new permanent trait. It deliberately has no capability contribution: it is a narrative mark, and the grudge edge carries the mechanical weight (the Old Wound edge in the next fight, and a hunt reason).

## Victory without a reward system
THR-1270's guard: no new reward system. The trophy comes from the existing pool (sphere and tier tags), gratitude from the existing reputation writer, and character growth is already automatic on the fight road. The god gains nothing new, because the divine receipt already credits the cards that helped.

## The chronicle
- **Tiering:** marked endings (felled, struck down, slain, bargained, driven off) are `notable`; attempts (yielded, routed, broke off) are `routine`. So the chronicle reads like a history, not a combat log.
- **Voice:** the Dwarf Fortress log voice, in the GAME register.

## Tensions carried forward
- **Deaths feeding the reactive loop** will create vengeance ambitions against monsters. That is intended, and hunts (plan doc 6) are the payoff. Until hunts ship, a vengeance drive toward a beast may have no direct verb; the undertaking grid's existing paths absorb it, or it cools into a grudge.
- **Capture is not in v1.** There is no captivity substrate (only army commanders have one).

## Vision premises touched
Defeat wears many faces; harm becomes somebody's next drive; the living world keeps score.

## Revisions during review (2026-09-23, intent-judge run 1)

**Humiliation.** The charter names it, and the map's menu dropped it silently. Options:
- **(a)** yielding to a person costs face at home, and the victor gains renown;
- **(b)** defer it with capture;
- **(c)** a humiliated condition.

**Chosen: (a)**, under the standing delegation, with a veto invited on THR-1266. It is a reputation write the sheet already shows. It needs no new condition, and it gives duels a stake short of blood. (c) was rejected: a new condition would carry mechanical meaning the chronicle and reputation already carry.

**The chronicle route.** Draft 1 routed through `EVENT_TIER_MAP`/`routeEvent`, which only tests call. The live path is `phaseNarrative`'s significance threshold (≥ 0.8 makes a chronicle row), so fight endings emit a `TickEvent` whose significance separates marked endings from attempts.

**The trophy.** Draft 1 cloned rewards by id. `drawSeededReward` is the one draw path, and it keeps `reward_tier_bonus` live for blessings and future spells. Lair tier selects the tier curve instead of new tags.

**The scar's name.** `trait.mark.scarred` collided with UL's Hidden Mark and the retired MARK chip. `trait.scar.scarred` sits in the Condition kind's existing `trait.scar.` family, with seated tags and no registration work.
