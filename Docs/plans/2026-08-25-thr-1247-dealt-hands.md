> **title:** `Dealt hands — the Repertoire deals into the encounter hand — THR-1247`
> **linear_issue:** THR-1247
> **author:** Claude Code (design session with Christian, 2026-08-25)
> **created:** 2026-08-25
> **three_pillars:** Engine done · Content done · UI done

# Dealt hands — the Repertoire deals into the encounter hand — THR-1247

*The library is finished (faces, mechanics, attunement); this plan makes it the source of most of the hand, so a hand reads as* your god's *hand in any encounter, while encounters keep authoring only what is genuinely theirs.*

## Why this is load-bearing

Today every encounter authors its whole 4–8 card hand from scratch — 40+ shipped templates × ~6 cards of bespoke mechanics and band prose each, even though the cards themselves became generic and reusable at the THR-883 communication pivot, and even though the Repertoire now knows exactly which cards *this* god holds (sphere signatures, hunger uniques, attunement, echo cards). The costs compound: authoring a hand is the most expensive part of every factory encounter; hands drift toward each author's favorite three types (the convergence the consequence draw exists to fight); and the god's repertoire progression — the point of THR-887/1180 — is invisible in practice, because an encounter only ever shows the cards its author happened to write. Dealing from the library inverts that: the encounter authors its **specials** (0–2 cards only it could offer) and declares a fill; the Repertoire supplies the rest, deterministically, from cards the player already knows. Christian approved the hybrid framing in chat 2026-08-24/25; THR-1130's retrofitted hands remain valid by construction.

**Explicit non-goals:** no change to any shipped encounter's behavior (dealing is opt-in per step; absent declaration ⇒ byte-identical); no PRNG in dealing (WS0's zero-rng property holds); no removal of authored hands as a form — a fully-authored hand stays legal forever; no change to the nudge law (influence never authorship, fate rolls outcomes, words never numbers).

## Substrate inventory

Everything touched exists in `Docs/canon/systems-inventory.md`; this plan **extends** listed subsystems and green-fields nothing:

| Premise noun | Existing substrate | This plan |
|---|---|---|
| The Repertoire | `nudge` — `nudgeCardRepertoire.ts` (`buildRepertoire`, access/unlock/echo; THR-887/1180) 🟢 ACTIVE | **extends** — repertoire becomes the deal pool source |
| Card faces | `NUDGE_CARD_LIBRARY` + `CARD_CONTENT` (THR-1178: `unauthoredCardCount()===0` pinned) | **extends** — two new per-member tables join the same assembly |
| Card mechanics | `nudgeDispatch.ts` routes `StepNudge.costs`/`grants` through host systems (THR-885/1179, all 21 types `impl`) | **preserved** — dealt cards mint ordinary `StepNudge`s; dispatch unchanged |
| Hand assembly | `buildNudgeHand(step, template, context)` reads `step.nudges` only; window/caps in `nudgeAuthoringConstants.ts` (`NUDGE_HAND_MIN/MAX` 4/8, `NUDGE_HAND_MAX_TOTAL_DELTA` 0.70) | **extends** — a pure dealer composes upstream; `buildNudgeHand` untouched |
| Band prose | `StepNudge.bandProse` appended per resolved `StepOutcome`; enrichment via `enrichProse` (THR-923) | **extends** — dealt cards carry library-authored fragments through the same append path |
| Prose enrichment | placeholder resolution (`{actor}`, `{they}`, setting variants THR-884) | **preserved** — fragments are written to existing placeholders; no new resolver |

## Engine pillar

### Systems design

Three additions, all pure, all additive:

**1. Play profiles — the mechanics a dealt card plays with.** New library table `PLAY_PROFILES: Readonly<Record<string, NudgeCardPlayProfile>>`, keyed by member id like `CARD_CONTENT`:

```ts
interface NudgeCardPlayProfile {
  readonly essenceCost: number;            // pre-discount; repertoire/signature discounts apply as today
  readonly forecastDelta: number;          // 0 for pure-rider/pure-grant cards
  readonly rider?: NudgeRider;             // insurance/mercy/gambit families
  readonly costs?: NudgeCostChannels;      // heavy hand, bargain, veil…
  readonly grants?: readonly EncounterAftermathReactionEffect[]; // omen, cache, balm… — the THR-1179 vocabulary
  readonly contextTags?: readonly DealContextTag[]; // when this member is *relevant* (see dealer)
}
```

