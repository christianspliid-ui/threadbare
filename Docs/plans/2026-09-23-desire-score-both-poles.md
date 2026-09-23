> **title:** A scene draws both poles of the value it is about — THR-1525
> **linear_issue:** THR-1525
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `done` · Content `done` · UI `N/A — selection weights have no player-facing surface of their own; see § UI pillar`

# A scene draws both poles of the value it is about — THR-1525

*The desire score has read `motivations` as "which side of this value the scene is for" since the day it was written, while every author wrote it as "which value the scene is about" — so every flaw-leaning mortal has been starved of the scenes about them.*

## Why this is load-bearing

`computeDesireScore` (`src/engine/encounterScoring.ts`) sums the **signed** axiological value over a template's `motivations`. Its docstring says it uses absolute values "so both poles contribute positively to desire"; the code never did (`git log -L` shows one commit, 2026-03-30 — code and docstring disagreed from birth). The positive pole of every `ValuePair` is the virtue (`src/types/agent.ts` convention), so the signed reading hands every value-tagged scene to the virtue side and floors the flaw side at `MINIMUM_DESIRE`. THR-1524 measured the sharpest symptom — A Bargain at the Crossroads fired once in 1000 ticks and was refused, because its accept arm sits on the negative pole of the axis it selected on — but the defect is corpus-wide: `ENCOUNTER_TYPE_MOTIVATIONS` makes theft draw the honest (`steal` → `honesty_cunning`), duels draw the merciful, and four encounter types draw the Sworn over the Renegade; undertakings follow the same habit (`strategic_establish_spy_network` → `honesty_cunning`). Roughly half the population sits on the flaw side of any given axis (seed 42: 34 of 65 lean novelty).

**Director ruling (Christian, chat 2026-09-23, recorded on the ticket):** option 1 — the engine reading. `motivations` names what a scene is *about*; mortals who lean strongly **either** way are drawn to it. Plus an additive, optional **pole pin** for the rare template that should draw one side only. A census of authored intent runs before the flip.

What this unblocks: every spec-authored fork becomes reachable by both arms' mortals, the authoring spec stops instructing authors into a starvation trap, and the villains of the world — Conquerors, Puppeteers, Heretics, Renegades, Magnates — reach the scenes written about them.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `encounter` — `encounterScoring.ts` desire pipeline (steps 7–9 of `scoreAndSelect`) | 🟢 ACTIVE | **extends** — `computeDesireScore` gains the pole reading + optional pins; no new pipeline |
| `decision` — `decisionBoard.ts` `computeBoardDesireMultiplier` (undertakings) | 🟢 ACTIVE | **extends** — same function, same change; the THR-1349 neutral branch for empty sets is untouched |
| `encounter` — `encounterCache.ts` cache entry (copies `tmpl.motivations`) | 🟢 ACTIVE | **extends** — copies the new optional pin map alongside |
| Divine value-overlay delta (THR-641, `encounterScoring.ts` step 7a) | 🟢 ACTIVE | **extends** — the delta keeps its formula (`score(with) − score(without)`) and so inherits the new reading; semantics restated below |
| `ENCOUNTER_TYPE_MOTIVATIONS` (`src/types/encounter.ts`) | 🟢 ACTIVE | **unchanged** — its rows were authored in the absolute reading and become correct as written |
| Nudge authoring spec step 6 + `check:encounter` | 🟢 ACTIVE | **extends** — spec text amended; one new warning |

Runtime population consumed: every mortal with an `AxiologicalProfile` × every template carrying `motivations` (all encounter templates — ~308 draw from the type table, the rest are literal sets — and every undertaking, `undertaking-motivations.test.ts` pins that none is silent). No new node, edge, or phase.

## Engine pillar

### Systems design

1. **New named constant** `DESIRE_SCORE_POLE_MODE: 'absolute' | 'signed'` in `src/data/agent-behavior-constants.ts`, default `'absolute'`. `'signed'` reproduces today's behaviour exactly; it exists so the before/after census runs on one build and so the reading is a tunable, not a code path (NFP #1). Register it in `src/components/CMS/tunableConstants.ts` next to `MINIMUM_DESIRE`.
2. **New types** in `src/types/agent.ts`, next to `ValuePair`:
   ```ts
   /** Which pole of a named motivation a template draws, when it should draw only one (THR-1525). */
   export type MotivationPole = 'positive' | 'negative';
   /** Optional per-axis pins. An axis absent here draws both poles. */
   export type MotivationPoles = Partial<Record<ValuePair, MotivationPole>>;
   ```
