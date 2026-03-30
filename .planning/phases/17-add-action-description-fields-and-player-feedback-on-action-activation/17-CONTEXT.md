# Phase 17: Add action description fields and player feedback on action activation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a dedicated `description` field to action templates with game-mechanical explanations, redesign the ActionCard to an MTG-style layout with art slot + spell name + technical description + flavor text, implement activation feedback (glow burst + audio + particle burst on hex map + consequence toast) for all action types. Card art generation is deferred to a separate phase.

</domain>

<decisions>
## Implementation Decisions

### Description content style
- Replace current action names (e.g. "Raise Force") with evocative spell-like names (Ars Magica style, e.g. "Call to Arms", "Bellum Fortis")
- Add new `description` field to templates — qualitative game-mechanical text, 2-3 sentences
- Description focuses purely on what the action does and its effects — no mention of prerequisites, cost, sphere, or reach (those are shown elsewhere on the card or pre-filtered)
- No exact numbers/percentages — qualitative only ("bolsters", "weakens", "amplified near fortifications")
- The existing `narrativeTemplates.initiation` text becomes flavor text (italic, dimmer) on the focused card — it is NOT replaced

### Card display layout — MTG classic structure
- **Focused card (280px):** Top: spell name + cost badge → art frame (landscape rectangle, placeholder for now) → type line (reach + CRUD type) → technical description text box (regular weight) → italic flavor text (existing narrative initiation) → stats row (risk/range)
- **Hand cards (100px) in fan:** Art-only + name overlay. All detail (description, cost, type line, flavor) only visible in focused view. Keeps the fan clean and visual.
- Card ratio stays 5:7 (current CARD_ASPECT = 7/5)
- Art frame is a placeholder rectangle (sphere-tinted gradient or generic sigil) until the card art generation phase

### Activation feedback — full parity across all action types
- Target actions get the same feedback treatment as divine interventions
- **Card animation:** Sphere-colored glow burst expanding outward from the card, then card fades to spent opacity
- **Audio:** Same sphere-tuned tones from existing SPHERE_AUDIO_CONFIG — consistent sound language across all action types
- **Hex map particle burst:** Sphere-colored sparks/particle effect at the target hex when action fires. New WebGL particle system in HexMapV2. Reusable for future effects.
- **Timing:** Animation-first — glow burst plays (~600ms), then action resolves and consequence message appears. Matches existing DRAWER_CLOSE_DELAY_MS pattern.

### Feedback content
- **Toast notification:** Action outcome displayed as sphere-colored toast (same system as divine interventions)
- **Visual distinction:** Sphere color + outcome icon — success gets checkmark/glow, failure gets dimmed/cracked icon. Same text style, visual cue differentiates.
- **Message source:** Hybrid — new optional `consequenceMessage` field on templates. If present, use for toast. If absent, fall back to `narrativeTemplates.success/failure`. Allows selective customization without rewriting all 108+ templates.
- Consequence messages also continue to appear in narrative feed (dual output: toast + feed)

### Claude's Discretion
- Exact particle system implementation (Points vs Sprites, particle count, lifetime)
- Art placeholder design for cards (gradient, sigil, or simple sphere-color fill)
- Focused card height adjustment if needed to fit all content
- Spell name choices for all 108+ action templates (Ars Magica style, evocative, thematic per reach)
- Technical description text for all 108+ templates (qualitative, 2-3 sentences each)
- Exact toast duration and dismissal timing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Action templates & types
- `src/types/unifiedAction.ts` — UnifiedActionTemplate interface, ActionStep, all type definitions. New `description` field and `spellName` field go here.
- `src/data/unified-action-templates.ts` — Source of truth for all 108+ action templates. Migration functions. New fields added here.
- `src/data/action-template-content.ts` — 36 CRUD action templates (4 per reach x 9 reaches). ActionTemplateData type.

### Card UI
- `src/components/Game/ActionCard.tsx` — Current card component with hand/focused sizes, SIZE_CONFIG, glyph rendering, pulse animation, shake feedback.
- `src/components/Game/ActionDrawer.tsx` — Card container, fan layout, focus management. Manages card state transitions.

### Feedback systems
- `src/data/intervention-feedback-content.ts` — DIVINE_INFLUENCE_CONSTANTS (timing: CARD_PULSE_MS, CARD_SPENT_MS, DRAWER_CLOSE_DELAY_MS), CONSEQUENCE_TEMPLATES, SPHERE_AUDIO_CONFIG, getConsequenceMessage()
- `src/engine/ascendantFeedback.ts` — Intervention history tracking on ascendant node
- `src/components/Game/hooks/useInterventionAudio.ts` — Audio hook for sphere-tuned tones
- `src/components/Game/hooks/useAgentInteraction.ts` — Action execution flow, intervention dispatch
- `src/components/Game/ToastStack.tsx` — Toast notification display system

### Wheel slot pipeline
- `src/engine/wheel.ts` — WheelSlot interface (already has `description: string`), getAgentWheelSlots(), slot population
- `src/engine/targetActions.ts` — getTargetActionSlots(), populates description from narrativeTemplates.initiation

### HexMapV2 (for particle effects)
- `src/components/HexMapV2/` — Three.js hex renderer, scene layers, coordinate system

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `WheelSlot.description` field already exists and is rendered by ActionCard — can be repurposed or supplemented
- `SPHERE_AUDIO_CONFIG` in intervention-feedback-content.ts — reuse for target action audio
- `DIVINE_INFLUENCE_CONSTANTS` timing values (CARD_PULSE_MS=200, DRAWER_CLOSE_DELAY_MS=600) — extend to target actions
- `ToastStack.tsx` — existing toast system, extend for action consequence messages
- `useInterventionAudio` hook — extend to play for target_action type slots

### Established Patterns
- ActionCard SIZE_CONFIG pattern — add new layout sections within existing hand/focused config
- `narrativeTemplates` object pattern on templates — add `description` and optional `consequenceMessage` alongside
- Intervention feedback pipeline: handlePlayAction → pulse → audio → delay → resolve → toast → drawer close
- HexMapV2 scene layers use z-ordering (LAYER_Z constants) — particle effects need a z-layer

### Integration Points
- `migrateActionTemplate()` in unified-action-templates.ts — add description field in migration
- `migrateEncounterTemplate()` — same, for encounter-type templates
- `getTargetActionSlots()` in targetActions.ts — populate description from new field instead of initiation
- `useAgentInteraction` hook — extend action dispatch to trigger audio + particle + toast for target_actions
- HexMapV2 needs new scene layer or mesh for particle effects, triggered via a callback/event from action execution

</code_context>

<specifics>
## Specific Ideas

- Card layout modeled on Magic: The Gathering classic frame — name bar, art window, type line, text box with rules text + italic flavor text
- Spell names should feel like Ars Magica — evocative, slightly archaic, can mix Latin/English ("Call to Arms", "Bellum Fortis", "Whisper of Coin")
- Hand cards in the fan are art-only with name overlay — all detail appears when you focus/click a card
- Particle burst at target hex should be sphere-colored sparks — connects the card activation to the world visually

</specifics>

<deferred>
## Deferred Ideas

- **Card art generation** — Generate 108+ unique concept art images for action cards using image generation pipeline. Separate phase. This phase adds the art placeholder slot.
- **Custom consequence messages** — With the hybrid field pattern, a content phase could add hand-written consequenceMessage strings for high-impact actions.

</deferred>

---

*Phase: 17-add-action-description-fields-and-player-feedback-on-action-activation*
*Context gathered: 2026-03-30*
