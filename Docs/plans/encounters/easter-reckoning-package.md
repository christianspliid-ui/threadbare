# Package critic — The Wrong Feast Day (slot 6, master-everyday-2, THR-1757)

templateId: encounter.town.easter_reckoning
packageVerdict: connected
packageLeaves: A proved reckoning books the master into the town's chapter house on synod day, three days out, with the dean Osric Fenwold as counterparty (kept or missed by where they go, and the dean comes looking if they miss it), moves their standing with the town, gives them the Spread the Faith ambition, and leaves a good-year or bad-year omen that the prose now states and that tilts later encounter draws.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `reckoning.{crit,win,cost}.the_towns_regard` (bond) | the mortal's standing with this town | `location` via `$here`, linked | yes, `{location}` | anchored |
| `reckoning.{crit,win,cost}.ambition` (path) | the assigned `ambition_spread_faith` | ambition content ref (`ui.ambition`, shipped precedent) | yes, "Spread the Faith" | anchored |
| `reckoning.{crit,win,cost}.synod_day` (path) | the appointment's place: the town, on synod day | `$appointment` → location, linked | yes, "{cast:dean} answers the reckoning in {location} in three days" | anchored |
| `reckoning.lost.the_towns_regard` (scar) | standing with this town, lost | `location` via `$here`, linked | yes | anchored |
| `reckoning.broke.the_towns_regard` (scar) | standing with this town, lost | `location` via `$here`, linked | yes | anchored |
| (omen, unchipped by design) | cultural/global `emit_omen`, `time` or `entropy` | no omen anchor kind exists | now told in the step-1 afterimages and the failure overview | n/a (correctly not chipped) |

No fold, no bind.

## Half B — what it leaves behind

- **The appointment.** This is the real thread. It is an `owes_favor` promise on the sheet, a place and a window, and two authored sequels. The player sees the PATH chip, then the mortal leaning toward the town, then one of the two scenes. Kept: the synod moves the feast, and the dean's feeling turns against the master. Missed: the dean finds them wherever they are.
- **Standing with the town** shows on the Location Profile, both signs.
- **The ambition** steers what the mortal does next. It is visible on their sheet.
- **The omen.** Orchestrator question: can the player recognise it happening? **As drafted, no.** It was unchipped (correctly, per restless-ossuary), but unlike restless-ossuary no prose told it, and no UI surface reads `emittedOmens`. It only biases later encounter draws. It was fixed in this pass: the three success-side step-1 afterimages say the town takes it for a good sign for the year, the step-1 critical-failure afterimage says a bad sign, and the failure overview carries the old priests' saying. The critical_failure overview stays silent because a step-0 critical failure emits no omen. On its own the omen is still `thin`: nothing downstream names it to the player. The package is `connected` because of the appointment.

## Fix-list

Applied by the editorial pass (prose only, no chip changes): the omen is told plainly, and the real-world feast name is removed.

PACKAGE PASS
