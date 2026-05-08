---
status: current
title: THR-345 (G3) — Encounter Content Lint Spec
date: 2026-05-07
linear: THR-345
parent_plan: 2026-05-05-encounter-ui-implementation-phasing.md
audience: codex
---

# THR-345 (G3) — Encounter Content Lint Spec (2026-05-07)

**Status:** Tightened Codex spec for THR-345 (Phase G3). Sharpens the phasing-plan §3 G3 entry and design-plan §12 "Content lint tests" entry into a binary, file-list-anchored execution plan suitable for Codex pickup.

**Audience:** Codex executor.

**Inputs (read these first):**

- Phasing plan: `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 Phase G3
- Design plan: `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §12 (test strategy — Content lint tests), §4.1 (encounter contract YAML), §4.2 (cosmological pattern table), §4.3 (prose authoring discipline), §4.4 (tooltip authoring resolves to graph entities)
- Contract types: `src/types/encounter-contract.ts`
- Existing Zod validator: `src/data/encounter-contract-validators.ts` (already enforces some rules — see §2 below)
- Existing adapter: `src/engine/encounter-contract-adapter.ts` (produces stub contracts from `UnifiedActionTemplate`s)
- World model: `src/data/world-model.json` (canonical graph nodes — for tooltip + item cross-references)
- Vision tone bar: `Vision/taste-profile.md` §"Meeting-encounter prose" + project memory `feedback_prose_quality_bar`

**Why this spec exists.** The phasing-plan G3 entry lists the rules but leaves implementation choices (where to scan, what threshold to use for prose-quality, how to wire CI, what a "known-bad fixture" looks like) to the executor. Codex needs binary acceptance — this spec pins each rule to concrete pass/fail criteria, names every file path, and removes design judgment from the implementation.

---

## 1. Goal and scope

Add a content-time lint that gates encounter content authored in the `EncounterContract` shape. Catches authored-content violations of the load-bearing rules from design plan §4 at build time, not at runtime.

**Output:**

1. New script `scripts/lint-encounter-content.ts` runnable via `npm run lint:encounter-content`.
2. Five lint rules implemented (see §3 below).
3. CI wiring so failures block merge.
4. Fixture sets at `src/data/__fixtures__/encounter-content-lint/{good,bad}/*.ts` covering every rule.
5. Vitest test at `src/data/__tests__/lint-encounter-content.test.ts` exercising the lint runner against both fixture sets.

**Out of scope:**

- Authoring new encounter content. The lint runs against any present `EncounterContract` literal; if there's no content yet, the lint runs against the adapter's defaults plus the fixture corpus.
- Replacing the existing Zod validator. The lint **wraps** Zod — it parses each contract via the existing `parseEncounterContract` first, then layers the additional rules on top.
- Changing the contract schema. If a rule needs additional schema state, file a follow-up ticket; do not edit `src/types/encounter-contract.ts` in this ticket.

---

## 2. What's already enforced (do NOT re-implement)

The existing `src/data/encounter-contract-validators.ts` already enforces:

- All field presence/type rules from design plan §4.1
- `forecast_factors`: 1–3 entries, each non-empty
- `moral_axis_pole` valid for `reach` (via `MORAL_AXIS_POLES_BY_REACH` / `QUINTESSENCE_POLES` — `isPoleAllowedForReach` helper)
- `cast.representation === 'faction_chip'` requires `attention_priority === 'offstage'`

The lint script **must call `parseEncounterContract`** first per contract; Zod errors are reported as lint failures with the same severity as rule violations.

**Do not duplicate Zod's checks in the new lint rules.** If a rule already lives in Zod, the lint depends on Zod and adds nothing.

---

## 3. The five lint rules (binary, mechanical)

Implement each as a pure function `(contract: EncounterContract, registry: GraphRegistry) => LintIssue[]`.

### Rule R1 — Tooltip references resolve to graph entities

**Per design plan §4.4.** Every key in `beats[i].prose_tooltips` is a phrase; every value is a graph-entity ID. The value must resolve to a node in `world-model.json` or the in-memory content registry.

