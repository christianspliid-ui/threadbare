# Content Census Value Authoring — Scale-Assignment + Reach-Derivation Rubric

- **Date:** 2026-06-23
- **Linear:** THR-477 (Content Census value authoring — scale axis + condition/omen reach)
- **Parent epic:** THR-469 (Cross-content variety & coverage program) — In Design
- **Blocked-by:** THR-474 (ContentCensusTag schema plumbing) — **Done** (the optional `censusTag` field now exists on each registry entry type)
- **Status:** Implementation-ready (rubric is the gating deliverable; this doc IS the rubric)
- **Pillars:** Engine N/A (field exists; re-run census) · **Content** (the substance) · UI N/A (offline measurement artifact)

> `plan-pending-commit` applied — the hourly `flush-plan-docs` task commits this doc; do not commit it manually.

---

## 1. Why this issue exists

The THR-473 census run showed the high-value coverage signal — **`scale` for ~177 entries** and **`reach` for conditions/omens** — has **no derivation path**. It requires per-entry judgment against a rubric that did not exist. THR-474 shipped the mechanical schema plumbing (the optional `censusTag: { reach?, scale? }` field). This issue authors the *values*, and the gating prerequisite for authoring is a rubric that makes the calls consistent. Inconsistent scale tags poison the reach×scale heatmap that drives THR-469 P2 desert-filling, so the rubric must come first and authoring must follow it exactly.

