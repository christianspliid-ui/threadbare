# Package critic (Pass 3b): The Boundary Survey

> Batch: expert-everyday-2 (THR-1679), slot 1 (the batch's appointment slot) · Date: 2026-10-01
> Input: `Docs/plans/encounters/boundary-survey-final.md` (§ 15 chip text, § 20 sequels, § 21 chip declarations)

templateId: encounter.town.boundary_survey
packageVerdict: connected
packageLeaves: The surveyor's standing with the village rises or falls (shown on the village's page), a map item and a written note of why the reeve moved the stones land on their sheet, and a success books them to be back in the village in three days for the beating of the bounds with the lord's steward — keep it and the village holds a feast, the steward pays the lord's share of the fee and warms to them; miss it and the steward comes to find them, and thinks less of them if they cannot answer for the survey.

---

## Half A — anchoring

### Parent: `encounter.town.boundary_survey`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| BOND reputation with {location} (critical_success, success, success_at_cost) | the mortal's standing with the village (`reputation_with` step 1 success +0.06; net +0.03 on the step-0-failure path, still a gain) | `$here` → `location`, 🔗 linked; edge row says anchor the counterparty | yes — `{location}` enriches to the village's name in the tag and the detail | anchored |
| BOON knowledge (critical_success, success, success_at_cost) | the `political_secret` intelligence record step 1 success gives the mortal ("The reeve owed the lord a debt and moved the stones to clear it") | concept, `tooltipId: 'ui.knowledge'`, no `entityId` — the shipped shape (`bell-tower-shoring.ts`, `assize-letter.ts`); the record shows in `AgentIntelligencePanel` (`INTEL_CATEGORY_LABELS.political_secret`) | yes — "why the stones were moved" is the record's own content; the cause names `{cast:reeve}` | anchored |
| PATH appointment (critical_success, success, success_at_cost) | the booking to be at the village for the beating of the bounds (the `owes_favor` edge carrying `properties.appointment`, place `$here`, counterparty `$cast:steward`) | `$appointment` (THR-1518) → `location`, 🔗 linked; lawful because step 1 success plants an `encounter_seed` with an `appointment` block | yes — "in {location}", with `{cast:steward}` named as witness. Better than the bell-tower precedent, which named only "the tower" | anchored |
| SCAR reputation with {location} (failure) | standing with the village, lost (step 1 failure −0.06) | `$here` → `location`, 🔗 linked | yes — `{location}` | anchored |
| SCAR reputation with {location} (critical_failure) | standing lost — step 1 failure −0.06, or step 0 failure −0.03 on the step-0-critical path (the backing write § 21 adds) | `$here` → `location`, 🔗 linked | yes — `{location}` | anchored |
| PRIZE (auto, success bands) | the `#map` possession drawn from step 1's `rewardPool` | `possession` attachment, 🔗 linked; engine-built from the drawn item, so it names the real item | yes — the chip carries the drawn item's name; every success overview sets it up ("The assize paid {actor} in kind") | anchored |

**THR-1685 check:** no chip interpolates `{target}`. Every reputation chip anchors the village (`$here`), where the prose means the village. The one reputation write on a person (the steward) lives in the missed sequel, which authors no chip, so the renderer defect cannot reach it.

