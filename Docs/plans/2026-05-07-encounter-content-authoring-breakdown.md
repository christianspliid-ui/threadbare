---
status: current
title: Encounter Content Authoring Breakdown — THR-318 child filing strategy
date: 2026-05-07
linear: THR-318
parent_plan: 2026-05-04-encounter-experience-design-plan.md
phasing_plan: 2026-05-05-encounter-ui-implementation-phasing.md
audience: cowork, codex
---

# Encounter Content Authoring Breakdown (2026-05-07)

**Status:** Cowork breakdown of THR-318 (Encounter content authoring — parallel epic for v1 ship). Files the architecture decisions and child-ticket split for the four content streams. Sibling to the implementation phasing plan (THR-317) — engine + UI ride that plan; content rides this one.

**Audience:** Cowork (Streams 2/3/4 design follow-ups, deferred items), Codex executors picking up Stream 1 sub-tickets, future audits of how the content backlog was sequenced for v1.

**Why this doc exists.** THR-318 is a tracking epic that listed four content streams without filing concrete child tickets — its `Done when` requires that. Phase A1 (encounter contract schema, THR-350) shipped 2026-05-07 06:21, which unblocks the structural authoring contract Stream 1 needs. Streams 2/3/4 still have legitimate design dependencies that this doc names. Files Stream 1 child tickets now; defers 2/3/4 with explicit gating.

---

