# Encounter Foreshadowing — Plan

**Date:** 2026-05-09
**Status:** Implementation Planning → Ready for Dev (CC, sonnet)
**Pillars touched:** Engine, Content, UI
**Author:** Cowork

## Problem

When the player inspects an agent in the profile panel, they can see which encounter the agent is currently moving toward (the underlined entry under `ENCOUNTER POOL`). Today that surface shows raw template metadata — `encounter.plague_outbreak`, funnel scores, travel cost — but communicates *nothing* about why the agent is going there or what they imagine will happen.

The player wants to read the agent's mind. They are a god. They should see what the mortal believes, what the mortal hopes, what the mortal misjudges. That reading is the core experience of Threadbearer's portfolio loop: scan threads, find the one straining toward something, dwell on it, decide whether to intervene.

Today the underlined encounter is a number. We need it to be a small, compelling passage of prose that foreshadows the encounter without spoiling it.

## Goals

- Click an encounter in the agent profile panel → expand a 2–4 sentence passage of foreshadowing prose.
- The passage reads as the agent's interior thinking — what they have heard, what they want, what they expect.
- The passage uses the agent's own (possibly wrong) intelligence about the encounter, creating dramatic irony when the agent is mistaken.
- The passage is generated systemically via the existing graph-walking prose pipeline. No LLM at runtime. Determinism is preserved.
- A "your last whisper nudged this" callout surfaces when the player's recent divine intervention contributed to the agent's choice.

## Non-goals

