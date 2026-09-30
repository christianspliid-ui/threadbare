# Package critic — Called to the Ring

templateId: encounter.town.fair_bout
packageVerdict: connected
packageLeaves: A mortal who wins the fair's purse bout walks away with a hedge-healer companion, a favour owed by the backer Oda Brisk, and the beaten champion Bram Tallow's resentment; a lost bout costs Oda Brisk's regard, and walking away from the challenge costs a little of Bram Tallow's.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| SCAR · reputation with {target} (bout: crit, success, at-cost) | The champion's regard for the mortal, falling (`bond_change` -0.08) | `reputation_with`: the edge anchored on its counterparty `$cast:champion`, `visualKind: 'agent'` (linked) | Yes: {cast:champion} (Bram Tallow) | anchored |
| BOND · companion (bout: crit, success, at-cost) | The hedge-healer `grant_companion` mints onto the actor | `companion` (linked at Tier 2 by node id). No sentinel can carry a minted companion's id at author time, so the chip anchors by `tooltipId: 'ui.companions'`, which resolves | Yes, by profession: "A hedge-healer", the word the Companions row shows beside the generated name | anchored (see note) |
| BOND · a favour owed (bout: crit, success, at-cost) | The `owes_favor` edge, with debtor Oda Brisk and creditor the mortal | `owes_favor`, named. Debtor anchored `$cast:backer`, `visualKind: 'agent'`; `ui.favour_owed` tooltip | Yes: {cast:backer} (Oda Brisk) | anchored |
| SCAR · reputation with {target} (bout: failure, crit fail) | The backer's regard, falling (`bond_change` -0.15) | `reputation_with`, `$cast:backer` | Yes: {cast:backer} | anchored |
| SCAR · reputation with {target} (walk away: base, i.e. crit, success, at-cost) | The champion's regard, falling a little (-0.05) | `reputation_with`, `$cast:champion` | Yes: {cast:champion} | anchored |
| SCAR · reputation with {target} (walk away: failure, crit fail) | The champion's regard, falling (-0.12) | `reputation_with`, `$cast:champion` | Yes | anchored |
| Fallback (mirrors the walk away, ids `bout.fallback.*`) | As walk away | As walk away | Yes | anchored |

**Nothing needs `fold` or `bind`.**
- Both cast members are materializing must-persist specs, so every `$cast` anchor resolves in both declared setting classes.
- The scene fiction stays in overviews and afterimages and claims no state: the purse, the crowd's bets, the crier, the stewards and the split brow.

**Note on the companion chip.** This is the corpus's first companion chip. Its referent is real (the encounter mints it, which counts as existing), and it is anchored lawfully. It is one click shallower than the catalog row allows, because there is no `$companion` sentinel to bind the minted node the way `$artifact` binds a minted item. That is an engine-side gap to log. It is not a reason to fold the chip.

## Half B — what it leaves behind

The encounter leaves three durable things on a win, and the player sees each one:

- **A companion.** It is on the Companions row and grants its heart/veil contribution while it stays.
- **A favour.** It is an `owes_favor` edge on the Standings/favour surfaces. The favour economy can collect it later, and it names Oda Brisk.
- **A standing edge.** Bram Tallow's regard falls, and a must-persist NPC now carries the fall.

A loss or a walk-away leaves a regard edge with one of the same two named people. Nothing is solitary: every ending moves a relationship with someone who persists in the world.

**Fixed in this pass:**
- The champion's regard fired on every win but was chipped on one band. It is now reported on all three.
- The fallback ending carried no chips for its writes and contradicted its own step. It now mirrors the walk away.

PACKAGE PASS