**Pass:** every `prose_tooltips` value either (a) appears as a node ID in `src/data/world-model.json`, or (b) appears as a known content-registry ID (see §4 for the resolution path). Empty `prose_tooltips` records pass trivially.

**Fail:** any `prose_tooltips` value not resolvable. Report with `path: ['beats', i, 'prose_tooltips', phrase]` and the unresolvable ID.

**Severity:** error (blocks CI).

### Rule R2 — `consumes_item` references an item the actor can have

**Per design plan §2.4.** When a choice declares `consumes_item: <id>`, the item must be either (a) listed in `protagonist_view.items_relevant`, or (b) resolvable as an item-typed node in `world-model.json` (category `attachment` / subcategory `item`, or whatever the canonical item taxonomy is at lint time — read `src/data/world-model.json` to ground this).

**Pass:** every `consumes_item` value is either in `items_relevant[]` or resolves to an item node in the world model. Choices without `consumes_item` pass trivially.

**Fail:** `consumes_item` references neither. Report with `path: ['beats', i, 'encounter_choices', j, 'consumes_item']` and the unresolvable ID.

**Severity:** error.

### Rule R3 — `forecast_factors` strings contain no digits

**Per design plan §5.2 ("No numbers. Ever. Per taste-profile.").** The forecast band is qualitative; numeric digits in factor strings break that rule.

**Pass:** every entry of every beat's `forecast_factors` matches the regex `/^[^\d]*$/` (no Unicode digits anywhere — use `\d` with the `u` flag if relevant, simple ASCII digit check is sufficient for v1).

**Fail:** any digit in any factor string. Report with `path: ['beats', i, 'forecast_factors', j]` and the offending string.

**Severity:** error.

### Rule R4 — `forecast_factors` strings contain no probability words either

**Spin-off of R3 to enforce the spirit.** Forecast factors must be narrative; words like `"likely"`, `"probably"`, `"50%"`, `"chance"`, `"odds"`, `"percent"` violate the qualitative-only rule.

**Pass:** no entry contains any of the banned phrases (case-insensitive substring match): `likely`, `unlikely`, `probably`, `chance`, `odds`, `percent`, `%`, `probability`.

**Fail:** any banned phrase present. Report with the offending phrase named.

**Severity:** error.

### Rule R5 — Prose quality soft heuristic

**Per design plan §4.3 (no flowery drift) and project memory `feedback_prose_quality_bar`.** Soft heuristic — counts flagged phrases per beat's `prose` and `aftermath.receipt`; emits a **warning** (not a failure) above threshold.

**Banned-flag word list (case-insensitive substring match):**

```
inexorable, ineffable, transcendent, sublime, eldritch, otherworldly,
gossamer, ephemeral, ethereal, primordial, ancient beyond reckoning,
shimmering, gleaming, glistening, glittering, scintillating,
whisper of fate, hand of destiny, weaver of threads,
mortal coil, sea of stars, tapestry of
```

(Codex: this list is intentionally short; expand the constant in a follow-up ticket if playtest shows under-coverage. Do not invent additional flags in this ticket.)

**Threshold:** ≥ 3 flagged phrases across a single beat's `prose` + the encounter's `aftermath.receipt` triggers a warning. ≥ 6 triggers a louder warning.

**Severity:** warning only. **Does not block CI.** Print the count, the offending phrases, and a one-line reminder: `"Prose quality bar: meeting-encounter prose. See Vision/taste-profile.md."`

**Why soft:** the bar is editorial judgment; we don't trust a regex to be the editor. The lint exists to surface the count for the author to consider, not to block.

---

## 4. Resolution: where graph entity IDs come from

Two sources, queried in this order:

1. **`src/data/world-model.json`** — load once at lint start; flatten to a `Set<string>` of all node IDs. This is the canonical graph.
2. **In-source content registries** — if the lint encounters an ID with a recognized prefix (e.g. starts with `condition.`, `item.`, `secret.`, `vow.`, `event.`), it should also accept those if they appear as exported IDs in `src/data/**/*.ts`. Codex: build this index by scanning `src/data/` for `as const` literals with `id:` properties. If the index is empty, fall back to world-model.json only.

**Concrete implementation:**