- This is not encounter resolution prose. The encounter prose plays out *during* resolution; foreshadowing plays out *before*.
- Not LLM-generated at runtime (NFP #3, determinism).
- Not a tooltip — long prose deserves a real reading surface (tooltips are awkward for screen readers, TTS, and longer passages).
- Not omniscient narration. The agent's voice is the point.
- Not bonded-agent-only / ascendant-resonance coloring. Deferred — see "Future work" below.

## Resolved questions

| # | Question | Resolution |
|---|---|---|
| 1 | Author variants for all encounter templates up front, or ship engine + UI with generic fallback and backfill? | Ship engine + UI with generic fallback. Backfill encounter-specific variants in follow-up tickets, prioritized by which encounters appear most in pools. |
| 2 | Re-resolve when agent's intelligence about the encounter changes mid-journey? | Yes. Cache key includes `agentIntelligenceVersion` for that encounter; bumping the version invalidates the cached prose. |
| 3 | Player-bonded-agent ascendant resonance variant? | Deferred. Will be exposed later via a dedicated ascendant action that *changes* what the agent foreshadows (e.g., a divine whisper that plants a different motivation). |
| 4 | "Your recent whisper nudged this" callout? | Yes. When a divine intervention from the player is among the causal contributions to the agent's encounter choice, render an attribution chip above the foreshadowing prose. |

---

## Engine pillar

### Resolver: `getEncounterForeshadowing`

New module: `src/engine/foreshadowing/getEncounterForeshadowing.ts`

```ts
function getEncounterForeshadowing(
  state: GameState,
  agentId: string,
  encounterId: string
): ForeshadowingResult
```

**Inputs (read-only graph access):**

- Agent node — name, traits, top capability domain, dominant reach
- Agent's `intelligence` edge to the encounter — tier, contents, last-updated tick
- Active threads on the agent (heart, iron, veil, stone, shadow, gold, eye, star, life — i.e., the nine reaches in their thread form)
- Reputation edges into the encounter's location and faction
- Hidden marks on the agent that the agent *is aware of* (filtered via `mark.knownToHolder === true`)
- Encounter pool funnel scores for this `(agentId, encounterId)` pair — the top non-zero score is the dominant motive signal
- Encounter template — heading, scale, foreshadowing variants, fallback string
- Recent divine interventions from the player on this agent within `INTERVENTION_ATTRIBUTION_WINDOW` ticks, filtered to those whose semantic target overlaps with this encounter

**Output:**

```ts
type ForeshadowingResult = {
  prose: string;                 // 2–4 sentences, enriched
  variantId: string | null;      // which variant matched, or null = fallback
  signals: {
    intelligenceTier: 'unknown' | 'rumor' | 'briefed' | 'expert';
    topMotive: 'awareness' | 'visibility' | 'prereqs' | 'threat' | 'capability' | 'cooldown';
    dominantReach: ReachId;
  };
  interventionAttribution: {
    interventionId: string;
    interventionKind: 'whisper' | 'nudge' | 'vision' | 'omen' | 'affliction' | 'bless';
    tickPerformed: number;
    summary: string;             // one-line "you whispered of fever, three days ago"
  } | null;
  resolvedAtTick: number;        // for cache freshness
};
```

### Variant selection

Each `EncounterTemplate.foreshadowing.variants[]` declares a `when` predicate. Selection algorithm:

1. Compute signals (intelligence tier, top motive, dominant reach).
2. Filter variants where every `when` clause is satisfied.
3. If multiple match, score by specificity (number of `when` clauses) — more specific wins.
4. Tie-break with seeded PRNG (NFP #3) using key `${agentId}-${encounterId}-${resolvedAtTick}`.
5. If zero match, use `foreshadowing.fallback`.
6. If no `foreshadowing` field on the template, fall through to the global generic fallback (see Content pillar).

### Caching

A new `ForeshadowingCache` lives on the per-session `SimulationRuntime` (per the load-bearing decision that engine caches must be session-scoped, not module-scope).

Cache key: `${agentId}|${encounterId}|${agentIntelligenceVersionForEncounter}|${interventionAttributionVersion}`

`agentIntelligenceVersionForEncounter` is bumped by tick phases that update an agent's intelligence about a specific encounter (rumor propagation, scouting, exposition events).

`interventionAttributionVersion` is bumped when a player intervention is applied to an agent that overlaps with one of the agent's viable encounters.

Cache is read on click, written after resolution. Manually evicted on `touchStructure()`.

### Tracing (NFP #2)

New trace category in `traceBuffer.ts`: `foreshadowing`.

```ts
type ForeshadowingResolutionTrace = {
  category: 'foreshadowing';
  tick: number;
  agentId: string;
  encounterId: string;
  variantsConsidered: string[];   // all variant IDs that passed filtering
  variantPicked: string | null;
  signals: ForeshadowingResult['signals'];
  interventionAttributionId: string | null;
  cacheHit: boolean;
};
```

Traces are emitted on every resolver invocation (cache hit and cache miss). DebugPanel exposes them under a new `Foreshadowing` tab keyed off the currently-selected agent.

### PRNG

Variant tie-break uses the existing seeded PRNG (`createPRNG(seedSalt)`) with salt `foreshadow:${agentId}:${encounterId}:${resolvedAtTick}`. Same agent + same encounter + same tick = same variant. Re-resolves on intelligence-version bump because the salt changes only when the tick changes (so an intelligence change at tick T does NOT alter the salt — the cache invalidation already forces re-selection, and a new variant may now satisfy the filter).

### Constants (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `FORESHADOWING_MAX_SENTENCES` | 4 | Authoring upper bound; resolver truncates if exceeded |
| `FORESHADOWING_MIN_SENTENCES` | 2 | Authoring lower bound; warns at content-validation time |
| `INTEL_TIER_UNKNOWN_BELOW` | 10 | Agent intelligence score threshold for `unknown` tier |
| `INTEL_TIER_RUMOR_BELOW` | 30 | Threshold for `rumor` tier |
| `INTEL_TIER_BRIEFED_BELOW` | 70 | Threshold for `briefed` tier (>= → `expert`) |
| `INTERVENTION_ATTRIBUTION_WINDOW` | 12 ticks | Look-back window for attributing player interventions to an encounter choice |
| `FORESHADOWING_CACHE_MAX_ENTRIES` | 256 | LRU cap on the per-session cache |

All in a new `src/engine/foreshadowing/constants.ts`.

### Fail-soft (NFP #4)

| Failure case | Fallback |
|---|---|
| Encounter template has no `foreshadowing` field | Use global generic fallback string with `{name.first}` and `{encounter.heading}` only |
| `foreshadowing.variants` is non-empty but none match `when` predicates | Use `foreshadowing.fallback` string |
| A variant template references a missing graph node or invalid placeholder | Skip variant (log to trace), try next variant; if all fail, fall through to fallback |
| Agent's intelligence node is missing | Treat as `intelligenceTier: 'unknown'` |
| Resolver throws | UI displays neutral "..." placeholder, error captured in `foreshadowing` trace with `cacheHit: false` and `variantPicked: null`. Tick loop unaffected — resolver only runs on click. |
| `enrichProse()` returns empty string | Fall through to next variant or fallback; never display empty |

---

## Content pillar

### `EncounterTemplate.foreshadowing` (new optional field)

```ts
type EncounterForeshadowing = {
  variants: ForeshadowingVariant[];
  fallback: string;   // used when no variant matches
};

type ForeshadowingVariant = {
  id: string;          // stable id for tracing/debug
  when: {
    intelligenceTier?: 'unknown' | 'rumor' | 'briefed' | 'expert' | Array<...>;
    topMotive?: ForeshadowingResult['signals']['topMotive'] | Array<...>;
    dominantReach?: ReachId | ReachId[];
    hasMark?: string;     // mark template id agent must hold (and know about)
    hasReputation?: { faction: string; min?: number; max?: number };
  };
  template: string;    // graph-walking template, run through enrichProse()
};
```

A variant matches when every defined `when` clause is satisfied. Empty `when: {}` is a wildcard.

### Global generic fallback (ships day one)

For templates that have not yet authored their own foreshadowing, a single global fallback string lives in `src/engine/foreshadowing/genericFallback.ts`:

> `"{name.first} has heard of trouble in {encounter.location_descriptor}. {pronoun.subject_capitalized} believes {pronoun.subject} can be useful there, though {pronoun.subject} cannot yet say how."`

Renders as: *"Kael has heard of trouble in the lowland villages. He believes he can be useful there, though he cannot yet say how."*

This is intentionally bland — its job is to be unobjectionable while encounter-specific variants are backfilled.

### Shared phrase tables in `prose-layer-content.ts`

New tables added:

- `INTELLIGENCE_HEDGES_BY_TIER` — phrase fragments like *"has heard travelers' rumors"*, *"has read the dispatches"*, *"has seen it with their own eyes"*
- `MOTIVE_FLAVOR_BY_REACH` — how a Wilderness agent describes a "capability" motive vs. how a Veil agent describes the same motive
- `INTERVENTION_ATTRIBUTION_PHRASES` — how to render the "you nudged this" prefix for each intervention kind

Encounter-specific variants use these tables via placeholders so that authoring stays focused on the encounter's distinctive details.

### Authoring guidance (added to `prose-content-systems` skill)

A new section in the skill: *Authoring Foreshadowing Variants*. Covers:

- 2–4 sentences. No more, no less.
- Use *thinks / believes / has heard* hedges when intelligence is `unknown` or `rumor` — preserves dramatic irony.
- Surface the agent's motivation in the agent's voice. Never reveal the encounter's true outcome.
- One concrete sensory detail per variant (a smell, a rumor, a memory, a fear).
- Match Threadbare voice — same quality bar as the meeting-encounter prose benchmark.
- Variants should differ meaningfully across signal axes (intelligence × top motive × dominant reach). If two variants read nearly the same, collapse them.

### Backfill order (post-launch follow-up tickets)

Author encounter-specific foreshadowing in this order, by frequency-in-pool:

1. `encounter.plague_outbreak`
2. `encounter.bandit_raid`
3. `encounter.guild_audition`
4. `encounter.shrine_pilgrimage`
5. `encounter.tavern_meeting`
6. (continue per content audit)

Each backfill ticket targets one encounter, authors 6–10 variants, and runs through the systems audit pass of the `template-encounter-rewrite` skill.

---

## UI pillar

### Clickable encounter row in the agent profile panel

The encounter pool list in the agent profile panel (the right-side panel showing `ENCOUNTER POOL` and the `Funnel: ...` block) becomes interactive:

- Each row is clickable and keyboard-focusable.
- Hover surfaces a subtle highlight + caret indicator (`▾`).
- Click toggles an inline expansion *below the row*. The prose appears inside the same panel; no modal, no second surface.
- The currently-targeted encounter (the underlined one — the encounter the agent is moving toward) is auto-promoted with a visible "Why is this happening?" prompt next to its row. Other viable encounters are clickable but not promoted.

### Expansion content

Visual layout, top to bottom:

1. *(Optional)* Intervention attribution chip — appears only when `interventionAttribution !== null`. Reads like *"Your whisper, three days past — the fever was your word."* Styled in a muted divine-intervention accent color.
2. The foreshadowing prose itself, in chronicle-style typography (same family as the chronicle panel, slightly smaller).
3. *(Dev-only)* Inspector chip — when `__DEBUG.openDebugPanel()` is open or `?debug` URL flag is set, show a small chip with `variant: <id> · tier: <tier> · motive: <motive>`.

### State management

- Expansion state is local UI state, scoped to the currently-open agent panel. Closes when the panel closes or the agent changes.
- Stored in component state via a `Map<encounterId, boolean>` — multiple encounters can be expanded simultaneously.
- Resolver call is fired on click, not on render — the panel does not pre-fetch foreshadowing for unclicked encounters.

### Accessibility

- Clickable rows are `role="button"` with `aria-expanded` and `aria-controls`.
- Enter and Space toggle expansion.
- Expanded prose is wrapped in a region with `aria-live="polite"` so screen readers announce the new content.
- Caret indicator rotates 90° on expansion (not just animated — the rotation is the affordance, not decoration).
- TTS-friendly: prose is plain text, no inline icons mid-sentence.

### Viewport contract

Honors 1920×1080. Expanded foreshadowing lives inside the panel's `flex-1 overflow-y-auto` region, so multiple expansions scroll within the panel rather than pushing layout. No element ever exceeds the panel's bounds.

### Debug bridge (additive)

```ts
window.__DEBUG.getForeshadowing(agentId: string, encounterId: string)
  → Promise<ForeshadowingResult>

window.__DEBUG.listForeshadowingTraces(agentId?: string)
  → Promise<ForeshadowingResolutionTrace[]>
```

Added to `src/debug-bridge.ts` and `src/debug-bridge.d.ts`.

---

## Wiring (per `Docs/plans/wiring-checklist.md`)

| Surface | Wiring point | New / Update |
|---|---|---|
| Engine resolver | `src/engine/foreshadowing/getEncounterForeshadowing.ts` | New module |
| Constants | `src/engine/foreshadowing/constants.ts` | New |
| Cache | `SimulationRuntime.foreshadowingCache` (per-session) | New on runtime |
| Trace category | `traceBuffer.ts` adds `foreshadowing` to `TRACE_CATEGORIES` | Update |
| Trace type | `src/types/traces.ts` adds `ForeshadowingResolutionTrace` | New type |
| Encounter template field | `src/types/encounters.ts` adds `EncounterTemplate.foreshadowing?` | Update |
| Phrase tables | `prose-layer-content.ts` — `INTELLIGENCE_HEDGES_BY_TIER`, `MOTIVE_FLAVOR_BY_REACH`, `INTERVENTION_ATTRIBUTION_PHRASES` | New tables |
| Generic fallback | `src/engine/foreshadowing/genericFallback.ts` | New |
| Intervention attribution | New helper `attributeRecentInterventions(state, agentId, encounterId)` in `src/engine/foreshadowing/` | New |
| UI — agent profile panel | `AgentProfilePanel` (or its encounter-pool subcomponent) — clickable rows, expansion state | Update |
| UI — chronicle styling | Reuse existing chronicle typography tokens | Reuse |
| Debug bridge | `src/debug-bridge.ts` adds `getForeshadowing` and `listForeshadowingTraces` | Update |
| DebugPanel tab | New `Foreshadowing` tab in DebugPanel showing traces for selected agent | Update |
| Content systems skill | `prose-content-systems` skill adds *Authoring Foreshadowing Variants* section | Skill update |
| Systemic wiring guide | `Docs/plans/2026-04-16-systemic-wiring-guide.md` adds new capability entry: "Foreshadowing — clickable agent intent prose" | Update |
| Wiring checklist | `Docs/plans/wiring-checklist.md` adds rows for foreshadowing resolver + UI | Update |

### Three-pillar check

- **Engine** ✅ Resolver, cache, trace, intervention attribution helper, constants
- **Content** ✅ New encounter-template field, generic fallback, shared phrase tables, authoring guidance
- **UI** ✅ Clickable rows, inline expansion, chronicle styling, debug inspector, intervention attribution chip
- **Wiring** ✅ Five doc updates, two debug-bridge entries, one DebugPanel tab

---

## Implementation phases

This is sized to fit a single CC (sonnet) issue. Suggested commit cadence:

### Phase 1 — Engine scaffolding (one commit)
- New constants file, types, module folder, generic fallback
- Resolver implementation that ONLY does the generic fallback path
- Cache class on `SimulationRuntime`
- Trace category + type
- Tests: unit tests for cache invalidation, fallback selection, intervention attribution helper

### Phase 2 — UI clickable expansion (one commit)
- Encounter row click handler + keyboard accessibility
- Inline expansion component
- Chronicle-style typography for prose block
- Intervention attribution chip
- Promoted "Why is this happening?" treatment for the targeted encounter
- DebugPanel `Foreshadowing` tab
- Debug bridge methods

### Phase 3 — Variant system + first encounter (one commit)
- `EncounterTemplate.foreshadowing` field + validation
- Variant selection algorithm with PRNG tie-break
- Phrase tables in `prose-layer-content.ts`
- Author 6 variants for `encounter.plague_outbreak` as the proof-of-concept content
- Tests: variant selection determinism, intelligence-tier hedging, signal-mismatch fallback path

### Phase 4 — Wiring docs (one commit, alongside any of 1–3)
- Update `wiring-checklist.md`
- Update systemic wiring guide
- Update `prose-content-systems` skill with authoring guidance
- Update `project-status.md`, `project-history.md`, `changelog.md`

### Verification (closing commit)
- `npm test` — all pass
- `npx tsc --noEmit` — clean
- `npx vite build` — succeeds
- Manual smoke: load `?view=game&seeded&size=medium`, click on Kael's encounter pool, expand foreshadowing for `plague_outbreak`, verify prose is intelligence-aware, verify intervention attribution works after a whisper.

---

## NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All thresholds and limits in `constants.ts`, named, defaulted |
| 2. Inspectability | PASS | Trace category emitted on every resolution; DebugPanel tab; `__DEBUG` bridge methods |
| 3. Determinism | PASS | Seeded PRNG for variant tie-break; cache key includes intelligence + intervention versions; no LLM at runtime |
| 4. Fail-soft | PASS | Fallback chain at every level; tick loop never invokes resolver, so a resolver crash cannot cascade |
| 5. Narrative over mechanical | PASS | This is the entire point of the system — surface mortal motivation as prose |
| 6. Additive | PASS | New optional `foreshadowing` field on `EncounterTemplate`, no migration of existing templates needed; generic fallback covers untouched encounters |
| 7. Performance | PASS | Resolver invoked only on click, results cached, no per-tick work |

---

## Future work / deferrals

These are *not* part of this ticket. Each gets its own Linear issue when picked up.

- **Per-encounter variant authoring** — backfill foreshadowing variants for high-frequency encounters (`bandit_raid`, `guild_audition`, etc.). Each is a separate content ticket, runnable in parallel by Codex once the engine ships.
- **Ascendant resonance variants** — when the player is bonded to the agent or has placed a known mark, foreshadowing colors differently. Per resolved Q3, this lives behind a future *ascendant action* that explicitly nudges the agent's foreshadowing rather than a passive bonded-agent reading. Issue to be opened when the ascendant action design is ready.
- **Foreshadowing for ad-hoc spawned encounters** — encounters created via debug spawn or world-event seeding may not have authored variants; ensure they use the generic fallback gracefully. Smoke-test in implementation; spin up a follow-up ticket only if gaps surface.
- **Foreshadowing analytics** — exposure of "which variants are most often picked, which never picked" as part of the encounter-log TSV exporter. Probably a `Deferral` ticket once we have shipped variants for ≥5 encounters.

---

## Coordination block

```
Suggested model: sonnet
Parallel-safe with: any UI-only work that does not touch AgentProfilePanel; any content-only work that does not touch prose-layer-content.ts
Mutex with: any other engine resolver work that touches SimulationRuntime cache slots; any change to traceBuffer TRACE_CATEGORIES; any change to EncounterTemplate type
```

Required matching label: `model:sonnet`.