A profile is **generic by the same law as the face**: no scene-bespoke targets. Grants that need a target (Cache's item, Balm's condition) use the THR-885 deal-time binding model — typed selectors resolved at deal time, **binding failure ⇒ card not dealt** (self-grounding, the existing Decision-6 rule; no new machinery).

**2. Minting.** Pure `mintDealtNudge(member, profile, content, context): StepNudge` — id `dealt.<memberId>` (namespaced so it can never collide with an authored id), `libraryCardId` set (echo-card tally works unchanged), face from `CARD_CONTENT`, mechanics from the profile, `bandProse` from the fragments table (below). The minted object is an ordinary `StepNudge`: **every downstream system — hand partition, commit, dispatch, riders, forecast, echo harvest — is unchanged and unaware.**

**3. The dealer.** Pure `dealHand(step, template, repertoireEntries, dealContext): StepNudge[]`, invoked by the adapter only when the step declares `deal` (below). Selection is **score-and-select, zero PRNG** (the `scoreAndSelect` / echo-card precedent): candidates = repertoire members with a profile, minus members whose type an authored special already covers (no two cards answering the same question — the existing hand rule), minus binding failures. Score = sphere-identity match (primary > secondary > common) + context-tag match against the step's declared tags + attunement/echo provenance bonus (progression must be *felt*: a newly unlocked member outranks its core sibling). Deterministic tie-break by member id. Fill count = declared `deal.count`, clamped so authored + dealt fits `NUDGE_HAND_MIN..MAX` and respects `NUDGE_HAND_MAX_TOTAL_DELTA`; the hand-checklist variety rules (≥4 spheres, ≥1 ungated common, ≤1 rider) are enforced by the selector as constraints, in that priority order.

**Declaration (additive schema):** `ActionStep.deal?: { count: number; tags?: readonly DealContextTag[]; exclude?: readonly NudgeCardTypeId[] }`. Absent ⇒ no dealing, today's behavior byte-identical (NFP #6). `DealContextTag` is a small closed union (first cut: the 8 reaches + `'social' | 'peril' | 'craft' | 'journey'`) — a vocabulary the factory spec documents, not free text.

### Graph nodes / edges

None. Dealt cards are transient hand entries; nothing persists except what dispatch already writes through host systems.

### Tick phases

None new. Dealing happens at hand-assembly time in the adapter (same place `buildNudgeHand` runs today); commit/dispatch/aftermath phases untouched.

### Resolution logic

Unchanged — minted cards contribute named forecast modifiers (`nudge:dealt.<memberId>`) and riders through the existing paths. The selector is the only new logic and it is a deterministic constrained ranking, documented above.

### PRNG callouts

**None — deliberately.** Dealing is pure over (repertoire, step declaration, world state), preserving WS0's zero-PRNG hand property and making the dealt hand replayable from a save. Variety across encounters comes from context tags and the god's evolving repertoire, not dice; if play testing later wants shuffle-feel, that is a *new decision* requiring a seeded stream, named here so nobody adds `Math.random()` in passing.

## Content pillar

### Encounter templates

No shipped template changes in this program. New factory encounters author: scene prose (unchanged), 0–2 **specials** (`StepNudge` as today — the card only this encounter could offer, ideally carrying `libraryCardId` when it instantiates a library type), and the `deal` declaration. The **composed** hand must satisfy every existing hand rule; `check:encounter` gains a composed-hand validation (below).

### Prose tables

**Band fragments — the corpus this plan stands on.** New library table `BAND_FRAGMENTS: Readonly<Record<string, Partial<Record<StepOutcome, string>>>>` keyed by member id. Authoring rules (inherited from the spec, now applied library-side, once per member instead of per encounter):

- Every member: **≥1 failure-band fragment**; members whose profile `forecastDelta ≥ NUDGE_BIG_DELTA`: **both** failure bands.
- Fragments are **generic and enrichment-grounded**: written to `{actor}`/`{they}` placeholders and scene-neutral nouns; they describe *the god's influence landing or misfiring*, never scene furniture. The genericity test from the face rules applies verbatim.
- Register: baseline; the seam-echo class (spec trigger 22) is the known risk when a generic fragment abuts authored band prose — the editorial pass on the corpus checks fragment↔base-band seams against the six exemplar encounters' band prose.
- Corpus size: every member with a play profile (~40 at filing) × ~2–3 fragments.

### Attachment content

Cache/Balm profiles reference existing attachment/condition selectors only (deal-time binding); no new items minted.

### Data tables

