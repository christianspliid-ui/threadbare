# Chronicle Dual-Voice for Phased Events

**Linear:** THR-254 · **Project:** Social Systems Expansion · **Created:** 2026-04-24 · **Author:** Cowork

## Problem

Phased event activation shipped in THR-225 (`phaseComposition.ts`). Dual-voice Chronicle shipped in THR-155 (`poetProse` + `witnessFacts` on `ChronicleEntry`, rendered by `ChronicleEntryCard`). These two systems do not yet meet: every Chronicle entry produced by a phase activation is single-voice, hardcoded to `sphere: 'entropy'` and `mood: 'ominous'`, and uses `phase.rationale` as prose — never the authored story-beat template that the phase's `storyBeat.template` id points at.

Concretely: `src/data/story-beat-templates/chain-weakens.ts` authors five Chain Weakens beats with title + prose + sphere. Nothing in `src/engine/` ever imports that file. The five beats are dead content.

The fix is a single narrow wiring: the phase runner should look up the referenced template, populate dual-voice fields on the Chronicle entry, and respect an optional `voice` hint that tells the author (and future audits) which register the beat speaks in. This closes the wiring gap THR-225 deferred and unlocks THR-253's prose-polish pass.

## What "done" looks like

1. When phase `phase-2-plague` of `the-chain-weakens` activates at doom tier 2, the ChronicleEntry it emits contains the Poet voice text authored for `story-beat.chain-weakens-plague-bringer`, the Witness bullets authored for the same beat, the correct sphere, and a correct mood. No more "Plague-bringer materializes — the event becomes concrete." as the only visible prose (that string is `phase.rationale`, an author note).
2. A phase whose storyBeat points at an unknown template id does not crash — the entry falls back to the current rationale-as-prose behavior and a warning trace is emitted.
3. `PhaseStoryBeatSpec` in the Composition DSL gains an optional `voice: 'divine' | 'mortal'` field. The Chain Weakens recipe declares voice per phase. Schema parsing accepts both shapes (with and without the field).
4. All five Chain Weakens story-beat templates carry both `poetProse` and `witnessFacts` (dual-voice) plus a default `voice` hint. Existing single-`prose` shape still parses via migration shim.
5. The existing `ChronicleEntryCard` renders phase-triggered Chronicle entries in dual-voice without code changes.

## Load-bearing decisions

- **Divine voice ⇒ `poetProse`; Mortal voice ⇒ `witnessFacts`.** This is the convention that makes the THR-254 description ("populate `poetProse` (divine voice) and `witnessFacts` (mortal voice)") coherent with the THR-155 schema. The `voice` hint is a *lead* indicator: it tells the author which register the beat primarily speaks in. Both fields should be populated when the author can manage it; the hint does not exclude one voice.
- **Voice hint is phase-level, not template-level.** The same template could in principle be reused by a different composition with a different voice lead — unlikely in practice but the DSL stays the more expressive surface. Template files may carry a `defaultVoice` for authoring guidance; the phase-level hint wins.
- **The story-beat template registry is a static map** built at module load from per-composition maps. No dynamic import, no lazy lookup — phase activation runs in the hot tick path and must be synchronous O(1).
- **Missing-template is fail-soft.** Returns undefined, runner falls back to rationale prose plus a warning trace. Never throws.
- **Sphere field on the template is authoritative** over the previously hardcoded `'entropy'`. If the template omits sphere, runner falls back to `'entropy'` (current behavior preserved).
- **`'void'` is not a canonical sphere.** Chain Weakens templates currently stamp `sphere: 'void'`. We will map `void → entropy` when authoring the new dual-voice templates and tighten the `CompositionStoryBeatTemplate.sphere` type from `string` to `SphereName`. The recipe's `tags.sphere: ['void']` is a tag namespace (stays string, no change).

## Engine pillar

### Schema changes

`src/composition-dsl/schema.ts`:

```ts
export type PhaseStoryBeatVoice = 'divine' | 'mortal';

export interface PhaseStoryBeatSpec {
  tier: PhaseStoryBeatTier;
  template: string;
  priority?: PhasePriority;
  /**
   * Primary narrative register for the Chronicle entry.
   * 'divine'  → lead with Poet voice (poetProse field populated by template).
   * 'mortal'  → lead with Witness voice (witnessFacts field populated by template).
   * If omitted, runner uses template.defaultVoice, else 'divine'.
   */
  voice?: PhaseStoryBeatVoice;
}
```

