# Weekly Project Hygiene — 2026-09-06

Full sweep (last full sweep 2026-09-01, 5 days ago — past the 4-day light-sweep threshold). Enumeration ran in the **home tree** (`C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`), which matters for the root-markdown and stray-report checks.

> **Amended in place, same run (~19:0xZ).** This report was first published saying the Linear queue audit and three-pillar compliance were unmeasurable, because the connector was unauthenticated and two `ToolSearch` probes returned no Linear tool of any name. **Linear became reachable partway through the sweep** and both checks were then run in full. The Queue-health section below is real, measured data — not the stale figures the first version quoted. The outage was genuine when probed (see Finding 5, and impediment #973's five recurrences today); it recovered rather than never having happened. Amended rather than deferred to next week because the first version asserted an absence of measurement this run in fact went on to have.

## Needs Christian

**Linear went down for at least six straight hours of lane runs today, and came back on its own. The durable fix is still worth doing.**

You have seen the outage — it led your briefing and impediment #973 was bumped five times. It is now **resolved for this session**, so nothing is blocked as you read this. What is worth thirty seconds of your attention is that it resolved without anyone doing either of the two documented remedies, which means nothing stops it recurring tomorrow.

What it cost while it was down, measured rather than estimated:

- **Seven consecutive merges to `main` carry no `Fixes THR-XX` line** (PRs [#1821](https://github.com/christianspliid-ui/threadbare/pull/1821)–[#1827](https://github.com/christianspliid-ui/threadbare/pull/1827)) — all unticketed work, because the lane correctly refuses to claim a board ticket it cannot claim. The four merges before the outage ([#1817](https://github.com/christianspliid-ui/threadbare/pull/1817)–[#1820](https://github.com/christianspliid-ui/threadbare/pull/1820)) all carried theirs.
- Four lanes degraded: `tb-opus-pickup`, `tb-orchestrator`, `daily-backlog-grooming`, and this one. The weekly retro too (impediment #974) — its drift-scan input and its ticket-filing output hang on the same connector, so last cycle's one qualifying ticket is drafted but unfiled.

**The recommendation, unchanged and now cheap:** set `LINEAR_API_KEY` in the machine environment or the home tree's `.env`. The transport is already written and shipped in `scripts/drift-scan/linear.ts` and seven scripts read it; it needs no browser session and survives a lapsed token. Reauthorizing the connector in claude.ai → Settings → Connectors also works but is the fix that just proved it can lapse silently.

Nothing else in this sweep needs you. Everything below is an agent-owned technical call for the Friday retro.

## Queue health

Measured at ~19:0xZ, state-filtered per protocol (never an unfiltered `list_issues`; sorted in memory, no `orderBy:priority` — impediment #49).

| State | Count | Oldest | Notes |
|---|---|---|---|
| **Ready for Dev** | **4** | THR-1407, created 2026-09-03 (3 days) | All unassigned. All four carry a project **and** a full coordination block as the latest comment. |
| **In Dev** | **3** (effective WIP **1**) | THR-1130, started 2026-08-15 (22 days, `Parked`) | THR-1420 is the one live claim (started 09-04, updated today). THR-1392 and THR-1130 both carry `Parked`, which frees the slot. |
| **In Design** | **2** | THR-790 (Medium), THR-1002 (Medium) | THR-1298 has since left this state — its plan doc landed and slices are merging. |
| **Implementation Planning** | **0** | — | — |

**WIP=1 is satisfied** — the two extra In Dev items carry `Parked`, and no stale-claim sweep is owed. **No stale handoffs**: the oldest Ready-for-Dev item is 3 days, well under a week. **No orphans**: every issue in every queried state belongs to a project. **No `Deferral`-labelled items** are sitting behind other work.

**The one thing worth the retro's eye is the shelf's composition, not its hygiene.** Four items, three of them `Low` priority and one `No priority`; two are `Repo Health`/`Infrastructure`, one is a debug-tooling bug, one is a UI-law bug. **Zero content or feature work is queued for the executor.** This is not the 32-of-35 pile-up that prompted Christian's 2026-08-10 throttle — the throttle is working, and these four are individually well-formed. It is the other failure the throttle's own text predicts: *"a process-only queue is a starved shelf, not a license to binge — the headline finding is 'feature pipeline needs supply'."* The 2026-09-01 orchestrator report reached the same conclusion independently (*"The bottleneck is design sessions, not the queue"*), and with `Implementation Planning` empty and only two items In Design, the supply side is where the constraint sits. Recorded as the headline, per that instruction, rather than as a ticket.

## Findings

### 1. The wiki-freshness gate is aimed at the undertakings system's generators and misses its entire runtime — while over-firing on one constants file ×4

Both blind spots check 10 exists to catch, on the same system, in the same 8-day window.

- **Coverage gap.** The `undertaking-grid` page declares exactly three `sources` globs: `src/data/undertaking-objects.ts`, `scripts/undertaking-grid-dispositions.ts`, `scripts/generate-undertaking-grid.ts` — a catalogue file and two generator scripts. The system's *runtime* matches none of them. Changed on `main` in the last 8 days and covered by **no page's glob**: `src/engine/undertakingResolver.ts`, `undertakingProse.ts`, `undertakingMotive.ts`, `undertakingCheckpoints.ts`, `undertakingReviewLevers.ts`, `src/engine/decisionBoard.ts`, `calling.ts`, `strategicKindReachability.ts`, `strategicPresentation.ts`, `strategicActionScoring.ts`, `strategicActionCandidates.ts`, `src/data/undertaking-cells.ts`, `undertaking-verb-prose.ts`, and `src/data/content-eval/undertaking{Contract,Package,Constants,RetrofitPending}.ts` — 17 files. The repo's largest active workstream (THR-1392/1394/1396/1397) has a wiki page and a blocking gate that cannot fire for it.
- **Over-firing.** `src/data/strategic-action-constants.ts` *is* in a glob — `essence-control-reference.html` — and adding an unrelated constant to it flags that page every time. Exempted on that exact pair in `63a7bfa7`, `ae88422a`, `d6b4bde3`, and `2da1af98` (which cites "same exemption as THR-1349 pass 3", making five). Each exemption is legitimately argued; `63a7bfa7`'s author grepped the page for `census`/`throughput`/`cutover`/`UNIFIED_DECISION_BOARD` to prove it.
- **Volume, for scale.** 14 `Wiki-freshness-exempt:` commits on `main` in 8 days. Every reason read is defensible — this is not exemption abuse, it is a gate pointed slightly wrong. Whole-sweep numbers: 129 non-test source files changed under `src/{engine,data,components}`, **111 matched no page glob**.
- **Proposed fix** (agent-owned per THR-608): extend `undertaking-grid`'s `sources` with `src/engine/undertaking*.ts`, `src/engine/decisionBoard.ts`, `src/engine/strategic{ActionScoring,ActionCandidates,KindReachability,Presentation}.ts`, `src/data/undertaking-*.ts`, `src/data/content-eval/undertaking*.ts`; and narrow the `essence-control-reference` glob off `strategic-action-constants.ts`, or split that file so board/census constants live apart from essence-and-control ones.

**Cost:** costs ~1 h to re-scope the globs and re-run the gate. Not fixing costs ~14 exemption justifications per 8 days (~10 min each of grep-and-argue, so ~2 h/week of author time) **plus** an undocumented runtime for the system currently absorbing most of the delivery capacity. **Clears the materiality bar** on recurrence (≥3 in a week — the same file→page pair fired ≥4 times) and on quoted time.

### 2. The grievance system matches no page's glob at all

`src/engine/grievance/covetRivalry.ts`, `grudgeEdge.ts`, `undertakingOutcomeNode.ts`, `src/data/grievance-constants.ts` and `grievance-prose.ts` all changed in the window and are covered by nothing. `stealth-rivals-reference` covers `src/engine/rival*.ts` but not `src/engine/grievance/`. Either extend that page's globs or add a `backlog` entry to `public/wiki-manifest.json` (which today holds one entry, `companies-reference`).

**Cost:** costs ~15 min to decide and wire. Not fixing costs silent drift on a system with authored prose. **Below the bar on its own** — fold it into Finding 1's manifest pass, which touches the same file.

### 3. A substantive orchestrator report was written, never published, and the next run recorded it as "nothing happened"

`Docs/ops/orchestrator-2026-09-01.md` sits in the home tree — 29,482 bytes, mtime `Sep 1 19:52`, frontmatter `promoted: 1`, `needsChristian: true`. **It is not on `origin/ops`**, where the branch jumps `orchestrator-2026-08-30c.md` → `orchestrator-2026-09-02.md`. Its `## Needs Christian` carried four items, including the approval that unblocks the top content ticket (THR-1222, Retrofit Batch 2) and two wayfinder maps whose homework is finished.

The compounding half: the 2026-09-02 report opens *"First run to publish since `orchestrator-2026-08-30c.md`, ~72 hours ago"* and characterises the intervening runs as *"runs that correctly wrote nothing — declines are not substantive."* But this run promoted THR-1378 and set `needsChristian: true`, so `check:substantive` should have returned `commit`. A lost report did not merely go missing — it was absorbed into the record as a no-op.

Because `keep-work-flowing-cc` step 2.6 reads sibling reports **from `ops`**, those four items never reached the briefing through this route. Mitigating: the THR-1378 promotion itself did land, and the 09-02 report independently carries *"one thing is unchanged from three days ago"*, so the asks partially recurred.

Two separable defects, both worth the retro's eye:
- The publish/gate path can drop a report the gate should have passed. Root cause not determined here (silent `ops-publish.sh` failure, gate misread, or the run being killed after the write are all consistent with the evidence).
- **The THR-1056 stray-file check is what caught this**, and it is the only thing that did — five days later. That is the check working, but at weekly resolution.

**Cost:** costs ~30 min to determine which of the three causes it was (the run's transcript has it). Not fixing costs one lost run report per occurrence, with the specific hazard that the *next* run narrates the gap as a no-op. **Below the ticket bar** — one occurrence, promotion preserved, asks partially recurred. Log row; promote if it recurs.

### 4. `.agents/skills/` is back — as eval scratch, not as a second skill tree

CLAUDE.md is unconditional ("do not reintroduce a second skill tree"), and the check is written as "if `.agents/skills/` exists at all, that is a finding". It exists. But the content is not the THR-654 regression:

- `.agents/skills/image-manipulation-workspace/` — 320 files, all `iteration-N/batch-hex-clip/.../outputs/*.png`. **No `SKILL.md` anywhere in it.** Untracked, and *not* gitignored.
- `.claude/skills/image-manipulation-workspace/` — the same 320 files, same shape. This one **is** an orphan skill directory under the real tree with no `SKILL.md`, which check 2 flags independently.

Both are eval-run scratch from the `image-manipulation` skill, mirrored into two trees. The `.agents/` half is the one to remove; the `.claude/` half should either move under the scratchpad or be gitignored so it stops reading as a skill.

Skill tree otherwise clean: 44 directories, **43 with a valid `SKILL.md`** (the workspace is the sole exception), every skill named in CLAUDE.md's Domain Skills load-order bullets resolves.

**Cost:** costs ~5 min (`rm -rf` two scratch dirs, one `.gitignore` line). Not fixing costs a recurring false positive on this check every week, plus a directory that reads as a skill to anything enumerating the tree. **Below the materiality bar** — zero work lost, first occurrence. Log row.

### 5. Linear reachability is not in the sandbox-limitations catalogue — and the probe every lane used to detect the outage is aimed at the wrong name

`Docs/ops/sandbox-limitations.md` carries three Linear rows — `save_issue` silent drops (#48), the assignee-restore hazard, and `orderBy: 'priority'` (#49). **None covers the connector being unauthenticated**, which hit 5 recurrences in a single day and took a whole lane down. CLAUDE.md's five-rule summary says "Verify-after-write on every Linear mutation", which presumes reachability.

**This sweep adds a detail worth more than the catalogue row.** Every lane run today diagnosed the outage the same way — a `ToolSearch` probe returning "no Linear tool of any name" — and the auth-required list named `plugin:productivity:linear` as the culprit. When Linear came back mid-sweep it came back under a **UUID-named server**, not that plugin name, while `plugin:productivity:linear` *remained* on the auth-required list. So:

- A lane that concludes "Linear is down" from the plugin name being unauthenticated can be wrong — a working Linear may be present under a different server id.
- **The reliable probe is a capability call, not a name lookup.** One `list_teams` round-trip settles it; this sweep's did.

That also sharpens #973's still-open follow-up: the reachability probe proposed for `scripts/session-precheck.ts` should make a real call, not check for a named connector.

**Cost:** costs ~20 min (one catalogue row) + ~40 min (the precheck probe). Not fixing costs each affected lane re-deriving the diagnosis from scratch — measured at ~10 min per run in #974, across 4 lanes hourly — and risks a lane standing down while Linear is in fact reachable. **Clears the materiality bar** on recurrence (5 in one day).

### 6. The registry says this lane files findings; Christian's throttle says it does not

`Docs/ops/scheduled-tasks-registry.md:35` — `| **Sun 10:06** | Weekly | weekly-project-hygiene | 6 10 * * 0 | ~Sun 10:10 | Docs/ops/weekly-hygiene-<date>.md + filed findings |`

CLAUDE.md § Continuous Improvement (Christian, 2026-08-10) made the weekly retro the single promotion point and named any lane instruction to the contrary as superseded. The lane prompt was updated; this registry row was not. The `Writes` column should read `Docs/ops/weekly-hygiene-<date>.md` — nothing more.

**Cost:** costs one line. Not fixing costs a contradiction between two authoritative surfaces about what this lane is allowed to do. **Below the bar** — deliberately not PR'd this run (see Notes).

### 7. `Docs/ops/tick-cost-trend.tsv` is untracked *and* unignored, so the home tree is permanently dirty

`.gitignore:173–175` covers `orchestrator-*.md`, `backlog-grooming-*.md`, `weekly-hygiene-*.md`. The trend TSV that `keep-work-flowing-cc` appends to hourly (THR-1385) is not on that list, so it shows in every `git status` as `??` forever. It **is** correctly published to `origin/ops`, so nothing is at risk. Either add it to the ignore list or have the lane delete it post-publish like every other artifact.

**Cost:** costs one `.gitignore` line. Not fixing costs one permanent line of `git status` noise in the tree every session reads. **Below the bar.** Log row.

### 8. Any lane commenting on a Ready-for-Dev item displaces the coordination block the executor reads

Found already-diagnosed on THR-1415 rather than discovered here, and recorded so the retro can count it rather than re-derive it. `pull-work` Step 3 validates the **latest comment** for `Suggested model` / `Parallel-safe with` / `Mutex with`. On 2026-09-04, `daily-backlog-grooming` posted a correct and necessary grooming note (removing a wrong `docs-only` label) at 07:19:07Z — which buried the coordination block posted at 06:42:14Z. `tb-orchestrator` caught it and re-asserted the block verbatim at 07:29:00Z.

The self-correction worked, and the lanes handled it exactly right — including declining to file it (*"Logged for the retro, not filed (2026-08-10 throttle)"*). But the hazard is structural, not a defect in either lane: **any** comment from **any** lane on a Ready-for-Dev item has this effect, and it is caught only if another lane happens to sweep afterwards. The cheap durable fix is to make Step 3 search for the most recent comment *containing a coordination block* rather than reading the last comment.

**Cost:** costs ~20 min (one predicate change in `pull-work` Step 3). Not fixing costs one bounced or guessed-at pickup per occurrence (~15 min), at an unknown rate — this sweep found 1 occurrence in the 8-day window. **Below the materiality bar** on recurrence. Log row, with the count started.

## Clean checks

- **Linear queue audit (check 1):** PASS on every hygiene predicate — see Queue health. Projects on all issues, coordination blocks on all four Ready-for-Dev items (each with all three required fields plus `Blocked by` and an evidence-shape line), WIP=1 respected, no stale In Dev, no stale handoff, no mis-ordered deferrals.
- **Three-pillar compliance (check 8):** PASS. `Implementation Planning` is empty. Of the two In Design items, THR-1002 has no plan doc yet — correct for a design pass still in progress, not a finding — and THR-790's `Docs/plans/2026-07-26-traits-trigger-architecture.md` is fully compliant: `## Substrate inventory` (mandatory since THR-614), explicit `## Engine pillar` / `## Content pillar` / `## UI pillar`, `## Constants`, `## NFP compliance`, plus `## Forked-audit verdicts` and `## Intent-judge verdict`.
- **Skill tree — `SKILL.md` presence:** PASS with one exception (Finding 4). 43/44 directories valid; all load-order-named skills resolve; no broken CLAUDE.md references; no empty `description:` frontmatter.
- **Scheduled-task registry, direction 1** (registered → row): PASS. All 10 tasks `list_scheduled_tasks` returns have rows, including the two dormant ones.
- **Scheduled-task registry, direction 3** (directory → registration): PASS, no *new* orphans. 13 directories vs 10 registered; the 3 extras (`check-slack-for-new-dev-work`, `daily-standup`, `keep-website-up-to-date`) are the known THR-851 set, already mirrored under `Docs/ops/scheduled-task-prompts/retired/` and awaiting Christian's deletion (a Christian action by design — the path is outside the repo).
- **Cron/fire-time drift:** PASS. Every cron matches its registry row; jittered fire times land where documented (`tb-opus-pickup` ~:00:53, `tb-orchestrator` ~:26:16, `keep-work-flowing-cc` ~:53:13). No two Linear-using hourly tasks collide. `weekly-retro`'s Sunday `lastRunAt` is a harness catch-up for the missed Friday slot, already diagnosed in impediment #974 — **not** registry drift, and nothing was "fixed".
- **Prompt mirrors:** PASS. 9 mirrors under `Docs/ops/scheduled-task-prompts/` for 9 mirrorable tasks; `website-code-work` is the named deliberate exception (THR-850).
- **Stray published reports:** one hit, Finding 3. Run via `git ls-files --others --ignored --exclude-standard` — `git status` reports these paths clean by design.
- **Root-level markdown:** PASS. `AGENTS.md`, `CLAUDE.md`, `STYLE.md` (all tracked, all on the allowlist), `Index.md` (untracked **and** matched by `.gitignore:/Index.md` — the THR-975 accepted case, re-verified with both probes, home-tree-only). `README.md` absent, which the allowlist permits. `AGENTS.md` is 295 lines and still the slim pointer THR-654 left — no rebalooning.
- **`Docs/project-status.md`:** PASS — untracked, as THR-1016 requires. Not hand-edited.
- **`Docs/changelog.md` / `Docs/project-history.md`:** PASS. Both current through 2026-09-06; recent rows carry the full `| date | where | what | why |` shape.
- **`Docs/status/` fragments:** PASS. 403 fragments; every 2026-09-04 closeout (THR-1168/1391/1409/1410/1411/1413/1414/1416/1418) has one, and the unticketed 2026-09-06 tick-cost work has `2026-09-06-thr-1385.md`.
- **Orphan deferrals:** PASS. **Zero** `// TODO` / `// DEFERRED` comments in `src/` lacking a `THR-` reference; 9 correctly tagged as `// TODO(THR-XX)`.
- **Autosync / home-tree health:** PASS. `threadbare-autosync.log` shows clean hourly `synced:`/`ok:` lines with no `skip:` and no `MANUAL REPAIR NEEDED`. The 2026-09-04 16:50 → 2026-09-06 13:50 gap is the machine-offline window corroborated by #974. Home tree is 2 commits behind `origin/main` mid-hour with only `.claude/settings.local.json` modified — normal, self-correcting.
- **Done-state smoke test:** PASS, no THR-540 false-close pattern. The last four ticketed merges (#1817–#1820) each carry a line-anchored `Fixes THR-XX` in their branch commits; the seven since carry none because they are unticketed outage-window work. No bare-substring or branch-name close vectors observed.
- **Wiki exemption audit:** PASS on legitimacy. All 14 exemptions in the window state a behaviour-neutral reason and the reasons hold on inspection. The *volume and aim* are Finding 1, not misuse.
- **`tsc --noEmit` as a claimed type gate:** PASS. A full-tree grep across `.md`/`.json`/`.yml` returns three non-documentation hits, none of them a gate: two `.claude/settings.local.json` permission-allowlist entries, and a **comment** at `.github/workflows/ci.yml:490` recording that it *used to* live there and was a no-op. `CLAUDE.md` and `Docs/canon/verification-gates.md` name it only to forbid it; mentions across `Docs/plans/` and `Design/retros/` are records of the finding, not live instructions.

## Notes

- **The amendment is the most important note here.** The first version of this report declared two checks unmeasurable and quoted a five-day-stale board reading as provenance. Had the sweep ended there, the retro would have inherited "queue health: unknown" for a week. Worth generalising: **when a lane reports a capability as unavailable, the claim is true only as of the probe** — re-probing before publishing costs one round-trip and, this run, converted the report's largest gap into its most substantive section.
- **Chose not to PR Finding 6.** It is a one-word registry correction and this lane is permitted to make durable registry fixes. I recorded it instead of minting a PR: it would cost a worktree, a PR and a CI cycle to move one word, and Christian's 2026-08-10 direction is explicit that the delivery machine's failure mode is accretion. It is pre-written above, so any session already touching `Docs/ops/` can apply it in one edit. Findings 4 and 7 are the same shape — trivial fixes, batched deliberately.
- **`.agents/skills/` reads worse than it is.** The check is written unconditionally because the THR-654 demolition removed a genuine parallel skill tree. What is there now is 320 PNGs from a skill eval with no `SKILL.md` in sight. Reported as a finding because the rule is unconditional, but flagged here so the retro does not spend the demolition's severity on scratch files.
- **Two checks caught things nothing else would have.** The THR-1056 stray-report probe found Finding 3, and it is the only reason a lost `needsChristian: true` report is now in the record. The check-10 coverage sweep found Finding 1 — a gate that has never fired for the repo's busiest system. Both are checks whose value is invisible until the week they fire; noting it because the six-week sunset rule applies to them, and this is their renewal evidence.
- **Finding 8 was not discovered by this sweep**, it was read off a lane's own comment thread. Recorded anyway because the lanes correctly declined to file it, which means nothing else was carrying the count forward to the retro. That is the throttle working as designed only if this report does its half.
- **Sandbox friction encountered:** a Bash heredoc corrupted regex backslashes in a throwaway analysis script on the first attempt, exactly as CLAUDE.md § Known Sandbox Limitations warns. Rewritten via `node -e` with a backslash-free escaper. Known, already catalogued, not logged as new.
- **Nothing was filed, closed, merged, or transitioned by this sweep**, per § Recording findings. No issue was claimed; no `src/` file was touched. The Linear calls made after recovery were all reads (`list_teams`, `list_issues`, `list_comments`).
