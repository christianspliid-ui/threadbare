# Brainstorm companion — Divine Receipt (THR-727)

Companion to `Docs/plans/2026-07-23-thr-727-divine-receipt.md`. Written alongside the plan, same pass.

## Originating ask

Christian, 2026-07-23 (chat, verbatim): *"look at how to ensure more feedback on the effect of playing a card for the player. I would personally expect some kind of outcome dialogue to show up at a given time to give the player some story + game technical feedback on the outcome."*

Follow-up decision (chat, same day): keep player auto-success for v1; ship the receipt first; outcome variance deferred to THR-728 (created, blocked by THR-727).

## Alternatives considered

**1. Fix the optimistic toast only (no new surface).** Change dispatch copy and add a completion toast. Cheapest, but a toast cannot carry "story + game technical feedback" — the itemized changes, the reaction choices, the art. Rejected as under-delivering the verbatim ask ("some kind of outcome dialogue").

**2. Route player aftermath through the existing tiered encounter modal.** The agent aftermath modal already renders `aftermathSummary`. Rejected: that modal's model is built from `encounterNotifications` keyed on threaded agents and court positions — the ascendant is not a threaded agent, and bending `collectThreadedAgents` to include the ascendant would leak player actions into every agent-facing filter (tug gating, compulsion suppression, digest tiers). A dedicated modal reading a dedicated queue is smaller and safer than widening the agent pipeline's identity assumptions.

**3. Always-modal (no toast tier).** Every cast interrupts with a dialogue. Rejected: Investiture/observe-grade casts fire frequently; an interrupt per cast would train the player to click through, destroying the signal for the casts that matter. Tiering (steps/rarity/change-kinds/reactions) is the tunable compromise — all four thresholds are named constants, so the feel is a number change.

**4. Immediate resolution for player casts (kill the delay instead of reporting on it).** Making player actions resolve same-tick would let the existing dispatch toast be honest. Rejected: step durations are load-bearing (multi-step templates, encounter seeding, world reaction time), and same-tick resolution is a rules-of-play change — exactly what we deferred in THR-728. The delay is a feature; the missing piece is the arrival.

**5. Outcome variance now (roll the ladder for player casts).** Discussed with Christian; explicitly deferred. Decision record and design questions live in THR-728. The receipt is variance-ready: it renders whatever `outcome`/band the action carries, so THR-728 needs no receipt rework.

## Tensions surfaced

- **Interrupt vs flow.** The game already fights modal fatigue (THR-668 built central auto-pause because modals stack). Resolution is asynchronous, so a modal can appear mid-flow. Mitigations: tiering; one-modal-at-a-time from the queue; THR-668 registry so the sim pauses rather than running behind the dialogue.
- **Double-presentation with Ascendant Beats.** Beats are player-sourced unified actions with their own modal. The beat exclusion in the scan is load-bearing, not defensive polish.
- **Chronicle threshold.** Modal-tier significance 0.85 deliberately clears the 0.8 chronicle threshold so major casts enter the permanent record; toast-tier 0.6 deliberately does not (recentEvents only). This reuses the threshold rather than adding a bespoke chronicle path.
- **Two art maps.** The header wants card art; the art lookup already exists twice (ActionCard, codexRegistry) and drifts. Extraction of `getActionArt` is scoped to ActionCard + the new modal only — fixing codexRegistry's copy here would widen the diff for no player-visible gain.

## Vision premises invoked

- **North-Star / player-loop chain (canon rule 6):** action → visible consequence → next decision. The receipt is the middle link, and reactions make the third link literal.
- **Taste profile — data woven into prose:** the technical footer is a sentence, not key:value chips (standing user directive).
- **Player-as-god framing:** framing lines address the outcome as the world bending under pressure, never quest-log register.

## Scope refusals (recorded so they aren't re-litigated)

- No outcome variance (THR-728).
- No wiring of the orphaned `outcomeBand` ActionCard overlay — band is unknowable at dispatch.
- No codexRegistry art-map consolidation.
- No new graph node types; receipts are transient presentation state.
