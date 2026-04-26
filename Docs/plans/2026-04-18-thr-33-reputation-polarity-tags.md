# THR-33 · Reputation Polarity Tags on Existing Encounters

**Linear:** THR-33 (Project: Content Architecture)
**Status:** Ready for Dev (design complete)
**Author:** Cowork (design), Claude Code (implementation)
**Date:** 2026-04-18

---

## Summary

Currently, every encounter success routes through `determinePolarity()` in `phaseReputationTraits.ts`, which runs a three-layer cascade:

1. **Layer 1** — explicit `reputationPolarity` tag on the template (the only layer this issue touches)
2. **Layer 2** — `encounterType` heuristic: `assist|build|create|lead` → positive; `steal|duel` → negative
3. **Layer 3** — the agent's `axiologicalProfile` tiebreaker on the reach's value pair; `null` if profile is neutral

Layers 2 and 3 are working, but they leak polarity on two kinds of templates: (a) encounters whose `encounterType` falls outside the Layer-2 sets (`explore`, `trade`, `acquire`, `hire`, `threaten`, `discovery`) and whose polarity is nonetheless unambiguous from the fiction; and (b) encounters inside the Layer-2 sets whose *actual* fiction inverts the heuristic (an honorable sparring `duel`, a coercive `assist`). For these, the template ships with the wrong moral valence or — worse — a valence that depends on the agent's unrelated axiological profile instead of the authored intent.

This issue adds **explicit `reputationPolarity` tags** to templates where the correct answer is knowable from the authored fiction, letting content authors override Layer 2/3 with one line. No engine changes. No new surfaces. Pure Content pillar work.

**Scope cap:** up to 40 templates tagged this pass, prioritized by rubric below. Templates whose polarity legitimately varies by branch/outcome stay untagged — Layer 2/3 remains the correct fallback for ambiguous fiction.

---

## Current template population (grep of `src/data/**/*-content.ts`)

| encounterType | count | Layer 2 default | Needs explicit tagging? |
|---|---|---|---|
| `explore` | 79 | — (falls to L3) | yes — when framing is forbidden/trespass (→ negative) or pilgrimage/discovery (→ positive). Leave neutral explorations untagged. |
| `duel` | 66 | negative | rarely — tag only when the duel is sanctioned/honorable sparring (→ positive). Default is already correct. |
| `assist` | 53 | positive | rarely — tag only when assistance is coerced or transactional extortion (→ negative). |
| `lead` | 48 | positive | rarely — tag only when leadership is explicit tyranny/conquest (→ negative). |
| `trade` | 41 | — (falls to L3) | yes — fair-exchange/generosity (→ positive), price-gouging/coerced/smuggling (→ negative). The majority are context-dependent and stay untagged. |
| `build` | 33 | positive | rarely — tag only when building is destructive or exploitative (→ negative). |
| `steal` | 31 | negative | rarely — tag only when theft is ordeal/Robin-Hood (→ positive). Default is already correct. |
| `create` | 27 | positive | rarely — tag only when creation is forbidden/hubristic. |
| `acquire` | 18 | — (falls to L3) | yes — legitimate acquisition (→ positive), coerced/forceful (→ negative). |
| `hire` | 13 | — (falls to L3) | yes — above-board commissions (→ positive), assassination/catspaw (→ negative). |
| `threaten` | 1 | — (falls to L3) | yes — always negative. |
| `discovery` | 1 | — (falls to L3) | typically positive. |

**Addressable population by uncovered type (L2 falls through):** ~153 templates (`explore`, `trade`, `acquire`, `hire`, `threaten`, `discovery`). Of these, expect ~30–40 to have definitive polarity from the fiction; the rest stay untagged.

**Addressable population by L2 inversions:** ~258 templates in the covered sets. Expect **very few** (≤5) to invert the default — these are the exceptions, not the rule.

**Target: ≤40 tags applied this pass.** Don't over-tag. If a template's polarity depends on branch outcome, leave it untagged.

---

## Three-Pillar Coverage

### Engine pillar — N/A (system shipped)

The three-layer `determinePolarity()` cascade (`phaseReputationTraits.ts:124`) is already wired. Layer 1 reads `template.reputationPolarity` when present and returns it verbatim. The field is defined in `src/types/encounter.ts:248` (`'positive' | 'negative'` optional). **No type, engine, or test-infrastructure changes.**

### Content pillar — primary work

Audit and tag templates per the rubric below. Single-line additions to existing template literals across the `src/data/**/*-encounter-content.ts` files.

### UI pillar — N/A (tags are author-facing metadata)

`reputationPolarity` is never rendered to the player. It changes which `reputationTallies` key an agent's success contributes to, which eventually feeds trait assignment and encounter gating already covered by UI work in Content Architecture / Social Systems. **No new notifications, toasts, chronicle entries, HexMap signifiers, or DebugPanel work.** (One optional improvement in the Nice-to-have section.)

