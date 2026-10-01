# Package critic — The Inheritance Wake (slot 2, slug inheritance-wake)

templateId: encounter.town.inheritance_wake
packageVerdict: connected
packageLeaves: A mortal who keeps faith with the widow wins the eldest heir's trust, joins the local Temple of the Spheres congregation on the parish roll and raises the village's regard; one who writes a fair split instead wins the youngest's trust and the same parish place; a loss lowers the village's regard and costs either the eldest's or the widow's trust, by name.

Judged: `Docs/plans/encounters/inheritance-wake-final.md` (§ 11 step effects, § 13 chips, § 14 reactions) and the compiled package `inheritance-wake.package.json`, against `reference/anchor-catalog.generated.md`. Arms: `positive` (Sworn, and `fallback`), `negative` (Renegade). Base overviews carry `changes: []`, and every band is authored per arm, so no arm-level chip can render.

## Half A — anchoring

| Arm · band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| pos + fallback · crit / success / cost | BOND · reputation with {target} (gain) | `$actor → $cast:eldest`: the `relates_to` bond (trust +0.15), read by `getReputationWith`'s bond leg | individual `agent` 🔗 linked; `{target}` reads the chip's own person anchor since THR-1685 (`1f2014e0`, merged 2026-09-30) | yes. The narrative and every afterimage name {cast:eldest}; the detail "{cast:eldest} trusts {actor} after that night." | anchored |
| all wins · both arms | BOND · a membership | `member_of` edge `$actor → ` local `temple_of_spheres` congregation (`membership_change join`) | `faction` 🔗 linked, authored `$faction:<defId>` (catalog row; shipped as `$faction:builders_fellowship` in well-sinking) | yes. The overview says "put {actor}'s name on the parish roll"; the concept names the Temple of the Spheres | anchored |
| all wins · both arms | BOON · reputation with {target} (gain) | `reputation_with` edge to `$here` (+0.05) | `location` 🔗 linked via `$here` | yes. "The village thinks better of {actor}." | anchored |
| neg · crit / success / cost | BOND · reputation with {target} (gain) | bond `$actor → $cast:youngest` (trust +0.15) | `agent` 🔗 linked | yes. The Renegade narrative and afterimages name {cast:youngest} | anchored |
| all failure / crit_fail | SCAR · reputation with {target} (loss) | `$here` edge, −0.06 (step 1) or −0.03 (step-0 crit-fail route) | `location` | yes | anchored |
| pos · failure | BOND · reputation with {target} (loss) | `reputation_with` edge to `$cast:eldest` (−0.08) | `agent` | yes | anchored |
| neg · failure | BOND · reputation with {target} (loss) | `reputation_with` edge to `$cast:widow` (−0.08) | `agent` | yes. The spine names {cast:widow}, and the overview names the widow's wish | anchored |

There are 36 chips across 15 faces. No chip needs a fold or a bind. The farmer, the farm, the custom, the promise, the deed, the parish priest and the middle child are scene fiction, and no chip claims them.

**The loss-chip trap, checked.** The systems pass caught that a negative `trustDelta` on a fresh bond clamps at zero, which would leave `reputation with {target}` unchanged under a "trusts less" chip. The final writes `reputation_with` on the person for each loss, and the edge leg outranks the bond leg, so the chip names the number that moved. Confirmed in the package: `failureMetadata` on both arms carries `reputation_with { targetAgentId: '$cast:eldest' | '$cast:widow', delta: -0.08 }`.

### Write-backing, path by path

- **Wins (all three success bands, both arms).** Step-1 `successMetadata`: bond, `membership_change`, `reputation_with $here`. One write per chip.
- **Step-0 failure then step-1 success.** −0.03 then +0.05: the village BOON nets a gain.
- **Failure** (only through step 1). −0.06 village plus −0.08 on the person: backs SCAR + BOND loss.
- **Critical_failure.** The step-0 route fires −0.03 and the step-1 route −0.06 plus the person writes. Both arms' crit-fail faces carry only the village SCAR, true on both routes.

### Word budget and page read

- Every chip is detail-only with no `causeClause`, and the longest is 10 words.
- Order is scar · bond · boon · path on every face.
- An in-memory run of the `check:encounter` gate functions over the package (`checkCompositionContract`, `auditTemplate`, the liveness validators, `doctrineV2Warnings`, `pinnedForkAxisWarnings`) first returned **four `[page]` warnings**. Sworn critical_success and success (and their fallback copies): the overview's "with all three children at the grave" and the reaction intent "Stay beside the widow at the grave" share "at the grave the". **Fixed in this pass:** the intent now reads "Stay beside the widow through the burial." That is a mechanical defect list, so it does not consume a critic loop. The re-run shows 0 violations, 0 register failures, 0 liveness problems and 0 warnings.

## Half B — what it leaves behind

- **A bond with one named child** (`relates_to`, trust and sentiment). Social scoring and leverage read it, and so does the agent's Standings list (bond leg of `getReputationWith`). The eldest or the youngest is a must-persist named NPC the player can find again.
- **Temple membership** (`member_of`, starting rank). This is the real, consequence-bearing faction leg: rank, access, faction-gated draws, and the faction sheet's roster. The chronicle line ("joins the Temple of the Spheres") fires because `chronicle: true`. The player sees it on the chip, on the mortal's sheet and in the chronicle.
- **Village standing** (`reputation_with $here`), shown on the Location Profile Standing row and read by location-gated draws.
- **On a loss**, a named person's lowered standing (eldest or widow) and a soured bond. These are the threads a later social encounter can pick up.

The fork is what makes it good. Loyalty or fairness decides *which* child the mortal is bound to, and *who* is let down on a loss: the heir or the widow.

One thin spot, on record and not blocking. The membership chip can name a join that did not happen for a mortal already in the Temple (`already_member` no-op; the systems caveat, and the same exposure well-sinking shipped with).

PACKAGE PASS
