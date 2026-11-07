> **title:** The scene picture speaks words, not the encounter's contract — THR-1733
> **linear_issue:** THR-1733
> **author:** Claude Code (tb-design-lane, run dl-20261107T1118)
> **created:** 2026-11-07
> **three_pillars:** Engine done (two stage view models + one shared helper) · Content N/A — no new prose; the fallback reads the encounter's existing name · UI done (no component change; the veil's scene picture reads the fixed model)

# The scene picture speaks words, not the encounter's contract — THR-1733

*A screen reader reading an encounter's opening picture must hear a scene, never several kilobytes of JSON.*

## Why this is load-bearing

The EncounterContract v1 migration stores each contract encounter's whole contract in the template's
`illustrationAlt` field as `__encounter_contract_v1:<JSON>`. Both stage view models copy that field
straight into the illustration's `alt`, and the veil renders it as the picture's `aria-label`. So for every
contract encounter with a real painting, a screen reader announces the encoded contract, and a broken image
would surface it as text.

That breaks UI Law 14 (*"No raw internal keys, ever"*, `Docs/design-system/laws.md` line 49) and the
Law 13 clarification at line 46 (*"An `aria-label` is player-facing prose"*). It is a bug, so it is agreed
(ways-of-working D2). The orchestrator staged it 2026-11-07 ~09:35Z.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Contract adapter (`src/engine/encounter-contract-adapter.ts`) | 🟢 ACTIVE | **extends** — exports one predicate beside the private `decodeContractMetadata` |
| Stage illustration helper (`src/engine/views/stage/encounterIllustration.ts`, THR-1800) | 🟢 ACTIVE | **extends** — gains `illustrationAltText(template)` beside `renderableIllustrationUrl` |
| Simple stage model (`src/engine/views/stage/buildSimpleEncounterStageModel.ts`) | 🟢 ACTIVE | one line changes |
| Unified stage model (`src/engine/views/stage/buildUnifiedEncounterStageModel.ts`) | 🟢 ACTIVE | one line changes |
| Encounter veil (`src/components/Game/EncounterVeil.tsx`) | 🟢 ACTIVE | unchanged — already renders `illustration.alt` as `aria-label` |

### Measured — where the payload enters `alt`

Grep `illustrationAlt` in `src/` on `origin/main` `f7f080dd`, tests and per-encounter data excluded:

```
src/engine/encounter-contract-adapter.ts:175:    illustrationAlt: encodeContractMetadata(parsed),
src/engine/encounter-contract-adapter.ts:262:  const fromMetadata = decodeContractMetadata(template.illustrationAlt);
src/engine/views/stage/buildSimpleEncounterStageModel.ts:363:        alt: template.illustrationAlt ?? `Scene from ${template.name}`,
src/engine/views/stage/buildUnifiedEncounterStageModel.ts:998:        alt: args.template.illustrationAlt ?? `Scene from ${args.template.name}`,
src/data/encounter-contract-builder.ts:210:    illustrationAlt: encodeEncounterContractMetadata(contract),
```

