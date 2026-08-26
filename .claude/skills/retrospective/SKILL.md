---
name: retrospective
description: Review the impediment log (Docs/impediments.md) and conduct a structured retrospective. Reads this week's drift-scan Linear issues as the first input, then analyzes patterns, proposes concrete improvements to tools, skills, CLAUDE.md, and processes. Trigger with "/retrospective" or "run a retro" or "review impediments" or "continuous improvement review".
last_validated_against: 2026-08-26
---

# Retrospective

## Purpose

Turn accumulated impediment data and weekly scan signals into concrete improvements. This is the "act" step in a plan-do-check-act cycle. The impediment reporter captures friction; the drift scan surfaces codebase health signals; this skill synthesizes both and eliminates the most impactful friction.

## Workflow

### Step 0: Load Drift-Scan Input

Before reading the impediment log, load the current week's drift-scan output from Linear.

Query Continuous Improvement for issues labeled `drift-scan` created or updated in the last 7 days:

```
list_issues(
  project: "Continuous Improvement",
  label: "drift-scan",
  state: "Backlog",
  createdAt: "-P7D"
)
```

Also query `state: "Todo"` and `state: "In Dev"` for any scan issues already triaged this cycle.

**For each scan issue found:** extract the signal name (S1–S4), the summary, and the raw data. These feed the retro's pattern-recognition pass in Step 2.

**Graceful fallback (per §13):** If the Linear API is unavailable, note "drift-scan data unavailable this cycle" in the retro report's Summary section and continue from Step 1 using only the impediment log. Do not abort.

**Failure-handling (per §8.4 / §16):** If scan produced no issues this week (and the previous 2 weeks also produced none), explicitly include a "Signal health" agenda item in the retro:
- **Working (health good):** No red signals means codebase health is genuinely good — keep running.
- **Noise (thresholds wrong):** Signals aren't firing because thresholds are too permissive — propose tuning in the Tuning Recommendations section.
- **Dead signal (kill it):** Signal is structurally broken and not worth the maintenance cost — open a Linear issue to remove it.
The retro's qualitative assessment decides which category applies. No auto-kill.

Record which scan issue IDs were consumed; include them in the retro report.

### Step 1: Generate Deterministic Draft, Then Validate

Run `npm run retro-draft` first. This writes `Design/retros/retro-YYYY-MM-DD-draft.md` from `Docs/impediments.md` using deterministic parsing and stable ordering.

Open the generated draft and cross-check it against `Docs/impediments.md` before writing narrative conclusions. Treat the impediment log as the source of truth if anything disagrees.

Produce/verify these analytics:

1. **Volume**: Total new impediments since last retro
2. **By category**: Count per category, sorted descending
3. **By impact**: Count per impact level (S/M/L/Blocked)
4. **Top friction sources**: Group impediments by root cause (not just category). Example: 5 separate `api-quirk` entries might all trace to "Obsidian MCP patch_content is unreliable"
5. **Unresolved blockers**: Any entries where Workaround Found = No
6. **Repeat offenders**: Same impediment appearing 3+ times across sessions
7. **Total estimated time lost**: S=1min, M=8min, L=20min, Blocked=30min (rough heuristic)

### Step 2: Synthesize Scan + Impediments Together

Combine the drift-scan signals (Step 0) with the impediment analytics (Step 1) for a unified pattern pass:

- **Cross-signal correlation:** does the scan's S2 (broken-windows tally) align with impediment entries for process-friction? If scan and impediments point at the same root cause, the fix is higher ROI.
- **Scan vs impediments coverage gap:** are there friction patterns in impediments that the scan doesn't yet flag? If yes, note them as candidates for a new signal in the Tuning Recommendations section.
- **New scan signals this cycle:** for each red signal in Step 0, note whether it was a first-time hit or a repeat. Repeat signals that have been triaged and dismissed multiple times may indicate a calibration problem.

### Step 3: Identify Actionable Improvements

For each top friction source (and all unresolved blockers), propose a concrete fix. Categorize each proposal:

| Fix Type | What It Means | Example |
|----------|--------------|---------|
| **skill-update** | Modify an existing skill's instructions | Add workaround to gamedocumenter for Obsidian MCP quirk |
| **skill-create** | Create a new skill | Reusable pattern that agents keep rediscovering |
| **claude-md-update** | Add/modify instruction in CLAUDE.md | New architectural decision, new gotcha |
| **tool-config** | Change MCP server config, permissions, hooks | Fix a permission that keeps blocking agents |
| **process-change** | Change a workflow or convention | Reorder steps in Definition of Done |
| **cant-fix** | External limitation we can't change | Platform bug, API limitation — document and move on |

