# THR-398 — Hex-Recon Verb Collapse (Survey)

**Date:** 2026-05-12
**Linear:** [THR-398](https://linear.app/threadbare/issue/THR-398) — *Collapse 6 hex-recon verbs into a single unified Survey*
**Project:** Content Architecture (Now / High)
**Parent:** [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
**Replaces:** Original issue body (high-level direction; this doc adds NFP wiring, Vision audit, and engine spec the executor needs)
**Brainstorm companion:** inline in §2 / §4 (single-pass curation; the issue body itself plus Christian's verdict is the brainstorm)

## 0. Reading the issue forward

The audit (THR-390 §4) flagged six hex-recon verbs that all answer the same player question — *tell me about this hex* — without exposing a player-legible difference between them. Christian's verdict (2026-05-11): collapse to **one always-available verb** plus at most two deep-read unlocks. This plan settles the **engine substrate** the collapse rides on (the revelation system already separates four narrative layers, which the original issue body did not name) and the **prose surface** the unified verb produces (the original spec described mutations as if they were the player-facing output, an NFP #3 risk).

The four reframed parts of this issue:

1. **Survey becomes a multi-layer reveal**, not just a land-layer reveal. This is the engine change.
2. **Two siblings retire**, two **fold into Survey** as layers, one **promotes to a deep-read unlock**.
3. **One naming collision** (`hex.sense_threads`) is resolved by retiring the verb rather than renaming it — the prose-thread/bond-thread ambiguity is the actual reason it confuses players.
4. **Survey's output is prose, not numbers.** Faction names, populace dispositions, and resource counts are read as a short narrative band, not a stats sheet.

## 1. Codesight pre-flight (Blast Radius)

**Files to touch:**

| File | Importer count | Risk note |
|------|---------------:|-----------|
| `src/data/unified-action-templates.ts` | not in CLAUDE.md high-impact list (~30) | mixed — one templating edit (Survey expanded), one tag edit (`read_currents` promoted), three deletions |
| `src/engine/revelationResolver.ts` | ~12 | additive — `TEMPLATE_REVELATION_MAP` value type widens from `NarrativeLayer` to `NarrativeLayer | readonly NarrativeLayer[]` |
| `src/engine/revelationEmitter.ts` | ~6 | additive — multi-layer reveal path |
| `src/types/trace.ts` | 156 | additive — `RevelationTrace` gains optional `layers?: readonly NarrativeLayer[]` field alongside existing `layer: NarrativeLayer` (backward compatible) |
| `src/components/Codex/codexRegistry.ts` | ~4 | additive — three retired templates removed from the codex catalog filter |
| `src/data/__tests__/unified-action-templates.test.ts` | n/a | mechanical — fixture assertions updated for the new shape |
| `src/engine/__tests__/revelationResolver.test.ts` | n/a | additive — new test for multi-layer reveal |

**One file with 156 importers** (`src/types/trace.ts`) is touched. The change is **additive only** — a new optional field on an existing trace interface, no removal or rename of existing fields. No Blast Radius escalation section required.

**Substrate rideability check** (every claim below was verified before authoring):

| Claim | Where it lives | Verified |
|------|----------------|----------|
| `hex.survey` exists as `crudType: 'read'`, `essenceCost: 0`, no mutation | `src/data/unified-action-templates.ts:1541–1570` | ✅ |
| Revelation layer model = 4 layers (land / soul / people / ruins) | `src/engine/revelationResolver.ts:30–47` | ✅ |
| `TEMPLATE_REVELATION_MAP` is a flat record `templateId → NarrativeLayer` | `src/engine/revelationResolver.ts:30` | ✅ |
| All six recon verbs are pure observation (no `hexActionBridge` mutations) | `src/engine/hexActionBridge.ts:89, 113, 132, 150, 151` | ✅ |
| `hex.survey` is already on the `HIDDEN_SITE_REVEAL_TEMPLATES` list | `src/engine/revelationResolver.ts:160` | ✅ |
| `trayTier` field exists on `UnifiedActionTemplate` (added by THR-407, used by THR-396) | `src/types/traits.ts` (AscendantTrayTier) — verify at execution time | ✅ |
| The Codex view (`?view=codex`) reads from `codexRegistry.ts` and shows individual templates | `src/components/Codex/codexRegistry.ts` | ✅ |

**Substrate that does NOT exist and is NOT built in this issue:**

- A multi-layer revelation emission path (current `revelationEmitter` emits one `RevelationMutation` per template; this issue widens that path to emit ≥1).
- A "deep-read unlock" gating mechanism. `rarityTier: 2` already exists; using it as a *progression* gate (you must unlock before it appears in the drawer) is **out of scope** — the deep-read promotion ships as a tier-2 verb visible to every ascendant. Unlock-gating waits on THR-396's `trayTier: 'rare'` semantics being finalized and the unlock roadmap from THR-390 §5 being implemented.

## 2. The 2026-05-04 direction — settled

The audit raised a parallel question on THR-400: does the 2026-05-04 encounter-experience direction (per-scene god-verbs anchored in reach + sphere + moral axis) retire global `UnifiedActionTemplate` entries?

**Same answer applies here, even more cleanly: no.** Survey is a *strategic-layer recon verb* — the player picks it from the action drawer on a hex target *before* any encounter is in scene. There is no encounter context to author it inside. The per-scene direction concerns the verbs the player reads on a *choice card inside an encounter* ("Stir her resolve" / "Speak when not asked"); Survey is the verb the player reaches for to *find out where to put their attention next*. Both layers exist and neither replaces the other.

Specifically: Survey's mortal-loop bridge (§5) is exactly the connection between the two layers — Survey reveals mortals on the hex, the player chooses one to thread, encounters then fire on the chosen mortal with per-scene god-verbs. Strategic-layer recon enables encounter-layer drama; collapsing the strategic-layer surface improves the on-ramp.

## 3. Vision audit — drifts addressed before draft

Applying the THR-400 audit framework to this issue surfaces three Vision risks. All three are addressed in this plan.

### 3.1 NFP #3 — prose surface, not numbers

`Vision/02-non-negotiables.md` §3 + `Vision/taste-profile.md` (Prose-first UI): the player reads prose, not stats. The original sibling verbs surfaced their results through the existing `RevelationTab` / `RevelationLogTab` UI; the rendering of "Survey output" is **the load-bearing player-visible piece of this collapse**. If Survey reveals "populace mood: 0.42" the collapse fails on Vision.

**Resolution:** §8 specifies the Threadbearer-voice prose template for Survey's output, with IPK keywords for named entities. Numbers never appear in the player surface; the chronicle band is prose, with the same `enrichProse()` pipeline used elsewhere.

### 3.2 Mortal-loop bridge (North Star)

`Vision/00-north-star.md`: the moment we are building toward is one mortal the player came to care about, in a crisis. Recon verbs are the **furthest** from the mortal-loop — they look at land, not at mortals. The audit on THR-400 made this explicit: faction verbs need a per-verb mortal-loop bridge or they fail Vision.

**Resolution:** Survey's *people-layer* fold (absorbing `hex.divine_populace` and `hex.scry_factions`) is the mortal-loop bridge. Survey now surfaces — by name, with IPK keywords — the mortals on the hex (most-bonded first, then top-`leadershipScore` actors, then named NPCs). The player walks away from Survey not with "this hex has 247 inhabitants" but with "Kael, the smith's daughter, the priest in the long house — these are the names worth your attention." The encounter pipeline already does follow-on threading from named NPCs; Survey is the on-ramp that surfaces them.

### 3.3 Terminology drift — "threads" name collision

`hex.sense_threads`'s prose: *"the threads of essence woven through this land"* — this is the *soul layer* (sphere energy currents), not the bond-thread substrate. But the game's load-bearing terminology uses "thread" for player-mortal bonds. Christian's verdict on this verb was *"retire — the player's threaded entities are already visible in the right bar"*, which implies the verdict misread the verb (it reveals sphere energy, not bond threads). Either:

- (A) Honor the verdict literally → retire `sense_threads`. Soul-layer reveal becomes deep-read-only via the promoted `hex.read_currents` at higher essence cost.
- (B) Reinterpret → keep `sense_threads`, rename for terminology hygiene, fold into Survey as the soul-layer component.

**Resolution: option A.** Honor the verdict; retire. The reasoning: this collapse's design goal is *fewer verbs, sharper distinctions*. Keeping `sense_threads` to cover soul-layer reveal duplicates the work `read_currents` already does and reintroduces the legibility problem the collapse exists to solve. Retiring `sense_threads` and tier-2'ing `read_currents` is the cleaner path. The terminology hygiene benefit is a bonus.

**Logged in §15 as an open verdict** so the user can override if they intended option B.

## 4. The collapse, at a glance

Six verbs in. Three verbs out. Net: **−3 verb entries, +1 Survey enrichment, +1 tier-2 deep-read.**

| Original verb | Layer revealed | Cost | Action in this plan |
|---------------|----------------|-----:|---------------------|
| `hex.survey` | land | 0 | **Expand** — reveals land + people; gains `trayTier: 'core'`; remains rarity-1 |
| `hex.sense_threads` | soul (light) | 0.5 | **Retire** (terminology collision; soul-reveal stays as deep-read via `read_currents`) |
| `hex.divine_populace` | people (full) | 3 | **Fold into Survey** — Survey now surfaces named mortals and disposition |
| `hex.scry_factions` | people (partial — factions only) | 2 | **Fold into Survey** — Survey now surfaces faction presence |
| `hex.sense_leylines` | land (partial — leyline existence only) | 1 | **Retire** — its content is the "leyline" fragment of the soul layer; covered by `read_currents` |
| `hex.read_currents` | soul (full) | 3 | **Promote** — set `rarityTier: 2`, rename spell to "Sphere Cartography", remains the deep-read soul-layer verb |

Final state:
- `hex.survey` — multi-layer (land + people), rarity 1, free, core tray, always available.
- `hex.read_currents` — soul layer, rarity 2, 3 essence; the player learns to reach for it when they want the magical-substrate read.
- Three entries removed (`hex.sense_threads`, `hex.divine_populace`, `hex.scry_factions`).
- `hex.sense_leylines` removed (its surface is partial-land, redundant with land already in Survey + currents available via `read_currents`).

Net six → two verbs in the player's drawer for hex reconnaissance. The action drawer becomes a step shorter; the player's mental model of "what is this hex" becomes a step clearer.

## 5. Per-verb design

### 5.1 `hex.survey` (Survey) — multi-layer expansion

**Player reads (drawer card initiation):** *"You cast divine sight across this hex. Land speaks first; the mortals beneath it speak next."*

**Player reads (success chronicle band):** authored prose using `enrichProse()`. Sample output:

> *"The {hexName}: {biome} under {weather}. {locationsByPresence}. Inside the {largestSettlement}, {populaceMoodPhrase}. {factionPresenceLine}. The names that rise in divine sight: {namedMortalsList}."*

Replacement rules:
- `{hexName}`, `{biome}`, `{weather}` — straight string substitution from hex properties.
- `{locationsByPresence}` — comma-separated list of named locations on the hex, ordered by `divinePresence` descending, capped at 3. Format: *"a keep at the river-bend, an old shrine on the ridge, scattered farmsteads."* No counts ("3 locations") — names or descriptive phrases.
- `{largestSettlement}` — single named location with highest population.
- `{populaceMoodPhrase}` — bucketed prose from a small lookup table (see §8.1) keyed on aggregate `disposition`/`unrest` values. Output is a phrase, never a number.
- `{factionPresenceLine}` — names + descriptive phrases of factions with members on this hex. Format: *"the {factionName} holds the upper streets; the {factionName} watches from the marshes."* If no factions, omit the line entirely.
- `{namedMortalsList}` — comma-separated list of mortal names with IPK keyword underlining, ordered by `(bondTier × 2) + leadershipScore + namedness`, capped at 4. Each name uses the existing `ProseKeyword.tsx` underlining pattern.

**Engine effect:**
- No graph mutation (consistent with current Survey).
- Emits `RevelationMutation` for **two layers**: `land` and `people`. This requires the widening described in §7.1.
- Triggers `HIDDEN_SITE_REVEAL_TEMPLATES` check on success (existing behavior preserved — Survey can find hidden ruins).
- Sets `trayTier: 'core'` on the template.

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| Hex has no named mortals | `{namedMortalsList}` block omitted entirely with a soft prose line: *"No names rise — only the press of strangers."* |
| Hex has no factions | `{factionPresenceLine}` omitted entirely |
| Hex has no locations | `{locationsByPresence}` and `{largestSettlement}` omitted; replaced by *"empty country — no walls, no roofs."* |
| Multi-layer reveal partial failure (e.g., people layer errors, land layer succeeds) | Emit reveal for the layer that succeeded; emit trace `revelation_partial_apply` with the failed layer; player reads the available portion |
| `enrichProse()` placeholder unresolvable | Standard fallback: replace placeholder with the placeholder's name (`{populaceMoodPhrase}` → "populace mood unread"); trace `prose_enrichment_fallback` |

**Trace:** existing `RevelationTrace` extended with optional `layers?: readonly NarrativeLayer[]` field (the single-layer `layer: NarrativeLayer` remains for the existing single-layer reveals — Survey populates both `layer` (for legacy consumers, set to the *primary* layer `land`) and `layers` (the full list `['land', 'people']`)).

### 5.2 `hex.read_currents` (Sphere Cartography) — promote to deep-read

**Player reads (drawer card initiation):** *"You open the inner eye to the magical substance flowing under this place — sphere by sphere, current by current."*

**Player reads (success chronicle band):** existing prose, retained:

> *"Sphere influences and their intensities blaze into clarity — the soul of this land is laid bare."*

Enrich with the same `enrichProse()` pipeline. New placeholder `{sphereCurrentsLine}` — a Threadbearer-voice prose summary of the top 2–3 spheres by intensity on this hex. Format: *"{topSphere} runs strong, like a tide that does not break; {secondSphere} threads through it, cold and dim; {thirdSphere} flickers at the edges, almost gone."*

**Engine effect:**
- Set `rarityTier: 2`.
- No mutation; emits `RevelationMutation` for `soul` layer (unchanged).
- `essenceCost: 3` (unchanged).
- `trayTier: 'rare'` (or whatever the rarity-2 tray-tier convention lands on per the unlock-roadmap implementation; default `'rare'`).

**Failure modes & fail-soft:**

| Failure | Fallback |
|---------|----------|
| Hex has no sphere intensity data | `{sphereCurrentsLine}` omits dim spheres; if all are zero, prose reads *"The soul of this place is muted — no current strong enough to name."* |
| Sphere prose lookup missing for a sphere | Skip that sphere; emit `prose_enrichment_fallback` trace |

**Trace:** `RevelationTrace` (unchanged single-layer path).

### 5.3 Retirements: `hex.sense_threads`, `hex.divine_populace`, `hex.scry_factions`, `hex.sense_leylines`

All four removed from `unified-action-templates.ts`. Removed from `TEMPLATE_REVELATION_MAP` and `HIDDEN_SITE_REVEAL_TEMPLATES`. Removed from `codexRegistry`. Tests asserting their existence are deleted; tests asserting their behavior are updated to assert Survey's behavior instead.

**Why retirement vs. fold for `sense_leylines`:** sense_leylines reveals partial-land (leyline existence only). Survey already reveals land. Folding sense_leylines into Survey is redundant; promoting it would duplicate `read_currents`. The cleanest action is retirement, with its prose surface (*"faint lines of power reveal themselves"*) absorbed into `read_currents`' enriched output.

**No tier-2 unlock arises from sense_leylines retirement.** The original issue body suggested merging sense_leylines and read_currents into one tier-2 verb — this plan settles that as "merged, with read_currents as the surviving verb and sense_leylines' prose absorbed."

## 6. Constants table (NFP #1 — Tunability)

| Constant | Default | Used by | Purpose |
|----------|--------:|---------|---------|
| `SURVEY_NAMED_MORTALS_CAP` | 4 | Survey prose | max named mortals listed in `{namedMortalsList}` |
| `SURVEY_LOCATIONS_LISTED_CAP` | 3 | Survey prose | max named locations in `{locationsByPresence}` |
| `SURVEY_FACTION_PRESENCE_MIN` | 1 | Survey prose | min faction members on hex for inclusion in `{factionPresenceLine}` |
| `SURVEY_BOND_WEIGHT_FACTOR` | 2 | Survey prose ranking | multiplier on `bondTier` in mortal ranking score |
| `READ_CURRENTS_TOP_SPHERES_CAP` | 3 | Sphere Cartography prose | max spheres named in `{sphereCurrentsLine}` |
| `READ_CURRENTS_SPHERE_INTENSITY_MIN` | 0.1 | Sphere Cartography prose | min intensity for a sphere to be named (others read as "almost gone" only if just-above-zero — under this floor, omitted) |

No magic numbers in the Survey or read_currents prose templates. Reach / sphere / rarity literals remain non-constant (they're enums).

The Survey output's bucketed prose phrases (e.g., `populaceMoodPhrase` lookup) live in a **data table** (see §8.1), not as inline strings. The buckets themselves are tunable thresholds:

| Constant | Default | Used by |
|----------|--------:|---------|
| `POPULACE_MOOD_BUCKET_CALM_MAX` | 0.30 | mood phrase lookup — below this, "calm" bucket |
| `POPULACE_MOOD_BUCKET_RESTLESS_MAX` | 0.60 | between calm and this, "restless" bucket |
| `POPULACE_MOOD_BUCKET_AGITATED_MAX` | 0.85 | between restless and this, "agitated" bucket |
| (above 0.85) | — | "boiling" bucket (no constant, terminal bucket) |

## 7. Engine pillar

### 7.1 Revelation-resolver multi-layer widening

Current shape:

```ts
export const TEMPLATE_REVELATION_MAP: Readonly<Record<string, NarrativeLayer>> = {
  'hex.survey': 'land',
  // ...
};
```

New shape (backward compatible — existing entries unchanged):

```ts
export const TEMPLATE_REVELATION_MAP: Readonly<Record<string, NarrativeLayer | readonly NarrativeLayer[]>> = {
  'hex.survey': ['land', 'people'] as const, // multi-layer
  'hex.dowse_resources': 'land',             // unchanged
  'hex.read_currents': 'soul',               // unchanged (tier-2 promotion in templates file only)
  'hex.read_stones': 'ruins',                // unchanged
  'hex.whisper_intuition': 'ruins',          // unchanged
  // hex.sense_threads, hex.sense_leylines, hex.divine_populace, hex.scry_factions removed
};
```

The resolver function `resolveRevelation` is widened:

```ts
export function resolveRevelation(templateId: string, col: number, row: number): RevelationMutation[] {
  const target = TEMPLATE_REVELATION_MAP[templateId];
  if (!target) return [];
  const layers: readonly NarrativeLayer[] = Array.isArray(target) ? target : [target];
  return layers.map(layer => ({ col, row, layer, source: templateId }));
}
```

The emitter (`revelationEmitter.ts`) iterates the returned array and emits one `revelation` trace per layer (existing per-layer trace shape preserved).

### 7.2 Tick-loop integration

**No new tick phase.** The reveal path is invoked from `hexActionBridge` / action resolution on success, exactly as it is today. The multi-layer change is internal to `resolveRevelation`'s return value and the emitter's iteration.

### 7.3 Fail-soft posture (NFP #4)

| Failure surface | Behavior | Why |
|-----------------|----------|-----|
| Survey hits a hex with one or more layers genuinely missing data (e.g., no people) | Emit reveal for layers with data; other layers emit `revelation_partial_apply` trace with the missing layer; player chronicle band drops the missing-layer sentence | Don't crash; tell a smaller story |
| Template missing from `TEMPLATE_REVELATION_MAP` | Existing fall-through (returns empty array); no error | Default behavior preserved |
| Prose enrichment placeholder errors mid-render | Replace the placeholder with a short generic phrase (per §5.1 fail-soft table); emit `prose_enrichment_fallback` | Standard wiring-guide pattern |
| Hidden-site reveal fires on a Survey-revealed hex | Existing path unchanged (Survey is still on `HIDDEN_SITE_REVEAL_TEMPLATES`) | No regression |

### 7.4 Determinism (NFP #3)

No PRNG draws are introduced. Mortal-name ranking is deterministic on graph data; faction listing is deterministic on member count. Survey output is reproducible for a given hex state under a given seed.

### 7.5 Performance budget (NFP #7)

Survey now does ~2× the work of single-layer Survey (two `RevelationMutation` emissions per cast). The mortal-name ranking adds an O(*members on hex*) sort, capped at `SURVEY_NAMED_MORTALS_CAP`. Total: still O(small constant) per cast. Negligible at expected cast frequency (≤1/tick on average across all ascendants).

## 8. Content pillar — prose and data

### 8.1 Populace mood phrase lookup

New data table in `src/data/survey-prose-tables.ts` (new file) — bucketed prose, Threadbearer voice, no numbers, IPK-ready.

```ts
export const POPULACE_MOOD_PHRASES: Readonly<Record<MoodBucket, readonly string[]>> = {
  calm: [
    'the mortals go about their work with the rhythm of habit',
    'the days are unbroken; small mercies hold',
    'quiet houses, low fires, nothing yet asked of them',
  ],
  restless: [
    'they look over their shoulders more than they used to',
    'small quarrels surface and are not let go',
    'the children play closer to the doors',
  ],
  agitated: [
    'old grievances are spoken aloud in the squares',
    'the wells stay full; the talk does not',
    'the priests have lost the room',
  ],
  boiling: [
    'the streets remember the names of the dead and call for more',
    'every house holds either a weapon or a refusal to lift one',
    'the unrest has a face, and it is not the one anyone here wanted',
  ],
};
```

The cast picks one line via `prng.pick()` keyed on `(hexId, tick)` for determinism. (PRNG draw is permitted here because the resolver call is itself a deterministic seeded path — same hex, same tick, same line.)

### 8.2 Faction-presence phrasing

Faction-presence lines use a small grammar:

```
{factionName} {presenceVerb} the {locationDescriptor}
```

Where:
- `{presenceVerb}` ∈ `{ 'holds', 'watches from', 'walks among', 'has gone quiet in', 'still keeps' }` — picked by `prng.pick()` weighted on the faction's `reputationAlignment` toward the hex's biome.
- `{locationDescriptor}` ∈ `{ 'upper streets', 'marshes', 'high road', 'outer ring', 'old quarter' }` — picked by `prng.pick()` weighted on the dominant location subtypes on the hex.

The grammar is data, not code — lives in `survey-prose-tables.ts` so it's tunable without engine edits. Picks are seeded.

### 8.3 What we are NOT writing

- No numeric output on the player-facing band. *"3 factions, 247 inhabitants, mood 0.42"* is never produced.
- No per-faction stats sheet. Survey gives a *flavor* read, not a *quantitative* read. (For quantitative, the player has the codex view.)
- No layer named in the prose. The player does not read *"Land layer revealed."* They read the band; the layers are the engine substrate, hidden behind the prose surface.

## 9. UI pillar

### 9.1 Action drawer

The action drawer on a hex target should show **Survey** (always-on, free, core tray) and — when the verb has been unlocked or is at the appropriate tray-tier — **Sphere Cartography** (rarity 2). The three retired verbs disappear from the drawer entirely.

**Screenshot at closeout:** action drawer on a hex target showing 2 recon verbs (down from 6). Use `?view=game&seeded` at 1920×1080.

### 9.2 Revelation-log / chronicle surface

The existing `RevelationLogTab` (`src/components/Game/debug/RevelationLogTab.tsx`) shows revelation events. Multi-layer Survey now produces two entries per cast (one per layer). Acceptable; if it visually clutters, an optional grouping pass (one row per cast with layers as sub-rows) is a polish item — **not in scope for this issue**; logged in §15 as a polish deferral.

The player-facing chronicle band (the prose from §5.1) flows through the existing chronicle path (one chronicle entry per cast — not per layer). No UI change needed in chronicle rendering.

### 9.3 Codex (`?view=codex`)

The three retired verbs disappear from the codex catalog. The codex page count for the "hex / read" category drops from 6 to 2. Verify the catalog filter handles the deletion cleanly; if the codex displays a count, the count updates without code change.

### 9.4 Debug inspection

The DebugPanel's existing revelation-log surface gains no new fields. Multi-layer reveals show as multiple log entries (one per layer) under the existing rendering.

### 9.5 Screenshot evidence at closeout

The closing commit body or Linear completion comment must include:

1. **Action drawer at 1920×1080** showing 2 recon verbs on a hex target (Survey + Sphere Cartography). Use Playwright `preview_resize(1920, 1080)` → `preview_screenshot` for the DOM action drawer.
2. **A Survey cast result** — the chronicle band entry showing Threadbearer-voice prose, IPK keywords visible, no numbers. Playwright.
3. **Codex view** (`?view=codex`) showing the reduced hex/read template list (no `sense_threads`, `divine_populace`, `scry_factions`, `sense_leylines`). Playwright.
4. **Console output** captured via `mcp__playwright__browser_console_messages` (errors + warnings filter). Empty result acceptable; embed `(no errors or warnings)` in that case.
5. **`__DEBUG` state assertion** — query `window.__DEBUG.listActions()` to confirm the four retired template IDs no longer appear. Use `window.__DEBUG.fireAction('Survey', ...)` to verify a cast resolves successfully.

## 10. Wiring section

| Wiring point | How this issue connects |
|--------------|-------------------------|
| Orchestrator phase | None new — multi-layer reveal is internal to existing reveal path; `hexActionBridge` action resolution invokes `resolveRevelation` as today |
| Action drawer | `src/components/actions/*` — drawer reads `targetCategories: ['hex']`; three deletions naturally remove verbs from the drawer |
| Revelation pipeline | `revelationResolver.ts` widens return shape; `revelationEmitter.ts` iterates the array |
| Chronicle | Existing chronicle path uses `narrativeTemplates.success` enriched via `enrichProse()`; new placeholders described in §5.1 flow through the existing pipeline |
| Codex | `codexRegistry.ts` reflects retired templates automatically (it filters from `unified-action-templates.ts`) |
| Prose enrichment | New placeholders (`{namedMortalsList}`, `{populaceMoodPhrase}`, `{factionPresenceLine}`, `{locationsByPresence}`, `{largestSettlement}`, `{sphereCurrentsLine}`) registered in the enrichment resolver. Reference: `Docs/plans/2026-04-16-systemic-wiring-guide.md` Capability 1 |
| Player controls | Action drawer; no new hotkeys; no new modals |
| DebugPanel | RevelationLogTab unchanged; multi-layer reveals show as multiple entries |

**Update `Docs/plans/wiring-checklist.md`** if it lists "hex recon / revelation" as a wiring surface — add the multi-layer reveal pattern as a covered case.

**Update `Docs/plans/2026-04-16-systemic-wiring-guide.md`** if multi-layer revelation becomes a content-author-facing capability worth naming. Recommended: add a small note under Capability 1 (enrichment placeholders) that Survey now demonstrates the multi-layer prose pattern.

## 11. Traces (NFP #2)

No new trace types. The existing `RevelationTrace` gains one optional field:

```ts
// In src/types/trace.ts, RevelationTrace interface:
export interface RevelationTrace extends BaseTrace {
  readonly category: 'revelation';
  readonly templateId: string;
  readonly col: number;
  readonly row: number;
  readonly layer: NarrativeLayer;             // existing — for multi-layer reveals, set to primary layer
  readonly layers?: readonly NarrativeLayer[]; // new — full set when reveal is multi-layer
}
```

Backward compatibility: existing single-layer consumers reading `trace.layer` continue to work unchanged. New consumers can opt into `trace.layers` when they care about multi-layer reveals.

## 12. NFP compliance summary

| # | NFP | Status | Note |
|---|-----|--------|------|
| 1 | Tunability | PASS | 6 surface constants + 3 mood-bucket thresholds named in §6; prose tables are data, not code |
| 2 | Inspectability | PASS | `RevelationTrace` extended additively; multi-layer reveals visible in RevelationLogTab |
| 3 | Determinism | PASS | No new PRNG paths; prose `prng.pick()` is seeded on `(hexId, tick)` |
| 4 | Fail-soft | PASS | Per-verb fail-soft tables in §5; engine-level summary in §7.3 |
| 5 | Narrative over mechanical perfection | PASS | Prose surface is the load-bearing player-facing piece (§8); mortal-loop bridge wired (§3.2) |
| 6 | Additive over destructive | MIXED — see note | Engine widening is additive; template deletions are destructive but bounded (4 templates removed; test fixtures updated). Score: pass with explicit deletion list |
| 7 | Performance budget | PASS | Multi-layer reveal is O(small constant) per cast; mortal-ranking is O(*members on hex*) bounded by SURVEY_NAMED_MORTALS_CAP |

## 13. Done when

- [ ] `hex.survey` template updated: multi-layer revelation, `trayTier: 'core'`, prose enrichment placeholders per §5.1
- [ ] `hex.read_currents` template updated: `rarityTier: 2`, prose enrichment placeholder per §5.2, `trayTier: 'rare'` (or per the rarity-2 convention at execution time)
- [ ] `hex.sense_threads`, `hex.divine_populace`, `hex.scry_factions`, `hex.sense_leylines` removed from `unified-action-templates.ts`
- [ ] `TEMPLATE_REVELATION_MAP` updated: Survey multi-layer, retired templates removed
- [ ] `HIDDEN_SITE_REVEAL_TEMPLATES` updated: retired templates removed; Survey + `read_currents` retained
- [ ] `resolveRevelation` widened to handle array values
- [ ] `revelationEmitter` iterates multi-layer reveal output
- [ ] `RevelationTrace.layers?` field added (additive, optional)
- [ ] `src/data/survey-prose-tables.ts` authored per §8.1, §8.2
- [ ] Constants from §6 named in a tunable-constants module
- [ ] Survey enrichment placeholders (`{namedMortalsList}`, `{populaceMoodPhrase}`, `{factionPresenceLine}`, `{locationsByPresence}`, `{largestSettlement}`) registered with the prose enrichment resolver
- [ ] `read_currents` enrichment placeholder (`{sphereCurrentsLine}`) registered
- [ ] Tests: `unified-action-templates.test.ts` updated for the new catalog shape; `revelationResolver.test.ts` extended with multi-layer reveal case; tests asserting retired template existence removed
- [ ] `npx tsc --noEmit` clean
- [ ] `npm test` green
- [ ] 30-tick CLI smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) reaches tick 30, status shows non-zero agents, traces include revelation events
- [ ] Browser screenshots per §9.5 plus console output + `__DEBUG` state assertion
- [ ] `Fixes THR-398` in the closing commit body

## 14. Deferrals — separate Linear tickets

These were surfaced during this design pass but do **not** belong in THR-398's scope:

1. **Sub-row grouping in `RevelationLogTab`** for multi-layer reveals. Polish item; file when the multi-layer output is in-app and the visual debt is actually observed. Label `Deferral`, project Content Architecture.
2. **Unlock-gated tray-tier semantics for `trayTier: 'rare'`.** Currently any rarity-2 verb is visible to every ascendant; the unlock roadmap from THR-390 §5 will eventually gate visibility. When that ships, `read_currents` becomes a *progression* unlock rather than a *category* unlock. Not in scope here; tracked under THR-390's existing roadmap items.
3. **Sublocation-layer reveal verbs.** The original audit raised the question of whether sublocations need their own recon verbs (similar to the four named layers). Out of scope; flag if the player feedback indicates a gap.

## 15. Open verdicts for the user

These are *not* blocking — the plan ships the cleanest interpretation. The user can override on any of these before merge.

1. **Retire `hex.sense_threads` vs. rename and fold.** §3.3 chose retire. If you intended option B (rename and fold the soul-light reveal into Survey as a third layer), the executor should fold instead.
2. **Multi-layer Survey vs. tiered Survey.** This plan has Survey reveal land + people in one cast. An alternative is keeping Survey land-only and folding people into a *new* tier-1 verb ("Take the Measure" or similar). Cleaner separation but more drawer entries. Recommend multi-layer (this plan); revisit if play feedback wants separation.
3. **`hex.sense_leylines` retired vs. folded.** §5.3 retired. If you want the partial-leyline reveal as a tier-1 fold (cheaper than `read_currents`), the executor can fold it into Survey as a third layer at low confidence.

## 16. Coordination block

- **Suggested model:** `model:sonnet` — engine + content edits with judgment calls (multi-layer widening, prose-table authoring, three Vision interpretations). Not prose-heavy enough to warrant opus; not mechanical enough for haiku.
- **Parallel-safe with:** issues that don't touch `src/data/unified-action-templates.ts`, `src/engine/revelationResolver.ts`, `src/engine/revelationEmitter.ts`, or `src/components/Codex/codexRegistry.ts`.
- **Mutex with:** [THR-397](https://linear.app/threadbare/issue/THR-397) (rarity recurve, same templates file — must land first), [THR-399](https://linear.app/threadbare/issue/THR-399) (self-actions, same templates file), [THR-400](https://linear.app/threadbare/issue/THR-400) (faction actions, same templates file), [THR-401](https://linear.app/threadbare/issue/THR-401) (location actions, same templates file). **Order:** THR-397 → this issue → THR-399 → THR-400 → THR-401 (this issue is short — settles the recon shape before larger-content children land).
- **Codex review:** yes — three-pillar wiring (engine widening, prose surface, UI), trace shape change, four template deletions. PR-gated review action will pick this up.
- **Files to touch:** `src/data/unified-action-templates.ts`, `src/data/survey-prose-tables.ts` (new), `src/engine/revelationResolver.ts`, `src/engine/revelationEmitter.ts`, `src/types/trace.ts`, `src/components/Codex/codexRegistry.ts` (verify deletions render cleanly), enrichment placeholder registration (wherever placeholders are registered today — verify at execution time), `src/data/__tests__/unified-action-templates.test.ts`, `src/engine/__tests__/revelationResolver.test.ts`, `Docs/plans/wiring-checklist.md` (if it covers reveal surfacing), `Docs/plans/2026-04-16-systemic-wiring-guide.md` (one-line note under Capability 1 if multi-layer prose becomes a content-author-facing pattern).
- **Done when:** §13 checklist passes.

---

*Filed by Cowork, 2026-05-12. Child of [THR-390](https://linear.app/threadbare/issue/THR-390). Vision audit run inline (§3) — no separate audit doc this time because the issue was caught at "In Design" before the prior structural gaps could entrench.*
