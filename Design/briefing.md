# Briefing
**Generated:** 2026-11-18 08:57 local (07:57 UTC) · keep-work-flowing-cc

## The one thing

**What should the design lane plan next?** Everything agreed is now built. **Your play changes the First's story, but nothing you can do yet changes how the age ends.** A played run ends differently from one nobody plays on all 3 test worlds, but only in the First's story: the Ordeal, the Apotheosis, and whether the First becomes your Aspect ([the measurement](https://linear.app/threadbare/issue/THR-2205/measure-whether-the-player-matters-a-run-nobody-plays-and-a-run-played)). The census that plays the new Doom and rival answers ([THR-2243](https://linear.app/threadbare/issue/THR-2243/the-agency-census-answers-the-clocks-a-third-arm-that-holds-stay-the)) found that Stay the Unmaking barely slows Doom, and that every run was already inside Doom's last stage before its census ended. The Stay fix that shipped last night ([THR-2244](https://linear.app/threadbare/issue/THR-2244/stay-the-unmaking-lands-crooked-every-time-a-fresh-god-cant-land-it)) makes that one answer work as designed; the next warm playtest round will show whether players feel it. It does not change the bigger picture. **Reply with a system or a direction.** "Make the god able to change how the age ends" is one natural answer. If you say nothing, the builders stay idle: nothing is ready to build. *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-18.md) and [the design lane](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/design-lane-2026-11-17b.md)*

## Also waiting (12)

- **Should every one of Kael's chapters give you a hand?** Say "every chapter asks" or "keep theirs alone" ([THR-2174](https://linear.app/threadbare/issue/THR-2174/the-player-cant-tell-which-chapters-wait-for-their-cards-the-gallows)). The design lane leans "every chapter asks". *— from [the orchestrator](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/orchestrator-2026-11-18.md)*
- **Pick the carved icon shapes** for the five open icon classes ([THR-1908](https://linear.app/threadbare/issue/THR-1908/christian-picks-carved-shapes-for-the-five-open-icon-classes-doom), on [the review sheet](https://claude.ai/artifact/X9woLDsYia4iP3uQkk6QjN)) and the Inspector tabs with none yet ([THR-2104](https://linear.app/threadbare/issue/THR-2104/christian-picks-carved-shapes-for-the-inspectors-tabs-with-no-icon-yet)).
- **Sunday 8 to Thursday 12 Nov:** silent for 103 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Set the Claude app to open when Windows starts** ([the workflow retro](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-08.md)).
- **Your writing-checks conversation can start** ([the story-text audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-31-encounter-story-text-quality.md#the-writing-checks-against-these-examples-done-when-1b), for [THR-2106](https://linear.app/threadbare/issue/THR-2106)).
- **Thursday 29 to Friday 30 Oct:** silent for 40 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Wednesday 21 to Friday 23 Oct:** silent for 48 hours, with no pause recorded. Computer off, app closed, or a pause?
- **Sunday 18 to Monday 19 Oct:** silent for 23 hours, with no pause recorded. App closed, or a pause?
- **Should "Fated" be gold instead of grey?** If you say nothing, it stays grey ([the plan's section](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-18-thr-1980-words-teach-themselves.md#needs-christian-reserved-not-decided)).
- **Thursday 1 Oct afternoon and Friday 2 Oct morning:** the computer was on, but no lane ran. Was the Claude app closed?
- **Monday 14 and Tuesday 15 September:** the same thing happened. Was the app closed?
- **Fog or witness:** should a stranger's sheet show the wound you just watched them take? If you say nothing, it stays as it is.

Detail for each: [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

## This week's screens

[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/2026-11-12/contact-sheet.jpg) — better: The First's name fits, the essence and Doom readouts speak in words, and returning to the mid-game now opens on a "While you were away" summary, but arrival toasts still pile up and his thread row cuts his story short.

## Queue

**Starved: nothing in Ready for Dev.** The builder finished [THR-2191](https://linear.app/threadbare/issue/THR-2191/a-sheets-story-list-never-says-whether-the-mortal-did-the-deed-or-had) (Story rows say whose deed it was) at 07:02 local and armed [PR #2856](https://github.com/christianspliid-ui/threadbare/pull/2856) to merge itself, but it is stuck on CI (see Health). The work is pushed; its local worktree has no uncommitted edits. Two more design tickets wait in Todo for the design lane: [give both clocks a verb](https://linear.app/threadbare/issue/THR-2202/give-both-clocks-a-verb-the-mortals-deeds-fill-the-mandate-and-doom) and [put the god in the climax](https://linear.app/threadbare/issue/THR-2204/put-the-god-in-the-climax-the-journey-visions-read-from-the-scene-the).

Items for agents, not you:
- **The paperwork-cut ticket is still parked.** [THR-1947](https://linear.app/threadbare/issue/THR-1947/cut-per-pr-paperwork-to-one-status-line-drop-the-changelogproject) has had no owner since 20 Oct (29 days; last touched 8 Nov). It needs gate and CI edits that unattended runs may not make, so an agent can un-park it only in a run someone is watching. No local worktree holds uncommitted work for it.

## Health

- **[PR #2856](https://github.com/christianspliid-ui/threadbare/pull/2856) (THR-2191) still cannot pass CI, and the cause is outside the code.** Every CI job fails at `npm ci`: the `onnxruntime-node` 1.21.0 install script downloads its Linux GPU binary from GitHub releases and gets **404 Not Found** ([run 44248308256](https://github.com/christianspliid-ui/threadbare/actions/runs/44248308256), the only run on the branch; no re-run since 07:01 local). The package is already on main, so any new PR or merge will hit the same wall until CI installs with `--onnxruntime-node-install-cuda=skip` (or the download comes back). Main itself is still green on 882e2ce5 and live. Six builder runs since (07:03 to 08:51 local) stood down on the empty queue without taking the unstick duty for #2856 (pull-work Step 0.8). Builder's job, not yours.
- Lane silence: Sunday 15 Nov 09:57–21:48 local (11.8 hours) is a weekend gap, so per your rulings it is not its own ask.
