# Weekly Project Hygiene — 2026-08-09

Full sweep (last sweep was 2026-08-02, 7 days prior — outside the 4-day light-sweep window).

## Needs Christian

Nothing needs you beyond what's already surfacing through your hourly briefing and the daily-backlog-grooming report. One item worth knowing about even though it needs no decision: **THR-883 (Fable encounter-writing format) completed at 08:45Z this morning, mid-sweep** — the eleven paused content tickets (including THR-860) unblock on the next orchestrator promotion sweep. Nothing for you to do; the pipeline handles it.

## Queue health

- **Ready for Dev: 33**, all Low priority at the moment of this sweep — this is expected transient composition, not a starved shelf: THR-1054 (Medium) had just been claimed into In Dev when I queried, and daily-backlog-grooming's own report from this morning already tracks queue composition day-to-day and called it healthy ("no longer all-Low" as of yesterday, half process/half product, within the executor's one-process-per-three-runs budget). Not re-flagging — already owned by that lane.
- **In Dev: 2** — THR-1054 (legitimately active, PR #1364 armed auto-merge, shipped this morning) and THR-860 (deliberately `Parked` behind THR-883, now stale-parked since THR-883 completed this morning — will clear on the next promotion sweep). See THR-1058 for a related assignee-tracking gap found on THR-860.
- **In Design: 1** (THR-1043, "The Encounter Factory") as of THR-883's completion this morning. THR-1043's plan doc has a completeness gap — filed as THR-1060.
- **Implementation Planning: 0.**

## Findings filed

- **THR-1056** (Medium) — Home tree accumulates untracked `Docs/ops/*.md` and `Design/retros/*-draft.md` report files (23 files, 2026-08-02 → 08-09), never published or cleaned up. Latent THR-937-shaped autosync risk.
- **THR-1058** (Medium) — THR-860's assignee silently reverted from explicitly-nulled back to the API actor between 2026-08-02 and 2026-08-08 with no explaining write — extends THR-845 beyond `issueCreate`.
- **THR-1059** (Medium) — Promote "Browser pane unavailable in unattended scheduled runs" to CLAUDE.md Known Sandbox Limitations (impediments #448, #472, #493, #499 — 4× in 4 consecutive days, not yet promoted).
- **THR-1060** (Medium) — THR-1043's plan doc is missing the NFP compliance table, constants table, and Substrate inventory section required for an Engine-pillar design.
- **THR-1057** (Low) — `.agents/skills/image-manipulation-workspace` holds ~320 untracked eval-output PNGs at the exact path the retired duplicate skill tree used, inviting a false THR-654-regression finding (nearly did this run).
- **THR-1061** (Low) — Wiki-manifest coverage gaps: `world-map-reference` omits all `src/components/HexMap/*` files, `armies-battles-reference` omits `armySupply`, and `src/engine/groups/*` has no page at all.

## Clean checks

- **Skill tree** — `.claude/skills/` is the only skill *definition* tree (43 folders, each with a non-empty `description:`). `.agents/skills/` exists but holds only eval-output scratch, not rival skill definitions (see THR-1057). No orphan skill directories found beyond the already-noted workspace folders.
- **Scheduled-task registry (directions 1 & 2)** — `list_scheduled_tasks` (10 entries) matches the registry's CC-lane tables exactly (9 live + 1 out-of-scope `website-code-work`), and every fire time checked against the registry's documented cron/jitter math lines up.
- **Documentation staleness — root markdown** — `CLAUDE.md`, `AGENTS.md`, `Index.md`, `STYLE.md` only, matching the allowlist exactly. PASS.
- **Impediment log** — current through #500 (2026-08-09), well-maintained, every entry carries analysis and a workaround. No new chronic pattern found beyond the Browser-pane one already filed (THR-1059); everything else recurring is already cross-referenced in CLAUDE.md's Known Sandbox Limitations (node_modules junction repair, `preview_start` port mismatch, `__DEBUG` Promise gotchas, duplicate impediment ids via THR-1018).
- **Retro follow-through** — `retro-2026-08-07.md`'s "Previous Retro's Backlog" table shows all four carried items Done. Its own backlog (THR-1019, THR-1020) is filed with coordination blocks, not yet due for follow-up.
- **Wiki-freshness exemption audit (check 10.1)** — 12 `Wiki-freshness-exempt:` commits in the last 8 days, every one individually read against its diff: 4 empty re-trigger commits (THR-1013 CI incident, already logged), 2 doc-only, and the remaining 6 each carry precise, scoped reasoning (e.g. "public/encounters-manual-reference.html IS updated in this commit, since it documents aftermath" — the exemption is claimed for one page while a sibling page is correctly updated in the same commit). No misuse found. PASS.
- **Done-state smoke test** — spot-checked THR-1040, THR-1046, THR-1054 (today's Done issues): each carries a real landing commit/PR with `Fixes THR-XX`, none show the THR-540 false-close pattern.
- **Three-pillar compliance** — THR-1043 has a completeness gap (filed, THR-1060). THR-883 doesn't fit the standard plan-doc template (it's an interactive chat-prototyping sitting producing exemplar artifacts + a spec rewrite, not a systems plan) — reviewed, not flagged.

## Notes

- **THR-860's `Parked` state is now stale**, not a defect — THR-883 completed at 08:45Z this morning, mid-sweep, which is exactly the condition that lifts the hold. The next `tb-orchestrator` run (~09:26) or `daily-backlog-grooming` run should pick this up naturally; noted here only so it isn't mistaken for something this sweep needed to act on.
- **Wiki-coverage sweep (check 10.2) scope note:** of 202 files changed under `src/engine/`, `src/data/`, `src/components/` in 8 days, 126 non-test files were checked against `wiki-manifest.json`'s globs; 112 matched nothing. Most of that is legitimately-uncovered UI/adapter implementation detail the manifest was never meant to track (e.g. individual `EffectRegistration/*Landing.tsx` components, `HexMap/__tests__/*`). Only the three-plus-one clusters named in THR-1061 looked like genuine "a page exists for this system but its glob misses real files" gaps; did not attempt to classify all 112 individually.
- **Grey zone:** THR-1061's `encounters-manual-reference` / encounter-stage-adapters question is explicitly left as a judgment call in the ticket rather than asserted as a defect — the adapters shape player-facing aftermath/nudge presentation, which arguably is documented behavior, but they're also presentation-layer code the manual page might legitimately not track. Left for whoever picks up the ticket to decide with the page's actual prose in front of them.
