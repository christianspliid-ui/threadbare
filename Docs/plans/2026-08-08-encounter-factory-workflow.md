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

## Done-when (this design)

Plan approved in chat → tickets 1–5 filed with coordination blocks → pilot batch (item 6) produces 6 encounters that pass every gate with ≤2 critic loops each, and Christian's 2-encounter sample verdict is "ship" — that verdict, not the tooling, is what proves "same high quality every time."
