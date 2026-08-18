# THR-1179 — the last three nudge card types

**2026-08-19 · workstream C complete · all 21 card keywords resolve**

The [previous pass](2026-08-18-thr-1179.md) shipped six of the nine types the ticket's
predicate named and left three genuinely unbuilt: **Whisper**, **Undertow**, **Stumble**.
Each was real engine work rather than a badge correction, and each is now live.

## What shipped

**The Stumble** — a `forecastDelta` identical to an ordinary Boost's, sourced from the
scene's cast instead of from the card. `StepNudge.opposes` names a cast key;
`collectNudgeModifiers` resolves it through the action's `supportBindings` and emits
`{ source: 'cast:<nodeId>', delta }`. The odds move the same either way — what the player
buys is that the panel names *who faltered*, which is the whole difference between the
opposition losing their footing and your hand steadying. Its optional cast-side condition
rides the existing `apply_condition` effect with a `$cast:<key>` sentinel, so the world
change lands on somebody else. Fail-soft: an unbound key falls back to card attribution
rather than dropping the modifier, because the boost was paid for.

**The Undertow** — a boost above Boost and below Heavy Hand, priced not in essence or
attention but in the mortal drifting along a value axis. `StepNudge.valueDrift` is applied
by `dispatchNudgeCommitments` through `driftTowardPole`, the *same* function a branch
decision drifts through, which was exported rather than copied. That sharing is the whole
design decision: card-driven and choice-driven shifts accumulate into one axis entry and
decay toward one baseline, so a mortal's position never depends on which system moved them.
`UNDERTOW_DRIFT_MAGNITUDE` (0.06) sits below `BRANCH_DECISION_DRIFT_MAGNITUDE` (0.08) —
a decision the mortal made should say more about them than a nudge slipped under it.

**The Whisper** — the one card that buys a line rather than odds, and the plan's only new
UI read. A committed Whisper appends one derived factor line naming the next step's reach
and difficulty word, in the existing factor-line vocabulary.

## The fork the Whisper raised, and how it was settled

The type was specced as "reveal one hidden factor line **or** the next step's demand". Only
the second half is buildable against the panel as it stands: every derived line is already
shown, so there is no concealed one to uncover. Building the first reading would have meant
*hiding* lines from every player so that one card could unhide them — making the panel worse
for everyone who never plays a Whisper, to give the card something to do. The next step's
demand is genuinely unknown pre-commit, is a plain read of the template already running, and
answers the exact question the card is sold on: how much of my essence should this step get?

That left a subtler trap. A next step is not always readable — a branching one has no fixed
reach or difficulty until the current step lands. Two readings would have forced the card to
choose between two lies on exactly the templates that matter most: claim nothing follows, or
name one branch's demand as settled. So the reveal has **three** readings, and the third
says the way ahead turns on this step — true, and the most useful thing a god deciding what
to spend here could hear.

## Why the tests look the way they do

Same bar as the previous pass, for the same reason: a host path can rot with no signal,
because a grant that no-ops deep in the applier still prints its fiction (THR-844, 66 of 138
hidden-mark entries pointing at a reveal family that never existed, silent for months).

Each mechanic is driven through its real path and asserted on the host system's own state.
Then each was **falsified** — broken at the seam, confirmed red, reverted:

| Arm broken | Result |
|---|---|
| Stumble's modifier always sourced from the card | RED |
| `$cast:` sentinel binding disabled | RED |
| Dispatch drifts nothing | RED |
| Whisper's `unsettled` collapsed into the no-next-step reading | RED |

Two of the new tests exist only to falsify the others: a hand with no `valueDrift` must move
nothing (else a dispatcher drifting every hand on a default axis would pass), and an
uncommitted Whisper must render no line (else a panel revealing unconditionally would pass
while giving the reveal away free).

The coverage guard flipped direction. It used to name the unbuilt set; the set is now empty,
so "flipping a badge" is no longer how a type can arrive unexercised — *adding a row* is.
A closed-set pin on the 21 type ids replaces it, so a new type breaks the list by name.

## Two mistakes worth recording

The first draft of the Undertow test used `mercy_cruelty` — a plausible-looking axis that
does not exist — and `liveAxisPosition(drift, agentId, axisId)`, which actually takes two
numbers. Both surfaced as `NaN` rather than as type errors, because the fixture cast the
axis to the field's type and the cast hid the bad name from `tsc`. The cast is gone; the
constant is typed `ValuePair` and the accessor is `driftDeltaFor`. Verify the noun before
the verb, and do not cast a fixture into the shape you are testing.

## Fixed in passing

The `nudge-card-grants-dispatch-to-host-systems` contract comment claimed "no shipped card
authors `grants`". `slice.pass.deep_rest` in `vertical-slice.ts` had falsified that some
time ago — a stale *comment* is precisely the drift the freshness gates do not read. The
previous pass flagged it and left it to avoid the two-file edit; this pass was already
paying that cost. The row stays un-LIVE (one authored grant is not coverage), but it now
says something true.

## What this does not do

No template authors a `valueDrift`, an `opposes`, or a `reveals` card yet — that is content,
and THR-1130 owns it. The engine paths are wired, falsified and pinned; they are not
`verifiedLive`, and the interface-map rows say so rather than badging a path nothing travels.

## Evidence

`npm test` green · ratchet unchanged · build ✓ · `check:generated-freshness` OK ·
`check:wiki-freshness:blocking` OK · `check:impediment-ids` OK · 30-tick engine smoke green.
Browser-verify substitution: jsdom-render — unattended run, no startable dev server
(impediments #546, #574, recurring here as #683).
