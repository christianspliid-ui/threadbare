# Action Catalog Technical Effects — authored `technicalEffect` + derived effect-source badge

**Date:** 2026-07-04 · **Author:** Cowork · **Linear:** THR-604 (sibling no-op issue: THR-605) · **Project:** Action System & Unlocks

## Problem

The action catalog (`public/action-catalog.html`, THR-519) shows each action's `description`, which is authored as atmospheric prose ("Breathes martial purpose into the walls…") and never states what mechanically changes. Two distinct causes, verified 2026-07-04:

1. **No emission path.** `scripts/generate-action-catalog.ts` serializes template metadata + `description` only. There is no single machine-readable "effect" field it could read — mechanical effects live in three places: template step GraphOps (`steps[].onSuccess`), id-keyed engine bridges (`hexActionBridge.ts` for all 33 `hex.*`, `engine/ruins/perceiveRelay.ts` for `divine.perceive.*`/`divine.relay.*`, `unifiedActionResolution.ts` special cases for `divine.self.*`, attachment-tier system for `artifact.enchant`, sustained control for `sub.sanctify*`), and controlSpec/aftermath configs.
2. **Six genuine no-ops.** `artifact.attune`, `artifact.nullify`, `artifact.curse`, `loc.fortify`, `sub.trap`, `sub.vision` have empty step ops AND no engine handling anywhere — they deduct essence and narrate, but change nothing. Their descriptions claim effects that do not exist. (Tracked separately in THR-605 — see Non-goals.)

## Decision

Add an authored, optional `technicalEffect` field to `UnifiedActionTemplate`; emit it in the catalog JSON together with a **derived** `effectSource` classification so authored claims are grounded against what is actually wired. Deriving effect text purely from GraphOps + three scattered bridges was considered and rejected as fragile (see companion brainstorm doc).

**User direction (2026-07-04, verbatim):** "descriptions and technical game effects are not the same. i want a technical game effect description for our game wiki (currently under construction)." So: `description` stays flavor prose for the in-game card; `technicalEffect` is a wiki-facing technical statement of what the action does mechanically. The consuming surfaces are the wiki pages (Design Reference Wiki catalog + Game Manual Wiki), **not** in-game player prose — the in-game register rules (no numbers, narrative voice) do not constrain this field.

## Engine pillar

No tick-loop, resolution, or graph change. One additive engine artifact:

- **`src/engine/engineEffectRegistry.ts` (new, metadata-only):** exports `ENGINE_EFFECT_TEMPLATE_IDS: ReadonlySet<string>` assembled from the *existing* id-keyed maps (`HEX_ACTION_MUTATIONS`, `HEX_ACTION_GRAPH_OPS`, dynamic-generator map in `hexActionBridge.ts`; the perceive/relay id list in `engine/ruins/`; the `divine.self.*` list in `unifiedActionResolution.ts`; `ENCHANT_TEMPLATE_ID`). No new node types, no new edge types, no runtime behavior — it is a build-time/inspection surface. Existing modules export their id lists (additive named exports); the registry imports them so there is exactly one place the generator asks "does the engine implement this id?".
- **`effectSource` derivation (in the generator, pure function):** `template-ops` (any step has non-empty `onSuccess`/`onFailure`, including branch variants) → `control-spec` (`controlSpec` present) → `engine-bridge` (id ∈ `ENGINE_EFFECT_TEMPLATE_IDS`) → `aftermath-only` (`aftermathConfig`/`secretDiscovery`/`revelationAction` present) → `none`. First match wins; a template may match several — precedence order is a display choice, not a semantic claim.

## Content pillar

