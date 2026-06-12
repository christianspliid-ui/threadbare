# THR-447 — Populate `BranchAwareAftermathConfig.variants` on linear templates: a framework decision

**Linear:** THR-447 · **Project:** Encounter Format Migration · **Type:** Governance / Design framework · **Date:** 2026-05-16 · **Author:** Cowork

> **Read this first.** This is a *governance + framework* ticket, not a content-authoring ticket. It establishes how to decide *which* linear-template families warrant populated `aftermathConfig.variants`, the per-template authoring-cost budget, and the editorial guardrails — and it leaves the per-family *verdict* as an explicit decision point for the human. CC's deliverable is documentation: codify the framework in canon + the rewrite skill. Per-family content authoring is a follow-up Linear issue, not THR-447 scope.

---

## 1. The deferred question

THR-447 was created by THR-191 §3.6 (`Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md`). THR-191 settled that step-level `ActionStepBranch` is exclusive to branching encounters; the sanctioned lever for richer *in-quest* player choice on linear templates is `authoredChoices` on an early step feeding `BranchAwareAftermathConfig.variants` keyed on the chosen `choiceId` — divergent aftermath without step-level branching.

The state today: every migrated linear template ships `aftermathConfig.variants: {}` (empty) + a `fallback`. The format *allows* populated `variants`. None of the ~115 linear templates *use* it.

`grep -c "variants: {}"` evidence (2026-05-16 sandbox):

| Family file | Templates with empty `variants` |
|---|---|
| `arcane-circle-encounter-content.ts` | 15 |
| `army-encounter-content.ts` | 6 |
| `borderland-encounter-content.ts` | 9 |
| `builders-fellowship-encounter-content.ts` | 15 |
| `civic-guard-encounter-content.ts` | 15 |
| `faction-encounter-content.ts` | 1 |
| `holy-order-dawn-encounter-content.ts` | 5 |
| `lorekeepers-covenant-encounter-content.ts` | 15 |
| `merchant-consortium-encounter-content.ts` | 15 |
| `monster-encounter-content.ts` | 5 |
| **Total** | **101** counted (out of ~115 migrated linear templates referenced by THR-191) |

The deferral asks three questions:

1. **Which families benefit** from populated `variants`?
2. **What's the authoring-cost budget** per template, per family, and for v1 overall?
3. **What editorial guardrails** distinguish a legitimately populated `variants` from "the same outcome with two adjectives"?

THR-447 answers (2) and (3) with framework-level commitments and answers (1) with a *scoring matrix* whose final per-family verdict is a decision point Christian resolves.

## 2. Decision (framework)

### 2.1 Selection signals — when does a linear-template family benefit from populated `variants`?

A family is a candidate for populated `variants` only when **at least three** of the following five signals are present. Anything below three should stay on `fallback`-only — that is the family's correct format-level resting state.

