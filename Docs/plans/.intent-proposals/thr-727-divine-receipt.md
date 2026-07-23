# Action Proposal — THR-727 Divine Receipt

## intent_quote

> "i would like an expansion of the action card system. please check exactly how it works, and interacts with the rest of the game. look for any issues or missed opportunities or unfinished work,. then look at how to ensure more feedback on the effect of playing a card for the player. I would personally expect some kind of outcome dialogue to show up at a given time to give the player some story + game technical feedback on the outcome."

> "lets follow your recommendation. make sure to create a linear ticket for later design of the outcome variance. go ahead."

(The recommendation the user accepted, from the same chat: keep guaranteed success for now, ship the receipt first, revisit outcome variance once the receipt has been felt in play.)

## scope (what this plan does)

Adds a resolution-time feedback surface for player-sourced unified actions: a `post-resolution` tick phase that scans resolved player actions, builds `PlayerActionReceipt` records from the already-computed `aftermathSummary`, and presents them tiered — band-accented completion toast (click-through) for minor casts, a `DivineReceiptModal` dialogue (card art, band-styled outcome, framing line + enriched overview prose, itemized changes, essence/ticks/target sentence, authored reactions) for multi-step / rare / world-shifting casts. Also fixes the dispatch-time toast that currently claims success optimistically (both dispatch paths switch to initiation phrasing; the non-agent path gains its missing toast). All additive; no resolution-logic changes.

## scope (what this plan does NOT do — explicit non-goals)

- No outcome variance for player casts — auto-success at `unifiedActionResolution.ts:251` is preserved verbatim. That design is THR-728 (created this session, blocked by THR-727, per the user's explicit instruction).
- No wiring of the orphaned `outcomeBand` prop on ActionCard's spent overlay (band is unknowable at dispatch time).
- No changes to agent-side aftermath (THR-530 path untouched).
- No receipt for Ascendant Beat resolutions (they keep `AscendantBeatModal`; scan excludes `template.beat`).
- No codexRegistry art-map consolidation (known drift, separate concern); the plan extracts `getActionArt` for ActionCard + the new modal only.
- No new graph node types; receipts are transient GameState.

## impact_class

Reversible — additive engine phase + UI modal + copy changes; removable by unregistering the phase and dropping optional fields.

## evidence cited

- **Linear issue:** THR-727 (implementation), THR-728 (deferred variance design, blocked-by link set)
- **Vision premises invoked:** player-loop chain (canon rule 6, `Docs/canon/process.md`); North-Star visible-consequence loop; taste-profile data-in-prose directive
- **UL terms touched:** existing terms only (outcome band, aftermath, unified action, essence); no new coinage — "Divine Receipt" is a working feature name, the player-facing surface uses existing band/outcome vocabulary. If the executor surfaces "receipt" as player-facing text, a UL-proposal should accompany it (noted for executor).
- **Canon pages consulted:** `Docs/canon/interface-map.md` (Step 0.7 — touched subsystems UNAUDITED → audit-on-touch rows written in plan), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-06-26-ascendant-beats-divine-cadence.md` (beat modal precedent), THR-530 autonomous aftermath (phase + idempotency-flag pattern), THR-610 technical-effect surfacing, THR-668 interrupt registry
- **Rejected approaches considered and dismissed:** four alternatives with reasons in the brainstorm companion (toast-only fix; reuse of agent tiered modal; always-modal; same-tick player resolution)

## load-bearing decisions touched

- "Ascendants use the same prerequisite system as agents" — respected; no special-casing added to resolution. The existing player auto-success special case is *not expanded*, and its removal is exactly THR-728's question.
- "The world graph is mutated in place — never depend on graph object identity" — receipts live in plain GameState arrays, not graph reads memoized on identity; reaction application reuses the existing `applyAftermathReactionForAgent` which already participates in `touchWorld`/`touchStructure`.
- "Relationships are edges, not property fields" — not applicable; receipts are presentation state, not entity relationships (stated in plan § Graph nodes).
- No node-type invention.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` — 345 importers (additive optional field + event type + optional `band`)
- `src/types/unifiedAction.ts` — 278 importers (additive optional flag, parallel to shipped `autonomousAftermathApplied`)

Blast Radius section present in the plan doc.

## kill criteria

Wrong if playtest shows the modal tier fires so often it becomes click-through noise (watch: acknowledged-without-reading pattern, i.e. sub-second acknowledge times in traces) — remedy is threshold tuning (four named constants) before any structural change. Also wrong if receipts double-present with any modal beyond beats (compulsions, dilemmas) — remedy: extend the exclusion predicate; the scan is a single choke point. If the whole surface proves unwanted, unregister the phase and the game returns to current behavior (fields are optional).

## explicit user sign-off

Not required (Reversible), but present anyway: "lets follow your recommendation. make sure to create a linear ticket for later design of the outcome variance. go ahead." — Christian, 2026-07-23, chat.

## author notes for the judge

- The investigation phase of this session verified every claimed gap in code (file:line cites in the plan's Substrate inventory); the "engine builds it, UI drops it" framing is grep-evidenced, not inferred.
- The tiering thresholds are judgment defaults, deliberately all constants — the plan treats "which casts deserve a dialogue" as a tuning question, not an architecture question.
- One acknowledged uncertainty: `resolveAftermathContextForAgent` with the ascendant as actor is believed to work unchanged (it filters by `actorId`); the plan instructs the executor to verify with a test rather than assume (verify-the-noun).
