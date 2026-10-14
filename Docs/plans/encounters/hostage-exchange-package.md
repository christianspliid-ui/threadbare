# Package critic: The Hostage Exchange

templateId: encounter.town.hostage_exchange
packageVerdict: connected
packageLeaves: When the exchange works, the master leaves with the held heir Edric Marrow trusting them, a sellsword band hired on a short contract, the captain Bram Hollis holding a grudge, and better standing in the town; when it fails, the heir doubts them and the town thinks less of them, and the player sees each change on the heir's sheet, the captain's sheet and the Companions row.

## Half A: anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| The Town's Thanks (crit/win/cost) | standing with the town | location `$here`, linked | yes: {location} | anchored |
| The Heir's Trust (crit/win/cost) | the held heir's bond | agent `$cast:heir`, linked (concept) | yes: {cast:heir} | anchored |
| The Sergeant's Band (crit/win/cost) | the companion minted from `companion.sellsword-band` | `companion` sheet noun, tooltip `ui.companions` (no `$companion` sentinel, #1115) | yes: "the sergeant's men", named in the step-1 spine | anchored |
| The Captain's Grudge (crit/win/cost), new | the captain's bond | agent `$cast:captain`, linked (concept) | yes: {cast:captain} | anchored |
| Terms Refused (failure) | standing with the town | `$here` | yes | anchored |
| The Heir's Doubt (failure) | the heir's bond | `$cast:heir` | yes | anchored |
| Blamed for the Peace (crit-fail) | standing with the town | `$here` | yes | anchored |
| The Heir's Blame (crit-fail) | the heir's bond | `$cast:heir` | yes | anchored |

No chip folds and none needs a bind. Every referent is something the encounter finds (`$here`) or materialises (`captain`, `heir`, the companion).

**The companion honesty check (the author's question).** Before the fix the chip read "travels with {actor} now". That promises a lasting follower, but the template is a 10-tick contract (`durationTicks`), and the engine's own join and depart lines speak of coin and a contract running out. The chip now reads "quit the captain for a short contract with {actor}". When the band leaves, its depart sentence ("…contract runs out at dusk…") confirms what the chip said instead of contradicting it.

## Half B: what it leaves behind

The encounter writes two bonds on two persistent cast members, a town standing edge and a companion node. The bond and standing edges are read by later social draws and by the reputation gates. The heir and captain must persist, so a later encounter can find either of them again. The companion contributes iron +3 while the contract lasts, and the player sees it join and leave in the Companions row. The player sees each of these: on the heir's and captain's sheets, the town's standing and the Companions row.

Verdict: **connected**. It is not `thin`, because two of the writes (standing, bond) are read by live systems and the companion is visible while it acts.

PACKAGE PASS
