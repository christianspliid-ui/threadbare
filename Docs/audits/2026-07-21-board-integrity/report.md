# Board-integrity audit — Done issues with no landing commit

**Date:** 2026-07-21
**Issue:** THR-687
**Type:** one-time sweep, read-mostly. **Zero Linear state changes made by this audit.**

## Why

THR-540 was auto-closed to Done two minutes after filing because an unrelated PR *title* contained
"file THR-540 durable fix" — Linear closes on a bare `fix|close|resolve THR-XX` substring. For three
weeks the board showed the skill-sync problem as solved while the impediment log accrued ~63
recurrences and every executor re-derived a workaround for a "fixed" issue (impediment #187).

This sweep answers: **how many more of those are on the board?**

## Method

1. Pulled every Threadbare issue in `Done` with `updatedAt` inside 56 days — 234 issues across 5
   paginated `list_issues` calls. Filtered to `completedAt >= 2026-05-26` (the ~8-week window):
   **211 in-scope issues**.
2. Dumped `origin/main` commit subjects + bodies since 2026-04-20 (**1,215 commits**) and matched
   each issue id against them.
3. Bucketed by evidence strength, then checked GitHub PR titles/bodies for every issue lacking an
   explicit close keyword.
4. For each remaining candidate, grepped the working tree for the ticket's *stated scope* — the
   "does a merged PR plausibly implement this" check. This step is what separates a missing keyword
   from a missing feature, and it changed several verdicts.

**Known limitation:** commit scan starts 2026-04-20. An issue completed in-window whose work landed
before that date would read as no-evidence. None of the flagged items fall in that gap.

## Results

| Bucket | Count | Meaning |
|---|---|---|
| **A** — explicit `Fixes/Closes/Resolves THR-XX` commit on `main` | 172 | Healthy. Auto-close fired as designed. |
| **B-strong** — own scoped commit (`feat(thr-XXX):` / `docs(plan): THR-XXX`) | 11 | Work landed; keyword absent but provenance is unambiguous. |
| **B-weak** — passing mention only, inside another ticket's commit | 18 | Work most likely landed under a sibling/batch commit. Provenance weak, not flagged. |
| **C** — no trace on `main` at all | **10** | **Flagged below.** |

**81.5% (172/211) of Done issues carry a clean landing commit.** The keyword discipline is mostly
working; the failures cluster in two places — sibling-batch closures (B-weak) and the 10 below.

## Flagged — no landing evidence (10)

Graded by confidence. **No reopens performed** — reopening is a triage decision.

### HIGH — the working tree actively contradicts the Done state (4)

| Issue | Done | Evidence |
|---|---|---|
| **THR-478** — Influence Tier name-map, rename 5 tiers to canon (Unaware/Curious/Recognized/Devoted/Enthralled) | 2026-06-23 | `src/data/influence-content.ts:44` still reads `/** Working names for each tier. */` with `Unaware/Touched/Devoted/Champion/Aspect`. Three of the five canon names were never applied. Only PR is **#383, CLOSED unmerged**. |
| **THR-497** — G6 CMS Content Health Report viewer (`?view=cms`) | 2026-06-26 | No content-health entry in `src/components/CMS/registry.ts`. The surface does not exist. Design doc `Docs/plans/2026-06-22-content-health-report-design.md` §G6 landed; the viewer did not. |
| **THR-538** — Scalar unification, collapse `AxiologicalProfile` + `ArchetypeDrift` to one 0–1 model | 2026-06-30 | `src/types/axisRegistry.ts:225` states the opposite outcome: "Internal engine storage (`AxiologicalProfile`, `ArchetypeDrift`) **remains** on the legacy signed ±1 scale." THR-559 shipped a conversion *bridge* instead of the collapse. Scope was superseded, not delivered — verify the closure was intentional. |
| **THR-556** — Heart full-retinue signature (Sworn Oath, **full version**) | 2026-07-05 | `src/data/reach-signature-content.ts:678` is labelled `Heart — Sworn Oath (stub)` with the comment "full retinue deferred, plan §10". The issue is itself described as a Deferral gated on the party/retinue feature. Closed while explicitly deferred. |

### MEDIUM — no evidence anywhere (3)

| Issue | Done | Evidence |
|---|---|---|
| **THR-467** — Encounter volume scaling, context-multiplied surfaces | 2026-06-23 | Zero commits on `main`. No `volumeScal*` / `contextMultipl*` / `encounterVolume` symbols in `src/`. Only PR is **#373, CLOSED unmerged** (a batch-flush doc PR). |
| **THR-480** — Persona/archetype unlock paths, S/E/M/L/X tiering | 2026-06-23 | Zero commits. No `unlockPath` / `personaUnlock` symbols. The only merged PR matching the id (#400) is a doc batch-flush that mentions it in passing. |
| **THR-483** — Twilight Phase, authored-beat / procedural-echo split | 2026-06-23 | Zero commits. Twilight *constants* exist in `src/components/CMS/tunableConstants.ts` but predate the ticket; no `proceduralEcho` symbol anywhere. The specification this ticket asked for was never written. |

### MEDIUM — remedy landed later, under a different ticket (1)

| Issue | Done | Evidence |
|---|---|---|
| **THR-468** — Weekly retrospective lapsed; `weekly-retro` not firing | 2026-07-05 | No commit, no PR. The actual remedy — registering `weekly-retro` in the CC scheduler — shipped **2026-07-20 under THR-653**, fifteen days *after* this issue was closed. Board showed the retro gap as solved for two weeks while it was still open. |

### LOW — adjacent infrastructure exists; scope partially satisfied (2)

These two may be legitimately covered by the THR-473 content-census work under a different ticket id.
Flagged for verification rather than as confirmed misses.

| Issue | Done | Evidence |
|---|---|---|
| **THR-495** — G3 shared content classifier (`templateId → {type, reach, scale}`) | 2026-06-26 | No commit or PR. But `src/engine/contentCensus/adapters.ts` and `src/types/contentCensus.ts` (carrying `reach?` + `scale?`) shipped under **THR-473**, and may satisfy G3 in substance. Verify whether the classifier requirement is met. |
| **THR-496** — G2 Content Health Report matrix runner + content-to-god match | 2026-06-26 | No commit or PR. `scripts/content-census.ts` + `src/engine/contentCensus/matrix.ts` exist (headed "Content Census (THR-473 P1)"), so the matrix runner substantially exists — but the ticket's distinguishing features, **per-seed × per-ascendant-reach trigger coverage** and **content-to-god match**, produce zero grep hits. Likely partial. |

## B-weak — closed via a sibling's commit (18, not flagged)

Provenance is weak but the scope was plausibly delivered inside a batch. Listed for the record, no
comments posted:

THR-414, THR-417, THR-431, THR-442, THR-469, THR-482, THR-484, THR-485, THR-498, THR-526, THR-532,
THR-537, THR-547, THR-558, THR-568, THR-611, THR-631, THR-652

The recurring shape: a multi-slice feature ships in one commit naming only the parent (e.g. the
personality series closing THR-526/532/537/547 under `feat(personality): …`), or a follow-up
impediment-log commit mentions the id in passing and Linear's substring match closes it. Neither is
a false Done, but neither leaves an audit trail a planner can trust.

## Recommendations

1. **Triage the 4 HIGH items first** — each has working-tree evidence contradicting Done. THR-478 and
   THR-556 look like clean reopens; THR-538 needs a decision on whether THR-559's bridge deliberately
   superseded the collapse; THR-497 needs a call on whether the CMS viewer is still wanted.
2. **THR-467 / THR-480 / THR-483 are three Content-Architecture / Action-System specs closed on
   2026-06-23** with no output. That single date suggests one batch-flush PR (#373/#383, both closed
   unmerged) took a group of issues down with it. Worth checking whether more of that day's batch
   shares the pattern.
3. **The structural fix is already queued.** THR-688 (ticket-authoring rules) and the auto-close
   phrasing hazard are the upstream causes: Linear's bare-substring close fires on PR *titles* and
   branch names, with no reliable pre-merge mitigation. This audit is the detection half; the
   prevention half needs the keyword to be the *only* close vector.
4. **Re-run cadence:** this sweep is cheap (~5 Linear calls + one git log). Folding it into
   `weekly-project-hygiene` would catch the next THR-540 in days rather than three weeks.

## Verification

Read-only audit. No engine, UI, or content code touched. `npm test` / `vite build` gates run against
the doc-only change; browser-verify exempt per the issue's Done-when ("Browser-verify exempt: audit
only").