3. **Additive optional field** `readonly motivationPoles?: MotivationPoles` on `UnifiedActionTemplate` (`src/types/unifiedAction.ts`) and `StrategicActionTemplate` (`src/types/strategicAction.ts`), and `motivationPoles?: MotivationPoles` on `EncounterCacheEntry`, copied in `encounterCache.ts` where `motivations` is copied (`motivations: [...tmpl.motivations]`, ~line 233).
4. **`computeDesireScore(motivations, profile, poles?)`** — per motivation `m`, with `v = profile[m] ?? 0`:
   - `poles?.[m] === 'positive'` → `v`
   - `poles?.[m] === 'negative'` → `-v`
   - otherwise → `DESIRE_SCORE_POLE_MODE === 'absolute' ? Math.abs(v) : v`

   Rewrite the docstring to say exactly this. It is currently the only true sentence about the design and the only false one about the code.
5. **Callers pass the pins:** `encounterScoring.ts` step 7 and step 7a pass `entry.motivationPoles`; `computeBoardDesireMultiplier(motivations, profile, ambitionBoost, poles?)` passes them through, and its caller(s) pass `template.motivationPoles`. Grep `computeBoardDesireMultiplier(` and `computeDesireScore(` for the full caller set before editing — the design session found three call sites (`encounterScoring.ts` ×2, `decisionBoard.ts` ×1).
6. **Comment/docstring corrections, same PR:** `encounterScoring.ts` step-7 comment ("raw signed alignment") and step-7a comment; `decisionBoard.ts` THR-1349 docstring paragraph that says a mismatched set floors because "mortals genuinely should not pursue what they do not value" — under the new reading the floor catches **indifference** (near-zero on every named axis) and **pinned opposition**, not the opposite pole. The THR-1349 neutral branch for an *empty* set stays exactly as it is.

### Graph nodes / edges

None. `motivationPoles` is template data internal to the template (a property, not a relationship), so the edges-not-properties rule does not apply.

### Tick phases

None added or moved. The change is inside the scoring function called from the agent-decision phase (encounter scoring) and the decision board (undertakings).

### Resolution logic

- **Unpinned axis:** a mortal at −0.9 on the axis now scores the scene exactly as a mortal at +0.9 does. A mortal at 0 on every named axis scores `0` → floors at `MINIMUM_DESIRE ** PERSONALITY_SCORE_EXPONENT`, as today.
- **Pinned axis:** identical to today's signed reading for the pinned direction, mirrored for a `'negative'` pin.
- **Divine overlay delta (step 7a):** remains `score(profile) − score(profileWithoutDivine)`. Under the absolute reading it now means *how much the god's influence intensified the conviction this scene is about*, in either direction; the receipt already keeps only positive mass. A god pushing a mortal across zero can produce a negative delta that the receipt drops — accepted, and stated in the step-7a comment.
- **Forks:** the fork's own `decidedBy` resolution is untouched. What changes is who *arrives* at the fork: naming the fork axis in `motivations` now draws both arms' mortals.

### PRNG callouts

None. No random draw is added; the seeded weighted pick downstream is unchanged.

## Content pillar

### Encounter templates