`PLAY_PROFILES`, `BAND_FRAGMENTS`, `DealContextTag` union, and per-type default magnitudes join `nudge-card-library.ts` / `nudge-constants.ts`. Liveness sweeps extend `validateRepertoire()`: a member with a profile but no fragments (or vice versa) is a named report row; `profiledCardCount()` mirrors `unauthoredCardCount()` and is pinned by test once the corpus lands.

### Authoring-guidance updates

`nudge-authoring-spec.md` gains § *The dealt hand* (what authors still write, the specials rule, the `deal` declaration, the tag vocabulary); `encounter-pipeline` SKILL step 3 and the hand checklist reword from "author 4–8 cards" to "compose 4–8: author the specials, declare the fill"; `Docs/authoring-brief.md` regenerated. **Mutex with THR-1130** on these files — land after or between retrofit batches, and the retrofit's remaining batches may opt in per batch (executor + director call at the batch brief).

## UI pillar

*Screenshot tool: Playwright (DOM — card row and hand). No WebGL.*

### Player-facing display

The card row renders minted cards through the exact same component path — face, pips, cost, effect line all come from the `StepNudge` shape. One addition: the provenance explain surface (built for `sphere_attunement` in THR-1180) gains a **dealt** source line naming the card's origin ("from your repertoire — Darkness signature"), so a player can tell the god's cards from the scene's. UI Laws: 1 (dealt cards are real, committed state), 13/14 (nothing numeric leaks — profiles render through the existing pip path), 17/21/37 judged on the composed row.

### Event notifications

None new.

### Debug inspection (DebugPanel)

`window.__DEBUG` repertoire accessor (THR-1180) extends with the last deal: candidates considered, scores, constraint eliminations, final fill — the inspectability surface for "why did I get this hand". Encounter-log TSV export gains a `dealt` column on hand rows.

### Visual presence (HexMapV2)

N/A — no map surface.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|------------------|
| `PLAY_PROFILES` / `BAND_FRAGMENTS` (library) | — (data) | card row (existing) | — | — | wiki page tables |
| `dealHand` + `mintDealtNudge` (new, engine) | hand-assembly (adapter, deal-time) | card row via existing partition | reads repertoire + `essenceEarnedBySphere` | none from render path (pure + replayable; see Notes) | `getRepertoire()` deal report; TSV `dealt` column |
| `ActionStep.deal` declaration | — (schema) | — | — | — | `check:encounter` composed-hand report |
| Dispatch of dealt cards | encounter resolution / aftermath (existing) | existing | host-system fields | existing `nudge.*` dispatch traces (fire unchanged, `dealt.` ids visible) | traces tab |
| Provenance "dealt" line | — | card explain surface | — | — | — |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `DEAL_DEFAULT_COUNT` | `4` | Fill when a step declares `deal` without a count |
| `DEAL_SPHERE_PRIMARY_WEIGHT` / `_SECONDARY_WEIGHT` / `_COMMON_WEIGHT` | `3 / 2 / 1` | Sphere-identity match term in the selector score |
| `DEAL_TAG_MATCH_WEIGHT` | `2` | Context-tag match term |
| `DEAL_PROVENANCE_BONUS` | `1` | Attunement/echo members outrank core siblings (progression must be felt) |
| `NUDGE_HAND_MIN/MAX`, `NUDGE_HAND_MAX_TOTAL_DELTA`, `NUDGE_BIG_DELTA` | existing | Unchanged; the dealer enforces them on the *composed* hand |
| per-profile magnitudes | authored in `PLAY_PROFILES` | Every dealt card's numbers are data, not code (NFP #1) |

## Tracing