## 1. Inputs (read before executing children)

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — long-form design plan; §3 (engine), §4.1 (encounter contract YAML), §4.2 (cosmological pattern table)
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` — phasing plan; §2 (six v1-blocking decisions), §3 (phase ticket map)
- `src/types/encounter-contract.ts` — settled schema (THR-350); `EncounterArchetypePole`, `MORAL_AXIS_POLES_BY_REACH`, `QUINTESSENCE_POLES`
- `src/data/encounter-contract-validators.ts` — Zod validator, including `isPoleAllowedForReach`
- `src/engine/encounter-contract-adapter.ts` — UAT ↔ EncounterContract bridge; `encodeContractMetadata` carries contracts via `illustrationAlt`
- THR-345 (G3 lint spec, `Docs/plans/2026-05-07-thr-G3-content-lint-spec.md`) — what the lint will gate post-merge
- `Vision/taste-profile.md` §"Meeting-encounter prose" + project memory `feedback_prose_quality_bar` — tone bar

---

## 2. The four streams — current state

Recap and current decision per stream. The full source statements are in THR-318's description.

| Stream | Subject | v1 status | Block on |
|---|---|---|---|
| **1** | Existing encounter `moral_axis_pole` migration (audit + correct inferred defaults) | **Ready to file children this session** | None — A1 schema shipped 2026-05-07 |
| **2** | Detail page content fill (named NPCs, items, factions, places, events) | Deferred | THR-319 (detail page data model) — sibling design ticket, not yet started |
| **3** | Character + place art backlog | Deferred | User direction on pipeline scale-up + priority list |
| **4** | Watch-only / un-intervened path prose | Deferred | Partial overlap with Stream 1's per-encounter authoring; better authored as a Stream-1-aware editorial pass |

This doc files **Stream 1 — Pass 1** as the immediate child ticket. Streams 2/3/4 get deferred-with-rationale entries below; their child tickets get filed in later Cowork sessions when the gates clear.

---

## 3. Stream 1 deep-dive — `moral_axis_pole` migration

### 3.1 The current state (default-inferred is wrong)

Today, every existing UAT-format encounter, when adapted to `EncounterContract` at runtime, gets `moral_axis_pole = MORAL_AXIS_POLES_BY_REACH[reach][0]` — the **first** pole of the reach (`adapter.ts` line 94–99, 181, 194). That's `protector` for every Iron choice, `mender` for every Gold choice, `confessor` for every Shadow choice, etc. Roughly half of authored choices intend the **second** pole (Conqueror, Magnate, Puppeteer, …) and are silently mislabelled.

Drift accumulation (design plan §3.6) reads `moral_axis_pole`. An agent who repeatedly picks a Shadow Puppeteer choice should accumulate puppeteer drift. With default-inferred poles, they accumulate confessor drift instead. **Stream 1 is the bridge from "the engine works structurally" to "the engine's drift means what the choices say it means."**

### 3.2 Architecture decision (Cowork verdict, this session)

**Use the existing adapter metadata channel.** `encodeContractMetadata()` (adapter line 71–73) packs an `EncounterContract` into the UAT's `illustrationAlt` field as `__encounter_contract_v1:<JSON>`. The adapter's reader (`decodeContractMetadata`, line 75–85) prefers an authored contract over `defaultPoleForReach()` fallback. **No schema change needed.**

**Trade-off accepted for v1.** The accessibility regression — `illustrationAlt` becomes a JSON blob instead of human-readable alt text — is real but bounded. The illustration is rendered with the contract's `place.painting` field (in the EncounterContract) or via the encounter UI's own painting slot, not the legacy UAT alt text. Filed follow-up: **THR-318 Stream 1 — Post-v1 cleanup (extend UAT type with `encounterContract?: EncounterContract` field, retire the `illustrationAlt` channel, restore alt text to plain string).**

**Why not extend `AuthoredChoiceCard` with `moralAxisPole`?** Considered and rejected: the EncounterContract is the canonical authoring shape per design plan §4.1 (place / cast / scene_state / protagonist_view / beats / aftermath / ascendant_hand_filter). Authoring half a contract via choice-card extension creates two parallel authoring paths and would have to be unwound when Streams 2/3/4 land their full contracts. The metadata channel keeps one canonical authoring shape from day one.

**Why not full-fidelity `EncounterContract` migration in Stream 1?** Considered and rejected for v1 scope. Authoring the full contract per encounter (cast, scene_state, callback_candidates, prose_tooltips, ascendant_hand_filter) is Stream 2 territory and depends on THR-319. Stream 1 ships **lite-contracts**: the minimum a contract needs to carry correct `moral_axis_pole`, leaving the rest to fall back on adapter defaults until Streams 2/4 author them.

### 3.3 The lite-contract authoring template

For each existing UAT-format encounter, the Stream 1 executor produces a sibling `EncounterContract` with this minimum payload, then sets `illustrationAlt: encodeContractMetadata(parsed)`:

```typescript
const CONTRACT: EncounterContract = parseEncounterContract({
  encounter: {
    id: '<existing UAT id>',
    protagonist: 'actor.placeholder',  // Stream 2 fills the real protagonist link
    category: '<from existing UAT — guild|social|tavern|borderland|monster|anomaly|army|branching>',
    rarity_tier: <existing UAT rarityTier>,
    intrinsic_tier: <existing UAT intrinsicTier>,
    place: {
      location: 'location.placeholder',   // Stream 2 fills
      ambient_state: {},
      painting: '<existing UAT illustrationUrl>',
    },
    cast: [],                              // Stream 2 fills
    scene_state: {                         // Stream 2 fills
      threads_in_play: [],
      factions_here: [],
      place_conditions: [],
      conditions_on_protagonist: [],
    },
    protagonist_view: {
      capability_axes: [<existing UAT reach>, <existing UAT reach>, <existing UAT reach>],
      items_relevant: [],
      vows_active_per_beat: {},
      callback_candidates: [],
      state_descriptor: <existing UAT description ?? 'no descriptor'>,
    },
    beats: <one beat per existing ActionStep, with encounter_choices[] mapped from authoredChoices[stepIndex] — see §3.4>,
    aftermath: {
      receipt: <existing UAT narrativeTemplates.success>,
      changes: [],                         // Stream 2/B6 wires real changes
    },
    ascendant_hand_filter: { /* permissive defaults */ },
  },
});
```

Lite-contract shape lives at the top of each migrated encounter file as a constant, then `illustrationAlt: encodeContractMetadata(CONTRACT)` slots it into the existing UAT export.

### 3.4 The editorial decision per choice — picking the right pole

For each `AuthoredChoiceCard` on an existing UAT (or per-step choice for non-`authoredChoices` UATs), the executor:

1. **Read the choice's `label` + `intent` + `targetLabel` + `likelyBurden`.** These are the player-facing strings (god verb, agent reaction, what-tilts-toward, fail-forward).
2. **Determine which pole on the reach's axis the choice tilts toward.** The 8 reach axes are:
   - **iron**: `protector` (mercy, defense, shielding) ↔ `conqueror` (force, dominance, breaking)
   - **gold**: `mender` (asceticism, healing, enough) ↔ `magnate` (extravagance, accumulation, more)
   - **shadow**: `confessor` (honesty, exposure, truth-spoken) ↔ `puppeteer` (cunning, manipulation, strings-pulled)
   - **veil**: `archivist` (tradition, memory, carrying-forward) ↔ `heretic` (novelty, rupture, breaking-new)
   - **heart**: `sworn` (loyalty, oath, kept-bond) ↔ `renegade` (ambition, self, broken-bond)
   - **eye**: `seeker` (revelation, exposure, light-cast) ↔ `sentinel` (discretion, watching-only, light-withheld)
   - **stone**: `guardian` (preservation, integrity, stay-the-shape) ↔ `shaper` (transformation, reforging, change-the-shape)
   - **star**: `martyr` (self-sacrifice, witness-bearing) ↔ `survivor` (continuance, persistence)
   - **quintessence** (meta-property): `vanguard` (story-forward, lead-the-thread) ↔ `watcher` (story-back, observe-the-thread)
3. **If the choice is genuinely ambiguous** (a true 50/50 between the two poles), default to the FIRST pole (`MORAL_AXIS_POLES_BY_REACH[reach][0]`) — same as the legacy adapter — and add a code comment `// pole-ambiguous: review pass needed` for editorial follow-up.
4. **Per-encounter editorial spot-check.** The executor's PR description lists each encounter's choices with their authored pole. Christian (creative director) reviews the list at PR review time and flags any miscalls. Author corrects per review.

