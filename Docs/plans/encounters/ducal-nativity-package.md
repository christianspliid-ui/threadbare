# Package critic (Pass 3b): The Duke's Nativity

> Slug: ducal-nativity | Input: `ducal-nativity-final.md` (systems audit `ducal-nativity-systems.md`) | Brief: `master-everyday-brief.md` slot 6 | Date: 2026-10-05

templateId: encounter.town.ducal_nativity
packageVerdict: connected
packageLeaves: The reader comes away pursuing Fulfill the Destiny (shown on their sheet), and if they warned him the duke Aldric Varre owes them a favour; their standing in the town goes up or down; and a failed telling leaves a Plague Scare on the town that makes travellers avoid it for fourteen days.

## Half A: anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND · reputation with {location} (gain, both arms and fallback, success bands) | The reader's `reputation_with` edge to the settlement the scene is in | `reputation_with` edge, anchored on the counterparty location. 🔗 linked (`entityId: "$here"`, `visualKind: "location"`) | Yes. `{location}` resolves to the town's name | anchored |
| BOND · a favour owed (positive arm, success bands) | An `owes_favor` edge with the duke as debtor and the reader as creditor | `owes_favor` edge, 📍 named. The duke is an `individual` actor, 🔗 linked through the concept `$cast:duke` / `agent` | Yes. `{cast:duke}` resolves to the persisted duke (spawn name Aldric Varre). The anchor is on the debtor, which is the right end of the edge (rule 0c) | anchored |
| PATH · ambition (both arms and fallback, success bands) | The reader's new `pursues` edge to the ambition `ambition_fulfill_destiny` | `ambition` node, 📍 named (tooltip, seen on the pursuer's sheet) | Yes. "Fulfill the Destiny" is the template's real `displayName` (`src/data/ambition-templates.ts`), and the reader is `{actor}` | anchored |
| SCAR · Plague Scare (both arms and fallback, failure band only) | The `trait.condition.location.plague_scare` condition written onto `$here` | `condition` attachment, 🔗 linked (template node id, `visualKind: "attachment"`) | Yes. The stateNoun is "Plague Scare" and the detail names `{location}` | anchored |
| SCAR · reputation with {location} (loss, failure and critical_failure) | The same `reputation_with` edge, moved down | Same as the gain row, 🔗 linked | Yes | anchored |

Every chip is anchored. None needs a fold or a bind: each referent is either a cast actor this encounter persists, the scene's own settlement, a condition template, or an ambition template the effects write.

Law 56 rule 0 (a write behind each chip) was settled by the systems pass and still holds on this read. The Plague Scare chip is on the `failure` band only. On `critical_failure` the only chip is the reputation SCAR, and that is backed on both routes: the step-1 telling fails (−0.08 or −0.06), or step 0 fails (−0.03). The one exception is known and engine-wide. `assign_ambition` refuses when the reader has `no_free_slot` or `already_pursued`, so the PATH chip can claim an ambition that was never written. The final already lists this as a caveat. It does not block this package.

## Half B: what it leaves behind

The encounter leaves four writes, and a later system reads each one where the player can see it:

- **Ambition, on every success band.** `ambition_fulfill_destiny` puts a pursued ambition on the reader's sheet. It carries real milestones, and the first (star above 0.75) is within a master's reach. The ambition engine weights the reader's choices by it from then on, and the `narrativeHook` ties it to the heir's hard first year.
- **Favour, on the positive arm's success.** `owes_favor` from the persisted duke, Aldric Varre. It shows on both their sheets and the favour system can call it in.
- **Plague Scare, on failure.** The condition sits on the town for `CONDITION_PLAGUE_SCARE_DURATION` (168 ticks, 14 game days). It is in the `LOCATION_AVOIDED_MULTIPLIER` (1.6) table in `condition-trait-content.ts`, so travel routing really does go around the town. The chip's wording, "travellers go around it", is therefore literally true, and the condition is visible on the location's page.
- **Reputation with the town, on every band.** It shows in the Location Profile's standing row, and the reputation gates read it.

Verdict: **connected**.

## Non-blocking notes (polish only; none of these is a fold or a bind)

1. **Chip titles name the wrong party.** The positive-arm gain chip is titled "Believed by the duke", but the write is reputation with the *town*. The negative arm's title, "Heard by the court", names a scene-fiction body. Both titles are marked *[systems-supplied]*. Retitle them to name the mechanic (rule 0c), e.g. "Better trusted in town" and "Trusted less". The stateNoun and detail are already correct.
2. **The ambition chip has no `entityId`.** It carries only `tooltipId: "ui.ambition"`. That is lawful for a 📍 named anchor. If the compiler can resolve the minted ambition node later, a sheet link would deepen the click.
3. **`narrativeTemplates`.** The systems-supplied initiation, success and failure lines are plain and accurate. No replacement is needed.

PACKAGE PASS
