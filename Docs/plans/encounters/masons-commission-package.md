# Package critic — The Mason's Commission

templateId: encounter.town.masons_commission
packageVerdict: connected
packageLeaves: A win leaves the town (the mortal's current settlement) holding a Festival and a better opinion of the mason, a tool from the town's store in their pack, and an appointment with the inspector to be back on the site when the scaffold comes down — kept, it opens more building work there; missed, the promise to the inspector breaks — while a loss leaves the town thinking less of them.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND/SCAR reputation with {location} (×5 bands) | the mortal's standing with this town | `$here` → Location, linked | yes: `{location}` enriches to the town's name | anchored |
| BOON Festival (×3 success bands) | the Festival condition on the town | condition template (attachment), linked | yes: "{location} holds the fair it had put off", set up in the step 0 spine | anchored |
| PATH appointment (×3 success bands) | the promise to be on the site when the scaffold comes down | `$appointment` (THR-1518), resolves because the template plants an appointment | yes: "due back on the site…" | anchored |
| PRIZE (engine) | the `#tool` item drawn from `rewardPool` | item, linked | the overview says "paid … in kind" | anchored |
| growth: stone reach (fallback) | stone reach | reach, named | yes | anchored |

No fold, no bind. Fixed in this pass: the reputation noun used `{target}`, which renders the *mortal* on a self-targeted scene, so it now uses `{location}` anchored to `$here`. The Festival chip carried a dead `{location}` concept, which was removed.

## Half B

The encounter leaves state that later systems read. There is a place condition the Location Profile shows, and a Location reputation that settlement standing reads. There is an item. There is an appointment with the inspector (an `owes_favor` edge) that the movement lean acts on, and it fires a `#build` sequel if kept or a `#tavern_night` sequel if missed. The player sees all of it: the chips, the town's condition, the item, and the trip back to the site.

PACKAGE PASS