Zod:

```ts
const phaseStoryBeatSpecSchema: z.ZodType<PhaseStoryBeatSpec> = z.object({
  tier: z.enum(['routine', 'notable', 'story_beat']),
  template: nonEmptyStringSchema,
  priority: z.enum(['template_intrinsic', 'doom_clock']).optional(),
  voice: z.enum(['divine', 'mortal']).optional(),
});
```

`src/data/story-beat-templates/chain-weakens.ts`:

```ts
export interface CompositionStoryBeatTemplate {
  id: string;
  title: string;
  /** Legacy single-voice prose. Migration shim: if poetProse/witnessFacts absent, runner treats this as witnessFacts[0]. */
  prose?: string;
  /** Poet voice — cosmic/emotional register. Divine-voice beats populate this. */
  poetProse?: string;
  /** Witness voice — factual bullets. Mortal-voice beats populate this. */
  witnessFacts?: string[];
  /** Default voice if PhaseStoryBeatSpec doesn't override. Author guidance only. */
  defaultVoice?: 'divine' | 'mortal';
  sphere: SphereName;
  /** Optional mood override; if omitted, runner uses 'ominous'. */
  mood?: string;
}
```

### Template registry

New file `src/data/story-beat-templates/index.ts`:

```ts
import type { CompositionStoryBeatTemplate } from './chain-weakens';
import { CHAIN_WEAKENS_STORY_BEAT_MAP } from './chain-weakens';
// Future: other composition maps merge here.

/**
 * Global story-beat template registry.
 * Keyed by canonical id (e.g. 'story-beat.chain-weakens-rumor').
 * Readers: phaseComposition.ts, content audits, codex builds.
 */
export const STORY_BEAT_TEMPLATE_REGISTRY: ReadonlyMap<string, CompositionStoryBeatTemplate> =
  new Map<string, CompositionStoryBeatTemplate>([
    ...CHAIN_WEAKENS_STORY_BEAT_MAP,
  ]);

export function lookupStoryBeatTemplate(
  id: string
): CompositionStoryBeatTemplate | undefined {
  return STORY_BEAT_TEMPLATE_REGISTRY.get(id);
}

export type { CompositionStoryBeatTemplate };
```

### Phase-runner wiring

`src/engine/phaseComposition.ts` — rewrite `makePhaseChronicleEntry` to consult the registry:

```ts
import { lookupStoryBeatTemplate } from '../data/story-beat-templates';
import type { SphereName } from '../types';

function makePhaseChronicleEntry(
  phase: Phase,
  compositionId: string,
  tick: number
): ChronicleEntry {
  const beat = phase.storyBeat;
  const template = beat ? lookupStoryBeatTemplate(beat.template) : undefined;

  // Fail-soft: no beat or template → current rationale-based fallback.
  if (!beat || !template) {
    if (beat && !template) {
      emitTrace({
        category: 'composition.story_beat_template_missing' as const,
        tick,
        summary: `story-beat template "${beat.template}" not in registry`,
        compositionId,
        phaseId: phase.id,
        templateId: beat.template,
      });
    }
    return {
      id: `composition_phase_${compositionId}_${phase.id}_${tick}`,
      tier: 'chronicle',
      title: `${compositionId} — ${phase.id}`,
      prose: phase.rationale ?? `Phase ${phase.id} activated`,
      promptContext: {
        actors: [],
        location: 'world',
        sphere: 'entropy',
        mood: 'ominous',
      },
      tick,
    };
  }

  const voice = beat.voice ?? template.defaultVoice ?? 'divine';
  const hasPoet = Boolean(template.poetProse);
  const hasWitness = Boolean(template.witnessFacts && template.witnessFacts.length > 0);

  // Migration shim: legacy single-prose becomes witness voice when no dual fields.
  const witnessFallback: string[] | undefined = !hasPoet && !hasWitness && template.prose
    ? [template.prose]
    : undefined;

  return {
    id: `composition_phase_${compositionId}_${phase.id}_${tick}`,
    tier: 'chronicle',
    title: template.title,
    // Keep legacy field populated for downstream readers that haven't migrated.
    prose: template.poetProse ?? (template.witnessFacts?.[0]) ?? template.prose ?? '',
    poetProse: template.poetProse,
    witnessFacts: template.witnessFacts ?? witnessFallback,
    promptContext: {
      actors: [],
      location: 'world',
      sphere: template.sphere,
      mood: template.mood ?? 'ominous',
    },
    tick,
  };
}
```

