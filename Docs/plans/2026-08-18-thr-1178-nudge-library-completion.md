> **title:** `Nudge library completion — sphere-expressive hand — THR-1178`
> **linear_issue:** THR-1178
> **author:** Claude Code (design session with Christian, 2026-08-18)
> **created:** 2026-08-18
> **three_pillars:** Engine done · Content done · UI done

# Nudge library completion — the sphere-expressive hand — THR-1178

*The Repertoire (THR-887) shipped as structure without content or mechanics for half its vocabulary; this plan completes it so a god's hand actually expresses their spheres.*

## Why this is load-bearing

Christian's 2026-08-18 direction: the "physics of the scene" framing over-constrains nudges — *"the god is a magical being of great power that manipulates the threads of reality in different ways based on what spheres they have."* The system already agrees: the 21-type card library spans mind (Compulsion), time (Omen), spirit (Kindled Ambition), darkness (Undertow), life (Balm). But three completion gaps keep that breadth on paper: the guidance's illustrative examples skew physical (so drafts inherit the skew), 9 of 21 card types have unbuilt mechanics (exactly the sphere-expressive ones), and every library member is unauthored (no title, no quote — dealable but keyword-only). A fourth gap is the ask's second half: nothing unlocks on the god's *sphere scores* — access is keyed to the binary primary/secondary identity only. Without this plan, the Encounter Factory keeps authoring toward the physical corner of a vocabulary that was designed to be twelve spheres wide.

**Four workstreams, three tickets:**

| Workstream | What | Ticket |
|---|---|---|
| A | Guidance widening — "influence, never authorship" replaces "physics of the scene" | THR-1178 (this issue) |
| B | Author every unauthored library member (title + quote + imageTag) | THR-1178 (this issue) |
| C | Build the card-type mechanics whose status is not `impl` | filed at handoff |
| D | Sphere-attunement unlocks — the score-keyed deepening channel | filed at handoff |

**Explicit non-goal:** dealing hands *from* the repertoire instead of authoring them per encounter. That pivot has a real prose problem (per-band payoff fragments are per-encounter today) and interacts with the in-flight THR-1130 retrofit; it is recorded as a future design direction in the brainstorm companion, not scoped here. Also **not** in scope: re-keying base access from identity to scores — that is THR-870's parked pivot; workstream D adds a deepening channel on top of the identity floor and deliberately leaves base access alone.

## Substrate inventory

Everything this plan touches already exists in `Docs/canon/systems-inventory.md`; every workstream **extends or activates** a listed subsystem, none green-fields:

| Premise noun | Inventory subsystem | Badge | This plan |
|---|---|---|---|
| Nudge library / Repertoire | `nudge` (`nudgeCardRepertoire.ts`, `nudgeGrantLiveness.ts`; THR-885/887/791/844/1110) | 🟢 ACTIVE | **extends** — content on existing members, new members, one new unlock kind |
| Heavy Hand's detection cost | Stealth, Detection & Hidden Marks | 🟢 ACTIVE | **extends** — new grant wiring into existing detection pressure |
| Long Game's planted marks | Stealth/Hidden Marks + Personality & Emergent Traits | 🟢 ACTIVE | **extends** — existing trait/mark grant paths |
| Whisper's reveal | Intelligence, Knowledge & Familiarity | 🟢 ACTIVE | **extends** — pre-commit read of existing factor pipeline |
| Undertow's value shift | Personality traits / drift (authored poles, THR-528; drift decay THR-323) | 🟢 ACTIVE | **activates for cards** — existing apply + decay-to-baseline machinery |
| Stumble's opposition effect | Encounter cast (encounter subsystem) | 🟢 ACTIVE | **extends** — cast-sourced named modifier |
| Kindled Ambition | Ambitions & Initiatives | 🟢 ACTIVE | **extends** — existing ambition-creation path |
| Omen's draw bias | Omens & Atmospheric Pressure + encounter draw scoring | 🟢 ACTIVE | **extends** — bounded additive scoring term |
| Cache's planted item | Attachments, Items & Possessions | 🟢 ACTIVE | **extends** — existing attachment-spawn machinery |
| Balm's condition removal | Effects & Conditions (condition decay/overflow) | 🟢 ACTIVE | **extends** — existing removal path |
| Attunement counter | GameState scalar (pattern: `unlockedActionIds`) | n/a (new field) | **adds** — one optional additive field; not a subsystem |

