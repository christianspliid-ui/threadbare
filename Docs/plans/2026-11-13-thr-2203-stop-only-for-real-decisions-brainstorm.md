> **title:** Brainstorm companion — Stop the world only for real decisions (THR-2203)
> **linear_issue:** THR-2203
> **author:** Claude Code (design lane, run dl-20261113T1119Z)
> **created:** 2026-11-13

# Brainstorm companion — Stop the world only for real decisions

Companion to [the plan](2026-11-13-thr-2203-stop-only-for-real-decisions.md). It records the options weighed and the tensions behind each decision.

## The shared premise

Law 15 says the player's interrupts are ones they asked for. Law 27 says the world stops for every moment that matters. Law 29 says chapters are never rationed. The only lever left is *whether a chapter halts the clock*, never whether it happens. Every option below was tested on one question: **after this stop, did the player have something to decide, or something of their own to read?**

## Which moments earn a stop — options

1. **Untouched ending → badge (chosen).** It reads the existing `godTouchedEncounter`, so there is no new judgement. The ending stays one click away on the badge and the Ledger (UI Law 55).
2. **Every "Theirs alone" chapter's ending → badge.** Narrower than 1: it misses a "Waits for you" chapter the player let fate decide. Option 1 covers both.
3. **Fated step with a purely dealt hand → short fuse (chosen).** Fuse, not skip: the player keeps the choice to steady it, and Fated still fails sometimes (THR-2171). The fuse reuses the "Lives on" auto-resolve path, so there is no second mechanism (Law 42).
4. **Any Fated step → fuse.** Rejected. Authored cards leave things behind, so an authored Fated step is still a decision, and authored chapters are the best-rated moments in every round.
5. **Skip Fated steps outright (resolve at post).** Rejected. The god would lose a decision it might want (guarding a key step), and the badge would say nothing true about why.
6. **Daily cap on stops.** Rejected: rationing by another name (Law 29).
7. **Journey visions and Doom notices.** Out of scope. Visions are ticket 4 ([THR-2204](https://linear.app/threadbare/issue/THR-2204)). Doom stages are named by Law 27 as moments that stop.

Tension: UI Law 39 says every beat at pause tier interrupts. The ticket's approved direction narrows "beat" to a beat with a choice. The law text is amended in slice A rather than silently bent, and the amendment is on the run's veto line.

Tension: Law 13 (the world does not wait) against the THR-1730 set-down hold, where the mortal waits forever. The fuse sides with Law 13. A badge the player ignores lets the mortal act, as a "Lives on" thread does.

## Why the hands are the same — measured, not guessed

The census (proto branch) shows the cause is structural:
- The hunger card wins the sphereless slot (+1 earned).
- The spread pass takes both signatures (the four-sphere target is unreachable for a two-sphere god).
- The four untagged core cards tie on the last slot, and the id breaks the tie.

Tags never reach a slot that is still open.

## Hand variety — options

1. **Stakes lean by step difficulty, plus a primary-only spread (chosen).** Measured: the modal hand falls from 67% to 27% of dealing steps. Difficulty is authored and static, so Law 21 holds. It also says something true: guard cards where the odds are good, the boost where they are bad.
2. **Two-band lean (easy and hard only, arm C).** The modal hand fell to 33%, but middle-difficulty steps (the median is 0.40) still all dealt the same.
3. **Read the live forecast.** Rejected. The resolution path re-derives the hand, so a forecast that moves between render and roll changes which cards were committed.
4. **Tag the core cards by theme.** Rejected. Mercy is not "social", and the tag would be a lie on the card.
5. **Primary-only spread alone (arm B).** It measured no change (0.67). It is kept only because it lets the stakes lean reach the third slot.
6. **Raise `DEAL_DEFAULT_COUNT`.** Rejected. A bigger hand from a seven-card repertoire just deals the whole repertoire.

## Vision premises leaned on

- The pleasure is witnessing, not steering (`00-north-star.md`): fewer empty stops leave more watching.
- Time stops for every moment (`01-core-loop.md`): the reason is that reading must not cost time. A badge costs no time either.
- Taste profile: legible cause and effect. The badge says what is happening and how to stop it.