### Sequel (kept): `town.bounds_beaten`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips — `fallback.changes: []`, the `bell-tower-sequels.ts` precedent)* | — | — | — | — |
| PRIZE (auto, success) | the `#trade` possession from `rewardPool` (the lord's share of the fee) | `possession`, 🔗 linked | yes — the success afterimage says the steward "paid the lord's share of the fee" | anchored |

The sequel's other writes (reputation with the village +0.04, steward bond +, `festival` condition on the village for 36 ticks) carry no chip and claim none. They surface on the village's page (standing row and conditions) and on the steward's sheet. A chipless write is not a Law 56 fault; Law 56 fails a chip whose state is missing, not state that lacks a chip.

### Sequel (missed): `town.bounds_stone_uprooted`

| Chip | Referent | In the catalog? | Prose names it? | Verdict |
|---|---|---|---|---|
| *(no authored chips; no reward pool, so no auto PRIZE)* | — | — | — | — |

The failure afterimage's "thinks less of the surveyor" is backed by `reputation_with targetAgentId '$cast:steward' −0.04` plus the bond write — correctly retargeted off `$here`, the bell-tower Pass 3 correction.

**Half A result:** every chip anchored. No `fold`, no `bind`.

### One non-chip correction applied to the final file

The missed branch's `appointment.missed.seedLabel` wrote `{cast:steward}`. `seedLabel` is never enriched: `src/engine/encounterSeeding.ts:791` prints it raw into the narrative event "A planted thread bears fruit: …". The player would have read a literal `{cast:steward}` token. It is now "the steward", the same role-voiced form as the shipped bell-tower missed label. The kept `seedLabel` carries no token. This does not affect any chip verdict. The edit is noted inline in § 21 of the final file.

## Half B — what it leaves behind

**What it writes, and who reads it:**

- **Reputation with the village (`$here`).** Settlement reputation gates and the Location Profile standing row read it. The player sees it on the BOND or SCAR tag and again on the village's page.
- **An appointment.** The movement lean pulls the mortal back to the village within the window, and the `owes_favor` edge sits on their sheet. Kept → `town.bounds_beaten` fires there: the steward pays the lord's share of the fee (a `#trade` possession), the village thinks better of them, the steward bond moves, and the village gets the `festival` condition for 36 ticks (the brief's system-target write, visible on the village's page). Missed → the edge breaks, and `town.bounds_stone_uprooted` finds them wherever they are, where the steward's bond and standing move. This is the richest thread on the page, and the player watches it play out.
- **A `#map` possession.** It sits on their sheet. The PRIZE chip names it.
- **The knowledge record (`political_secret`).** It is real and visible in the intelligence panel. On its own it is `thin`: `political_secret` matches templates through `['court','intrigue','blackmail','extort','betray']` (`src/engine/intelligence.ts:72`). Neither sequel carries those tags, and the record has no `targetEntityId`, so `hasIntelligenceAbout` on the reeve stays false. The other three writes carry the package to `connected`. (The reeve is a must-persist cast member, and a "betray"-tagged encounter anywhere could still draw on the record by category.)

**Verdict: `connected`.**

## Chip-declaration notes for the implementer

Copy the shapes from `src/data/encounters/bell-tower-shoring.ts` (the shipped batch-1 appointment encounter). Only the words change.

**Parent — per success band (critical_success, success, success_at_cost), three chips:**

1. BOND — `kind: 'reputation'`, `category: 'bond'`, `direction: 'gain'`, `polarity: 'gain'`,
   `stateNoun: { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`,
   `concepts: [{ text: 'thinks well of', tooltipId: 'ui.standing' }]`,
   title "A line proved", causeClause "Sworn before the village", detail "{location} thinks well of their work."
   Precedent: `bell.crit.*` BOND chip (`bell-tower-shoring.ts:364`).
2. BOON — `kind: 'shell_state'`, `category: 'boon'`, `direction: 'gain'`, `polarity: 'gain'`,
   `stateNoun: { text: 'knowledge', tooltipId: 'ui.knowledge' }` (**no `entityId`, no `visualKind`**),
   `concepts: [{ text: 'why the stones were moved', tooltipId: 'ui.knowledge' }]`,
   title "Why the stones moved", causeClause "{cast:reeve} owed the lord", detail "{actor} knows why the stones were moved."
   Precedent: `bell.crit.how_it_stands` (`bell-tower-shoring.ts:381`).
3. PATH — `kind: 'future_hook'`, `category: 'path'`, `direction: 'opens'`, `polarity: 'gain'`,
   `stateNoun: { text: 'appointment', entityId: '$appointment', visualKind: 'location' }`,
   `concepts: [{ text: 'witnesses it set' }]`,
   title "The beating of the bounds", causeClause "A new stone for the line", detail "{cast:steward} witnesses it set in {location} in three days."
   Precedent: `bell.crit.market_day` (`bell-tower-shoring.ts:401`). `check:encounter` accepts `$appointment` only because step 1 success plants the `encounter_seed` with an `appointment` block. Keep that effect.

**Parent — failure and critical_failure, one chip each:**

4. SCAR — `kind: 'reputation'`, `category: 'scar'`, `direction: 'loss'`, `polarity: 'loss'`,
   `stateNoun: { text: 'reputation with {location}', entityId: '$here', visualKind: 'location', tooltipId: 'ui.reputation_with' }`,
   `concepts: [{ text: 'thinks less of', tooltipId: 'ui.standing' }]`.
   failure: title "A line not proved", causeClause "No line sworn". critical_failure: title "A false survey", causeClause "Their word for the lord". Detail on both: "{location} thinks less of their work."
   Precedent: the bell-tower SCAR chips (same stateNoun). **Keep the step 0 `failureMetadata` `reputation_with $here −0.03`.** Without it, the step-0 critical_failure path renders this SCAR with no write behind it (the well-sinking lesson).

**Parent — PRIZE:** not authored. It is engine-built from step 1's `rewardPool { categoryWeights: { possession: 1 }, tagFilters: ['#map'] }`.

**Sequels:** author no chips. Use `aftermathConfig: { branchOnStep: 0, variants: {}, fallback: { overview: <§ 20 text>, changes: [] } }`, exactly as `BELL_TOWER_FIRST_PEAL` / `BELL_TOWER_CRACKED` in `src/data/encounters/bell-tower-sequels.ts`. The kept sequel's `#trade` PRIZE is engine-built. **Do not add** a reputation chip about the steward to the missed sequel: it would have to name a person, and THR-1685 renders `{target}` as the town on a board draw.

**Seed label:** use the corrected missed `seedLabel` ("…and the steward comes looking for the surveyor."). No `{…}` tokens are allowed in either `seedLabel`.

## Optional (not required for pass)

- **Give the knowledge record a reader.** This would add `targetEntityId: '$cast:reeve'` to the step 1 `intelligence` effect, so `hasIntelligenceAbout` is true for the reeve. **No shipped encounter passes a sentinel in `targetEntityId` yet.** Before relying on it, confirm that the step-metadata intelligence path resolves `$cast:` there. If it does not, leave the record as it is. The package is `connected` without it.

PACKAGE PASS
