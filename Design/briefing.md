# Briefing
**Generated:** 2026-08-25 14:05 local (12:05 UTC) · keep-work-flowing-cc

## The one thing

**Who writes the prose rewrite — Fable, or may Opus write it?** One word restarts the whole board.

You ruled this morning that every shipped encounter gets rewritten to the new narrator voice. The ticket is [the corpus rewrite](https://linear.app/threadbare/issue/THR-1223/rewrite-the-shipped-nudge-corpus-to-prose-doctrine-v2-narrator-mode), and it says on its face **"Fable — prose authoring."**

An agent claimed it at 12:08 local, read that line, and **deliberately stopped without writing a word** — because your standing instruction is that Fable writes the prose, on your stated reason that Opus-authored prose has twice passed every automatic check and still failed your read. It scoped the whole job, left nothing half-done, and handed the question back to you. So **the rewrite is not being written by anyone right now**, and the last brief told you it was in progress when it was not.

Two answers, both one line:

- **"Fable writes it"** — it waits for a Fable session you start. The scope sheet is already on the ticket: start with *The Unclaimed Relic*, the calibration case, then the border six in two batches of three, then the slice nine in two.
- **"Opus can write it"** — an agent starts on the next hourly pickup.

**Why this outranks everything else on the page:** the build shelf is at **zero claimable items**, and every remaining item sits behind this one. [The tooling](https://linear.app/threadbare/issue/THR-1224) is mutex'd behind the rewrite; [its split-out half](https://linear.app/threadbare/issue/THR-1225) is natively blocked by it; batch 2 below is behind it either way; and [your slice checkpoint](https://linear.app/threadbare/issue/THR-1220) is behind all of them.

One thing worth knowing before you answer: an agent verified that `check:encounter --all` **passes today, on the un-rewritten corpus, including the exact template you called borderline unreadable.** No automatic gate can catch this failure — which is why the question is yours and not a lane's.

## Also waiting (9)

- **[THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine) — *"Batch 2, seven is fine"* releases the camp seven.** Costs nothing while it waits, and it binds the new prose voice automatically. Now sequenced behind the rewrite either way.
- **[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — should image spends be gated on you at all?** One answer settles every batch after it.
- **[THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game) — does a run's spine come from what the god remembers, or from a named campaign?** No urgency; nothing downstream waits.
- **[THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server) — one attended `npm run dev` session,** nine surfaces at 1920×1080. No lane can do this; it grows as more UI ships.
- **Four design sittings stacked** — [card grammar](https://linear.app/threadbare/issue/THR-1002) (6 days unpicked), [traits wave 2](https://linear.app/threadbare/issue/THR-790) (10 days), [wave-1 A](https://linear.app/threadbare/issue/THR-1212) and [wave-1 B](https://linear.app/threadbare/issue/THR-1213). **The only thing besides the answer above that puts parallel work back on the board.**
- **[THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or) — ~1.6s of held breath on committing a nudge?** Two lanes recommend no. **Unless you say otherwise it will be retired by an agent** — the timings stay recoverable from history.
- **[Chart the hub map](https://linear.app/threadbare/issue/THR-902/encounter-experience-redesign-vertical-slice-wayfinder-map)** — advice unchanged: wait until after your slice checkpoint.
- **A Tenacious-style trait** — parked option, no ticket, no urgency. Listed so it is not silently dropped.
- **[Was the 20–22 August lane quiet deliberate?](https://linear.app/threadbare/issue/THR-1077)** 35 hours, no pause marker covers it. Only you can say.

**Not on this page, on purpose:** the two encounters you were sent at 09:58 local to play and judge are **withdrawn**. Both live in the file the rewrite replaces wholesale — judging prose that is already condemned would break your own rule that nothing comes to you until every part of it is at standard. That verdict returns once, at the slice checkpoint, on encounters in the new voice.

## Queue

**Empty and stalled — 0 ready, 0 claimable.** In Dev 4, and none of them is being actively worked.

- **`Ready for Dev` returned zero.** Confirmed against the same query shape returning 4 for `In Dev`, so this is a real zero, not a failed query.
- **All four In Dev items are parked**, including the rewrite. [THR-1130](https://linear.app/threadbare/issue/THR-1130) (the fifteen-encounter umbrella) has no live question on it — its remaining work rides the rewrite and batch 2. [THR-1133](https://linear.app/threadbare/issue/THR-1133) and [THR-1168](https://linear.app/threadbare/issue/THR-1168) are both in the ask list above.
- **The next pickup has nothing to take.** Not because work ran out — 19 items sit in `Todo` — but because every one of them is gated on a decision from you or a design sitting with you.
- **One thing an agent owes, not you:** the rewrite ticket's park lost its unassigned marker at 13:40 local, the known re-assignment glitch. It changes nothing about the ticket's state, and it is noted so the next lane does not misread it as actively worked.

## Health

All green — deploy (live site serving `e9205e34`), CI, both scheduled background jobs, armed PRs (none waiting), all nine task heartbeats, home tree (current with `main`), and the worktree reaper (last swept 13:40 local). The only non-green signal is the 20–22 August lane gap, which is in the ask list above; the three later gaps are overnight-shaped and declined per your 8 August ruling.
