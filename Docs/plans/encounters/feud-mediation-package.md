# Package critic — Called to End a Feud

templateId: encounter.town.feud_mediation
packageVerdict: connected
packageLeaves: A mortal who ends the feud leaves with the house scribe as a companion, a favour owed by the house head Osric Venn, and the town thinking better of them; a failed peace leaves the town thinking less of them, and the mortal may side openly with Maud Carrow's house against Osric Venn's.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {location} (crit, success, at-cost) | The town's regard for the mortal, rising (step 2 `successMetadata` `reputation_with $here` +0.06) | `reputation_with`, named; anchored on the counterparty `$here`, `visualKind: 'location'` (location is linked) | Yes: {location}, the town that sent for the mortal. THR-1685 does not bite, because the town is what the prose means | anchored |
| BOND · a favour owed (crit, success, at-cost) | The `owes_favor` edge: debtor the accused head, creditor the mortal (step 2 `favor_creation`) | `owes_favor`, named. Debtor anchored `$cast:accused`, `visualKind: 'agent'`; `ui.favour_owed` tooltip | Yes: {cast:accused} (Osric Venn, or the reused noble/elder) | anchored |
| BOND · companion (crit, success, at-cost) | The companion `grant_companion companion.guild-scribe` mints onto the actor | `companion` (linked at Tier 2 by node id). There is no `$companion` sentinel (#1115), so the chip anchors by `tooltipId: 'ui.companions'`. This is the `fair-bout` precedent | Yes, by role: "the house scribe" (see the note) | anchored |
| SCAR · reputation with {location} (failure, crit fail) | The town's regard, falling (step 2 `failureMetadata` `reputation_with $here` −0.06) | `reputation_with`, `$here`, `visualKind: 'location'` | Yes: {location} | anchored |

**No chip needs `fold` or `bind`.**
- `$here` always resolves, because the encounter spawns only in a settlement (`urban`/`rural`).
- Both cast heads are lazily materialized, must-persist specs. Since F1 they use disjoint reuse roles, so `$cast:accused` resolves in both setting classes and never collides with `$cast:aggrieved`.
- The scene fiction claims no state. The letter, the mill contract, the purses, the hall and the fee stay in overviews and afterimages.
- The hidden mark on `$cast:accused` is concealed by design and is correctly not chipped.

**Note on the companion chip (advisory, not a fold).** The referent is real: the encounter mints it, which counts as existing. The chip is one click shallower than the catalog allows, for the same engine-side reason `fair-bout` logged (#1115).

One wording risk remains:
- The chip's concept says "house scribe", but `companion.guild-scribe`'s profession is *Guild Scribe*, and that is the word the Companions row prints beside the generated name.
- The `fair-bout` precedent passed because its chip used the row's own word.
- The fiction justifies the gap: a scribe employed by a great house. A player who opens the Companions row will still find a scribe, so this is not a dead chip.
- If the implementer wants chip and row to match exactly, the one-word change is "scribe" (concept `text: 'scribe'`). Do not edit the band sentence. This is optional.

The reactions' writes are reaction effects, and none is chipped on a band face:
- `reputation_with` +0.03;
- `intelligence` "The Letter That Began The Feud";
- `bond_change` ±0.12 with the two heads.

Each reaction's intent line names what it touches. The failure pair must override `reactions` on `failure`/`critical_failure`, as the systems spec requires. Otherwise the success pair's reactions would sit under a SCAR page. The implementer should confirm this at compile.

## Half B — what it leaves behind

A win leaves three durable things, and the player can see each one:

- **Standing with the town.** The mortal's `reputation_with` the settlement goes up. The Location Profile standing row reads it, and the standing-gated content in that town reads it too.
- **A favour.** It is a live `owes_favor` edge on a must-persist house head, so the favour economy can call it in later. It names the head.
- **A companion.** The scribe joins the Companions row and contributes while they stay.

A second, concealed write sits underneath. The accused head carries a `concealed_action` hidden mark (the letter was his own draft), which investigation-family resolutions can reveal. This is thin in practice (C3), and it is concealed by design.

A loss is not solitary either:
- The town's standing falls on a row the player can open.
- The "Side with the house that was insulted" reaction moves two named heads' bonds in opposite directions.

**Verdict: connected.**

PACKAGE PASS
