---
status: current
issue: THR-774
companion_issue: THR-775 (one shared design; per-ticket handoffs)
supersedes: the authored-choices encounter stage UI (WS2 replaces it; engine already landed in THR-773)
---

# Nudge Encounter Experience — WS1 (builder pipeline) + WS2 (interface)

**User verdict (Christian, chat, 2026-07-27):** "the new encounter experience is still first priority" / "please do the design work on that first." One plan doc, two tickets — THR-774 (WS1, authoring) and THR-775 (WS2, interface) — because both consume the WS0 schema as merged and must agree on the authored format. File surfaces are disjoint (WS1 = `.claude/skills/**` + docs; WS2 = `src/components/**` + one hook seam), so the tickets are parallel-safe with each other.

**Program:** `Docs/plans/2026-07-26-nudge-model-encounter-system.md` (THR-772). **Reference implementation:** `Design/mockups/2026-07-26-nudge-model-encounters.html` (v3 — Christian-approved through three iterations; its flow is contractual, its CSS is not).

## Substrate inventory (verified against the *merged* WS0, 2026-07-27)

| Element | Landed symbol | Where |
|---|---|---|
| Nudge schema | `StepNudge` (unifiedAction.ts:810), `ActionStep.nudges?` (:880), `TraitVariant` (:844), `UnifiedActionTemplate.traitVariants?` (:1049) | types |
| Hand resolution | `NudgeHand { playable, dimmed, hidden }` (field name per `nudges.ts:51`), `NudgeHandEntry{ nudge, blocked?: NudgeBlockedCode }` (`essence_unavailable\|sphere_locked\|unlock_missing\|trait_missing`) | `src/engine/encounters/nudges.ts` |
| Forecast | `ForecastModifier` w/ `NUDGE_MODIFIER_SOURCE_PREFIX 'nudge:'`, `TRAIT_MODIFIER_SOURCE_PREFIX 'trait:'`; five tier words | `nudges.ts`, `outcomeForecast.ts` |
| Riders | pure `StepOutcome` remap, zero PRNG draws, `NUDGE_RIDER_PRIORITY` | `nudges.ts`, `data/nudge-constants.ts` |
| Difficulty words | `DIFFICULTY_WORD_BANDS` (severe/steep/fair/gentle) | `data/nudge-constants.ts` |
| Motive | `classifyMotive` → BY CHOICE / A MISSION / CHANCE / THE GOD'S HAND | `encounters/motiveClassifier.ts` |
| Broken state | `brokenState.ts` behind `BROKEN_GATE_ENABLED=false`; `quintessenceToWord()` lexicon | engine/types |
| Trait gates | `requiredTraits`/`blockedByTraits` declared (THR-801) + six-site resolver (THR-786); **62 authored-ref repairs = THR-800, in queue** | filter pipeline |
| Debug | `__DEBUG.getEncounterNudges(agentRef)`, `getBrokenAgents()` (`debug-bridge.d.ts:759,787`) | bridge |
| **Commit path (GAP — WS2 builds it)** | `activeNudges` (`unifiedAction.ts:1394`) is declared with readers (`unifiedActionResolution.ts:400,579`, bridge) but **no writer** — the known optional-field-no-writer failure mode. WS2 owns the write, the essence spend at commit, and the `nudge_played` emit (below). The legacy `handleEncounterIntervene` path is not reused. | WS2 |
| Stage host | `src/components/Game/encounter-stage/` (adapters incl. `buildUnifiedEncounterStageModel`, shells, types, narrativeLinker) | components |
| Pause | THR-668 interrupt registry (`interruptModalOpen`); `story_beat` tier pauses auto-resolve | GameView |
| Icons/art | `public/assets/reaches/<reach>-<tier>.png`, `public/icons/spheres/*.png`; branching `illustrationUrl` art; EntityVisual fallback (THR-637) | assets |

Gap consumed as designed: WS4's image manifest is not built — both tickets use the **fallback chain** (specific art → `imageTag` lookup *when the manifest exists* → category generic → EntityVisual gradient+glyph) so neither blocks on WS4.

---

## § WS1 — THR-774: the builder pipeline