### Step 4: Prioritize

Score each proposed fix:

- **Frequency** (how often this impediment occurs): 1-5
- **Severity** (average impact when it occurs): 1-5
- **Fix effort** (how hard is the fix): 1-5 (1=trivial, 5=major)
- **ROI score** = (Frequency × Severity) / Fix effort

Sort by ROI descending. The top items are the most valuable improvements.

### Step 5: Execute Quick Wins (implement now, file tickets later)

For any fix with effort=1 (trivial) and ROI > 3, **implement it immediately**:

- Edit the skill file
- Edit CLAUDE.md
- Update the relevant process doc

For larger fixes, **draft** the Linear issue now but **do not file it yet** — filing happens in Step 9, after the report is committed. Drafting means writing the title, body, and ROI score into your working notes so Step 9 is a mechanical paste.

- Prefix description with `💡` if it needs design work, `🔲` if ready to build
- Include the ROI score so they can be prioritized relative to other backlog items

**Why the deferral (THR-798).** The 2026-07-24 run filed five tickets (THR-753/754/755/756/757) whose bodies read *"Filed by the 2026-07-24 weekly retro (report: `Design/retros/retro-2026-07-24.md`)"* six minutes after generating its draft — then ended before Step 6 ever wrote that report. The citations pointed at a file that has never existed in any commit, making five real tickets' reasoning unauditable. Ticket-before-report is the ordering hazard; Step 8 is the fix. See Rule 8.

### Step 5b: Systemic Wiring Guide Audit

**Check whether new engine capabilities have been added since the guide was last updated.**

1. Grep `src/types/effects.ts` for effect type names and compare against the capability inventory in `Docs/plans/2026-04-16-systemic-wiring-guide.md` Part 5.
2. Check `src/engine/proseEnrichment.ts` for placeholder patterns vs. what the guide documents in Part 2 Capability 1.
3. Check `src/types/encounter.ts` for EncounterTemplate fields vs. the guide's template-level fields table.
4. Check `src/engine/strategicGraphOps.ts` for available operations vs. Part 2 Capability 5.

If there are undocumented capabilities, flag them as a quick-win improvement (edit the guide immediately) or backlog if the capability is complex enough to need a worked example.

**Why this matters:** The wiring guide is the IKEA manual for content authoring. If it's stale, content agents produce hardcoded fiction instead of systemically alive content. Every undocumented capability is a missed opportunity for dynamic storytelling.

### Step 5c: Judge-Metrics Aggregation — evaluate intent-judge against its own kill criteria (THR-957)

**`Docs/judge-metrics/` is written every judgment and, until this step existed, was read by nothing.** `intent-judge`'s § Metrics to track claimed "`retrospective` skill consumes Fridays"; this file contained no reference to it and never had, so the weekly aggregation had never run once. That matters because intent-judge's **Kill criteria are all defined over aggregates** — they are the only mechanism that would ever retire the skill, and with no consumer they were unfalsifiable by construction.

**Read by header name, never by column index.** Six files carry **four different table shapes**: two have an extra `Linear` column, `2026-W29.md` uses lowercase kebab headers *and swaps `impact-class` before `verdict`*. A positional reader silently produces garbage rather than failing — measured 2026-08-03, it reported verdicts of `THR-75`, `THR-457` and `High-risk`, none of which is a verdict. Glob loosely too (`YYYY-W?ww`): `2026-20.md` and `2026-27.md` predate the `W` filename convention and a strict glob drops them.

```bash
node -e "
const fs=require('fs'),p=require('path'),d='Docs/judge-metrics';
const norm=s=>s.toLowerCase().replace(/[^a-z]/g,'');
let rows=[];
for(const f of fs.readdirSync(d).filter(f=>/^\d{4}-W?\d{2}\.md\$/i.test(f)).sort()){
  let hdr=null;
  for(const line of fs.readFileSync(p.join(d,f),'utf8').split('\n')){
    if(!line.trim().startsWith('|')) continue;
    const c=line.split('|').slice(1,-1).map(s=>s.trim());
    if(c.every(x=>/^[-: ]*\$/.test(x))) continue;
    if(!hdr){hdr=c.map(norm);continue;}
    const r={file:f};hdr.forEach((h,i)=>r[h]=c[i]);rows.push(r);
  }
}
const g=(r,...k)=>{for(const n of k)if(r[n]!==undefined)return r[n];return '';};
const n=rows.length,vd={};
for(const r of rows){const v=g(r,'verdict');vd[v]=(vd[v]||0)+1;}
const lat=rows.map(r=>parseInt(String(g(r,'latencys','latency')).replace(/[^0-9]/g,''),10))
  .filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
const med=lat.length?(lat.length%2?lat[(lat.length-1)/2]:(lat[lat.length/2-1]+lat[lat.length/2])/2):null;
const ov=rows.filter(r=>g(r,'overridden')!=='').length;
console.log('rows',n,'\nverdicts',JSON.stringify(vd));
console.log('Allow%',((vd.Allow||0)/n*100).toFixed(1),'Escalate%',((vd.Escalate||0)/n*100).toFixed(1));
console.log('median latency s',med,'\noverride rows recorded',ov);
"
```