| # | Signal | Rationale | How to evidence |
|---|---|---|---|
| S1 | **Recurring thematic tension** — the family's premise contains a *named* moral / methodological fork that appears in most templates (preserve-vs-transmit, lawful-vs-compassionate, mercantile-vs-fraternal, etc.). | Without a recurring tension, choices become bespoke per template — that is the branching-encounter format, not the linear format. | Read the family's first 3–5 templates' `narrativeTemplates.initiation` and `description`. Is the same fork visible across them? |
| S2 | **Distinct downstream graph consequences** — the choice can change *which* `EncounterAftermathChange.kind`s fire (e.g. reputation gain *vs.* an intelligence record *vs.* an encounter seed), not just the phrasing of one change. | "Same effect, different prose" is exactly the noise the format guards against. Populated `variants` are only worthwhile when the effect graph itself diverges. | Sketch the two paths' `changes[]` arrays. If they differ only in `title` / `detail` strings, the family fails S2. |
| S3 | **Saga-scale weight** — at least one template in the family is `intrinsicTier: 'storyBeat'` or carries a `rarityTier` of `prominent` or higher. | Ambient connective-tissue content (`ambient`/`background`) is by-design forgettable; player-meaningful choice on it doesn't repay authoring cost. | `grep "intrinsicTier:\|rarityTier:" src/data/<family>-encounter-content.ts`. |
| S4 | **Multi-actor reaction surface** — the family routinely reaches >1 distinct mortal whose aftermath response would plausibly diverge by the player's choice (witness, target, faction body, third-party). | If the aftermath only touches one actor and one reputation track, divergent `variants` are over-engineering. | Read 2 templates' `aftermathConfig.fallback.changes` — count distinct `targetId`/`subjectId` fields and reputation polarities. |
| S5 | **Player-legible cue exists** — at the moment of choice, the player has a concrete in-scene signal (visible relationship, object, named NPC, faction's stated position) that makes the fork *legible* and not abstract. | Choice cards that say "Tip A vs. Tip B" with no fictional anchor produce the "two adjectives" failure mode. | Read step-0 prose. If the fork would require inventing new fiction to surface, S5 fails. |

**Decision rule.** A family is a populated-`variants` *candidate* iff S1–S5 yields ≥3 PASS. Candidates are then ranked by total signal count; ties broken by `rarityTier`/`intrinsicTier` of the family's strongest template (higher wins) and by family size (smaller wins — lower v1 cost). Christian (or a future brainstorm) makes the final per-family pick from the ranked candidate list.

### 2.2 Authoring-cost budget

The per-template cost is the dominant constraint. A populated-`variants` linear template at the editorial bar set by `the-courtyard-duel` would balloon authoring cost beyond format intent. THR-447's budget is deliberately tighter than a branching encounter's:

| Cost surface | Branching encounter (e.g. `the-courtyard-duel`) | Linear template w/ populated variants (this format) | Why the gap |
|---|---|---|---|
| Step-0 `authoredChoices` count | 2–3 typical | **Exactly 2** | Two paths is the recurring-tension shape; three becomes a branching encounter. |
| Per-choice `intent` length | ~150–250 words | **40–80 words** | Linear templates are connective tissue at a higher cadence; the prose has to match. |
| Per-choice `likelyBurden` | ~50–100 words | **20–40 words** | Same rationale. |
| Variant `AftermathVariant.overview` | 80–150 words | **30–60 words** | Same rationale. |
| Variant `AftermathVariant.changes[]` IDs that differ from `fallback.changes[]` | ≥2 per variant | **≥1 per variant** (mandatory per §2.3 G2) | Lower minimum is acceptable because the *kind* must change (G2), not just count. |
| Variant `AftermathVariant.reactions[]` count | 2–4 with bespoke prose | **2 per variant, ≥1 reaction unique to that variant** | Reactions remain the primary choice surface; variants supplement, not replace. |
| Total authoring time per template (skilled author) | 2–4 hours | **~45 minutes** | Roughly an order of magnitude smaller. |

**v1 family pilot budget.** ≤2 families selected for v1, capped at **15 templates total across both families**. At 45 min/template that's ~11 hours of authoring effort — boxable into a single CC ticket or a tight 2-ticket split. Larger rollout waits on v1 playtest feedback (success criteria in §6).

**Out of budget.** Per-step `ActionStepBranch`; new actor reaches; new `EncounterAftermathChange.kind`s; new resolver code. THR-447 is content-only at execution time.

### 2.3 Editorial guardrails

Every populated-`variants` template authored under this format must clear all four gates below. The `template-encounter-rewrite` skill enforces these at PR time; CC rejects any candidate that misses one.

| Gate | Requirement | Failure mode it guards against |
|---|---|---|
| **G1 — Two paths, not two phrasings** | The two `authoredChoices` IDs must name *different intervention shapes* (e.g. `bolster_the_younger_hand` vs. `lock_the_record`) — not `gentle` vs. `firm` or `support` vs. `oppose`. | Adjective re-skinning; Rule 1 of `Docs/canon/encounters.md`. |
| **G2 — Effect-kind divergence** | Each `AftermathVariant.changes[]` must contain ≥1 change whose `kind` differs from any change in the *other* variant **or** from the `fallback`. Acceptable kinds: `reputation`, `intelligence`, `encounter_seed`, `hidden_mark`, `graph_op`. **Not** acceptable: same `kind` with re-worded `title`/`detail`. | "Same outcome, different paint." |
| **G3 — Fictional anchor at step 0** | The step-0 prose names ≥1 in-scene element the player can read as the cue for the fork (an object on a table, a posture, a named NPC's stated position, a faction symbol). The `authoredChoices.targetLabel` or `intent` must reference that anchor. | Choice cards with no diegetic referent. |
| **G4 — Threadbare voice on burden** | `likelyBurden` is one sentence, present tense, second-person ("If the …"). It names a *concrete* cost the player can later recognize in-fiction, not an abstract risk percentage. | Risk text that reads like a stat block. |

A template that cannot clear all four gates without inflating beyond the §2.2 budget is **the wrong shape for populated variants** — it should stay on `fallback`-only or, if the fork is genuinely chapter-weight, be promoted to a branching encounter per the THR-191 boundary.

### 2.4 Family scoring matrix (preliminary — Christian to verdict)

The matrix below is Cowork's first-pass read of the ten linear-template families against §2.1 signals. Each cell is PASS / FAIL / `?` (needs deeper read). The two recommended pilot families are **flagged for verdict** — Christian (or a brainstorm session) overrides any cell as needed.

| Family | S1 Tension | S2 Effect-kind diverge | S3 Saga weight | S4 Multi-actor | S5 Legible cue | PASS count | Family size | Pilot verdict |
|---|---|---|---|---|---|---|---|---|
| **lorekeepers-covenant** | PASS (preserve-vs-transmit) | PASS (intelligence/cultural_knowledge vs. reputation among scholars) | PASS (`rarityTier` mixed up through `prominent`) | PASS (Covenant + the bearer of the record + later readers) | PASS (the annal, the margin, the hand) | **5** | 15 | **RECOMMENDED pilot A — verdict?** |
| **civic-guard** | PASS (lawful-vs-compassionate) | PASS (reputation polarity flips by path) | PASS | PASS (guard + accused + onlookers) | PASS (the warrant, the witness, the gate) | **5** | 15 | **RECOMMENDED pilot B — verdict?** |
| **arcane-circle** | PASS (rigorous-vs-ambitious) | ? (most templates seem to differ in degree, not kind) | PASS | PASS | PASS | 4 | 15 | candidate (after pilot) |
| **builders-fellowship** | PASS (utility-vs-ritual) | ? | PASS | PASS | ? | 3 | 15 | candidate (after pilot) |
| **merchant-consortium** | PASS (margin-vs-reputation) | PASS | PASS | PASS | PASS | **5** | 15 | strong candidate — verdict? |
| **holy-order-dawn** | PASS (orthodoxy-vs-compassion) | PASS | PASS | PASS | PASS | **5** | 5 | strong candidate — verdict? |
| **lorekeepers-covenant** (dup row removed) | — | — | — | — | — | — | — | — |
| **army** | ? (martial templates often have no recurring fork) | ? | PASS | ? | ? | 1 | 6 | not a candidate |
| **borderland** | ? | ? | ? | PASS | ? | 1 | 9 | not a candidate |
| **monster** | FAIL (the antagonist *is* the template) | FAIL | ? | FAIL | ? | 0 | 5 | not a candidate |
| **faction** | n/a (single template) | n/a | n/a | n/a | n/a | — | 1 | n/a |

**Cowork's pilot recommendation.** Lorekeepers Covenant (the family the original deferral named) + Civic Guard (the cleanest second case: visible fork, distinct effect-kinds, named actors at every step). Total v1 surface = 30 templates if both went all-in. Capped at 15 per §2.2 budget — exact subset selection deferred to the per-family follow-up ticket.

**Decision point for Christian.**

1. Confirm or amend the pilot family pair (Lorekeepers + Civic Guard, or substitute Holy Order of Dawn / Merchant Consortium).
2. Confirm or amend the 15-template cap.
3. Confirm or amend the `~45 min/template` budget — if a higher editorial bar is wanted, the cap should drop proportionally.

If Christian wants a brainstorm before verdict, this plan is the brief; the recommendation above is Cowork's read, not a binding selection.

## 3. Three-pillar compliance

| Pillar | Status | Rationale |
|---|---|---|
| **Engine** | **N/A — settled, verify-don't-omit** | The engine already resolves populated `BranchAwareAftermathConfig.variants` (used in branching encounters; see `src/data/encounters/the-courtyard-duel.ts` lines 537–595 and `unifiedActionLifecycle.ts` resolution path). No engine code change. CC's verify step: a `grep "isActionStepBranch\|branchOnStep\|variants" src/engine/` walk on the affected paths is the only sanity check needed; runtime is unchanged. |
| **Content** | **N/A at THR-447 scope; full pillar at follow-up** | THR-447 itself authors zero variants. CC's deliverable is canon + skill text. The actual per-template `authoredChoices` + `AftermathVariant` authoring happens in the new follow-up Linear issue spawned by §6, which carries the Content pillar in full. Splitting is deliberate: the framework decision must precede content authoring or the authoring will drift. |
| **UI** | **N/A — surface already shipped** | The authored-choice card surface (`AuthoredChoiceCard` rendering, `interventionType` polarity tints, `likelyBurden` copy) already ships and is used by branching encounters. Linear templates that populate `variants` consume the same surface unchanged. Browser-verify exempt at THR-447 scope per CLAUDE.md (docs/governance only). The follow-up content-authoring ticket carries any UI evidence required (the standard screenshot of a populated variant in the encounter modal at 1920×1080 will be that ticket's bar). |

This three-N/A pattern is the same shape as THR-191 (also Encounter Format Migration governance). It is design-correct here for the same reason it was design-correct there: a framework decision is a documentation deliverable.

## 4. NFP compliance

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS (N/A) | No magic numbers introduced. The §2.2 word counts are editorial floors/ceilings encoded in skill text, not runtime constants. |
| 2. Inspectability | PASS | The framework lands in three named surfaces (canon, skill, this plan) — a future author hits the signal model the same way they hit the THR-191 scope decision. |
| 3. Determinism | PASS (N/A) | No runtime behaviour change. |
| 4. Fail-soft | PASS (N/A) | The engine already fails-soft when `variants: {}` (uses `fallback`). Populating `variants` on a subset of templates is strictly additive. |
| 5. Narrative over mechanical | PASS | G3 (fictional anchor) and G4 (Threadbare-voice burden) are voice gates that prevent the format from drifting toward stat-block choice cards. |
| 6. Additive over destructive | PASS | No existing template is rewritten by THR-447. The per-family follow-up ticket adds `variants` to selected templates without removing or destructively reshaping the `fallback` already in place. |
| 7. Performance budget | PASS (N/A) | No runtime code. Authoring-cost budget is the only "budget" here and is explicit in §2.2. |

## 5. Vision / rulebook impact

- **Vision audit.** No Vision premise contradicted. The framework reinforces the existing premise that the player is a god whose choices matter at scale — populated `variants` make a linear-template choice carry visible downstream graph weight, which is on-mission for the player-as-god framing. No Vision file edit needed.
- **Rulebook impact.** None. No rule of play changes. The aftermath-divergence pattern is implementation-level inside an already-defined encounter primitive. The rulebook page (`Docs/canon/rulebook.md`) does not name the linear-vs-branching subtype, and the existing `[IMPL]` marker on encounter resolution still applies. No rulebook edit needed.

## 6. Deliverable — exact doc-edit pass (CC scope)

CC's job is mechanical: codify the framework on three doc surfaces and create one follow-up Linear issue. No code edits. No content authoring.

### 6.1 `Docs/canon/encounters.md` — add framework reference

Append to the existing "Rejected approaches" / "Settled decisions" section (whichever the canon page uses for format-level commitments), after the THR-191 entry:

```
- ✅ **Populated `BranchAwareAftermathConfig.variants` on linear templates — opt-in, signal-gated** (THR-447, 2026-05-16). The `fallback`-only default stays correct for the majority of linear templates. A family becomes a candidate for populated `variants` only when ≥3 of 5 signals fire (recurring thematic tension, distinct downstream graph consequences, saga-scale weight, multi-actor reaction surface, player-legible cue). Per-template authoring is budget-capped (2 choices × ~45 min); editorial gates G1–G4 are mandatory. See `Docs/plans/2026-05-16-thr-447-aftermath-variants-format-decision.md` for the full framework and the family scoring matrix.
```

Bump the **Last-reviewed** line at the bottom of the canon page to `2026-05-16 by Cowork` with the edit note ("added populated-variants framework reference (THR-447)").

### 6.2 `.claude/skills/template-encounter-rewrite/SKILL.md` — add signal model + gates

Find the existing "Aftermath" section (or, if absent, the section that describes `aftermathConfig` shape). Append the §2.1 signal table (S1–S5), the §2.2 budget table, and the §2.3 gate table (G1–G4) in compact form. Verbatim copy of the §2 tables is acceptable; the skill needs the runnable rubric, not new prose.

After the tables, append a one-paragraph procedural note:

```
When rewriting a template in a family that has been *approved for populated variants* (see canon and the family scoring matrix in `Docs/plans/2026-05-16-thr-447-aftermath-variants-format-decision.md`), populate `authoredChoices[0]` with exactly 2 choices and `aftermathConfig.variants` keyed on those choice IDs. Every populated template must clear G1–G4. When rewriting a template in a family that has *not* been approved (default), leave `variants: {}` and write the systemic depth into `fallback.reactions[]` — the same bar that THR-96 (Lorekeepers Covenant) hit.
```

Mirror to `.agents/skills/template-encounter-rewrite/SKILL.md` via `npm run check:skill-sync:sync` (canonical is `.claude/`). Bump `last_validated_against` in the skill frontmatter to `2026-05-16`.

### 6.3 `Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md` — back-reference

In §3.6 of the THR-191 plan doc (the section that named THR-447), append one line after the placeholder body:

```
> **Resolved 2026-05-16 (THR-447):** Framework decision shipped — see `Docs/plans/2026-05-16-thr-447-aftermath-variants-format-decision.md`. Per-family content authoring tracked separately.
```

### 6.4 New Linear issue — per-family content authoring (follow-up, not THR-447 scope)

Cowork creates the follow-up at handoff time (alongside the THR-447 → Ready for Dev transition) so the queue is populated before Christian's verdict closes. The follow-up issue:

- **Project:** Encounter Format Migration
- **Labels:** `Deferral`, `Content`
- **Priority:** Low (until Christian verdicts the pilot families)
- **State:** Idea (waiting on the §2.4 verdict)
- **Title:** "Pilot — populated `aftermathConfig.variants` for 2 linear-template families (THR-447 follow-up)"
- **Body:** quotes §2.2 budget + §2.3 gates verbatim, names the recommended pair (Lorekeepers + Civic Guard) and the open verdict, links the THR-447 plan doc.

Christian moves this issue from Idea → Ready for Dev once the pilot pair is verdicted; CC picks it up and authors content within the §2.2 budget.

## 7. Fail-soft table

| Condition | Behaviour |
|---|---|
| A template author populates `variants` on a family that is NOT signal-approved | The `template-encounter-rewrite` skill's G1–G4 gates fire at PR time. If the gates pass anyway, the template is *technically* fine — the engine doesn't care which family it belongs to. The Linear PR review flags the family-policy mismatch and either updates canon's family approval list or rolls the template back to `variants: {}`. |
| Engine cannot resolve a populated `variants` entry (e.g. the player's choiceId doesn't match any key) | Pre-existing engine behaviour: falls back to `aftermathConfig.fallback`. No new failure mode introduced. |
| `authoredChoices[0]` is present but `variants` is empty | Pre-existing engine behaviour: the choices still render and record a `choiceId`; aftermath resolves via `fallback`. The chosen path is recorded in encounter history and visible in DebugPanel even if the aftermath doesn't visibly diverge. Documented as the "tracked-but-not-acted-on" state. |
| The §2.2 word-count floors/ceilings are violated in a PR | The `template-encounter-rewrite` skill flags it at review time; this is editorial, not runtime. No engine impact. |

## 8. Coordination block

- **Suggested model:** **haiku**. Deliverable is three exactly-specified doc edits + one Linear issue creation. All text is provided verbatim above. The skill-mirror command (`npm run check:skill-sync:sync`) is a single command. No judgement-heavy content authoring at THR-447 scope.
- **Parallel-safe with:** THR-248 (Linear automation — `Reopened` label) and THR-406 (Vision/ numbered files migration). No file overlap with either.
- **Mutex with:** none. The canon page edit is the only mildly contended surface; no other in-flight issue touches `Docs/canon/encounters.md` per the 2026-05-16 In Dev / Ready states.
- **Codex review:** **no** — docs/governance only, no runtime code, no tests.
- **Files to touch (anti-drift):**
  - `Docs/canon/encounters.md` (append + bump Last-reviewed)
  - `.claude/skills/template-encounter-rewrite/SKILL.md` (append tables + paragraph + bump frontmatter)
  - `.agents/skills/template-encounter-rewrite/SKILL.md` (mirrored via `npm run check:skill-sync:sync`)
  - `Docs/plans/2026-05-15-thr-191-actionstepbranch-linear-template-scope.md` (one-line back-reference in §3.6)
  - Linear (create the §6.4 follow-up issue)

## 9. Done-when

- [ ] `Docs/canon/encounters.md` shows the new §6.1 entry and the bumped Last-reviewed line.
- [ ] `.claude/skills/template-encounter-rewrite/SKILL.md` contains the §2.1, §2.2, §2.3 tables and the procedural paragraph from §6.2.
- [ ] `.agents/skills/template-encounter-rewrite/SKILL.md` is byte-identical (or skill-sync-equivalent) to its `.claude/` sibling; `npm run check:skill-sync:sync` exits clean.
- [ ] The THR-191 plan doc has the §6.3 back-reference line in §3.6.
- [ ] The §6.4 follow-up Linear issue exists in **Idea** state, in the Encounter Format Migration project, with the body specified in §6.4.
- [ ] `npx tsc --noEmit` is clean (no engine surface touched, so this is a sanity check, not a real risk).
- [ ] CC's closing commit has `Fixes THR-447` in the body and verification evidence (`npx tsc --noEmit`, `npm test`, `npx vite build` raw output or a green CI link).

## 10. Open questions (non-blocking — answer at verdict time)

1. **Pilot family pair** — Lorekeepers + Civic Guard (Cowork recommendation) vs. Holy Order of Dawn / Merchant Consortium? (§2.4)
2. **15-template cap** — keep the v1 cap, or pilot all 30 templates across both families? (§2.2)
3. **`~45 min/template` editorial bar** — keep, or raise toward `the-courtyard-duel`'s 2–4 hour bar (which would necessarily shrink the cap)?

These don't block THR-447 closing — the framework lands; the verdict is the §6.4 follow-up issue's problem.
