# Action Unlock Reveal + Artifact Representation Pattern

**Date:** 2026-07-05
**Status:** Ready for Dev
**Linear:** THR-639 (implementation slice) · related: THR-637 (Entity Visual Header), THR-638 (art batch)
**Author:** Cowork (design), from Christian's directive 2026-07-05 (chat)

## Problem

When the game teaches the player a new action (the Ascendant Beat modals — e.g. the First Thread beat granting *Bind Thread — Agent* and *Observe*), the modal shows only a plain-text line: `You will learn: Bind Thread — Agent, Observe`. The player never sees the card they just received, its art, or what it does. The reveal of a new divine power — one of the most rewarding moments in a rogue-lite loop — currently reads like a changelog entry.

Root cause (verified in code): `AscendantBeatModal.tsx` resolves `grantsActionIds` only to `getUnifiedTemplateById(id)?.name`. The full template (art key, description, essence cost, target categories, effects ops) is available in the same data module but is not used. A fully reusable `ActionCard` component already exists (`src/components/Game/ActionCard.tsx`, `size: 'hand' | 'focused'`) with an `ACTION_ART` registry entry for every grantable core action.

## Decisions (settled with Christian, 2026-07-05 chat)

1. **Full card face.** Unlock moments render the real focused ActionCard face — art, name, type line, description, essence cost — the same card the player later sees in the Action Drawer. The unlock teaches recognition.
2. **Plain-prose effects line.** One plain-register sentence per action stating what it does, what it targets, and what it costs. No stat blocks, no chips. (Voice: plainspoken; interactive text always plain — THR-609.)
3. **Core UX pattern, codified.** This generalizes THR-637's Entity Visual Header ("every detail surface opens with its subject's image") to the **Artifact Representation Pattern**: *any surface that introduces, grants, or details a core game artifact shows (a) the artifact's canonical visual and (b) enough identity + player-relevant information to understand what it is and what it does.* One pattern, two obligations: art + information.

## Artifact Representation Pattern (core UX pattern)

**Statement.** When a core game artifact is the subject of a surface — introduced (onboarding, unlock, beat), granted (reward, aftermath), or detailed (profile, codex, panel) — the surface must render:

1. **Canonical visual** — the artifact's art via its registry/resolver (portrait, card art, concept art, sigil, or the styled fallback chain from THR-637). Never text-only.
2. **Identity block** — name + kind (type line) in the artifact's canonical presentation (an action looks like its card; an agent like their portrait header; a location like its hero landscape).
3. **Player-relevant information** — what this artifact means to the player right now, in plain prose (an action's effects line; an agent's disposition; a location's character). Derived from live data, composition-first with authored overrides.

**Canonical registry of core game artifacts** (from the 2026-07-05 sweep of `src/types/graph.ts`, UL shards, Codex registry, and IA surfaces — the definitional answer to "what qualifies as a game artifact"):

| Artifact | Canonical visual today | Info source |
|---|---|---|
| Agent (incl. The First, NPC roles) | archetype/bespoke portrait + silhouette fallback | AgentInfoCard prose, knowledge-gated |
| Ascendant | avatar portrait (compositor) | identity panel |
| Faction | glyph → styled fallback (THR-637); sigil art (THR-638) | EntityCard sections |
| Location / Hex | `pickConceptArt` 16:9 landscape | LocationView |
| Sublocation | parent-location inheritance → styled fallback | EntityCard |
| Action (divine / mortal / target-scoped) | `ACTION_ART` registry via ActionCard | template + effects line (this plan) |
| Encounter | stage illustration | EncounterChoiceCard / Chronicle |
| Thread | ThreadsPanel edge visual | thread state prose |
| Possession / Condition / Agreement | Codex glyph + tier | CodexCard technical effect |
| Artifact (legendary) | glyph → styled fallback (THR-637/638) | trait graph |
| Trait / Ambition / Relationship | inline only (no independent card yet — acceptable; they are facets of agents, not free-standing artifacts) | profile sections |
| Omen | OmenBar | clock prose |

**Where the pattern lives:** CC creates `Docs/design-system/artifact-representation.md` containing the pattern statement + this registry table (design-system docs are loaded by the `frontend-ui` skill, making the pattern binding for future UI work). THR-637's plan doc should reference it rather than restate it.

**Compliance rule for future designs:** any new surface whose subject is a registry row must state, in its plan doc's UI pillar, which visual + info source it uses. A surface that names an artifact in text only is a pattern violation, same severity as a viewport-contract violation.

## Implementation slice (THR-639): Action Unlock Reveal

### Engine pillar — N/A (with rationale)

Pure presentation. Templates are already resolved in-memory at modal render time; no graph mutation, no tick-phase change, no new node/edge types. No engine work. (One shared util is added under `src/data/`, not `src/engine/` — see Content pillar.)

### Content pillar

**New module: `src/data/actionEffectsProse.ts`**

- `actionEffectsProse(template: UnifiedActionTemplate): string` — returns the plain-prose effects line.
- Resolution order (composition-first, authored overrides — same shape as the Motive Receipt pattern, THR-631):
  1. `ACTION_EFFECTS_PROSE[template.id]` — authored override table.
  2. Composed fallback: assembled from `targetCategories`/`targetSubtypes` (what it touches), the dominant `onSuccess` op kind (what it does — e.g. `add_edge:thread` → "draws a thread to"), and `essenceCost` (what it costs), rendered as one sentence.
- **Authored overrides required at ship for every grantable action** — all spine + pool beat grants: `bind_thread_agent`, `observe_agent`, `bind_thread_location`, `action.imbue`, `divine.persuade`, `divine.dream`, `divine.omen`, `divine.inspire`, `action.consecrate`, `action.bestow`, `action.anoint`, and the divine-economy source verbs granted by investment pool beats (enumerate from `ascendant-beat-content.ts` at implementation time).
- Example (Bind Thread — Agent): *"Draws a thread of your attention to a mortal, opening your divine actions on them. Costs 10 essence."* — cost value interpolated from the template, never hardcoded.
- Voice: plainspoken Malazan baseline, no peak lyricism — these are interactive/instructional lines (THR-609). Second person addresses the god, not the mortal.

### UI pillar

**1. `ActionCard` focused face gains an effects line.**
Rendered below the description, above stats, styled as quiet UI text (distinct from flavor prose). Sourced from `actionEffectsProse()`. This means the Action Drawer's focused card gets the effects line too — one component, both surfaces, no divergence.

**2. `AscendantBeatModal` renders real cards.**
- New adapter `templateToPreviewSlot(template: UnifiedActionTemplate): WheelSlot` (display-only synthetic slot, state `available`) so `ActionCard` is reused unmodified in its prop contract (additive, NFP #6).
- The "You will learn:" strip is replaced by a horizontal row of focused-face ActionCards, one per `grantsActionIds` entry, scaled to fit (see constants). Beat 0 grants two actions → two cards side by side.
- Cards are non-interactive in the modal (no play affordance), but visually identical to the drawer's focused face.
- Selection beats (e.g. Beat 4, "A Path Opens") use the same card row for their choice presentation — the choice cards become real ActionCards.
- Modal must respect the viewport contract: `max-height: 85vh`, no scroll below fold at 1920×1080 with up to 3 cards.

**Debug inspection:** `window.__DEBUG` — existing beat state is inspectable; closeout asserts the rendered card count matches `grantsActionIds.length` for the pending beat via a DOM query + `__DEBUG` beat lookup.

**Event notification:** no change — `action.unlock.granted` already fires from `resolvePendingBeat`.

**HexMap presence:** N/A — modal-layer only.

### Wiring section

| Concern | Wiring |
|---|---|
| Orchestrator phase | none touched (presentation only) |
| UI component | `AscendantBeatModal` (already rendered in GameView JSX), `ActionCard` (already in ActionDrawer) |
| GameState flow | reads `getBeatDefinitionById(pending.beatId)?.grantsActionIds` → `getUnifiedTemplateById` → template; no new state fields. Note: reach-signature grants resolve dynamically (`resolveReachSignatureGrant`, THR-523) — confirm the card-render path for dynamically-resolved grant ids at implementation time; fail-soft row 1 covers unresolvable ids |
| Traces | none new; unlock event unchanged |
| Debug visibility | `__DEBUG` beat state + DOM assertion at closeout |
| Prose pipeline | effects lines are static template-derived strings; `enrichProse()` not applicable (no entity placeholders) — if an authored override ever needs `{name}`-style placeholders, route it through `enrichProse()` at that point |
| Player controls | none new; "Reach Down" CTA unchanged |

### Constants table (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `UNLOCK_CARD_SCALE` | 0.8 | Scale factor applied to the 400×560 focused face inside the beat modal |
| `UNLOCK_CARD_ROW_MAX` | 3 | Max cards per row before wrapping/scaling down |
| `UNLOCK_CARD_GAP_PX` | 24 | Gap between cards in the reveal row |
| `EFFECTS_LINE_MAX_CHARS` | 140 | Soft cap for authored effects lines (advisory lint in review, not runtime) |

### Tracing (NFP #2)

No new trace categories. The reveal is deterministic presentation of already-traced unlock grants (`action.unlock.granted`).

### Fail-soft table (NFP #4)

| Failure | Fallback |
|---|---|
| `getUnifiedTemplateById(id)` returns undefined | Render the current plain-text "You will learn: <id>" line for that entry; console.warn; never throw |
| No `ACTION_ART` entry for template id | ActionCard's existing gradient placeholder art |
| No authored effects override | Composed fallback sentence from template fields |
| Composed fallback cannot classify the op | Generic line: "A new power of the <reach> reach. Costs <essenceCost> essence." |
| >3 granted actions in one beat | Wrap to second row; modal scrolls internally within 85vh (never below fold) |

## NFP Compliance

| Priority | Verdict |
|---|---|
| 1 Tunability | PASS — layout + scale as named constants |
| 2 Inspectability | PASS — pure functions; effects line derivable from template id alone |
| 3 Determinism | PASS — same template → same card, same line |
| 4 Fail-soft | PASS — per-entry fallback to current text line; no throw path |
| 5 Narrative over mechanical | PASS — effects communicated as prose, not stat blocks |
| 6 Additive | PASS — ActionCard prop contract untouched (adapter); modal strip replaced in place |
| 7 Performance | PASS — static render at modal open; no per-tick cost |

## Three-pillar check

Engine: N/A with rationale (presentation-only). Content: effects-prose module + authored overrides. UI: modal card row + ActionCard effects line + pattern doc. Wiring: table above.

## Blast radius

No file with ≥100 importers is touched (`AscendantBeatModal.tsx`, `ActionCard.tsx`, new `actionEffectsProse.ts`, `ascendant-beat-content.ts` are all low-importer). Section omitted per rule — noted here only to record the check was run.

## Done-when

1. First Thread beat (`?view=game` fresh start, or `spawn`-equivalent dev path) shows two full ActionCard faces (Bind Thread — Agent, Observe) with art, cost, description, and a plain-prose effects line each.
2. Action Drawer focused card shows the same effects line for those actions.
3. All currently grantable actions have authored effects overrides; composed fallback covers the rest.
4. `Docs/design-system/artifact-representation.md` exists with the pattern + registry table.
5. Screenshot at 1920×1080 (Claude-in-Chrome; modal overlays the WebGL map) + console capture + `__DEBUG` beat assertion in the closing comment.
6. Viewport contract holds: no scroll below fold with 2 cards; internal scroll only at >3.

## Rulebook impact

None — no rule of play changes (unlock timing, grants, and costs unchanged; presentation only). Checked against `Docs/canon/rulebook-quick-reference.md`.

## Vision audit

No Vision premise contradicted. Reinforces prose-first UI (mechanics through prose) and the reveal-as-reward loop. The pattern doc strengthens, not alters, THR-637's premise.

## Forked-audit verdicts

- **Intent-judge (Opus): Allow.** All four asks delivered (card in modal, effects info, pattern codified, artifact sweep); both chat clarifications honored; no scope creep or silent drops.
- **NFP audit: PASS.** All 7 PASS claims substantiated against plan body and source; root-cause claim spot-verified in `AscendantBeatModal.tsx` / `ActionCard.tsx`. Advisory: `EFFECTS_LINE_MAX_CHARS` is a review-time convention, declared as such.
- **Three-pillar audit: PASS.** Engine N/A rationale verified in code (template resolved synchronously at render); content module + 11 override ids spot-checked as real; UI covers display/notification/debug/HexMap; wiring table complete. Two fixes applied inline: GameState-flow line corrected to `getBeatDefinitionById(pending.beatId)`, dynamic reach-signature grant note added.
- **Vision audit: PASS.** Prose-first, THR-609 register, god-addressed second person, reward-beat framing, THR-637 non-contradiction all confirmed. Advisory only: example effects line contains an interpolated numeral ("10 essence"), consistent with the card's existing cost display.