---

## Tagging Rubric (six rules)

A template gets an explicit `reputationPolarity` tag **only if** it satisfies rule 1 AND any of rules 2a–2e.

**Rule 1 — The fiction is unambiguous across all success branches.**
If the template has an authored choice card where one branch is clearly virtuous (sparing a captive, honoring a debt) and another is clearly vicious (executing the captive, reneging), the template's polarity varies by outcome and **cannot** be tagged at the template level. Skip. (These cases are better served by per-branch `reputation_tally` aftermath effects — already the dominant pattern in the migrated content.)

**Rule 2a — L2 fallthrough + positive fiction.** `encounterType ∈ {trade, acquire, hire, explore, discovery}` and the opening beat names an honorable / lawful / communal act. **Tag `'positive'`.**

**Rule 2b — L2 fallthrough + negative fiction.** Same types plus `threaten`, and the opening beat names theft-under-color-of-trade, extortion, coercion, trespass on forbidden ground, contract killing, smuggling of banned goods. **Tag `'negative'`.**

**Rule 2c — L2 inversion, honorable `duel`.** `encounterType === 'duel'` but the template frames it as sanctioned court-sanctioned single combat, trial-by-combat for justice, or ritual sparring for respect. **Tag `'positive'`.** Expect ≤3 templates to qualify.

**Rule 2d — L2 inversion, coerced `assist`/`lead`/`build`/`create`.** `encounterType ∈ {assist, build, create, lead}` but the template frames it as slave labor, press-ganged militia, forced construction, or tyrannical rule. **Tag `'negative'`.** Expect ≤3 templates to qualify.

**Rule 2e — L2 inversion, just `steal`.** `encounterType === 'steal'` but the template frames it as reclaiming stolen property, Robin-Hood redistribution, or breaking an unjust lock. **Tag `'positive'`.** Expect ≤2 templates to qualify.

**Rule 3 — Always tag `threaten`.** Layer 2 doesn't cover it. It's always negative. The single current `threaten` template gets `reputationPolarity: 'negative'`.

**Inline comment convention.** Every explicit tag gets a one-line `//` comment on the same line giving the reason. This makes the rubric readable in diffs and in later audits:

```ts
encounterType: 'trade',
reputationPolarity: 'negative', // coerced tribute framed as trade (2b)
```

---

## Implementation Workflow (for CC)

1. **Read the rubric.** Re-read rules 1 and 2a–2e above.
2. **Sweep the uncovered types first.** In order: `threaten`, `discovery`, `trade`, `acquire`, `hire`, `explore`. For each template, read the `narrativeTemplates.initiation` / step 0 prose. If rule 1 holds AND rule 2a or 2b fires, add the tag with inline comment. Otherwise skip.
3. **Sweep the L2-covered types second.** Only look for clear inversions (rules 2c/2d/2e). Most templates keep the Layer-2 default. **If in doubt, leave untagged** — Layer 2 is already correct for the majority.
4. **Cap at 40 tags.** If the sweep would exceed 40, prioritize the uncovered-type wins (rules 2a/2b/3) over inversions (rules 2c/2d/2e). The first-time coverage has higher marginal value than the inversions.
5. **Author audit commit.** Single commit: `content: tag reputationPolarity on <N> high-value encounter templates (THR-33)`.
6. **Pre-commit trio.** `npm test`, `npx tsc --noEmit`, `npx vite build`. All three must pass.
7. **Codex review: NO** — this is mechanical metadata tagging, no new logic, no schema changes, minimal regression risk. Standard test suite catches any tag that references an invalid literal.
8. **Definition of Done.** Closing commit includes `Fixes THR-33`. Update `Docs/changelog.md` and `Docs/project-history.md`. Confirm issue auto-closes from the commit keyword — no other closeout action required.

---

## Constants Table (NFP #1)

No new constants. This issue wires existing data surfaces only. The polarity literal type `'positive' | 'negative'` is defined in `src/types/encounter.ts:248` and `src/types/agent.ts` (`REACH_VALUE_PAIR`).

## Tracing (NFP #2)

No new traces. Existing `reputation_trait` tally traces (emitted at `phaseReputationTraits.ts:189–199`) already include `polarity` in their payload. After this issue, those traces will more often carry `"polarity":"positive"` vs `"negative"` from **Layer 1** instead of Layer 2/3 — DebugPanel and trace export already surface this.

## Fail-soft Table (NFP #4)