### 3.5 Categorical split — three Stream 1 child tickets

Total surface: **124 UnifiedActionTemplate exports across 47 files** (verified via `grep -c "^export const \w+ ?: ?UnifiedActionTemplate"`). Splitting into three tickets keeps PR size manageable (≤500-line diffs) and parallel-safe across executors.

| Sub-ticket | Files | UAT count (approx) | Codex-fit notes |
|---|---|---|---|
| **Stream 1 Pass 1 — Branching encounters** | `src/data/encounters/*.ts` (33 files, one UAT each) | ~33 | Most cosmologically loaded — these are the showcase narrative encounters. Highest value for getting poles right. **Files this session.** |
| **Stream 1 Pass 2 — Faction encounter content** | `*-encounter-content.ts` per faction (10 modules: arcane-circle, builders-fellowship, civic-guard, holy-order-dawn, lorekeepers-covenant, merchant-consortium, mercenary, rangers-brotherhood, temple-of-spheres, thieves-guild, underking-court) | ~70 | Faction-flavored. Per-faction tone bar matters; Pass 1 verdicts establish the rubric Pass 2 follows. **Files in next Cowork cycle (after Pass 1 lands).** |
| **Stream 1 Pass 3 — Ambient encounter content** | `tavern-`, `social-`, `borderland-`, `monster-`, `army-encounter-content.ts`, `encounter-anomaly-content.ts`, `encounter-content.ts`, `secret-encounter-content.ts`, `social-scene-templates.ts`, `effect-shell-proof-templates.ts`, `unified-action-templates.ts`, `faction-action-encounters.ts` | ~21 | Ambient / generic encounters. Lower per-choice cosmological loading; mechanical pattern-application after Pass 1+2 set the rubric. **Files in next Cowork cycle (after Pass 2 lands).** |

Sequencing rationale: Pass 1 establishes the editorial rubric on the highest-value 33 encounters. Pass 2 refines the rubric on faction content where per-faction voice adds nuance. Pass 3 mechanically applies the rubric to the long tail. Each Pass is a separate Codex ticket to keep WIP manageable and enable per-Pass user editorial review.

### 3.6 Mutex / parallel safety

**Stream 1 vs other in-flight work:**
- **Mutex with:** any Pass touching the same encounter file. Pass 1, Pass 2, Pass 3 are file-disjoint by construction.
- **Mutex with:** Phase B5 (THR-327 — encounter template graph node) — already Done as of 2026-05-07 07:53; no live conflict.
- **Mutex with:** any future migration that changes the UAT type itself.
- **Parallel-safe with:** all current Encounter Experience phase tickets (A3, B4, B6, B7, C3, D3, G3) — those touch types/components/lint, not encounter content files.

**Stream 1 vs G3 lint (THR-345):** complementary, not overlapping. G3 builds the runner; Stream 1 produces the contracts the runner gates. Stream 1 PRs should run `npm run lint:encounter-content` once G3 ships and resolve any flagged contracts.

---

## 4. Stream 2 — detail page content fill (deferred)

**Status:** Deferred until THR-319 (detail page data model design) lands.

**Why blocked.** Per phasing plan §2.5 / §8: Phase E (detail page implementation) blocks on THR-319 specifying section schema, resolver registry, showcase-flag pattern, per-type templates, prose tier mapping. Without that contract, content authors can't author detail-page sections — they don't know what to fill.

