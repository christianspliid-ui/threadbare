---
name: cold-playtest
description: Run one cold playtest round of Threadbearer — three no-knowledge testers (fresh `claude -p` processes outside the repo, browser tools only) play the deployed build from its real front door. Then verify every finding against source, file the verified ones into a round milestone, track earlier rounds' findings as fixed-confirmed / not-exercised / recurred, and publish the round report and scorecard to `ops`. Run by the daily `tb-cold-playtest` lane (gated) or by hand. Triggers on "cold playtest", "/cold-playtest", "run a playtest round", "cold tester", "new-player playtest".
last_validated_against: 2026-09-25
invocation: /cold-playtest [--dry-run] [--lane]
audience: claude-code
---

# Cold playtest

**Plan:** `Docs/plans/2026-09-25-thr-1610-cold-playtest-loop.md` (THR-1610). It explains why the loop exists, how the tester is kept cold, and the tables this procedure refers to. Read it on first use.

Every other verification lane is driven by an agent that knows the rules and usually enters through a dev URL. This one plays what a new player plays. **The tester's beliefs are data, not verdicts.** Your job is the observer's: read what they hit, find the cause in source, and file only what verifies.

## Harness

| File | Role |
|---|---|
| `scripts/cold-playtest/config.json` | every tunable (cadence, budget, model, pinned Playwright MCP, thresholds) |
| `scripts/cold-playtest/personas.json` | the fixed persona set: `story`, `veteran`, `skimmer` |
| `scripts/cold-playtest/player-brief.md` | brief v1: the store-page pitch, persona slot, playtest-log protocol, 7-section debrief |
| `scripts/cold-playtest/run-player.ps1` | one tester: fresh `claude -p`, replaced system prompt, `--setting-sources local`, Playwright-only tools |
| `scripts/cold-playtest/run-round.ps1` | all personas in parallel, then `round.json`, then screenshot pruning |
| `scripts/cold-playtest/extract.mjs` | transcript → `log.md` + `summary.json` (verdict, tag counts, debrief bullet counts, cost) |

Artifacts are written to `%USERPROFILE%\.threadbare\cold-playtest\round-N\<persona>\`, never into the repo (~240 MB of screenshots per round).

**Brief wording is load-bearing.** It is phrased as a *playtest log* because the round-1 draft ("think aloud before every action") was refused by the model's safeguard as reasoning extraction. Never reword it inside a run, and never ask a tester about its own instructions. A brief or persona change is a PR that bumps `briefVersion`.

## Procedure

### 0. Mode and gates

| Mode | Invoked as | Gates evaluated | Linear writes |
|---|---|---|---|
| **Lane** | `tb-cold-playtest` (`--lane`) | 1, 2, 3, 4 | yes |
| **Attended** | `/cold-playtest` by hand | 2, 4 (the director may ask for a round any time) | yes |
| **Dry run** | `--dry-run` (combinable with either) | as the mode says | **none**: no milestone, no tickets, no comments. The report is marked DRY RUN, and no scorecard rows are written |

The four gates (plan § *When the next round runs*; constants in `config.json`):

1. **Current round closed.** List the milestones of project **Onboarding & First-Run Experience** (`list_milestones`) matching `Cold playtest · round <k>`. Take the highest *k*, then `list_issues(project, milestone)` including Done/Canceled. Every issue must be Done or Canceled.
2. **Deployed.** `npm run check:deploy` reports `deployed` (or `skipped`) for `main`, and the newest `completedAt` in the milestone is at least `deploySettleMinutes` old.
3. **Spacing.** At least `minDaysBetweenRounds` days since round *k* ran (its `round.json` `startedAt`, else the milestone's creation date).
4. **Auth.** `claude -p "reply ok" --model haiku` run **from a temp directory outside the repo** exits 0 and says ok. The tester uses the standalone CLI's own login, not the desktop app's, and that token expires on its own.

**Lane mode with a shut gate writes nothing,** with one exception. If gate 1 is shut and round *k* has been open longer than `staleRoundDays`, publish a short stale-round report (step 8 shape, `needsChristian: true`) whose `## Needs Christian` lists the open issues and their states as links. Publish it at most once a week: skip if a stale report for round *k* is on `ops` and less than 7 days old.