Note the `voice` is currently computed but only informs the extended trace (below). The Chronicle renderer uses *both* fields and the user-selected voice mode — it does not need a voice hint on the entry itself.

### Tracing

Add one new trace category, extend one existing.

**New:** `composition.story_beat_template_missing`

```ts
interface StoryBeatTemplateMissingTrace {
  category: 'composition.story_beat_template_missing';
  tick: number;
  summary: string;
  compositionId: string;
  phaseId: string;
  templateId: string;
}
```

Emitted at most once per missing lookup (no dedup needed; fires during activation only).

**Extend:** `composition.phase_activated` — add `voiceHint?: 'divine' | 'mortal'` and `templateResolved: boolean`.

```ts
// existing shape plus:
voiceHint?: 'divine' | 'mortal';
templateResolved: boolean;
```

This gives auditors a way to count dual-voice coverage per composition.

### Constants table

| Constant | Default | Purpose |
|---|---|---|
| `STORY_BEAT_DEFAULT_MOOD` | `'ominous'` | Fallback for `ChronicleEntry.promptContext.mood` when template omits one. Centralised to `src/data/composition-config.ts`. |
| `STORY_BEAT_DEFAULT_SPHERE` | `'entropy'` | Fallback sphere when template/phase cannot supply one (template-missing branch only; template itself is required to specify sphere). Co-located. |
| `STORY_BEAT_DEFAULT_VOICE` | `'divine'` | Fallback voice when neither phase nor template specifies one. Co-located. |

No new tuning dials introduced beyond naming the defaults. NFP #1 compliant.

### Fail-soft table

| Failure | Behavior |
|---|---|
| `phase.storyBeat` absent | No Chronicle entry produced. Runner continues. (Current behavior preserved.) |
| `phase.storyBeat.template` id not in registry | ChronicleEntry built from rationale fallback. Warning trace `composition.story_beat_template_missing`. No throw. |
| Template has `prose` only (legacy) | Runner populates `witnessFacts: [prose]` and leaves `poetProse` undefined. ChronicleEntryCard treats as witness-only. |
| Template has only `poetProse` | Runner populates `poetProse`; `witnessFacts` undefined. ChronicleEntryCard renders poet card only. |
| Template has only `witnessFacts` | Runner populates `witnessFacts`; `poetProse` undefined. ChronicleEntryCard renders witness card only. |
| Template has unknown sphere value (e.g. `'void'`) | TypeScript tightening catches this at compile time. At runtime (JSON-driven templates, future), falls back to `STORY_BEAT_DEFAULT_SPHERE`. |
| `voice` hint present but template authors only the opposite voice | No runtime error; ChronicleEntryCard renders whichever field is populated. Content audit can flag the mismatch as a lint. |

## Content pillar

### Chain Weakens dual-voice authoring

Rewrite `src/data/story-beat-templates/chain-weakens.ts` with the shape above and the voice allocation below. The convention: **divine voice = cosmic/poetic register, lead with the ascendant's perception; mortal voice = grounded bullets, what mortals are seeing/doing**.

Voice hint per phase (added to the recipe in `event-chain-weakens.recipe.ts`):

| Phase | Voice | Rationale |
|---|---|---|
| `phase-1-rumor` | divine | A disturbance in the weave, perceived by the ascendant before any mortal names it. |
| `phase-2-plague` | divine | The herald's arrival is a cosmic event — a being drawn across the chain. |
| `phase-3-absorbing` | mortal | The Shield-Anvil is a mortal champion answering an old oath. Ground-level action. |
| `phase-4-crack` | divine | Structural failure of cosmic scale. Felt in the bones by mortals; perceived by the ascendant. |
| `phase-5-reckoning` | mortal | Organised mortal response; the order naming what has happened and what to do about it. |

Proposed templates (intended quality is placeholder-plus — sufficient to render dual-voice; full polish is THR-253):

