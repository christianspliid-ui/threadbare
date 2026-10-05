# Package critic (Pass 3b): False Coin at the Mint

> Slug: coiners-mint | Batch: master-everyday, slot 5 (THR-1688) | Date: 2026-10-05
> Judged: `coiners-mint-final.md` (prose) against `coiners-mint.package.json` (what ships; authoritative)
> Brief: `master-everyday-brief.md` slot 5 (`standing` + `possession`, shadow 0.75 → 0.81, urban)
> Machine: `node .cache/check-encounter.mjs --package …coiners-mint.package.json` → clean 1, failing 0, warnings 0, systems `cast, rewards, reputation`

templateId: encounter.town.coiners_mint
packageVerdict: connected
packageLeaves: Win and the mortal carries The Coiner's Dies in their possessions and stands higher with the town on its standing row; lose and that standing drops; either way the closing choice moves their bond with the mint-master Marrin Coyle up or down, which his sheet shows and the town's later sendings read.

---

## Half A — anchoring

Every chip lives in `template.aftermathConfig.fallback.byOutcome.<band>.changes[]`. Eight chips across five bands, two referents.

| Chip (JSON path) | Referent | In the catalog? | Prose names it? | Backing write | Verdict |
|---|---|---|---|---|---|
| `byOutcome.critical_success.changes[0]` `coin.crit.trusted` | The actor's standing with the settlement the scene is in | `reputation_with` edge → anchor the counterparty `location`, 🔗 linked (`entityId: '$here'`, `visualKind: 'location'`) | Yes, `reputation with {location}` + "{location} thinks well of {actor} now." | step 1 `successMetadata` `reputation_with $here +0.05` | anchored |
| `byOutcome.critical_success.changes[1]` `coin.crit.dies` | The spawned item, The Coiner's Dies | `artifact` (common), 🔗 linked via `$artifact` | Yes, by its `nameOverride` name | step 1 `successMetadata` `spawn_artifact` (`nameOverride: "The Coiner's Dies"`, to `$actor`) | anchored |
| `byOutcome.success.changes[0]` `coin.win.trusted` | Standing with the settlement | as above, 🔗 linked | Yes | step 1 success `+0.05` | anchored |
| `byOutcome.success.changes[1]` `coin.win.dies` | The Coiner's Dies | `artifact`, 🔗 linked | Yes | step 1 success `spawn_artifact` | anchored |
| `byOutcome.success_at_cost.changes[0]` `coin.cost.vouched` | Standing with the settlement | as above, 🔗 linked | Yes. The cause clause "Vouched for by {cast:mintmaster}" names a real cast actor | step 1 success `+0.05` (net +0.02 when step 0 failed, which "a little better" matches) | anchored |
| `byOutcome.success_at_cost.changes[1]` `coin.cost.dies` | The Coiner's Dies | `artifact`, 🔗 linked | Yes | step 1 success `spawn_artifact` | anchored |
| `byOutcome.failure.changes[0]` `coin.fail.distrusted` | Standing with the settlement (loss) | as above, 🔗 linked | Yes | step 1 `failureMetadata` `−0.08` (plus step 0 `−0.03` when it failed) | anchored |
| `byOutcome.critical_failure.changes[0]` `coin.critfail.called_the_coiner` | Standing with the settlement (loss) | as above, 🔗 linked | Yes | step 1 `failureMetadata` `−0.08`, or step 0 `failureMetadata` `−0.03` if a step-0 critical failure ends the action | anchored |

**Direction is true on every path.** The worst success-side net is +0.02 (step 0 failed, step 1 succeeded), still a gain, and the success-at-cost chip already says "a little better". Every failure-side path is a net loss (−0.03, −0.08 or −0.11).

**No fold, no bind.** Nothing the chips name is scene fiction. The strongroom, the apprentice, the porter, the watch, the council and the assayer are all role nouns. They live only in the overview, the afterimages and the band fragments, and no chip claims them. The setting envelope is `urban` only, and `$here` resolves to a settlement on every draw, so there is nothing to bind.

Two declaration points I checked against source rather than the spec:

- **`stateNoun.text: 'reputation with {location}'`.** Spec rule 0c still says the noun field is not enriched and a placeholder "ships as literal braces". That is stale. `buildAftermathConsequences.ts` (THR-1205, `nounTextFor(…, enrich, …)`) enriches the noun, and `bell-tower-shoring.ts` already ships this same noun. The noun is legal. The stale sentence in the spec is a docs-hygiene matter for another ticket, not for this encounter.
- **Chip `title`s ("Trusted by the Council", "Called the Coiner").** The aftermath chip builder never reads `title`, so the player does not see them on this surface. "Council" and "the Coiner" are not graph objects. If a later surface does render `title`, both should be reworded to the mechanic (for example "Standing Raised" / "Standing Lost"). This is advisory and does not block.

## Half B — what it leaves behind

- **The Coiner's Dies** (`spawn_artifact`, tags `#shadow #tool`). A real artifact node. It appears in the mortal's possessions and on its own artifact sheet, and the boon chip links straight to it.
- **Standing with the settlement** (`reputation_with $here`, ±). The reputation gate and the settlement's Location Profile standing row both read this write. The chip links to the place. The council reaction (`coin.name_to_council` / `coin.name_to_court.*`) adds +0.03 on top. Standing is what decides whether that town keeps offering this mortal work, which is the brief's "name before the purse" made mechanical.
- **A bond with Marrin Coyle** (`bond_change $cast:mintmaster`, ±0.12, `must-persist`). Both reaction pairs write it on both sides of the ledger: mercy or loyalty raises it, justice lowers it. Marrin is a persisted NPC, and his sheet shows the relationship.

The player sees all three: a linked boon chip, a linked standing chip, and a reaction label whose intent says plainly that the mint-master "will remember" or "will not forgive". → **connected**.

The weak spot is honest but accepted. The apprentice, the moral centre of the reactions, is not a graph object. Naming them changes town standing and Marrin's bond, and leaves no record of the apprentice. That is the right choice under prose rule 7, because it invents no node, and it does not make the package thin.

## JSON ↔ final.md disagreements

1. **`template.supportBundle[0].supportRole`.** JSON has `mint_master`; final.md § 16 has `coiners_mint_master`. The JSON is authoritative and the checker is green on it. The doc row is stale, so correct the final.md § 16 cell if the doc is touched again. This changes nothing in game.

Everything else matches: ids, difficulties, deltas, effects, chips, reactions and prose strings.

## Fix list

None required.

PACKAGE PASS