**Gate 4 fails** → in lane mode, publish a one-line report whose `## Needs Christian` says: *"The cold tester's login expired. Run `claude` in a terminal, then `/login`."* Then stop. In attended mode, say it in chat.

**Linear unreachable** (precheck `linear=noauth|unreachable`) → gate 1 cannot be evaluated. Report and stop.

### 1. Pick N

N = highest *k* from step 0 + 1 (round 1 was run by hand on 2026-09-25, so the first harness round is 2). The round directory must not already hold a `round.json`. If it does, `run-round.ps1` refuses; re-read the milestones rather than guessing.

A dry run uses the same N with `-Label dry-run`, which writes `round-N-dry-run\`, so it never occupies the directory the real round N will need.

### 2. Run

```powershell
pwsh scripts/cold-playtest/run-round.ps1 -Round N                  # real round
pwsh scripts/cold-playtest/run-round.ps1 -Round N -Label dry-run   # dry run
```

Run it from the repo root (the scripts locate their own config), in the background: a round takes ~10–15 min wall clock and up to `playerTimeoutMinutes`. Read `round.json` when it finishes. If `usable < minUsablePersonas`, the round is **void**. Report which personas failed and each `failure` (`auth`, `safeguard`, `incomplete`, `error`, `no-transcript`), file nothing, and stop.

### 3. Read

Read every usable persona's `log.md` **in full**, not just the debrief. The in-play `GOT … SURPRISE`, `CONFUSED`, `LOST` and `WOULD QUIT` lines carry the evidence and the action number where each happened. Open a screenshot from `shots/` whenever a log line is ambiguous. Record **met The First (y/n)** per persona from the log: did the tester meet and bond a named mortal? This is the one scorecard field the extractor cannot produce.

### 4. Candidates

One row per distinct thing a tester hit: what happened, verbatim quotes (short), which personas hit it, and the surface (screen, panel, popup). Merge rows that are the same underlying thing seen twice.

### 5. Verify

`git fetch origin main` first. Resolve every candidate against source on `origin/main`, never on the tester's word alone. Fan out an Explore subagent to locate the rendering component or the rule when the surface is not obvious. Classify each (plan § *The observer*):

| Class | Meaning | Filed as |
|---|---|---|
| `bug` | cause found in code; behavior is plainly wrong | `Bug`, **Ready for Dev**: cause (file:line), fix direction, Done-when, and the THR-836 coordination block as its **first comment** |
| `design` | behaves as built; the player cannot understand or reach it | `Game Design`, **Todo**: evidence quotes, diagnosis, the design question, a recommended direction, and a **"Fixed when …"** line naming the observable test (e.g. "a round-N+1 tester meets The First"). Its Done-when says its implementation tickets are filed into this same milestone |
| `tester-error` | the tester misread something a human would read correctly | not filed; listed in the report with the source line that shows why |
| `unverified` | could not reproduce or locate | not filed; listed in the report with what was tried |

A finding is filed when **at least one** tester hit it and it verifies. The report ranks it by how many personas hit it. Watch for the round-1 traps: a surprise that traces to a dev-only link (`?view=`), and a symptom whose cause is upstream of the screen where it showed.

### 6. Compare with earlier rounds

`list_issues(label:"cold-playtest")` across every state. For each earlier finding, record one status:

- **fixed-confirmed**: the ticket is closed and a tester reached the surface without hitting the problem. For design tickets, check the "Fixed when" line against this round's logs.
- **not-exercised**: no tester reached the surface. Carry it forward; do not re-file it.
- **recurred**: hit again. If the original is closed, file `Recurs after fix: <original title>` in the new milestone, `relatedTo` the original, with the new evidence. If it is still open, comment the new evidence on the original instead of filing a duplicate.

In a dry run, compute and report these statuses but write nothing.

### 7. File (skipped in dry run)

- Create milestone `Cold playtest · round N` in **Onboarding & First-Run Experience**. Its description points at the plan doc and names the round's date and brief version.
- File each verified finding into it with the label `cold-playtest` plus `Bug`/`Game Design` and the pillar labels.
- **Verify every write** with `get_issue` (impediment #48). A `&` in a title is a known cause of silently dropped fields, so re-save if one drops.
- A round with zero verified findings still gets its milestone (empty = instantly closed). Gate 3 is what stops it re-running daily.

### 8. Publish

Write `Docs/ops/cold-playtest-round-N.md` (dry run: `cold-playtest-round-N-dry-run.md`) in the round-1 report's shape (`git show origin/ops:Docs/ops/cold-playtest-round-1.md`):

- Frontmatter: `lane: cold-playtest`, `round`, `date`, `briefVersion`, `startUrl`, `deployedCommit`, `usable: X/3`, `filed`, `needsChristian`, and `dryRun: true` on a dry run.
- A `> **DRY RUN** — no milestone, no tickets; harness verification only.` banner under the title on a dry run.
- **Verdicts** table per persona, compared with the last round's verdicts: verdict, met The First, would-quit-at, never-understood, surprises, actions, minutes, notional cost.
- **Earlier findings**: fixed-confirmed / not-exercised / recurred, each as a Linear link.
- **New findings**: filed, with links, class, and personas hit. On a dry run, these are the would-be findings, unfiled.
- **Not filed**: tester-error and unverified, each with its reason.
- **Cost and duration.**
- `## Needs Christian`: 3–6 plain-language lines in game words only, every reference a clickable URL (Rule Zero). It carries the verdict trend, the top findings, and blocking items (login, a stale round). It is a status report, never a review invitation (level-system rule, 2026-08-13). Write `None.` when nothing needs him, which is the usual case for a dry run.