```ts
{
  id: 'story-beat.chain-weakens-rumor',
  title: 'The Chain Weakens — Whispers',
  poetProse:
    'A note in the weave goes slack. Not a sound, not yet — a looseness where a bond used to hold. The air in three settlements turns wrong before anyone remembers why.',
  witnessFacts: [
    'Rumors surface in settlements with no shared road.',
    'A warden\u2019s charm cracks in its stone box.',
    'No one yet says the word "chain." They think it.',
  ],
  defaultVoice: 'divine',
  sphere: 'entropy',
  mood: 'uneasy',
}
```

```ts
{
  id: 'story-beat.chain-weakens-plague-bringer',
  title: 'The Chain Weakens — The Herald Arrives',
  poetProse:
    'Something walks the night roads that is not of the night. Grass withers where it passes; the warden, old and certain, names it by the oldest name — plague-bringer — and the air admits the word.',
  witnessFacts: [
    'A lone figure sighted on three roads in one watch.',
    'Vegetation along the route dies in a precise band.',
    'Warden publicly names the threat: "plague-bringer."',
    'The rumor is no longer rumor.',
  ],
  defaultVoice: 'divine',
  sphere: 'entropy',
  mood: 'dread',
}
```

```ts
{
  id: 'story-beat.chain-weakens-shield-anvil',
  title: 'The Chain Weakens — A Counter-Force Rises',
  poetProse:
    'An oath older than most of the kingdoms wakes in one living throat. The Shield-Anvil begins — slowly, because absorption is always slow — to take the weight of what is coming.',
  witnessFacts: [
    'A champion of a forgotten order takes the field.',
    'They assume the Shield-Anvil burden: absorb the herald\u2019s harm into themselves.',
    'Local aid begins to organise behind them.',
    'The chain still weakens. There is now something between it and the world.',
  ],
  defaultVoice: 'mortal',
  sphere: 'order',
  mood: 'resolute',
}
```

```ts
{
  id: 'story-beat.chain-weakens-azath-cracks',
  title: 'The Chain Weakens — The Structure Cracks',
  poetProse:
    'A sound like a mountain\u2019s heartbeat, felt in the bones. The Azath glyph \u2014 the prison-sigil itself \u2014 fractures along a line no tool could have cut. Whatever was held within is no longer fully contained.',
  witnessFacts: [
    'The Azath glyph visibly cracks along a single line.',
    'Containment is no longer complete.',
    'Some of what was held inside is now out. Not all. Yet.',
    'This moment will not be undone.',
  ],
  defaultVoice: 'divine',
  sphere: 'entropy',
  mood: 'catastrophic',
}
```

```ts
{
  id: 'story-beat.chain-weakens-reckoning',
  title: 'The Chain Weakens — The Reckoning',
  poetProse:
    'The order has not looked away. They have watched the crack open and they remember what oath meant — before it meant nothing. They speak the name of what has happened, and in the speaking, begin.',
  witnessFacts: [
    'The divine-champion order witnesses the glyph-crack directly.',
    'They publicly name the event: "The Chain has broken."',
    'Mandates change; old doctrines wake.',
    'A reckoning has begun.',
  ],
  defaultVoice: 'mortal',
  sphere: 'order',
  mood: 'determined',
}
```

### Recipe edits

`src/composition-dsl/examples/event-chain-weakens.recipe.ts` — add `voice` to each `storyBeat` block:

```ts
storyBeat: {
  tier: 'notable',
  template: 'story-beat.chain-weakens-rumor',
  priority: 'doom_clock',
  voice: 'divine',   // NEW
},
// …repeat for each phase per the table above
```

### Exit criteria for content

- All five templates parse under the new type (no `string` widening on sphere).
- Every template has at least one of `poetProse` or `witnessFacts` populated.
- Voice in recipe matches `defaultVoice` in template (or deliberately overrides it — if it overrides, comment why).
- No template still sets `sphere: 'void'` — replace with `'entropy'`.

## UI pillar

### What already works (no component changes required)

- `ChronicleEntryCard` reads `poetProse` and `witnessFacts` off `ChronicleEntry` and renders the Poet voice in italic display serif + Witness voice as a bullet list, gated by the card's `voiceMode` prop.
- `ChroniclePanel` (assumed — exists per THR-155) provides the user toggle that sets `voiceMode`.
- Phase-activated entries flow through the same `state.chronicleEntries` array as any other Chronicle event, so they pick up the existing rendering, ordering, and voice toggle automatically.

### What to verify

