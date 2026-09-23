> **title:** Brainstorm companion — hunts (Physical Conflict plan doc 6)
> **companion_to:** `Docs/plans/2026-09-23-hunts.md`
> **created:** 2026-09-23

# Brainstorm companion — hunts

**Route:** the closed Physical Conflict map (THR-1258). **Decision ticket:** THR-1533, refined here.

## Where a hunt sits in the grid
| Considered | Verdict |
|---|---|
| `destroy × mortal` with a monster branch (THR-1533's wording) | Refined. The mortal type's `destroy` is the plot: social motive gates and ownership rules. Branching inside it would tangle two very different works. |
| **A `monster` object type** | **Chosen.** It follows the grid's native shape (an object type per thing a work can act on). Correction from review: company and army are world-object **kinds**, not classes, so they are not the precedent; Monster stays a class of Mortal (THR-1268), and the type declares `classOf: 'mortal'` so the grid and codex show it under the Mortal row. The registry keeps Monster as a class of Mortal (THR-1268). |
| A location/lair "clear" verb | Rejected. `destroy × location` writes ruins; THR-1319's `clearLair` owns lair clearing. And the monster, not the den, is the thing a mortal hunts. |

## Why a mortal hunts
- The social motive gate (rivalry, grudge, war) is the wrong question for a beast.
- The two reasons that make stories are:
  - **it hurt me or mine**: a `blood_drawn` grudge from plan doc 1, including through the reactive loop when it killed someone bound to them;
  - **it threatens home**: a lair within 2 hexes of their residence.
- Faction bounties would be a third reason. They're in the v2 layer.

## Tracking pays off inside the fight
Tracking grants a `knows_secret_of` edge ("how it moves"). Plan doc 2's edge reader already turns a secret into +0.10 when the fighter is behind, and spends it. So preparation is mechanically real without a new mechanic, and it also reveals the temper on the lair card.

## The confront uses the appointment path
The THR-1519 appointment payoff is judged at the place, on arrival, which is exactly "you walked into its den, on purpose". The lair-arrival trigger (M4) must not fire twice for the same arrival, so the hunt's appointment takes precedence.

## Tensions carried forward
- Hunts depend on reasons existing. A young world has few `blood_drawn` grudges, so early hunts mostly come from the threat radius.
- A monster felled by someone else mid-hunt resolves through the appointment's missed branch. That's natural, and it's a story in itself ("someone else got there first").

## Vision premises touched
A grief becomes a pursuit, and undertakings and encounters are joined.

## Revisions during review (2026-09-23, intent-judge run 1)

- **The payoff's opponent.** Seeds target the mortal they were planted on, so the confront would have faced the hunter. `inheritSiteAsTarget` makes the monster the target, and plan doc 2's rule ends any fight whose opponent is the fighter, or dead, at its first step.
- **Ownership.** `ownedVia: []` alone made every hunt refused as unowned; `selfOwned` is the plot's own answer.
- **Reasons.** The existing `gateExemption` door replaced a proposed new hook. The door now also opens for a grievance naming the monster, which THR-1536 gives to the bonds of a monster's victims.
- **The reveal.** THR-1533 had tracking reveal a weakness as a reach override. The plan reveals the temper and grants a `hidden_weakness` mark, which the fight reads as "Their secret" instead. The advantage path exists and is spell-ready, and a per-monster weakness-reach table is content nobody has authored. A veto invitation is on THR-1533.
