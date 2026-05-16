# THR-191 — ActionStepBranch scope: branching-encounter-exclusive (Lorekeepers Covenant deferral)

**Linear:** THR-191 · **Project:** Encounter Format Migration · **Type:** Infrastructure / Governance (docs) · **Date:** 2026-05-15 · **Author:** Cowork

> **Read this first.** This is a *governance* ticket, not a content or engine ticket. It resolves a deferred design question with a documented decision and a small, exactly-specified doc-edit pass. No template content changes. No engine code changes. All three feature pillars are N/A by design — see §4.

---

## 1. The deferred question

THR-191 was deferred from **THR-96** (Lorekeepers Covenant migration — 15 templates shipped). The THR-96 plan doc instructed the executor to use step-level `ActionStepBranch` per-step branching on "at least 3 templates" (`Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md` §"What to wire", item 5, and §"Definition of done"). The migration shipped with **zero** ActionStepBranch — the executor judged the existing systemic wiring (intelligence grants, encounter seeds, hidden marks, `{?has_artifact}` conditionals, aftermath reactions) sufficient and deferred the branching question.

THR-191's own description frames the choice precisely:

> **What's needed:** Design a per-step branching approach for guild templates that fits the `BranchAwareAftermathConfig` structure, **or document why ActionStepBranch is intentionally [scoped away from] guild templates.** Apply to Lorekeepers templates if decided.

This plan makes that decision.

## 2. Decision

**`ActionStepBranch` (step-level branching) is intentionally exclusive to *branching encounters* (`src/data/encounters/`). Linear-template encounters — guild, social, tavern, combat, borderland, including the 15 Lorekeepers Covenant templates — intentionally do NOT use step-level `ActionStepBranch`.**

The player-facing choice surface for a linear-template encounter is:

1. **Aftermath reactions** (`aftermathConfig.fallback.reactions`) — the primary choice surface. Each reaction is a genuinely different *path* (grant an intelligence record / plant an encounter seed / do nothing), not a re-skinned adjective. This satisfies the canon's Rule 1 ("path over adjective") at the linear-template scale.
2. **`BranchAwareAftermathConfig.variants`** keyed on an early-step `authoredChoices` `choiceId` — available *if* a linear template wants its aftermath to diverge by an in-quest choice. Today every guild template ships `variants: {}` (empty) + a `fallback`; populating `variants` is the sanctioned lever for richer linear-template choice. **This is noted as a separate, optional, format-level follow-up (see §6) — it is NOT THR-191 scope.**

Step-level `ActionStepBranch` — where the player's earlier choice swaps in an entirely different `ActionStep` (different reach, difficulty, duration, graph ops, prose) mid-resolution — remains the higher-cost authored-chapter primitive reserved for branching encounters authored via the `encounter-pipeline` skill.

### 2.1 Why this is the design-correct resolution