Report each kill criterion with an explicit verdict — **`INSUFFICIENT DATA` with the row count is a valid and expected answer**, and is the honest one below the month of data the criteria require. Put the table in the report's § Tuning Recommendations.

| Kill criterion | Computable from the rows? |
|---|---|
| ≥95% Allow with zero user overrides | **Partly** — Allow % yes, "zero overrides" no (see below) |
| ≥50% override rate on Revise/Block | **No** — nothing records an override |
| Median time-to-judgment >5min (300s) | Yes |
| Zero catches the user wouldn't have caught | No — a judgement call, not a row |

**Two of the four cannot be computed at all, and saying so is the point.** The row schema has no override column, so the two override-keyed criteria are unfalsifiable no matter how many weeks accumulate — wiring a consumer that silently reported `0%` would have converted an unmeasured criterion into a *passing* one, which is worse than the gap it replaced. `intent-judge` now specifies an optional `Overridden` column so the criterion becomes computable prospectively; until rows carry it, report those two as `NOT MEASURABLE (no override column)`, not as satisfied.

**Dry run, 2026-08-03** — 11 rows across 6 files, 2026-05-15 → 2026-07-30. Verdicts parse as `{Allow: 9, Revise: 2}` — every value a real verdict, which is itself the check that the header-keyed read is working; the positional read of the same files returned `THR-75`, `THR-457` and `High-risk` as verdicts.

| Criterion | Value | Verdict |
|---|---|---|
| Allow % | 81.8% (9/11) | Below the 95% floor — **not** rubber-stamping |
| Escalation rate | 0.0% (0/11) | Below the 0.05 floor — worth watching, not a kill criterion |
| Median time-to-judgment | 92.5s (n=10) | Well under 300s — **pass** |
| Override rate | — | **NOT MEASURABLE** (0 rows carry an override column) |
| Zero marginal catches | — | Not row-derived; user judgement |

Caveats to carry, not to bury: 11 rows over 11 weeks is **below the "full month" of data every criterion requires**, so these are directional, not a verdict on the skill. One row's latency is unparseable and excluded (n=10 of 11).

**Verdict: keep intent-judge.** No criterion is met, and the two that could not be evaluated are now the only open question. Note the escalation rate sits below its own declared floor of 0.05 — that is a *tuning* signal for § Tuning Recommendations, not a retirement one.

### Step 5d: Guidance Divergence Audit — run `/guidance-audit` when direction has moved (THR-1253)

**Trigger, in one cheap comparison.** Read the `version` of each doctrine in
`Docs/guidance-manifest.json` and compare it against the version recorded in the **previous**
retro report's `## Guidance Audit` section. Run `/guidance-audit` for that doctrine if:

- **any doctrine version has moved** since the last retro (direction changed — the audit is
  how the change is proven to have reached the operative surfaces), **or**
- **a month has passed** since that doctrine was last audited, version movement or not.

Otherwise record `no version movement, last audited <date> — not run` and move on. Comparing
two integers is the whole trigger; that cheapness is deliberate, so the step survives a busy
retro instead of being skipped.

**Why this step exists.** Rulings land in the canonical chain; agents obey the *operative*
chain — the prompts, briefs, exemplars and vault samples they load first. Measured 2026-08-25:
three director-level prose-register rulings sat in canon while every operative surface kept
teaching the retired mode, and the pipeline drafted against inverted rules for weeks.
`check:guidance-freshness` catches the mechanical case (authority edited, dependent untouched)
at change time; it structurally cannot see a dependent that was *touched* and still teaches the
old rule, two live surfaces contradicting each other with no diff between them, or a doc a
newer doc has silently replaced. Those need reading, which is what the audit skill does.

