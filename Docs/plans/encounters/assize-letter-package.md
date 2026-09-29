# Package critic — The Assize Letter

templateId: encounter.town.assize_letter
packageVerdict: connected
packageLeaves: The mortal leaves owing or owed trust with the assize clerk Wenna Loy (a relationship later encounters with her read), knowing who laid the heresy charge (a knowledge record that shapes which encounters they are drawn to), and on the road away from the town where the clerk found them, walking toward a place with something happening, which the player watches on the map.

## Half A — anchoring

| Chip | Band(s) | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| `assize.clerk_trusts` BOND · reputation with {target} | crit, success, s@c | The clerk's regard for the carrier (`relates_to` via `bond_change`) | actor · individual 🔗 (`$cast:clerk`, declared key) | Yes: `{cast:clerk}` enriches to Wenna Loy / the reused clerk | anchored |
| `assize.knows_the_accuser` BOON · knowledge | crit, success, s@c | The `intelligence` record "Who laid the heresy charge" | `ui.knowledge` concept (📍 named) | Yes: "who laid the heresy charge" | anchored |
| `assize.on_the_road` PATH · seed | crit, success, s@c | The mortal's travel intent away from the current town | `ui.aftermath_seed` concept (📍 named). `journey` is deliberately not a chip kind (catalog), so the noun uses shipped precedent | Yes: "{actor} … away from {location}" | anchored |
| `assize.clerk_doubts` SCAR · reputation with {target} | failure | The clerk's reduced regard | actor 🔗 `$cast:clerk` | Yes | anchored |
| `assize.clerk_done` SCAR · reputation with {target} | crit failure | The same, harder in the fiction (the write is the same −0.1) | actor 🔗 `$cast:clerk` | Yes | anchored |

The pre-fix PATH chip declared `stateNoun: { text: 'journey' }` with no anchor. That would have failed Law 56 clause 2 at `check:encounter`. It is fixed to `seed` / `ui.aftermath_seed` (reasoning in `assize-letter-systems.md` § 5). No chip folds or binds.

## Half B — what it leaves behind

Three writes, all consumed (`consumption-ledger.generated.md`: `bond_change`, `intelligence` and `agent_relocation` are all ✅ acted-on), and all visible to the player:

- The clerk bond shows on the cast tile and both sheets.
- The knowledge record shows in the intelligence panel.
- The relocation shows as the mortal leaving town on the map.

The failure side leaves only the soured clerk bond, which is honest to "turned back" and "never arrived".

**Residual thinness, not a defect.** A travel intent aimed at "away ≥3 hexes" steers weakly when nothing is happening where it lands (`relocationIntent.ts` header, THR-1148). On a quiet map the departure may read as drift. Crit and success-at-cost write the same deltas as success (step-level writes cannot be band-keyed without reactions), so the fiction alone carries the "a night early" and "no sleep" differences.

PACKAGE PASS