| # | Rationale |
|---|-----------|
| 1 | **Consistency with canon.** `Docs/canon/encounters.md` already defines two encounter subtypes — *branching* (`ActionStepBranch`, `encounter-pipeline`) and *linear template* (guild/social/tavern/combat/borderland, `template-encounter-rewrite`). The canon already *implies* this split; THR-191 makes it *explicit* and removes the ambiguity. The `template-encounter-rewrite` skill already says "This skill is NOT for branching encounters (the hand-authored `ActionStepBranch` format)." |
| 2 | **THR-96's instruction predates the subtype model.** The THR-96 plan doc is dated 2026-04-19; the canon page formalising the branching/linear split is dated 2026-05-07. The "use ActionStepBranch on 3 templates" instruction was written *before* the linear-template subtype existed as a codified concept. The canon supersedes the older plan doc — that is exactly the kind of reconciliation a Canon page exists to perform. |
| 3 | **The linear-template pipeline exists to avoid branch-authoring cost.** Adding `ActionStepBranch` to 15 templates means: adding `authoredChoices` to an early step in each, authoring per-variant `ActionStep` definitions, and per-variant aftermath. That is re-authoring them *as branching encounters* — which defeats the reason the linear subtype exists. |
| 4 | **NFP #6 — additive over destructive.** The 15 Lorekeepers templates ship, compile, fire in-sim, and meet the THR-96 systemic bar (intel grants, seeds, marks, `{?has_artifact}` conditionals, aftermath reactions). Rewriting working content to add a structural primitive the subtype model says it should not carry is destructive churn for no player-visible gain. |
| 5 | **The deferral's own finding.** THR-191's description: "The existing systemic wiring … covers the same systemic depth for Lorekeepers templates." The depth is present; it is delivered through conditionals + aftermath reactions rather than step-level branching. |
| 6 | **Engine already handles both subtypes uniformly.** Every consumer resolves `isActionStepBranch(stepOrBranch) ? stepOrBranch.fallback : stepOrBranch` (`encounter.ts`, `encounterCache.ts`, `encounterEventNode.ts`, `factionQuestGeneration.ts`, `socialEncounterGeneration.ts`, `unifiedActionLifecycle.ts`). A template that never uses `ActionStepBranch` is already a first-class citizen — no engine work is needed to "allow" linear templates to skip it. |

### 2.2 Rejected alternative — Option A (extend ActionStepBranch to the 15 templates)

Rejected. It would: (a) contradict the canon's subtype model, (b) require destructive rewrites of 15 working templates against NFP #6, (c) pay branch-authoring cost on ambient connective-tissue content whose deliberate role is *not* to be an authored chapter, and (d) deliver no player-visible improvement that the existing aftermath-reaction choice surface does not already provide. If a *specific* Lorekeepers template genuinely wants a mid-quest fork, the correct response is to **promote that one template to a branching encounter** via `encounter-pipeline` — not to bolt step branching onto the linear format.

## 3. Deliverable — exact doc-edit pass

CC's job is a precise documentation/governance pass across five surfaces plus one Linear follow-up. Exact text is provided so this is mechanical.

### 3.1 `src/types/unifiedAction.ts` — `ActionStepBranch` JSDoc

The `ActionStepBranch` interface JSDoc (currently ~line 583–586) is the surface a content author is most likely to read. Extend the existing comment block so it states the scope. Append to the existing JSDoc above `export interface ActionStepBranch`:

```
/**
 * A branching step definition — the step to execute depends on
 * which choice the player made at a prior step.
 * Discriminated from ActionStep by the presence of `branchOnStep`.
 *
 * SCOPE (THR-191): step-level branching is exclusive to *branching
 * encounters* in `src/data/encounters/` (authored via the
 * `encounter-pipeline` skill). Linear-template encounters — guild,
 * social, tavern, combat, borderland — must NOT use ActionStepBranch.
 * Their player-choice surface is aftermath reactions and, optionally,
 * `BranchAwareAftermathConfig.variants`. If a linear template needs a
 * mid-quest fork, that is a signal it should be promoted to a branching
 * encounter, not that the linear format should carry step branching.
 * See `Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md`.
 */
```

This is a **JSDoc-comment-only** edit — zero runtime/compilation semantics change. `unifiedAction.ts` has ~205 importers; a comment edit has no blast radius, but CC must still run `npx tsc --noEmit` to confirm the file still parses.

### 3.2 `Docs/canon/encounters.md` — Rejected approaches section

Add a new bullet to the existing **"Rejected approaches"** list:

```
- ❌ Step-level `ActionStepBranch` in linear-template encounters — rejected 2026-05-15 (THR-191). `ActionStepBranch` is exclusive to *branching encounters* (`src/data/encounters/`). Linear-template encounters (guild, social, tavern, combat, borderland) use aftermath reactions + optional `BranchAwareAftermathConfig.variants` as their choice surface. A linear template that wants a mid-quest fork should be promoted to a branching encounter via `encounter-pipeline`, not retrofitted with step branching. Supersedes the "use ActionStepBranch on ≥3 templates" instruction in `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md`.
```

