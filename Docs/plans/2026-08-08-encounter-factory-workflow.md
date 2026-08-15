# The Encounter Factory — agentic workflow for composition-complete encounters at scale

**Status:** In Design — chartered by Christian in chat, 2026-08-08: *"design an agentic workflow for generating high quality encounters using all the relevant building blocks. we need to be able to create many encounters, and we need them to be of the same high quality every time. this means evaluations, checks, tests and so on needs to be in order."*
**Primary sources:** the composition audit ([THR-1039](https://linear.app/threadbare/issue/THR-1039/encounter-composition-audit-every-content-block-that-builds-an), `Docs/audits/2026-08-08-encounter-composition-audit.md`) · the locked authoring format (THR-883, `nudge-authoring-spec.md`) · the existing pipeline (`.claude/skills/encounter-pipeline/`) · the UI Laws (`Docs/design-system/laws.md`).
**Supersedes nothing** — this extends encounter-pipeline v2; it does not replace it.

## Lineage — the old factory, and why this one is different

We built an encounter factory before, and (Christian, verbatim) *"it produced shit."* The postmortem survives as a canonized rejected approach (`Vision/taste-profile.md` §Pure LLM-generated content): pure-LLM generation **drifts in voice, invents node types, and cannot honour the graph's constraints.** Those are the three deaths, and each gets a structural counter here, not a hope:

| Old failure | Structural counter |
|---|---|
| Voice drift | One authoring agent (Fable, the standing rule), one locked format (THR-883), and register **detectors with numbers** in the critic loop — the bar is measured, not felt |
| Invented entities | The Systems critic resolves every reference against **live code** — cast roles, reward template ids, seed targets, image tags; an id that doesn't exist is a gate failure, not a discovery in playtesting |
| Constraint violations | The Composition Contract is a **validator**, and Stage 4 proves the encounter in the running engine before any PR exists |

This is an **improvement of the existing end-to-end workflow, not a replacement**: encounter-pipeline v2's draft → editorial → systems → implementation chain (its paper trail: `Docs/plans/encounters/flawed-steel-*`, `rival-shrine-betrayal-*`) keeps its shape; the factory adds the brief stage in front, the contract + gates in the middle, live proof at the end, and the sampling loop after.

## The problem, from the audit

The engine resolves nine composition-block classes live, the pipeline skill demands several of them, and the authored corpus uses almost none: the 15 nudge-era encounters carry zero cast bundles, zero `{cast:*}`, zero `rewardPool`, zero `byOutcome` bands. Quality today is whatever one authoring session happens to produce; composition today is whatever one template happens to include. Scale under those conditions produces many thin encounters fast. The factory's contract is the inverse: **every encounter leaves the line composition-complete, and no encounter ships below the bar — enforced by machines, sampled by the director.**

## 1. The Composition Contract (the load-bearing new artifact)

A per-encounter manifest, validated like `validateSettingEnvelope` — not prose guidance, a checkable schema. Every factory encounter declares, or *explicitly exempts with a reason*:

| Block | Requirement | Validator |
|---|---|---|
| Steps | 1–3, each with reach, difficulty, `purposeLine`, narrative, full afterimage band set | exists (extend checklist) |
| Nudge hand | per step: 4–6 cards cut from `NUDGE_CARD_LIBRARY`, ≥1 sphere-gated, ≥1 trait-gated, forecast math in authoring band | `nudgeHandChecklist` (exists) |
| Setting envelope | `settings` + one `openings` entry per declared class | `validateSettingEnvelope` (exists) |
| **Cast** | ≥1 named scene actor as a **support binding** (bundle or `encounter.*` family default — mechanical enablement is part of implementation), referenced via `{cast:*}` in prose | **new** |
| **Rewards/penalties** | `rewardPool` draw from the attachment library **or** aftermath effect (`spawn_artifact`, condition, …) — something persistent, per THR-973's bar | **new** |
| **Aftermath** | `byOutcome` bands (≥ success / failure / one extreme), ≥1 seed or persistent consequence across variants, `concepts` declared per change (Law 2) | **new** |
| Systems quota | ≥3 game-system connections (Christian's standing rule, spec §262–276) — cast, rewards, seeds, conditions, reputation, factions each count | **new** (count from the manifest) |
| Images | step illustration tag + card art tags resolving in the image library | **new** (resolve, don't trust) |
| Register | vagueness 0, no numerals, no second person, no raw tokens | detectors (exist) |

An exemption is authored, not silent: `composition: { cast: { exempt: "solo wilderness ordeal — no one else on the hex" } }` — the validator prints exemptions in its report so the batch reviewer sees every waiver.

## 2. The line — five stages, each an agent with a reject path

```
BRIEF ─▶ DRAFT ─▶ CRITIC LOOP ─▶ MACHINE GATES ─▶ LIVE PROOF ─▶ BATCH REVIEW
(plan)   (Fable)  (editorial+systems)  (npm run)     (headless)    (Christian samples)
```

**Stage 0 — Brief.** A batch brief names: family/setting envelope, reach spread, decision shapes (from the roster taxonomy: single test / consequence chain / fork / opt-in / sequel), systems quota targets, and which library cards are over-exposed (read `cardPlayTally` telemetry) so new hands diversify. Briefs are small and reviewable — this is where a human steers *what* gets made.

**Stage 1 — Draft (Fable authors, per the standing rule).** Authors the full manifest to the locked format + Composition Contract. The draft prompt (encounter-pipeline `agents/draft-prompt.md`) gains the contract as its skeleton — the agent fills blocks, it does not decide whether blocks exist.

**Stage 2 — Critic loop (two independent passes, bounded).** *Editorial* judges register and prose against `Docs/canon/prose.md` with the detectors' numbers in hand; *Systems* verifies every declared block **resolves against the live code** (cast binds, reward templates exist, seeds name real template ids, image tags hit the manifest). Each returns fix-lists; draft revises; **max two loops** then escalate to the batch report rather than orbiting.

**Stage 3 — Machine gates (the "same quality every time" mechanism).** One command, `npm run check:encounter -- <templateId>`, runs: composition validator → `nudgeHandChecklist` → envelope validator → register detectors → trait-ref/`validateTraitRefs` → image-tag resolution → enrichment dry-run (zero unresolved `{...}`) → forecast-band arithmetic. **Green is a precondition for a PR existing.** This is the stage that scales: agents vary, gates do not.

**Stage 4 — Live proof (headless, per encounter).** CLI/`__DEBUG` run: spawn → commit a hand → resolve all steps (`tick`) → assert: no tick crash, chapters advance, aftermath resolves a *variant* (not fallback — the THR-979 class), seed lands in `pendingEncounterSeeds`, reward node exists in graph, chip model carries its `concepts`. One scripted sweep, evidence attached to the PR.

**Stage 5 — Batch review (the director's sample).** Per batch of N (~6): a report with per-encounter gate results + exemptions + `?spawn` links, and **a sample of 2 for Christian's chat review** (THR-608 format). His verdicts feed the next brief. He never reviews all N — the gates hold the floor; he holds the ceiling.

## 3. What must be built (implementation tickets, in order)

1. **Engine enablement** — `encounter.*` family default support bundles (`default-support-bundles.ts:320` gap) + the THR-1042 fix (authored aftermath must not erase derived changes) + THR-1041 (cast/fallout surfaces render). *Without these, composed content is invisible — UI first is deliberate.*
2. **`check:encounter` gate runner** — compose the existing validators + the new composition validator into one command + CI wiring for `src/data/encounters/**`.
3. **Spec + skill expansion** — the Composition Contract lands in `nudge-authoring-spec.md` (pending the THR-883 sitting's format ruling on its exact expression) and the pipeline prompts; `rewardPool` documented for the first time.
4. **The Package View (Christian's requirement, 2026-08-08: "easily being able to see the entire encounter content package").** One surface per encounter showing every composed block resolved — steps with prose and afterimage bands side by side, each hand as its rendered card row, cast with portraits and roles, rewards with attachment art, every aftermath variant × outcome band, seeds with their target templates, image tags with the art they resolve to, and the composition validator's verdict with exemptions inline. Home: a new `?view=cms#encounter-packages` page (the CMS is the existing content-browsing surface), one shareable URL per template. This is Stage 5's review link — better than a spawn link because it shows the *whole* package including bands a single playthrough never rolls — and it doubles as the authoring agents' own self-check render. UI Laws hold on it (it is a designer-facing surface, but concepts still carry visuals/tooltips — it is also how we *see* Law 1 gaps).
5. **Factory run harness** — the batch brief format + stage orchestration in `encounter-pipeline` v3 + the Stage-4 headless sweep script.
6. **First batch through the line** — the five slice re-authored aftermaths (THR-973) plus the chartered combat encounter as the pilot batch; pilot findings amend the contract before volume.

## 4. Pillars

**Engine:** item 1 + the sweep script (Stage 4). **Content:** the contract, spec, briefs, pilot batch. **UI:** THR-1041 (already filed); no new surfaces — the factory fills existing ones.

## 5. Open decisions (THR-883 sitting)

- The contract's *expression* in the locked format (inline fields vs sibling manifest file).
- Cast prose style: `{cast:*}` tokens everywhere vs named-inline-with-binding (the audit shows the Bridge's keeper reads well inline — the sitting decides whether binding without tokens satisfies the contract).
- Batch size and Christian's sample rate once the pilot lands.

## Rulings — Christian, chat, 2026-08-08 (grill round; all settled, supersede conflicting text above)

1. **Batch size 6**, and the batch report renders the six side by side so **variance is visible** — shapes, reaches, tones in one view; that is what he reviews for.
2. **Briefs are agent-drafted, Christian-approved in chat** before a batch runs.
3. **No exemptions, ever.** The Composition Contract is absolute; the exemption mechanism in §1 is **deleted**. A shape that cannot carry a block is a future *encounter type with its own contract*, not a waiver. The validator hard-fails a missing block.
4. **Park, don't kill.** Two failed critic loops → the encounter parks for human feedback and salvage (supersedes §2's escalate-and-redraft).
5. **Contract expression: inline** on the template file (no sibling manifest).
6. **Cast prose style: named-inline with mandatory binding, tokens where they earn it.** Authors write role-voiced prose ("the keeper waits…"); the template *must* declare the binding that makes her a real spawned person (portrait, cast strip, click, persistence). `{cast:*}` tokens are the available tool for spots where the generated name in the sentence earns something — greetings, reveals, sequel callbacks.
7. **byOutcome floor is 3 bands** (success / failure / one extreme); a floor, not a norm — author more wherever the encounter warrants.
8. **Retrofit all 15** nudge-era encounters to the full contract — the slice five (riding THR-973) *and* the camp seven + sequels. The retrofit is the pilot volume.
9. **The THR-883 sitting collapses into a review**: Fable drafts the amended spec + one full-contract exemplar encounter; Christian's chat review of those two artifacts is the sitting.

## Substrate inventory

*Backfilled 2026-08-15 (the THR-1060 requirement, folded into this ticket 2026-08-11). Written **post-implementation** — items 1, 2, 4 and 5 shipped as THR-1044, THR-1045, THR-1046 and THR-1047 between 2026-08-09 and 2026-08-14 — so this records the as-built reuse, verified against the shipped code rather than asserted at drafting time. No design decisions change.*

The THR-614 question — did the factory green-field machinery that already existed? — answered per gate-stack member:

| Factory stage | Substrate used | Status |
|---|---|---|
| Composition validation | `src/data/content-eval/compositionContract.ts` — **new**, but delegates hand → `nudgeHandChecklist` and setting → `validateSettingEnvelope` (both pre-existing) rather than restating them; verified in `scripts/check-encounter.ts`'s own stack ordering | extends |
| Register/prose gating | `src/data/content-eval/detectors.ts`, `registerCompliance.ts`, `proseQualityScore.ts` (pre-existing, THR-490/472/609 family) — the gate reads `auditTemplate().failures`; the abstraction detector deliberately ranks rather than gates (THR-1092) | reuses |
| Reference liveness | `validateNudgeGrantRefs`, `traitRefValidation.ts` (pre-existing THR-786/809), image-library resolution (THR-777) | reuses |
| Gate runner | `scripts/check-encounter.ts` (`npm run check:encounter`) — **new composition of existing validators**, one command per Stage 3 | new (composition only) |
| Live proof | `scripts/encounter-live-proof.ts` (`npm run check:encounter-live`) — drives the **existing** `initializeGameState` → `runTick` pipeline headlessly, same substrate as the CLI | new (harness only) |
| Batch review | `scripts/encounter-batch-report.ts` (`npm run encounter:batch-report`) — renders six side by side per ruling 1 | new |
| Package View | `?view=cms#encounter-packages` (`src/components/CMS/encounter-package/`) — lives on the **existing** CMS surface, reads `checkCompositionContract`'s verdict rather than re-deriving it | extends |
| Orchestration | `.claude/skills/encounter-pipeline/` v3 — same five-stage line as v2 with the brief stage in front and the loop bound added | extends |

No duplicated substrate found: every validator the gate stack runs either pre-existed or is a composition/harness over pre-existing machinery. The one genuinely new *validator* is the Composition Contract itself, which is the plan's load-bearing artifact by design.

## Constants table

Every tunable named, with its home — all shipped as named exports or ruling-bound skill constants:

| Constant | Value | Lives at | Purpose / ruling |
|---|---|---|---|
| `COMPOSITION_STEPS_MIN` / `_MAX` | 1 / 3 | `compositionContract.ts:51-52` | step count bounds |
| `COMPOSITION_BYOUTCOME_MIN_BANDS` | 3 | `compositionContract.ts:58` | byOutcome floor (ruling 7 — a floor, never a norm) |
| `COMPOSITION_SYSTEMS_QUOTA_MIN` | 3 | `compositionContract.ts:65` | systems-connection quota (spec §262–276) |
| `BATCH_SIZE` | 6 | `encounter-batch-report.ts:57` | batch size (ruling 1) |
| Critic loop bound | 2, then **park** | `encounter-pipeline` SKILL Step 2b | ruling 4 — park, don't kill; governs agent behavior, so it lives in the skill, not code |
| Director sample | 2 of 6 | `encounter-pipeline` SKILL Stage 5 | ruling 1 — gates hold the floor, Christian holds the ceiling |
| Nudge hand size | 4–6 cards, ≥1 sphere-gated, ≥1 trait-gated | `nudgeHandChecklist` (pre-existing) | contract row 2 |
| Register thresholds | vagueness 0, no numerals, no second person | detector stack via `auditTemplate().failures` | contract row "Register" |
| `WARMUP_TICKS` | 2 | `encounter-live-proof.ts:114` | live-proof world warm-up before spawn |

## NFP-compliance table

| NFP | Verdict | Evidence |
|---|---|---|
| 1. Tunability | ✅ | every gate threshold is a named export (table above); changing the byOutcome floor is one constant |
| 2. Inspectability | ✅ | each stage emits a readable artifact: gate report per template, live-proof evidence, batch report with per-encounter verdicts, Package View rendering the contract verdict inline |
| 3. Determinism | ✅ | gates are pure functions over template data; live proof runs the seeded engine pipeline (same-seed reproducible); no gate consults an LLM |
| 4. Fail-soft | ✅ | deliberate polarity: authoring-time tooling **fails loud by design** (ruling 3 — the validator hard-fails a missing block); fail-soft applies to the *runtime*, which Stage 4 asserts (no tick crash, aftermath resolves a variant not a fallback) |
| 5. Narrative over mechanical | ✅ | the editorial critic and the director's ceiling sample judge prose; gates only hold the floor |
| 6. Additive | ✅ | extends encounter-pipeline v2 (§Lineage); no existing surface replaced; contract expression is inline on templates (ruling 5), no parallel manifest files |
| 7. Performance budget | ✅ | all factory machinery is authoring-time (scripts + CLI); zero runtime cost — shipped encounters are data like any other template |

## Done when

- [x] Plan approved in chat (Christian, 2026-08-08)
- [x] Tickets 1–5 filed with coordination blocks (shipped: THR-1044, THR-1045, THR-1046, THR-1047; spec expansion rode the format ruling)
- [ ] Pilot batch (item 6) produces 6 encounters that pass every gate with ≤2 critic loops each
- [ ] Christian's 2-encounter sample verdict is "ship" — that verdict, not the tooling, is what proves "same high quality every time"