| Failure | Behavior |
|---|---|
| Tag value is a string literal typo (e.g., `'Positive'`) | TypeScript compile error. Caught pre-commit by `tsc --noEmit`. Cannot ship. |
| Template with tag has `encounterType` not in REACH heuristic sets | Layer 1 wins — `determinePolarity()` returns the tagged value before consulting Layer 2. By design. |
| Template with tag has no `reachPrimary` | `processReputationTally()` still needs `reach = template.reachPrimary` to form the tally key. If `reachPrimary` is missing, the tally step returns early — same behavior as untagged templates. No regression. |
| Tag contradicts the branch-specific `reputation_tally` aftermath | The tag sets the Layer-1 default for base tally increments on step success (`processReputationTally`), while aftermath `reputation_tally` effects are *additional* deltas from authored branches. They coexist; the tag is the floor, the aftermath adds on top. Rule 1 avoids tagging templates where this coexistence would be confusing. |
| Missing axiological profile on agent | Unchanged — Layer 3 returns `null`, no tally; Layer 1 (this issue's tag) would have fired first if present. Tagging *increases* tally coverage for neutral-profile agents. Desirable. |

## PRNG Usage (NFP #3)

None. Polarity determination is a pure function. No randomness introduced.

## NFP Compliance Table

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | No new constants; enum `'positive' \| 'negative'` is the tunable surface and already exists. |
| 2. Inspectability | PASS | Reuses existing `reputation_trait` traces; adds no new trace types. DebugPanel unchanged. |
| 3. Determinism | PASS | Tagging is deterministic; no PRNG. |
| 4. Fail-soft | PASS | All failure modes produce safe fallbacks (table above). Compile-time guard on the enum catches typos. |
| 5. Narrative over mechanical perfection | PASS | Rubric explicitly favors narrative fidelity (what the scene *means*) over heuristic convenience (what the `encounterType` says). |
| 6. Additive over destructive | PASS | No field removals; no type changes; no renames. Pure additions of a pre-existing optional field. |
| 7. Performance budget | PASS | `determinePolarity()` cost unchanged — Layer 1 was already the first check. Tag presence short-circuits faster than Layer 2's set lookup. Net improvement (negligible). |

---

## Target count and distribution (CC's planning number)

- **Rule 3 (threaten):** 1 tag (guaranteed).
- **Rules 2a + 2b (L2 fallthrough types):** expect 20–30 tags across `trade`, `acquire`, `hire`, `explore`, `discovery`.
- **Rules 2c + 2d + 2e (L2 inversions):** expect ≤8 tags total.
- **Cap:** 40 tags this pass. Under-tagging is preferred over over-tagging — Layer 2/3 handles the unambiguous common case correctly.

If CC finishes the sweep and has applied <15 tags, that's fine — the population of truly unambiguous cases may simply be smaller than the ceiling suggests. Ship what's rubric-clean.

---

## Nice-to-have (out of scope — defer if found during work)

1. **DebugPanel column in the encounter inspector** showing which polarity layer (1/2/3) fired for a given encounter success. Not required for this issue — open a fresh issue if deemed useful during implementation.
2. **`polarity_source` trace field** (`'explicit' | 'heuristic' | 'axiology' | 'none'`) on `reputation_trait` tally traces. Same deferral logic — file as a new issue if helpful during QA.

Both would be additive, tiny, and non-blocking. File as follow-up deferrals only if they came up naturally — don't pre-schedule them.

---

## Verification items (for CC to check at start)

1. **`reputationPolarity` field type** — confirm `src/types/encounter.ts` declares `reputationPolarity?: 'positive' | 'negative'` on `EncounterTemplate`. If it's under `UnifiedActionTemplate` only, the `determinePolarity()` path still applies; just ensure you're editing the right template shapes. (As of design time, the field lives on the union type consumed by `determinePolarity()`.)
2. **Template literal discipline** — when you add `reputationPolarity: 'negative'`, ensure surrounding template fields (`reachPrimary`, `encounterType`) remain valid — some content files use `satisfies` or `as const` patterns that would flag a malformed object. `tsc --noEmit` catches this.

Both are trivial and should not block.

---

## Why this deserves a design doc (vs. "just tag them")

Three reasons the rubric matters more than the tags themselves:

1. **Layer 2/3 already exist and work.** The wrong heuristic is to tag every template to "be explicit" — that would obscure the signal of which templates genuinely invert the default. A deliberate, under-tagged set is more maintainable than a fully-tagged set.
2. **`reputation_tally` aftermath effects are the richer tool** for branch-varying polarity. This doc is deliberate about not displacing them — it clarifies where the template-level tag is the right tool (unambiguous fiction) vs. where per-branch aftermath is (branch-varying fiction).
3. **The rubric gives future content authors a decision procedure.** New templates (e.g., in Encounter Format Migration, Social Systems Expansion) can consult this doc to decide whether to ship with a tag or rely on Layer 2. Without the rubric, every author re-derives the rule from scratch and the tag population drifts.
