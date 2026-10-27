---
name: ux-review
description: Weekly whole-screen UX review of Threadbearer (tb-ux-review lane). Replays a fixed journey of twelve moments on the deployed build at 1920×1080, builds a contact sheet that puts this week's screens next to last week's, judges each composed screen against the UI Laws, files at most three findings, tracks earlier findings, and publishes the report, sheet and metrics to `ops`. Run by the weekly `tb-ux-review` lane or by hand. Triggers on "ux review", "/ux-review", "whole-screen review", "contact sheet", "the week's screens", "is the UI getting worse", "UX drift", "journey screenshots".
last_validated_against: 2026-10-27
invocation: /ux-review [--dry-run] [--lane]
audience: claude-code
---

# UX review — the whole screen, every week

Every other UI check looks at one change at a time: the review gate reads a diff, browser-verify captures the surface a ticket touched, the UI-debt ratchet counts code patterns. Nothing looked at the **composed screen** a player sees, and nothing compared it with last week, so the screen could get worse while every change passed (assessment 2026-10-27, Christian: *"I think the UX design is slowly deteriorating"*). This lane is that missing owner. It looks at the same twelve moments every week, judges them as a player meets them, and shows Christian the drift as a picture.

**Your job is the art director's, not the tester's.** The cold playtest asks "does a new player understand?". This lane asks "is this screen well made, and better or worse than last week?".

## Harness

| File | Role |
|---|---|
| `scripts/ux-review/journey.json` | the fixed journey: base URL, viewport, pinned `playwrightCore`, the twelve moments and their steps. `journeyVersion` bumps on any moment change |
| `scripts/ux-review/capture.mjs` | replays the journey headless (installed Chrome, software WebGL), saves one 1920×1080 PNG per moment, measures each screen, builds `contact-sheet.jpg` against the newest earlier week on `ops`; `--stage` copies the publish set into the worktree |

Full-resolution runs live in `%USERPROFILE%\.threadbare\ux-review\<date>\` (the newest `keepLocalRuns` are kept). Thumbnails (960 px), the contact sheet and `manifest.json` go to `ops` under `Docs/ops/ux-review/<date>/` for good, so the visual history is one click away. Playwright is not a repo dependency: the script installs the pinned `playwright-core` into `%USERPROFILE%\.threadbare\ux-review\runtime\` on first use.

**Metrics** (per moment, in `manifest.json` and `Docs/ops/ux-review-metrics.tsv` on `ops`): `words` and `interactive` (visible, unoccluded text words and controls — a clutter proxy), `smallTargets` (controls under 24 px, Law 46), `offscreenControls` and `pageScrolls` (Law 33), `dialogs`, `coachMarks` (open "got it" hints), `fontSizes`, `consoleErrors`. They are proxies measured the same way every week: read the **deltas**, never the absolute numbers, and never file on a number alone.

## Procedure

### 0. Mode and gates

| Mode | Invoked as | Gates | Linear writes |
|---|---|---|---|
| **Lane** | `tb-ux-review` (`--lane`) | 1, 2 | yes |
| **Attended** | `/ux-review` by hand | 2 | yes |
| **Dry run** | `--dry-run` | as the mode says | none; report marked DRY RUN, nothing published to `ops` |

1. **Spacing.** The newest `Docs/ops/ux-review/<date>/` on `origin/ops` is at least 6 days old.
2. **Deployed.** `npm run check:deploy` reports `deployed` (or `skipped`) for `main`. A build mid-deploy is retried once after 15 min, then the run goes ahead and says so.

Linear unreachable (precheck `linear=noauth|unreachable`) → run steps 1–4 and publish with `## Needs Christian: None.` and a line that filing was skipped; file next week.

### 1. Capture

```bash
node scripts/ux-review/capture.mjs --stage        # lane / attended
node scripts/ux-review/capture.mjs                # dry run: nothing staged
```

Run from the worktree root, in the background (about 3–5 minutes). It prints one line per moment and a summary with `reached: x/12`. A moment that is `not-reached` still has a frame — whatever was on screen when the step failed.

### 2. Read

- **Every full-resolution PNG** in the run directory with the Read tool, one by one. Zoom with the `image-zoom` skill where text is small. Never judge from the contact sheet; it is for Christian.
- The previous week's thumbnail of each moment (`git show origin/ops:Docs/ops/ux-review/<prev>/<id>.jpg > <scratch>.jpg`), and `manifest.json` from both weeks for the metric deltas.
- `marker` on the warm moments: the `[warm-start] done` line says how far the world really got (`advanced`, `stoppedEarly`, `openInterruptsAtArrival`).

### 3. Judge each moment

Load [`Docs/design-system/laws.md`](../../../Docs/design-system/laws.md) in full first. Then look at each screen as composed — the laws hold for the whole screen, not per component. CI already gates the code-level laws (tokens, primitives, icons, tooltip ids); spend your attention on the ones only a picture shows:

