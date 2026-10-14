# Package critic — The Spy in the Guildhall (Pass 3b)

templateId: encounter.town.guildhall_spy
packageVerdict: connected
packageLeaves: Naming the spy puts the mortal on the Merchant Consortium's rolls (visible on their sheet and the faction's roster) and plants Consortium errand work that turns up later; failing costs them standing with the town, and the reaction moves the guildhall warden's regard either way.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| `spy.crit.consortium_rolls` / `spy.win.consortium_rolls` / `spy.cost.consortium_rolls` (BOND · a membership) | the mortal's membership of the Merchant Consortium | `faction` — linked (`$faction:merchant_consortium`, `visualKind: 'faction'`) | yes — "the rolls of the Merchant Consortium" | anchored |
| `spy.crit.consortium_work` / `spy.win.consortium_work` / `spy.cost.consortium_work` (PATH · seed) | a pending Consortium errand (`encounter_seed`, `#consortium_errand`) | seed (`ui.aftermath_seed` tooltip) + concept `faction` linked | yes — "the Merchant Consortium, which has work for {actor}" | anchored (concept re-pointed from `$actor` to the faction it names) |
| `spy.fail.distrusted` (BOND · reputation with {location}) | the town's regard for the mortal | `location` — linked (`$here`) | yes — "{location} thinks less of {actor}" | anchored |
| `spy.critfail.named_wrongly` (BOND · reputation with {location}) | same | `location` — linked | yes | anchored |

No `fold`, no `bind`. The one urban class guarantees a settlement, so `$here` always names a town.

## Half B — what it leaves behind

The membership is a graph edge (`member_of`) that the faction rank system, the faction sheet's roster and every Consortium-gated encounter read; the seed is a pending encounter that a `#consortium_errand` template will spawn; the warden's bond and the town's reputation are read by the bond and reputation systems. The player sees the membership on the sheet, the errand when it arrives, and the town's standing in the standing readout. **connected.**

Weakness noted: the success_at_cost band has no write of its own (accepted engine limit — see the systems pass). Its cost is a scene fact only, and no chip pretends otherwise.

## Fix-list (applied)

1. Seed chip concepts: `$actor` → `$faction:merchant_consortium`.
2. Membership chip noun: `a guild membership` → `a membership` + `tooltipId: ui.faction_member`.

PACKAGE PASS
