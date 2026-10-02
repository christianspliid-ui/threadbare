# Briefing
**Generated:** 2026-10-02 19:58 local (17:58 UTC) · keep-work-flowing-cc

## The one thing

**Finish the playthrough. Two encounters are left, and the screen is clean.** ([THR-1220](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with))

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

Everything from your four feedback batches is live. The one question is: **played together, are the encounters good enough now?** If yes, the next stage opens: encounters that reach into factions, war, the economy and divine actions.

## Also waiting (5)

- **Was the app closed from Thursday ~17:00 to Friday ~13:45?** No lane ran for about 21 hours, and nothing recorded a pause. If you were away or the app was closed, just say so. *— from the lane-silence check*
- **Were you away from Tuesday evening until Wednesday evening (29–30 Sept)?** No lane ran for about 25 hours and nothing recorded a pause. *— from the lane-silence check*
- **Were you away from the app on Monday 14 and Tuesday 15 September?** *— from [the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-09-23.md)*
- **Turn off Linear's auto-complete for sub-issues** at [Team settings → General](https://linear.app/threadbare/settings/teams/THR/general). It marks unbuilt work as finished. *— from tb-orchestrator*
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail on each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## Queue

**18 jobs ready** (backed up: more than 15). The builder just shipped [rival schemes now show who is behind them, on the map too](https://linear.app/threadbare/issue/THR-829/sponsors-scheme-attribution-edge-never-binds-in-a-real-world-rivals) (merged 19:54 via [#2168](https://github.com/christianspliid-ui/threadbare/pull/2168)); the board will mark it done within minutes. Next builder slot ~20:11.

- **Next in line:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) · [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) · [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) · [the pilgrim way](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the) · [dialogue colours by context](https://linear.app/threadbare/issue/THR-1586/dialogue-palettes-by-context-each-kind-of-dialog-gets-its-own-colour).
- **Small bugs filed this afternoon:** [an apex monster's title missing from its fight header and lair card](https://linear.app/threadbare/issue/THR-1698/an-apex-monsters-card-line-reaches-prose-only-the-fight-header-and), [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply), [a refused visit leaves a phantom appointment](https://linear.app/threadbare/issue/THR-1696/a-refused-visit-leaves-a-phantom-pendingvisitduetick-and-a-missed).
- **Old jobs at the bottom:** five deferrals have sat ready for over a month ([THR-662](https://linear.app/threadbare/issue/THR-662/wire-the-two-remaining-no-op-sanctify-actions-subsanctify-subsanctify), [THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies), [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-make-it-an-authored-flag-on-every-multi)). Not blocked; newer work keeps outranking them.

## Health

- **About a third of high-rank faction work is still unreachable in a long game.** 20 of 60 gated encounters are blocked. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md). A builder's job.
- **The design lane missed today's 14:14 slot.** Its last run was Thursday 14:17; the heartbeat check still counts it within tolerance. Next slot ~20:14 tonight; if that is missed too, a session should look.
- **The simulation got slower this hour.** One measurement, a builder's job to check: tick cost 132 ms/tick steady, 48% above the 7-day median (89, 119 rows since 74b4461e); top phase agent_decision, 540 agents. Name the merges between 74b4461e and 1b12cfd8: git log --oneline --merges 74b4461e..1b12cfd8
- Everything else is green. **The long simulation tests are passing again** ([run on 18:50's merge](https://github.com/christianspliid-ui/threadbare/actions/runs/37036651023); the run on the newest merge is in progress). The newest merge is still publishing to the live site (under 20 minutes old). No pull requests waiting. The cleanup job ran at 19:45.
