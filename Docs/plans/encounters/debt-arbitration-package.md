# Package critic — The Debt Arbitration

templateId: encounter.town.debt_arbitration
packageVerdict: connected
packageLeaves: A mortal who calls the arbitration leaves with a gold-tagged item from the warehouses (on a win), the house's lending record naming the claimant noble's household, and their standing with the town up or down, and can then make the noble owe them a favour for silence or turn the noble against them by telling the town; a mortal who takes the third leaves the house master owing them a favour, or leaves the town thinking less of them if the strongroom ran dry.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| PRIZE (engine; Vanguard crit / success / s@c) | the `#gold` possession drawn from step 1's `rewardPool` | attachment · possession, 🔗 linked | engine-rendered; the overviews say "paid in goods from the warehouses" | anchored |
| KNOW (Vanguard, all five bands) | the `political_secret` intelligence record "Where the house's money went", written on `$actor` in both success and failure metadata | concept `tooltipId: 'ui.knowledge'`, no `entityId` — the shipped shape (bell-tower-shoring, assize-letter, pilots-reckoning); the record shows in the actor's intelligence panel | yes: "{actor} keeps the house's lending record", which is the record's own label and detail | anchored |
| REP+ (Vanguard crit / success / s@c) | the mortal's standing with the settlement, `reputation_with` `$here` +0.10 | `reputation_with` edge, 📍 named — counterparty is a `location`, 🔗 linked (`entityId: '$here'`, `visualKind: 'location'`) | yes: the tag "reputation with {target}" enriches to the settlement's name, and `$here` is that same settlement (S4); the detail says "The town trusts…" | anchored |
| REP− (Vanguard failure / crit fail; Watcher failure / crit fail) | the same standing, down (−0.12 / −0.05) | as REP+ | as REP+: "The town trusts {actor}'s judgement with money less." | anchored |
| FAVOUR (Watcher crit / success / s@c) | the `owes_favor` edge from the house master to the mortal (`favor_creation`, debtor `$cast:master`) | `owes_favor` edge, 📍 named; both endpoints real — `$cast:master` is a must-persist individual (🔗 linked, `visualKind: 'agent'`) materialised at step 0, and the actor | yes: "{cast:master} owes {actor} a favour.", with the master as a linked concept | anchored |

Nothing to fold, nothing to bind.

**THR-1685 check.** Both reputation chips are anchored on `$here`, and the prose means the town, which is exactly the case the batch brief allows (`{target}` is the settlement on a board draw). No chip anchors `reputation with {target}` on a `$cast:` person. The one `$cast:` reputation write, `reputation_with` `$cast:claimant` −0.12 on the "Tell the town" reaction, has **no chip**. Its reaction intent names the noble in words ("the noble thinks far worse"), so it cannot trip the renderer defect.

**Carried, not a fold/bind (engine, already filed as BACKLOG in the final's caveat 1).** A step-0 `critical_failure` currently renders the chosen arm's `critical_failure` band. The REP− (and on the Vanguard arm, KNOW) chips there claim writes that never fired. This is a corpus-wide pre-fork defect and it is rare at 0.58 for an expert. The fallback aftermath is already authored chip-free for the day the engine fix lands. It is not this package's to fix.

## Half B — what it leaves behind

Every write is one the consumption ledger marks ✅ acted-on (`Docs/canon/consumption-ledger.generated.md`):

- **Possession** (Vanguard success side). A `#gold` item in the pack, linked from the PRIZE chip.
- **Intelligence record** (`political_secret`, Vanguard either way). `encounterScoring` reads it. The `political_secret` matcher lifts court / intrigue / blackmail / extort / betray encounters for this mortal. The record is visible in the intelligence panel, and its content (the noble's household emptied the bank) is exactly the leverage those encounters want.
- **Standing with the town** (`reputation_with` `$here`, both arms). The Location Profile standing row shows it, and the ambition tick acts on the `relates_to` edge.
- **Favours** (`owes_favor`, read by `phaseSecretsFavors`). Two sources: the master on the Watcher success side, and the claimant noble if the player picks "Keep the noble's debts quiet". Both debtors are named, must-persist people, so the favour points at someone the player can find again.
- **The noble's regard.** "Tell the town" drives the mortal's reputation with the noble down, and it shows in the agent Standings section.

The player sees all of it through the PRIZE, KNOW, REP and FAVOUR chips, the reaction choice, the town's standing row and the two named NPCs. The fork is the good part. Silence or exposure turns one secret into either a debt from a noble or a feud with one, and the lending record keeps feeding intrigue draws afterwards.

One thin spot is on record. No later template names this house, master or claimant. The follow-up is carried by the generic intelligence matcher and favour system, not by an authored sequel.

PACKAGE PASS
