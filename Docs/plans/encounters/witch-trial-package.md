# Pass 3b — Package critic: The Witch Trial

templateId: encounter.town.witch_trial
packageVerdict: connected
packageLeaves: The mortal leaves either a healer (Maud Ellery, or the town's own healer) who trusts them and a healing remedy in hand, or a magistrate who trusts them less; the town's regard moves either way, a hidden mark records that the miller ground the spoiled rye knowingly (a later investigation can surface it), and the quiet reaction leaves the magistrate owing them a favour.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `witch.crit/win/cost.healer_trust` | the bond between the mortal and the bound healer | `$cast:accused` actor (linked); bond = `relates_to`, anchored by both endpoints | yes — `{cast:accused}` in overview and detail | anchored |
| `witch.crit/win/cost.town_regard` | reputation with the town | `reputation_with`, counterparty `$here` location (linked) | yes — `{location}` | anchored |
| `witch.crit/win/cost.the_millers_rye` | the hidden mark the encounter writes on `$actor` | hidden mark (named, tooltip `ui.hidden_mark`); minted by this encounter (catalog clarification 1) | yes — "the miller ground the rye knowing it was spoiled", the mark's own content | anchored |
| `witch.fail/critfail.magistrate_trust` | the bond with the bound magistrate | `$cast:magistrate` actor (linked) | yes — `{cast:magistrate}` | anchored |
| `witch.fail.town_regard` / `witch.critfail.town_regard` | reputation with the town (loss) | `reputation_with`, `$here` | yes | anchored |
| PRIZE (engine-rendered) | the drawn item | item template, `#healing` + `#provision` (3 bearers, all possession) | yes — "a remedy from the house"; true of every bearer after the filter fix | anchored |

No chip folds or binds. The miller, the boy, the mill loft, the stocks and the pyre are scene fiction and correctly carry no chip.

One package-level fix applied before this verdict (from systems): the prize filter `#healing` alone could draw the Sorrowheart Mare, which the overview's "presses a remedy into {actor}'s hands" would contradict. Narrowed to `#healing` + `#provision`.

## Half B — what it leaves behind

Four writes, all read downstream and all visible: the bonds (healer / magistrate) feed social encounter generation and the agent Standings; `reputation_with $here` feeds the Location Profile standing row and reputation gates; the `owes_favor` edge from the quiet reaction is what the Favor call card is dealt on; the `investigation`-family hidden mark is consumed by the hidden-mark reveal roll when the mortal takes an investigation encounter. The player sees each on a sheet. **connected.**

PACKAGE PASS
