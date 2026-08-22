# User Action Required

**Last updated:** 2026-08-22 16:53 local (14:53 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Play two encounters and rule on them — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

Six encounters were rebuilt to the new bar. Two are waiting on your eyes, live on the deployed build:

- **The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
- **The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

**What changed since you last played these**, from your own three findings: the bond chip names the mechanic and both ends, and clicking it opens the person who actually owes the favour rather than you; fifteen chips reporting a number you can never see are retired, and the rule that forbids them is now an enforced gate rather than prose; the writing was re-passed to your density note — one named person on stage, props only where you can act on them.

**The question: are these two worth meeting a second time?** A yes releases batch 2 — the remaining nine of fifteen. A no tells the line what the bar is still missing before nine more are written against it.

**Correction, recorded 2026-08-22:** earlier briefs listed this as held back until the Grateful Kin return visit exists. That was wrong — the return visit is downstream, not a precondition. The stated precondition (the rewrite visibly live on the deployed build) was met 2026-08-17 and the site serves it. This was playable and waiting five days while being reported as blocked.

### 2. What is a run *about*? — [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)

**New 2026-08-22, and a genuine fork.** Forty-eight authored lines narrate the campaign's milestones — a stage advancing, a mandate completing, a mandate failing. As of this afternoon they are wired up and working. But they are written for **twelve named campaigns**, and every live game instead derives its spine from **what your god remembers**. The prose is correct, connected, and still unreachable; the game falls back to generated text and nothing is broken.

**The question, in game terms: does a run's spine come from what the god remembers, or from a named campaign the world offers?** Today the code says the first and the writing says the second.

- **Remembrance** — write the milestone prose for the twelve hungers instead. The existing forty-eight lines stay unread.
- **Named campaigns** — give the twelve authored mandates a route back into play. That changes how a run's purpose is *chosen*, not just what it reads like.

Nothing is blocked while you decide. If you rule out the second, the unused machinery gets retired rather than left as a passing test on a dead path.

### 3. Ten minutes to shape one encounter — [THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the)

The town you helped keeps a door open — *A Standing Welcome*, ten game days, visible on the town's page and reachable from the chip. Nobody has written what happens when you walk back in.

**The ask: one short chat where an agent drafts the brief with you** — what the return visit should be, who is there, what the welcome actually buys. The brief does not exist yet; drafting it *is* step one, and your own Factory rule puts your approval before any prose, so it cannot start unattended. Say *"draft the brief for the Grateful Kin return visit."*

It sits downstream of ask 1 and edits the same file, so taking them in that order costs nothing and saves a rebase.

### 4. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: when you commit to a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today; the visual it accompanied was deleted, so what is left is the pacing alone.

**The question: does committing feel better with that beat, or should the outcome land immediately?** Pure feel, no measurement settles it. Either answer closes the ticket — wired to the encounter veil, or retired with its constants and tests. Open since Monday. Two lanes now recommend **no**: unskippable on every commit turns tense into waiting, and the timings stay recoverable from history.

### 5. A design hour — two jobs waiting for it

The wave-1 sitting is **done** (see below). Its three follow-on sessions all need you in a chat — no lane can prepare them away, which corrects an earlier note here saying they were being carved. Two further design efforts also want an attended hour, in the order I would take them:

- **[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** — your 6 August note: action cards are too wordy, you cannot tell what they do, and playing one gives no feedback, while encounter cards already read the way you wanted. Staged with its reading list gathered.
- **[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — in design and assigned to you for a week, untouched. Either give it the hour or say *"put Traits wave 2 back in the pile."*

Behind these whenever you want them: [the anchor prototype](https://linear.app/threadbare/issue/THR-1162/anchor-type-on-a-second-seam-throwaway-prototype-proving-the-pilots), [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game), and your own [one-button snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in). [Nations simulated rather than drawn](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) is scheduled third in wave 1 by your own ruling.

### 6. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: nine surfaces, at least 19 screenshots. Every one is a shipped UI change that carries test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

It keeps growing as more UI work ships behind the same wall. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16 — a merge, not a prune. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 7. Image credits — who decides the spend?

**[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five scene images that break the art rule.** Ready to run whenever you say. Nothing is broken; substitutes cover those slots. It is on your page only because it spends credits.

**The question underneath it.** The opening beat's three missing plates ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) were listed here as your call for the same reason, and a lane made them anyway — taking the arm the ticket recommended, rejecting the free remap because a third of the cards would have gained nothing by it. The judgment looks right. So: **do you want image spends gated on you at all, or decided by the lane and reported after?** Your answer settles the five above and every batch after them. Until you say otherwise the lane keeps the standing rule: *remap where a match is honest, come to you only when it is not.*

### 8. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-22: **a divine spark now records when it happened** — [THR-1196](https://linear.app/threadbare/issue/THR-1196/hexspark-encounter-writes-an-occurred-at-edge-without-the-tick-its) ([PR #1573](https://github.com/christianspliid-ui/threadbare/pull/1573)): sparking an encounter onto a hex left a mark in the world's history with no date on it — the record existed but could never be placed in time. It carries its tick now.
- 2026-08-22: **the campaign's spine narrates from its own writing** — [THR-1197](https://linear.app/threadbare/issue/THR-1197/wire-the-48-authored-mandate-milestone-prose-strings-into-stage): forty-eight authored milestone lines were read by nothing; stage advances, completions and failures now speak them. Filed, built and deployed inside three hours of your wave-1 ruling. Its own honest limit became ask 2 above.
- 2026-08-22: **two divine actions that forged an artifact for nobody now hand it over** — [THR-1194](https://linear.app/threadbare/issue/THR-1194/hexforge-seer-token-and-hexforge-instrument-bind-their-artifact-with) ([PR #1571](https://github.com/christianspliid-ui/threadbare/pull/1571)): forging a seer's token and forging an instrument each reported success and gave the item to no one.
- 2026-08-22: **you ruled the wave-1 slate and unfroze the design program** — [THR-1163](https://linear.app/threadbare/issue/THR-1163/wave-1-selection-which-seams-make-the-first-wave-in-what-order-under): shared machinery first, hunger vocabulary second, the widened region identity third; three plan docs rather than six; mandate prose wired rather than deleted. Five days as the top ask, closed live in chat.
- 2026-08-22: **a stale-file check stopped failing pull requests for the wrong reason** — [THR-1191](https://linear.app/threadbare/issue/THR-1191/checkwiki-freshnessblocking-diffs-two-dot-so-mains-own-advance-fails) ([PR #1570](https://github.com/christianspliid-ui/threadbare/pull/1570)): the gate blamed a branch for changes that had landed on main behind it. Now it looks only at the branch's own work.
- 2026-08-22: **a restored fragment of the world is now a real place** — [THR-1193](https://linear.app/threadbare/issue/THR-1193/hexrestore-fragment-mints-a-sublocation-node-with-no-parent-a-tier) ([PR #1569](https://github.com/christianspliid-ui/threadbare/pull/1569)): mending a broken piece of the map used to build a room with no building around it and no address. It now belongs somewhere.
- 2026-08-22: **a consecrated route now buys the pilgrimage it promised** — [THR-1184](https://linear.app/threadbare/issue/THR-1184/sacred-route-is-registered-but-has-zero-consumers-an-eight-tick) ([PR #1568](https://github.com/christianspliid-ui/threadbare/pull/1568)): the game knew what a sacred route was and nothing in it could ever use one. It can now.
- 2026-08-22: **a room inside a town is now built one way, not two** — [THR-1183](https://linear.app/threadbare/issue/THR-1183/sublocations-are-minted-in-two-incompatible-node-shapes) ([PR #1567](https://github.com/christianspliid-ui/threadbare/pull/1567)): two parts of the game each built the same kind of place differently, so each half was invisible to the other half's eyes. One shape now.
- 2026-08-22: **the words for what a thing can be no longer disagree with themselves** — [THR-857](https://linear.app/threadbare/issue/THR-857/possession-subcategory-vocabulary-has-3-off-union-strays-intelligence) ([PR #1566](https://github.com/christianspliid-ui/threadbare/pull/1566)): three stray labels outside the agreed set, reconciled.
- 2026-08-19: **four trade cards that promised a deal and delivered nothing now deliver it** — [THR-1188](https://linear.app/threadbare/issue/THR-1188/the-four-actiongold-trade-ops-write-actor-location-a-shape-no-trades) ([PR #1563](https://github.com/christianspliid-ui/threadbare/pull/1563)): flagged as possibly needing your ruling because the cheap repair was to delete all four; the agent found the better path and the cards write real trade routes instead.

---

*Older resolved entries and every run's measurements: `git log -p origin/ops -- Design/user-actions.md`.*
*The hourly brief that leads with one ask: `git show origin/ops:Design/briefing.md`.*
