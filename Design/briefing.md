# Briefing
**Generated:** 2026-10-02 17:58 local (15:58 UTC) · keep-work-flowing-cc

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

## Queue

**18 jobs ready, none being built** (backed up: more than 15). The builder finished [the automatic code-review gate](https://linear.app/threadbare/issue/THR-1691/automatic-code-review-gate-a-cold-suspicious-reviewer-runs-before) (merged 17:45 via [#2166](https://github.com/christianspliid-ui/threadbare/pull/2166)). Its next slot is ~18:11.

- **Next in line:** [the seeded spell generator](https://linear.app/threadbare/issue/THR-1572/design-the-seeded-spell-generator-plan-doc-from-the-powers-and) · [the lead survey and the kept visit](https://linear.app/threadbare/issue/THR-1686/the-lead-survey-and-the-kept-visit-a-survey-of-a-held-lead-skips-the) · [the shortlist's fair draw](https://linear.app/threadbare/issue/THR-1687/the-candidate-cap-starves-newly-authored-everyday-content-expert) · [the pilgrim way](https://linear.app/threadbare/issue/THR-1660/a-faith-undertaking-consecrates-new-pilgrim-routes-mid-game-design-the) · [dialogue colours by context](https://linear.app/threadbare/issue/THR-1586/dialogue-palettes-by-context-each-kind-of-dialog-gets-its-own-colour).
- **New this afternoon:** [the Wolf-Winter Watch's "Under Watch" never wears off](https://linear.app/threadbare/issue/THR-1697/the-wolf-winter-watch-puts-under-watch-on-a-village-forever-its-apply) (a content bug), plus three process jobs filed by the review-gate session: [THR-1693](https://linear.app/threadbare/issue/THR-1693/encounter-factory-gates-live-proof-stops-reading-success-side-step), [THR-1694](https://linear.app/threadbare/issue/THR-1694/veto-window-holds-stay-out-of-the-pickup-queue-pull-work-skips-a) and [THR-1695](https://linear.app/threadbare/issue/THR-1695/encounter-authoring-chain-teaches-retired-doctrine-the-authoring-brief).
- **Old jobs at the bottom:** six engine deferrals have sat ready for over a month ([THR-662](https://linear.app/threadbare/issue/THR-662/wire-the-two-remaining-no-op-sanctify-actions-subsanctify-subsanctify), [THR-829](https://linear.app/threadbare/issue/THR-829/sponsors-scheme-attribution-edge-never-binds-in-a-real-world-rivals), [THR-893](https://linear.app/threadbare/issue/THR-893/spawnnudgeexemplar-opens-a-stage-getencounternudges-cannot-see-the-two), [THR-964](https://linear.app/threadbare/issue/THR-964/pendingchoicecommits-has-no-producer-the-entire-encounter-choice), [THR-984](https://linear.app/threadbare/issue/THR-984/process-tidy-bundle-bare-lintplan-doc-lints-staged-files-companies), [THR-1294](https://linear.app/threadbare/issue/THR-1294/requireslocation-defaults-off-make-it-an-authored-flag-on-every-multi)). They are not blocked; newer work keeps outranking them.

## Health

- **Simulation speed crossed the drift line.** 113 ms per tick, 27% above the week's median of 89 (the line is 25%). The last hour's merge was [#2166](https://github.com/christianspliid-ui/threadbare/pull/2166). A builder's job to find which merge in the week did it: `git log --oneline --merges 5de3b1f3..b5350daa`.
- **About a third of high-rank faction work is still unreachable in a long game.** 20 of 60 gated encounters are blocked. Detail: [orchestrator report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-10-02.md). A builder's job.
- **The design lane missed today's 14:14 slot.** Its last run was Thursday 14:17; the heartbeat check still counts it within tolerance. Next slot ~20:14 tonight; if that is missed too, a session should look.
- Everything else is green. The live site is serving the latest merge. No pull requests waiting. The cleanup job ran at 17:44.