| Look for | Laws |
|---|---|
| Things fighting for the eye: stacked hints, overlapping tooltips and toasts, three panels saying the same thing, dead space next to cramped text | 49, 53, 57, and the § I–II presentation laws |
| Words and numbers: raw numerals, internal keys, `{tokens}`, key: value labels, novel-register prose | 13, 14, 16, 42, 43 |
| Can the player tell where they are and why the clock stopped | 24, 37, 52, 55 |
| Fit: anything cut off, scrolling at page level, unreadable at 1920×1080, low-contrast text, tiny targets | 33, 45, 46, 57 |
| Colour meaning: green/red/gold used against their polarity | 31 |
| Controls that look clickable and are not, or do nothing | 25 |

Also read each screen against the open complaint classes in [`Docs/ops/player-complaint-classes.md`](../../../Docs/ops/player-complaint-classes.md): a frame that shows a live class is evidence for it.

Write one short verdict per moment: **better / same / worse than last week**, and why in one clause.

**A `not-reached` moment** is one of two things. Find out which before you write anything:
- **Journey drift**: a label or route changed and the step no longer matches (the frame shows a healthy screen). Fix `journey.json` in a PR (`chore/ux-review-journey-vN`), bump `journeyVersion`, and say so in the report. Not a finding.
- **Product fault**: the frame shows the player could not get there either (a crash, an end screen, a missing control). That is a finding.

### 4. Compare with earlier findings

`list_issues(label: "ux-review")` across every state. For each one, record:
- **fixed-confirmed**: closed, and this week's frame of its moment shows the fix;
- **open**: still open (carry forward; one line);
- **recurred**: closed, and the frame shows the problem again. File `Recurs after fix: <original title>`, `relatedTo` the original.

### 5. File (skipped in dry run)

**At most three new findings a week**, ranked by how much a player suffers from them; the rest are listed in the report as *noted, not filed*. A lane that floods the queue gets ignored. Never file a finding that an open ticket already covers — comment the new frame on that ticket instead.

Each finding goes to project **UI Visual Overhaul — Design System v1**, labels `ux-review` + `UI` + `Bug` or `Improvement`:
- the moment and a link to its frame on `ops` (`https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/<date>/<id>.jpg`), last week's frame when the change is a regression;
- the law(s) it breaks, quoted by number;
- the cause in source when you can find it (fan out an Explore subagent to locate the component);
- **Done-when**: "the `<moment>` frame on the next ux-review shows …" — an observable change, never a count.

A plain defect with its cause found goes to **Ready for Dev** with the THR-836 coordination block as its first comment. A design question (what should this screen show?) goes to **Todo**. Verify every write with `get_issue` (impediment #48).

### 6. Publish

Write `Docs/ops/ux-review-<date>.md`:

```markdown
---
lane: ux-review
date: <date>
journeyVersion: <n>
deployedCommit: <sha>
previous: <date or none>
reached: <x>/12
filed: <n>
needsChristian: <true|false>
---
# UX review — <date>

## This week's screens
[Contact sheet — this week next to last week](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/ux-review/<date>/contact-sheet.jpg) — <one plain sentence: the overall direction this week>

## Moments
| Moment | vs last week | Why | words | interactive | coach marks |
<one row per moment; the metric cells show this week (delta)>

## Findings filed
## Earlier findings
## Noted, not filed
## Journey health     ← reached x/12; each not-reached moment and whether it was drift or a fault
## Needs Christian    ← usually "None." Only a real creative fork goes here, in game words, with links.
```

Every link is a full URL (Rule Zero). Then publish and clean up:

```bash
bash scripts/ops-publish.sh -m "docs(ops): ux review <date>" Docs/ops/ux-review-<date>.md Docs/ops/ux-review-metrics.tsv Docs/ops/ux-review/<date>/*
rm -rf Docs/ops/ux-review/<date> Docs/ops/ux-review-<date>.md Docs/ops/ux-review-metrics.tsv
```

None of these files belong on `main`. `keep-work-flowing-cc` puts the `## This week's screens` line into Christian's briefing for seven days; it is never an ask.

## Fail-soft

| Failure | Do |
|---|---|
| Chrome missing or the runtime will not install | report the error, file nothing; log an impediment |
| Site unreachable | every moment `not-reached` on its first step: report the outage, file nothing |
| Fewer than 6 of 12 moments reached | publish the report and sheet, file only product faults you can verify in source |
| No earlier week on `ops` | the sheet's left column says so; every verdict is "first week" |
| `ops-publish.sh` fails | leave the files in the worktree and say so (a lingering ops report means a failed publish) |

This is a probe under the six-week sunset rule (CLAUDE.md § Process-work throttle). The weekly review renews it by citing the findings it filed and the regressions its sheets showed.