Also bump the **"Last-reviewed"** line at the bottom of the page to `2026-05-15 by Cowork` with the edit note ("added Rejected Approaches entry for step-level ActionStepBranch in linear templates (THR-191)").

### 3.3 `.claude/skills/template-encounter-rewrite/SKILL.md` — reinforce existing note

The skill already says (line ~23): *"This skill is NOT for branching encounters (the hand-authored `ActionStepBranch` format in `src/data/encounters/`). Those use the `encounter-pipeline` skill."* Append one sentence to that paragraph:

```
Do not add `ActionStepBranch` (step-level `branchOnStep`/`variants`) to a linear template — if a template needs a mid-quest fork, that is a signal it should be a branching encounter, not a reason to branch a linear step. The linear choice surface is aftermath reactions + optional `BranchAwareAftermathConfig.variants` (THR-191).
```

Then mirror to `.agents/skills/template-encounter-rewrite/SKILL.md`: run `npm run check:skill-sync:sync` (`.claude/` is canonical; the hook mirrors `.agents/`). Bump `last_validated_against` in the skill frontmatter to `2026-05-15` only if the skill carries that field; the edit is a content change so the bump is warranted.

### 3.4 `Docs/encounter-building-checklist.md` — clarify subtype scope

At the "live runtime primitives (as of 2026-04-04)" block (~line 480–483), append a clarifying line under the `ActionStepBranch` bullet:

```
  - **Subtype scope (THR-191):** `ActionStepBranch` / `BranchAwareAftermathConfig` *step-level* branching is for **branching encounters only** (`src/data/encounters/`). Linear-template encounters use aftermath reactions + optional `BranchAwareAftermathConfig.variants`; they must not carry step-level `ActionStepBranch`.
```

### 3.5 `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md` — mark superseded

So future archaeology does not re-litigate, add a short note at the top of the THR-96 plan doc (just under the title):

```
> **Superseded note (2026-05-15, THR-191):** The instruction in this doc to use step-level `ActionStepBranch` on ≥3 Lorekeepers templates is **superseded**. THR-191 decided `ActionStepBranch` is exclusive to branching encounters; linear-template encounters (including all Lorekeepers Covenant templates) intentionally do not use it. The 15 templates as shipped are correct. See `Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md`.
```

### 3.6 Linear follow-up (tracked, not THR-191 scope)

Create one Linear issue in the **Encounter Format Migration** project, label `Deferral`, priority Low:

> **Title:** Format-level decision — populate `BranchAwareAftermathConfig.variants` for linear templates via `authoredChoices`
> **Body:** Every migrated linear template ships `aftermathConfig.variants: {}` (empty) + a `fallback`. The sanctioned lever for richer *in-quest* player choice on linear templates (THR-191) is `authoredChoices` on an early step feeding `BranchAwareAftermathConfig.variants` keyed on the chosen `choiceId` — divergent aftermath *without* step-level `ActionStepBranch`. This is a **format-level** decision affecting all ~115 migrated templates, not a Lorekeepers-specific fix; it needs its own design pass (which template families benefit, authoring-cost budget, editorial guardrails). Deferred from THR-191.

## 4. Three-pillar compliance

| Pillar | Status | Rationale |
|--------|--------|-----------|
| **Engine** | **N/A — settled** | No engine code change. The `ActionStepBranch` type, the `isActionStepBranch` type guard, and `resolveStepDefinition()` in `unifiedActionLifecycle.ts` already handle linear templates (plain `ActionStep[]`) and branching templates uniformly. §3.1 edits a JSDoc comment only — zero compilation-semantics change. Verify-don't-omit: CC runs `npx tsc --noEmit` to confirm `unifiedAction.ts` still parses. |
| **Content** | **N/A — no content change** | No encounter template is added, removed, rewritten, or re-wired. The 15 Lorekeepers Covenant templates are correct as shipped. THR-191's deliverable is *policy documentation about* content, not content. |
| **UI** | **N/A — no surface** | No component, modal, HexMap signifier, toast, or chronicle entry. No player-facing behaviour changes. Browser-verify exempt: docs/JSDoc/skill-text-only change, no runtime UI. |

