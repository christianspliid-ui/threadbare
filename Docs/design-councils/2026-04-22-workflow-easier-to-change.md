# Council: Workflow improvements for easier change & expansion

**Date:** 2026-04-22
**Status:** closed — candidate proposals filed as Linear issues (Round 2 and consent round skipped by user direction)
**Question:** What are the primary improvements we could make on our end-to-end workflow to make the product easier to change & expand?

## Context

Threadbearer is a systemic god-game / rogue-lite narrative simulation (React + TypeScript + Vite). The end-to-end workflow currently spans three agents — Cowork (design & planning), Claude Code (judgment-heavy implementation), Codex (mechanical / pattern-following implementation) — coordinated through Linear with hand-off states (Implementation Planning → Ready for Dev / Ready for Codex → In Dev → Done). Content authoring has dedicated pipelines (encounter, attachment, prose), and the project maintains an Obsidian vault as an LLM knowledge base, an impediment log, and a retrospective cadence.

This council is looking forward: what primary improvements would make the *product* (engine + content + coordination) easier to change and expand going forward. The perspectives are deliberately pillar-shaped so each frame stays sharp and doesn't blur into the others.

**Ground truth references the agents should consider:**

- `CLAUDE.md` — project instructions, load-bearing decisions, NFPs, Definition of Done
- `Docs/impediments.md` — accumulated friction log
- `Docs/retrospectives/2026-04-11-retro-v2.md` — most recent retro
- `Docs/plans/2026-04-17-encounter-migration-audit-checklist.md` — current migration state
- `.agents/skills/engine-architecture/SKILL.md`, `.agents/skills/prose-content-systems/SKILL.md`, `.agents/skills/encounter-pipeline/SKILL.md` — pipeline skills
- `Docs/plans/2026-04-16-game-design-direction.md` — most recent design direction
- `.agents/skills/pull-work/SKILL.md`, `.agents/skills/retrospective/SKILL.md` — workflow skills

## Rules

- Read this page in full before writing.
- Turns end with "Pass to X" or "Pass to open floor" or "PROPOSAL: ...".
- Objections must cite which half of the consent test fails: *good enough for now* or *safe enough to try*.
- Preference alone is not objection.
- Each perspective speaks only within its frame; no cross-pillar speculation.

## Running state

- **Open questions:**
  - Is the "fast-lane revise" idea for the encounter pipeline scoped narrowly enough that it doesn't dilute the quality bar the full 4-pass run installs?
  - How much of the test brittleness is a missing-abstraction problem (content invariants helper) versus a content-coupling problem (assertions depending on counts)?
  - Should the "every 'agents should remember' rule becomes a lint" principle be formalised as a CLAUDE.md rule of its own?
- **Active proposal:** none (opening round complete)
- **Next speaker:** open floor (Round 2 — sequential)
- **Turns used:** 3 / 12

## Decisions

*(none yet — no proposal has reached consent)*

## Mode note

