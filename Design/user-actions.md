# User Action Required

**Last updated:** 2026-08-17 19:58 local (17:58 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. One attended design hour — the program has run out of designed work

Everything you directed this morning is one step back from the build queue: nobody has designed it yet, and a design pass only happens in an attended session. The executor is being fed bug fixes and cleanup instead.

**Recommendation, taken unless you veto it:** the next design session takes [nations and named areas](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) — your direction, High priority, and the one that changes what the world *is*. Say *"design nations and named areas"*, or name a different one.

Also in the group: [the typed game-state architecture epic](https://linear.app/threadbare/issue/THR-1156/typed-game-state-architecture-program-epic-claims-vs-reports-acted-on) (Urgent, no longer blocked on you), [wave-1 selection](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under) (needs a shortlist written first), [the second-seam prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots) (needs building first).

### 2. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

Roughly 30 minutes: one `npm run dev`, six surfaces, 13 screenshots at 1920×1080. Six shipped UI changes carry test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

Grew from five passes to six on 2026-08-17 — the character sheet's faction row joined it. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16. It is a merge, not a prune — every parent, URL and Done-when is carried inside the one ticket. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 3. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

**Nudge-card art, when it next comes up.** Standing recommendation the lane follows unless you say otherwise: *remap where a match is honest, come to you only when it is not.*

## Resolved this period

- 2026-08-17: **the 44-hour park on the encounter retrofit cleared** — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) was parked "waiting on Christian's verdict" while that verdict was sequenced behind the ticket's own next action. It is back in the queue at High, and the batch-1 re-pass needs nobody's approval.
- 2026-08-17: **the acted-on taxonomy is settled** — [THR-1161](https://linear.app/threadbare/issue/THR-1161/the-acted-on-taxonomy-acted-on-dormant-hook-or-bookkeeping-definitions) closed. The typed-state map no longer has a question waiting on you.
- 2026-08-17: **the raw engine word is off the choice card** — [THR-1048](https://linear.app/threadbare/issue/THR-1048/the-legacy-encounter-choice-card-breaks-laws-13-and-14-15percent) ([PR #1527](https://github.com/christianspliid-ui/threadbare/pull/1527)): the stance now says what the god does, not what the enum is.
- 2026-08-17: **the slice and batch-1 sample verdict are off your list — you held them, and this lane kept asking.** Your 08:06 instruction was *"hold the verdict on encounters until this is fixed"*; your 14:52 ruling added that the sample does not return until the prose re-pass and the state-first chip copy are visibly live. ([THR-907](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) · [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to))
- 2026-08-17: **the publishing stoppage cleared itself** — the commit flagged at 17:00 published shortly after; the live site is current. Roughly an hour of latency against a normal 7 minutes, never an error. No switch to flip.
- 2026-08-17: **"the god sways the odds" is now the game's language** — [THR-1166](https://linear.app/threadbare/issue/THR-1166/content-sweep-the-god-decides-the-god-sways-odds-and-influences) ([PR #1525](https://github.com/christianspliid-ui/threadbare/pull/1525)) swept the content from your canon correction this morning, plus a gate that keeps the distinction.
- 2026-08-17: **two silent writes fixed** — [THR-1165](https://linear.app/threadbare/issue/THR-1165/two-dollarcast-sentinels-resolve-to-nothing-at-runtime-the-caravan) ([PR #1526](https://github.com/christianspliid-ui/threadbare/pull/1526)): the caravan master's bond and the swindler's mark were claimed by chips but never written.
- 2026-08-17: **the designer view section 5 promised** — [THR-1140](https://linear.app/threadbare/issue/THR-1140/reputation-tallies-are-system-visible-with-no-designer-surface) ([PR #1524](https://github.com/christianspliid-ui/threadbare/pull/1524)) built the tally readout rather than pruning the vocabulary.
- 2026-08-17: **every chip in the game now reaches what it names** — [THR-1164](https://linear.app/threadbare/issue/THR-1164/anchor-the-corpus-sort-every-chip-that-names-a-referent-and-gate-on) ([PR #1523](https://github.com/christianspliid-ui/threadbare/pull/1523)) sorted 48 chips across 17 templates and added a gate that sees all 683 templates.
- 2026-08-17: **prose and chips are one package, ratified** — [THR-1154](https://linear.app/threadbare/issue/THR-1154/prose-and-chips-are-one-package-ratify-the-chip-anchoring-rule-ship) ([PR #1521](https://github.com/christianspliid-ui/threadbare/pull/1521)) made your 07:36 ruling Law 56's second clause.

---

Older resolved items and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.
Current hourly brief: `Design/briefing.md` on the `ops` branch.