## 5. NFP compliance

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS (N/A) | No magic numbers introduced. |
| 2. Inspectability | PASS | The decision is now traceable across five named surfaces + this plan doc; future authors hit the policy at the `ActionStepBranch` type, the canon page, the skill, and the checklist. |
| 3. Determinism | PASS (N/A) | No runtime behaviour. |
| 4. Fail-soft | PASS (N/A) | No new failure modes. The engine's existing `isActionStepBranch(...) ? .fallback : ...` resolution is unchanged. |
| 5. Narrative over mechanical | PASS | Reinforces that linear templates deliver narrative depth through conditionals + aftermath reactions rather than mechanical step-tree complexity. |
| 6. Additive over destructive | PASS | The whole point of the decision: do not destructively rewrite 15 working templates. All edits are additive (appended JSDoc, new bullets, a superseded note). |
| 7. Performance budget | PASS (N/A) | No runtime code. |

## 6. Deferrals

- **`authoredChoices` → `BranchAwareAftermathConfig.variants` format enhancement** — tracked via the §3.6 Linear follow-up. Format-level decision, not THR-191 scope.

## 7. Vision / rulebook impact

- **Vision audit:** No Vision premise contradicted or updated. The decision reinforces the existing two-subtype encounter model.
- **Rulebook impact:** None. No rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss) changes. The branching-vs-linear *authoring* distinction is an implementation/governance boundary, not a rule of play.

## 8. Coordination block

- **Suggested model:** haiku — the deliverable is five exactly-specified doc edits + one templated Linear issue + closeout. All edit text is provided verbatim above. The only non-trivial step is the skill-sync mirror (`npm run check:skill-sync:sync`), which is a single command.
- **Parallel-safe with:** THR-384 — THR-384 is engine logic in the prose-enrichment pipeline; THR-191 touches JSDoc + docs + the `template-encounter-rewrite` skill. No meaningful file overlap (the only shared file, `unifiedAction.ts`, is JSDoc-comment-only here vs. logic there, and THR-384 is not expected to touch `unifiedAction.ts` at all).
- **Mutex with:** none.
- **Codex review:** no — docs/governance only, no runtime code, no tests of consequence.

## 9. Done when

- [ ] §3.1 `ActionStepBranch` JSDoc in `src/types/unifiedAction.ts` extended with the scope note.
- [ ] §3.2 New "Rejected approaches" bullet added to `Docs/canon/encounters.md`; "Last-reviewed" line bumped to 2026-05-15.
- [ ] §3.3 `.claude/skills/template-encounter-rewrite/SKILL.md` note appended; `.agents/` mirror synced via `npm run check:skill-sync:sync`; `last_validated_against` bumped if the field exists.
- [ ] §3.4 `Docs/encounter-building-checklist.md` subtype-scope line added.
- [ ] §3.5 Superseded note added to `Docs/plans/2026-04-19-thr-96-lorekeepers-covenant-migration.md`.
- [ ] §3.6 Linear follow-up issue created in Encounter Format Migration, labelled `Deferral`, priority Low.
- [ ] `npx tsc --noEmit` clean (confirms the JSDoc edit did not break parsing). `npm test` and `npx vite build` are not required to change behaviour, but run `npx tsc --noEmit` as the minimum gate and paste output in the closing comment.
- [ ] `npm run check:skill-sync` reports `.claude/` ↔ `.agents/` in sync.
- [ ] Closing commit body includes `Fixes THR-191` and the `npx tsc --noEmit` output.
- [ ] `Docs/changelog.md` row appended; `Docs/project-history.md` one-line `✅` entry added.