This doc resolves the rubric **and** the open derive-vs-persist policy (scope item #4) so authoring can proceed without further design.

---

## 2. The two axes (canonical, do not invent values)

**Scale** — strictly 4-valued (`src/types/unifiedAction.ts` → `ActionScale`):

`personal | local | regional | cosmic`

**Reach** — strictly 8-valued (`src/types/traits.ts` → `ReachDomain`; **not nine — Flesh was removed in TB-075, do not reintroduce it**):

`iron | gold | shadow | veil | heart | eye | stone | star`

| Reach | Domain |
|-------|--------|
| iron | Strength, force, martial action, direct confrontation |
| gold | Wealth, influence, social capital, patronage, trade |
| shadow | Stealth, deception, sabotage, hidden action |
| veil | Magic, divination, supernatural perception, ritual |
| heart | Emotion, loyalty, persuasion, personal bonds |
| eye | Knowledge, observation, judgment, intelligence |
| stone | Endurance, craftsmanship, building, preservation |
| star | Travel, fate, navigation, survival, long-distance |

Where an axis is genuinely meaningless for an entry, use the **`'n/a'` sentinel** (deliberately occupies no cell) rather than leaving it absent (which reads as "not yet tagged"). Absent/`null` = backfill TODO; `'n/a'` = settled-as-not-applicable.

---

## 3. Scale rubric — the load-bearing deliverable

**Scale answers one question:** *What is the radius of this entity's effect or significance in the world?*

| Scale | Radius test |
|-------|-------------|
| `personal` | Effect terminates at a single agent's own body / mind / fate. Confers no presence beyond the holder or sufferer. |
| `local` | Effect reaches a hex, a settlement, or the wielder's immediate surroundings — a place and those standing in it. |
| `regional` | Effect spans multiple hexes / a region / many settlements. Acts on a swath of the world. |
| `cosmic` | World-altering, pantheon- or doom-tier. Acts on the world-soul or everyone. |

### 3.1 Applicability constraints (per registry) — narrows most calls to binary

| Registry | Count | Allowed scales | Default |
|----------|-------|----------------|---------|
| Conditions | 6 | `personal`, `local` | `personal` |
| Omens | 44 | `regional`, `cosmic` | `regional` |
| Attachments | 119 | all 4 | derive from tier+subcategory (below) |
| Spells | 5 | all 4 | derive from targeting (below) |
| Artifacts | 3 | all 4 | derive from tier (below) |

Conditions and omens collapse to a **binary** choice. Attachments/spells/artifacts use the per-type tables below, which make the common case near-mechanical and reserve judgment for genuine edge entries.

### 3.2 Conditions (6) — `personal` vs `local`

Decision test: *"Does this condition's effect terminate at the agent's own boundary?"*

- **`personal`** (default) — an internal state of one agent: wounded, exhausted, inspired, an individual curse or blessing. The effect is the agent's own changed capability.
- **`local`** — the condition radiates to a place or co-located group: a state held by a settlement/faction, or one whose effect spills onto others sharing the hex.

Expect the current 6 (predominantly individual body/mind states) to land **mostly `personal`**. Promote to `local` only when the condition's text describes a place- or group-level effect, not just the holder's own capability shift.

### 3.3 Omens (44) — `regional` vs `cosmic`

Omens are portents that manifest across the world; the only question is gravity. Drive the call from `doomStageRange`, `doomArchetypes`, and `category`:

- **`regional`** (default) — a bounded manifestation: strange weather, regional dread, a cultural portent, an environmental sign. Most omens.
- **`cosmic`** — tied to world-ending escalation: the omen's `doomStageRange` reaches the **top doom band**, or its `doomArchetypes`/vocabulary imply pantheon- or world-soul-level stakes (the end of the world, not a bad season).

Heuristic: `category: 'doom_echo'` with a high `doomStageRange` upper bound is a `cosmic` candidate; `cultural` / `environmental` and low-stage echoes are `regional`. Read the `tagline` + `atmosphere` lines to confirm gravity before promoting to `cosmic` — keep `cosmic` rare so it stays meaningful.

### 3.4 Attachments (119) — tier-primary, subcategory-override

Most attachments fall out of `tier` with a `subcategory` override. Resolve in this order:

1. **Subcategory override** (wins if present):
   - `arms` / `tools` / `vestments` / `trinket` → `local`
   - `regalia` → `regional`
   - `relic` / `world` (world-relic) → `cosmic`
   - a purely self-bounded charm/talisman with no outward effect → `personal`
2. **Else fall back to tier:** `tier 1–2` → `local`; `tier 3` → `regional`; `tier 4` (legendary/world-relic) → `cosmic`.

Decision test: *"How far does the item's significance reach?"* A spear matters to its wielder in a fight → `local`. A crown that commands a realm → `regional`. A relic that reshapes the world → `cosmic`. Reserve `personal` for items whose entire effect is an intimate self-buff conferring no world presence.

### 3.5 Spells (5) — targeting-primary

Drive from `targeting.type` + effect magnitude:

- `targeting: self`, pure self-state buff → `personal`
- `targeting: self`, affects surroundings (movement, area-from-self) → `local`
- single external target / area on a hex → `local`
- multi-hex / region targeting → `regional`
- world-altering effect (doom, world-soul) → `cosmic`

Worked example: *Veilwalk* (teleport 3 hexes, `targeting: self`, self-relocation affecting position) → **`local`**.

### 3.6 Artifacts (3) — tier-primary, skews high

- `tier 4` legendary / world-relic → `cosmic`
- `tier 3` → `regional`
- lower → judge by reach of effect, but artifacts skew `regional`/`cosmic` by nature.

Worked example: *The Worldforge Anvil* (`tier 4`, world-creation, cursed) → **`cosmic`**.

---

## 4. Reach rubric + derive-vs-persist policy (resolves scope item #4)

**Policy decision (single source of truth, determinism — NFP #2/#3): author `censusTag.reach` ONLY where the census has no derivation path. Leave all derivable reach to the adapter at runtime.**

Rationale: persisting a derived value creates a second source of truth that silently drifts when `effects[]` or `domainContributions` change later. The census is an offline, diffable measurement artifact; it should derive from the live data wherever it can and carry an authored value only where derivation is impossible. This keeps each entry's reach single-sourced and the census deterministic.

Applying that policy:

| Registry | Reach source | Authoring required? |
|----------|--------------|---------------------|
| Conditions (6) | adapter derives via `dominantReachFromContributions(domainContributions)` | **No** |
| Attachments — 117 with effects-reach | adapter derives via `dominantReachFromEffects(effects)` | **No** |
| Attachments — 2 with no effects-reach | no derivation path | **Yes** (author `censusTag.reach`) |
| Spells — 4 with effects-reach | adapter derives via `dominantReachFromEffects(effects)` | **No** |
| Spells — 1 with no effects-reach | no derivation path | **Yes** |
| Artifacts (3) | adapter derives via `dominantReachFromEffects` / `activatedEffects` | **No** |
| Omens (44) | **no derivation path exists at all** | **Yes — all 44** |

**Total reach authoring: 47 entries** (44 omens + 2 attachments + 1 spell). Everything else is derived.

### 4.1 Dominant-reach derivation (for the adapter, not authored here)

`dominantReachFromContributions` / `dominantReachFromEffects` pick the reach with the **largest absolute magnitude**. A negative dominant still names the reach — e.g. `wounded` (`iron: -0.08, stone: -0.04`) → **`iron`** (the condition operates *in* the iron domain, degrading it). Tie-break: stable order of `REACH_DOMAINS`. This belongs in the census adapter (THR-474 surface); confirm it exists before relying on it — if a helper is missing for conditions, author `censusTag.reach` from `domainContributions` as a fallback and log a follow-up.

### 4.2 Authored reach for the 3 effect-less attachments/spells

Read each entry's `tags` (often already carry a reach hashtag, e.g. `#iron`), `mechanicalSummary`, and `flavorText`; pick the single dominant `ReachDomain`. The reach hashtag in `tags`, when present, is authoritative.

### 4.3 Authored reach for omens (44) — hint table, then read the vocabulary

Omens carry no reach signal, so this is the genuine 8-way judgment. Start from a default-by-signal table, then override by reading the omen's `vocabulary`/`tagline`:

| Omen signal (`category` / `doomArchetype` / theme) | Default reach |
|------|------|
| `doom_echo`, `breach`, thin-places, supernatural dread | `veil` (or `shadow` if concealment/sabotage themed) |
| cultural, political, patronage, crowds | `heart` (or `gold` if wealth/trade themed) |
| environmental, weather, blight, land | `stone` (or `star` if travel/fate/sky themed) |
| martial, war, slaughter | `iron` |
| prophecy, knowledge, revelation, judgment | `eye` |

The table is a starting point, not a lockbox — the omen's `vocabulary.nouns`/`atmosphere` lines decide. Aim for spread across all 8 reaches rather than collapsing 44 omens into 2–3 reaches (that would itself create a desert the census is meant to expose).

---

## 5. Work decomposition (what CC actually edits)

**Scale — author for all 177 applicable entries** (scale has no derivation path on any type):

| File | Entries | Scale authoring |
|------|---------|-----------------|
| `src/data/condition-trait-content.ts` | 6 | personal/local |
| `src/data/omenTemplates.ts` | 44 | regional/cosmic |
| `src/data/reward-attachment-catalog.ts` | 119 | §3.4 table |
| `src/data/spell-templates.ts` | 5 | §3.5 |
| `src/data/artifact-templates.ts` | 3 | §3.6 |

**Reach — author for 47 entries only** (per §4 policy): all 44 omens (`omenTemplates.ts`), 2 effect-less attachments + 1 effect-less spell (ids in the THR-473 census "no reach found" worklist). All other reach is left to runtime derivation — **do not persist it.**

Set the unauthored axis to the `'n/a'` sentinel only where an axis is genuinely inapplicable; otherwise leave reach absent on derivable entries (the adapter fills it).

---

## 6. Three pillars

### Engine — N/A (rationale)
The `censusTag` field and the census adapter's derivation helpers shipped in THR-474. No engine change here. **Verification step, not a build step:** after authoring, re-run `npm run content-census` and confirm the scale row fills (was 0% resolvable) and the reach row reaches ~100% (omens move from 0 → authored; derivable types unchanged).

### Content — the substance
The authored `censusTag` values above. This is the entirety of the deliverable. Author against §3 and §4; do not deviate from the rubric — if an entry doesn't fit, note it and pick the closest rather than inventing a value or axis.

### UI — N/A (rationale)
The census is an offline markdown+JSON artifact (`Docs/playtests/coverage/`), not a player-facing or in-game surface. No component, modal, HexMap signifier, or DebugPanel change. (The THR-469 epic's coverage dashboard is a separate, later child issue.) Because nothing under `src/components/`, `src/views/`, HexMapV2, or styles changes, this issue is **Browser-verify exempt** — state that in the commit body.

---

## 7. Constants (NFP #1)

No new runtime constants. The authoring vocabulary is fixed by the canonical types: `ActionScale` (4 values), `ReachDomain` (8 values), `'n/a'` sentinel. The per-registry applicability sets (`SCALE_APPLICABILITY`) live in the census/backfill layer from THR-474 — reuse them; do not redefine.

## 8. Fail-soft (NFP #4)

| Case | Behavior |
|------|----------|
| Entry where scale is genuinely inapplicable | tag `scale: 'n/a'` (occupies no cell) — never guess |
| Omen reach ambiguous between two reaches | pick the dominant per `vocabulary`; favor reach-spread over concentration; never leave absent (omens have no fallback derivation) |
| Condition `domainContributions` empty/missing | adapter can't derive → author `censusTag.reach` from flavor as fallback + open follow-up |
| Derivation helper for conditions absent in THR-474 surface | author reach from contributions manually; log impediment |

## 9. Done when

- `censusTag.scale` authored on all 177 applicable entries per §3 (conditions, omens, attachments, spells, artifacts).
- `censusTag.reach` authored on the 47 no-derivation entries per §4 (44 omens + 2 attachments + 1 spell); derivable reach left to the adapter (not persisted).
- `npm run content-census` re-run: scale resolvability moves off 0%; omen reach moves to ~100%; dated md+json artifact regenerated and the new heatmap pasted/linked as evidence.
- `npx tsc --noEmit` and `npx vite build` clean (data-only change; no test logic added). Paste raw output.
- **Browser-verify exempt** (data-only, no UI surface) — state in commit body.
- Closing commit body: `Fixes THR-477`.

## 10. Follow-ups (do not block)

- UL-proposal to formalize `scale` tier semantics (personal/local/regional/cosmic) in the cosmology shard, since this rubric is the first place they're written down for content.
- Optional census lint: re-derive effect-based reach and warn if a future persisted tag (should any appear) drifts from `dominantReachFromEffects` — only needed if the no-persist policy is ever reversed.
- THR-469 P2 (sublocation families for the 7 non-Gold reaches) consumes the resulting real reach×scale heatmap to target deserts.