**Where its output goes — into this report, never onto the board.** Per the 2026-08-10
throttle, this retro is the *single promotion point*: the audit logs impediment rows, and
Step 3/Step 4 here decide which of them clear the materiality bar and become tickets, with the
accumulated cost quoted. Do not let the audit file its own.

Record in the report under `## Guidance Audit`: the doctrine versions as of this retro (so the
next retro has its comparison baseline), whether the audit ran and why, and the ranked pollution
list if it did. **Write the versions even when the audit did not run** — omitting them breaks
the next retro's trigger, which is the one thing this step cannot afford.

### Step 6: Write the Retrospective Report

Create a dated file: `Design/retros/retro-YYYY-MM-DD.md`

Write **Improvements Backlogged** as the literal placeholder `_Filed in Step 9._` — the ticket IDs do not exist yet, and that is fine. Step 9 backfills them. Every other section is written in full here: the report must stand on its own the moment it is committed, because Step 8 commits it before any ticket is allowed to cite it.

Structure:
```markdown
# Retrospective — YYYY-MM-DD

## Period
From: <date of last retro or project start>
To: <today>

## Summary
- Drift-scan issues consumed: <list IDs, or "none this cycle" / "data unavailable">
- Impediments logged: N
- Total estimated time lost: ~Xh Ym
- Top category: <category> (N occurrences)
- Improvements implemented: N
- Improvements backlogged: N

## Drift-Scan Signals This Cycle
<For each red signal: signal name, summary, raw data. If no scan data: note why.>
<If 3+ consecutive weeks with no red signals: include Signal health assessment (working / noise / dead).>

## Impediment Analytics
<tables from Step 1>

## Cross-Signal Patterns
<synthesis from Step 2: correlations, gaps, repeats>

## Guidance Audit
Doctrine versions this retro: <id>@<version>, … (from Docs/guidance-manifest.json)
Ran: <yes — version moved since <prev> / yes — monthly cadence / no — no movement, last audited <date>>
<If it ran: the ranked pollution list, worst blast radius first, plus the manifest-gap section.>
<Always write the version line, even when the audit did not run — the next retro's trigger reads it.>

## Improvements Made This Session
<list of changes actually made, with file paths>

## Improvements Backlogged
<list of Linear issues opened, with links>

## Tuning Recommendations
<concrete proposals for adjusting drift-scan thresholds or adding/removing signals.
Format per recommendation: Signal → current threshold → proposed threshold → rationale.
If none needed, write "No tuning needed this cycle.">

## Patterns to Watch
<emerging patterns that aren't yet actionable but worth tracking>
```

### Step 7: RETIRED — do not write a footer into `Docs/impediments.md` (THR-825)

**Write nothing to `Docs/impediments.md`. Go to Step 8.** The step numbering is kept so Rule 8 and the Step-8/9 cross-references stay valid.

This step used to append a `---`-delimited `**Retrospective conducted: YYYY-MM-DD**` footer to the log. It is retired for two reasons, and the second is the decisive one:

1. **Its guarantee is now held better elsewhere.** The footer's job was to prove a retro happened. Step 8 (THR-798) makes the *report* the proof: it is committed before anything may cite it, and Step 9's citation gate verifies every cited path. `git log --diff-filter=A -- Design/retros/` is a stronger liveness record than a line the run writes about itself — a run that skips the footer still leaves a commit, whereas a run that writes the footer and skips the commit leaves a citation pointing at nothing, which is the exact failure THR-798 exists to catch.

2. **The format became structurally incompatible with the file.** `Docs/impediments.md` was prose-structured when this step was written; the log is now a markdown table appended by `impediment-reporter`. A `---` fence inside a table **terminates it**, so every row after the footer is orphaned from its header for any renderer. The step was skipped for 11 consecutive reports (2026-05-04 → 2026-07-24), and the one run that did follow it — 2026-07-31 — landed its fence between rows 366 and 353 and split the row list. The instruction could not be obeyed correctly as written, which is why "just start doing it again" was never the fix. (All five historical footers were relocated above the table; note the file carries *other* non-row interruptions of its own — paragraph-form entries and a "Resolution Candidates" section — which are pre-existing and out of scope here.)

**What is deliberately NOT solved by retiring this.** The footer never answered "which impediment entries has a retro already triaged" — it was one global marker per run, not a per-entry one, so an untriaged entry and a triaged one have always been indistinguishable in this file. That is a real gap, but it is a *new feature* (a per-row triage marker), not a regression introduced here. Do not re-add a global footer believing it addresses it.

