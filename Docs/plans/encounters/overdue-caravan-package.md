# Package critic — The Overdue Caravan

templateId: encounter.town.overdue_caravan
packageVerdict: connected
packageLeaves: The merchant house's steward (a persistent named NPC) now thinks better or worse of the mortal, the mortal's thread to the god is stronger or thinner, and a new road-finding encounter is seeded on the mortal, so the next time the roads call the player sees who is asking and why.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| crit / success / SAC / fail / crit-fail `thread` | the thread `$ascendant` ↔ `$actor` | `thread` edge, named (tooltip) | "The thread to {actor}" | anchored |
| crit / success `reputation with {target}` (gain) | reputation with the steward | agent `$cast:steward`, linked | `{cast:steward}` | anchored |
| fail / crit-fail `reputation with {target}` (loss) | same | agent, linked | `{cast:steward}` | anchored |
| crit / success / fail `seed` | `#explore` sequel planted on the mortal | seed via carrier `$actor`, linked | `{actor}` | anchored |

The old road, the markers, the carters and the cutting live in prose only. None is a chip
referent, so nothing needs a fold or a bind.

## Half B — what it leaves behind

It leaves a standing change with a must-persist NPC who can come back in later encounters
(the reputation reads into encounter gating and interactions), a thread change visible in the
Threads panel, a query seed that fires a real `#explore` encounter on the mortal, and (on one
reaction) an intelligence record about the old road. The player sees all of it: the chips
name the steward and the thread, and the seeded encounter arrives on the same mortal.

Fix applied this pass: the success band wrote `reputation_with +0.08` without showing it, so
a `BOND · reputation with {steward}` chip was added there.

PACKAGE PASS