## Engine pillar

### Systems design

**Workstream C — unbuilt card mechanics.** Membership predicate (THR-688 rule A): *every row of `NUDGE_CARD_TYPES` in `src/data/nudge-card-library.ts` whose `status !== 'impl'`.* At plan time that is nine — Heavy Hand, Long Game, Whisper, Undertow, Stumble, Kindled Ambition, Omen, Cache, Balm — but the predicate, not the list, governs. Each row already names its one `hostSystem`, and that column is the design: **wire into the named host system, never a parallel path** (systems-inventory Step-0 rule — extend/activate, don't green-field). Per-type notes, one line each:

- **Heavy Hand** (Stealth & detection): large `forecastDelta` + detection-pressure grant — the THR-885 grants vocabulary already carries detection deltas; this is mostly a grants wiring + library-member effect definition.
- **Long Game** (Traits trigger layer): plant a trait or hidden mark via the existing `condition_attachment` / trait-grant path; future encounters fire on it through the six trigger sites.
- **Whisper** (Intelligence): reveal one hidden factor line or the next step's demand pre-commit. The only type with a new UI read (see UI pillar).
- **Undertow** (Pole-shift): strong boost + value-axis drift on the mortal — ride THR-528's authored-poles drift machinery (apply + decay-to-baseline), not a new drift path.
- **Stumble** (Encounter cast): the boost is framed as opposition weakening — a `forecastDelta` whose named modifier sources from the cast member, plus an optional cast-side condition grant.
- **Kindled Ambition** (Ambitions): mint an ambition on the mortal through the existing ambition-creation path.
- **Omen** (Omens): bias future encounter draws toward what this encounter uncovered — a scoring signal into the existing draw path, bounded and decaying.
- **Cache** (Attachments & items): plant a built item at a location/agent via the existing attachment-spawn machinery; grant-liveness gated (the item must exist).
- **Balm** (Effects & conditions): remove one condition via the existing condition-expiry/removal path.

Each type flips its library row `design|open → impl` in the same PR that ships it; types land independently (multiple PRs under one ticket are expected). Dispatch goes through `src/engine/encounters/nudgeDispatch.ts`'s existing seam.

**Workstream D — sphere attunement.** A monotonic, per-sphere lifetime counter plus a new unlock kind:

1. `GameState.essenceEarnedBySphere?: Partial<Record<SphereName, number>>` — additive optional field, incremented wherever sphere-keyed essence grants land (the three divine-economy GraphOp paths). Never decremented; spending essence does not un-earn it. Absent ⇒ treated as all-zero.
2. New `NudgeCardUnlock` variant: `{ kind: 'sphere_attunement', sphere: SphereName, threshold: number }`. `isMemberUnlocked` reads the counter off a new optional `RepertoireContext.essenceEarnedBySphere`. The existing exhaustiveness guard means an old build treats the new kind as locked — the safe direction, already documented in that switch.
3. **Seed content so the path cannot ship inert** (the live-layer trap): at least two attunement-gated variation members in the library, on spheres with shipped mechanics, at the first threshold. An unlock path with no exerciser is a path nobody notices has broken — the `god_trait` stub is tolerated because THR-791 owns it; this one has no future owner but us.
4. Identity floor unchanged: `memberAccess` (primary full / secondary discount / off-sphere locked) is untouched. Attunement only *adds members* to families the god can already access — deepening, not re-keying. An attunement member on a locked sphere stays locked; the sphere identity remains the door, attunement the depth.

### Graph nodes / edges

None. The counter is a `GameState` field (same pattern as `unlockedActionIds`), not a node property; card unlocks are not relationships between entities.

### Tick phases

No new phases. C's dispatches run inside existing encounter-resolution/aftermath application; D's counter increments inside the existing essence-grant call sites; repertoire evaluation stays deal-time (`buildNudgePhaseModel`).

### Resolution logic

Unchanged. Nudges keep shifting forecast modifiers and riders only; none of the nine types picks an outcome. Omen's draw bias is a bounded additive scoring term in the existing encounter-draw scorer, tunable and decaying — never a filter that hides candidates (the intel-gating rejection stays honored).

### PRNG callouts

None new. Unlocks and repertoire building stay pure over run state (no PRNG, per THR-887's contract). Card effects ride the host systems' existing seeded streams; no `Math.random()` anywhere.

## Content pillar

### Encounter templates

No new templates. **Workstream A** edits the authoring guidance the templates are written against:

- Replace the framing line — *"The god acts in the physics of the scene, never in the dramaturgy of the story"* — with the widened rule: **"The god acts through their spheres on the fabric of the scene — matter, minds, dreams, fates — never in the dramaturgy of the story. Influence, never authorship."** The protected rule is unchanged: never instruct the mortal, never pick between endings. What widens is the expressive range: a stumble, a spark, a dream-sent urge, an omen, a kindled desire are all lawful nudges.
- The illustrative example set everywhere the framing appears must span ≥3 non-physical sphere modes (mind/spirit/time/darkness/life), so drafts stop inheriting the physical skew.
- Editorial rejection trigger 14 rewords from "changing the physics of the scene" to "exerting the god's influence on the scene or the mortal's inner weather" — same rejection (options that instruct the mortal), wider lawful space.
- Surfaces carrying the line (grep `physics of the scene` to close the set): `Docs/canon/encounters.md`, `.claude/skills/encounter-pipeline/SKILL.md` (+ its agent prompts if they carry it), `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`, `.claude/skills/template-encounter-rewrite/SKILL.md` if present, and the compiled `Docs/authoring-brief.md` (regenerate via `npm run build-authoring-brief`, verify with `npm run check:authoring-brief`). Bump each edited skill's `last_validated_against`.

### Prose tables

**Workstream B — the card corpus.** Membership predicate: *every `NUDGE_CARD_LIBRARY` member with `title === undefined || quote === undefined`* (readable as `unauthoredCardCount()`, 37 at plan time). Per the locked THR-883 format: `title` 2–3 generic words, reusable in any encounter; `quote` one short serif line, the card's only prose; genericity test applies (a face that only reads in one scene is a defect). Register: interactive-plain for titles, `character` register allowed for quotes. Sphere-signature members must read as their sphere's mode of power (an `omen` card sounds like time, not like a recolored boost). `imageTag` assigned only where an existing image-library row fits; otherwise omitted (type-generic art fallback) — do not mint art slots in this ticket (THR-832/THR-1170 own image-library gaps).

### Attachment content

Cache needs at least one plantable item template to exist per its grant-liveness gate; use existing attachment templates — minting new items is not in scope.

### Data tables

`src/data/nudge-card-library.ts` gains: authored `title`/`quote` fields (B), status flips (C), attunement-gated variation members (D). `src/data/nudge-constants.ts` gains the constants table below.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — the card row and test panel are DOM; no WebGL touched).*

### Player-facing display

- Card faces render authored titles/quotes through the existing `cardDisplayTitle` fallback — B requires no component change, only content (the fallback keeps rendering keywords until content lands, per THR-887's fail-soft).
- **Whisper** is the one new read: a revealed factor line / next-step demand on the test panel, rendered in the existing factor-line vocabulary (words, never digits — Law 13/14). Reuse the test-panel line primitives; no new surface.
- Card provenance: the repertoire already carries `source`; extend the card-row explain surface (tooltip/detail) with `sphere_attunement` alongside `core/signature/hunger/milestone/god_trait/echo`.
- UI Laws engaged (THR-1007): **1** (real state only — every card effect must be a real engine write, Law 56 for any aftermath chips C's types produce), **13/14** (no raw numbers/internal keys on mortal-facing card faces — pips and words only), **17/21/37** per the composed card row. No exceptions requested.

### Event notifications

Attunement threshold crossings surface through the existing milestone-grant notification path (a new card member appearing in the repertoire is the player-visible event). No new toast type.

### Debug inspection (DebugPanel)

`window.__DEBUG` gains one accessor: `getRepertoire()` → the current repertoire entries with access/source/unlock state, plus `essenceEarnedBySphere`. (Check `src/debug-bridge.d.ts` for an existing repertoire accessor first; extend rather than duplicate.)

### Visual presence (HexMapV2)

N/A — no map surface; encounter-stage only.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `nudge-card-library.ts` (content + members) | deal-time (none) | card row (existing) | — | — | wiki page tables |
| `nudgeDispatch.ts` per-type effects (C) | encounter resolution / aftermath | encounter stage (existing) | host-system fields | host systems' existing categories | traces tab |
| essence-earned counter (D) | essence-grant call sites | — | `essenceEarnedBySphere` | rides essence-grant traces | `getRepertoire()` |
| `sphere_attunement` unlock (D) | deal-time (pure) | card provenance explain | reads counter | `nudge.attunement_unlock` (once per crossing) | `getRepertoire()` |
| Whisper reveal (C) | deal-time | test panel factor line | — | rides nudge-commit trace | encounter log TSV |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `SPHERE_ATTUNEMENT_THRESHOLDS` | `[20, 60]` | Lifetime essence-earned-in-sphere marks at which attunement members unlock (first-cut; iterated on the wiki page like `SPHERE_SIGNATURES`) |
| `OMEN_DRAW_BIAS_WEIGHT` | executor-tuned | Bounded additive scoring weight an Omen adds to matching encounter draws |
| `OMEN_DRAW_BIAS_DECAY_TICKS` | executor-tuned | Ticks over which the bias decays to zero |
| `HEAVY_HAND_DETECTION_DELTA` | executor-tuned | Detection pressure a Heavy Hand play adds |
| per-type effect magnitudes (C) | executor-tuned | One named constant per new mechanic magnitude — no inline numbers (NFP #1) |

## Tracing

```ts
// AttunementUnlockTrace — emitted once when a sphere crosses an attunement threshold
interface AttunementUnlockTrace {
  type: 'nudge.attunement_unlock';
  sphere: SphereName;      // which sphere crossed
  threshold: number;       // the mark crossed
  unlockedCardIds: string[]; // library members that became held
  tick: number;
}
```

C's mechanics emit through their host systems' existing trace categories (detection, traits, ambitions, omens, attachments, conditions, drift) — never a parallel trace path, same rule as the effects themselves.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `essenceEarnedBySphere` absent (old save / legacy run) | Treated as all-zero; attunement members stay locked; identity floor intact |
| Attunement member on a sphere the god has no identity access to | Stays locked — access check runs before unlock check (existing order) |
| `SPHERE_ATTUNEMENT_THRESHOLDS` empty | No attunement unlocks; warn once; everything else unaffected |
| C-type dispatch finds its host system ineligible (no cast member for Stumble, no condition for Balm) | Card not dealt where the precondition is knowable at deal time (the `requiresGroup` pattern); otherwise effect skipped with one warn, band prose still renders |
| Cache grant names a missing item template | Existing grant-liveness gate fails the build; at runtime, effect skipped with one warn |
| Unauthored member post-B (new member added later without content) | Renders keyword via `cardDisplayTitle` fallback (existing); `unauthoredCardCount()` test pins 0 so CI names the regression |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 345 importers | D adds one **optional** field (`essenceEarnedBySphere`) — additive, no reshape; absent-field behavior identical to today, so no importer changes semantics |
| `src/types/unifiedAction.ts` | 278 importers | Only if a C-type needs a grant-vocabulary extension (Whisper's reveal may); additive optional fields only, NFP #6 |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it deepens two: the sphere-governed direction (the repertoire plan already named itself THR-870's first live surface; attunement is the second) and generated-within-constraints content (a generic library authored once, grounded per-scene by prose).
- [x] No Vision edit required. The guidance widening (A) corrects authoring guidance, not a Vision premise — "influence, never authorship" is what the nudge pivot always meant; the physical examples were the drift.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**; see the next line.
- [x] This plan changes rules of play: card families gain an attunement unlock channel; nine card types become playable mechanics. `Docs/canon/rulebook.md` § encounters (card format / Repertoire progression) is updated in C's and D's closing PRs; quick-reference gains one line on attunement. A's guidance rewording also lands in the rulebook's nudge framing sentence if present.

## Interface impact

| Contract (cross-system read/write) | Verb | Note |
|---|---|---|
| Essence & Divine Economy grant sites → `essenceEarnedBySphere` | **add** | New write at existing grant sites; production read site: `nudgeCardRepertoire.isMemberUnlocked` (named per Step 0.7 rule) |
| `nudgeCardRepertoire` ← `GameState.unlockedActionIds` | preserve | Milestone unlocks unchanged |
| `buildNudgePhaseModel` → `buildRepertoire` context | extend | Passes `essenceEarnedBySphere` alongside existing identity/hunger/echo inputs |
| Card dispatch → Stealth & Detection / Traits / Intelligence / Drift / Encounter cast / Ambitions / Omens / Attachments / Conditions | extend | Nine new writes, each through its host system's existing entrypoint — no parallel paths (see Substrate inventory) |
| Encounter draw scoring ← Omen bias | add | Bounded additive term; production read site: the existing draw scorer; never a filter |
| `Docs/canon/interface-map.md` rows | — | C's and D's closing PRs update touched rows + `scripts/interface-contracts.ts` per Definition of Done |

> Brainstorm companion: `Docs/plans/2026-08-18-thr-1178-nudge-library-completion-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | All magnitudes named constants; thresholds table iterated on the wiki page like `SPHERE_SIGNATURES` |
| 2. Inspectability | PASS | One new trace type; everything else rides host-system traces; `getRepertoire()` debug accessor |
| 3. Determinism | PASS | Counter is monotonic over deterministic grant events; unlocks pure over run state; no new PRNG |
| 4. Fail-soft | PASS | Table above; the locked-by-default exhaustiveness guard is the safe direction |
| 5. Narrative over mechanical perfection | PASS | The whole plan exists to widen expressive range; card quotes are the one prose surface and are register-governed |
| 6. Additive over destructive | PASS | Optional fields, new unlock kind, new members; no existing hand or template changes behavior until authored against |
| 7. Performance budget | PASS | Deal-time-only evaluation (existing pattern); counter increment is O(1) at grant sites |

## Done when

*(Per-ticket Done-whens live on the tickets; this is the program bar.)*

- [ ] Guidance surfaces carry "influence, never authorship" with sphere-spanning examples; `grep -r "physics of the scene"` over `Docs/` + `.claude/skills/` returns only historical/plan-archive hits (A)
- [ ] `unauthoredCardCount() === 0`, pinned by test; wiki page updated in the same PR (B)
- [ ] Every `NUDGE_CARD_TYPES` row reads `status: 'impl'`, each shipped through its named host system (C)
- [ ] Attunement unlocks live with ≥2 seeded members and the counter written at all essence-grant sites (D)
- [ ] `npm test` and `npx vite build` pass; types via `npm run check:typecheck` (never `tsc --noEmit`, THR-686)
- [ ] Closing commits carry their ticket's `Fixes THR-XXXX`; UI-touching PRs carry browser-verify evidence per CLAUDE.md

## Kill criteria

- If ≥2 of the nine C types cannot ship through their named host system without a parallel path, the hostSystem contract is wrong — stop, re-open the type table design rather than green-fielding.
- If attunement unlocks never fire in a 100-tick seeded playtest with active essence income (thresholds unreachable), the thresholds/counter placement is miscalibrated — retune constants before adding members.
- If the guidance rewording produces drafts the editorial critic rejects at a *higher* rate on trigger 14 (instruction-to-mortal), the widened wording blurred the law — revert to a tighter formulation that still spans spheres.

## Coordination block

**Impact class (intent-judge confirmed): External** — workstream A edits agent-facing skill surfaces that change other agents' behavior: `.claude/skills/encounter-pipeline/SKILL.md` + its agent prompts, `.claude/skills/template-encounter-rewrite/SKILL.md`, and the compiled `Docs/authoring-brief.md`. Downstream consumers: the Encounter Factory drafting agents and editorial critic (trigger 14), the template-rewrite lane, and the in-flight THR-1130 retrofit (mutex below).

**Suggested model:** opus — A and B are Fable-register content authoring; C and D are engine work with content seams.

**Parallel-safe with:** unrelated engine/UI queue work (hex map, factions, economy).

**Mutex with:** THR-1130 (the retrofit authors against the spec A edits — land A first, batches pick up the widened guidance at their next draft); C/D tickets mutex with this one and each other on `src/data/nudge-card-library.ts` and the repertoire/dispatch seam (exact lines on each ticket).

**Files to touch:**
- Edit: `Docs/canon/encounters.md`, `.claude/skills/encounter-pipeline/SKILL.md` + `reference/nudge-authoring-spec.md` (+ agent prompts), `.claude/skills/template-encounter-rewrite/SKILL.md`, `Docs/authoring-brief.md` (regenerated) — A
- Edit: `src/data/nudge-card-library.ts` (titles/quotes/imageTags; later status flips + attunement members) — B/C/D
- Edit: `src/engine/encounters/nudgeDispatch.ts`, per-type host-system seams — C
- Edit: `src/engine/nudgeCardRepertoire.ts`, `src/types/gameState.ts`, essence-grant call sites, `src/data/nudge-constants.ts` — D
- Edit: `public/nudge-cards-reference.html` (wiki freshness source of the library file — same-PR gate)

## Notes for the executor

- **Do not re-key base access to scores.** Identity floor (primary/secondary) stays; attunement adds members. The full re-key is THR-870, parked by Christian's sequencing — this plan does not un-park it.
- **Do not build a parallel effect path for any C type.** The `hostSystem` column is a contract; if the host system genuinely cannot carry the effect, stop and file rather than green-fielding (THR-614 failure mode).
- **Whisper's reveal must not become intel gating.** It reveals to the *player pre-commit*; it never hides or filters candidates (rejected approach, THR-138).
- **B before or with C per family where possible** — a newly-impl type whose members are still keyword-only faces ships a worse surface than waiting one PR.
- The `unauthoredCardCount() === 0` pin is deliberate policy: after B, adding a library member without content is a CI-visible regression, which is the correct friction.

## Intent-judge verdict

*2026-08-18, two runs.* First pass: **Revise** — dimension 11 VIOLATION (missing `## Substrate inventory` section in an Engine-pillar plan) and dimension 10 GAP (kill criteria lived only in the action proposal); impact class corrected Reversible → **External** (workstream A edits agent-facing skill surfaces). All three required actions applied. Re-judgment: **Allow** — 0 GAPs, 0 VIOLATIONs; substrate badge claims verified against `Docs/canon/systems-inventory.md`. Proposal: `Docs/plans/.intent-proposals/2026-08-18-thr-1178-nudge-library-completion.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-18*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS-with-note | Constants table present (`SPHERE_ATTUNEMENT_THRESHOLDS: [20,60]`), but 3 of 5 rows read "executor-tuned" with no default value, incl. a single catch-all "per-type effect magnitudes (C)" row covering nine mechanics |
| 2. Inspectability | PASS | Wiring table mirrors `wiring-checklist.md`'s exact column schema (Module/Phase/UI/GameState/Trace/Debug); new `AttunementUnlockTrace` fully typed; C rides host-system trace categories; `getRepertoire()` debug accessor extended |
| 3. Determinism | PASS | "Unlocks and repertoire building stay pure over run state (no PRNG...)"; monotonic counter over deterministic grant events; card effects ride host systems' seeded streams |
| 4. Fail-soft | PASS | Explicit fail-soft table, 6 rows incl. legacy-save absence, empty thresholds, missing item template, ineligible host system — each with a stated fallback |
| 5. Narrative over mechanical | PASS | Plan's stated purpose is widening expressive/narrative range ("influence, never authorship"); quotes are register-governed, genericity-tested |
| 6. Additive over destructive | PASS | Blast Radius table confirms `essenceEarnedBySphere` is optional/additive on a 345-importer file with "no reshape"; identity floor explicitly untouched, attunement only adds members |
| 7. Performance budget | PASS | "Deal-time-only evaluation (existing pattern); counter increment is O(1) at grant sites" — no profiling evidence offered, but claim is proportionate to scope |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design gives per-type (9 rows) implementation notes each naming its `hostSystem`; graph/tick-phase/resolution/PRNG subsections all filled with specific reasoning, not boilerplate. |
| Content | present-and-substantive | Encounter templates subsection explains the "no new templates, guidance edit instead" framing; prose tables (Workstream B), attachment content, and data tables are concretely specified with predicates and formats. |
| UI | present-and-substantive | Player-facing display, event notifications, debug inspection all filled with specific components/accessors; Visual presence correctly marked N/A with one-line rationale (no map surface touched). |

Missing required sections: none. Wiring check: yes — 5 rows covering both Engine (C/D dispatch and unlock) and UI (card row, factor line, provenance). Substrate-existence check: no literal `## Substrate inventory` heading, but the opening names THR-887 as the existing shipped structure and states this plan *completes* (extends) it; cross-checked against `systems-inventory.md` (`nudge`: `nudgeCardRepertoire.ts`, `nudgeGrantLiveness.ts`; THR-1110/791/844/885/887) — substrate exists exactly as claimed. Honest.

PILLAR AUDIT: PASS

### Vision audit

Premises touched: `00-north-star.md` → "a menu of interventions: a whisper, a nudge, a vision… any of them will cost. None of them guarantees the outcome" — confirmed (card types directly extend this; "none of the nine types picks an outcome"). `02-non-negotiables.md` → #1 god-not-protagonist confirmed (nudges shift forecast/riders only); #3 mechanics-through-prose confirmed (Whisper reveal in words, never digits); #4 graph-first confirmed (counter justified as scalar GameState field on the `unlockedActionIds` precedent). `03-design-tensions.md` → #2 systemic emergence vs authored moments — extended (generic authored library grounded per-scene by prose). `taste-profile.md` → god-never-protagonist and prose-first confirmed. `01-core-loop.md` → not referenced.

Vision contradictions: none found. North star: yes — widens the exact whisper/nudge/vision toolkit the north-star moment depends on. Core loop: preserved. Non-negotiables: stays inside — explicit safeguards against outcome-picking, numeric surfacing, and re-keying the identity floor (THR-870 stays parked). Design tensions: balanced. Taste profile: respected.

VISION AUDIT: PASS
