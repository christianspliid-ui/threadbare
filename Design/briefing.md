# Briefing
**Generated:** 2026-08-25 00:55 local (22:55 UTC) · keep-work-flowing-cc

## The one thing

**Say yes to the batch-2 brief.** It is still the only thing between you and the play session — and the machine is about to run out of work without it.

[Retrofit batch 2](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — the **camp seven**: shrine offering, sharpening blades, warding the camp, a small prayer, rest and reflection, tending wounds, scouting the perimeter. All seven exist today and all seven are thin — the census behind the brief found **no typed consequences at all** in that set, only bare standing nudges that leave no mark on the world.

**What changed this hour:** the [border-perils batch](https://linear.app/threadbare/issue/THR-1221/run-the-border-perils-batch-6-new-encounters-through-the-full-factory) — the six you approved at 18:08 — has finished authoring and is **now running its final checks**: the encounter gates, the type check and the production build all wrote output in the last half hour. It is close to landing. When it does, batch 2 is the only game work left for the machine to pick up, and it cannot start without your word.

**Why it is still the one thing:** [your integrated checkpoint](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with) — *you play all five encounters with every component at standard, in one sitting* — has exactly one item in front of it, and **the shrine offering is roster encounter #1 of that sitting.** The checkpoint cannot invite you while that encounter is below standard.

**The brief:** [`retrofit-batch-2-brief.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) — merged and readable now, though you should not need to open it.

**The only judgement in it:** the batch is **seven, not six**. The camp set is one family in one file, and splitting the seventh into its own batch costs a full cycle for nothing. Say *"batch 2, seven is fine"* and it runs; say *"keep it six"* and it splits 6+1.

## Also waiting (8)

- **[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — do image spends get gated on you at all, or decided by the lane and reported after?** Unchanged. Five Meet-The-First scene images break your art rule; substitutes cover the slots so nothing is broken. It waits for one reason only: running it spends credits.
- **Chart the hub map** — the only item that adds new ground, and only you can start one. **Advice is still to wait one cycle:** your slice checkpoint above is this map's entry condition.
- **Design hours — four sittings stacked.** [Card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (6 days), [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (10 days), then [shared anchor machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) and [hunger vocabulary](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key).
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — does a run's spine come from what your god remembers, or from a named campaign the world offers?** Forty-eight authored milestone lines are written for the second; every live game uses the first.
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) — should committing a nudge carry ~1.6s of held breath before the outcome lands?** Pure feel. Two lanes recommend no.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one `npm run dev` and a browser at 1920×1080.** Nineteen owed screenshots a scheduled run structurally cannot take.
- **A Tenacious-style trait** — parked option, no ticket, nothing waiting on it. Listed so it is not silently forgotten.
- **Was the 20–22 August quiet deliberate?** Lanes stopped for 35 hours and resumed on their own; no pause marker covers that window. Only you know. A yes closes it; the probe will keep flagging it until you say.

## Queue

**One batch in its final checks, and the shelf behind it is bare.** [THR-1221](https://linear.app/threadbare/issue/THR-1221/run-the-border-perils-batch-6-new-encounters-through-the-full-factory) has been claimed and worked since 20:02 — its branch committed 16 minutes ago and its worktree is writing gate output, so it is alive and near the end, not stalled. What remains claimable is two Low accessibility deferrals and nothing else.

- [**THR-1094**](https://linear.app/threadbare/issue/THR-1094/conditions-are-named-on-player-surfaces-but-are-not-a-tooltip-class) — Low. The game calls an agent *exhausted*, *grieving*, *cursed*, and hovering the word gives nothing back.
- [**THR-1095**](https://linear.app/threadbare/issue/THR-1095/the-shared-tooltip-trigger-is-not-focusable-so-every-tooltip-in-the) — Low. Tooltips answer only to a mouse, so a keyboard player cannot read the game's own vocabulary.

**This is the shape your yes above fixes.** When border-perils lands, the pickup lane's next turn has only Low deferrals to pull unless batch 2 has been approved by then.

**Four parks, all intact** (no assignee, `In Dev`): [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) (9 days — superseded in sequence by the two live batches), [THR-1216](https://linear.app/threadbare/issue/THR-1216/director-ruling-the-encounter-target-mix-does-siege-go-first) (your siege ruling recorded; closing it is a lane's job), [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) (7 days), [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) (9 days).

## Health

- **All probes green.** Live site serving `cbacc8d7`. CI healthy, both background jobs healthy, no PRs open or waiting to merge, all 9 scheduled lanes within schedule, home tree clean and level with `origin/main`, worktree reaper swept 00:40 local.
- **One near-miss caught and logged, no work lost.** The hourly pickup lane woke while the border-perils batch was still running, and every documented check told it to "resume" that branch — which would have put two sessions on one encounter batch. It compared the branch's real age instead, saw a three-minute-old commit, and stood down without writing anything. Recorded as [impediment #743](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md); the lane's own fix belongs to the weekly retro, not to you.
- **Lane silence:** the 35-hour gap of 20–22 August is still on the record with no pause marker covering it — it stays on your list above, since one word from you closes it and nothing else can. The three later gaps are overnight-shaped and declined per your 8 August ruling.