**Round 1 was authored by the orchestrator in degraded mode.** The subagent Agent tool was rate-limited at the time of the first council run. The orchestrator composed each perspective with discipline (reading each perspective's context bundle separately and staying within the assigned frame), but the three sections share a single author rather than three independent agents. Re-running Round 1 with independent subagents — or moving to Round 2 with fresh independent agents — will produce stronger divergence. The surviving artefact (decisions, proposals) should still be treated as provisional until independent-agent pressure-testing lands.

## Round 1 — independent perspectives

### Content Iteration perspective

The encounter pipeline is a disciplined 4-pass orchestrated flow (draft → editorial → systems → implementation), which buys us consistency but adds two frictions that slow iteration: every pass has to re-ingest the systemic wiring guide and the game-design-direction principles as fresh context, and the pipeline only ships when the implementation pass lands. If the implementation fails or the systems pass flags a problem, the whole chain restarts. That's expensive when most of what's wrong is a single passage of prose.

Three concrete pain points:

1. **No fast-lane for small prose iteration.** Once an encounter is deployed, revising a single opening paragraph or choice body requires either manual editing (bypassing all the quality guards the pipeline installs) or re-running the full pipeline. There is no "edit-in-place with editorial check" mode. *Candidate improvement:* add a `/encounter-pipeline revise` mode that takes a deployed encounter plus a target diff scope (opening prose / choice body / aftermath beat), runs just editorial + systems, and writes the patch. Same quality gate, minutes instead of hours.

2. **The wiring guide and design direction are recomputed every run.** Both documents are loaded into the draft agent's context for every encounter authored. They are also large. If they were compiled into a short, versioned "authoring brief" that the pipeline pre-reads once and caches per session, individual runs would be cheaper and more consistent. *Candidate improvement:* extract a `Docs/authoring-brief.md` (sub-500 lines) regenerated automatically when the wiring guide or direction doc changes, and inject that instead of the full sources.

3. **Exemplars are hardcoded in the skill.** `rival-shrine-betrayal.ts` (10/10) and `flawed-steel.ts` (9/10) are named in the skill text, which means silent exemplar drift — if the bar moves, the skill lies without warning. *Candidate improvement:* a small `Docs/exemplars.md` index with a one-line rubric for each (what it is exemplary for) that the draft agent reads, so promoting a new exemplar is one edit rather than every-skill-has-stale-quotes.

Pass to open floor.

### Engine / Architecture perspective

The codesight dependency graph shows five files with over 100 imports each: `src/engine/graph.ts` (370), `src/types/index.ts` (186), `src/types/gameState.ts` (176), `src/types/traits.ts` (156), `src/engine/traceBuffer.ts` (106). These are the project's blast-radius surface. Most of them are legitimately pervasive — the graph is the data model, traceBuffer is the inspectability spine — but the type barrels are structural debt: a single added field in `types/index.ts` re-type-checks 186 files.

Three places where change is disproportionately expensive:

1. **Type barrel files.** `types/index.ts` and `types/gameState.ts` re-export from many sibling files. Adding or renaming a type forces a recompile across the whole codebase and frequently produces unrelated test failures downstream. *Candidate improvement:* split `types/index.ts` into domain-narrow barrels (`types/engine.ts`, `types/encounter.ts`, `types/ui.ts`), and forbid deep imports like `import { X } from 'src/types'` in favour of the domain barrel. Enforce with an ESLint rule so regressions are not silent.

2. **Orchestrator phase coupling.** New engine modules are wired into `orchestrator.ts` by direct phase insertion. The `wiring-checklist.md` exists but is a social convention — missing a step means the module is tested but not integrated (memory:`feedback_wiring_verification` flags this as recurring). *Candidate improvement:* make phase registration declarative. Each engine module exports a `phase` descriptor (`{ id, beforePhase, afterPhase, run }`); the orchestrator composes them; the wiring checklist becomes a type check rather than a document.

3. **Test fragility has an architectural cause, not just a hygiene cause.** The 2026-04-11 retro surfaces brittle count assertions — `expect(ENCOUNTER_TEMPLATES).toHaveLength(154)` — that break on every content addition. That is not test rot; it is a missing abstraction. There is no `describeContentInvariant(templates)` helper that checks structural properties independent of count. *Candidate improvement:* add a small `test/contentInvariants.ts` offering structural matchers (every template has 2–4 steps, every step has valid targeting, no orphan reach references), then delete all count assertions. This lets the content pipelines add templates freely without breaking the suite — precisely the change-easily property the question asks about.

Pass to open floor.

### Coordination / Process perspective

The 2026-04-11 retrospective is the strongest evidence here. The full test suite was red for eight-plus days before being surfaced, not because agents were negligent but because no automated gate enforced green and no one's role description included "fix tests someone else broke." The retro's lesson was precise — *every impediment that says "agents should remember to do X" is a process smell, and the fix is automation* — and it should drive this council more than any single workflow gripe.

Three coordination pain points:

1. **Social conventions keep failing where automated gates would hold.** CI/CD arrival (TB-121) helps on tests and types. But other "agents should remember" rules remain un-automated: the Definition of Done's merge-gated Linear close, the handoff coordination-block format, the "every deferral gets a Linear issue" rule, the "every brainstorm has a backlog entry" memory. Each of these is a lint candidate. *Candidate improvement:* add `npm run check:process` that asserts (a) every `// TODO(` in touched files references an open THR issue, (b) every modified `Docs/plans/` file in the last N days has a Linear issue link, (c) every handoff comment on a Ready-for-Dev issue contains the coordination-block keywords. Wire it into the same CI job as tests.

2. **Sandbox friction is rediscovered every session.** `rg.exe` blocked in Codex, `git push` blocked in Cowork, `npm test` timeout at default limits. CLAUDE.md now documents these under "Known Sandbox Limitations", but agents still hit them first and look them up second. *Candidate improvement:* the first tool call of any coding session should be a `scripts/session-precheck` that probes the sandbox's actual capabilities (tries `rg.exe`, times a tiny test run, prints the fingerprint), so workarounds are top-of-mind without requiring the agent to remember where they are documented.

3. **The retro itself is oddly manual given that impediments are structured.** The voided v1 of 2026-04-11 had fabricated entries — the fact that a retro *can* fabricate is a symptom of a process that relies on summarisation from memory. *Candidate improvement:* generate a retro draft from the impediment log deterministically (group by cluster, count occurrences, surface duplicates) and let the human reviewer revise, rather than asking an agent to re-read the log and characterise it. The `retrospective` skill could include this script step before the narrative pass.

Pass to open floor.

## Orchestrator reading of Round 1 (between-round analysis)

*This is not a perspective turn. It is the orchestrator compiling what the three Round-1 statements revealed — convergences to accelerate in Round 2, tensions to probe, candidate proposals ready for consent.*

### Convergences

- **Automation over social convention.** All three perspectives converge on this. Engine proposes a declarative phase registry and an ESLint rule; Coordination proposes `npm run check:process` lints plus a session-precheck script; Content proposes a cached authoring brief and an exemplar index — each one is the same move: replace a "agents should remember" rule with a mechanical gate or artefact. The convergence is strong enough that it should be stated as a principle of the council's output, not just as individual proposals.
- **Test fragility is structural, not hygienic.** Engine and Coordination agree independently that the count-based assertions are a missing-abstraction problem, not an agent-diligence problem. The retro's meta-analysis says the same thing. This is consent-ready.
- **Change cost concentrates in a few artefacts.** Engine points at type barrels and the orchestrator; Content points at the wiring guide and exemplar list; Coordination points at CLAUDE.md-embedded rules. The common shape: a small number of high-re-read artefacts gate the speed of every subsequent change. Any improvement that either shrinks those artefacts or compiles them into cheaper forms has compounding payoff.

### Tensions to probe in Round 2

- **Content's "fast-lane revise" vs. Engine's stricter gates.** Content wants a lower-friction path for small prose iteration; Engine wants more enforced gates (ESLint rules, typed phase registry). Are these actually in tension, or does the fast-lane still pass the same editorial + systems gates, just scoped? Worth a direct exchange.
- **Coordination's `session-precheck` vs. Engine's "fix the architecture".** Coordination wants a script that prints sandbox capabilities at session start so workarounds stay top-of-mind; Engine might reasonably object that the precheck is more brittle process rather than an architectural fix. Who's right depends on whether the sandbox quirks are stable (in which case document + precheck is fine) or volatile (in which case we need a permanent fix like sandbox parity).
- **Scope of automation.** Coordination wants `check:process` to catch many convention violations. Is that aggressive enough to matter, or so aggressive it becomes noise that agents learn to ignore (the same failure mode that rotted the test suite)?

### Candidate Round-2 pass sequence

When Round 2 runs (with independent subagents), suggested opening:
1. **Engine → Content**: "Your fast-lane revise idea — would the editorial + systems passes still enforce the 6 design-direction principles, or does scoped-revise mean scoped-gate? If the latter, what stops drift?"
2. **Coordination → Engine**: "You want the wiring checklist to become a type check. What is the minimum declarative-phase change that delivers that, and can it ship independently of the type-barrel split?"
3. **Content → Coordination**: "Your `check:process` script — which of its checks would actually catch the failures that rotted the test suite? Specifically, would any of them have flagged the 8-day test redness earlier?"

### Candidate consent proposal (strongest from Round 1)

**PROP-1 (draft):** *"Delete all count-based assertions from the test suite (encounter template count, unified-action rarity counts, TRACE_CATEGORIES count, similar). Replace with a small `test/contentInvariants.ts` helper that asserts structural properties independent of count: every template has 2–4 steps, every step has valid targeting, no orphan reach references, every aftermath effect uses a known `kind`. Ship alongside or inside TB-120."*

Why this is consent-ready:
- **Good enough for now:** directly addresses a documented recurring failure (the test-suite-erosion cluster from the 2026-04-11 retro, 7 entries ≈ 15 occurrences).
- **Safe enough to try:** purely subtractive on the test side; additive on the invariant-helper side; fully reversible by git.
- **Cross-perspective support:** Engine identified it explicitly; Coordination cites the underlying retro; Content would benefit directly because content-pipeline runs no longer break the suite on addition.
- **Touches all three pillars implicitly:** Engine (abstraction), Content (iteration speed), Coordination (suite health).

If Round 2 converges quickly, PROP-1 is the first consent round. If tensions above surface new information, PROP-1 may get amended before consent is requested.

## Round 2 — responses

*(deferred pending subagent availability — see Status below)*

## Consent rounds

*(deferred pending Round 2 — see Status below)*

## Preliminary synthesis

**Status at close of Round 1:**
- Round 1 complete (degraded mode — single orchestrator authoring, flagged).
- Between-round orchestrator analysis complete: convergences, tensions, and a candidate consent proposal identified above.
- Round 2, consent round, and final synthesis **deferred** pending independent-subagent availability (subagent tool was rate-limited).

**Decisions reached:** none (no proposal has passed consent).

**Proposals staged for Round 2 / consent:** PROP-1 (delete count-based assertions + add content invariants helper).

**Takeaways already durable from Round 1, even unratified:**
- "Automation over social convention" emerged as a cross-pillar principle. Whether it becomes a consent decision or a CLAUDE.md rule addition is a Round-2 question.
- Change cost in Threadbearer concentrates in a small set of high-re-read artefacts (type barrels, orchestrator wiring, CLAUDE.md-embedded rules, wiring guide, exemplar list). Any improvement work should target compression / caching of these artefacts first.
- TB-120 (test repair) and TB-121 (CI setup) are already the project's top-priority backlog items. PROP-1 fits inside TB-120 as its cleanest sub-unit.

**Suggested follow-up Linear issues (for the user to file or groom when appropriate):**
- Sub-issue under TB-120: delete count-based assertions, add `test/contentInvariants.ts`. (PROP-1 if consented.)
- Separate issue: declarative engine-phase registry — convert `wiring-checklist.md` from a doc to a type check.
- Separate issue: extract `Docs/authoring-brief.md` as compiled subset of wiring guide + game-design-direction for pipeline injection.
- Separate issue: `npm run check:process` lint script for "agents should remember" rules; wire into CI alongside tests.
- Separate issue: `scripts/session-precheck` sandbox probe for first tool call of coding sessions.
- Separate issue: deterministic retro-draft generator from impediment log.
- Lightweight: `Docs/exemplars.md` index with promotion rubric.

**Open questions escalated to user:**
1. Approve continuing this council (Round 2 + consent on PROP-1) with real subagents when available, or close and file the candidate proposals directly as Linear issues for grooming?
2. Should "automation over social convention" be formalised as a CLAUDE.md principle now, or only after the council fully runs?

## Synthesis

**Resolution:** at the user's direction after Round 1, the candidate proposals surfaced in the orchestrator reading were filed directly as Linear issues for grooming, rather than continuing through Round 2 and a consent round. The council is closed at Round 1 + orchestrator reading. The filed issues carry the council's reasoning forward; future grooming and implementation happen there.

### Filed Linear issues

| # | Issue | Title | Project | Priority | Model |
|---|-------|-------|---------|----------|-------|
| PROP-1 | [THR-237](https://linear.app/threadbare/issue/THR-237) | Replace count-based test assertions with contentInvariants helper | Repo Health | High | sonnet |
| 2 | [THR-238](https://linear.app/threadbare/issue/THR-238) | Convert orchestrator phase wiring to declarative registry | Continuous Improvement | Normal | opus |
| 3 | [THR-239](https://linear.app/threadbare/issue/THR-239) | Extract Docs/authoring-brief.md as compiled content-pipeline preamble | Content Architecture | Normal | sonnet |
| 4 | [THR-240](https://linear.app/threadbare/issue/THR-240) | Add npm run check:process lint for "agents should remember" rules | Continuous Improvement | High | sonnet |
| 5 | [THR-241](https://linear.app/threadbare/issue/THR-241) | scripts/session-precheck — probe sandbox capabilities at session start | Continuous Improvement | Low | haiku |
| 6 | [THR-242](https://linear.app/threadbare/issue/THR-242) | Generate retrospective draft from impediment log deterministically | Continuous Improvement | Low | sonnet |
| 7 | [THR-243](https://linear.app/threadbare/issue/THR-243) | Create Docs/exemplars.md as rubricised index of quality exemplars | Continuous Improvement | Low | haiku |

### Unratified takeaways worth noting

These were identified in Round 1 but did not pass a consent round. Treat as directional, not decisional:

- **"Automation over social convention"** emerged as a cross-pillar principle. Four of the seven filed issues are direct expressions of it (THR-238, THR-240, THR-241, THR-242). Whether the principle should be formalised in `CLAUDE.md` is an open question left to the user.
- **Change cost in Threadbearer concentrates in a small set of high-re-read artefacts** — type barrels, orchestrator wiring, CLAUDE.md-embedded rules, wiring guide, exemplar list. Compression / caching / type-checking of these artefacts has compounding payoff; most of the filed issues target one of them.
- **TB-120 and TB-121** are already the project's top-priority backlog items. THR-237 (PROP-1) fits inside TB-120 as its cleanest sub-unit.

### Council mode caveat

Round 1 ran in degraded mode (orchestrator-authored perspectives, flagged on the page). This means the divergence between perspectives is weaker than a real multi-subagent run would produce. The filed issues should still be sound (they would have been surfaced either way), but a future council on a different question can be re-run with independent subagents for a cleaner pattern demonstration.
