# Briefing
**Generated:** 2026-09-07 00:29 local (22:29 UTC) · keep-work-flowing-cc

## The one thing

**Are you still planning to design Traits wave 2? One word.** [THR-790](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)

Carried unchanged, not re-argued. Verified live this run: still **In Design, 22 days, your name on it, no plan doc**. Everything else on your list can wait for you; this one is holding the design tier's preparation slot shut while the build queue is consumed as fast as it refills.

**Yes** changes nothing and the asking stops. **Not getting to it** sets it aside, frees the slot, and the machine starts preparing the next thing tonight. The work itself is location traits going live, artifact traits, and draw-by-trait pools.

## Also waiting (14)

- **[Approve the camp six](https://linear.app/threadbare/issue/THR-1130)** — *"batch 2, run the six"*. [The brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/2026-09-04-retrofit-batch-2-brief.md) is merged, unchanged, and pickup-able now.
- **[The undertaking retirement list](https://linear.app/threadbare/issue/THR-1392)** — four templates get deleted; *"run 4b"* finishes the migration.
- **[Do you still want the incident-capture button?](https://linear.app/threadbare/issue/THR-1134)** — you filed it 16 August; yes or no.
- **[Three questions on the undertakings map](https://linear.app/threadbare/issue/THR-1396)** — take [the division rule](https://linear.app/threadbare/issue/THR-1398) first; it unblocks four.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258)** — settle [monster fights](https://linear.app/threadbare/issue/THR-1263) and [duels](https://linear.app/threadbare/issue/THR-1264) and three more open by themselves.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236)** — sketches built for you to react to.
- **[Image credits](https://linear.app/threadbare/issue/THR-876)** — should the spend be gated on you at all?
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198)** — remembrance, or named campaigns.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133)** — nineteen captures owed; nothing blocks the sitting.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-1220)** — advice is still to wait for your slice checkpoint.
- **A Tenacious-style trait** — parked by default, listed so it is not forgotten.
- **Should weekend quiet be normal too?** — one word declines the 45-hour Friday-to-Sunday gap the way you declined overnight quiet.
- **The scripted half of Linear access** — `LINEAR_API_KEY` is still unset, so a handful of background checks stay dark. Nothing is blocked on it; the board itself answered normally this run.
- **Restart the Claude desktop app when convenient — and it is now smaller than last hour.** The pile-up has **mostly cleared itself**: of the sixteen stale helpers reported at 21:37, **one is still spinning** (~15 of 32 cores), and the machine is at 70% rather than pinned. Still worth the 30 seconds — that last process is what is keeping the engine-speed trend dark — but it is no longer urgent and nothing is at risk if you leave it until morning.

## Queue

**Healthy — 5 ready, machine moving normally.**

- **Ready for Dev: 5**, all unclaimed, none stale — every one touched today. [THR-1407](https://linear.app/threadbare/issue/THR-1407) (owningSystem registry), [THR-1422](https://linear.app/threadbare/issue/THR-1422) (duplicated constants), [THR-1415](https://linear.app/threadbare/issue/THR-1415) (Vite watches worktrees), [THR-1412](https://linear.app/threadbare/issue/THR-1412) (debug-panel dead ends), [THR-1421](https://linear.app/threadbare/issue/THR-1421) (raw numerals on the attachments tab).
- **In Dev: one live claim** — [THR-1420](https://linear.app/threadbare/issue/THR-1420), companion name collision, claimed 20 minutes ago with [PR #1829](https://github.com/christianspliid-ui/threadbare/pull/1829) already open and armed to merge on green.
- **Two parked In-Dev items, both waiting on you and both already on your list:** [THR-1130](https://linear.app/threadbare/issue/THR-1130) (ask 2) and [THR-1392](https://linear.app/threadbare/issue/THR-1392) (ask 3). Correctly parked approvals, not stalled work.
- The shelf stays thin by design: the design tier that would refill it is the lead ask above.

## Health

- **Green everywhere the probes can see.** Deploy live and current at `198310f0`; all 3 scheduled workflows and all post-merge CI green; the one open PR armed and waiting on checks; all 9 scheduled tasks on schedule; the worktree reaper ran 45 minutes ago.
- **Engine speed was measured this run and the row was again not published — but the reading has improved 8×.** It came back at **155 ms/tick steady against a 7-day median of 84**. That is still 84% high, but the tell is that warm-up is inflated *by the same factor* (71 ms against a normal 38) — a uniform stretch is the signature of the machine being busy, not of the simulation getting slower, which would push one phase up and leave warm-up alone. Last hour the same reading was **1233 ms** with warm-up at 907. So the residual single stale process is still poisoning it, and publishing the row would drag the median for a week. Agent-owned; on your list above only as the 30-second restart that would clear it.
- Visibility only, no action: the silence probe still reports the same three gaps (44.9 h weekend, 11.7 h and 10 h overnight). The two overnight ones are declined under your 8 August ruling; the weekend one is on your list above.
- Agent-owned, unchanged and flagged for the Friday retro, not for you: **seven merges to `main` from the outage window carry no `Fixes THR-XX` line** ([PRs #1821–#1827](https://github.com/christianspliid-ui/threadbare/pulls?q=is%3Apr+is%3Amerged)) because the lanes correctly refused to claim board tickets they could not reach. Shipped but unticketed, and needs reconciling.