N/A — no new trace type, deliberately: dealing is pure and replayable from state (same argument as `buildRepertoire`, which also emits none), and hand assembly runs on the render path where a trace would double-fire. Inspectability is carried by the `__DEBUG` deal report and the TSV column instead; committed dealt cards flow through the **existing** `nudge.*` commit/dispatch traces with their `dealt.` ids visible, so causality post-commit is already traced.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Member has profile but a grant's deal-time binding fails | Card not dealt (self-grounding); next-ranked candidate fills |
| Deal pool after constraints < declared count | Deal what exists; composed hand may sit under `count` but never under authored specials alone — universal core (always profiled, always accessible) floors the pool |
| Member has profile but no band fragments | Not dealt; named row in `validateRepertoire()` report — never a silent prose hole |
| Step declares `deal` on a template whose step already authors ≥ `NUDGE_HAND_MAX` cards | Deal contributes zero; warn once |
| `deal.tags` names an unknown tag | Tag ignored with one warn; scoring proceeds on remaining terms |
| Legacy save / no repertoire context | No dealing (same gate as THR-887's absent-identity rule); authored hand renders as today |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | ~278 importers | One optional field (`ActionStep.deal`); additive, absent ⇒ identical semantics for every importer |

## Kill criteria

- If dealt hands converge (same fill for most gods on most steps — measurable from the TSV `dealt` column across a 100-tick seeded run), the scoring terms are too flat: retune weights/tags before widening the corpus.
- If the fragment corpus produces seam echoes the editorial pass can't hold below the spec's bar on the six exemplar seams, the per-member fragment model is wrong — stop and redesign toward per-type fragments with member inserts, not more authoring.
- If `check:encounter`'s composed-hand validation cannot verify a declared deal statically (too state-dependent), the declaration schema is under-specified — re-open the design before shipping content against it.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. Extends the north-star intervention menu (the god's known toolkit appearing everywhere), the roguelite progression loop (repertoire growth now visible in every hand), and generated-within-constraints (authored-once generics grounded per scene). The god/protagonist separation and fate-rolls-outcomes laws are untouched by construction (minted cards are ordinary nudges).
- [x] No Vision edit required.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**; see the next line.
- [x] Rules of play change: hand composition becomes authored-specials + repertoire fill. `Docs/canon/rulebook.md` § encounters and the quick-reference's hand line update in the engine ticket's closeout; the spec's § dealt hand rides the content ticket.

## Interface impact

| Contract (cross-system read/write) | Verb | Note |
|---|---|---|
| Hand assembly ← `buildRepertoire` | extend | Dealer consumes repertoire entries (today only ids gate authored cards) |
| Hand assembly ← `PLAY_PROFILES`/`BAND_FRAGMENTS`/`CARD_CONTENT` | add | Read at mint time; production read site: `mintDealtNudge` |
| Dispatch ← minted `StepNudge.costs`/`grants` | preserve | Unchanged vocabulary and door (THR-885/1179) |
| `check:encounter` ← `ActionStep.deal` | add | Composed-hand validation; read site: the gate runner |
| Echo harvest ← `libraryCardId` on dealt cards | preserve | Tally counts dealt plays exactly as authored ones |
| Interface-map rows | — | Updated in the engine ticket's closeout per Definition of Done |

