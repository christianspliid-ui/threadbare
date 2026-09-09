# Briefing

**Generated:** 2026-09-10 00:57 local (22:57 UTC) · keep-work-flowing-cc

## The one thing

**Two encounters, on the live site, waiting for a yes.** The camp six shipped and merged tonight; your rule 6 samples two of every six, and these are the widest tonal gap in the batch. Both open straight into the encounter — I checked each one renders on the deployed build.

- [**Ward the Camp**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.ward_the_camp) — thinnest start; its hand forces the game's second omen emitter.
- [**Tend to Wounds**](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.tend_to_wounds) — warmest tone; a possession and a piece of knowledge come out the other side.

Worth meeting twice? **Yes releases batch 3.** Anything short of yes is feedback the line can act on. [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) · [batch report](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/batch-report-2026-09-09.md)

This is the same ask as the last brief — nothing new has joined the list since, and no doorbell rang for it.

## Also waiting (8)

- **[Rule on the backlog](https://linear.app/threadbare/issue/THR-1195)** — ~13 tickets waiting on a one-sentence ruling, not on effort. Say *"rule on the backlog"* and they come smallest first.
- **[The fight map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — ten questions, all research finished, every one yours. Say *"work the fight map"*.
- **[Powers](https://linear.app/threadbare/issue/THR-1232) and [items](https://linear.app/threadbare/issue/THR-1236) sketches** — a session builds them, your reaction is the decision.
- **[Image credits](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — the real question is whether image spends should be gated on you at all.
- **[What a run is about](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)** — remembrance or named campaigns. Nothing downstream waits.
- **[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — one word: still planning to design it, or free the slot?
- **Was the weekday quiet deliberate?** — 18 h of lane silence through 2026-09-09, fully recovered, cost nothing.
- **Are weekends normal too?** — last weekend held a 45 h gap; overnight is ruled normal, weekends are not, so the probe keeps raising them.

## Queue

Healthy but thin — **4 ready to build, 2 in flight.** Two new items arrived tonight, both filed by lanes: a [precheck blind spot](https://linear.app/threadbare/issue/THR-1443/session-precheck-is-blind-to-linear-so-a-lane-whose-every-invariant-is) (Medium) and an [undertaking-outcome bug](https://linear.app/threadbare/issue/THR-1444/undertaking-outcomes-silently-lose-their-site-occurred-at-points-at-a) (Low). The [incident-capture button](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in) got its design pass and is now queued to build.

- **Parked, In Dev:** [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) — held on your verdict above, which is the correct place for it to sit.
- **Active:** [THR-1002](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (card grammar), a session on it now.

## Health

- **One PR is armed but cannot merge.** [#1865](https://github.com/christianspliid-ui/threadbare/pull/1865) (THR-1002, card grammar) has a failing `Test · Typecheck · Build`; auto-merge stays armed and never fires, so it reads as shipped everywhere except the check rollup. The session that owns it fixes and pushes — not yours.
- Deploy, automated checks, all workflows, scheduled tasks and the worktree reaper are green. The live site serves the latest commit on `main` (`6d77c36c`). Engine speed is 65 ms/tick, 23 % *below* the 7-day median.
