# Reputation-Gated Encounters — Final Tranche (Templates 11–15)

**Linear:** THR-147 (Deferral from THR-32, project: Content Architecture)
**Status:** Ready for Dev (design complete)
**Author:** Cowork (design), Claude Code (implementation)
**Date:** 2026-04-18

---

## Summary

Author the final set of five reputation-gated `UnifiedActionTemplate` encounters, completing coverage of every reach polarity that still lacks a gated template after tranches 1 and 2. The first tranche (THR-32) covered Iron+, Shadow- (blocked), Veil+ AND Eye+, Heart+ (req+blocked), Stone+ (tier-sensitive). The middle tranche (THR-146) covered Gold+, Eye+ standalone, Star+ with Star- block, Shadow+, and `power.renown`. This tranche closes out the **reach-negatives** — Iron-, Gold-, Veil-, Eye-, Stone- — and extends the rubric's gate vocabulary with two novel patterns:

1. **Required-negative** (five templates). The opposite of the baseline pattern: negative traits *unlock* rather than block. A fallen or infamous target has access to encounters the upstanding cannot reach — opportunities that require a broken word, a shadowed name, or a censured standing.
2. **Mixed-polarity gate** (one template, `the-blinded-oracle`). Requires `eye.negative` AND is *blocked by* `iron.positive`. This exercises the engine's existing polarity-agnostic `encounterGates.blocks`, demonstrating a gate that refuses those whose strength in one reach makes them ineligible for opportunity in another.

**Reach-coverage gap analysis** (vs. 8 reaches + `power.renown`, after tranches 1 and 2):

| Reach / Trait | Prior tranches cover? | Final tranche adds |
|---|---|---|
| Iron+ | yes (warlords-tribute) | — |
| **Iron-** | **no** | **the-executioners-commission** (required-negative) |
| Gold+ | yes (merchants-favor) | — |
| **Gold-** | **no** | **the-unmarked-crossing** (required-negative) |
| Shadow+ | yes (infiltrators-approach) | — |
| Shadow- | yes (shadow-court-audience, blocked) | — |
| Veil+ | yes (veiled-consultation) | — |
| **Veil-** | **no** | **the-silent-chamber** (required-negative) |
| Heart+ | yes (pilgrims-offering) | — |
| Heart- | yes (pilgrims-offering, blocked) | — |
| Eye+ | yes (oracle-consulted, veiled-consultation) | — |
| **Eye-** | **no** | **the-blinded-oracle** (required-negative + iron+ blocked — NOVEL mixed-polarity) |
| Stone+ | yes (stones-judgement) | — |
| **Stone-** | **no** | **the-jury-of-the-ruined** (required-negative) |
| Star+ / Star- | yes (star-pilgrim) | — |
| `power.renown` | yes (renowned-duel) | — |

After this tranche, **every reach polarity has at least one gated encounter**. The gate-pattern table in REPUTATION_GATED_README.md gains a sixth row (required-negative) and a seventh row (mixed-polarity).

---

## Three-Pillar Coverage

### Engine pillar

**No new systems.** The engine already supports the two new gate patterns:

- **Required-negative** is structurally identical to required-positive — a template's `requiredTargetTraits: ['trait.reputation.<reach>.negative']` is filtered by the existing `requiredTargetTraits` check in `encounterFilterPipeline.ts`. The novelty is at the *content* layer, not the engine.
- **Mixed-polarity (`eye.negative` required, `iron.positive` blocks)**: the engine's `encounterGates.blocks` is polarity-agnostic. A positive trait CAN list a template id in its `blocks` array. Verified in `src/data/reputation-trait-content.ts` entry shapes — no schema change needed.

**New `encounterGates` wiring** on existing trait definitions in `src/data/reputation-trait-content.ts`:

| Trait (definitionId) | Add to `encounterGates` |
|---|---|
| `trait.reputation.iron.negative` | `unlocks: [...existing, 'reputation.iron.the_executioners_commission']` |
| `trait.reputation.iron.positive` | `blocks: [...existing, 'reputation.eye.the_blinded_oracle']` (NOVEL — positive-trait block entry) |
| `trait.reputation.gold.negative` | `unlocks: [...existing, 'reputation.gold.the_unmarked_crossing']` |
| `trait.reputation.veil.negative` | `unlocks: [...existing, 'reputation.veil.the_silent_chamber']` |
| `trait.reputation.stone.negative` | `unlocks: [...existing, 'reputation.stone.the_jury_of_the_ruined']` |
| `trait.reputation.eye.negative` | `unlocks: [...existing, 'reputation.eye.the_blinded_oracle']` |

**Registration:** add all 5 imports to `src/data/unified-action-templates.ts` and push onto the exported template array.

**Test coverage:** add all 5 ids to the `TRANCHE` fixture in `src/engine/__tests__/reputation-gated-encounters.test.ts`. The structural invariants (rubric rules 1–4) already run per fixture entry. **Add one new scenario test** for the mixed-polarity case: verify that an actor holding both `eye.negative` and `iron.positive` is *not* offered `the-blinded-oracle`, while an actor holding only `eye.negative` is. This is the first scenario test covering the mixed-polarity pattern.

**Trace emissions:** unchanged. `reputation_tally` effects continue to emit `reputation.tally.changed` via the aftermath runner. No new trace categories.

**Fail-soft table:**

| Failure | Behavior |
|---|---|
| Target lacks required negative trait | Template filtered out by ActionDrawer — never surfaces. Safe by construction. |
| Target holds both eye.negative AND iron.positive | Blocked via iron.positive's `encounterGates.blocks` — filtered before ActionDrawer render. Safe. |
| `encounterGates.blocks` entry references unknown template id | Gate lookup returns empty; block silently no-ops. Logged via existing gate resolver warning. Fail-soft. |
| Aftermath `reputation_tally` delta on non-existent tally key | Existing reputation tally setter creates missing keys with the delta value. No crash. |
| `{title}` placeholder unresolved when target has only negative traits | Existing title resolver falls back to a neutral descriptor (verify behavior — see Verification note below). |
| Required-negative template offered to an actor who also holds the positive form | Unusual but possible (polarity coexistence). Template surfaces; aftermath tally adjusts the negative as designed. Not a failure. |

**Verification note:** The `{title}` resolver in `src/engine/prose/resolvers/titleResolver.ts` (or equivalent) is documented to return the "highest-tier reputation trait name" — it is unclear at design time whether this picks only positive traits or any trait. If an actor has only negative traits (e.g., `iron.negative` L2), the resolver must produce a negative title like "Blood-Bound" or "Broken-Word" rather than falling back to a neutral descriptor. **CC should verify this during implementation** and, if the resolver only returns positive titles, extend it to fall back to the highest-tier negative trait title. This is a prerequisite for required-negative prose to read well.

### Content pillar (the work)

Five new templates in `src/data/encounters/`, one file each. All share the Threadbare palette (parchment, desaturated earth tones, painterly digital style).

#### 1. `the-executioners-commission.ts` — Iron- (required-negative)

- **Id:** `reputation.iron.the_executioners_commission`
- **Reach:** iron · **crudType:** write · **scale:** local · **rarityTier:** 2
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.iron.negative']` + `encounterGates.unlocks` on iron.negative
- **Premise:** A magistrate whose hands must stay clean seeks `{title}` (e.g. "Blood-Bound") out in the dark of the courthouse cloister. A politically dangerous execution needs a hand already stained — the law cannot afford a clean one. The magistrate offers coin, or the erasure of a lesser debt.
- **Step 0 (initiation):** The magistrate's offer is wrapped in plausible-deniable euphemisms. A name is named. The date is tomorrow. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Carry out the commission** (reinforcing): Do the work. Collect the debt-erasure. The magistrate never thanks you by name. Aftermath: `{ key: 'iron.negative', delta: 1 }`, `hidden_mark` (category `reputation_note`, severity 0.5, label "the magistrate's unnamed hand", revealFamilies: iron.inquest family), `recent_event` (significance 0.65, "a sentence was carried by shadow"), `encounter_seed` `iron.kin_of_the_condemned` (delay 30, priority 0.8, "the family of the executed seek the hand that fell").
  - **B — Refuse, and warn the condemned** (contrary): Leave the magistrate waiting. Send word that the blade is coming. Aftermath: `{ key: 'iron.positive', delta: 1 }`, `{ key: 'iron.negative', delta: -1 }`, `encounter_seed` `iron.magistrate_vengeance` (delay 25, priority 0.75, "the magistrate moves against you in quieter chambers"), `recent_event` (significance 0.6).