**What Stream 2 will look like once unblocked.** Per THR-318:
- Named NPCs in the playable arc — disposition, threads, last-pulled events, what-she-is-to-her
- Items (artifacts + possessions) — meaning, giver, scene tilt
- Factions — how they hold the protagonist, alliances, opposed, headquarters
- Places — what this place wants, conditions, memory
- Events — what happened, who was there, what it became, how it invokes now

**Filing trigger.** When THR-319 lands its plan doc, file Stream 2 children per node type (Actor / Item / Faction / Place / Event) — likely 5 separate tickets, each scoped to ~1-2 weeks of writer-pace authoring. Reuse Stream 1 lite-contracts as the integration target (Stream 2 fills the `cast`, `scene_state`, `callback_candidates`, etc. that Stream 1 left as defaults).

**Open question for user (logged here, not blocking Stream 1):** does Stream 2 author the long-tail (every named NPC on the map) or the playable-arc-only set (named cast members and locations the protagonist visits in the v1 demo arc)? The v1-arc-only scope is shippable; the long-tail expands to v1.5+. **Recommend v1-arc-only scope** for Stream 2; long-tail becomes a separate post-v1 epic.

---

## 5. Stream 3 — character + place art backlog (deferred)

**Status:** Deferred until user direction on pipeline scale-up and priority list.

**Why blocked.** Per THR-318 the open decisions are:
1. **Pipeline:** scale current Threadbearer-style image-gen process to bulk?
2. **Fallback:** gradient silhouettes for un-illustrated nodes (acceptable for v1)?
3. **Priority order:** which agents and places first?

These are creative-direction decisions — Christian is sole authority. Cowork can scope the *technical* pipeline ticket (image-gen scale-up, asset curation, fallback wiring), but should NOT pre-empt the priority list.

**Filing trigger.** Brief brainstorm with Christian on (a) v1 art-budget ceiling, (b) named-cast priority list, (c) place art priority, (d) acceptable fallback. Output of that brainstorm files Stream 3 children: one Cowork ticket for pipeline scale-up + one Codex ticket per priority batch.

**Recommend:** schedule a brainstorming session before Stream 3 children are filed. Until then, gradient-silhouette fallbacks are wired (already the visual default per the v7 design pass) and Stream 1 / Stream 2 work proceeds without art-blocking.

---

## 6. Stream 4 — watch-only / un-intervened path prose (deferred but partially merged into Stream 1)

**Status:** Deferred as standalone stream; partially absorbed into Stream 1's per-encounter editorial pass.

**Why partial absorption.** The watch-only path is what fires when no choice is committed — the un-intervened resolution. In `EncounterContract` shape, that lives in:
- `aftermath.receipt` (the no-choice narrative summary) — Stream 1 lite-contracts already populate this from existing UAT `narrativeTemplates.success`
- per-choice `fail_forward` (what arises when the chosen path fails forward) — Stream 1 reviews this per choice during pole authoring

**What Stream 4 still owns.** The editorial *quality bar* on un-intervened paths — per THR-318 *"un-intervened encounters must produce stories worth reading"* — is a per-encounter prose-quality review separate from pole correctness. Stream 1 catches structural correctness; Stream 4 catches narrative quality.

**Filing trigger.** After Stream 1 Pass 1 ships, run a Stream 4 editorial sweep on the same 33 encounters: for each, read the `aftermath.receipt` and per-choice `fail_forward` strings; flag any that fail the prose-quality bar (per `feedback_prose_quality_bar` memory + taste-profile §"Meeting-encounter prose"); rewrite. **One Cowork-author OR CC ticket per Stream 1 Pass.**

**G3 lint overlap.** G3's R5 (prose quality soft heuristic) flags cliché word usage; Stream 4's editorial pass goes deeper (sentence-level voice, narrative interest). G3 surfaces candidates; Stream 4 rewrites them.

---

## 7. Filing plan — what gets filed this session

| Linear action | What | Why |
|---|---|---|
| **File child issue** | THR-318 Child — Stream 1 Pass 1: branching encounter `moral_axis_pole` migration (33 files in `src/data/encounters/`) | Most-bounded, highest-value sub-ticket; Codex-fit |
| **State** | Ready for Codex | Mechanical pattern-application after this plan doc settles the rubric |
| **Model label** | `model:sonnet` | Pole-picking judgment matters per choice; haiku risks miscall, opus is overkill |
| **Plan-pending-commit label** | Apply to THR-318 (this session — the breakdown plan needs to flush) | `flush-plan-docs` commits this file within the hour |
| **Comment on THR-318** | Update with breakdown plan link + Streams 2/3/4 deferral rationale | Audit trail; future Cowork sessions read THR-318 first |
| **THR-318 state** | **Stays In Design** | Streams 2/3/4 still need future Cowork passes; epic remains open |

