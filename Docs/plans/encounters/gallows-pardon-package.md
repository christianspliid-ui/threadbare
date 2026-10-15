# Package critic: The Gallows Pardon

templateId: encounter.town.gallows_pardon
packageVerdict: connected
packageLeaves: Whether the youth lives or hangs, the master leaves with his mother Agnes Thorne trusting or blaming them, the town thinking better or worse of them, the lord's justice Sir Walter Greve holding a grudge if the plea won, and a Builders' Fellowship errand coming their way later, and the player sees each change on Agnes's and the justice's sheets, the town's standing row, and the errand when it arrives.

## Half A: anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| The Town's Thanks (crit/win/cost) | standing with the town | location `$here`, linked (`reputation_with`: anchor the counterparty) | yes: {location} | anchored |
| The Mother's Trust (crit/win/cost) | the mother's bond | agent `$cast:mother`, linked (concept) | yes: {cast:mother} | anchored |
| The Justice's Grudge (crit/win/cost) | the justice's bond | agent `$cast:justice`, linked (concept) | yes: {cast:justice} | anchored |
| The Builders' Work (crit/win/cost/failure) | the `#fellowship_errand` seed planted on the master | seed anchors through its carrier: agent `$actor`, linked (catalog rule 2) | yes: {actor} | anchored |
| A Plea That Failed (failure) | standing with the town | `$here` | yes | anchored |
| The Mother's Blame (failure, crit-fail) | the mother's bond | `$cast:mother` | yes | anchored |
| Blamed for the Rope (crit-fail) | standing with the town | `$here` | yes | anchored |

There are 17 chip instances across five bands, 8 distinct chips, and none folds or needs a bind. Every referent is something the encounter finds (`$here`, `$actor`) or materialises (`mother`, always spawned; `justice`, reused or spawned). The youth is deliberately no node, and no chip points at him.

**The seed honesty check (this package's question).** As drafted, the PATH chip read "The youth's people will stand {actor} a drink one evening". The chip was anchored, since its carrier is `$actor`, but it was **false in fact**: its `#tavern_night` query can never resolve at the seeding site (all ten members gate on a tavern Place; the site judges the Location tier, `encounterSeeding.ts:213-233, 367-384`). So the seed always withered into a narrative line, and no evening ever came. Anchoring was clean, but the promise was dead. That is the Unsafe Bridge failure in a new form, and every earlier stage passed it. The seed now targets `#fellowship_errand`, whose five members all accept `urban`, and the chip reads "The builders who worked beside the youth will send {actor} work". The sentence promises work and no particular scene. Any member delivers it.

## Half B: what it leaves behind

The encounter writes up to two bonds on two persistent cast members, a town standing edge, and a placeless seed. The bond and standing edges are read by later social draws and by the reputation gates. Agnes and the justice must persist, so a later encounter can find either again. The seed spawns a Builders' Fellowship errand (repair a wall, lay a foundation, survey a site …) on the master, if they are still in a town when it falls due. The player sees the bonds on both sheets, the standing on the town's row, and the errand when it arrives. The errand arrives as work for the master who spoke at the gallows, which is the thread the taken hook (`hook.the_great_building`) sets up.

Verdict: **connected**. It is not `thin`, because all three kinds of write are read by live systems, and the seed now actually fires.

## Fix-list

None outstanding. The seed retarget and chip rewrite were applied before this pass (systems § 4, editorial fix 8).

PACKAGE PASS
