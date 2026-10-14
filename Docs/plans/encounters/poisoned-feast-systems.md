# Encounter Pipeline: The Poisoned Feast
> Scale: short | Slug: poisoned-feast | Pass: systems
> Date: 2026-10-14 | Pipeline version: 2.0 (v3 line, master-everyday-2 slot 1, THR-1757)
> Audited: `Docs/plans/encounters/poisoned-feast.package.json` after the editorial fixes.

**Verdict: READY WITH CAVEATS**

## 1. Support bundle honesty

| Key | Delivery | Persistence | Resolves? |
|---|---|---|---|
| `coroner` | lazy-materialize-on-trigger; reuse `healer`, else spawn `healer` "Maud Ashby" | must-persist (favour debtor) | `healer` is an `NpcRole` (`src/types/npc.ts:39`); `supportRole` is a free string (`src/types/encounter.ts:218`). ✓ |
| `poisoner` | lazy-materialize-on-trigger; spawn-only `merchant` "Hob Tanner" | must-persist (concealed mark carrier) | `merchant` is an `NpcRole` (`src/types/npc.ts:38`). Spawn-only is right: a reused townsman would be cast as a poisoner. ✓ |

Honest. The gate's `cast` system binds both.

## 2. Effect and field audit

| Effect / field | Where | Resolves in code |
|---|---|---|
| `reputation_with` `targetLocationId: '$here'` ±0.06 / −0.03 | step 1 success / failure; step 0 failure | `src/types/unifiedAction.ts:1199` ✓ |
| `hidden_mark` `secret_knowledge` on `$actor` | step 1 success | kind `:552`, category `:113` ✓. Label corrected to "Knows who poisoned the cup at the guild feast": the old "who paid" was true only on critical success, and after the editorial fix not even there |
| `hidden_mark` `concealed_action` on `$cast:poisoner` | step 1 failure | category `:114` ✓ |
| `favor_creation` debtor `$cast:coroner`, `magnitudeRange [0.15, 0.3]` | step 1 success | `:1147–1157`; debtor sentinel form documented in the type ✓ |
| `encounter_seed` `query {encounter_template, ['#rival_strike']}`, `targetAgentId $actor`, `delayTicks 30` | step 1 success **and** failure | kind `:477`; tag seated at `src/data/content-tags.ts:295`; sole bearer `encounter.rival.hired_knives` (`src/data/encounters/hired-knives.ts:41`), registered in both arrays (`src/data/unified-action-templates.ts:6025`, `:6194`). Gate's `content_query` resolves ✓ |
| Trait refs | `trait.core.core_forgiveness.vice` (Vengeful, `src/types/coreRegistry.ts:145`), `trait.personality.eye.vice` (Judgemental, `src/types/axisRegistry.ts:128`), `trait.mastery.keen-eyed` (`src/data/mastery-trait-content.ts:157`) | ✓ (gate's trait-ref check clean) |
| Trait card | `libraryCardId: card.trait_card.core` | `src/data/nudge-card-library.ts:593` ✓ |
| `imageTag`s | `generic.matter`, `generic.vigor`, `generic.memory`, `generic.mercy` | each present in `src/data/encounter-image-library.ts` ✓ |
| Chip tooltips | `ui.reputation_with`, `ui.standing`, `ui.favour_owed`, `ui.aftermath_seed` | `src/data/ui-content.ts:614, 568, 595, 696` ✓ |
| `deal.tags` | `insight`, `lore`, `social` | closed `DealContextTag` set ✓ |

No `authoredChoices`, no grants, no `costs` channel, no appointment. Tags: none authored (correct — no family word fits a one-off poisoning, and the brief mints none).

## 3. Chip backing (Law 56) and referents

Bands resolve off `fallback.byOutcome`, keyed on the action outcome. Paths into each band, from `advanceStep` / `computeFinalActionOutcome` (`src/engine/unifiedActionLifecycle.ts:219–261, 367–386`):

| Band | Paths | Writes | Chips | Backed? |
|---|---|---|---|---|
| critical_success | step 1 success-side, no failure/cost, ≥1 crit | +0.06, favour, secret mark, seed | regard (`$here`), favour (`$cast:coroner`), PATH (carrier `$actor`) | ✓ |
| success | both steps clean success | same | same | ✓ |
| success_at_cost | step 0 failure (continues) or any near-miss/s-a-c, then step 1 success-side | +0.06 (−0.03 if step 0 failed: net gain), favour, mark, seed | same | ✓ |
| failure | step 1 plain failure | −0.06 (−0.03 more if step 0 failed), concealed mark, seed | scar (`$here`), PATH | ✓ (mark concealed by design) |
| critical_failure | (a) step 0 critical failure: −0.03 only. (b) step 1 critical failure: −0.06, concealed mark, **seed** | scar (`$here`) | ✓ every chip backed on both paths |

**Caveat C1 — unchipped seed on one path.** On path (b) the seed plants but the band shows no PATH chip; adding one would be a false chip on path (a). `EffectPredicate` (`src/types/effects.ts:32–65`) has no outcome-band predicate and `ActionStepOutcomeMetadata` splits only success/failure, so it cannot be closed in content. An omission, not a Law 56 breach. The Hired Knives arrives unannounced on that one path.

Referents: every reputation chip anchors `$here` (`visualKind: 'location'`); the favour chip's concept anchors `$cast:coroner` (the debtor, per `favor_creation` edge direction); the PATH chip anchors its carrier `$actor` (anchor-catalog rule 2). No `{target}` interpolation (THR-1685). No chip points at fiction.

## 4. Aftermath supportability: prose rule 7b walk

| Later-tense sentence | Surface | Enacting effect on that path |
|---|---|---|
| "Whoever paid that guildsman will soon hear that {actor} is still alive." | step-1 spine | `encounter_seed` on step-1 success and failure: every path that shows step 1 plants it ✓ |
| "If no hand is named by then, {location} will take {actor} for the poisoner." | step-1 spine | `reputation_with $here −0.06` on step-1 failure ✓ |
| "Whoever paid for the poison is sending their people after {actor}." | PATH chip ×4 | the seed on that band ✓ (placeless: the people *find* the mortal, no place promised) |
| "… knows {actor} lived, and sends their people." | `seedLabel` ×2 | the seed itself ✓ |
| "{cast:coroner} owes {actor} a favour." | favour chip | `favor_creation` ✓ |

Before the editorial fix, the step-1 spine promised the payer would hear *only if* a hand was named (false on failure) and the old chip promised the payer had heard that the master "knows" (the sequel never reads it). Both retired.

**Sequel fit (the author's question, systems half).** The query keeps the family's eligibility filter: Hired Knives is `individual`, `rural`/`urban`/`wayside` (`hired-knives.ts:49–52`), so a mortal who has wandered off the settled map when the seed comes due withers it. A `templateId` seed would skip the filter but would also stage Hired Knives in a setting class it has no opening for; `query` is the right operand. Its spine's reason ("because a god's help was seen") is generic to its planters (`recordDetectionCrossings`, *The Infiltrator's Approach*), which is caveat C2.

## 5. Missing primitives

None for this encounter. Live primitives used: `encounter_seed.query`, `hidden_mark`, `favor_creation`, `carryoverFactorLines`, `deal`. The only gap touched is C1 (no band-scoped effect predicate) — noted, not needed.

## 6. New hooks needed

None.

## 7. Implementation file map

None beyond the compiled set (`compile:encounter` emits `src/data/encounters/poisoned-feast.ts`, its structural test and both registrations). Concept art, if generated: `public/concept-art/encounters/poisoned-feast.jpg`.

## 8. Caveats

- **C1** — step-1 critical failure plants the seed with no PATH chip on that path (see § 3).
- **C2** — `#rival_strike` has one member whose spine names its own reason. The parent now promises only "their people sent after {actor}", which it delivers; a planter-aware line in Hired Knives, or a second family member, would make the arrival read as the poisoner's patron by name. Follow-up ticket, outside this slot's edit scope.
- **C3** — at master difficulty the proof ascendant loses most natural runs: take live evidence from a seed sweep plus a pinned band, and read success-side rows on a failed run as not exercised.

## 9. Primitive disposition

No missing primitives identified. C1 → BACKLOG only if a second encounter needs a band-scoped write (an `onBand` key on step metadata, or an outcome predicate); not worth building for one chip.

## Gate

```
node .cache/cc-poisoned-feast.mjs --package Docs/plans/encounters/poisoned-feast.package.json
  checked 1   clean 1   failing 0   on ratchet 0   warnings 0
  ✓ encounter.town.poisoned_feast  [systems: cast, rewards, seeds, reputation, content_query]
  OK
```