The two stage lines are the only places that turn `illustrationAlt` into player-facing text. The writers are
the adapter, the shared builder, and 23 per-encounter copies of `encodeEncounterContractMetadata` under
`src/data/encounters/` that all set an `illustrationUrl` too (`grep -l illustrationUrl | xargs grep -l
"illustrationAlt: encodeEncounterContractMetadata"` → 23). Every writer uses the same prefix
`__encounter_contract_v1` (`ADAPTER_CONTRACT_METADATA_KEY`, adapter line 26; the builder's and the 23 local
copies' `ENCOUNTER_CONTRACT_METADATA_KEY` hold the same literal).

Three mentorship templates carry a real authored `illustrationAlt` (e.g. `graduation.ts:190`, *"A workshop
or study at the end of a long apprenticeship…"*). Those must keep it.

### Measured — who renders it

`illustration.alt` reaches the player in one place: `EncounterVeil.tsx:257`,
`aria-label={illustration.alt ?? ''}` on the `role="img"` scene-art div (`data-testid="veil-scene-art"`).
The picture is a CSS background, so there is no `<img alt>`; the `aria-label` is the alt text.

## Decision

**Strip it in the view model, through one shared helper.** `encounterIllustration.ts` gains
`illustrationAltText(template)`, which returns the authored `illustrationAlt` when it is real prose and
`Scene from <name>` when it is absent, empty, or a contract payload. Both stage models call it. The
predicate that recognises a payload, `isEncounterContractMetadata(value)`, lives in the contract adapter
beside the decoder that already owns the prefix, so the prefix literal has one reader-side home.

Rejected: moving the contract off `illustrationAlt` into its own field. That is the real cure, but it
touches the builder, the adapter and 23 data files, and changes how every contract template round-trips.
Out of scope, as the ticket says. Rejected: guarding in `EncounterVeil` — a component should not know the
contract's storage trick, and the model is what the Done-when sweeps.

## Engine pillar

### Systems design

1. `src/engine/encounter-contract-adapter.ts` — add and export:
   ```ts
   /** True when an `illustrationAlt` holds an encoded contract, not prose (THR-1733). */
   export function isEncounterContractMetadata(value: string | undefined): boolean {
     return typeof value === 'string' && value.startsWith(`${ADAPTER_CONTRACT_METADATA_KEY}:`);
   }
   ```
   `decodeContractMetadata` may call it for its own prefix check; behaviour unchanged.
2. `src/engine/views/stage/encounterIllustration.ts` — add:
   ```ts
   /** The words a screen reader hears for the scene picture (THR-1733). */
   export function illustrationAltText(template: { illustrationAlt?: string; name: string }): string {
     const authored = template.illustrationAlt?.trim();
     if (authored && !isEncounterContractMetadata(authored)) return authored;
     const name = template.name?.trim();
     return name ? `${SCENE_ALT_PREFIX} ${name}` : SCENE_ALT_NAMELESS;
   }
   ```
3. `buildSimpleEncounterStageModel.ts:363` and `buildUnifiedEncounterStageModel.ts:998` — replace the
   `illustrationAlt ?? …` expression with `illustrationAltText(template)` / `illustrationAltText(args.template)`.

### Graph nodes / edges

None. No node, edge or property changes.

### Tick phases / resolution / PRNG

None. The stage models are read-only views; no random calls.

## Content pillar

N/A — no new prose. The fallback reuses the encounter's authored `name` and the existing `Scene from`
wording, now a named constant. Writing a per-painting description for each contract encounter would be
better alt text, but it is a content task over 23+ encounters, not this bug.

## UI pillar

No component change. The veil's scene picture (`EncounterVeil.tsx:257`) reads the fixed model.

### Player-facing text

What a screen reader announces on the opening step of *Road Ambush* (`liminal.quest.road_ambush`,
`name: 'Road Ambush'` at `road-ambush.ts:545`, painting `road-ambush.jpg`):

- Before: `__encounter_contract_v1:{"encounter":{"id":"liminal.quest.road_ambush",…` (several KB).
- After: `Scene from Road Ambush`.
- Empty name: `An encounter scene` (no trailing `Scene from `).
- A mentorship encounter keeps its authored sentence unchanged.

Complaint class **PC-3** (developer text in player prose, `Docs/ops/player-complaint-classes.md`): after
this plan no contract payload or id can reach the scene picture's label, and the catalogue sweep enforces it.

### UI Laws engaged

Law 14 (no raw keys — the fix), Law 13's `aria-label` clarification (an `aria-label` is prose), Law 1/21/33/37
untouched (no layout, type or colour change). Browser-verify tool: Playwright DOM read of the `aria-label`.

### Playtest signal

On any encounter's opening step, the accessibility name of `[data-testid="veil-scene-art"]` begins
`Scene from`, reads `An encounter scene`, or is authored prose — and never contains
`__encounter_contract_v1` or `{`. A cold tester's accessibility snapshot can confirm or refute it.

### Event notifications / Visual presence (HexMapV2) / Debug inspection

None / none / none new — the model's `illustration.alt` is visible in a unit test and in the DOM.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

- Orchestrator phase: none (view-time only).
- UI component: `EncounterVeil` via `StageHost`, unchanged.
- GameState flow / traces / prose pipeline / player controls: none.

## Interface impact

| Contract | Change |
|---|---|
| Contract adapter → stage views (new import of `isEncounterContractMetadata`) | **add** — a read-only predicate; no state crosses |
| Stage model `illustration.alt` → `EncounterVeil` | **preserve** — same field, same type, prose instead of payload |

No cross-system write; `Docs/canon/interface-map.md` needs no row unless the executor's interface-contracts
check asks for the new import.

## Constants table

| Constant | Default | Purpose | Home |
|---|---|---|---|
| `SCENE_ALT_PREFIX` | `'Scene from'` | the fallback alt's lead words (was an inline literal in two files) | `encounterIllustration.ts` |
| `SCENE_ALT_NAMELESS` | `'An encounter scene'` | fallback when the template has no name | `encounterIllustration.ts` |

## Tracing

N/A — a view-model string; no trace.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| `illustrationAlt` absent, empty or whitespace | `Scene from <name>` |
| `illustrationAlt` is a contract payload (valid or malformed JSON) | `Scene from <name>` — prefix test only, never parses |
| `name` empty or whitespace | `An encounter scene`; no throw |

## Done when

- [ ] `isEncounterContractMetadata` is exported from the contract adapter; `illustrationAltText` and `SCENE_ALT_PREFIX` from `encounterIllustration.ts`; both stage models call `illustrationAltText`.
- [ ] Unit test (new, `src/engine/views/stage/__tests__/illustrationAltText.test.ts`): payload → `Scene from <name>`; authored prose → itself; absent/empty alt → `Scene from <name>`; empty name → `An encounter scene`.
- [ ] Catalogue sweep (same file or beside it): for every shipped template with a renderable `illustrationUrl`, `illustrationAltText(template)` does not start with `__encounter_contract_v1` and is under 300 characters. Assert the sweep met at least 23 contract templates, so it cannot pass empty. It must fail if `illustrationAltText` returns `illustrationAlt` raw.
- [ ] Existing `buildSimpleEncounterStageModel.test.ts:145` (`'A gate at dusk'`) still passes — authored alt survives.
- [ ] `npm run gate` green (code track); 30-tick CLI smoke (engine files).
- [ ] One 1920×1080 screenshot of `?view=game&seeded&size=medium&spawn=liminal.quest.road_ambush` on the opening step, plus the DOM read of `[data-testid="veil-scene-art"]`'s `aria-label` quoted in the commit (small visible fix, ≤400 UI lines).
- [ ] Closing commit and PR body carry the line-anchored closer for this ticket.

## Kill criteria

- The road ambush does not open on a painted step under `?spawn=` → use any template from the sweep whose painting renders; name it in the commit.
- The adapter import into `views/stage` closes an import cycle → keep the predicate as a local prefix test in `encounterIllustration.ts`, importing only the exported `ADAPTER_CONTRACT_METADATA_KEY` constant.
- A later tester or audit hears JSON from any picture → another reader of `illustrationAlt` exists; grep and route it through `illustrationAltText`.

## Coordination block

**Suggested model:** sonnet — three small edits and one test file; the shape is fully specified.

**Parallel-safe with:** THR-2145 (outcome-node minter — different files), THR-2188 (draw/forecast code).

**Mutex with:** any ticket editing `src/engine/views/stage/build*EncounterStageModel.ts` or `encounterIllustration.ts`; none is open today.

**Files to touch:**
- Edit: `src/engine/encounter-contract-adapter.ts`
- Edit: `src/engine/views/stage/encounterIllustration.ts`
- Edit: `src/engine/views/stage/buildSimpleEncounterStageModel.ts`
- Edit: `src/engine/views/stage/buildUnifiedEncounterStageModel.ts`
- Create: `src/engine/views/stage/__tests__/illustrationAltText.test.ts`

## Notes for the executor

- `src/engine/` is touched, so the `review-gate` skill runs before auto-merge and the 30-tick smoke is owed.
- Do not move the contract off `illustrationAlt` and do not touch the 23 data files — out of scope.
- The ticket description's paths (`src/components/Game/encounter-stage/adapters/…`) are stale; the files moved to `src/engine/views/stage/`. Lines above are from `f7f080dd`.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar N/A with rationale
- [x] UI pillar present (no component change, surface named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it removes a machine leak from a player surface.
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play.
- [x] No `Docs/canon/rulebook.md` edit is needed.

> Brainstorm companion: `Docs/plans/2026-11-07-thr-1733-scene-picture-speaks-words-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | the fallback wording is a named constant |
| 2. Inspectability | PASS | the alt is a plain field on the model, unit-tested |
| 3. Determinism | PASS | pure string function |
| 4. Fail-soft | PASS | prefix test never parses or throws |
| 5. Narrative over mechanics | PASS | the picture is named as a scene |
| 6. Additive | PASS | two new exports; two call sites change text only |
| 7. Performance | N/A | one `startsWith` per opening render |

## Intent-judge verdict

Pass 1: **Revise** (dimension 12 — PC-3 not named, rendered sample given as a template, empty-name case not
quoted, playtest signal not a predicate). Fixed: PC-3 named, `Scene from Road Ambush` and `An encounter scene`
quoted, accessibility-name predicate added.
Pass 2 (cold re-run): **Allow** — Reversible; 0 GAPs, 0 VIOLATIONs. Advisory: the closeout should say in one
line that the ticket's four-part browser evidence was narrowed to screenshot + `aria-label` DOM read under the
small-visible-fix tier.

## Forked-audit verdicts

### NFP audit

NFP AUDIT: PASS-with-notes. Tunability, Determinism, Fail-soft, Narrative, Additive PASS; Performance N/A.
Inspectability PASS-with-note: the fallback substitution is untraced, reasonable for a pure view string.

### Three-pillar audit

PILLAR AUDIT: PASS. Engine present-and-substantive; Content N/A with rationale; UI present-and-substantive
(surface named, before/after text, Laws engaged). Wiring fits a view-only fix; no substrate collision.

### Vision audit

VISION AUDIT: PASS. No contradictions; no core-loop, non-negotiable or taste-profile touchpoint — a bug fix
with a fixed fallback.
