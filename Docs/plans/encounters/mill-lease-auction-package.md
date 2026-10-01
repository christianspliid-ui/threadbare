# Package critic (Pass 3b): The Mill Lease

> Batch: expert-everyday-3 (THR-1680), slot 1 (the batch's appointment slot) · Date: 2026-10-01
> Input: `Docs/plans/encounters/mill-lease-auction-final.md` (§ 15 chip text, § 20 sequels, § 21 chip declarations) and `mill-lease-auction.package.json`

templateId: encounter.town.mill_lease_auction
packageVerdict: connected
packageLeaves: The expert's standing with the town rises or falls, and the town's page shows it. A written note of where the mill's missing grain went (sold off the abbey's books to the merchant) lands in their intelligence, where merchant- and trade-keyed encounters score it. A won bid books them to be back at the mill in the town in three days for quarter day, with the abbey's cellarer. If they keep it, the fellowship pays their fee in kind, the town thinks better of them, and the cellarer warms to them. If they miss it, the cellarer comes to find them wherever they are, and thinks less of them if they cannot answer for the lease.

---

## Half A — anchoring

### Parent: `encounter.town.mill_lease_auction`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation with {location} (critical_success, success, success_at_cost) | the mortal's standing with the town (`reputation_with` step 1 success +0.06; net +0.03 on the step-0-failure path, still a gain) | `$here` → `location`, 🔗 linked | yes. `{location}` enriches to the town's name in the tag and the detail | anchored |
| BOON knowledge (critical_success, success, success_at_cost) | the `trade_route` intelligence record from step 1 success ("The old miller ground grain off the abbey's books and sold the flour to the merchant") | concept, `tooltipId: 'ui.knowledge'`, no `entityId`. This is the shipped shape (`boundary-survey.ts`, `bell-tower-shoring.ts`). The record shows in the intelligence panel. | yes. "where the mill's missing grain went" is the record's own content, and the cause names the seller | anchored |
| PATH appointment (critical_success, success, success_at_cost) | the booking to be at the mill on quarter day (the `owes_favor` edge carrying `properties.appointment`; place `$here`, counterparty `$cast:cellarer`) | `$appointment` (THR-1518) → `location`, 🔗 linked. Lawful because step 1 success plants an `encounter_seed` with an `appointment` block | yes. "{cast:cellarer} seals the lease in {location} in three days" names the person, the place and the day | anchored |
| SCAR reputation with {location} (failure) | standing with the town, lost (step 1 failure −0.06) | `$here` → `location`, 🔗 linked | yes | anchored |
| SCAR reputation with {location} (critical_failure) | standing lost: step 1 failure −0.06, or step 0 failure −0.03 on the step-0-critical path | `$here` → `location`, 🔗 linked | yes | anchored |

No PRIZE chip on the parent. The hand is knowledge + story_seed, so no reward pool is authored there. The fee the overviews promise lands in the kept sequel.

**THR-1685 check:** no chip interpolates `{target}`. Every reputation chip anchors the town (`$here`), which is what the prose means. The one reputation write on a person (the cellarer) lives in the missed sequel, which authors no chip, so the renderer defect cannot reach it.

### Sequel (kept): `town.mill_lease_sealed`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips: `fallback.changes: []`, the boundary-survey / bell-tower precedent)* | — | — | — | — |
| PRIZE (auto, success) | the `#trade` possession from `rewardPool` (the fellowship's fee) | `possession`, 🔗 linked; engine-built from the drawn item | yes. The success afterimage says "the fellowship paid {name}'s fee" | anchored |

The sequel's other writes (reputation with the town +0.04, cellarer bond +) carry no chip and claim none. Law 56 fails a chip whose state is missing, not state that lacks a chip.

### Sequel (missed): `town.mill_lease_forfeit`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips; no reward pool, so no auto PRIZE)* | — | — | — | — |

The failure afterimage's "thinks less of the expert" is backed by `reputation_with targetAgentId '$cast:cellarer' −0.04` plus the bond write. It is correctly kept off `$here`.

**Half A result:** every chip is anchored. No `fold`, no `bind`.

### Checks I ran that found nothing to fix

- **Raw `seedLabel` tokens.** Both labels are plain prose ("…with the abbey's cellarer there to seal it." / "…the cellarer comes looking for the expert who won it."). The boundary-survey package pass found a literal `{cast:steward}` here. This package does not repeat it.
- **The fee promise.** Every success overview says "{actor}'s fee is paid when the lease is sealed." That is a later-tense claim (rule 34). It is enacted: the kept sequel's success writes a `#trade` possession, and its afterimage names the fee. On the missed path no fee is paid, and nothing claimed one would be. The claim is conditional and true.
- **Both-paths truth.** success_at_cost and critical_failure each have two entry paths. Each overview was read against both (final § 15). Both are true.

## Half B — what it leaves behind

**What it writes, and who reads it:**

- **Reputation with the town (`$here`).** Settlement reputation gates and the Location Profile standing row read it. The player sees it on the BOND or SCAR tag and again on the town's page.
- **An appointment.** This is the richest thread on the page, and the player watches it play out. The movement lean pulls the mortal back to the town within the window, and the `owes_favor` edge sits on their sheet.
  - Kept → `town.mill_lease_sealed` fires at the mill. The fellowship pays the fee (a `#trade` possession, PRIZE chip), the town thinks better of them, and the cellarer's bond moves.
  - Missed → the edge breaks, and `town.mill_lease_forfeit` finds them wherever they are. The cellarer's bond and standing move there.
- **The knowledge record (`trade_route`).** This is better connected than the boundary survey's `political_secret`. `trade_route` matches template ids containing `trade · caravan · merchant · route` (`src/engine/intelligence.ts` `TEMPLATE_CATEGORY_MATCHERS`), and `encounterScoring.ts` reads it through `findActionableIntelligence`. Live ids it lifts include `borderland.caravan_thieves`, `ag.quest.escort_caravan` and `action.gold.trade`. A mortal who learned where a merchant's cheap flour came from is likelier to be drawn to the next merchant's business. That is the hand doing what a knowledge draw should.
- **The cast.** The cellarer and the merchant are `must-persist`, so a later encounter that reuses a monk/priest or a merchant at this town meets the same people.

**What it does not write, honestly:** nothing ties the record to the merchant as an entity (no `targetEntityId`), so `hasIntelligenceAbout(merchant)` stays false. That is the same optional gap the boundary survey carried. The package is `connected` without it.

**Verdict: `connected`.**

## Chip-declaration notes for the implementer

The package JSON already carries every chip in the boundary-survey shape (§ 21 of the final). Nothing to change. Two things to keep when the orchestrator compiles:

1. **Keep step 0's `failureMetadata` `reputation_with $here −0.03`.** Without it, the step-0 critical_failure path renders the SCAR with no write behind it.
2. **Keep the step-1 success `encounter_seed` with its `appointment` block.** `check:encounter` accepts the PATH chip's `$appointment` anchor only because of it.

## Optional (not required for pass)

- Give the knowledge record an entity reader with `targetEntityId: '$cast:merchant'`. **No shipped encounter passes a sentinel there yet.** First confirm that the step-metadata intelligence path resolves `$cast:` in that field. If it does not, leave the record as it is.

PACKAGE PASS
