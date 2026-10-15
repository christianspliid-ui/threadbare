# The Fugitive Friar — Pass 3b Package critic

templateId: encounter.town.fugitive_friar
packageVerdict: connected
packageLeaves: A master who gets Brother Wendel Ashby out through the water-gate joins the Thieves Guild and keeps his Prayer Scroll; one who hides him under the stable floor keeps the scroll and wins the friar's trust; one who fails loses standing with the town — and each lands on a surface the player can open: the Guild's roster, the Attachments tab, the friar's sheet, the town's standing row.

Source of truth: `Docs/plans/encounters/fugitive-friar.package.json` (judged over the markdown where they differ — purpose lines "Take him through" / "Outlast the search", card **Stretch The Hunt**). Read alongside `fugitive-friar-final.md`, `master-everyday-3-brief.md` slot 5, the anchor catalog, and spec § Consequences rules 0 and 0b.

## Half A — anchoring

Backing writes, per band (rule 0):

- **Gate arm (positive) success sides** — `successMetadata`: `attachment_grant reward_tomes_scrolls_prayer_scroll → $actor`, `membership_change join thieves_guild → $actor (chronicle)`.
- **Hide arm (negative) and fallback success sides** — `successMetadata`: `attachment_grant reward_tomes_scrolls_prayer_scroll → $actor`, `bond_change $cast:friar +0.10 sentiment / +0.08 trust`.
- **Failure sides, every variant** — `failureMetadata reputation_with $here` (gate −0.07, hide/fallback −0.05). Step 0 also writes `reputation_with $here −0.03` on failure, which backs the critical-failure band on the route where a step-0 critical failure ends the action before the arm runs.

### Positive variant (gate arm)

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| critical_success | `friar.gate.crit.scroll` BOON · Prayer Scroll | The Prayer Scroll the friar gives the master | Attachment · possession — 🔗 linked (`entityId` = template id, `visualKind: attachment`) | Yes — "Prayer Scroll", "Brother {cast:friar}'s parting gift to {actor}" | anchored |
| critical_success | `friar.gate.crit.guild` BOND · a membership | The master's new `member_of` edge to the Thieves Guild | Faction — 🔗 linked (`$faction:thieves_guild`, `visualKind: faction`, tooltip `ui.faction_member`) | Yes — "The Thieves Guild has put {actor} on its rolls." | anchored |
| success | `friar.gate.win.scroll` BOON · Prayer Scroll | Same as above | Attachment · possession — 🔗 linked | Yes | anchored |
| success | `friar.gate.win.guild` BOND · a membership | Same as above | Faction — 🔗 linked | Yes — names the Thieves Guild | anchored |
| success_at_cost | `friar.gate.cost.scroll` BOON · Prayer Scroll | Same as above | Attachment · possession — 🔗 linked | Yes | anchored |
| success_at_cost | `friar.gate.cost.guild` BOND · a membership | Same as above | Faction — 🔗 linked | Yes — names the Thieves Guild | anchored |
| failure | `friar.gate.fail.trust` SCAR · Lost Trust | The master's standing with the settlement they are in | Location — 🔗 linked (`$here`, `visualKind: location`; `reputation_with` anchors the counterparty) | Yes — "{location} trusts {actor} less." resolves to the town's name | anchored |
| critical_failure | `friar.gate.critfail.trust` SCAR · Lost Trust | Same as above | Location — 🔗 linked | Yes | anchored |

