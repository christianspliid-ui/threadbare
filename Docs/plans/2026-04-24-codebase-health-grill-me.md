# Grill-Me Pass — Codebase Health First-Wave

**Linked brainstorm:** `Docs/plans/2026-04-24-codebase-health-recurring-process-brainstorm.md`
**Linear:** [THR-260](https://linear.app/threadbare/issue/THR-260)
**Date:** 2026-04-24
**Scope under interrogation:** first-wave (ubiquitous-language, grill-me, weekly drift scan, retro × scan cadence sync)

---

## How to use this doc

Answer inline. Shape of each answer is your call — a sentence, a phrase, or "TBD, decide in design doc" is all fine. Questions are ordered by load-bearingness within each group; skip any that feel obvious.

Goal: reach a **shared design concept** (Brooks). When you're done, Cowork synthesizes your answers into a design doc. Questions marked ⚡ are ones where Cowork has a strong lean; pushing back on those is the highest-value thing you can do here.

Budget: 27 questions. This is roughly the cap Cowork has in mind for the final skill. Tell me afterward if it felt too long, too short, or wrong-shaped.

---

## A. Ubiquitous-language skill + `Docs/ubiquitous-language.md` (7 questions)

**A1.** Where does the doc live — repo (`Docs/`), Obsidian vault, or both with a sync script?
⚡ *Cowork leans: repo canonical, Obsidian renders it via wiki mirror. Repo wins because it's where the code is and where CI can lint against it. Agree / push back?*

> **Your answer:** your recommendation

**A2.** Monolithic single file, or domain-sharded (`Cosmology.md`, `Agents.md`, `Encounters.md`, `Coordination.md`, `Prose.md`, …)?
⚡ *Cowork leans: sharded. Single file becomes unreadable past ~60 terms. Agree / push back?*

> **Your answer:** your recommendation

**A3.** Primary audience — agent-first (directive, brief, example-heavy), or human-first (prose glossary with rationale)?

> **Your answer:** agent first. on the game we develop i am the only human.

**A4.** Who can add new terms — humans only, agents propose for human approval, or both can add freely?

> **Your answer:**  agents can propose for human approval. this also helps me learn


**A5.** What counts as drift? Options:
- (a) Term in canonical list but not appearing in code/docs anywhere for >30 days → flag for removal
- (b) Term appearing in code/docs but not in canonical list → flag for addition
- (c) Both
- (d) Something semantic (two terms that might refer to the same thing)

> **Your answer:** c.

**A6.** Does this replace anything — CLAUDE.md glossary-ish sections, parts of Obsidian `Index.md`, `world-model.json` descriptions — or sit alongside everything?

> **Your answer:** i think it overlaps to some extent with the taxonomy work we are doing for content, but i would think the ubi language should be the fundamental of the entire project.

**A7.** When does an agent load it — always at session start (costs context budget), on-demand via skill trigger (cheaper but relies on correct routing), or both (always load Table of Contents, pull full table on demand)?

> **Your answer:** i am unsure. recommendation?

---

## B. Grill-me skill (6 questions)

**B1.** Invocation threshold — when does it fire?
- (a) Cowork's estimate of CC day-count (e.g., ">1 day of executor work")
- (b) Three-pillar touches (">1 pillar affected")
- (c) User explicitly invokes via `/grill-me`
- (d) Cowork self-detects and asks permission first
- (e) Some combo

> **Your answer:** all of them.

**B2.** Can Cowork auto-invoke, or must user explicitly ask?
⚡ *Cowork leans: auto-detect + ask permission ("This feels like a ~2-day change — want to grill first?"). Agree / push back?*

> **Your answer:** yes it can and should invoke instead of working on assumptions

**B3.** Output shape — this markdown-file format (async, fill-in), conversational interrogation (synchronous, one question at a time), or both modes with the user picking?

> **Your answer:** both modes, i pick based on mood and enery.

**B4.** Relationship to the existing 7-step design governance checklist — runs *before* the checklist (produces input for it), *replaces* the first step or two, or is *appended* to it?

> **Your answer:** i would think we append it or just expand the design checklist to reach a grill-me level of thoroughness

**B5.** Handling "I don't know" answers — mark the question as grey zone in output and continue, stop and ask user to think, or loop back to it later in the session?

> **Your answer:**  i don't know should first time mean, lets postpone working on this answer until other answers are locked in.

**B6.** Hard cap at ~30 questions, or variable by scope size (small idea = 10, large = 50)?

> **Your answer:** variable but err on the side of more questions

---

## C. Weekly drift scan (6 questions)

**C1.** Who runs it — Cowork scheduled task, GitHub Action, or both (scheduled as primary, CI as fallback if scheduled fails)? i am not sure. we have the local code on disk here, but maybe we need to start building our wow more around the github repo. recom?

> **Your answer:**

**C2.** Signal v1 subset — which of these ship on day one vs. deferred to v1.1?
- Coupling creep (Codesight high-impact delta)
- Broken-windows tally (TODOs, ts-ignores, skipped tests)
- Complexity outliers (cyclomatic jumps)
- Test suite runtime + flake candidates
- Bundle size & build time trend
- Module depth deltas *(soft-blocked by THR-264 metric definition)*
- Ubiquitous-language drift *(depends on A1–A5 landing first)*
- Skill freshness *(soft-blocked by THR-265 metadata retrofit)*

⚡ *Cowork leans: v1 = coupling creep + broken-windows + test runtime + UL drift. Defer module depth and skill freshness to v1.1 when their metrics land. Agree / push back?*

> **Your answer:** lets follow your recom

**C3.** Output destination — single Linear issue per week in Continuous Improvement, or multiple issues (one per red signal)?

> **Your answer:** one per Signal

**C4.** Who triages — Cowork on the following session when you ask, you manually on Monday, or auto-convert red signals into Backlog issues?

> **Your answer:** the daily backlog grooming Cowork schedule should triage. update that.

**C5.** Thresholds — hardcoded constants (fastest to ship, no tuning surface), or expose as a `scan.config.json` (more work, allows adjustment without re-editing the scan)? 

> **Your answer:**i dont understand

**C6.** Acceptance criteria for v1 shipping — what has to be true after week 1 for us to call the scan "working"? (E.g., "produces at least one signal per scan," "at least 80% of raised signals result in a groomed issue," "no false-positive flood requiring thresholds to be re-tuned in the first week.")

> **Your answer:** i will assess qualitatively based on your quantitative data (sense-making)

---

## D. Retro × drift-scan cadence sync (3 questions)

**D1.** Ordering — drift scan Monday morning, retro Friday afternoon, or opposite? Or same day?
⚡ *Cowork leans: scan Monday (input for the week), retro Friday (reviews the week including what the scan surfaced). Agree / push back?*

> **Your answer:** makes sense to put them closer together so drift scan is right before retro, right? to work on warm data.

**D2.** Does the weekly retro *read* the drift-scan output as part of its input, produce completely independent signal, or are they merged into one artifact?

> **Your answer:** it should be an input to the retro. and the data should be warm, so generated an hour before or so.

**D3.** Single "weekly health update" artifact in Linear that both scan and retro feed into, or two separate issues/comments?

> **Your answer:** i think we split. the retro also checks the impediments backlog.

---

## E. Cross-cutting (5 questions)

**E1.** First-wave shipping order. Dependencies suggest:
1. Ubiquitous-language doc (v1 static) → unblocks A-side of drift scan
2. Grill-me skill → usable immediately on next feature
3. Weekly drift scan → needs UL doc for the drift signal
4. Retro cadence sync → needs scan to sync with

Agree with that order, or would you ship a different way? agree.

> **Your answer:** agree

**E2.** Process-weight budget — I'm proposing first-wave adds:
- 2 new skills (`ubiquitous-language`, `grill-me`)
- 1 new artifact (`Docs/ubiquitous-language.md`)
- 1 new scheduled job (weekly drift scan)
- 1 sync-tweak to the already-existing retro skill

Is that within your tolerance, or too much?

> **Your answer:** agree

**E3.** Success criteria — 4 weeks after first-wave lands, what single thing tells you this worked? (E.g., "fewer 'what does X mean again' moments," "grill-me caught a scope ambiguity that would have cost a day," "drift scan flagged coupling growth before it became a refactor.")

> **Your answer:** faster, cheaper, better end2end delivery of quality features (my assessment)

**E4.** Failure handling — if the weekly drift scan produces no actionable issues for 3 consecutive weeks, is that:
- (a) Working — health is genuinely good, keep running
- (b) Noise — thresholds are wrong, tune them
- (c) Dead signal — kill the scan
How do we distinguish?

> **Your answer:** something to assess in the retro also. keep vigilant, but not necesarily a failure. this is a complex pattern so needs sense making and not just metrics thresholds.

**E5.** First-wave execution — single design doc + single Linear issue for the whole wave (simpler, one handoff), or one design doc + four Linear issues (granular, allows parallel execution)?
⚡ *Cowork leans: single design doc covering all four, split into four Linear issues with mutex/parallel-safe coordination blocks. Each can be claimed independently once the design lands. Agree / push back?*

> **Your answer:** agree with cowork

---

## F. Freebie — meta-feedback on this grill

**F1.** Did this length feel right, too long, or too short?

> **Your answer:** fine length for the complexity of the topic

**F2.** Which questions were most / least useful?

> **Your answer:** the least interesting is the delivery chunking choices. i think we all know to delivery iteratively, and chunk for feedback, you should be able to assess that from the other anwers.

**F3.** Should the final `grill-me` skill favor async-batch (like this file) or conversational (one Q at a time)?

> **Your answer:** conversational first

---

*When you're done, fill in the answers and ping me. Cowork will synthesize into a design doc for first-wave implementation.*
