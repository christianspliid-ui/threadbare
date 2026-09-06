# Weekly Project Hygiene — 2026-09-06

Full sweep (last full sweep 2026-09-01, 5 days ago — past the 4-day light-sweep threshold). Enumeration ran in the **home tree** (`C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`), which matters for the root-markdown and stray-report checks.

**One check could not run at all:** the Linear queue audit, three-pillar compliance, and the Linear half of the Done-state smoke test are all blocked by the connector outage below. Everything else ran.

## Needs Christian

**Linear has been unreachable for at least six straight hours of lane runs, and both fixes are yours alone.** This is not new to you — it leads your briefing already, and impediment #973 has been bumped five times today. What this sweep adds is the *shape* of the cost, because a board outage looks exactly like a quiet board:

- Since 2026-09-06 ~11:00Z, **seven consecutive merges to `main` carry no `Fixes THR-XX` line** (PRs [#1821](https://github.com/christianspliid-ui/threadbare/pull/1821)–[#1827](https://github.com/christianspliid-ui/threadbare/pull/1827)) — every one is unticketed work, because the lane correctly refuses to claim a board ticket it cannot claim. Before the outage, the last four ticketed merges ([#1817](https://github.com/christianspliid-ui/threadbare/pull/1817)–[#1820](https://github.com/christianspliid-ui/threadbare/pull/1820)) all carried theirs.
- Four lanes are degraded, not stopped: `tb-opus-pickup`, `tb-orchestrator`, `daily-backlog-grooming`, and this one.
- The weekly retro also ran without it (impediment #974) — its drift-scan input and its ticket-filing output both hang on the same connector, so last cycle's one qualifying ticket is drafted but unfiled.

**Either remedy alone fixes it.** (a) Reauthorize the Linear connector in claude.ai → Settings → Connectors. (b) Set `LINEAR_API_KEY` in the machine environment or the home tree's `.env` — the transport is already written and shipped in `scripts/drift-scan/linear.ts`, and seven scripts read it; this one needs no browser session and survives a lapsed token.

Nothing else in this sweep needs you. The findings below are agent-owned technical calls for the Friday retro.

## Queue health

**Not measurable this run.** `plugin:productivity:linear` reports "requires authentication before their tools can be used", and this session is non-interactive so no OAuth flow can run here. Two `ToolSearch` probes (`+linear list issues`, and the keyword form) returned no Linear tool of any name — only `mcp__github__list_issues`. `LINEAR_API_KEY` is absent from the environment and from both `.env` files.

Ready for Dev count, In Dev count, oldest item in each: **unknown**. So are the coordination-block audit, the orphan-project check, the stale-In-Dev check, the deferral-ordering check, and check 8 (three-pillar compliance on in-flight design), all of which start from a board query.

The last board reading anyone has is from the lost 2026-09-01 orchestrator report (Finding 3): `Todo` 43, `Ready for Dev` 2 at 17:40:34Z. Five days stale — quoted as provenance, not as a current count.

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

### 5. Linear reachability is not in the sandbox-limitations catalogue

`Docs/ops/sandbox-limitations.md` carries three Linear rows — `save_issue` silent drops (#48), the assignee-restore hazard, and `orderBy: 'priority'` (#49). **None covers the connector being unauthenticated**, which is now at 5 recurrences in a single day and takes a whole lane down. CLAUDE.md's five-rule summary says "Verify-after-write on every Linear mutation", which presumes reachability.

Worth promoting alongside it: #973's own still-open follow-up — have `scripts/session-precheck.ts` probe Linear reachability and report it in the `fingerprint` line beside `rg`/`git`/`nm`, so a lane whose every invariant runs through an API fails its precheck rather than its first mutation.

**Cost:** costs ~20 min (one catalogue row) + ~40 min (the precheck probe). Not fixing costs each affected lane re-deriving the diagnosis from scratch — measured at ~10 min per run in #974, across 4 lanes hourly. **Clears the materiality bar** on recurrence (5 in one day).

### 6. The registry says this lane files findings; Christian's throttle says it does not

`Docs/ops/scheduled-tasks-registry.md:35` — `| **Sun 10:06** | Weekly | weekly-project-hygiene | 6 10 * * 0 | ~Sun 10:10 | Docs/ops/weekly-hygiene-<date>.md + filed findings |`

CLAUDE.md § Continuous Improvement (Christian, 2026-08-10) made the weekly retro the single promotion point and named any lane instruction to the contrary as superseded. The lane prompt was updated; this registry row was not. The `Writes` column should read `Docs/ops/weekly-hygiene-<date>.md` — nothing more.

**Cost:** costs one line. Not fixing costs a contradiction between two authoritative surfaces about what this lane is allowed to do. **Below the bar** — deliberately not PR'd this run (see Notes).

### 7. `Docs/ops/tick-cost-trend.tsv` is untracked *and* unignored, so the home tree is permanently dirty

`.gitignore:173–175` covers `orchestrator-*.md`, `backlog-grooming-*.md`, `weekly-hygiene-*.md`. The trend TSV that `keep-work-flowing-cc` appends to hourly (THR-1385) is not on that list, so it shows in every `git status` as `??` forever. It **is** correctly published to `origin/ops`, so nothing is at risk. Either add it to the ignore list or have the lane delete it post-publish like every other artifact.

**Cost:** costs one `.gitignore` line. Not fixing costs one permanent line of `git status` noise in the tree every session reads. **Below the bar.** Log row.

## Clean checks

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
- **Done-state smoke test (commit side):** PASS, no THR-540 false-close pattern. The last four ticketed merges (#1817–#1820) each carry a line-anchored `Fixes THR-XX` in their branch commits; the seven since carry none because they are unticketed outage-window work. No bare-substring or branch-name close vectors observed.
- **Wiki exemption audit:** PASS on legitimacy. All 14 exemptions in the window state a behaviour-neutral reason and the reasons hold on inspection. The *volume and aim* are Finding 1, not misuse.
- **`tsc --noEmit` as a claimed type gate:** PASS on the operative surfaces. `CLAUDE.md` and `Docs/canon/verification-gates.md` name it only to forbid it. Historical mentions across `Docs/plans/` and `Design/retros/` are records of the finding, not live instructions.

## Notes

- **Grey zone — the Linear-blocked checks.** Rather than guess, checks 1 and 8 are recorded as unmeasured. The five-day-stale counts from the lost 09-01 report are quoted as provenance only; treating them as current would put a rotting snapshot into the record, which is precisely what THR-688 rule A forbids.
- **Chose not to PR Finding 6.** It is a one-word registry correction and this lane is permitted to make durable registry fixes. I recorded it instead of minting a PR: it would cost a worktree, a PR and a CI cycle to move one word, and Christian's 2026-08-10 direction is explicit that the delivery machine's failure mode is accretion. It is pre-written above, so any session already touching `Docs/ops/` can apply it in one edit. Findings 4 and 7 are the same shape — trivial fixes, batched deliberately.
- **`.agents/skills/` reads worse than it is.** The check is written unconditionally because the THR-654 demolition removed a genuine parallel skill tree. What is there now is 320 PNGs from a skill eval with no `SKILL.md` in sight. Reported as a finding because the rule is unconditional, but flagged here so the retro does not spend the demolition's severity on scratch files.
- **Two checks caught things nothing else would have.** The THR-1056 stray-report probe found Finding 3, and it is the only reason a lost `needsChristian: true` report is now in the record. The check-10 coverage sweep found Finding 1 — a gate that has never fired for the repo's busiest system. Both are checks whose value is invisible until the week they fire; noting it because the six-week sunset rule applies to them, and this is their renewal evidence.
- **Sandbox friction encountered:** a Bash heredoc corrupted regex backslashes in a throwaway analysis script on the first attempt, exactly as CLAUDE.md § Known Sandbox Limitations warns. Rewritten via `node -e` with a backslash-free escaper. Known, already catalogued, not logged as new.
- **Nothing was filed, closed, merged, or transitioned by this sweep**, per § Recording findings. No issue was claimed; no `src/` file was touched.