- **Support bundle:** magistrate (actor, role `petitioner`, delivery `approach`, persistence `single_encounter`), courthouse cloister (sublocation, delivery `context`, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-executioners-commission.webp` · wide shot, two figures in a vaulted cloister at night, lamplight pooled on flagstones, one seated at a writing desk, the other standing in shadow, Threadbare palette.

#### 2. `the-unmarked-crossing.ts` — Gold- (required-negative)

- **Id:** `reputation.gold.the_unmarked_crossing`
- **Reach:** gold · **crudType:** write · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.gold.negative']` + `encounterGates.unlocks` on gold.negative
- **Premise:** A smuggler with a river barge and a cargo the customs house would seize on sight approaches `{title}` (e.g. "Broken-Word") at the wharf. Only a signature from one whose seal is already discredited can grant the false papers the barge needs — a clean name would be caught on inspection; a dirty one is already half-expected.
- **Step 0 (initiation):** The smuggler lays blank manifests and a wax stick on the barrel-top. The cargo is not named. The ink is dry. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Sign the papers, take the cut** (reinforcing): Press the seal. Accept the percentage. Watch the barge slip downriver. Aftermath: `{ key: 'gold.negative', delta: 1 }`, `hidden_mark` (category `concealed_action`, severity 0.45, label "the crossing that was never logged", revealFamilies: gold.customs family), `recent_event` (significance 0.55, "a cargo passed under no name"), `encounter_seed` `gold.customs_inquiry` (delay 30, priority 0.75, "a customs officer begins to ask quiet questions").
  - **B — Take the manifest to its rightful owner** (contrary): Deliver the blank papers to the merchant the smuggler meant to defraud. Aftermath: `{ key: 'gold.positive', delta: 1 }`, `{ key: 'gold.negative', delta: -1 }`, `encounter_seed` `gold.smuggler_reprisal` (delay 20, priority 0.7, "the smuggler's people look for the one who turned them in"), `recent_event` (significance 0.55).
- **Support bundle:** smuggler (actor, role `petitioner`, delivery `approach`, persistence `single_encounter`), wharf (sublocation, delivery `context`, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-unmarked-crossing.webp` · wide shot, river wharf at dusk, barge at the dock, two figures at a barrel with papers, distant customs house lit, Threadbare palette.

#### 3. `the-silent-chamber.ts` — Veil- (required-negative)

- **Id:** `reputation.veil.the_silent_chamber`
- **Reach:** veil · **crudType:** read · **scale:** local · **rarityTier:** 2
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 2 (sanctum-access cost — the chamber itself exacts a price)
- **Gate:** `requiredTargetTraits: ['trait.reputation.veil.negative']` + `encounterGates.unlocks` on veil.negative
- **Premise:** A locked chamber in the ruins of a censured guild opens only to those the guild has already silenced. `{title}` (e.g. "Silenced One") feels the mechanism yield where others have been turned away. Inside: a manuscript the guild buried rather than destroyed — forbidden because it is true.
- **Step 0 (initiation):** The chamber's single lantern gutters and holds. The manuscript is bound in undyed leather. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Read the forbidden lore** (reinforcing): Let the knowledge in. Pay the essence. The chamber does not let you leave unchanged. Aftermath: `{ key: 'veil.negative', delta: 1 }`, `hidden_mark` (category `forbidden_contact`, severity 0.55, label "carries the silenced text", revealFamilies: veil.inquisition family), `recent_event` (significance 0.7, "a silenced manuscript was read by eyes that could read it"), `encounter_seed` `veil.guild_investigation` (delay 35, priority 0.8, "the remnant guild learns someone opened the chamber").
  - **B — Destroy the manuscript unread** (contrary): Fire the lantern to the pages. Walk out with clean hands and colder. Aftermath: `{ key: 'veil.positive', delta: 1 }`, `{ key: 'veil.negative', delta: -1 }`, `encounter_seed` `veil.rehabilitation_overture` (delay 40, priority 0.7, "a cautious voice offers a path back to standing"), `recent_event` (significance 0.65).
- **Support bundle:** guild ruin (location, delivery `context`, persistence `persistent`), silent chamber (sublocation inside the ruin, delivery `context`, persistence `persistent`).
- **Failure:** no tally (the essence is still spent on sanctum entry — the chamber demands its price regardless).
- **Illustration:** `/concept-art/encounters/the-silent-chamber.webp` · wide shot, vaulted stone chamber, single guttering lantern, manuscript on a low stone plinth, dust motes suspended, Threadbare palette.

#### 4. `the-jury-of-the-ruined.ts` — Stone- (required-negative)

- **Id:** `reputation.stone.the_jury_of_the_ruined`
- **Reach:** stone · **crudType:** write · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.stone.negative']` + `encounterGates.unlocks` on stone.negative
- **Premise:** In the roofless shell of a grange burned out two winters ago, a circle of the dispossessed waits. They will only hear testimony from one whose own name is broken — a judge whose own lands are gone understands what is at stake. `{title}` (e.g. "Disavowed") is invited to the circle. Two neighbors stand accused of selling water rights that were not theirs to sell.
- **Step 0 (initiation):** The circle sits on salvaged stones. The accused stand. No record is being kept. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Deliver the verdict the circle expects** (reinforcing): Rule against the accused. The circle's justice is rough, collective, and needs you to validate it. Aftermath: `{ key: 'stone.negative', delta: 1 }`, `hidden_mark` (category `reputation_note`, severity 0.4, label "signed onto the ruined circle's work", revealFamilies: stone.dispossessed family), `recent_event` (significance 0.6, "a verdict was rendered outside the stone's high seats"), `encounter_seed` `stone.accused_vengeance` (delay 30, priority 0.75, "one of the accused finds allies who remember the circle's sentence").
  - **B — Rule against the circle, preserving the accused** (contrary): Find against the circle's evidence; refuse to make the ruling they asked for. They will not forgive it, but the law held. Aftermath: `{ key: 'stone.positive', delta: 1 }`, `{ key: 'stone.negative', delta: -1 }`, `encounter_seed` `stone.circle_censure` (delay 25, priority 0.75, "the ruined circle passes their own judgement on you"), `recent_event` (significance 0.6).
- **Support bundle:** circle of the dispossessed (actor group, role `petitioner`, persistence `single_encounter`), ruined grange (sublocation, delivery `context`, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-jury-of-the-ruined.webp` · wide shot, roofless burned-out grange, circle of seated figures on salvaged stones, two figures standing in the center, overcast sky, Threadbare palette.

#### 5. `the-blinded-oracle.ts` — Eye- required + Iron+ blocks (NOVEL mixed-polarity)

- **Id:** `reputation.eye.the_blinded_oracle`
- **Reach:** eye · **crudType:** read · **scale:** local · **rarityTier:** 3
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 2
- **Gate:** `requiredTargetTraits: ['trait.reputation.eye.negative']`; `encounterGates.unlocks` on eye.negative; `encounterGates.blocks` on iron.positive (NOVEL). The combination: the seer speaks only to those whose sight is already discredited, and refuses those who come armed in martial renown — the proud cannot enter.
- **Premise:** A blinded seer in a hermit's hut at the edge of a dying grove will see `{title}` (e.g. "Misseer"). The seer's own sight is gone; she speaks only to those the world no longer believes. She has a prophecy to give, and she will not give it to the famed or the strong.
- **Step 0 (initiation):** The seer does not turn her head. She knows who stands in the doorway. She gestures to the low bench. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Take the prophecy** (reinforcing): Sit, listen, let the words in. Pay the essence. The prophecy binds you. Aftermath: `{ key: 'eye.negative', delta: 1 }`, `hidden_mark` (category `divine_favor`, severity 0.55, label "carries the blinded oracle's words", revealFamilies: eye.prophecy family), `recent_event` (significance 0.75, "a prophecy was given to one the world did not believe"), `encounter_seed` `eye.prophecy_reckoning` (delay 45, priority 0.85, "the prophecy's first condition begins to come true").
  - **B — Ask how she lost her sight** (contrary): Refuse the prophecy. Ask the older question. She answers, slowly. Aftermath: `{ key: 'eye.positive', delta: 1 }`, `{ key: 'eye.negative', delta: -1 }`, `encounter_seed` `eye.order_investigates` (delay 30, priority 0.7, "the order that blinded her notices an outsider asked"), `recent_event` (significance 0.6).
- **Support bundle:** blinded seer (actor, role `petitioner`, delivery `approach`, persistence `persistent` — she remains at the hut), dying grove (location, delivery `context`, persistence `persistent`), hermit's hut (sublocation, delivery `context`, persistence `persistent`).
- **Failure:** no tally (essence still spent — the seer's presence itself exacts a price).
- **Illustration:** `/concept-art/encounters/the-blinded-oracle.webp` · wide shot, low hut interior, seated blinded figure in grey, visitor on a low bench, thin light from a single window, a dying tree visible outside, Threadbare palette.

### UI pillar

**No new UI surface.** All five templates render through the existing encounter modal (`EncounterResolutionModal`), ActionDrawer card filtering already honors `requiredTargetTraits` and `encounterGates.blocks` (polarity-agnostic), Chronicle auto-logs `recent_event` effects, and HexMap already shows encounter-seed glints via the standard seed-visibility pipeline. `{title}` resolver is existing infrastructure — see the **Verification note** in the Engine pillar about negative-title fallback.

**Concept art assets** (illustration slot is a UI concern):

| Template | Path |
|---|---|
| the-executioners-commission | `/public/concept-art/encounters/the-executioners-commission.webp` |
| the-unmarked-crossing | `/public/concept-art/encounters/the-unmarked-crossing.webp` |
| the-silent-chamber | `/public/concept-art/encounters/the-silent-chamber.webp` |
| the-jury-of-the-ruined | `/public/concept-art/encounters/the-jury-of-the-ruined.webp` |
| the-blinded-oracle | `/public/concept-art/encounters/the-blinded-oracle.webp` |

Art brief per REPUTATION_GATED_README.md Rule 4: parchment palette, desaturated earth tones, painterly digital style, wide compositions, faces avoided when possible. CC should generate via `image-generation` skill during Implementation pipeline stage 4. The five scenes all favor interior or enclosed exterior settings with single-source lighting — match the mood of the first-tranche illustrations.

### Wiring section

| Surface | Change |
|---|---|
| Orchestrator phase | None — existing encounter pipeline handles. |
| ActionDrawer filter | Existing `requiredTargetTraits` check handles required-negative identically to required-positive. Existing `encounterGates.blocks` check handles iron.positive blocking the-blinded-oracle. No change. |
| GameState fields | None new. `reputationTallies` already per-actor. |
| Trace emissions | Existing `reputation.tally.changed`, `encounter.resolved`, `hidden_mark.created`, `encounter_seed.created`, `recent_event.logged`. No new categories. |
| DebugPanel | Existing ReputationInspector shows tallies (including negatives). Existing EncounterLog shows resolutions. No change. |
| HexMap signifiers | Existing seed-glint renderer for `encounter_seed` effects. No change. |
| Chronicle | `recent_event` effects auto-surface via existing Chronicle pipeline. No change. |
| Prose pipeline (`enrichProse`) | `{title}` placeholder already resolved by existing title resolver — **verify negative-title fallback during implementation.** |

See `Docs/plans/wiring-checklist.md`. No new rows needed.

---

## Constants Table (NFP #1 — Tunability)

All tunable numbers in the templates are expressed as literal properties in each template's effect blocks. The ones that matter for tuning:

| Template | Field | Value | Purpose |
|---|---|---|---|
| executioners-commission | rarityTier | 2 | Slightly rarer — only the magistrate's circle produces this opportunity. |
| executioners-commission | encounter_seed delay (A) | 30 ticks | Kin-of-condemned arc latency. |
| executioners-commission | encounter_seed delay (B) | 25 ticks | Magistrate vengeance response timing. |
| executioners-commission | hidden_mark severity (A) | 0.5 | Reveal weight for the unnamed hand. |
| executioners-commission | recent_event significance (A) | 0.65 | Shadow-sentence narrative weight. |
| unmarked-crossing | encounter_seed delay (A) | 30 ticks | Customs inquiry latency. |
| unmarked-crossing | encounter_seed delay (B) | 20 ticks | Smuggler reprisal timing. |
| unmarked-crossing | hidden_mark severity (A) | 0.45 | Unlogged-crossing reveal weight. |
| silent-chamber | essenceCost | 2 | Sanctum-entry cost; gates the forbidden path behind meaningful spend. |
| silent-chamber | rarityTier | 2 | The chamber is rare; not every veil.negative target is near one. |
| silent-chamber | hidden_mark severity (A) | 0.55 | Forbidden-contact reveal weight (highest of tranche). |
| silent-chamber | recent_event significance (A) | 0.7 | Manuscript-read narrative weight. |
| silent-chamber | encounter_seed delay (A) | 35 ticks | Guild-investigation latency. |
| silent-chamber | encounter_seed delay (B) | 40 ticks | Rehabilitation overture latency. |
| jury-of-the-ruined | encounter_seed delay (A) | 30 ticks | Accused vengeance arc latency. |
| jury-of-the-ruined | encounter_seed delay (B) | 25 ticks | Circle-censure timing. |
| jury-of-the-ruined | hidden_mark severity (A) | 0.4 | Signed-onto-circle reveal weight. |
| blinded-oracle | essenceCost | 2 | Seer-presence cost; gates the prophecy behind meaningful spend. |
| blinded-oracle | rarityTier | 3 | Rarest in the tranche — the blinded oracle is a once-or-twice-a-game encounter. |
| blinded-oracle | hidden_mark severity (A) | 0.55 | Prophecy-carried reveal weight. |
| blinded-oracle | recent_event significance (A) | 0.75 | Prophecy-given narrative weight. |
| blinded-oracle | encounter_seed delay (A) | 45 ticks | Prophecy reckoning latency (longest — the prophecy unfolds slowly). |
| blinded-oracle | encounter_seed delay (B) | 30 ticks | Order-investigates latency. |

All values match the pacing already established by first and middle tranche templates. If playtest reveals reach-negative encounters fire too often or too rarely, tune rarityTier + encounterGates filter weight — do not introduce per-template frequency constants.

---

## Tracing (NFP #2 — Inspectability)

No new trace types. Templates emit existing trace categories through existing effect handlers:

```ts
// emitted automatically by aftermath runner on reputation_tally effect:
interface ReputationTallyChangedTrace {
  category: 'reputation.tally.changed';
  actorId: string;
  key: ReputationTallyKey;  // 'iron.negative' etc.
  delta: number;
  templateId: string;
  encounterId: string;
}

// emitted by hidden_mark effect handler:
interface HiddenMarkCreatedTrace {
  category: 'hidden_mark.created';
  actorId: string;
  markCategory: 'secret_knowledge' | 'divine_favor' | 'reputation_note' | 'concealed_action' | 'forbidden_contact';
  severity: number;
  label: string;
  revealFamilies: string[];
  templateId: string;
}

// emitted by encounter_seed effect handler:
interface EncounterSeedCreatedTrace {
  category: 'encounter_seed.created';
  actorId: string;
  encounterFamily: string;
  delayTicks: number;
  priority: number;
  seedLabel: string;
  templateId: string;
}
```

**Note:** `concealed_action` and `forbidden_contact` hidden_mark categories are used here. Verify at implementation time that the existing hidden_mark category enum includes these. If it does not, extend the enum (additive change) — do not invent a different category.

---

## Fail-Soft Table (NFP #4)

See Engine pillar above. All five templates share the same fail-soft surface as first and middle tranche entries, plus one new failure mode:

- **Required-negative template offered to an actor who shed the negative trait mid-session:** The ActionDrawer re-filters on each open; template disappears from the card stack immediately. No stale card state.

---

## NFP Compliance Summary

| Priority | Status | Note |
|---|---|---|
| 1 — Tunability | PASS | All magic numbers named in template property fields; constants table above enumerates them. |
| 2 — Inspectability | PASS | No new traces needed; existing categories cover every aftermath effect. |
| 3 — Determinism | PASS | No PRNG used at authoring level; aftermath runs deterministically given gate input. Mixed-polarity gate evaluation is deterministic (AND of required + NOT block). |
| 4 — Fail-soft | PASS | Gate mismatch → filtered; bad unlock id → no crash; unresolved placeholder → fallback; negative-title resolver fallback noted as implementation-verification item. |
| 5 — Narrative over mechanical perfection | PASS | Every branch reinforces the reputation's flavor. Negative traits are not just "bad" — they unlock opportunities the reputable cannot access. The fiction leads the mechanic. |
| 6 — Additive over destructive | PASS | New templates + new gate unlocks only. No existing template touched. Tranches 1 and 2 `encounterGates` entries are append-only. New iron.positive `blocks` entry is additive (first block entry, or appended if blocks already exist). |
| 7 — Performance budget | PASS | Five templates added to existing pool; template filtering cost is O(templates × target-traits) with small constants. Mixed-polarity gate adds one O(1) lookup per candidate. No regression. |

---

## Three-Pillar Gate Check

- **Engine:** PASS — new `encounterGates` wiring on 6 traits (5 negative + 1 positive-block), no new systems. One verification flag: confirm the `{title}` resolver returns negative titles for actors with only negative traits.
- **Content:** PASS — this is the work. 5 templates, full branch logic, support bundles, prose, aftermath, illustrations identified.
- **UI:** PASS — uses existing encounter modal + ActionDrawer filtering + Chronicle + HexMap signifiers + `{title}` placeholder resolver. Concept art assets enumerated.
- **Wiring:** PASS — no new checklist rows needed; all surfaces already in place from first and middle tranches.

---

## Load-Bearing Architectural Decisions — Compliance

- **Everything a graph node/edge:** gates read from trait nodes via edges, no new property fields.
- **Reaches and Spheres orthogonal:** templates declare `reach` for action categorization; aftermath tallies accrue per reach polarity. No sphere coupling.
- **No new node types:** uses existing trait, actor, location, sublocation, encounter-seed nodes. The mixed-polarity gate is a *new combination* of existing `encounterGates.blocks` and `requiredTargetTraits` — not a new node type.
- **Relationships as edges:** support bundle actors/locations attach via existing `located_at` / `participates_in` edges.
- **Hex-granular awareness:** each template's support bundle resolves to a hex via existing three-tier resolver.
- **WorldGraph mutation-in-place:** `reputation_tally` effects mutate actor properties — existing aftermath runner already calls `touchWorld()`. No change.

---

## Rejected Approaches Considered

- **Inventing a new `encounterGates.blocks_mixed_polarity` field to make the mixed-polarity gate explicit.** Rejected — the existing `encounterGates.blocks` on a positive trait already encodes the intent, and introducing a new field to express a pattern the engine already supports violates "Additive over destructive" and "No new node types without verification." The novelty lives in the content layer and the README documentation, not the engine.
- **Requiring iron.negative AND eye.negative for the-blinded-oracle** (multi-trait AND of two negatives). Rejected — the blinded oracle's fiction is specifically about discredited sight and refusing martial pride, not about compound disgrace. A mixed-polarity gate says something a double-negative gate cannot: the proud-in-iron are specifically *excluded*, even if they are also eye.negative. This distinction matters for the fiction.
- **Making required-negative templates cheaper than required-positive ones to compensate for "downside" reputation.** Rejected — reach-negatives are not downsides. They are a different *kind* of standing, not a lesser one. Costing them differently would mechanize a distinction the design is trying to dissolve.
- **Adding an aftermath effect that "cleanses" a negative trait as a branch reward.** Rejected — branch B of each template *does* apply a `-1` delta to the negative trait alongside `+1` to the positive. That is the cleansing mechanism. A dedicated cleanse effect kind would be engine bloat.
- **Gating the-blinded-oracle on star.positive being absent (alternative block).** Rejected — iron.positive is the thematically right exclusion (martial pride refuses the seer who was blinded by discredit). Star would signal divine favor, which is orthogonal. Picking the right block trait is a content-layer decision; the engine supports any positive trait as the block.

---

## Implementation Steps (for Claude Code)

1. **Read** `src/data/encounters/REPUTATION_GATED_README.md`, first-tranche templates (warlords-tribute.ts, pilgrims-offering.ts), and middle-tranche templates (merchants-favor.ts, infiltrators-approach.ts) as reference.
2. **Verify** the `{title}` resolver behavior for actors holding only negative traits. If it only returns positive titles, extend it to fall back to the highest-tier negative trait title (additive change).
3. **Verify** the hidden_mark category enum includes `concealed_action` and `forbidden_contact`. If not, extend the enum (additive change).
4. **Author** all 5 templates in `src/data/encounters/` following the briefs above. One file per template.
5. **Register** each in `src/data/unified-action-templates.ts`.
6. **Wire gates** in `src/data/reputation-trait-content.ts`:
    - Append to `encounterGates.unlocks` on iron.negative, gold.negative, veil.negative, stone.negative, eye.negative.
    - Add (or append to) `encounterGates.blocks` on iron.positive — this is the NOVEL mixed-polarity wiring.
7. **Add** all 5 ids to the `TRANCHE` fixture in `src/engine/__tests__/reputation-gated-encounters.test.ts`.
8. **Add one new scenario test**: verify the-blinded-oracle is filtered OUT for an actor holding both eye.negative L1+ and iron.positive L1+, and filtered IN for an actor holding only eye.negative L1+. This covers the mixed-polarity pattern.
9. **Generate** 5 concept-art illustrations via the `image-generation` skill using the art brief in REPUTATION_GATED_README.md Rule 4. Save to `/public/concept-art/encounters/`.
10. **Update** REPUTATION_GATED_README.md's Gate Pattern Reference table: add rows for `Required-negative` (example: `the-executioners-commission`) and `Mixed-polarity` (example: `the-blinded-oracle`). This completes the rubric's documentation of the engine's gate vocabulary.
11. **Run** the pre-commit trio: `npm test`, `npx tsc --noEmit`, `npx vite build`.
12. **Codex review** the branch diff before push.
13. **Close** with `Fixes THR-147` in the commit message.

---

## Handoff

- **Suggested model:** sonnet (content-heavy authoring, moderate-complexity gate wiring, one novel engine-verification item and one novel scenario test — no architectural rework).
- **Parallel-safe with:** Any issue that does NOT modify `src/data/encounters/`, `src/data/reputation-trait-content.ts`, `src/data/unified-action-templates.ts`, `src/engine/__tests__/reputation-gated-encounters.test.ts`, or `src/engine/prose/resolvers/titleResolver.ts` (the negative-title verification may touch this file).
- **Mutex with:** THR-146 (middle tranche) while it remains in flight — both edit the registration file and the trait content file. Wait for THR-146 to merge before starting THR-147, or coordinate via sequential worktrees.
- **Codex review:** yes — five new templates plus a novel mixed-polarity gate pattern plus a new scenario test and a possible title-resolver extension warrants structural review before merge.

---

## Related

- Parent: THR-32 (reputation-gated encounters first tranche) — completed.
- Sibling: THR-146 (middle tranche, templates 6–10) — in flight; blocks this issue.
- Rubric: `src/data/encounters/REPUTATION_GATED_README.md` (gains two new pattern rows as part of this work).
- Reference templates: `src/data/encounters/pilgrims-offering.ts` (req+blocked pattern, closest analogue for branch-variant aftermath shape).