1. Run `?view=game&seeded` and let the doom clock advance to tier ≥ 1 (or use `__DEBUG` to jump). Confirm the first Chain Weakens phase produces a Chronicle entry with visible Poet prose in italic serif + Witness bullets below.
2. Toggle voice mode: poet-only should hide the bullets; witness-only should hide the italic paragraph; interleaved should show both.
3. Take a screenshot at 1920×1080 showing the ChroniclePanel after phase-2 activation and attach to the PR — this is the visual regression gate.

### Debug inspection

`window.__DEBUG` does not currently expose a `getActiveCompositions()` or `advanceDoomClock()` helper. Authoring one is out of scope for THR-254 — but the existing `getHealthReport()` and debug trace buffer surface the new `composition.story_beat_template_missing` trace for post-hoc inspection. If CC hits friction testing without a debug hook, log a deferral issue.

### Hex map / other UI surfaces

No hex map signifiers for phased events in v1 — the Chronicle panel is the visible surface. A future ticket may add a doom-clock tier-advancement halo on the map; explicitly N/A here.

## Wiring checklist (per `Docs/plans/wiring-checklist.md` conventions)

| Surface | Status | Notes |
|---|---|---|
| Orchestrator phase | unchanged | `phaseComposition` runs in same slot (after phaseDoom, before phaseAttention). |
| GameState field | unchanged | Uses existing `chronicleEntries` array and `storyBeatQueue`. |
| Engine module | **modified** | `phaseComposition.ts` rewrites `makePhaseChronicleEntry`. |
| Content registry | **new** | `src/data/story-beat-templates/index.ts` aggregates per-composition maps. |
| Trace categories | **new** + **extended** | `composition.story_beat_template_missing`; `composition.phase_activated` gains `voiceHint`, `templateResolved`. |
| UI component | **verified** | `ChronicleEntryCard` already handles dual-voice (THR-155). Verify with snapshot test + manual check. |
| Player controls | unchanged | Voice toggle already exists on Chronicle panel. |
| Debug bridge | unchanged | Surfaces via existing traces; no new `window.__DEBUG` method. |
| Prose pipeline | N/A | Story-beat templates are static content, not `enrichProse()` targets. |
| Systemic wiring guide | **update** | `Docs/plans/2026-04-16-systemic-wiring-guide.md` — add a subsection on authoring phase story-beats with dual-voice. |

## Non-Functional Priorities — compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | Three named defaults (`STORY_BEAT_DEFAULT_MOOD`, `…SPHERE`, `…VOICE`) in `composition-config.ts`; no magic numbers. |
| 2. Inspectability | PASS | New trace + extended trace both carry composition id, phase id, template id, voice hint. |
| 3. Determinism | PASS | Registry lookup is pure. No PRNG touched. |
| 4. Fail-soft | PASS | Missing template → rationale fallback + warning trace. No throw path. |
| 5. Narrative over mechanical perfection | PASS | The change *is* narrative — upgrading phase Chronicle from placeholder to dual-voice cosmic/embodied split. |
| 6. Additive over destructive | PASS with note | `CompositionStoryBeatTemplate.sphere` type tightens `string → SphereName`. Only Chain Weakens templates exist today and all will be migrated in the same PR. New shape is a strict superset on all other fields. |
| 7. Performance budget | PASS | One `Map.get` per phase activation. Activation is rare (≤ one per phase per composition per game). No profiling concern. |

## Rejected approaches

