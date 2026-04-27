# Reputation-Gated Encounters — Middle Tranche (Templates 6–10)

**Linear:** THR-146 (Deferral from THR-32, project: Content Architecture)
**Status:** Ready for Dev (design complete)
**Author:** Cowork (design), Claude Code (implementation)
**Date:** 2026-04-18

---

## Summary

Author the second set of five reputation-gated `UnifiedActionTemplate` encounters, following the 6-rule rubric in `src/data/encounters/REPUTATION_GATED_README.md`. First-tranche templates (warlords-tribute, shadow-court-audience, pilgrims-offering, the-veiled-consultation, the-stones-judgement) covered Iron+, Shadow- (blocked), Veil+/Eye+ (AND), Heart+, Stone+. This tranche targets gaps: Gold+, Eye+ standalone, Star+ (w/ negative block), Shadow+, and `power.renown` (novel tier — not a reach, but a reputation trait).

**Reach-coverage gap analysis** (vs. 8 reaches + `power.renown`):

| Reach / Trait | First tranche covers? | Middle tranche adds |
|---|---|---|
| Iron+ | yes (warlords-tribute, required-positive) | — |
| Gold+ | **no** | **the-merchants-favor** (required-positive) |
| Shadow- | yes (shadow-court-audience, blocked) | — |
| Shadow+ | **no** | **the-infiltrators-approach** (required-positive) |
| Veil+ | yes (veiled-consultation, AND w/ Eye) | — |
| Heart+ | yes (pilgrims-offering, req+blocked) | — |
| Eye+ (standalone) | **no** (only as AND leg) | **the-oracle-consulted** (required-positive) |
| Stone+ | yes (stones-judgement, tier-sensitive) | — |
| Star+ / Star- | **no** | **the-star-pilgrim** (required + blocked) |
| `power.renown` | **no** | **the-renowned-duel** (required-positive — novel: non-reach trait) |

### Note on "Flesh" from issue description
THR-146 lists "Flesh" as a reach to cover. **There is no Flesh reach in the Threadbare cosmology** (verified: `src/types/agent.ts:26-47` lists eight reaches — iron, gold, shadow, veil, heart, eye, stone, star — plus the meta pair `courage_prudence`). The flesh-adjacent concept that IS a reputation trait is `power.renown` (raw martial/bodily distinction, not domain-bound). The design below substitutes `power.renown` and flags it as a first-use gate pattern for a non-reach trait. If the human decides a different substitution is wanted, only **template 5 (the-renowned-duel)** needs its gate key swapped — the rest stand.

---

## Three-Pillar Coverage

### Engine pillar

**No new systems.** Reputation-tally, encounterGates (`unlocks`/`blocks`), requiredTargetTraits, aftermath effect kinds (`reputation_tally`, `hidden_mark`, `encounter_seed`, `recent_event`) all exist from the first tranche. This tranche exercises them at the same surface.

**New encounterGates wiring** on existing trait definitions in `src/data/reputation-trait-content.ts`:

| Trait (definitionId) | Add to `encounterGates` |
|---|---|
| `trait.reputation.gold.positive` | `unlocks: [...existing, 'reputation.gold.the_merchants_favor']` |
| `trait.reputation.shadow.positive` | `unlocks: ['reputation.shadow.the_infiltrators_approach']` (new key — shadow.positive likely had no unlocks before) |
| `trait.reputation.eye.positive` | `unlocks: [...existing, 'reputation.eye.the_oracle_consulted']` (append — existing entry unlocks veiled-consultation via AND) |
| `trait.reputation.star.positive` | `unlocks: ['reputation.star.the_star_pilgrim']` |
| `trait.reputation.star.negative` | `blocks: ['reputation.star.the_star_pilgrim']` |
| `trait.reputation.power.renown` | `unlocks: ['reputation.power.the_renowned_duel']` (first-ever gate on power.renown — verify no polarity suffix is expected; `power.renown` has no positive/negative polarity in trait content) |

**Verify at implementation time:** `power.renown` trait ID shape. If it has polarity variants, use `power.renown.positive`. If not, use the bare ID. Check `src/data/reputation-trait-content.ts` entry shape before writing the gate.

