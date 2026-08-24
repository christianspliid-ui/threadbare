# User Action Required

**Last updated:** 2026-08-24 11:55 local (09:55 UTC). Standing asks only, per [THR-1077](https://linear.app/threadbare/issue/THR-1077). Run measurements, findings and narration live in the history: `git log -p origin/ops -- Design/user-actions.md`.

## Standing asks

### 1. Does siege go first? — [THR-1216](https://linear.app/threadbare/issue/THR-1216/director-ruling-the-encounter-target-mix-does-siege-go-first)

You said the corpus converges on travel-and-meet-people vignettes. [The assessment](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-08-24-encounter-portfolio-assessment.md) confirms it with numbers: **six of eight slice encounters open on a roadside**, thirteen templates say where they happen at all, and **nothing in the game fights on a battlefield**. The epic bands are not missing — they are *old*: 23 ruin-and-delve, 20 war-and-siege, 13 deep-magic premises, all legacy format. Everything in the new nudge voice is camp chores, roadside vignettes and company scenes.

Recommended build order: **siege and the war-band (6)**, ruins and the delve (5), monsters and the hunt (4), prophecy (3), deep magic and wards (3), factional collapse (3). Deliberately excluded as non-gaps: trade, camp chores, building.

**Does siege lead at six, or do you want a different category first, or different counts?** The next factory run takes its category from your answer. **Silence means siege first** — the default is set, so leaving this costs nothing.

### 2. The verdict on two encounters — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to)

- **The Grateful Kin** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success) · [bad ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_failure)
- **The Unsafe Bridge** — [play it](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success) · [costly ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=success_at_cost)

**Are these two worth meeting a second time?** Nine days open — the oldest ask on the board.

A yes no longer releases the remaining nine on its own: your ordering ruling puts the portfolio work in front of every future batch, retrofit included. So this is feedback on whether the bar is met, not a release valve. Worth ten minutes anyway — it is the only read on whether the execution landed.

### 3. More design hours — only a sitting with you adds new ground

Everything shipped this week was follow-through on ground already agreed. In the order you set:

- **[Unify the card grammar](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card)** — your 6 August note: action cards are too wordy, you cannot tell what they do, playing one gives no feedback, while encounter cards already read the way you wanted. Holding the single design slot since 19 August.
- **[Traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools)** — in design, assigned to you, untouched nine days. Either give it the hour or say *"put Traits wave 2 back in the pile."*
- **The three wave-1 sessions** — [shared machinery](https://linear.app/threadbare/issue/THR-1212/wave-1-design-a-shared-anchor-machinery-the-typed-anchor-the-generated) first, [the hunger vocabulary](https://linear.app/threadbare/issue/THR-1213/wave-1-design-b-hunger-vocabulary-unification-one-catalog-one-key) second, [nations and named areas simulated rather than drawn](https://linear.app/threadbare/issue/THR-1155/nations-and-named-areas-are-rendered-not-simulated-promote-both-to) third.

Behind these whenever you want them: [the encounter slice verdict](https://linear.app/threadbare/issue/THR-907/slice-verdict-session-christian-rules-on-prose-firing-ui-and-game) and your own [one-button snapshot](https://linear.app/threadbare/issue/THR-1134/shareable-game-state-snapshot-one-button-incident-bundle-that-works-in).

### 4. What is a run *about*? — [THR-1198](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)

Forty-eight authored lines narrate a campaign's milestones — a stage advancing, a mandate completing, a mandate failing. They are wired and working, but written for **twelve named campaigns**, while every live game derives its spine from **what your god remembers**. Correct, connected, unreachable; the game falls back to generated text and nothing is broken.

**In game terms: does a run's spine come from what the god remembers, or from a named campaign the world offers?**

- **Remembrance** — write the milestone prose for the twelve hungers instead; the existing forty-eight stay unread.
- **Named campaigns** — give the twelve authored mandates a route back into play. That changes how a run's purpose is *chosen*, not just what it reads like.

No urgency: [the wiring shipped on its own](https://linear.app/threadbare/issue/THR-1197/wire-the-48-authored-mandate-milestone-prose-strings-into-stage) and nothing downstream is waiting.

### 5. Should committing a nudge be followed by a held breath? — [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)

There is a finished, unused piece of sound design: on committing a nudge, roughly 1.6 seconds where a tone draws tight, holds, then releases — and only then does the outcome land. Nothing plays it today; the visual it accompanied was deleted, so what remains is the pacing alone.

**Does committing feel better with that beat, or should the outcome land immediately?** Pure feel; no measurement settles it. Either answer closes the ticket — wired to the encounter veil, or retired with its constants and tests. Open nine days. Two lanes recommend **no**: unskippable on every commit turns tense into waiting, and the timings stay recoverable from history.

### 6. One attended dev-server session — [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)

One `npm run dev` and a browser at 1920×1080: nine surfaces, at least 19 screenshots. Every one is a shipped UI change carrying test-level proof but no picture, because a scheduled run is refused a dev server and so structurally cannot capture one.

**Parked off the shelf on 22 August** — the builder lane recognised it cannot be discharged without you and moved it aside rather than leaving it as phantom depth. It keeps growing as more UI work ships behind the same wall. This replaces four separate tickets (THR-1109, THR-1125, THR-1126, THR-1127), consolidated 2026-08-16 — a merge, not a prune. If you only get through part of it, say which, and the remainder is re-expanded rather than closed whole.

### 7. Image credits — who decides the spend?

**[THR-876](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine) — five scene images that break the art rule.** Ready to run whenever you say. Nothing is broken; substitutes cover those slots. It is on your page only because it spends credits.

**The question underneath it.** The opening beat's three missing plates ([THR-1170](https://linear.app/threadbare/issue/THR-1170/every-meet-the-first-nudge-card-renders-the-same-plate-424-imagetags)) were listed here as your call for the same reason, and a lane made them anyway — taking the arm the ticket recommended, rejecting the free remap because a third of the cards would have gained nothing by it. The judgment looks right. So: **do you want image spends gated on you at all, or decided by the lane and reported after?** Your answer settles the five above and every batch after them. Until you say otherwise the lane keeps the standing rule: *remap where a match is honest, come to you only when it is not.*

### 8. Parked option, no urgency: a Tenacious-style trait

An open design option with no ticket behind it. Explicitly not urgent — the safe default is that it stays parked, and nothing downstream is waiting on it. Listed only so it is not silently forgotten; say the word if you want it opened, and it will be given a ticket and a design pass.

## Resolved this period

- 2026-08-24: **your 1,200 story hooks may go into the repo** — you answered *"yes"* at 10:35, and the work now has a ticket: [THR-1217](https://linear.app/threadbare/issue/THR-1217/publish-the-1200-hook-quest-corpus-christian-approved-it-design-still), High, in the dev queue since 11:31 local. Nothing of yours is left loose here.
- 2026-08-24: **"The Table That Holds" is approved** — you answered *"fine"* at 10:36, [recorded on THR-1182](https://linear.app/threadbare/issue/THR-1182/the-grateful-kins-standing-welcome-has-no-return-visit-author-the), which moved into the dev queue the same hour. Authoring is claimable; the combat-adjacency flag rides with it as a writing constraint, not a new question for you.
- 2026-08-24: **you settled how encounters get built** — [PR #1589](https://github.com/christianspliid-ui/threadbare/pull/1589), recorded on [THR-1043](https://linear.app/threadbare/issue/THR-1043/the-encounter-factory-agentic-workflow-for-composition-complete): game design first, then roll hooks, then judge candidates. Step 1 — [what encounter types the game needs](https://linear.app/threadbare/issue/THR-1215/encounter-portfolio-assessment-what-encounter-types-the-game-needs-and) — shipped the same morning and is the source of ask 1 above.
- 2026-08-24: **eighteen chips stop claiming a standing change that never happened** — [THR-1208](https://linear.app/threadbare/issue/THR-1208/18-cast-fate-chips-wear-kindreputation-with-no-reputation-write-behind): each now names the effect actually behind it.
- 2026-08-24: **the campaign's spine narrates itself** — [THR-1197](https://linear.app/threadbare/issue/THR-1197/wire-the-48-authored-mandate-milestone-prose-strings-into-stage): the 48 authored milestone lines now fire at stage transitions instead of sitting unread.
- 2026-08-24: **a rollable table of story seeds** — [THR-1147](https://linear.app/threadbare/issue/THR-1147/plot-hook-table-rollable-story-seed-inspiration-for-the-encounter): used for real within the hour, by the brief you approved this morning.
- 2026-08-24: **reputation is now one thing** — [THR-1206](https://linear.app/threadbare/issue/THR-1206/reputation-is-the-social-score-between-any-two-parties-unify-faction) ([PR #1586](https://github.com/christianspliid-ui/threadbare/pull/1586)): six different scores wore the word; your ruling made it the one social score between any two parties. From your 16:40 chat to merged and live, unattended, before morning.
- 2026-08-23: **the bond chip stops arguing with itself** — [THR-1205](https://linear.app/threadbare/issue/THR-1205/bond-chip-renders-red-with-an-up-arrow-and-hides-its-effect-in-prose) ([PR #1584](https://github.com/christianspliid-ui/threadbare/pull/1584)): you found it at 17:17 playing The Grateful Kin — red with an up arrow, effect hidden in prose. Filed, built, merged and deployed in eighty minutes.
- 2026-08-23: **two backstories stop calling a mortal's ruthlessness "the patience"** — [THR-1204](https://linear.app/threadbare/issue/THR-1204/mercy-ruthlessness-negative-bodies-1-and-3-call-the-disposition-the) ([PR #1583](https://github.com/christianspliid-ui/threadbare/pull/1583)): two sentences named the quality and then contradicted it three words later.
- 2026-08-23: **the check that catches this whole run of faults now reads every passage** — [THR-1203](https://linear.app/threadbare/issue/THR-1203/pole-manifest-pins-one-body-per-fear-prose-key-the-other-five-are) ([PR #1582](https://github.com/christianspliid-ui/threadbare/pull/1582)): it pinned one passage per key and treated the other five as covered, which is how eight faults of the same kind shipped before anyone saw them.

---

Older resolved entries and every run's full measurements: `git log -p origin/ops -- Design/user-actions.md`.
Live queue and health each hour: `git show origin/ops:Design/briefing.md`.