```typescript
interface GraphRegistry {
  nodeIds: Set<string>;            // from world-model.json
  contentIds: Set<string>;         // from src/data/**/*.ts (best-effort)
}

function resolves(id: string, registry: GraphRegistry): boolean {
  return registry.nodeIds.has(id) || registry.contentIds.has(id);
}
```

If `contentIds` is too hard to build in this ticket, ship with `nodeIds` only and file a follow-up. **Either path is acceptable** — the rule only fails if BOTH sets miss.

---

## 5. Where the lint scans

The lint script must find all `EncounterContract` instances in the repo. Two scanning paths:

1. **Adapter output** — call `adaptUnifiedActionTemplateToEncounterContract` (from `src/engine/encounter-contract-adapter.ts`) on every entry of `UNIFIED_ACTION_TEMPLATES` (from `src/data/unified-action-templates`). Each output is a contract subject to the lint.
2. **Authored fixtures** — load every `*.ts` file under `src/data/__fixtures__/encounter-content-lint/good/` and `src/data/__fixtures__/encounter-content-lint/bad/`. Each must export a default `EncounterContract`.

**For v1 of this lint, only paths 1 and 2 are required.** Future authored content (path 3 — `src/data/encounters/**/*.ts` or similar) lands in a follow-up ticket; the lint script must, however, accept a configurable glob so the future scope is one-line to extend.

---

## 6. Output format

Print to stdout. Exit code 0 on no errors (warnings allowed); exit code 1 on any error.

```
encounter-content-lint: scanning 119 contracts...

ERROR src/data/__fixtures__/encounter-content-lint/bad/forecast-with-digit.ts
  beats[0].forecast_factors[1]: forecast factor "iron-rooted, but 50% chance Halren is watching" contains digits (R3)

WARN  src/engine/encounter-contract-adapter.ts (adapted from template:guild_apply)
  beats[0].prose: 5 flagged phrases — inexorable, gossamer, ineffable, shimmering, mortal coil (R5)
  Prose quality bar: meeting-encounter prose. See Vision/taste-profile.md.

ERROR src/data/__fixtures__/encounter-content-lint/bad/dangling-tooltip.ts
  beats[0].prose_tooltips["the small folk's silence"]: vow.unknown_id is not in world-model.json or content registry (R1)

Summary: 119 contracts | 2 errors | 1 warning
```

Color/markdown is fine if `chalk` is already a dep; plain text is also fine.

---

## 7. Files to touch (exact list)

**Create:**

- `scripts/lint-encounter-content.ts` (new) — the lint runner. Bundle via esbuild like `validate-model` (use the same `--format=esm --external:fs --external:path` pattern from `package.json`).
- `src/data/__fixtures__/encounter-content-lint/good/full-valid.ts` (new) — one fixture covering every required field with valid values.
- `src/data/__fixtures__/encounter-content-lint/bad/forecast-with-digit.ts` (new) — fails R3.
- `src/data/__fixtures__/encounter-content-lint/bad/forecast-with-probability-word.ts` (new) — fails R4.
- `src/data/__fixtures__/encounter-content-lint/bad/dangling-tooltip.ts` (new) — fails R1.
- `src/data/__fixtures__/encounter-content-lint/bad/missing-consumes-item.ts` (new) — fails R2.
- `src/data/__fixtures__/encounter-content-lint/bad/flowery-prose.ts` (new) — triggers R5 warning (verifies warning emission, not a CI fail).
- `src/data/__fixtures__/encounter-content-lint/index.ts` (new) — barrel export of all fixtures.
- `src/data/__tests__/lint-encounter-content.test.ts` (new) — vitest suite that runs the lint runner against good/bad fixtures and asserts the issue list.

**Edit:**