### Negative variant (hide arm)

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| critical_success | `friar.hide.crit.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| critical_success | `friar.hide.crit.friar` BOND · The Friar's Trust | The master's bond with Brother Wendel Ashby (`must-persist` cast actor) | Agent (individual) — 🔗 linked (`$cast:friar`, `visualKind: agent`); the adapter substitutes the cast name for `{target}` on a person anchor (THR-1685) | Yes — "Brother {cast:friar} trusts {actor} now.", cause "Kept him hidden" | anchored |
| success | `friar.hide.win.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| success | `friar.hide.win.friar` BOND · The Friar's Trust | Bond with Brother {cast:friar} | Agent — 🔗 linked | Yes | anchored |
| success_at_cost | `friar.hide.cost.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| success_at_cost | `friar.hide.cost.friar` BOND · The Friar's Trust | Bond with Brother {cast:friar} | Agent — 🔗 linked | Yes | anchored |
| failure | `friar.hide.fail.trust` SCAR · Lost Trust | Standing with the settlement | Location — 🔗 linked | Yes — "{location}" | anchored |
| critical_failure | `friar.hide.critfail.trust` SCAR · Lost Trust | Standing with the settlement | Location — 🔗 linked | Yes | anchored |

### Fallback variant (mirrors the hide arm)

| Band | Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|---|
| critical_success | `friar.fb.crit.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| critical_success | `friar.fb.crit.friar` BOND · The Friar's Trust | Bond with Brother {cast:friar} | Agent — 🔗 linked | Yes | anchored |
| success | `friar.fb.win.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| success | `friar.fb.win.friar` BOND · The Friar's Trust | Bond with Brother {cast:friar} | Agent — 🔗 linked | Yes | anchored |
| success_at_cost | `friar.fb.cost.scroll` BOON · Prayer Scroll | The Prayer Scroll | Attachment · possession — 🔗 linked | Yes | anchored |
| success_at_cost | `friar.fb.cost.friar` BOND · The Friar's Trust | Bond with Brother {cast:friar} | Agent — 🔗 linked | Yes | anchored |
| failure | `friar.fb.fail.trust` SCAR · Lost Trust | Standing with the settlement | Location — 🔗 linked | Yes | anchored |
| critical_failure | `friar.fb.critfail.trust` SCAR · Lost Trust | Standing with the settlement | Location — 🔗 linked | Yes | anchored |

**Half A result: 24 of 24 chips anchored. No fold, no bind.**

Scene fiction that could have become a dead chip and did not: the water-gate, the mill, the stable floor, the grating and "the town's smugglers" all live in step prose, afterimages and band overviews only. The smugglers are the bridge to a real object — the overview says the smugglers saw who got the friar out, and the chip itself names the Thieves Guild, which is a seeded faction node in towns and cities. That is the right split: texture in the overview, the graph object in the chip.

## Half B — what it leaves behind

The encounter leaves four kinds of state, all read downstream and all visible:

- **Thieves Guild membership** (gate arm) — a `member_of` edge on a real faction node. Faction systems read it (membership-gated encounters, rank, faction standing), and the player sees it on the Guild's roster and on the mortal's sheet. This is the strongest connection: the master who chose to run is now inside an organisation that will put work in front of them.
- **Prayer Scroll** (every success side) — a possession attachment from the live reward catalog, on the mortal's Attachments tab.
- **Brother Wendel Ashby** (hide arm) — a `must-persist` cast actor with a real bond toward the mortal; he stays in the world as a named person the player can open, and the bond is what later social draws read.
- **Standing with the town** (every failure side, plus the reactions) — `reputation_with $here`, shown on the location's standing row and read by the location reputation gate.

Would the player recognise it? Yes: every one of these lands on a sheet the chip links to, and the fork makes the difference legible — run and you join the smugglers, hide and you win the friar.

Verdict: **connected**.

## Watch items (not fixes)

These are accepted limits already recorded by the systems pass; listed so the director's review sees them in one place.

1. **Already a member.** A mortal already on the Thieves Guild's rolls gets `already_member` and no new edge, so the "Taken In" chip over-claims for that one mortal. This is the same accepted limit as guildhall-spy's join.
2. **No Guild in this town.** `joinFaction` resolves `thieves_guild` to a seeded node (`locationTypes` town/city/capital), and the encounter is urban-only. If a world seeds no Thieves Guild chapter that the join can resolve, the write fails soft (it traces `membership_change … skipped`), and the chip would still render. Worth one assertion in the live proof: on the gate arm, confirm the `aftermath_membership_change` trace fires. Not a package defect.
3. **Step-0 critical failure** reaches an arm's critical-failure page on two routes. The Lost Trust chip is backed on both: step 0 writes −0.03, and the arm writes −0.07 or −0.05. The overview names no place, so it is true on both routes.

No fix-list.

PACKAGE PASS