**Registration:** add all 5 imports to `src/data/unified-action-templates.ts` and push onto the exported template array.

**Test coverage:** add all 5 ids to the `TRANCHE` fixture in `src/engine/__tests__/reputation-gated-encounters.test.ts`. Structural invariants already run per fixture entry (rubric rules 1–4). No new scenario tests required — same gate patterns as first tranche, plus one novel `power.renown` case whose structural invariants already match the pattern.

**Trace emissions:** unchanged. `reputation_tally` effects emit existing `reputation.tally.changed` traces via the aftermath runner. No new trace categories.

**Fail-soft table:**

| Failure | Behavior |
|---|---|
| Target lacks required trait (gate mismatch) | Template filtered out by ActionDrawer — never surfaces. Safe by construction. |
| `encounterGates` mis-declares an unlock id | Gate lookup returns empty; template never unlocks. Logged via existing gate resolver warning. Fail-soft. |
| Aftermath effect references unknown encounter family | `encounter_seed` silently drops; no crash (existing behavior in `aftermath/recentEvents.ts`). |
| `{title}` placeholder unresolved | Existing fallback renders a neutral descriptor. No crash. |
| Support bundle actor/location missing | Existing bundle resolver substitutes or skips — template still runs with reduced flavor. |

### Content pillar (the work)

Five new templates in `src/data/encounters/`, one file each:

#### 1. `the-merchants-favor.ts` — Gold+ (required-positive)

- **Id:** `reputation.gold.the_merchants_favor`
- **Reach:** gold · **crudType:** read · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.gold.positive']` + `encounterGates.unlocks` on gold.positive
- **Premise:** A desperate merchant whose caravan was robbed approaches `{title}` (e.g. "Gracious Patron"), asking not for coin but for intercession at a hostile guildhall that blames *him* for the loss.
- **Step 0 (initiation):** The merchant kneels on worn boards, pouch empty, asks for a single word spoken in the right ear. Uses `{title}`.
- **Step 1 (branch):** Two authored choices.
  - **A — Intercede personally** (reinforcing): Walk to the guildhall, stake reputation on his word. Aftermath: `{ key: 'gold.positive', delta: 1 }`, `recent_event` narrative (significance 0.6), `encounter_seed` `gold.patronage` (delay 30 ticks, priority 0.8, seed label "the merchant's repayment").
  - **B — Refuse the plea, but mark his robbers** (contrary): Decline public advocacy; quietly set shadow-aligned agents on the bandits. Aftermath: `{ key: 'gold.positive', delta: -1 }`, `{ key: 'shadow.positive', delta: 1 }`, `hidden_mark` (category `secret_knowledge`, severity 0.35, label "spoke no favor but took the score", revealFamilies: gold.betrayal family), `encounter_seed` `shadow.retribution` (delay 20, priority 0.75, "the bandits discover someone noticed").
