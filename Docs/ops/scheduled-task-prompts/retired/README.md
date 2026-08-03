# Retired scheduled-task prompts

Archived copies of prompts whose scheduled tasks were retired. Kept for the record
only — **none of these is registered, and none should be re-registered without a
fresh design pass.**

## Retired with their on-disk directories removed (THR-704, 2026-07-22)

`flush-plan-docs` (retired THR-654), `daily-drift-scan-triage` (superseded by the
drift-scan GitHub Action + weekly-retro), `tb---sonnet---pickup` /
`threadbearer-code-work` / `threadbearer-code-work-opus` (superseded by the single
`tb-opus-pickup` executor lane).

## Mirrored while their directories are still on disk (THR-851, 2026-08-03)

These three sit under `C:\Users\chris\.claude\scheduled-tasks\` with **no registered
task** — `list_scheduled_tasks` returns 10 entries against 13 directories. They are
mirrored here first so deleting the directories is loss-free; the deletion itself is
a Christian action (the path is outside the repo, and an agent cannot undo it).

**Why an orphan directory is a hazard rather than clutter.** It is indistinguishable
by inspection from a live lane's prompt — same path shape, same `SKILL.md` filename —
so a future session can read a dead lane's instructions as current guidance. That is
the mirror image of the hole the registry's existing audit closes.

| Prompt | Verdict | Superseded by |
| -- | -- | -- |
| `check-slack-for-new-dev-work.md` | **Dead.** Polls Slack for Cowork-prepared work; Slack stopped being the handoff channel and Cowork was retired 2026-07-21 (THR-654). | `tb-opus-pickup` |
| `daily-standup.md` | **Dead.** "Check the linear backlog for new ready for dev work … start coding from the top of the priority list" — the pickup lane's job, described in one sentence. | `tb-opus-pickup` |
| `keep-website-up-to-date.md` | **Kept, out of scope.** Pushes updated Threadbare web pages (`/product-strategy.html`, `/the-game.html`) so Vercel redeploys. Not dead work — it pairs with the registered-but-disabled `website-code-work` task. Christian's call whether to register or drop it. | — (see `website-code-work`, disabled) |

**The ticket's guess did not survive inspection**, which is why each was read rather
than triaged from its name: THR-851 recorded that `daily-standup` and
`keep-website-up-to-date` "look personal rather than Threadbare". Both are Threadbare
— `daily-standup` is a one-line restatement of the pickup lane, and
`keep-website-up-to-date` names Threadbare's own deployed pages.