- **New field** on `UnifiedActionTemplate`: `readonly technicalEffect?: string;` — 1–3 sentences of technical game-mechanical language in UL terms. It must name: (a) the state that changes (node property, edge, condition, resource, visibility), (b) the direction/nature of the change, (c) duration/persistence when relevant ("Sets the hex's fertility state to blessed; settlements on the hex accrue prosperity faster while it persists. Sustained — costs essence per tick until released."). **Magnitudes stay symbolic** (name the constant or say "scales with X"), never literal numbers — constants are tunable (NFP #1) and hardcoded values in authored text = guaranteed drift.
- **Backfill:** author `technicalEffect` for all catalog-visible templates (164 entries currently), **sourced from the resolving code, not from the flavor description** — the author reads the template's GraphOps or the engine bridge that implements the id before writing (Debugging Protocol: verify the noun). For the six no-op templates the text states the *intended* effect and the `none` badge marks it unimplemented — text and badge together are honest.
- **No UL shard change:** "Effect" is a plain-English catalog label, not a new game concept. No rulebook impact — no rule of play changes; this documents existing rules.

## UI pillar

- **Catalog page (`public/action-catalog.html`):** each entry gains an "Effect" line rendering `technicalEffect`, plus a small source badge: `wired · template` / `wired · engine` / `sustained` / `aftermath` / `not wired`. Missing `technicalEffect` renders an em-dash + `unauthored` badge — visible gap, no crash. Summary header gains counts by `effectSource` (drift dashboard for free).
- **Game Manual Wiki:** `public/divine-actions-reference.html` (THR-589, shipped) and future Manual pages can consume the same generated JSON for per-action effect text — note added to the wiki page's source spine; no Manual page rewrite in this ticket. When a Manual page does consume `technicalEffect`, the text belongs in the **Designer Notes layer**, not the player-manual prose layer, per the Manual's two-register rule (`Docs/plans/2026-07-03-game-manual-wiki.md`).
- **In-game Codex: explicitly out of scope.** The technical register is a wiki reader's register, not the in-game player's — surfacing it in-game would violate the prose-first UI direction. If the Codex ever wants effect text, that is a separate design with its own register decision.
- **Verification artifact:** Playwright (`preview_resize(1920,1080)` → screenshot) of `action-catalog.html` — DOM surface, Playwright suffices; no WebGL involved. Console capture per Definition of Done.

## Wiring

| Surface | Wiring |
|---|---|
| Generator | `generate-action-catalog.ts` reads `technicalEffect` + derives `effectSource`; already prebuild-wired (`npm run build`) |
| JSON schema | `SCHEMA_VERSION` bump 1 → 2; new `technicalEffect: string \| null`, `effectSource: string` per entry; `totals.byEffectSource` |
| Catalog HTML | fetches sibling JSON at runtime (existing pattern) — renders new fields |
| Game Manual Wiki | consumes the same generated JSON when Manual pages need per-action effect text (consumer note, no page rewrite here) |
| Engine registry | imported by the generator only; unit test asserts every id in the registry exists in `UNIFIED_ACTION_TEMPLATES` |
| Wiki freshness | `public/wiki-manifest.json` sources already glob the template files — no manifest change needed; confirm at implementation |

## Constants

No numeric tunables. Named string constants: `EFFECT_SOURCES` (`'template-ops' | 'control-spec' | 'engine-bridge' | 'aftermath-only' | 'none'`) and badge label map in the catalog HTML — both named, single-sourced in the generator module (NFP #1 satisfied vacuously for numbers).

## Tracing

Build-time only; no runtime traces emitted or needed (NFP #2 served by the catalog itself becoming the inspection surface). No new trace types — stated explicitly rather than omitted.

## Fail-soft

| Failure | Behavior |
|---|---|
| `technicalEffect` missing on a template | JSON emits `null`; HTML renders "—" + `unauthored` badge |
| Registry id not found in template list | Generator `console.warn`, entry skipped from registry set; build does not fail |
| A bridge module adds an id-keyed effect without exporting it | Template shows `none` badge — visible drift, self-correcting pressure; audit note in catalog header |
| Old JSON (schema 1) cached against new HTML | HTML guards on `schemaVersion`, renders legacy view without Effect line |

## Blast Radius

- **`src/types/unifiedAction.ts` — 278 importers.** Change is one additive optional readonly field on `UnifiedActionTemplate`. No signature, union, or required-field changes; zero forced ripple. Risk: none beyond recompile.
- No other ≥100-importer file is touched (`hexActionBridge.ts`, generator, HTML, codex component are all low-importer).

## Non-goals

- **Implementing the six no-op actions** — separate issue (same project), needs its own effect design (graph ops/edges per the load-bearing "relationships are edges" rule). This plan only makes the gap visible.
- Rewriting `description` prose, ActionCard/tray layout changes, in-game Codex display, deriving effect text automatically from GraphOps, encounter-template (non-ascendant) coverage.

## Kill criteria

- If backfilled `technicalEffect` text drifts back into flavor prose (spot-check at review: any entry failing "states a world-state consequence in technical terms" test), the field has failed its purpose — revert emission and rethink as structured effect metadata instead of free text.
- If the `effectSource` derivation misclassifies more than 5 known-wired templates at implementation time, the registry approach is wrong — stop and redesign before backfill.

## NFP Compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — no magic numbers introduced; enums named |
| 2 Inspectability | PASS — effectSource turns hidden wiring into a visible, audited surface |
| 3 Determinism | PASS — generator output deterministic, sorted, no timestamps (existing pattern kept) |
| 4 Fail-soft | PASS — table above; generator never throws on missing data |
| 5 Narrative first | PASS — technical register confined to wiki surfaces; in-game prose untouched (Codex explicitly out of scope) |
| 6 Additive | PASS — optional field, additive exports, schema version bump |
| 7 Performance | PASS — build-time work only |

## Forked-audit verdicts

Run 2026-07-04 (three parallel subagents) after intent-judge **Allow** (Reversible class confirmed; kill criteria ported into this doc per judge note).

- **NFP audit: PASS.** All 7 NFPs verified against source (generator determinism confirmed at `generate-action-catalog.ts`; `effectSource` inputs are real template fields; 164-entry count matches generated JSON). Noted: `HEX_ACTION_MUTATIONS`/`HEX_ACTION_GRAPH_OPS` are currently module-private — the additive named exports in the Engine pillar are required, not optional. Nit acknowledged: `effectSource` precedence is presentational (already stated in-plan).
- **Three-pillar audit: PASS.** Engine/Content/UI/Wiring all present; browser-verify tool (Playwright, DOM rationale) named per Definition of Done. Fixed at audit: removed a stale Codex clause from §Tracing.
- **Vision audit: PASS.** No conflict with prose-first UI, player-as-god, or narrative-first; rulebook-impact claim verified by grep (no rules of play touched). Fixed at audit: Manual-consumer note now pins `technicalEffect` to the Designer Notes register layer.
