# Brainstorm companion — Encounter coverage map (THR-1723)

> Companion to [`2026-10-14-thr-1723-encounter-coverage-map.md`](2026-10-14-thr-1723-encounter-coverage-map.md). Records the alternatives weighed for each of the ticket's five decisions, the tensions, and the premises the plan rests on. Authored unattended by tb-design-lane, run 2026-10-14c.

## Premises

- **The map serves the author, not the player.** Its one named consumer is encounter-pipeline Step 0a (*"Its empty theme × Reach × Sphere cells are input to the category pick, not a quota"*). Every choice below favors "an author can act on this" over completeness.
- **A judgment is a worklist.** Content-judgments rule 2: advisory, never a gate. Nothing the run produces edits content.
- **Cheap enough to be careless with is dangerous.** At about $0.10 a run, the risk is not the bill. The risk is a question-set mistake that silently produces a confident, wrong map. The guards protect meaning: blind state, reversed-order twins, calibration and versioned questions.

## Decision 1 — Taxonomy

| Option | Verdict |
|---|---|
| **Four axes from seated vocabulary** (Reach, Sphere, Activity, Walk of life) + tag-fit | **Chosen.** Every word already exists, already means one thing, and is already read by the content query. |
| A free "theme" Choice over a new list (betrayal, rescue, debt, mystery…) | Rejected. It is a parallel taxonomy, which the ticket forbids, and it would compete with the `family` axis. A real gap surfaces as the *possible missing theme* finding and goes through a `UL-proposal`. |
| Theme = errand families (`#guild_errand` …) | Rejected as a theme axis. They are *who set the work*, not what it is about; they get tag-fit only. |
| Sphere as one Choice | Rejected. Encounters plausibly express zero or several Spheres. A Choice forces one and spreads probability across valid alternatives. |
| Reach as 8 Nouls | Rejected. Every entry declares exactly one Reach, so a Choice matches the shape being checked. Its distribution also shows close seconds. |

**Tension.** The walk-of-life subset (17 of 126 family words) is a judgment about which words name a domain of life. The filter is stated, and the list is a constant, so a veto is a one-line change.

## Decision 2 — Question design

- **Blind state** (no declared labels) vs **informed state** ("the author says Iron; does it fit?"). Blind was chosen. An informed question is a tag-fit question, and Jev reads literally (jaggedness #1), so naming the author's answer anchors it. The mislabel comparison is only meaningful if the two labels are independent.
- **Reverse-order twin on every entry** vs only on the calibration sample. Every entry was chosen: it adds two questions and almost no cost, and it turns jaggedness #8 into a per-entry stability flag instead of a corpus statistic.
- **One request per entry** vs **many entries per request**. One per entry was chosen. Packing several encounters into one state makes each question refer to `encounters[i]`, which is the indirection Jev handles worst (jaggedness #4). It also mixes irrelevant detail into every judgment (#5).

## Decision 3 — Findings

- **Auto-apply confident activity backfills** was rejected. That would make the model an author, and the rejected "pure LLM-generated content" approach and rule 2 both forbid it. A human or agent reads the backfill list and decides.
- **File a ticket per finding** was rejected: that is hundreds of tickets. One ticket per finding *class*, filed by whoever closes the run, keeps the board legible.
- **Diff-only on re-runs** keeps the second report from re-announcing the first report's findings.

## Decision 4 — Where it lives

| Option | Verdict |
|---|---|
| **`ops` branch, fixed paths, overwritten** | **Chosen.** Run exhaust belongs on `ops` (THR-947). Git history gives the run-to-run diff, and agents already read `ops` with `git show`. |
| Checked into `main` under `Docs/audits/` | Rejected. About 1 MB of regenerable data in every worktree, plus a docs PR for every re-run. |
| Dated files per run | Rejected. Diffing needs two paths, and the "latest" pointer becomes a convention to maintain. Git history already holds the dates. |
| A served wiki page | Deferred, not rejected. The encounter catalog is withheld from players by ruling (THR-1495), and the authoring readers need only a link. A page is one additive manifest row later. |

## Decision 5 — Calibration

- **Who checks.** A human reader is the classic answer, but Christian is chat-only and reviews no data (THR-608). A blind, fresh-context reader subagent was chosen; its labels and prompt are persisted, so anyone can audit them. If the reader and Jev agree for the wrong reasons, the mislabel audit's human-legible worklist is the next check.
- **Sample size.** 32 (±12 points) was too loose to separate 85% from 70%. 128 doubles the reader cost for about ±6 points. 64 (±9 points), stratified 8 per Reach, was chosen.
- **Threshold rule.** "Lowest confidence giving 85% agreement over at least half the sample" balances precision against admitting enough of the corpus to draw a map. A rule without the admitted-share floor could pick a threshold that admits five entries.
- **Failure is a result.** If Jev cannot reach the bar, the axis is reported uncalibrated and everything routes to review. Closing slice B on a measured "no" is better than tuning the bar until it says yes.

## What would change the plan

- Christian wants the map in the wiki → add the manifest row (UI pillar becomes a page; no other change).
- The first run shows that walk of life is mostly `none` → the possible-missing-theme finding fires, and the vocabulary question goes to a `UL-proposal`, not into this runner.
- Reach agreement is far below 85% → the mislabel audit is premature. Its ticket should say so and wait for a better question or model.
