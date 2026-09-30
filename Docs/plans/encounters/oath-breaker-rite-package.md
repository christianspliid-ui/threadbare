# Package critic — The Oath-Breaker's Rite

templateId: encounter.town.oath_breaker_rite
packageVerdict: connected
packageLeaves: The town where the rite was held keeps the result: a Tended Shrine that makes the next Veil rite there easier, or Under Watch that makes quiet Shadow work there harder, plus the mortal's standing with that town up or down; a failed release also leaves the mortal Cursed for a while, and the weaver and the hedge-priest stay in the town as named people.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| CURSED (Archivist failure / crit fail) | the `trait.condition.cursed` condition granted on `$actor` by the Archivist failure half | attachment · condition, 🔗 linked (`entityId` = template id, `visualKind: 'attachment'`) | yes: the noun "Cursed" is the sheet name; detail names {actor} as bearer | anchored |
| WATCH (Archivist failure / crit fail; Heretic failure / crit fail) | `trait.condition.location.under_watch` on `$here` (intensity 0.6, 48 ticks) | attachment · condition, 🔗 linked | yes: "Under Watch" is the sheet name; "the town" is `$here`, the settlement the encounter is set in | anchored |
| SHRINE (Archivist crit / success / s@c) | `trait.condition.location.tended_shrine` on `$here` | attachment · condition, 🔗 linked | yes: "A Tended Shrine" is the condition's own `name`; "the shrine in town" is the place the condition sits on | anchored |
| REP− (every failure half on both arms) | `reputation_with` `$here` −0.10 (Archivist) / −0.08 (Heretic) | `reputation_with` edge, 📍 named; counterparty `location`, 🔗 linked (`entityId: '$here'`, `visualKind: 'location'`) | yes: "reputation with {target}" renders the settlement's name, which is `$here` | anchored |
| REP+ (every success half on both arms) | `reputation_with` `$here` +0.08 / +0.06 | as REP− | as REP− | anchored |

Nothing to fold, nothing to bind. The two scene-local objects (the oath-stone, the strangers at the gate) carry no chip, which is correct. They live in the overviews.

**THR-1685 check.** Both reputation chips anchor `$here`, and the prose means the town. That is the case the brief allows. No chip anchors `reputation with {target}` on `$cast:priest` or `$cast:oathbreaker`, and no `$cast:` reputation write exists.

**Setting check (bind risk).** The encounter is `urban`-only, and every place chip targets `$here`, so each place write lands on the settlement that `{location}` and "the town" name. Caveat 5 in the final (`{location}` may resolve to a Place) is precedent-consistent. `$here` resolves through the same binding, so the chip and the prose still agree. No bind needed.

**Carried, not a fold/bind.** The corpus-wide step-0 critical failure defect is the same one debt-arbitration shipped with (final caveat 1, BACKLOG). On that path the chosen arm's crit-fail chips (CURSED/WATCH/REP− or WATCH/REP−) render with no write behind them. The `fallback` aftermath is already chip-free for the day the fix lands. It is not this package's to fix.

## Chip declarations for the implementer (exact)

| Chip | `stateNoun` | Shipped precedent |
|---|---|---|
| CURSED | `{ text: 'Cursed', entityId: 'trait.condition.cursed', visualKind: 'attachment' }` | `src/data/encounters/the-drowned-archive.ts` (~L869) |
| WATCH | `{ text: 'Under Watch', entityId: 'trait.condition.location.under_watch', visualKind: 'attachment' }` | `src/data/encounters/the-sign-over-the-ruin.ts` (~L666), `ledger-by-lamplight.ts` (~L447) |
| SHRINE | `{ text: 'A Tended Shrine', entityId: 'trait.condition.location.tended_shrine', visualKind: 'attachment' }` | `src/data/encounter-content.ts` (~L11768, the offering template's `tended` chip) |
| REP+ / REP− | `{ text: 'reputation with {target}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }` | `src/data/encounters/debt-arbitration.ts` (~L500, ~L580) |

Optional, not required for Law 56: on WATCH and SHRINE, add a `concepts` entry `{ text: 'town', entityId: '$here', visualKind: 'location' }` so "the town" in the detail links to the settlement. This follows the THR-1462 pattern next to the `tended` precedent in `encounter-content.ts`. The attachment `tooltipId` derives automatically from `entityId`, so do not set one by hand.

## Half B — what it leaves behind

Every write has a reader that is already live:

- **Tended Shrine on the town.** It is read by the Veil term in `LOCATION_CONDITION_STEP_MODIFIER` (`src/engine/resolutionModifiers.ts`) for 144 ticks, and it shows on the Location page. The next ritual encounter in that town really does roll easier.
- **Under Watch on the town.** It is read by the Shadow step modifier for 48 ticks. The same condition is written by ledger-by-lamplight, the-drowned-archive and the-sign-over-the-ruin, so it composes with other encounters' writes in the same town. Shown on the Location page.
- **Cursed on the mortal.** A timed condition with star/gold modifiers, shown on the bearer's sheet.
- **Standing with the town.** `reputation_with $here` on every half. It shows on the Location Profile standing row, and the ambition tick acts on the edge.
- **Two must-persist NPCs** (the weaver Tobin Marle, the hedge-priest Wendel Crane) stay in the town.

The player sees each of these through a linked chip, and the town's page carries the condition afterwards. That makes the result `connected`. The thin spot is the same one debt-arbitration has: no authored sequel names the weaver or the priest, so the NPCs are persistent but nothing picks them up yet. The follow-up is carried by the generic condition and reputation readers.

PACKAGE PASS
