# Briefing
**Generated:** 2026-09-09 22:54 local (20:54 UTC) · keep-work-flowing-cc

## The one thing

**Say "rule on the backlog"** — about thirteen one- and two-sentence rulings in one sitting, smallest first, framed in game terms.

Nothing is broken tonight and nothing is waiting on you to unbreak it. What *is* true is that the shelf holds five items and the reason it keeps emptying is that the next tranche of work is not un-built, it is un-ruled. Each of these releases a piece of buildable work the moment you answer:

- [What a Divine Herald is](https://linear.app/threadbare/issue/THR-1195) — three live options.
- [Which Spheres shadow and void belong to](https://linear.app/threadbare/issue/THR-1114).
- [Whether a toll moves wealth or deletes it](https://linear.app/threadbare/issue/THR-1189).
- [Whether a page you can open mid-game should exist](https://linear.app/threadbare/issue/THR-1315).
- [Activate the pressure system or retire it](https://linear.app/threadbare/issue/THR-1318) — and [whether that is the design](https://linear.app/threadbare/issue/THR-1148).

Full list and framing: [user-actions.md § 1](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

*You approved batch 2 an hour ago and it landed where it needed to — [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-six-through-the-factory-line-shrine) is on the shelf and the builder takes it on its next pass. Nothing further owed there.*

## Also waiting (7)

- [The fight map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict) — ten questions, all yours, every piece of legwork under them finished. Say *"work the fight map"*.
- [Two sketches](https://linear.app/threadbare/issue/THR-1226) — [twenty spells](https://linear.app/threadbare/issue/THR-1232) and [thirty items](https://linear.app/threadbare/issue/THR-1236) built for you to react to; your reaction *is* the design decision.
- [Image credits](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five quarantined plates, plus the real question: should image spend be gated on you at all, or decided by the lane and reported after?
- [What a run is *about*](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — does a run's spine come from what the god remembers, or from a named campaign the world offers?
- [The incident-capture button](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) — you filed it 24 days ago; yes puts it in the design queue, no closes it.
- [Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) — still just intent; yes changes nothing and the asking stops.
- **Was the quiet deliberate?** Today's 18-hour gap recovered on its own and cost nothing in the end. One word retires the alarm — and a second word on whether weekend quiet is normal too.

## Queue

**Healthy — 5 ready, 1 in flight.** Nothing stale, nothing blocked at the top.

- [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-six-through-the-factory-line-shrine) (High) — the camp six, promoted onto the shelf at 22:49 after your approval. Builder's next pass takes it.
- [THR-1134](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) (High) — on the shelf but genuinely waiting on the yes/no above.
- [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (Medium), [THR-1443](https://linear.app/threadbare/issue/THR-1443/session-precheck-is-blind-to-linear-so-a-lane-whose-every-invariant-is) (Medium), [THR-1444](https://linear.app/threadbare/issue/THR-1444/undertaking-outcomes-silently-lose-their-site-occurred-at-points-at-a) (Low).
- Parked in flight: [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) — the batch programme's parent, deliberately held open while its batches run. Not a stall.

## Health

- **"Heavy simulation tests" has been red on `main` for 26 hours and nobody has picked it up.** This is the post-merge lane that catches what the merge gate deliberately does not run, so a regression is sitting on `main` unnoticed — [the failing runs](https://github.com/christianspliid-ui/threadbare/actions/workflows/heavy-tests.yml). No ticket exists for it. **An executor's job, not yours** — flagged here so the next pickup session sees it.
- The scheduled fleet's 18-hour silence today (03:56 → 22:01 local) has fully recovered — every lane is back within schedule, and `tb-orchestrator` cleared its backlog on the 22:27 pass. No pause marker covers that window, or the 44.9-hour one on 4–6 September; that is the ask above, not a fault.
- Everything else green: deploy up to date, CI green on `main`, no PRs waiting, all nine scheduled tasks on schedule, reaper ran 14 minutes ago, engine tick cost 63 ms/tick — 26% *below* the 7-day median.