Streams 2/3/4 child tickets get filed in subsequent Cowork sessions per the gating triggers in §4–6.

---

## 8. Three-pillar coverage

This is a content-authoring epic, not a feature; pillars apply to the work it dispatches.

- **Engine pillar:** N/A for Stream 1 — the schema (THR-350), validators (Zod, `isPoleAllowedForReach`), and adapter (`decodeContractMetadata` reads authored over default) all shipped in Phase A1. Stream 1 produces content that lights up engine paths already wired.
- **Content pillar:** Stream 1 = the authored contracts. Stream 2 = detail page sections. Stream 4 = un-intervened prose review. Streams cover the content surface comprehensively for v1.
- **UI pillar:** N/A direct — UI components (Phase C1–C4, D1–D2, E1–E2) consume the contracts; their behaviour is testable via Phase G1–G3 tests + lint. No new UI work needed *because* the content is filled.

---

## 9. NFP compliance summary

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | Pole assignments are authored per choice, in plain TypeScript constants — every magic number adjacent (drift_magnitude, probability_tilt) lives in `encounter-experience-constants.ts` per A2 |
| 2. Inspectability | ✅ PASS | Authored contracts produce `archetype_drift_register` traces (existing); G3 lint reports per-choice violations with `path: ['beats', i, 'encounter_choices', j, 'moral_axis_pole']` |
| 3. Determinism | ✅ PASS | Authored contracts contain only literal strings/IDs — no PRNG involvement at content layer |
| 4. Fail-soft | ✅ PASS | If a contract fails Zod parse, adapter falls back to `defaultPoleForReach()` (existing, line 181); the encounter still resolves, drift just reverts to default-inferred |
| 5. Narrative over mechanical perfection | ✅ PASS | Stream 1's editorial pass is exactly this — the choice-author wrote what the choice MEANS; Stream 1 honors that meaning structurally |
| 6. Additive over destructive | ✅ PASS | No schema change in Stream 1; only `illustrationAlt` value content changes (regression noted in §3.2 with follow-up filed) |
| 7. Performance budget | ✅ PASS with note | Lite-contract JSON ~2-4KB per encounter; 124 encounters ≈ 250-500KB additional bundle; G2 snapshot tests verify no perf regression at 1920×1080 |

---

## 10. Vision audit

Stream 1 is structural correctness — it does not introduce a Vision premise. It honours an existing one: design plan §1 Rule 2 ("the moral axis is structural") only works if `moral_axis_pole` reflects what the choice actually does. Stream 1 makes Rule 2 true in the corpus, not just in theory.

Streams 2/3/4 ride existing Vision premises (named-cast specificity, art tone, prose quality bar) without contradiction.

No new Vision premise is introduced or contradicted by this breakdown plan.

---

## 11. Done when (this plan's exit criteria)

- [x] Architecture decision for Stream 1 documented (metadata channel via `illustrationAlt` + `encodeContractMetadata`)
- [x] Editorial rubric documented (per-choice pole picking, ambiguity rule, code comment marker)
- [x] Categorical split documented (Pass 1 / 2 / 3 with file lists and UAT counts)
- [x] Streams 2/3/4 deferral rationale captured with filing triggers
- [x] Three-pillar coverage + NFP compliance + Vision audit complete
- [ ] Stream 1 Pass 1 child issue filed in Linear (Ready for Codex, model:sonnet, full coordination block)
- [ ] THR-318 description updated with link to this plan doc
- [ ] `plan-pending-commit` label applied to THR-318 so this file gets committed within the hour

---

## 12. References

- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` — design plan
- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` — phasing plan (THR-317)
- `Docs/plans/2026-05-07-thr-G3-content-lint-spec.md` — G3 lint spec (THR-345)
- `src/types/encounter-contract.ts` — schema
- `src/engine/encounter-contract-adapter.ts` — adapter (lines 71–85 = encode/decode metadata; 94–99 = default pole; 176–240 = fallback contract)
- `Docs/plans/2026-04-13-linear-coordination-protocol.md` — coordination block template