- ❌ **Required `voice` on `PhaseStoryBeatSpec`.** Breaks existing recipes and composability. Additive over destructive (NFP #6).
- ❌ **Introduce a new `ChronicleVoice` enum as a first-class type.** The existing `poetProse` / `witnessFacts` + user-selected `voiceMode` already is the voice system. Adding a third axis duplicates state.
- ❌ **Lookup by composition id + phase id instead of template id.** Couples templates to a single composition forever. The template id indirection lets future compositions re-use beats.
- ❌ **Dynamic import of per-composition maps.** Phase activation runs inside the tick loop; adding async wait-for-import would introduce races and scheduling complexity for zero benefit — the template set is small and static.
- ❌ **Put voice on the template only, not the phase.** Then two different compositions reusing the same template couldn't differ in register. Keep the phase-level override.
- ❌ **Infer voice from composition.kind or doom-clock priority.** Two of the Chain Weakens phases want mortal voice despite being a doom event. Automatic inference is wrong on the only worked example we have.

## Test plan

Required additions (testing-patterns skill conventions):

1. **Schema roundtrip** — `src/composition-dsl/__tests__/schema.test.ts` (or nearest): parse a `PhaseStoryBeatSpec` with and without `voice`; reject an invalid voice string.
2. **Registry lookup** — `src/data/story-beat-templates/__tests__/index.test.ts`: every id in `CHAIN_WEAKENS_STORY_BEAT_MAP` is reachable via `lookupStoryBeatTemplate`; unknown id returns `undefined`.
3. **Runner wiring** — extend `src/engine/__tests__/phaseComposition.test.ts` (or the chainWeakens test):
   - Phase activation with a known template produces ChronicleEntry with `poetProse` and `witnessFacts` populated from the template.
   - Phase activation with an unknown template id produces ChronicleEntry with rationale-as-prose and emits `composition.story_beat_template_missing` trace.
   - Template with legacy `prose` only populates `witnessFacts: [prose]` via the migration shim.
4. **Card snapshot** — `src/components/Game/__tests__/ChronicleEntryCard.test.tsx`: render a phase-triggered entry with both voices in `interleaved` mode; assert both italic paragraph and bullet list present.
5. **Integration** — the existing `phaseComposition.chainWeakens.test.ts` gains assertions that ChronicleEntries for phases 1–5 have the voice-appropriate fields populated (divine phases have `poetProse`, mortal phases have populated `witnessFacts` with multiple bullets).

Total new/modified tests: ~8–10. All fast unit tests, no e2e.

Pre-commit per CLAUDE.md §Testing: `npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process`.

## Acceptance criteria

- [ ] `PhaseStoryBeatSpec.voice` added to DSL schema + Zod; optional; both shapes parse.
- [ ] `CompositionStoryBeatTemplate` shape extended with `poetProse`, `witnessFacts`, `defaultVoice`, optional `mood`; `sphere` tightened to `SphereName`; `prose` becomes optional.
- [ ] `src/data/story-beat-templates/index.ts` created with `STORY_BEAT_TEMPLATE_REGISTRY` and `lookupStoryBeatTemplate`.
- [ ] `makePhaseChronicleEntry` in `phaseComposition.ts` consults the registry, populates dual-voice fields, and uses template sphere/mood.
- [ ] Missing-template fail-soft path emits `composition.story_beat_template_missing` trace and falls back to rationale.
- [ ] `composition.phase_activated` trace gains `voiceHint` and `templateResolved` fields.
- [ ] All five Chain Weakens templates migrated to dual-voice with `defaultVoice` set, sphere moved `void → entropy`, mood assigned.
- [ ] All five phases in `event-chain-weakens.recipe.ts` declare `voice` per the voice allocation table.
- [ ] `STORY_BEAT_DEFAULT_MOOD` / `…SPHERE` / `…VOICE` added to `src/data/composition-config.ts`.
- [ ] Tests listed above ship green; coverage for runner wiring ≥ 1 dual-voice + 1 missing-template + 1 legacy-shim path.
- [ ] `Docs/plans/2026-04-16-systemic-wiring-guide.md` gains a "Phase story-beats" subsection describing authoring with dual-voice.
- [ ] Manual verify: `?view=game&seeded`, advance doom, screenshot Chronicle at 1920×1080 showing dual-voice entry. Attach to PR.
- [ ] Pre-commit: `npm test` green, `npx tsc --noEmit` clean, `npx vite build` succeeds.
- [ ] Commit message body contains `Fixes THR-254`.
- [ ] THR-253 (prose polish) remains open and is correctly positioned: the templates now have authored-to-bar dual-voice placeholders; THR-253 is now a polish pass rather than an authoring pass.

## Out of scope (explicit)

- THR-253 prose polish pass — separate ticket, can ship after.
- Additional compositions (Winnowing of Luck, other doom events) — out of scope. Registry is designed to absorb them when they exist; only Chain Weakens ships here.
- Hex map signifier for phase activation — out of scope; Chronicle is the visible surface.
- `__DEBUG` bridge helper for forcing doom-clock advancement — out of scope; log a deferral if CC hits friction.
- Content skill updates to the `prose-content-systems` or `encounter-pipeline` authoring guides for phase story-beats beyond the one-paragraph systemic-wiring-guide addition — a more thorough authoring skill pass is a separate ticket if patterns emerge.