Append one scorecard row per persona to `Docs/ops/cold-playtest-scorecard.tsv` (columns as the file's header; skip on a dry run). Then publish from the repo root:

```bash
git fetch origin ops --quiet
git show origin/ops:Docs/ops/cold-playtest-scorecard.tsv > Docs/ops/cold-playtest-scorecard.tsv   # then append rows
bash scripts/ops-publish.sh -m "docs(ops): cold playtest round N" Docs/ops/cold-playtest-round-N.md Docs/ops/cold-playtest-scorecard.tsv
```

Delete the local copies after a successful publish. Neither file belongs on `main`. `keep-work-flowing-cc` folds the newest `cold-playtest-round-*` report's `## Needs Christian` into the briefing (step 2.6 sibling fold).

### 9. Prune

`run-round.ps1` already deletes `shots/` in rounds older than the newest `keepRoundsWithScreenshots`. Confirm its `pruned …` lines, or note `prune skipped`.

## Fail-soft

| Failure | Do |
|---|---|
| Start URL unreachable | `run-round.ps1` throws before any tester starts. Report the outage, file nothing |
| Login expired mid-round (`failure: auth`) | round void; `## Needs Christian` carries the `/login` instruction |
| Safeguard refusal (`failure: safeguard`) | void for that persona; quote the refusal in the report. Do not reword the brief in the run |
| Fewer than `minUsablePersonas` usable | round void; no tickets, no milestone |
| A finding will not verify | `unverified`, listed, not filed |
| `run-round.ps1` dies after the testers finished (no `round.json`, but each persona dir has a `transcript.jsonl`) | `run-round.ps1 -Round N [-Label …] -SummarizeOnly` re-extracts and writes `round.json` without re-running (re-paying for) the testers |
| `ops-publish.sh` fails | leave the report in the working tree and say so in the run output (a lingering ops report means a failed publish) |

This is a probe under the six-week sunset rule (CLAUDE.md § Process-work throttle). The weekly retro renews it by citing the findings a round filed.
