# Package critic (Pass 3b): The Vault Before the Rains
> Slug: cathedral-vault | Date: 2026-10-05 | Batch: master-everyday (THR-1688), slot 7
> Inputs: `cathedral-vault-final.md` (Package transcription JSON, authoritative), `cathedral-vault-systems.md`, `master-everyday-brief.md` slot 7, `reference/anchor-catalog.generated.md`, `reference/nudge-authoring-spec.md` § Consequences rules 0 / 0b.

templateId: encounter.town.cathedral_vault
packageVerdict: connected
packageLeaves: When the vault stands, the town gets a Festival for the new church and the abbot (a lasting named person) comes to trust the builder; when it fails, the abbot blames them and the town's standing toward them drops. All of this shows on the town's page and the abbot's sheet, and later encounters there read it.

**Machine gate:** not run. `Docs/plans/encounters/cathedral-vault.package.json` did not exist when this pass ran (it is being transcribed in parallel), so `node .cache/check-encounter.mjs --package …` had no input. This verdict reads the final's transcription JSON directly. Run the gate on the package once it lands.

## Half A: anchoring

The four distinct chips repeat across bands (5 bands × 2 arms + 4 fallback bands). One row per distinct chip. The id lists show where each one appears.

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND gain · "The Abbot's Trust" (`vault.{pos,neg,fb}.{crit,succ,cost}.abbot_trust`): "{cast:abbot} trusts {actor}'s judgement of stone now." | The abbot, a must-persist cast actor (reused monk/priest or minted "Anselm Hale"), and the sentiment/trust edge to the actor. Written by `bond_change $cast:abbot` in the success metadata of the strike, wait and fallback arms. | Actor · `individual`, 🔗 linked (`visualKind: agent`, `entityId: $cast:abbot`). Under THR-1685 the `reputation with {target}` noun reads the abbot's name. | Yes. `{cast:abbot}` renders the abbot's own name. | anchored |
| BOON · "A Feast Day" (`vault.{pos,neg,fb}.{crit,succ,cost}.feast`): "{location} keeps a feast for the new church." | The `trait.condition.location.festival` condition granted to the scene's settlement (`apply_condition` → `$here`, 0.5, 36 ticks) in the same success metadata. | Attachment · condition template, 🔗 linked (`visualKind: attachment`). | Yes, with a caveat. `{location}` names the scene's place. If the mortal is standing at a Place inside the settlement, it names the Place and the write lands on the settlement (systems caveat 2). This matches existing precedent, and there is no `{here}` token. It names a real object, so this is not a fold or bind. | anchored |
| SCAR · "The Town's Doubt" (`vault.{pos,neg,fb}.{fail,critfail}.town_doubt`): "{location} no longer trusts {actor}'s word on stone." | The actor's `reputation_with` standing at the settlement. Written by `reputation_with $here` in failure metadata (−0.08 strike, −0.05 wait). | `reputation_with` edge, anchored on the counterparty location, 🔗 linked (`visualKind: location`, `entityId: $here`). | Yes, with the same `{location}`-may-be-a-Place caveat. | anchored |
| BOND loss · "The Abbot's Blame" (`vault.{pos,neg,fb}.{fail,critfail}.abbot_blame`): "{cast:abbot} blames {actor} for the vault." | The abbot, and the drop in sentiment/trust. Written by `bond_change $cast:abbot` in failure metadata (−0.12/−0.12 strike, −0.08/−0.08 wait). | Actor · `individual`, 🔗 linked. | Yes. | anchored |

All the chips are anchored, and none needs a fold or bind. The vault, centering, wedges, mortar, abbey and church stay scene-local and are never chipped. The fallback `critical_failure` band has no chips. That is correct, because no write fires on the step-0 terminal path.

**Rule 0 (backing) check, per band.** Step effects split by `isStepSuccess`. The three success-side aggregate bands (critical_success, success, success_at_cost, which includes a step-1 near_miss) always ran step 1's success metadata, so the Trust and Feast chips are backed. The failure and critical_failure bands from step 1 ran its failure metadata, so the Doubt and Blame chips are backed. One exception, already known: a step-0 `critical_failure` ends the action after the `courage_prudence` pole is recorded. The chosen arm's `critical_failure` page then shows Doubt and Blame with no write behind them. This is the corpus-wide engine gap (debt-arbitration § 9, BACKLOG; final caveat 1). It cannot be fixed in content, and the fallback band will tell that path correctly once the engine fix lands. Recorded here, not counted against the package.

**Reactions** (not chips; each intent clause checked against a write):
- Credit The Crew → `bond_change $cast:foreman` +0.12
- Accept The Thanks → `reputation_with $here` +0.04
- Stay And Rebuild → `bond_change $cast:abbot` +0.06/+0.04
- Defend Their Name → `reputation_with $here` +0.03 and `bond_change $cast:abbot` −0.06

Every claim names a write. Two of them (Defend Their Name and Accept The Thanks) move the same two counterparties the chips name, so the reaction choice visibly moves the state the page just reported.

## Half B: what it leaves behind

It leaves three things, each on a real object the player can open.

1. **A Festival condition on the settlement**, for 36 ticks. It shows on the location page and the hex. The movement reader picks it up as crowding, and the condition pool sees it. This is the brief's "place" hand, and it ends warm on every success side.
2. **A must-persist abbot**, with a sentiment and trust edge to the master in either direction (reciprocal). The abbot stays in the world as a named person, and later social and relationship scoring reads that bond.
3. **The master's `reputation_with` the settlement**, on the failure side and through two of the reactions. It shows in the Standings row on the location profile, and the reputation gate on later encounter eligibility reads it.

The foreman also persists, and gets a bond if the player picks Credit The Crew. The brief's binding hand is relationship + place, with no swap, and both are wired on both arms. Slot 7 is meant to end warm on success, and it does.

**Verdict: `connected`.** Named systems act on every write (condition reader, reputation gate, bond-driven social scoring), and each one shows up on a page the player already uses.

## Notes (no action required)

- **Hollow chips on the pre-fork critical failure.** Corpus-wide engine BACKLOG. Rare at stone 0.76 in the master window.
- **`{location}` may name a Place** in the Feast and Doubt chip details while the write lands on the settlement. This is accepted precedent. If a `{here}`-style token that names the `$here` settlement is ever added, these two detail strings are the first ones to switch.
- **The wait arm compresses a season.** The Festival is written at resolution, while the prose says the church opened in spring. Accepted under NFP 5, and no chip promises a later date.
- **Abbot chips use `reputation`/`bond` with the noun `reputation with {target}` on a `bond_change` write.** This is the ruled-lawful precedent pairing (masons-commission). THR-1685 makes the noun name the abbot.

## Fix-list

None.

PACKAGE PASS