- **Support bundle:** merchant (actor, delivery `approach`, persistence `single_encounter`), guildhall (location, delivery `context`, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-merchants-favor.webp` · wide shot, merchant kneeling on counting-house floor, coins spilled, threadbare palette.

#### 2. `the-oracle-consulted.ts` — Eye+ standalone (required-positive)

- **Id:** `reputation.eye.the_oracle_consulted`
- **Reach:** eye · **crudType:** read · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.eye.positive']` + append to eye.positive `encounterGates.unlocks`
- **Premise:** Two scholars arrive with a sealed clay tablet whose inscription they cannot decipher. Word of `{title}` (e.g. "Oracle") brought them across three days of road.
- **Step 0 (initiation):** The scholars unwrap the tablet on a trestle table. The glyphs shift slightly when observed — not magic, but an ancestor script the guild lost. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Read it openly** (reinforcing): Speak the meaning plain. Aftermath: `{ key: 'eye.positive', delta: 1 }`, `hidden_mark` (category `secret_knowledge`, severity 0.4, label "the tablet's true reading", revealFamilies: eye.revelation family), `recent_event` (significance 0.55, "the oracle read the lost script").
  - **B — Give the truth as a riddle** (contrary): Answer true but oblique — so the meaning is earned, not given. Aftermath: `{ key: 'eye.positive', delta: 1 }`, `{ key: 'shadow.positive', delta: 1 }`, `encounter_seed` `eye.riddle_pursued` (delay 35, priority 0.7, "the riddle's echo reaches a rival scholar"), `recent_event` (significance 0.5).
- **Support bundle:** two scholar actors (roles `petitioner`, persistence `single_encounter`), library sublocation preferred.
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-oracle-consulted.webp` · wide shot, trestle table, candlelight, tablet centered, painterly, Threadbare palette.

#### 3. `the-star-pilgrim.ts` — Star+ required + Star- blocked

- **Id:** `reputation.star.the_star_pilgrim`
- **Reach:** star · **crudType:** read · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 2 (the only higher-cost template in this tranche; reflects invoking divine radiance)
- **Gate:** `requiredTargetTraits: ['trait.reputation.star.positive']`; star.negative adds `blocks: ['reputation.star.the_star_pilgrim']`; star.positive adds `unlocks`.
- **Premise:** A sick child carried on a father's shoulders reaches `{title}` (e.g. "Blessed") — the parents walked seven days believing the star-touch of the target can cure what village healers could not.
- **Step 0 (initiation):** The child's breathing is shallow. The father says nothing; he only unwraps the blanket. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Channel the radiance** (reinforcing, costly): Pay the essence, call the star-light. The child stirs. Aftermath: `{ key: 'star.positive', delta: 1 }`, `hidden_mark` (category `divine_favor`, severity 0.5, label "the pilgrim child who lived", revealFamilies: star.miracle family), `recent_event` (significance 0.8, "a miracle was witnessed"), `encounter_seed` `star.wider_pilgrimage` (delay 40, priority 0.85, "word of the healing reaches the next valley").
  - **B — Bless and send onward** (reinforcing, cheaper): Lay hands, offer prayer, direct the family to a sister shrine. Aftermath: `{ key: 'star.positive', delta: 1 }`, `{ key: 'heart.positive', delta: 1 }`, `encounter_seed` `star.referred_pilgrim` (delay 25, priority 0.7, "the family's journey continues"), `recent_event` (significance 0.55).
- **Support bundle:** father + child (paired actors, delivery `approach`, persistence `single_encounter`), shrine (location, delivery `context`, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-star-pilgrim.webp` · wide shot, father holding child wrapped in cloth, shrine lintel behind, dawn light, Threadbare palette.

#### 4. `the-infiltrators-approach.ts` — Shadow+ (required-positive)

- **Id:** `reputation.shadow.the_infiltrators_approach`
- **Reach:** shadow · **crudType:** read · **scale:** local · **rarityTier:** 1
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.shadow.positive']` + add `unlocks` on shadow.positive trait (likely first unlock entry there)
- **Premise:** A hooded stranger slides into the seat across from `{title}` (e.g. "Deep Shadow") in a tavern's back booth. They propose a betrayal — selling out their own rival master in exchange for shelter under the target's reputation.
- **Step 0 (initiation):** The hood stays up. The stranger speaks low, lists specific names — names the target would only hear if their reach truly extends that far. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Accept the deal** (reinforcing): Take the intelligence, extend shelter. Aftermath: `{ key: 'shadow.positive', delta: 1 }`, `{ key: 'eye.positive', delta: 1 }`, `hidden_mark` (category `secret_knowledge`, severity 0.45, label "holds the traitor's list", revealFamilies: shadow.betrayal family), `encounter_seed` `shadow.rival_strike` (delay 30, priority 0.85, "the betrayed master moves first").
  - **B — Reveal the meeting anonymously to their master** (contrary): Send word through three cut-outs — the stranger never learns. Aftermath: `{ key: 'shadow.positive', delta: 1 }`, `{ key: 'iron.positive', delta: 1 }`, `hidden_mark` (category `secret_knowledge`, severity 0.4, label "sold a traitor back to their own", revealFamilies: shadow.loyalty family), `encounter_seed` `shadow.faction_turmoil` (delay 20, priority 0.8, "the rival faction's purge begins").
- **Support bundle:** hooded stranger (actor, role `petitioner`, persistence `single_encounter`), tavern back-room (sublocation preferred, persistence `persistent`).
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-infiltrators-approach.webp` · wide shot, two figures across a tavern table, single lamp, deep shadow, Threadbare palette.

#### 5. `the-renowned-duel.ts` — power.renown (required-positive, novel trait gate)

- **Id:** `reputation.power.the_renowned_duel`
- **Reach:** iron (primary action-domain — duels are iron-shaped even when the *gate* is renown) · **crudType:** read · **scale:** local · **rarityTier:** 2 (slightly rarer — only the most storied attract challengers)
- **Intrinsic tier:** shaping · **apCost:** 1 · **essenceCost:** 1
- **Gate:** `requiredTargetTraits: ['trait.reputation.power.renown']` (**verify exact id shape at implementation**; if polarity-suffixed use `power.renown.positive`). Add `unlocks` entry to the `power.renown` trait definition.
- **Premise:** A young contender, wooden practice blade strapped to their back, plants themselves in `{title}`'s (e.g. "Storied One") path. They ask not for hatred but for recognition — a bout so the world sees them.
- **Step 0 (initiation):** The contender's hands are steady. They've rehearsed this. Uses `{title}`.
- **Step 1 (branch):**
  - **A — Grant the duel honorably** (reinforcing martial): Accept, fight clean, let the outcome stand. Aftermath: `{ key: 'iron.positive', delta: 1 }`, `hidden_mark` (category `reputation_note`, severity 0.3, label "named a still-rising challenger", revealFamilies: power.rivalry family), `encounter_seed` `iron.rivalry_arc` (delay 40, priority 0.8, "the contender returns with stakes raised"), `recent_event` (significance 0.65).
  - **B — Decline with dignity, bestow a blessing** (contrary): Refuse the blade, offer teaching or a token. Aftermath: `{ key: 'heart.positive', delta: 1 }`, `{ key: 'star.positive', delta: 1 }`, `encounter_seed` `heart.mentor_bond` (delay 25, priority 0.75, "the contender seeks your counsel"), `recent_event` (significance 0.6).
- **Support bundle:** contender (actor, role `challenger`, persistence `single_encounter` — may recur via `iron.rivalry_arc` seed), courtyard or training-yard sublocation preferred.
- **Failure:** no tally.
- **Illustration:** `/concept-art/encounters/the-renowned-duel.webp` · wide shot, young duelist planted in road, target approaching, spectators at distance, Threadbare palette.

### UI pillar

**No new UI surface.** All five templates render through the existing encounter modal (`EncounterResolutionModal`), ActionDrawer card filtering already honors `requiredTargetTraits`, Chronicle auto-logs `recent_event` effects, and HexMap already shows encounter-seed glints via the standard seed-visibility pipeline. `{title}` resolver is existing infrastructure.

**Concept art assets** (illustration slot is a UI concern):

| Template | Path |
|---|---|
| the-merchants-favor | `/public/concept-art/encounters/the-merchants-favor.webp` |
| the-oracle-consulted | `/public/concept-art/encounters/the-oracle-consulted.webp` |
| the-star-pilgrim | `/public/concept-art/encounters/the-star-pilgrim.webp` |
| the-infiltrators-approach | `/public/concept-art/encounters/the-infiltrators-approach.webp` |
| the-renowned-duel | `/public/concept-art/encounters/the-renowned-duel.webp` |

Art brief per REPUTATION_GATED_README.md Rule 4: parchment palette, desaturated earth tones, painterly digital style, wide compositions, faces avoided when possible. CC should generate via `image-generation` skill during Implementation pipeline stage 4.

### Wiring section

| Surface | Change |
|---|---|
| Orchestrator phase | None — existing encounter pipeline handles. |
| ActionDrawer filter | Existing `requiredTargetTraits` check handles both positive gates and blocked-by-negative (via `encounterGates.blocks`). No change. |
| GameState fields | None new. `reputationTallies` already per-actor. |
| Trace emissions | Existing `reputation.tally.changed`, `encounter.resolved`, `hidden_mark.created`, `encounter_seed.created`, `recent_event.logged`. No new categories. |
| DebugPanel | Existing ReputationInspector shows tallies. Existing EncounterLog shows resolutions. No change. |
| HexMap signifiers | Existing seed-glint renderer for `encounter_seed` effects. No change. |
| Chronicle | `recent_event` effects auto-surface via existing Chronicle pipeline. No change. |
| Prose pipeline (`enrichProse`) | `{title}` placeholder already resolved by existing reputation-title resolver. No change. |

See `Docs/plans/wiring-checklist.md`. No new rows needed.

---

## Constants Table (NFP #1 — Tunability)

All tunable numbers in the templates are expressed as literal properties in each template's effect blocks — they are the content knobs. The ones that matter for tuning:

| Template | Field | Value | Purpose |
|---|---|---|---|
| merchants-favor | encounter_seed delay (A) | 30 ticks | How long until the patronage return-arc fires. Raise for slower pacing. |
| merchants-favor | encounter_seed delay (B) | 20 ticks | Shadow retribution latency. |
| merchants-favor | hidden_mark severity (B) | 0.35 | Probability weight for reveal. |
| oracle-consulted | encounter_seed delay (B) | 35 ticks | Riddle propagation delay. |
| oracle-consulted | hidden_mark severity (A) | 0.4 | Reveal weight for the lost-script mark. |
| star-pilgrim | essenceCost | 2 | Costlier than other tranche templates — gates the miracle path behind essence. |
| star-pilgrim | hidden_mark severity (A) | 0.5 | Divine favor reveal weight (highest in tranche). |
| star-pilgrim | recent_event significance (A) | 0.8 | Miracle narrative weight for Chronicle surfacing. |
| star-pilgrim | encounter_seed delay (A) | 40 ticks | Pilgrimage arc latency. |
| infiltrators-approach | hidden_mark severity (A) | 0.45 | Traitor-list reveal weight. |
| infiltrators-approach | encounter_seed delay (A) | 30 ticks | Rival strike response timing. |
| renowned-duel | rarityTier | 2 | Rarer than baseline — only accessible with strong renown tally. |
| renowned-duel | encounter_seed delay (A) | 40 ticks | Rivalry arc callback latency. |

All values match the pacing already established by first-tranche templates. If first-tranche feels off in playtest, tune there first and mirror here.

---

## Tracing (NFP #2 — Inspectability)

No new trace types. Templates emit existing trace categories through existing effect handlers:

```ts
// emitted automatically by aftermath runner on reputation_tally effect:
interface ReputationTallyChangedTrace {
  category: 'reputation.tally.changed';
  actorId: string;
  key: ReputationTallyKey;  // 'gold.positive' etc.
  delta: number;
  templateId: string;
  encounterId: string;
}

// emitted by hidden_mark effect handler:
interface HiddenMarkCreatedTrace {
  category: 'hidden_mark.created';
  actorId: string;
  markCategory: 'secret_knowledge' | 'divine_favor' | 'reputation_note';
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

---

## Fail-Soft Table (NFP #4)

See Engine pillar above. All five templates share the same fail-soft surface as first-tranche entries.

---

## NFP Compliance Summary

| Priority | Status | Note |
|---|---|---|
| 1 — Tunability | PASS | All magic numbers named in template property fields; constants table above enumerates them. |
| 2 — Inspectability | PASS | No new traces needed; existing categories cover every aftermath effect. |
| 3 — Determinism | PASS | No PRNG used at authoring level; aftermath runs deterministically given gate input. |
| 4 — Fail-soft | PASS | Gate mismatch → filtered; bad unlock id → no crash (logged); unresolved placeholder → fallback. |
| 5 — Narrative over mechanical perfection | PASS | Every branch reinforces reputation flavor; each outcome reads like fiction, not a stat bump. |
| 6 — Additive over destructive | PASS | New templates + new gate unlocks only. No existing template touched. First tranche's `encounterGates` entries are append-only. |
| 7 — Performance budget | PASS | Five templates added to existing pool; template filtering cost is O(templates × target-traits) with small constants. No regression. |

---

## Three-Pillar Gate Check

- **Engine:** PASS — new `encounterGates` wiring on 5 traits, no new systems. Flag: verify `power.renown` id shape before writing gate.
- **Content:** PASS — this is the work. 5 templates, full branch logic, support bundles, prose, aftermath, illustrations identified.
- **UI:** PASS — uses existing encounter modal + ActionDrawer filtering + Chronicle + HexMap signifiers + `{title}` placeholder resolver. Concept art assets enumerated.
- **Wiring:** PASS — no new checklist rows needed; all surfaces already in place from first tranche.

---

## Load-Bearing Architectural Decisions — Compliance

- Everything a graph node/edge: gates read from trait nodes via edges, no new property fields.
- Reaches and Spheres orthogonal: templates declare `reach` for action categorization; aftermath tallies accrue per reach. No sphere coupling.
- No new node types: uses existing trait, actor, location, encounter-seed nodes.
- Relationships as edges: support bundle actors/locations attach via existing `located_at` / `participates_in` edges.
- Hex-granular awareness: each template's support bundle resolves to a hex via existing three-tier resolver.
- WorldGraph mutation-in-place: `reputation_tally` effects mutate actor properties — existing aftermath runner already calls `touchWorld()`. No change.

---

## Rejected Approaches Considered

- **Gating on `power.renown` with a polarity suffix we invent here.** Rejected — if the existing `power.renown` has no polarity, inventing one at template-authoring time violates "no new node types without verification." Design flags the verification step and defers the final key string to implementation.
- **Substituting a 9th reach for "Flesh" from the issue description.** Rejected — no 9th reach exists and creating one is out of scope. `power.renown` is the closest honest substitute.
- **Making the star-pilgrim template essenceCost 1 to match the rest.** Rejected — the miracle branch should feel costly; 2-essence gates the reinforcing path behind meaningful spend.
- **Adding novel aftermath effect kinds (e.g. `faction_turmoil`).** Rejected — the existing `encounter_seed` + labeled family covers every narrative consequence in this tranche. No engine work needed.

---

## Implementation Steps (for Claude Code)

1. **Read** `src/data/encounters/REPUTATION_GATED_README.md` and first-tranche templates (warlords-tribute.ts, pilgrims-offering.ts) as reference.
2. **Verify** `power.renown` trait id shape in `src/data/reputation-trait-content.ts` before writing template 5's gate.
3. **Author** all 5 templates in `src/data/encounters/` following the briefs above. One file per template.
4. **Register** each in `src/data/unified-action-templates.ts`.
5. **Wire gates** in `src/data/reputation-trait-content.ts` — append to existing `encounterGates.unlocks` arrays where present; add the star.positive, shadow.positive, and `power.renown` entries.
6. **Add** all 5 ids to the `TRANCHE` fixture in `src/engine/__tests__/reputation-gated-encounters.test.ts`.
7. **Generate** 5 concept-art illustrations via the `image-generation` skill using the art brief in REPUTATION_GATED_README.md Rule 4. Save to `/public/concept-art/encounters/`.
8. **Run** the pre-commit trio: `npm test`, `npx tsc --noEmit`, `npx vite build`.
9. **Codex review** the branch diff before push.
10. **Close** with `Fixes THR-146` in the commit message.

---

## Handoff

- **Suggested model:** sonnet (content-heavy authoring, moderate-complexity gate wiring)
- **Parallel-safe with:** Any issue that does NOT modify `src/data/encounters/`, `src/data/reputation-trait-content.ts`, `src/data/unified-action-templates.ts`, or `src/engine/__tests__/reputation-gated-encounters.test.ts`.
- **Mutex with:** THR-32b (final tranche — same files), any in-flight Content Architecture encounter work that edits the same registration file.
- **Codex review:** yes — five new templates touching gate wiring warrants structural review before merge.

---

## Related

- Parent: THR-32 (reputation-gated encounters first tranche) — completed.
- Sibling: THR-32b (final tranche, templates 11–15) — unblocked by this issue.
- Rubric: `src/data/encounters/REPUTATION_GATED_README.md`.
- First-tranche reference template: `src/data/encounters/pilgrims-offering.ts`.
