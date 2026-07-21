# THR-674 — stash + worktree disposal record (2026-07-21)

Disposal of the 38-deep stash stack and the 6 reaper-flagged worktree strays.
Every entry below was classified by **blob reachability against `origin/main`'s full
object graph** (`git rev-list --objects origin/main`), not by a diff against the tip —
a diff-vs-tip reports false "unique" on superseded files.

Salvaged content is preserved on branch `docs/stash-salvage` (this PR).
Dropped stash commits remain reachable by SHA in the object store until `git gc` prunes them.

## Stash SHAs at drop time (38)

| SHA | ref | description |
|---|---|---|
| `e6366ada5b01` | stash@{0} | On (no branch): home-tree-recovery 2026-07-20: reverting snapshot + redundant CLAUDE.md (all content verified present on |
| `e1f6e896e5c2` | stash@{1} | On christianspliid/thr-75-mentorship-encounters-plus-plan-docs: rescue-2026-07-03 pre-main-sync (Cowork repair, backup i |
| `72c31d697d56` | stash@{2} | On claude/agitated-perlman-e47639: codesight auto-scan artifacts |
| `d2ce3437780a` | stash@{3} | WIP on claude/beautiful-visvesvaraya-6d6c05: 00a9ce48 docs(impediments): log Linear OAuth re-auth blocker (impediment #1 |
| `0ea5ee532012` | stash@{4} | WIP on claude/musing-shirley-28a7de: 7311a48c docs: backfill plan docs and judge metrics from stale worktree salvage |
| `0423dc525ca8` | stash@{5} | On claude/determined-bohr-49efa5: auto-gen-codesight-stash |
| `6f5f99945f9f` | stash@{6} | WIP on claude/crazy-yonath-745abb: 62146dc0 docs: closeout THR-409 worktree graveyard cleanup |
| `153a05b124ff` | stash@{7} | WIP on claude/distracted-jennings-e07a07: 62146dc0 docs: closeout THR-409 worktree graveyard cleanup |
| `a8111a9007e2` | stash@{8} | WIP on claude/sweet-swartz-5506cd: 62146dc0 docs: closeout THR-409 worktree graveyard cleanup |
| `1ce45f3aeae1` | stash@{9} | WIP on claude/hungry-bose-9b1cb6: 62146dc0 docs: closeout THR-409 worktree graveyard cleanup |
| `f477d34ccb13` | stash@{10} | WIP on claude/charming-shirley-9b394e: 2b3a8abe docs(process): purge Slack from ways-of-working (THR-443) |
| `42a5a7cbc46c` | stash@{11} | WIP on claude/determined-dijkstra-e234b0: e7d88261 docs: update project-status, history, changelog for THR-163 |
| `ff748b934d25` | stash@{12} | On christianspliid/thr-409-worktree-graveyard-cleanup-audit-and-remove-60-stale: flush-plan-docs-RECOVERY-popped-from-pr |
| `a3d72e7750e8` | stash@{13} | On christianspliid/thr-401-location-action-expansion-add-6-settlement-scale-verbs: thr-401-crlf-noise |
| `96b427410c69` | stash@{14} | WIP on claude/funny-faraday-665416: 928e9f10 process(pull-work): add upstream-shipped check to both pickup paths (THR-42 |
| `172bf069be51` | stash@{15} | On christianspliid/thr-409-worktree-graveyard-cleanup-audit-and-remove-60-stale: flush-plan-docs-temp-stash |
| `f121f0af1d30` | stash@{16} | WIP on christianspliid/thr-413-content-pipelines-auto-load-rulebook-quick-reference-at: 0f90a8fb feat(skills): add ruleb |
| `6fb7acd5a0ba` | stash@{17} | On claude/exciting-boyd-10c619: session-start noise (codesight + settings + agents skills line-endings) |
| `a9722582859e` | stash@{18} | WIP on claude/happy-morse-d25591: 76b9186d feat: THR-389 Encounter Foreshadowing Phase 1 |
| `41e804f13dcc` | stash@{19} | WIP on christianspliid/thr-388-the-hexmap-tooltip-currently-shows-up-immediately-on-mouse: 90a7f0f2 feat: add 1-second h |
| `adbe61002fbe` | stash@{20} | WIP on claude/kind-lederberg-156604: 64a1c02a docs(process): add browser-verify gate to Definition of Done and wiring ch |
| `b9462c8988b5` | stash@{21} | WIP on claude/xenodochial-carson-f5904e: ca09dc4b docs: THR-343 closeout — project-status, project-history, changelog |
| `538bbc032768` | stash@{22} | WIP on claude/frosty-fermat-85bfbb: ca09dc4b docs: THR-343 closeout — project-status, project-history, changelog |
| `9f0e2340494b` | stash@{23} | On claude/gracious-kalam-d5aade: codesight artifacts |
| `5e884762ef92` | stash@{24} | On pickup/thr-177: session-start-codesight |
| `5758b9d09143` | stash@{25} | On claude/sad-chatelet-f9917e: codesight session-start regen |
| `6cd2bd1f6d9a` | stash@{26} | On claude/zealous-swirles-fb3a21: codesight modifications |
| `1e21443f79c8` | stash@{27} | On claude/zealous-swirles-fb3a21: codesight session-start noise |
| `62eeeb7a98ef` | stash@{28} | WIP on main: 1b440b9a docs(canon): bootstrap prose canon + wire 3 prose skills (THR-312) (#146) |
| `51cbb1999121` | stash@{29} | On main: thr-316-pre-pull |
| `9ab3feffcc1d` | stash@{30} | On main: thr-316-precheck-stash |
| `260e5465f5dd` | stash@{31} | WIP on ops/encounter-v7-artifacts-2026-05-05: a6941d6e ops: refresh codesight + automation log for 2026-05-05 cycle |
| `39a76435da24` | stash@{32} | WIP on main: f2660230 Merge pull request #86 from christianspliid-ui/docs/thr-108-closeout |
| `61e868b8b6fa` | stash@{33} | WIP on main: 536ccef0 ops: preserve Codex no-work ops entries in log.md (#71) |
| `b179a7db743d` | stash@{34} | WIP on main: 6a387b0d docs: log cross-executor collision impediment #95 (THR-102 concurrent pickup) |
| `7287ad4dc5ef` | stash@{35} | On christianspliid/thr-256-trace-hygiene-undefined-category-entries-and-null-body: impediment entries 68 86 87 |
| `eaa6d8657fa5` | stash@{36} | WIP on main: 0a57ab61 docs: update project-status and changelog for THR-17 |
| `870a3384e197` | stash@{37} | WIP on main: 5bfbfcf Fix debug panel close button when opened via F1 |

## Stash verdicts

| Verdict | Count | Basis |
|---|---|---|
| Salvaged (unique content committed) | 4 stashes / 25 files | Blob absent from `origin/main`'s object graph |
| Dropped — regenerable artifact | — | `.codesight/**`, `.claude/settings.local.json`, `public/*.html` (rebuilt by `npm run build`), `Docs/authoring-brief.md` (marked *do not hand-edit*) |
| Dropped — already on `origin/main` | — | Every carried blob reachable from `origin/main` |
| Dropped — superseded | — | Path lives on `main` with newer/longer content |

Contributing stashes for the salvage commits: `stash@{12}` (21 files), `stash@{15}`, `stash@{30}`, `stash@{36}` (2 files).

Two root-level files were inspected and deliberately **not** salvaged:

- `debug-panel.md` — a raw Playwright accessibility-tree dump (`generic [ref=e3]:` …), a throwaway debug artifact, not a record.
- `log.md` (repo root) — a stray copy of the Obsidian vault log containing only `no ready-for-codex work this cycle` ops lines from the retired Codex lane. The vault log's home is the Obsidian vault, not the repo.

## Worktree strays (6, all `NEEDS-DISPOSITION` per the hourly reaper)

Each carried 1–2 commits ahead of `origin/main`. All were verified content-present on `main` before removal.

| Worktree | Branch | Verdict |
|---|---|---|
| `adoring-burnell-2e3b51` | `claude/adoring-burnell-2e3b51` | Zombie — all blobs on `main` (THR-611 Slice 4 shipped) |
| `nostalgic-ramanujan-23f1a8` | `claude/nostalgic-ramanujan-23f1a8` | Zombie — checkpoint-resume protocol is live in `pull-work` Steps 1.7/1.8 |
| `pensive-galileo-345fbc` | `claude/pensive-galileo-345fbc` | Superseded — its local `hashNodeId` fix was replaced on `main` by the shared `chronicleSeed()` helper (THR-644) |
| `pensive-jang-193d86` | `claude/pensive-jang-193d86` | Zombie — all blobs on `main` |
| `pensive-khayyam-5bdbde` | `docs/thr611-slice5-impediment` | Zombie — all blobs on `main` |
| `wonderful-shirley-692b4e` | `docs/thr-609-impediment-175` | Zombie — all blobs on `main` |

Uncommitted changes in these trees were deletions of `.fuse_hidden*` filesystem artifacts plus one stale regeneration of `Docs/authoring-brief.md` — nothing authored.

## Ownership

`.claude/worktrees/` now has exactly one owner: the hourly reaper (`clean-stale-git.sh`, merge-gated + liveness-guarded per THR-673). `pull-work` Step 0's sweep stays scoped to `tfws-pickup-*` / `tfws-resume-*` and is documented as never touching that path. This retires the three-policies-one-folder conflict that left these six strays without a disposer.
