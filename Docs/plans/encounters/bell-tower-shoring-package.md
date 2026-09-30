# Package critic — The Leaning Bell Tower

templateId: encounter.town.bell_tower_shoring
packageVerdict: connected
packageLeaves: Saving the tower leaves the mortal's current town thinking better of them, a stone-working item from the town's stores in their hands, a record on their sheet of how the lodge's hidden arch carries the bell, and a promise to be back at the tower in three days when the councillor pays the rest of the fee (kept → the first peal, the fee paid and the town keeps a feast day; missed → the councillor comes looking with the money held back) — while a failed job leaves the town thinking less of them.

## Half A — anchoring

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation with {location} (critical_success, success, success_at_cost) | the mortal's standing with the town the tower stands in (`reputation_with` written by step 1 success, +0.06) | `$here` → `location`, 🔗 linked (`visualKind: 'location'`); the edge row says anchor the counterparty | yes — `{location}` enriches to the settlement's name, in the tag (`buildAftermathConsequences.ts:705` enriches `stateNoun.text`) and in the detail | anchored |
| BOON knowledge (critical_success, success, success_at_cost) | the `cultural_knowledge` intelligence record step 1 success gives the mortal | concept, `tooltipId: 'ui.knowledge'`, no `entityId` — the shipped shape (`counting-house-dispute.ts`, `assize-letter.ts`, `pilots-reckoning.ts`); the record itself shows in `AgentIntelligencePanel` | yes — "how the lodge's hidden arch carries the bell", which is the record's own `detail` | anchored |
| PATH appointment (critical_success, success, success_at_cost) | the promise to be at the tower on market day to be paid (the `owes_favor` edge carrying `properties.appointment`, counterparty `$cast:councillor`) | `$appointment` (THR-1518) → `location`; lawful because step 1 success plants an `encounter_seed` with an `appointment` block | yes — "at the tower", with `{cast:councillor}` named as payer (same form as the well's "at the well") | anchored |
| SCAR reputation with {location} (failure) | standing with the town, lost (step 1 failure, −0.06) | `$here` → `location`, 🔗 linked | yes — `{location}` | anchored |
| SCAR reputation with {location} (critical_failure) | standing with the town, lost (step 1 failure −0.06, or step 0 failure −0.03 on the step-0-critical path) | `$here` → `location`, 🔗 linked | yes — `{location}` | anchored |
| PRIZE (auto, success bands) | the `#stone` possession drawn from step 1's `rewardPool` (`{ categoryWeights: { possession: 1 }, tagFilters: ['#stone'] }`) | `possession` attachment, 🔗 linked (the item card → attachment sheet); the chip is engine-built from the drawn item, so it names the real item | yes — the chip carries the drawn item's name; the overview sets it up ("a gift from {location}'s stores") | anchored |

No fold, no bind. Every chip is backed by a write (Law 56 rule 0), including the critical_failure SCAR on the step-0-critical path, which carries its own step-0 −0.03 (the well-sinking lesson, already applied).

THR-1685 does not apply: no chip interpolates `{target}`, and every reputation chip anchors the town (`$here`), where the prose means the town. The one reputation write on a person lives in the missed sequel, not on this page.

## Half B — what it leaves behind

This encounter leaves four things. Later systems read three of them, and the player can see all four:

- **Reputation with the town (`$here`).** Settlement reputation gates and the Location Profile standing row read it. The player sees it on the BOND or SCAR tag and again on the town's page.
- **An appointment.** The movement lean pulls the mortal back to the tower within the window, and the `owes_favor` edge sits on their sheet. If they keep it, `town.bell_tower_first_peal` fires at the tower: the fee is paid (a `#trade` possession), the town thinks better of them, the councillor bond moves, and the town gets the `festival` condition for 36 ticks. That last one is the system-target write the brief asked for, and it shows on the town's page. If they miss it, the edge breaks and `town.bell_tower_cracked` finds them wherever they are. It is the richest thread on the page, and the player watches it happen.
- **A stone-working possession.** It sits on their sheet and counts toward their stats. The PRIZE chip names it.
- **The knowledge record.** It is real and visible in the mortal's intelligence panel. **But nothing downstream reads it for this job.** `cultural_knowledge` matches templates through `['ritual','ceremony','lore','cultural']` (`TEMPLATE_CATEGORY_MATCHERS`, `src/engine/intelligence.ts:73`). A masonry sequel never hits those tags, and the record carries no `targetEntityId`, so `hasIntelligenceAbout` on the town stays false. On its own this boon would verdict `thin`. The other three writes carry the package to `connected`.

**Merge precondition (not a package defect).** The appointment half is only as connected as its two sequels. Until `src/data/encounters/bell-tower-sequels.ts` (`BELL_TOWER_SEQUELS`) exists and is spread in `src/data/unified-action-templates.ts`, the seed plants a promise that fires nothing, and `validateEncounterSeedRefs` reports both branches as `dead_template`. At the time of this pass the file does not exist. This is Caveat 1 of the final packet.

## Fix-list

None of these block the verdict. Apply them with the compile if they are cheap.

1. **Give the knowledge record a reader (recommended).** Add `targetEntityId: '$here'` to the step 1 `intelligence` effect, so the record is *about* this town. Then have the kept sequel `town.bell_tower_first_peal` reference it: an `intel_referenced_prose` effect keyed `cultural_knowledge`, or a success line that uses what the mason knows about the arch. That turns the boon from a sheet entry into a payoff three days later. Confirm that the step-metadata intelligence path resolves `$here` before relying on it.
2. **PATH detail may name the place (optional).** Anchoring is satisfied, because "the tower" is part of `{location}`, the same as the well precedent. If the budget allows, "{cast:councillor} pays it at the tower in {location} on market day." (15 words with the cause) puts the anchored object's name in the sentence.
3. **Missed-sequel prose rule 7b.** Carry forward the systems caveat: end "holds back the rest of the fee" there, or give the missed success a small `#trade` pool. This is sequel prose, off this page.

PACKAGE PASS