Rebuild the encounter authoring skills so every encounter authored or rewritten from now on ships nudge-native. Files: `.claude/skills/encounter-pipeline/**`, `.claude/skills/template-encounter-rewrite/**`, encounter sections of `prose-content-systems`; `Docs/canon/encounters.md` updated to point at the new spec; `Docs/plans/2026-04-16-systemic-wiring-guide.md` gains the nudge-hand + trait-hook capability rows.

**The authored unit (the skills' new checklist, in authoring order):**
1. **Vignette**: scene prose per the prose rubric (below); motive hooks declared (which sources can route here); quintessence stakes stated (erosion class of the encounter).
2. **Test panel data**: per step — reach(es) with a purpose line (≤4 words, plain), difficulty (0–1 → the word bands render it), `FACTOR_LINES_MIN`–`FACTOR_LINES_MAX` (2–4) **factor lines** (for/against, concrete, each names its source; trait-derived factors name the trait — canon rule 1).
3. **The hand**: 4–8 authored `StepNudge`s per nudge-bearing step. Rules: per-encounter specific by default; generics only from the shared generic pool (documented in the skill with the current list); **sphere coverage ≥4 spheres** across the hand; ≥1 common (sphere-less) option; trait-only options where a `traitVariant` exists; every `fiction` line passes the concreteness rubric (witnessed physical cause); `effectLine` in words, never percentages; costs ≥0 (0 reserved for trait options); riders rare and justified in a code comment.
4. **Band prose**: all six `StepOutcome`s covered (near_miss is a failure texture); **every band must read correctly with any subset of the hand active** — nudge-specific payoffs go in `bandProse` riders, never in the base band text; **every nudge carries at least one failure-band fragment** (the god's hand must be traceable in failure at any size — program ruling: payoff at every band); nudges with `forecastDelta ≥ NUDGE_BIG_DELTA` must cover **both** `failure` and `critical_failure`.
5. **Trait hooks step (mandatory)**: for each encounter ask gate? variant? trait-only nudge? trait fragment? — hooks may only reference traits that `validateTraitRefs()` does **not** report as dead (THR-800 tracks the 62 dead refs; the allowed set is everything the sweep passes, growing as THR-800 repairs land).
6. **Aftermath**: prizes/tolls/seeds as object references (ids the modal system resolves), tolls in words.
7. **Images**: `imageTag` per nudge + scene tag per encounter from the manifest vocabulary (fallback chain until WS4 lands); the ≥3-unrelated-encounters genericity test documented.
8. **Evidence**: register scorer + abstraction/vagueness detectors on all new prose. **Detector spec (WS1 writes this into the skill verbatim):** vagueness lexicon = something, anything, nothing, thing, things, way, ways, somehow, whatever, somewhere (target zero); annotation patterns = a 'not … but' clause within one sentence, and an em-dash followed by 'not' (≤1 per encounter); abstraction-as-subject spot check per the 2026-07-25 assessment. **Shared generic pool (initial; WS1 owns the canonical list in the skill):** focus/steady-breath class, moment's-luck class, blessing class (unlock-gated), oath/word class, light-in-dark class, strength-surge class — six families, extended only by editing the skill's list.

**Register assignment per authored field (prose canon):** `name`/`effectLine`/factor lines = interactive-plain (hard plainness rule — the picturable-anchor rule applies to prose fields, never labels); scene/`fiction`/band base = baseline; final-step band prose and the fate-reveal line = peak-eligible. Absent declaration = baseline. **Terminology:** mechanical band-remap riders (`no_crit_fail` etc.) are *riders*; `bandProse` entries are **band fragments** — the THR-782 UL entries shipping with WS1 disambiguate both.

**Prose rubric (hard rules, from the 2026-07-25 pilot + abstraction assessment):** every sentence carries a picturable anchor; abstractions only as stakes and cashed in-sentence; "something/thing/way" target zero; ≤1 not-X-but-Y per encounter; god-action as witnessed effect; card-discipline budgets (scene ≤60w, factor ≤12w, fiction ≤30w, band base ≤60w, rider ≤25w — named in the skill, warn-level).

**Pillar note:** WS1 is Content-pillar with a narrow declared `src/` surface: the golden-exemplar fixture and the authoring-guardrail constants module (below) — nothing else; Engine otherwise N/A (consumes WS0 as-is; any schema gap found is a filed deferral, never an inline patch), UI N/A (WS2). Browser-verify exempt: skill-tree + docs PR. Done-when: both skills rewritten with `last_validated_against` bumped; one **golden exemplar encounter** at `src/data/__fixtures__/nudge-exemplar/darkhollow-vault-exemplar.ts` exporting `NUDGE_GOLDEN_EXEMPLAR: UnifiedActionTemplate` (the mockup's Darkhollow Vault, authored end-to-end; in no shipped pool). Assertion contract (additive in `nudgeModel.test.ts`): hand within guardrails, ≥4 spheres, ≥1 common option, every nudge ≥1 failure-band fragment, all six bands authored, a trait hook present, register scorer + detectors pass. WS2's Done-when may use a minimal dev fixture until the exemplar merges (parallel-safety preserved); the exemplar becomes the evidence template once both land; canon page updated; wiring-guide rows added; **THR-782's UL entries land with this ticket** (Nudge / Broken mortal state / Rebuild Road / Dissolution threshold — unblocked since WS0 merged; the skills this ticket rewrites teach that vocabulary, so the shard entries ship in the same PR); `lint:plan-doc`-class advisory checks green.

## § WS2 — THR-775: the interface

Replace the authored-choices stage content with the nudge flow inside the **existing** encounter-stage architecture. Named seams: extend `encounter-stage/adapters/buildUnifiedEncounterStageModel.ts` (nudge phase in the stage model), new `encounter-stage/shells/NudgePhaseShell.tsx` (test panel + hand + fate reveal), new component-local hook `useNudgeHand` (toggle state → pure `nudges.ts` calls), and the commit handler in `GameView` (writes `activeNudges`, spends essence, emits `nudge_played`) — the legacy `handleEncounterIntervene` stays for `authoredChoices` templates. No new mount, no new modal host; THR-668 interrupt registration inherited.

**Stage flow (mockup v3 → components):**
1. **Header**: hero art (existing `illustrationUrl` → fallback chain) + **motive strip** (chip from `classifyMotive` + one authored sentence; chip opens the motive modal).
2. **Test panel**: agent portrait (EntityVisual; generic portrait until WS4), reach icons at legible size w/ tier + purpose line, difficulty word, for/against factors (authored + `outcomeForecast.factors` incl. live `trait:*`/`nudge:*` modifier lines), forecast word (tier CSS classes; numerals never render — the tier word is the only probability surface).
3. **The hand**: cards from `NudgeHand`, rendered by a **per-`NudgeBlockedCode` policy** (Vision audit): `playable` rendered; `essence_unavailable` rendered **visible-dimmed with its reason** (live budget state inside one encounter — hiding it makes cards flicker as the player toggles spends; mockup v3's approved behavior); `sphere_locked` and `unlock_missing` **hidden in the player stage** per ruling 4 (the replayability pool — a deliberate, stated divergence from the mockup's teaching-dimmed rendering, whose role moves to the designer view); `hidden` (`trait_missing`) never rendered; card = art (fallback chain) + name + sphere icon tag + cost + `effectLine`; toggling recomputes the forecast live (pure `nudges.ts` calls — no tick advance); commit spends essence via the WS0 path; stacking per rulings.
4. **Let fate decide** → resolution proceeds; **fate reveal**: band chip + fate image (generic thread set now; per-Reach when WS4 lands) + band prose with active `bandProse` riders appended.
5. **Aftermath**: overview + chips; **every game object is a clickable modal** (attachments/conditions via EntityVisual descriptor + stats; seeds; quintessence icon + `quintessenceToWord` word; trait chips). Tolls in words.
6. **Rulebook flip (in this ticket's scope)**: the WS0 rulebook edit tagged the nudge-model rules `[DESIGN]` and delegated the `[IMPL]` flip to WS2 — this PR flips them (incl. the named critical-failure/`no_crit_fail` amendment) since the interface shipping is what makes the rules real.
7. **Designer view**: DebugPanel toggle (not in-stage) revealing numbers behind words + dimmed/withheld cards with `NudgeBlockedCode` reasons.

**Design-system conformance (required):** shared primitives only (Modal max-height 85vh, `Dropdown` portal caveat — accessibility-tree evidence for portalled panels per THR-754); EntityVisual for all object art; tier/band colors from the existing CSS classes; viewport contract 1920×1080 (`h-screen flex flex-col overflow-hidden`, internal scroll only); no new fonts/colors outside the design tokens.

**Wiring:** stage model adapter reads `nudges.ts` hand + forecast; commit path calls the WS0 essence spend; `story_beat` promotion already pauses — the stage's nudge phase inserts before resolution for the promoted action only; **WS2 owns the `nudge_played` emit at the commit site** — the trace type is declared (`trace.ts:321,612,2105`) with zero emit sites today, and its payload (`forecastBefore/After`, `essenceSpent`) exists only at commit; `worldVersion` selectors per the touch API (no graph-identity memos). GameState: no new fields (hand state is component-local; committed ids ride the in-flight action per WS0).

**Migration/compat:** templates with `authoredChoices` and no `nudges` keep rendering the legacy choice screen until WS5 converts them — the stage branches on data presence, so the rollout is per-template and reversible; no flag day.

**Done-when (browser-verified per DoD):** seeded run, promote an encounter on a nudge-bearing template (the WS1 golden exemplar wired into a dev fixture), play two nudges, watch the forecast word move, roll fate, open three aftermath modals — captured at 1920×1080 with console output and `__DEBUG.getEncounterNudges` assertions; plus the legacy-template screen still rendering (compat proof).

---

## Shared sections

**Constants (new). Placement rule per the NFP audit:** runtime-consumed constants stay in `data/nudge-constants.ts`; the authoring-only guardrails (`NUDGE_HAND_MIN/MAX`, `HAND_SPHERE_COVERAGE_MIN`, `NUDGE_BIG_DELTA`, `FACTOR_LINES_MIN/MAX`) live in an authoring/lint-side module (not the client bundle) — they gate skills and advisory lint, never gameplay:

| Constant | Default | Purpose |
|---|---|---|
| `NUDGE_BIG_DELTA` | 0.15 | forecastDelta at/above which BOTH failure bands need fragments (every nudge needs ≥1 regardless — WS1 checklist rule) |
| `NUDGE_HAND_MIN` / `NUDGE_HAND_MAX` | 4 / 8 | authored hand size guardrails (warn-level, skills + advisory lint). **Not the rejected "fixed action count / capped action slots"**: these are per-step *authoring* ranges for hand quality, enforced at warn level at authoring time — the renderer draws whatever `playable` contains, uncapped, and the pool stays open-ended and data-driven |
| `HAND_SPHERE_COVERAGE_MIN` | 4 | distinct spheres per hand (warn-level) |
| `FACTOR_LINES_MIN` / `FACTOR_LINES_MAX` | 2 / 4 | factor lines per step (authoring, warn-level) |
| word budgets (WS1) | see rubric | named in the skill, warn-level |

**Tracing:** no new trace *types*; WS2 emits the already-declared `nudge_played` at nudge commit (one per played nudge — player-action-driven, low volume, ring-buffer safe). All other inspection via designer view + `__DEBUG`.

**Fail-soft:**

| Failure | Behavior |
|---|---|
| Template has neither `nudges` nor `authoredChoices` | linear auto-resolve stage as today |
| `imageTag` unresolvable / manifest absent | fallback chain ends at EntityVisual gradient+glyph — never blocks render |
| `classifyMotive` unavailable/throws | motive strip renders CHANCE with generic sentence |
| Essence race at commit | WS0 pre-roll rejection surfaces as the card snapping back + toast; never post-roll |
| Legacy `authoredChoices` template | legacy screen path preserved until WS5 conversion |

**Blast Radius:** WS2 touches `src/components/Game/encounter-stage/**` (component-local) + one adapter; no ≥100-importer file is edited by either ticket (types landed in WS0). WS1's `src/` surface is exactly two leaf files (fixture + authoring-constants module), disjoint from WS2's components — parallel-safety holds.

**Interface impact:** consumes contracts registered by THR-773/786 (nudge hand, forecast modifiers, motive read, trait gates) — all **preserve**; adds none. The stage-model adapter's new reads ride the existing Encounters rows; no `interface-contracts.ts` changes.

**Kill criteria:** WS2 is wrong if the stage needs GameState fields or a new modal host (design says component-local + existing hosts — needing more means the adapter seam was misjudged; stop and re-design, don't patch). WS1 is wrong if the golden exemplar can't be authored inside the checklist as written (every rule the exemplar violates gets fixed in the skill, not waived). Revert: WS2 branches on data presence (remove nudges → legacy screens); WS1 skills are git-revertible with no runtime coupling.

**Three-pillar checklist:** Engine — WS0 consumed + WS2's commit-path build (declared) + WS1's two leaf files (declared); Content — WS1 checklist + exemplar + UL; UI — WS2 stage flow + conformance section; Wiring — per-seam list above, debug visibility via designer view + `__DEBUG`. **Browser-verify tools named:** Playwright (DOM stage) for screenshots/console at 1920×1080; portalled panels evidenced via accessibility tree per THR-754; no WebGL surface touched. **Brainstorm companion:** `2026-07-27-nudge-encounter-experience-ws1-ws2-brainstorm.md`.

**Coordination blocks (per ticket):**
- **THR-774 (WS1)** — Suggested model: opus (authoring-system rewrite + exemplar prose). Files: `.claude/skills/encounter-pipeline/**`, `.claude/skills/template-encounter-rewrite/**`, `prose-content-systems` encounter sections, `Docs/canon/encounters.md`, wiring-guide, UL shards (THR-782), `src/data/__fixtures__/nudge-exemplar/**`, authoring-constants module, `nudgeModel.test.ts` (additive asserts). Parallel-safe with: THR-775, THR-777, THR-800. Mutex with: none (file-disjoint from WS2).
- **THR-775 (WS2)** — Suggested model: opus (UI + commit-path build). Files: `src/components/Game/encounter-stage/**` (adapter, new shell, hook), `GameView` commit handler, DebugPanel designer-view tab. Parallel-safe with: THR-774, THR-777. Mutex with: any ticket editing `encounter-stage/**` (none in queue).

## NFP compliance

| NFP | Verdict |
|---|---|
| 1 Tunability | PASS — all new numbers named; authoring guardrails in a lint-side module, not the client bundle |
| 2 Inspectability | PASS — `nudge_played` emitted at commit (WS2-owned); designer view; named factors/modifiers |
| 3 Determinism | PASS — live recompute calls pure `computeForecast` (verified: no rng parameter); zero draws |
| 4 Fail-soft | PASS — table above; legacy branch on data presence |
| 5 Narrative over mechanical | PASS — misfire fragments mandatory per nudge; register-per-field assignments |
| 6 Additive | PASS — legacy screens preserved per-template; per-code hand policy is a documented divergence |
| 7 Performance budget | PASS — O(hand) recompute; no tick-loop additions |


## Forked-audit verdicts

**NFP auditor (opus, 2026-07-27): REVISE → integrated.** Two false substrate claims corrected: `nudge_played` was declared with zero emit sites (WS2 now owns the emit at commit, stated in Wiring + Tracing); `activeNudges` had readers but no writer — the commit path (write + essence spend) is now an explicit WS2 GAP row in the substrate table. `NUDGE_HAND_MAX` explicitly distinguished from the rejected capped-action-slots approach; authoring-only constants moved to a lint-side module out of the client bundle; factor-line counts named.

**Three-pillar auditor (opus, 2026-07-27): REVISE → integrated.** The WS1 no-src contradiction resolved (declared two-leaf-file surface: exemplar fixture + authoring-constants module; Blast Radius updated). Golden exemplar fully specified (path, export, assertion contract, WS2 fallback fixture preserving parallel-safety). WS2 seams named (adapter, `NudgePhaseShell`, `useNudgeHand`, GameView commit handler). Per-ticket coordination blocks, three-pillar checklist, browser-verify tools, and the NFP table added.

**Vision auditor (opus, 2026-07-27): REVISE → integrated.** The blocking find: WS0 routes `essence_unavailable` into `dimmed`, so hiding all non-playable cards would make unaffordable cards flicker in/out as the player toggles spends — contradicting approved mockup behavior. Fixed with a per-`NudgeBlockedCode` render policy (essence visible-dimmed; sphere/unlock hidden per ruling 4 as a stated divergence; trait-missing never). Notes integrated: register assigned per authored field; riders vs band fragments disambiguated for the UL; the misfire rule widened — every nudge carries ≥1 failure-band fragment, big-delta nudges cover both failure bands.

## Intent-judge verdict

Round 1 (opus, cold): **Revise** — rulebook-flip ownership, THR-782 sequencing, `withheld`→`hidden`, THR-800 rule inversion. Integrated. Round 2 (cold re-read): **Allow** — 0 GAPs, 0 VIOLATIONs; residual handoff step (doc path into both issue descriptions before transition) executed at handoff.
