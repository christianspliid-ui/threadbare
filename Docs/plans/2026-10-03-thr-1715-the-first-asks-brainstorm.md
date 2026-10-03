# The First asks — Brainstorm Companion

> Companion to [`2026-10-03-thr-1715-the-first-asks.md`](2026-10-03-thr-1715-the-first-asks.md). Alternatives considered,
> tensions surfaced and Vision premises invoked. Written alongside the plan by the unattended design lane (run 2026-10-03c).

## How this started

Cold playtest round 2 (2026-10-03). All three testers bonded The First and named it the best scene in the game, and two of three quit minutes later. One found her chapters already resolved and failed; the other watched 14 chores scroll past as "chapters". The ticket (THR-1715, Urgent) recommended three moves: default to pause, keep chores out of the Ledger, and count only waiting chapters on the badge.

## First-pass framing I considered

"Flip the default to `pause` and filter chores out of the Ledger." That is what the ticket recommends, and it would have shipped a bug of its own. The census showed:
- **pause alone asks for nothing.** Every chapter The First has is `shaping` tier, and shaping steps need an attended thread tug to notify at all, whatever the attention mode;
- **pause plus the tug bypass asks every 6–8 turns,** one real second a turn, so the clock would stop roughly every seven seconds: the drumbeat the core loop names as a broken scan;
- **the toggle could never have reached pause for her** (a tier gate), would not have repainted if it had, and its price was charged to a field that does not exist.

The first framing was right about direction and wrong about mechanism.

## Alternatives considered

**A. Default pause only (the ticket's literal first bullet).** It changes nothing on screen: shaping-tier steps are gated behind tugs. Rejected as insufficient, after measurement.

**B. Re-tier the raw corpus from authored threat** (`trivial` → background, else shaping). It is the most "correct" data model, but it changes what every watched and retinue mortal shows across the whole game, which goes well past this ticket's surface. Rejected for blast radius. An orthogonal `routine` flag gets the same classification with no behaviour change elsewhere.

**C. Hand-maintained chore list.** It rots the day new everyday content lands (THR-1688 plans master everyday encounters). Rejected: the authored `threatRating` already carries the meaning.

**D. Queue chapters: hold an action until the player opens it.** It sounds like "her life waits on the god", but `progressAllActions` advances every action unconditionally, and holding actions would ripple through every system that reads action state (aftermath, reputation, journeys). Rejected: halting the *clock* gets the same player experience through the proven `?forceencounters` path.

**E. Wall-clock halt cap** ("at most one halt per N seconds"). It punishes the player for speeding up, and it lets chapters resolve unattended again once the cap is hit, which breaks the Fixed-when. Rejected.

**F. Story breath per mortal (chosen).** It shapes the mortal's *life* rather than the player's clock: after a story chapter she lives two days of ordinary life. Every story chapter she does start still asks. It is one number to tune and needs no new surface.

**G. Badge = chapters waiting on the player (the ticket's third bullet).** Under F plus pause, a waiting chapter is already on screen halting the world, so the count reads 0 or 1. Rejected in favour of the opening plan's "unread" rule (THR-1605 S5) with chores excluded.

## Tensions surfaced

- **Emergence vs authorship (Vision tension 1).** Chores are emergence texture; chapters are authored framing. Demoting chores to *Daily life* sides with the chapter without deleting the texture.
- **Deep-few vs wide-many (tension 3).** The breath keeps The First from monopolising the stage. That matters more once THR-1644 makes every thread a ceremony and the player holds several pause-mode mortals.
- **Pressure not the player's to pause (north star).** Halting for moments is sanctioned (core loop, 2026-09-27). The breath means the world keeps running *between* her moments, so doom still presses.

## Vision premises invoked

- Core loop: *"Time stops for every moment"* (the Stellaris ruling, 2026-09-27) and the anti-drumbeat cadence paragraph.
- North star: *"one complex story at a time"*.
- Taste profile: the clock halts for an encounter, a choice or the Chapter Ledger, and a paused god stays paused.
- UI Laws 39, 47, 49, 51, 52, 55.

## What would change the call

- Round-3 testers saying The First's chapters come too rarely or too often: tune `PAUSED_STORY_BREATH_TICKS`.
- Christian saying attention should cost essence: `ATTENTION_MODE_CHANGE_COST` is one number, but it would need a sphere rule.
- Christian wanting chores to remain visible as chapters: drop U2's filter; the rest stands.