1. **Authored-intent census (runs before the flip; first commit of the executor's branch).** Membership predicate (THR-688 rule A): *every template in the live encounter registry and in `getAllStrategicTemplates()` whose `motivations` is a literal authored set (not a reference to `ENCOUNTER_TYPE_MOTIVATIONS`)*. For each member, a pin is authored **only** when there is written evidence the author meant one pole: (a) a code comment on the template giving a pole or archetype as the reason the axis is named (e.g. "draws the Protector"), or (b) a plan doc / status fragment stating it. Template titles and themes are **not** evidence — the ruling's default is both poles, and the burden sits on the pin. Output: a table (template id · axis · pole · evidence link) in the status fragment; an empty table is a valid, expected result.
2. **Fork audit (same pass).** Membership predicate: every branch with `decidedBy.axis` whose template also names that axis in `motivations`. These are the forks this change un-starves; list them in the status fragment with before/after firing counts from the selection census.
3. **A Bargain at the Crossroads stays as it is.** Its THR-1524 content workaround (selecting on `revelation_discretion`) is a sound choice in its own right per its comment (an Eye-reach scene selecting on its Eye axis). Do not revert it; update the comment's rationale sentence, which cites the signed sum as the reason.
4. **No other `motivations` set is rewritten.** The flip fixes them as written.

### Prose tables

N/A — no prose changes; selection weights do not alter any rendered sentence.

### Attachment content

N/A — attachments carry no `motivations`.

### Data tables

- `DESIRE_SCORE_POLE_MODE` constant (above). `ENCOUNTER_TYPE_MOTIVATIONS` unchanged.

### Authoring surfaces

- **Spec step 6** (`.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`, "name the value axis it runs on (`motivations`)"): add that `motivations` names what the scene is *about* and draws mortals who lean strongly either way; `motivationPoles` exists for the rare scene one side should seek, and **pinning a fork's own axis draws only one arm's mortals** — do it only when that is the point. Bump the skill's `last_validated_against`.
- **`check:encounter` warning** (`scripts/check-encounter.ts`): warn when a template pins (`motivationPoles`) the axis one of its own branches decides on (`decidedBy.axis`). A warning, not an error — a one-arm draw can be intended.
- **UL:** add a `Motivations` entry (template field; names the values a scene is about; both poles drawn; optional pole pin) to the shard that holds encounter-template vocabulary, `See also` → `AxiologicalProfile`, `ValuePair`. Agent-seated under the 2026-09-11 blanket delegation for UL seating.

## UI pillar

UI: N/A — the desire score has no player-facing surface: the player observes its effect only as *which mortals end up in which scenes* during ordinary play, and no component reads `computeDesireScore`, `motivations`, or the new pin map. The existing debug inspection already covers it (below). No file under `src/components/`, `src/hooks/`, `src/contexts/` or `src/index.css` changes except the CMS tunables registry row, which is a data list rendered by an unchanged component. **Browser-verify exempt: engine + content only; the one `src/components/CMS/tunableConstants.ts` row is registry data.** UI Laws engaged: none.

### Debug inspection (DebugPanel)

The candidate trace already records `axiologicalScore` and `personalityBias` (`src/types/trace.ts` ~:1718). Their values change meaning, not shape; update the field JSDoc to say "absolute over unpinned axes, signed over pinned ones (THR-1525)". Add one optional field `pinnedAxes?: number` (count of pinned motivations on the candidate) so a trace reader can tell a pinned score from an unpinned one without opening the template.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md` — no new module, modal, or GameState field, so no checklist row is added; the executor confirms the existing encounter-scoring and decision-board rows still describe the path.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `encounterScoring.computeDesireScore` | agent decision (encounter scoring) | none | none | existing candidate trace (`axiologicalScore`, `personalityBias`, new optional `pinnedAxes`) | trace viewer; CLI `agent <name>` |
| `decisionBoard.computeBoardDesireMultiplier` | agent decision (decision board) | none | none | existing board trace | trace viewer |
| `encounterCache` entry build | cache rebuild (structural) | none | none | none | CLI `eval` on cache entries |
| `DESIRE_SCORE_POLE_MODE` | read at scoring | CMS tunables list | none | none | `?view=cms` tunables |
| `check-encounter.ts` pin-on-fork-axis warning | authoring time | none | none | CLI warning line | `npm run check:encounter` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `DESIRE_SCORE_POLE_MODE` | `'absolute'` | How an unpinned motivation reads the profile: `'absolute'` draws both poles (the design); `'signed'` reproduces the pre-THR-1525 virtue-only draw, for census comparison and rollback |
| `MINIMUM_DESIRE` (existing) | `0.05` | Unchanged — now floors indifference and pinned opposition |
| `PERSONALITY_SELECTION_WEIGHT` (existing) | `2.0` | Unchanged |
| `PERSONALITY_SCORE_EXPONENT` (existing) | `1.5` | Unchanged |

## Tracing

No new trace type. One additive optional field on the existing encounter-candidate trace record:

```ts
// On the existing encounter candidate trace entry (src/types/trace.ts, near axiologicalScore)
/** THR-1525: how many of the candidate's motivations carry a pole pin (0 or absent = both poles drawn on every axis). */
pinnedAxes?: number;
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `motivationPoles` names an axis not in `motivations` | Ignored at scoring (only named motivations are summed); `check:encounter` does not need to catch it, but the executor may add it to the same warning |
| `motivationPoles` value is neither `'positive'` nor `'negative'` (hand-built pack) | Treated as unpinned — the mode reading applies |
| `motivationPoles` absent | Every axis unpinned — the default path |
| Profile lacks the axis | `profile[m] ?? 0` as today → contributes 0 |
| `DESIRE_SCORE_POLE_MODE` set to an unknown string | Treated as `'absolute'` (the ruled design) |

## Interface impact

`Docs/canon/interface-map.md` names no contract that reads or writes the desire score or `motivations`. **Preserve** — no row changes. The THR-1524 "Last-reviewed" note that cites the signed sum is historical and stays as written.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | ~475 importers | One additive **optional** field on `UnifiedActionTemplate`; no existing object literal needs it, no narrowing changes. Type-check ratchet must show zero net-new errors |
| `src/types/strategicAction.ts` | ~114 importers | Same — one additive optional field |
| `src/engine/encounterScoring.ts` | ~21 importers | `computeDesireScore` gains an optional third parameter; existing two-argument calls keep compiling |

**Behavioural blast radius is the real one:** every mortal's encounter and undertaking mix shifts on the first tick. That is the intended effect; the selection census below measures it before merge.

## Tests (executor owns the full list — grep, do not trust this one)

Known to pin the signed reading and to need rewriting, not deleting:
- `src/engine/__tests__/encounterScoring.test.ts` — "sums motivation values from profile" (`0.8 + −0.3 = 0.5` → `1.1` under absolute); add pinned-positive, pinned-negative, and `'signed'`-mode cases.
- `src/engine/__tests__/decisionBoard.test.ts` — "does NOT loosen the mismatch case" (−0.9 unpinned now scores like +0.9): rewrite so a **pinned**-opposed set still floors and an indifferent (all-zero) set still floors below the empty-set neutral.
- `src/data/encounters/__tests__/vertical-slice.test.ts` THR-1524 block "a negative-pole planting arm does not select on its fork axis" — its premise dies. Replace with the pin-aware form: *a fork whose planting arm is pole P must not pin its own axis to the opposite pole*. Keep the Crossroads settings assertion.
- Candidates to check (grep hits on `axiologicalScore` / `opposed` / `computeDesireScore`): `culturalGravity.test.ts`, `decisionBoardLiveness.test.ts`, `phaseAgentDecision.unified.test.ts`, `phaseAgentDecision.gateDutySupport.test.ts`, `interventionCost.test.ts`, `detailPageGenerator.test.ts`, `opposition-content.test.ts`.

New: **a liveness test on a generated world** — for a template naming axis A, two mortals mirrored on A (+x / −x, otherwise identical) get equal desire multipliers; falsify by setting `DESIRE_SCORE_POLE_MODE = 'signed'` and confirming the red.

## Selection census (Done-when evidence; CLI / headless per THR-688 rule C)

Run on seeds 42 and 99, `medium`, 200 ticks (the THR-1524 horizon), once with `DESIRE_SCORE_POLE_MODE = 'signed'` (local, uncommitted) and once as shipped. Extend `scripts/content-model-census.ts` or add a sibling script — executor's call. Report per seed:
1. **Pole balance, magnitude-matched.** Desire scales with |v| under the absolute reading, so a raw headcount comparison would fail whenever flaw- and virtue-leaners differ in *how strongly* they lean. Instead, bin mortals by |v| on the picked template's first named axis (`[0.1, 0.4)`, `[0.4, 1.0]`; below 0.1 is neutral and excluded) and, per bin, compare the **per-capita** value-tagged pick rate of flaw-leaners to virtue-leaners. Pass: under `'absolute'` the ratio sits in **[0.8, 1.25]** in every bin with ≥5 mortals on each side; under `'signed'` it is expected to sit far below 0.8 (that gap is the defect, and printing it proves the census can see it). The raw headcount share is printed alongside as a diagnostic only. **The precise gate is the mirrored-mortal liveness test** (§ Tests); this census confirms the effect survives a real world.
2. **Forks:** firings per fork from the fork-audit list, both modes.
3. **Health:** total encounter picks per tick and idle rate, both modes, printed side by side. Not a gate — a shift is expected — but a collapse (idle rate doubling) is a stop-and-surface.
4. **Undertakings:** the same pole-balance line for undertaking picks.

## Kill criteria

- **Before merge:** under `'absolute'`, if idle rate at least doubles or total picks per tick collapse on either census seed, stop and surface it — do not ship a flip that empties the board. If the magnitude-matched pole-balance ratio misses its band, diagnose before merging (a caller not passing pins through, a cache entry missing the field).
- **After merge:** if the world's scene mix reads wrong in play, set `DESIRE_SCORE_POLE_MODE = 'signed'` (one constant, restores the pre-THR-1525 reading exactly) and file a retune ticket; do not revert the types or the pins.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (census, spec step 6, `check:encounter` warning, UL entry)
- [x] UI pillar N/A with rationale (no player-facing reader; debug trace covered)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it restores one (`Vision/00-north-star.md`: the player watches mortals of every kind accumulate a story; `02-non-negotiables.md` #2 narrative over mechanical perfection; `03-design-tensions.md` tension #2, systemic emergence vs. authored moments, is served by the fork audit and the evidence-only pin rule). The world is meant to generate stories for *every* kind of mortal, and a god's most interesting subjects include the ruthless and the cunning; a draw that starved the flaw poles of their own scenes worked against the living-world premise.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: *which mortals a scene draws*. `Docs/canon/rulebook.md` gains one `[IMPL — THR-1525]` sentence in §7 Encounters and Aftermath: *a scene names the values it is about, and mortals who feel strongly either way are drawn to it; a scene may be pinned to one side.* The quick-reference card is unchanged (it does not describe selection).
- [x] `Docs/canon/rulebook.md` is updated in the executor's implementation PR (listed in Files to touch and Done when), not in this plan-doc PR — the sentence is `[IMPL]` and must land with the code it describes.

> Brainstorm companion: `Docs/plans/2026-09-23-desire-score-both-poles-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | The reading is a named constant (`DESIRE_SCORE_POLE_MODE`); existing weights unchanged |
| 2. Inspectability | PASS with note | No new trace type; existing candidate trace fields re-documented, one optional `pinnedAxes` count added |
| 3. Determinism | PASS | No randomness added; `Math.abs` is pure |
| 4. Fail-soft | PASS | See fail-soft table — every malformed pin degrades to "unpinned" |
| 5. Narrative over mechanical perfection | PASS | The change exists for story reach: villains reach their scenes, forks reach both arms |
| 6. Additive over destructive | PASS with note | New optional field, new optional parameter, new constant; the one behaviour change is the ruled design, and `'signed'` keeps the old reading one constant away |
| 7. Performance budget | PASS | One `Math.abs` and one optional map lookup per motivation per candidate — negligible against the scoring loop |

## Done when

- [ ] Authored-intent census and fork audit tables are in the status fragment; pins authored only for rows with written evidence (an empty pin table is acceptable)
- [ ] `computeDesireScore` implements the absolute / pinned reading behind `DESIRE_SCORE_POLE_MODE`; docstrings and comments in `encounterScoring.ts` and `decisionBoard.ts` say what the code does
- [ ] Mirrored-mortal liveness test green, and shown red under `'signed'`
- [ ] Selection census printed for seeds 42 and 99, both modes; magnitude-matched pole-balance criterion met under `'absolute'`
- [ ] Wiring guide **Capability 31 § 4** revised so its THR-1524 guidance (select on a different axis than the fork because the sum is signed) matches the both-poles reading; `Docs/status/2026-09-22-thr-1524.md` is historical and stays as written
- [ ] Spec step 6 amended; `check:encounter` warns on a pin over a template's own fork axis (falsified by a fixture)
- [ ] UL `Motivations` entry; rulebook sentence; wiki pages `agents-reference` and `encounters-manual-reference` updated (blocking `check:wiki-freshness` gate — both list `encounterScoring.ts` in their sources; `divine-actions-reference` also matches via `unifiedAction.ts`, where the change is one optional type field — a `Wiki-freshness-exempt:` line is the right answer for that page only); systemic wiring guide documents `motivationPoles` as a template field
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build` pass; 30-tick CLI smoke
- [ ] Closing commit body and PR body carry the close keyword for THR-1525 on its own line
- [ ] `Browser-verify exempt: engine + content only; the CMS tunables row is registry data` in the commit body

## Coordination block

**Suggested model:** opus — the change is small but the census is judgment work and the test rewrites must preserve what each old test was defending.

**Parallel-safe with:** THR-1522, THR-1528 (location/battle traits — no desire-score or spec surface); THR-1529 (process fix, no `src/engine/`).

**Mutex with:** THR-1526 (both amend `nudge-authoring-spec.md` step 6 and add a warning to `scripts/check-encounter.ts`); THR-1523 (its fix for the spotlight swap pool is expected to land in `src/engine/decisionBoard.ts` — reversible if its plan stays out of that file).

**Files to touch:**
- Edit: `src/engine/encounterScoring.ts` (pole reading, pins, comments)
- Edit: `src/engine/decisionBoard.ts` (pass pins, docstring)
- Edit: `src/engine/encounterCache.ts` (copy `motivationPoles`)
- Edit: `src/types/agent.ts` (`MotivationPole`, `MotivationPoles`)
- Edit: `src/types/unifiedAction.ts`, `src/types/strategicAction.ts` (optional field)
- Edit: `src/types/trace.ts` (optional `pinnedAxes`, JSDoc)
- Edit: `src/data/agent-behavior-constants.ts` (`DESIRE_SCORE_POLE_MODE`), `src/components/CMS/tunableConstants.ts` (registry row)
- Edit: `src/data/encounters/vertical-slice.ts` (Crossroads comment rationale only)
- Edit: tests listed above; create the mirrored-mortal liveness test
- Edit: `scripts/check-encounter.ts`; census script (extend or create)
- Edit: `.claude/skills/encounter-pipeline/reference/nudge-authoring-spec.md`, UL shard, `Docs/canon/rulebook.md`, `public/agents-reference.html`, `public/encounters-manual-reference.html`, `Docs/plans/2026-04-16-systemic-wiring-guide.md`

## Notes for the executor

- **Do not** rewrite `ENCOUNTER_TYPE_MOTIVATIONS` or any literal `motivations` set to "fix" it — the flip is the fix.
- **Do not** add pins from titles or themes. "The Traitor's Approach" is *about* loyalty; both the Sworn and the Renegade should want to be in it.
- **Do not** touch the THR-1349 empty-set neutral branch.
- The divine-overlay receipt may show slightly different numbers on the same seed after the flip. That is the new reading, not a regression.
- If the census finds a template whose pin evidence is ambiguous, leave it unpinned and list it in the status fragment. The default is both poles.

## Intent-judge verdict

**Allow** (Opus 5.5 judge, 2026-09-23; the specified `fable` judge hit its usage limit and the judge ran on Opus — parity per the skill's "model parity or better" rule, noted as a partial anti-correlation slip). Impact class raised Reversible → **External** (the plan edits `nudge-authoring-spec.md`, a skill other agents follow). Two GAPs, both folded in before commit: (dim 2) wiring guide Capability 31 § 4 now named in Done-when; (dim 10) kill criteria carried into this doc, and the census pole-balance bar made magnitude-matched so it cannot fail while the reading works.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability PASS (`DESIRE_SCORE_POLE_MODE` named, CMS-registered). Inspectability PASS-with-note — `pinnedAxes` is a count, so a trace reader cannot tell *which* axis is pinned without opening the template; accepted: the template id is on the same trace record and the pin map is static template data. Determinism, Fail-soft, Narrative, Performance PASS. Additive PASS-with-note — the default flips corpus-wide selection on the first tick; accepted as the ruled design with `'signed'` as a one-constant rollback.

### Three-pillar audit

PASS. Engine and Content present-and-substantive; UI N/A with rationale, debug inspection still filled. Wiring table maps all five modules. Substrate inventory cross-checked against `Docs/canon/systems-inventory.md` (`encounter`, `decision` rows) — every row extends or leaves unchanged; nothing green-fielded.

### Vision audit

PASS-with-notes. No contradictions. Non-negotiables #2 (narrative), #4 (graph — pin map correctly judged template-internal), #6 (additive) confirmed; tension #2 (emergence vs. authored moments) handled by the fork audit and evidence-only pins; taste profile respected (no numeric player surface). Note: premises engaged by implication rather than citation — addressed by citing `00-north-star.md`, `02-non-negotiables.md` and `03-design-tensions.md` in § Vision audit.
