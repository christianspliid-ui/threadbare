# Package critic — The Well Sinking

templateId: encounter.town.well_sinking
packageVerdict: connected
packageLeaves: A lined well leaves the village (the mortal's current settlement) thinking better of the well-sinker, puts the mortal on the rolls of the Builders Fellowship on the rival wright's word, and binds them to be back at the new well in three days when the reeve pays the second half of the fee (kept → the reeve pays at the well; missed → the reeve comes looking with the money held back) — while a collapsed shaft leaves the village thinking less of them and counting its advance as thrown away.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND/SCAR reputation with {location} (×5 bands) | the mortal's standing with this village or town | `$here` → Location, linked | yes: `{location}` enriches to the settlement's name | anchored |
| BOND a guild membership (×3 success bands) | the mortal's `member_of` edge into the Builders Fellowship | `$faction:builders_fellowship` → faction, linked (the definition ships, and one node exists in every world that can run this) | yes: "the rolls of the Builders Fellowship" | anchored |
| PATH appointment (×3 success bands) | the promise to be at this well when its water runs clear (the `owes_favor` edge carrying `properties.appointment`) | `$appointment` (THR-1518), legal: the template plants an appointment on step 1 `successMetadata` | yes: "at the well", with the reeve named as the payer | anchored |
| growth: stone reach (fallback) | stone reach | reach, named (`reach.stone`) | yes | anchored |

No fold, no bind. Fixed in this pass:

- The critical_failure SCAR chip was **unbacked** on the step-0-critical path, because a step critical_failure ends the action before step 1's failure writes. Step 0 now writes its own `reputation_with $here −0.03`.
- The SCAR cause "A lining that collapsed" became "A shaft that fell in", which is true on both paths into the band.
- The critical_success cause "Lined before dark" became "A clean job" (a step-0 critical also reaches this band).

The PATH chip is the only seed chip on the page. The engine-derived seed chip reads reaction effects only, and this seed rides step metadata, so there is no double render.

## Half B

The encounter leaves three things in the world that later systems read, and the player sees all three:

- **A Location reputation** that settlement standing reads.
- **A guild membership** that the Fellowship's rank ladder, `bf.*` quest access, faction chronicles and the faction sheet all read. The join fires a chronicle line.
- **An appointment.** The movement lean pulls the mortal back to the well by their leave margin. The `owes_favor` edge sits on their sheet. Kept, it fires `town.well_first_water` at the well, which is where the second half of the fee lands. Missed, the edge breaks and `town.well_gone_foul` finds them wherever they are.

The omen (good year / bad year) is dressing and carries no chip. The `#build` tag also makes the encounter a candidate for the Mason's Commission's "next work" query seed, which is a real incoming connection.

**Dependency:** the appointment half is only as connected as its two sequels. Until the orchestrator authors and registers `town.well_first_water` and `town.well_gone_foul` (and claims the `town.` prefix in `content-objects.ts`), the seed plants a promise that fires nothing. This is a **merge precondition**, not a package defect.

PACKAGE PASS