**Do not re-add this step from the old instruction.** The historical footers, including the 2026-07-31 one, were relocated out of the table into `Docs/impediments.md` § *Retrospective ledger* by THR-825; that section is a historical record and is not appended to by this skill.

### Step 8: Commit the report — BEFORE anything cites it

**Blocking. The run may not file a ticket citing the report until this step has succeeded.**

Writing the file is not the deliverable — *committing* it is. `Design/` was gitignored for months, and `git log --diff-filter=A -- Design/retros/` shows only three commits ever added a retro: one path reconciliation, one attended trial, and one bulk rescue literally titled *"back up 10 retro write-ups stranded on home machine"*. Every report before 2026-07-24 survived by luck, not by process.

`main` is branch-protected, so the report ships as its own PR:

```bash
git switch -c "docs/retro-$(date +%Y-%m-%d)"
git add Design/retros/retro-YYYY-MM-DD.md
git commit -m "docs(retro): weekly retrospective YYYY-MM-DD"
git push -u origin HEAD
gh pr create --title "docs(retro): weekly retrospective YYYY-MM-DD" --body "Weekly retrospective report."
gh pr merge --auto --merge
```

Then prove the file is actually tracked — a written-but-unstaged file is the exact failure this step exists to catch:

```bash
git ls-files --error-unmatch Design/retros/retro-YYYY-MM-DD.md
```

Exit 0 means the citation is now falsifiable. **A non-zero exit means STOP** — fix the commit before proceeding to Step 9. Do not poll CI for the merge; auto-merge lands it without a session present.

Once — and only once — that check exits 0, delete the Step 1 draft (THR-1056):

```bash
rm Design/retros/retro-YYYY-MM-DD-draft.md
```

`npm run retro-draft` writes an intermediate the final narrative report supersedes, and nothing ever removed it: one survived per weekly run (07-24, 07-31, 08-07, 08-14) as untracked debris in the home tree. Gate the deletion on the tracked-proof above rather than on having written the report, because until that exit 0 the draft is the only durable copy of the parsed impediment set — the same reason Step 8 exists at all. The draft is now gitignored, so a run that stops early leaves it recoverable on disk without it ever blocking an autosync fast-forward.

If the run is out of context or otherwise cannot complete the commit, it must **not** file tickets citing the report. File them without the citation line, or leave them unfiled and say so — an unfiled ticket is recoverable, a ticket citing a phantom source is not.

### Step 9: File backlog tickets, then run the citation gate

Now that the report is committed, file the Linear issues drafted in Step 5. Each may cite the report path.

Then backfill the report's **Improvements Backlogged** section with the real issue IDs and push that as a second commit on the same PR branch.

**Terminal citation gate — the last thing the run does.** For every repo path this run named in a Linear ticket body, an impediment entry, or the report itself:

```bash
git ls-files --error-unmatch <path>
```

Any path that fails is either committed now or **struck from the text that cites it**. Report the gate's result explicitly in the run's final output — `citation gate: N paths checked, all tracked`, or name the failures. Silence is not a pass.

## When to Run

- **Scheduled (weekly):** Fridays at ~15:00 UTC, one hour after the drift scan runs at 14:00 UTC. The scan's output is warm when the retro starts.
- **Proactively**: Every ~10 sessions or when the impediment log grows by 20+ entries
- **On request**: When the user says "run a retro", "review impediments", or "/retrospective"
- **After a rough session**: If a single session logs 5+ impediments, suggest a retro at session end

## Rules

1. **Data-driven, not opinion-driven.** Every proposed improvement must trace back to specific impediment entries or scan signals.
2. **Implement quick wins immediately.** Don't just propose — fix what you can fix right now.
3. **Be specific in proposals.** "Improve the skill" is not actionable. "Add lines 4-8 to gamedocumenter SKILL.md documenting the Obsidian patch workaround" is actionable.
4. **Respect scope.** Only modify skills and docs in this project. Don't propose changes to external tools you can't control — document those as `cant-fix`.
5. **Track improvement over time.** Each retro should reference whether previous retro's backlogged items were completed.
6. **Scan absence is data, not a failure.** If the scan produced no issues, say so explicitly and assess why. No auto-kill without retro judgment.
7. **User makes verdicts; retro recommends.** Tuning recommendations go into the report for user review, not auto-applied.
8. **Never cite a path you have not committed.** A ticket, footer, or report line naming an uncommitted file is an unfalsifiable citation: nobody can check the reasoning, the ROI method, or what the retro considered and rejected. The report is committed (Step 8) before anything points at it, and every cited path is re-verified at the end (Step 9). This rule is why Steps 8 and 9 exist — see THR-798.
