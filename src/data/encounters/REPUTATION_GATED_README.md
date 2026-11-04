# Reputation-Gated Encounter Authoring Rubric

Six rules. Every template in this directory that gates on reputation must satisfy all six before it ships.

---

## Rule 1 — Every template declares at least one gate

Either `requiredTargetTraits` (player ActionDrawer gate), `encounterGates.blocks` on a reputation trait definition (agent pipeline block), or both.

No gated encounter leaves both mechanisms empty. If you're not sure which to use:
- **Required-positive**: use `requiredTargetTraits` + add to trait's `encounterGates.unlocks`
- **Blocked-by-negative**: add to trait's `encounterGates.blocks` (no `requiredTargetTraits` needed)
- **Required + blocked**: use both

Update `src/data/reputation-trait-content.ts` whenever you add a template.

---

## Rule 2 — Every template emits at least one `reputation_tally` aftermath effect

The gate must feed itself. A reputation-gated encounter that does not affect the tally it gates is a dead end.

```typescript
{ kind: 'reputation_tally', key: '<reach>.<polarity>', delta: 1 }
```

- **Reinforcing branch** (safe choice): `{ key: '<same-polarity>', delta: 1 }`
- **Contrary branch** (dramatic choice): `{ key: '<opposite-polarity>', delta: 1 }` — optionally also `{ key: '<same-polarity>', delta: -1 }`
- **Failure**: no tally by default unless failure is *observed* (witnesses in support bundle)

---

## Rule 3 — Every template uses `{title}` at least once in prose

The player needs to feel the reputation working. The `{title}` placeholder resolves to the agent's highest-tier reputation trait name (e.g. "Feared Champion", "Beloved").

Use it in at least one of:
- The opening beat (`narrativeTemplate` of step 0 or `narrativeTemplates.initiation`)
- A step-1 arm's prose (what the mortal does once they have decided)
- A success outcome prose line

---

## Rule 3a — The mortal decides; the god argues (THR-2135, THR-2159)

The player never picks an ending (Christian, 2026-07-26). A reputation encounter does **not** offer step-0 cards whose ids are the aftermath variant keys — that is `authoredChoices`, and it is retired (THR-2161 deletes the field).

- Step 1 is an `ActionStepBranch` with `decidedBy`, in the THR-866 pattern (`apotheosis-ascension.ts`, engine `src/engine/encounters/branchDecision.ts`):
  - **Two endings → pole mode.** `decidedBy: { axis: '<ValuePair>' }`. Variants, `aftermathConfig.variants` and `stakes.arms` key `positive` / `negative`; the fallback (and the base stakes) is `positive`.
  - **Three endings → route mode.** `decidedBy: { routes: [{ key, reach, axis?, toward? }, …] }`, one distinct reach per route. Route keys are free strings, so the old variant keys can stay.
- Step 0 deals a composed hand: up to two `nudges` specials (each with a `poleLean` — an axis pole, or `{ route }` in route mode) plus `deal: { count, tags }`.
- Step-1 prose is voiced as the mortal acting ("The agent chose…"), never the god choosing for them.
- Record the axis (or routes) in the file header.

| Template | Mode | Axis / routes |
|---|---|---|
| `warlords-tribute` | route | accept (Heart, loyalty +) · oath (Iron, mercy −) · withdraw (Stone, courage −) |
| `shadow-court-audience` | pole | `honesty_cunning` — + present honestly · − veiled threat |
| `pilgrims-offering` | pole | `tradition_novelty` — + accept graciously · − bless them instead |
| `the-veiled-consultation` | route | plain (Eye, revelation +) · withhold (Shadow, honesty −) · refuse (Veil, revelation −) |
| `the-stones-judgement` | pole | `preservation_transformation` — + older claim · − transforming claim |
| `the-merchants-favor` | pole | `asceticism_extravagance` — + intercede · − mark the robbers |
| `the-oracle-consulted` | pole | `revelation_discretion` — + read openly · − riddle |

---

## Rule 4 — Every template declares `illustrationUrl` and `illustrationAlt`

Point at the target file even before the art exists. Art generation runs during pipeline stage 4.

```typescript
illustrationUrl: '/concept-art/encounters/<slug>.webp',
illustrationAlt: 'One sentence describing the scene. Wide shot, Threadbare palette.',
```

Art brief for the image-generation skill: parchment palette, desaturated earth tones, painterly digital style. Character faces avoided when possible — wide compositions preferred.

---

## Rule 5 — Every template is registered in `unified-action-templates.ts`

```typescript
import { MY_TEMPLATE } from './encounters/my-template';
// ...
MY_TEMPLATE,
```

No dangling imports. No template in this directory should be unused.

---

## Rule 6 — Every template is covered by the contract test

Add the template to the fixture array in `src/engine/__tests__/reputation-gated-encounters.test.ts`. The structural invariant tests at the bottom of that file run against every entry in `TRANCHE`, so adding your template there is sufficient for basic coverage. Add scenario-specific tests (gate opens/closes) for any new gate pattern not already covered.

---

## Gate Pattern Reference

| Pattern | `requiredTargetTraits` | Trait `encounterGates` | Example |
|---|---|---|---|
| Required-positive | `['trait.reputation.<reach>.positive']` | `unlocks: ['<template.id>']` on positive trait | `warlords-tribute` |
| Blocked-by-negative | — | `blocks: ['<template.id>']` on negative trait | `shadow-court-audience` |
| Required + blocked | `['trait.reputation.<reach>.positive']` | `unlocks` on positive, `blocks` on negative | `pilgrims-offering` |
| Multi-trait AND | `['trait.A', 'trait.B']` | `unlocks` on each required trait | `the-veiled-consultation` |
| Tier-sensitive | `['trait.reputation.<reach>.positive']` | `unlocks` on positive trait + `rarityTier: 3` | `the-stones-judgement` |
| Required-negative | `['trait.reputation.<reach>.negative']` | `unlocks: ['<template.id>']` on negative trait | `the-executioners-commission` |
| Mixed-polarity | `['trait.reputation.<reach>.negative']` | `unlocks` on negative trait; `blocks` on a **different polarity's positive** trait | `the-blinded-oracle` (eye.negative required, iron.positive blocks) |

*Note: The tier-sensitive pattern currently gates on trait presence (any level). Engine-level min-level checking (`minTraitLevel` field) is a future enhancement — see THR-32a onwards.*

*Note: The mixed-polarity pattern uses the engine's polarity-agnostic `encounterGates.blocks` — a positive trait can block a template just as a negative trait can. The `blocks` check fires regardless of which trait holds the entry; only the content of the array matters.*

---

## Pipeline Stages

1. **Draft** — write the template using the encounter-pipeline skill. One template per pipeline run.
2. **Editorial** — prose audit against Threadbare aesthetic: no reporter prose, the god argues and the mortal decides (Rule 3a), `{title}` present.
3. **Systems audit** — verify all six rules above, check tally keys match reach, check seed delays.
4. **Implementation** — generate concept art (image-generation skill), register template, run contract test.

For the full encounter-pipeline skill, see `.agents/skills/encounter-pipeline/SKILL.md`.
