> **title:** Brainstorm — a road's encounters write to that road — THR-2046
> **linear_issue:** THR-2046
> **author:** Claude Code (design lane, run 2026-10-25h, unattended)
> **created:** 2026-10-25
> **companion_of:** `Docs/plans/2026-10-25-thr-2046-encounter-lane-writes.md`

# Brainstorm — encounter lane writes

The alternatives behind the plan's four decisions.

## How the lane reaches the outcome table

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. A `laneEdgeId` field, seed → action** (the `opposingGroupId` path) | One field, a precedent path, re-validated at spawn | Two type fields | **Taken** |
| B. A support binding (`inheritedBindings`) | Existing channel | Bindings are `actor` / `location` node bindings; an edge id would bend the type, and the sentinel machinery would treat it as a node | Rejected |
| C. Re-derive the lane at resolution (the lane between the actor's town and its partner) | No new field | A town with three lanes still guesses: this is today's defect | Rejected |

## Where a threat or a toll lives

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. Two new quantities on `economy_shift`** | Law 41: one effect vocabulary; the band machinery, the outcome-table receipt and the traces are reused | Stretches "economy shift" to marks | **Taken** |
| B. A new aftermath effect kind `lane_write` | Cleaner name | A second effect path, a converter-allowlist entry and a second receipt hook for the same lane | Rejected |
| C. Graph ops on the steps | Exists | Step ops are binary (research blocker 2), so they cannot tell a critical failure from a failure | Rejected |

## Who holds a struck toll

| Option | For | Against | Verdict |
|---|---|---|---|
| **A. The town's banner, else the acting mortal** | The research row says *"toll set for one faction"*; the purse already pays faction tolls and holding income pays mortal ones; never a dead write | A toll that pays a mortal edges toward *place as a holding* | **Taken**, with a veto line |
| B. The banner only | Narrow | A banner-less town's toll bridge success writes nothing while its prose says *"a rate is struck"* (Law 45) | Rejected |
| C. The acting mortal always | A mortal earns from their own deed | It contradicts the research row, and it is the deferred holding question | Rejected |

## How hard an ambush failure bites

Ambushes fail 36–57 times a month on two seeds (census). A prosperity cost on every failure would be 36–57 × 2 off one town's prosperity in the worst case, which is enough to drain a tier. So a failure thins the road, and only a critical failure also costs prosperity. The kill criteria watch for tier drops.

## Tensions

- **The toll dispute is dark.** It was seeded 0 times on three seeds, because no lane had hostile controllers at both ends. Making it fire is a seeding question this plan does not own, so its rows are authored and wait. The toll that players will see comes from the toll bridge (2–7 wins a month).
- **Threats and army supply.** A red road also cuts an army's supply line (`armySupply.ts`). That is intended: the world acts on the scar (Law 22). The 24-tick life keeps it from becoming a siege.
- **A blockade is never cleared by an encounter.** Lifting it is the warlord verb's job, so a mortal beating off bandits does not lift a siege.