- `package.json` — add `lint:encounter-content` script following the esbuild pattern of `validate-model` (line 27 in `package.json` is the canonical example). Wire it into `check:process` as a follow-on step or into a sibling `check:content` script — either is acceptable; pick whichever already exists in CI.
- `.github/workflows/*.yml` — locate the CI workflow file (it's referenced from CLAUDE.md "CI runs these automatically"). Add `npm run lint:encounter-content` as a step after `npm test` and before any deploy step. If multiple workflow files exist, wire it into the same one that runs tests/typecheck/build.

**Do NOT edit:**

- `src/types/encounter-contract.ts` (contract schema is settled)
- `src/data/encounter-contract-validators.ts` (Zod rules are settled)
- `src/engine/encounter-contract-adapter.ts` (adapter is settled)

If any of those need changes for this ticket, **stop and file a follow-up** — do not modify them in this PR.

---

## 8. Done when (binary checklist)

- [ ] `scripts/lint-encounter-content.ts` exists; runs via `npm run lint:encounter-content`; exits 0 on the good fixture, exits 1 on each bad fixture
- [ ] All five lint rules implemented per §3
- [ ] `src/data/__fixtures__/encounter-content-lint/good/full-valid.ts` — exists, passes lint with zero errors and zero warnings
- [ ] All five `bad/*.ts` fixtures exist; each exercises exactly one rule
- [ ] `src/data/__tests__/lint-encounter-content.test.ts` exists; ≥ 6 tests (one per fixture); `npm test` green
- [ ] `npm run lint:encounter-content` against `UNIFIED_ACTION_TEMPLATES` adapter output exits 0 (warnings OK; if any existing template fails an error rule, **stop and file a follow-up cleanup ticket** — do not patch templates in this ticket)
- [ ] `package.json` has the new script
- [ ] CI workflow runs `npm run lint:encounter-content` after `npm test`; failures block merge
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` clean
- [ ] `npm test` green
- [ ] Commit body includes `Fixes THR-345`

---

## 9. NFP compliance

| Priority | Status | Note |
|---|---|---|
| 1. Tunability | ✅ PASS | The R5 banned-phrase list and threshold (3, 6) live as exported constants in the lint script. Adjusting feel = changing a constant. |
| 2. Inspectability | ✅ PASS | Each issue carries `path`, `rule_id` (R1–R5), and `severity`. Output is grep-able. |
| 3. Determinism | ✅ PASS | Pure functions over inputs; no PRNG. |
| 4. Fail-soft | ✅ PASS | If `world-model.json` is missing/malformed, lint emits a single non-rule error and exits 1 (does NOT crash CI in a confusing way). If the content-registry index can't be built, the lint falls back to world-model only. |
| 5. Narrative over mechanical perfection | ✅ PASS | R5 is a warning, not a fail — leans toward editorial judgment over robotic enforcement. |
| 6. Additive over destructive | ✅ PASS | New script + new fixtures + new test. No existing files modified except `package.json` + the CI workflow. |
| 7. Performance budget | ✅ PASS | One-pass scan over the contract corpus. Adapter output is < 200 contracts in v1; lint runs in < 2s on a developer machine. |

---

## 10. Three-pillar coverage

| Pillar | Section |
|---|---|
| **Engine** | Lint script wraps existing Zod validator + new rule layer. No engine module changes. |
| **Content** | The lint *gates* future content authoring — it doesn't author anything. Fixture set is the only "content" produced, and the bad fixtures are intentionally invalid. |
| **UI** | N/A — content lint is a build-time gate; no player-facing surface. Marked N/A with rationale: this is a CI lint, not a feature. |

---

## 11. Coordination

- **Suggested model:** sonnet
- **Parallel-safe with:** all open Phase G tickets (THR-343, THR-344); THR-326, THR-328, THR-329 (B-phase Codex queue); THR-352, THR-353
- **Mutex with:** none
- **Codex review:** no (lint code; review via diff sufficient)
- **Files to touch:** see §7
- **Done when:** see §8

---

## 12. References

- `Docs/plans/2026-05-05-encounter-ui-implementation-phasing.md` §3 G3 — the original ticket lineage.
- `Docs/plans/2026-05-04-encounter-experience-design-plan.md` §4.1 (contract YAML), §4.3 (prose authoring discipline), §4.4 (tooltip authoring), §5.2 (forecast band), §12 (test strategy — content lint tests).
- `src/types/encounter-contract.ts` — the contract.
- `src/data/encounter-contract-validators.ts` — what's already enforced.
- `Vision/taste-profile.md` §"Meeting-encounter prose" — the prose quality bar.
- Project memory `feedback_prose_quality_bar` — confirms meeting-encounter prose as the editorial benchmark.