> Brainstorm companion: `Docs/plans/2026-08-25-thr-1247-dealt-hands-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Selector weights, fill count, and every card's numbers are named constants/data |
| 2. Inspectability | PASS | Deal report on `__DEBUG`, TSV column, existing dispatch traces carry `dealt.` ids; no-new-trace rationale stated inline |
| 3. Determinism | PASS | Zero-PRNG dealing, pure over state, id tie-breaks; replayable from a save |
| 4. Fail-soft | PASS | Table above; universal-core floor guarantees a playable hand |
| 5. Narrative over mechanical perfection | PASS | Specials keep the scene's own cards; fragments are authored prose, not synthesized |
| 6. Additive over destructive | PASS | Opt-in `deal` field; absent ⇒ byte-identical; no template rewrites |
| 7. Performance budget | PASS | Deal-time only, small candidate set (~40), no per-tick cost |

## Done when

*(Program bar; per-ticket Done-whens on the tickets.)*

- [ ] Engine: profiles/fragments schema, `mintDealtNudge`, `dealHand`, `deal` declaration, composed-hand gate in `check:encounter`, provenance line, `__DEBUG` deal report — shipped with ≥2 reference profiles+fragments proving the path end-to-end in a seeded run
- [ ] Content: profiles + fragments for every library member (predicate: `profiledCardCount()` = member count, pinned); spec/pipeline/brief updated
- [ ] One factory encounter authored under the composed model and proved via `check:encounter` + `check:encounter-live`
- [ ] `npm test`, `npx vite build`, `npm run check:typecheck` green; closing commits carry their ticket's auto-close line per CLAUDE.md

## Coordination block

**Impact class: External** — the content ticket edits agent-facing authoring surfaces (spec, pipeline skill, brief) consumed by the factory lane and THR-1130.

**Suggested model:** opus for content (fragment corpus is register-governed prose; profiles are game-feel judgment); sonnet acceptable for the engine ticket (fully specified pure functions).

**Parallel-safe with:** THR-1130 for the **engine** ticket (new fields + new modules; no template or spec files touched).

**Mutex with:** for the **content** ticket — THR-1130 (both edit `nudge-authoring-spec.md` + pipeline skill; land between batches) and anything touching `src/data/nudge-card-library.ts`.

**Files to touch:**
- Engine ticket: `src/data/nudge-card-library.ts` (+profiles/fragments tables + validation), `src/engine/encounters/nudges.ts` or new `dealHand.ts`, `src/types/unifiedAction.ts` (`deal` field), `buildNudgePhaseModel.ts`, `check:encounter` runner, card explain surface, `public/nudge-cards-reference.html`, `debug-bridge`
- Content ticket: `PLAY_PROFILES`/`BAND_FRAGMENTS` corpus, `nudge-authoring-spec.md`, `.claude/skills/encounter-pipeline/SKILL.md`, `Docs/authoring-brief.md` (regenerated), one reference encounter

## Notes for the executor

- **A minted card is an ordinary `StepNudge`.** If you find yourself special-casing `dealt.` ids anywhere downstream of assembly, the design is being violated — the whole cost model of this plan is that commit/dispatch/harvest stay unaware.
- **No PRNG in the dealer.** Determinism is a stated property with a kill criterion attached; shuffle-feel is a future decision, not a tweak.
- **Fragments are not "flavor"** — they are the payoff-at-every-band law applied library-side. A profiled member without fragments must be undealable, and the liveness sweep must say so by name.
- The `deal` declaration's tag vocabulary is a closed union on purpose; widening it is a spec change, not a convenience.
- Engine ticket ships first with 2 reference profiles; do not block it on the corpus.

## Intent-judge verdict

*2026-08-25, one run:* **Allow** — 11/11 dimensions PASS, impact class **External** confirmed (content ticket edits agent-facing authoring surfaces). The three author-flagged judgment calls (hybrid-approval interpretation, no-new-trace calibration, per-member tables with retreat in kill criteria) each scrutinized and held on quoted evidence. Proposal: `Docs/plans/.intent-proposals/2026-08-25-thr-1247-dealt-hands.md`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-08-25*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table (`DEAL_DEFAULT_COUNT`, weight constants) + "every dealt card's numbers are data, not code (NFP #1)" |
| 2. Inspectability | PASS | `__DEBUG` deal report (candidates/scores/eliminations), TSV `dealt` column, existing `nudge.*` traces carry `dealt.` ids post-commit |
| 3. Determinism | PASS | "PRNG callouts: None — deliberately"; pure `dealHand`, id tie-break, replayable from save |
| 4. Fail-soft | PASS | 6-row fail-soft table; universal-core floor guarantees playable hand; binding failure ⇒ card skipped, not thrown |
| 5. Narrative over mechanical | PASS | Specials preserve scene-authored cards; fragments are authored prose per member, not synthesized |
| 6. Additive over destructive | PASS | `ActionStep.deal` optional; "absent ⇒ no dealing, today's behavior byte-identical"; `buildNudgeHand` untouched |
| 7. Performance budget | PASS | Deal-time only (not per-tick), candidate set ~40 members, no new tick phase |

NFP AUDIT: PASS. Note (not a fail): the no-new-trace argument means the selector's reasoning is inspectable live via `__DEBUG`, not preserved in the persistent trace log — an accepted trade-off given the stated rationale.

### Three-pillar audit

| Pillar | Verdict | Finding |
|---|---|---|
| Engine | present-and-substantive | Full systems design (play profiles, `mintDealtNudge`, `dealHand` selector); graph/tick-phase/resolution/PRNG subsections filled with explicit "none, deliberately" rationale for PRNG. |
| Content | present-and-substantive | Encounter-template impact, `BAND_FRAGMENTS` prose table with authoring rules, attachment content, data tables, authoring-guidance subsection. |
| UI | present-and-substantive | Provenance line with UI-Laws citations (1, 13/14, 17/21/37), debug inspection, Visual presence N/A-with-rationale. |

No missing required sections (Blast Radius correctly triggered by `unifiedAction.ts` ≥100 importers). Wiring table matches the checklist schema, every row resolves. Substrate check: `## Substrate inventory` present; cross-checked against `systems-inventory.md` — every row "extends"/"preserved", never "build"; no duplicate-subsystem risk.

PILLAR AUDIT: PASS

### Vision audit

Premises: north star "god watches, not steers" — confirmed (dealt cards are ordinary `StepNudge`s); non-negotiables #1/#3/#6 confirmed/extended; design tension #2 (systemic emergence vs authored moments) directly engaged and well-navigated (specials authored, fill systemic — stated as the design's point). No contradictions introduced. One note: `taste-profile.md`'s "encounter-specific intervention verbs" entry is **pre-existing drift** against the shipped THR-883 generic-card architecture — inherited, not caused, by this plan; reconciled with a dated note in the vault entry as part of this session's closeout.

VISION AUDIT: PASS-with-notes
